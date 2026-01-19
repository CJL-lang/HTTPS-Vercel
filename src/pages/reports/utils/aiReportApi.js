/**
 * Reports API helpers (AIReport).
 *
 * Backend is proxied:
 * - dev: Vite proxy (/api/*)
 * - prod: hosting rewrites (e.g. Vercel)
 */

import { getBackendLanguage } from '../../../utils/language';

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
  // backend doc uses "cn" / "en"
  return getBackendLanguage('zh');
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

