/**
 * Reports API helpers (AIReport).
 *
 * Backend is proxied by Vite:
 * - /api/* -> http://192.168.31.233:8080/*
 */

const getToken = () => {
  try {
    const raw = localStorage.getItem('user');
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.token || '';
  } catch {
    return '';
  }
};

export const getBackendLang = () => {
  const lang = (localStorage.getItem('language') || 'zh').toLowerCase();
  // backend doc uses "cn"
  return lang === 'en' ? 'en' : 'cn';
};

export async function createAIReport(assessmentId, { token = getToken(), language = getBackendLang() } = {}) {
  if (!assessmentId) {
    throw new Error('Missing assessmentId');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  // NOTE:
  // The doc shows a rich payload, but in current integration we only send assessment_id + language.
  // Backend should generate the rest from stored assessment data.
  const body = JSON.stringify({
    assessment_id: assessmentId,
    language
  });

  const res = await fetch('/api/AIReport', {
    method: 'POST',
    headers,
    body
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(text || `Failed to create AI report (${res.status})`);
    err.status = res.status;
    err.body = text;
    throw err;
  }

  return res.json().catch(() => ({}));
}

