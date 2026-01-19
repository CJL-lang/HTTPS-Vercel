export function normalizeUiLanguage(value, fallback = 'zh') {
  const raw = (value ?? '').toString().trim().toLowerCase();

  if (!raw) return fallback;

  // English variants
  if (raw === 'en' || raw.startsWith('en-') || raw.startsWith('en_')) return 'en';

  // Chinese variants / legacy values
  if (raw === 'zh' || raw.startsWith('zh-') || raw.startsWith('zh_')) return 'zh';
  if (raw === 'cn' || raw === 'zn') return 'zh';

  return fallback;
}

export function getUiLanguage(fallback = 'zh') {
  try {
    return normalizeUiLanguage(localStorage.getItem('language'), fallback);
  } catch {
    return normalizeUiLanguage(fallback, fallback);
  }
}

export function setUiLanguage(value) {
  try {
    localStorage.setItem('language', normalizeUiLanguage(value));
  } catch {
    // ignore storage errors
  }
}

export function toBackendLanguage(uiLanguage) {
  return normalizeUiLanguage(uiLanguage) === 'en' ? 'en' : 'cn';
}

export function getBackendLanguage(fallbackUiLanguage = 'zh') {
  return toBackendLanguage(getUiLanguage(fallbackUiLanguage));
}

export function pickLocalizedContent(data, uiLanguage = getUiLanguage('zh')) {
  const isEnglish = normalizeUiLanguage(uiLanguage, 'zh') === 'en';
  const primary = isEnglish ? data?.content_en : data?.content;
  const fallback = isEnglish ? data?.content : data?.content_en;

  if (Array.isArray(primary)) return primary;
  if (Array.isArray(fallback)) return fallback;
  return [];
}
