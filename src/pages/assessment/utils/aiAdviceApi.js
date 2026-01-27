import { getBackendLanguage } from '../../../utils/language';

function getTokenFromLocalStorage() {
  try {
    const raw = localStorage.getItem('user');
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.token || '';
  } catch {
    return '';
  }
}

export async function requestAIAdvice(
  { dimension, category, level, scores, language },
  { token = getTokenFromLocalStorage() } = {}
) {
  if (!dimension) throw new Error('Missing dimension');
  if (!category) throw new Error('Missing category');

  const headers = {
    'Content-Type': 'application/json',
    // ngrok free domain warning bypass (harmless elsewhere)
    'ngrok-skip-browser-warning': 'true'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const payload = {
    dimension,
    category,
    level: level ?? '',
    scores: scores ?? {},
    language: language ?? getBackendLanguage('zh')
  };

  const res = await fetch('/api/AIAdvice', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`AIAdvice failed: ${res.status} ${txt}`);
  }

  const data = await res.json().catch(() => ({}));
  return {
    diag: data?.diag ?? '',
    advice: data?.advice ?? ''
  };
}
