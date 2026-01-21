import { parseAIReportWsMessage } from './aiReportWsProtocol';

const listeners = new Set();
let activeSocket = null;
const jobMetaByAssessmentId = new Map();

function getPersistedJobMeta(assessmentId) {
  if (!assessmentId) return null;
  const key = String(assessmentId);
  const inMemory = jobMetaByAssessmentId.get(key);
  if (inMemory) {
    if (typeof inMemory.expiresAt === 'number' && Date.now() > inMemory.expiresAt) {
      clearJobMeta(assessmentId);
      return null;
    }
    return inMemory;
  }

  try {
    const raw = sessionStorage.getItem(`aiReportJobMeta:${assessmentId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.expiresAt === 'number' && Date.now() > parsed.expiresAt) {
        clearJobMeta(assessmentId);
        return null;
      }
      jobMetaByAssessmentId.set(key, parsed);
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function persistJobMeta(assessmentId, meta) {
  if (!assessmentId) return;
  const key = String(assessmentId);
  if (!meta || typeof meta !== 'object') return;

  jobMetaByAssessmentId.set(key, meta);
  try {
    sessionStorage.setItem(`aiReportJobMeta:${assessmentId}`, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

function clearJobMeta(assessmentId) {
  if (!assessmentId) return;
  const key = String(assessmentId);
  jobMetaByAssessmentId.delete(key);
  try {
    sessionStorage.removeItem(`aiReportJobMeta:${assessmentId}`);
  } catch {
    // ignore
  }
}

function markAiReportReady(assessmentId) {
  if (!assessmentId) return;
  try {
    sessionStorage.setItem(`aiReportReady:${assessmentId}`, String(Date.now()));
  } catch {
    // ignore
  }
}

export function hasAIReportReadyHint(assessmentId) {
  if (!assessmentId) return false;
  try {
    return Boolean(sessionStorage.getItem(`aiReportReady:${assessmentId}`));
  } catch {
    return false;
  }
}

export function isAIReportGenerating(assessmentId) {
  return Boolean(getPersistedJobMeta(assessmentId));
}

export function clearAIReportGenerating(assessmentId, _reason = 'reconciled') {
  clearJobMeta(assessmentId);
}

function emit(event) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // ignore listener errors
    }
  });
}

function buildWsUrl({ wsPath, params }) {
  // const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // const host = window.location.host;
  // // wsPath can be:
  // // - absolute: ws://... or wss://...
  // // - absolute http(s) url (rare, but accept)
  // // - relative path starting with '/'
  // const base =
  //   typeof wsPath === 'string' && (wsPath.startsWith('ws://') || wsPath.startsWith('wss://'))
  //     ? wsPath
  //     : typeof wsPath === 'string' && (wsPath.startsWith('http://') || wsPath.startsWith('https://'))
  //       ? wsPath.replace(/^http(s?):/i, protocol)
  //       : `${protocol}//${host}${wsPath}`;

  // const search = new URLSearchParams();
  // Object.entries(params || {}).forEach(([k, v]) => {
  //   if (v === undefined || v === null || v === '') return;
  //   search.set(k, String(v));
  // });

  // const qs = search.toString();
  // return qs ? `${base}?${qs}` : base;
    // 1. 强制使用 wss 和 ngrok 的公网域名
  // 这样即便在 Vercel 运行，它也不会走 Vercel 的代理，而是直连 ngrok
  const protocol = 'wss:';
  const host = 'unwisely-unaudited-lovetta.ngrok-free.dev';

  // 2. 路径清洗：确保路径是后端要求的 /ws/ai-report/:id
  let cleanPath = wsPath;
  if (typeof cleanPath === 'string' && cleanPath.startsWith('/api')) {
    cleanPath = cleanPath.replace('/api', '');
  }
  // 适配你提到的正确路径格式
  if (typeof cleanPath === 'string') {
    cleanPath = cleanPath.replace('/AIReport', '/ai-report');
  }

  const base = `${protocol}//${host}${cleanPath}`;

  const search = new URLSearchParams();
  
  // 3. 注入 ngrok 跳过警告的参数
  // 这是解决 Vercel 拦截的关键，因为它能让握手请求直接通过 ngrok 的验证
  search.set('ngrok-skip-browser-warning', 'true');

  // 4. 注入 token 和其他业务参数
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      search.set(k, String(v));
    }
  });

  const qs = search.toString();
  return `${base}?${qs}`;
}

export function onAIReportWsEvent(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function stopAIReportWs(reason = 'replaced') {
  if (!activeSocket) return;
  try {
    activeSocket.close(1000, reason);
  } catch {
    // ignore
  }
  activeSocket = null;
}

export function startAIReportWsJob({
  token,
  assessmentId,
  wsEndpoint,
  wsPath = '/api/ws/AIReport',
  jobId,
  jobMeta,
  connectTimeoutMs = 10000,
  jobTimeoutMs = 3 * 60 * 1000
} = {}) {
  stopAIReportWs('restart');

  if (assessmentId) {
    const startedAt = Date.now();
    const metaToPersist = {
      ...(jobMeta && typeof jobMeta === 'object' ? jobMeta : {}),
      startedAt,
      expiresAt: startedAt + jobTimeoutMs
    };
    persistJobMeta(assessmentId, metaToPersist);
  }

  // Prefer backend-provided endpoint: /ws/ai-report/:ass_id
  const resolvedPath = wsEndpoint || wsPath;

  const url = buildWsUrl({
    wsPath: resolvedPath,
    params: {
      token,
      job_id: jobId
    }
  });

  const ws = new WebSocket(url);
  activeSocket = ws;

  const meta = getPersistedJobMeta(assessmentId);
  emit({ type: 'open-start', url, assessmentId, ...(meta || {}) });

  let connectTimer = null;
  let jobTimer = null;

  let resolveDone;
  let rejectDone;

  const done = new Promise((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  const cleanup = () => {
    if (connectTimer) clearTimeout(connectTimer);
    if (jobTimer) clearTimeout(jobTimer);
    connectTimer = null;
    jobTimer = null;
    if (activeSocket === ws) activeSocket = null;
  };

  connectTimer = setTimeout(() => {
    const meta = getPersistedJobMeta(assessmentId);
    emit({ type: 'error', status: 'failure', terminal: true, message: 'WebSocket 连接超时', assessmentId, ...(meta || {}) });
    try {
      ws.close(1000, 'connect-timeout');
    } catch {
      // ignore
    }
  }, connectTimeoutMs);

  ws.onopen = () => {
    if (connectTimer) clearTimeout(connectTimer);
    connectTimer = null;

    const meta = getPersistedJobMeta(assessmentId);
    emit({ type: 'open', assessmentId, ...(meta || {}) });

    jobTimer = setTimeout(() => {
      const meta = getPersistedJobMeta(assessmentId);
      emit({ type: 'message', status: 'timeout', terminal: true, message: 'AI报告生成超时', assessmentId, payload: {}, ...(meta || {}) });
      try {
        ws.close(1000, 'job-timeout');
      } catch {
        // ignore
      }
    }, jobTimeoutMs);
  };

  ws.onmessage = (event) => {
    const parsed = parseAIReportWsMessage(event.data);

    const meta = getPersistedJobMeta(assessmentId);

    const emitted = {
      type: 'message',
      assessmentId,
      ...(meta || {}),
      ...parsed
    };

    emit(emitted);

    if (parsed.terminal) {
      try {
        ws.close(1000, 'terminal');
      } catch {
        // ignore
      }

      if (parsed.status === 'success') {
        markAiReportReady(assessmentId);
      }

      clearJobMeta(assessmentId);

      if (parsed.status === 'success') resolveDone(emitted);
      else rejectDone(emitted);
    }
  };

  ws.onerror = () => {
    const meta = getPersistedJobMeta(assessmentId);
    emit({ type: 'error', status: 'failure', terminal: true, message: 'WebSocket 连接失败', assessmentId, ...(meta || {}) });
  };

  ws.onclose = () => {
    cleanup();
    const meta = getPersistedJobMeta(assessmentId);
    emit({ type: 'close', assessmentId, ...(meta || {}) });
  };

  return {
    url,
    close: () => {
      try {
        ws.close(1000, 'client-close');
      } catch {
        // ignore
      }
    },
    done
  };
}
