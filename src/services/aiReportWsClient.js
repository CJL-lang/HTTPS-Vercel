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
  const host = window.location.host;

  // 路径清洗：确保路径是后端要求的 /ws/ai-report/:id
  let cleanPath = wsPath;
  if (typeof cleanPath === 'string' && cleanPath.startsWith('/api')) {
    cleanPath = cleanPath.replace('/api', '');
  }
  // 适配你提到的正确路径格式
  if (typeof cleanPath === 'string') {
    cleanPath = cleanPath.replace('/AIReport', '/ai-report');
  }

  // Force relative path to ensure we use the proxy (strip domain/protocol from backend response)
  if (typeof cleanPath === 'string' && cleanPath.includes('://')) {
    try {
      const urlObj = new URL(cleanPath);
      cleanPath = urlObj.pathname + urlObj.search;
    } catch (e) {
      // ignore parsing error
    }
  }

  // Always build absolute URL pointing to current host (Vite Proxy)
  const base = `${protocol}//${host}${cleanPath}`;

  const search = new URLSearchParams();

  // 注入 ngrok 跳过警告的参数 (Re-added for stability)
  search.set('ngrok-skip-browser-warning', 'true');

  // 注入 token 和其他业务参数
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      search.set(k, String(v));
    }
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
  let resolveConnected;
  let rejectConnected;

  const done = new Promise((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });

  const connectionPromise = new Promise((resolve, reject) => {
    resolveConnected = resolve;
    rejectConnected = reject;
  });

  // Helper to ensure we don't reject/resolve twice if handled elsewhere
  const safeRejectConnected = (err) => {
    if (rejectConnected) {
      rejectConnected(err);
      rejectConnected = null;
      resolveConnected = null;
    }
  };
  const safeResolveConnected = () => {
    if (resolveConnected) {
      resolveConnected();
      resolveConnected = null;
      rejectConnected = null;
    }
  };

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
    safeRejectConnected(new Error('WebSocket connection timeout'));
    try {
      ws.close(1000, 'connect-timeout');
    } catch {
      // ignore
    }
  }, connectTimeoutMs);

  ws.onopen = () => {
    if (connectTimer) clearTimeout(connectTimer);
    connectTimer = null;
    safeResolveConnected();

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
    safeRejectConnected(new Error('WebSocket connection failed'));
  };

  ws.onclose = () => {
    cleanup();
    // In case it closed before opening
    safeRejectConnected(new Error('WebSocket closed before open'));

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
    done,
    connectionPromise
  };
}
