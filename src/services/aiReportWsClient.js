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
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  // 处理 Vercel 预览环境的域名格式（去除 https- 前缀）
  let host = window.location.host;
  if (host.startsWith('https-')) {
    host = host.replace(/^https-/, '');
  }
  
  // wsPath can be:
  // - absolute: ws://... or wss://...
  // - absolute http(s) url (rare, but accept)
  // - relative path starting with '/'
  let base;
  if (typeof wsPath === 'string' && (wsPath.startsWith('ws://') || wsPath.startsWith('wss://'))) {
    // 已经是完整的 WebSocket URL，直接使用
    base = wsPath;
  } else if (typeof wsPath === 'string' && (wsPath.startsWith('http://') || wsPath.startsWith('https://'))) {
    // HTTP/HTTPS URL，转换为 WebSocket
    base = wsPath.replace(/^http(s?):/i, protocol);
  } else {
    // 相对路径：需要直接连接到后端，不能通过 Vercel rewrites
    // 优先使用环境变量配置的后端地址
    const backendWsUrl = import.meta.env.VITE_WS_BASE_URL;
    if (backendWsUrl) {
      const cleanBase = backendWsUrl.endsWith('/') ? backendWsUrl.slice(0, -1) : backendWsUrl;
      // 确保使用正确的协议
      const wsBase = backendWsUrl.startsWith('ws://') || backendWsUrl.startsWith('wss://') 
        ? cleanBase 
        : `${protocol}//${cleanBase.replace(/^https?:\/\//, '')}`;
      base = `${wsBase}${wsPath}`;
    } else {
      // 如果没有配置环境变量，尝试使用当前域名（但 Vercel 不支持 WebSocket rewrites）
      // 这种情况下会失败，建议配置 VITE_WS_BASE_URL
      base = `${protocol}//${host}${wsPath}`;
    }
  }

  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    search.set(k, String(v));
  });

  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
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
