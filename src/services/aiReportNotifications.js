function getAssessmentLabel(assessmentType) {
  const type = String(assessmentType || '').toLowerCase();
  if (type === 'physical') return '身体素质测评';
  if (type === 'mental') return '心理测评';
  if (type === 'skills' || type === 'technique') return '技能测评';
  return '测评';
}

function getVariantLabel(payload) {
  const backendType = String(payload?.type || '').toLowerCase();
  if (backendType === 'completed_compare') return '对比版';
  return '';
}

function buildTitle({ status, assessmentType, title, payload }) {
  const label = getAssessmentLabel(assessmentType);
  const safeTitle = (title || '').toString().trim();
  const variant = getVariantLabel(payload);

  const namePart = safeTitle ? `「${safeTitle}」` : '';
  const variantPart = variant ? `（${variant}）` : '';

  if (status === 'success') return `${label}报告${namePart}${variantPart}生成完毕`;
  if (status === 'timeout') return `${label}报告${namePart}${variantPart}生成超时`;
  return `${label}报告${namePart}${variantPart}生成失败`;
}

function sanitizeToastDescription(input) {
  const raw = (input ?? '').toString();
  if (!raw) return '';

  // If backend accidentally returns an HTML error page, don't show it in toast
  const lower = raw.toLowerCase();
  if (lower.includes('<html') || lower.includes('<!doctype') || lower.includes('<body') || lower.includes('</html>')) {
    return '';
  }

  // Remove HTML tags if any
  const noTags = raw.replace(/<[^>]*>/g, '').trim();

  // Common noisy patterns
  const collapsed = noTags.replace(/\s+/g, ' ').trim();
  const tooLong = collapsed.length > 120;

  if (!collapsed) return '';

  // If it looks like an HTTP error page/text, hide it
  if (/\b(404|500|502|503|504)\b/.test(collapsed) && (collapsed.includes('DOCTYPE') || collapsed.includes('nginx') || collapsed.includes('Not Found'))) {
    return '';
  }

  return tooLong ? `${collapsed.slice(0, 117)}...` : collapsed;
}

export function buildAIReportToast({ status, assessmentId, assessmentType, title, message, payload }) {
  const safeMsg = sanitizeToastDescription(message);
  const safePayloadErr = sanitizeToastDescription(payload?.error);

  if (status === 'success') {
    return {
      kind: 'success',
      title: buildTitle({ status, assessmentType, title, payload }),
      description:
        safeMsg ||
        (assessmentId ? `测评ID：${assessmentId}` : ''),
      durationMs: 5000
    };
  }

  if (status === 'timeout') {
    return {
      kind: 'error',
      title: buildTitle({ status, assessmentType, title, payload }),
      description: safeMsg || (assessmentId ? `测评ID：${assessmentId}` : ''),
      durationMs: 7000
    };
  }

  if (status === 'failure') {
    return {
      kind: 'error',
      title: buildTitle({ status, assessmentType, title, payload }),
      description: safeMsg || safePayloadErr || (assessmentId ? `测评ID：${assessmentId}` : ''),
      durationMs: 7000
    };
  }

  return null;
}
