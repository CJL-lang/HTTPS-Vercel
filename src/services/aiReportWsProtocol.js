export function parseAIReportWsMessage(rawData) {
  let data = rawData;
  if (typeof rawData === 'string') {
    try {
      data = JSON.parse(rawData);
    } catch {
      data = { message: rawData };
    }
  }

  const normalized = typeof data === 'object' && data ? data : { message: String(rawData ?? '') };

  // Backend (Go) sends: { type: 'completed' | 'completed_compare' | 'error', ... }
  const backendType = String(normalized.type || '').toLowerCase();
  if (backendType) {
    const isCompleted = backendType === 'completed' || backendType === 'completed_compare';
    const isError = backendType === 'error';

    const message =
      normalized.message ||
      normalized.error ||
      normalized.msg ||
      normalized.reason ||
      normalized.detail ||
      '';

    if (isCompleted) {
      return {
        terminal: true,
        status: backendType === 'completed_compare' ? 'success' : 'success',
        message: message ? String(message) : '',
        payload: normalized
      };
    }

    if (isError) {
      return {
        terminal: true,
        status: 'failure',
        message: message ? String(message) : 'AI报告生成失败',
        payload: normalized
      };
    }

    // unknown type: treat as progress
    return {
      terminal: false,
      status: 'progress',
      message: message ? String(message) : '',
      payload: normalized
    };
  }

  const statusCandidate = (
    normalized.status ||
    normalized.state ||
    normalized.result ||
    normalized.type ||
    normalized.event
  );

  const statusText = String(statusCandidate || '').toLowerCase();

  const isSuccess =
    statusText.includes('success') ||
    statusText.includes('done') ||
    statusText.includes('finished') ||
    statusText.includes('complete') ||
    statusText.includes('ok') ||
    statusText === '1' ||
    normalized.code === 0 ||
    normalized.success === true;

  const isTimeout = statusText.includes('timeout') || normalized.code === 'TIMEOUT';

  const isFailure =
    statusText.includes('fail') ||
    statusText.includes('error') ||
    statusText.includes('failed') ||
    statusText.includes('exception') ||
    normalized.code === 1 ||
    normalized.success === false;

  const terminal = isSuccess || isTimeout || isFailure;

  const status = isSuccess ? 'success' : isTimeout ? 'timeout' : isFailure ? 'failure' : 'progress';

  const message =
    normalized.message ||
    normalized.error ||
    normalized.msg ||
    normalized.reason ||
    normalized.detail ||
    (typeof rawData === 'string' ? rawData : '');

  return {
    terminal,
    status,
    message: message ? String(message) : '',
    payload: normalized
  };
}
