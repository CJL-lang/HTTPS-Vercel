function getUiLang() {
  try {
    const v = (localStorage.getItem('language') || 'zh').toLowerCase();
    return v === 'en' ? 'en' : 'zh';
  } catch {
    return 'zh';
  }
}

function getAssessmentLabel(assessmentType, lang) {
  const type = String(assessmentType || '').toLowerCase();
  const isEn = lang === 'en';
  if (type === 'physical') return isEn ? 'Physical' : '体能';
  if (type === 'mental') return isEn ? 'Mental' : '心理';
  if (type === 'skills' || type === 'technique') return isEn ? 'Skills' : '技术';
  return isEn ? 'Assessment' : '测评';
}

function buildSuccessTitle({ assessmentType, title }) {
  const lang = getUiLang();
  const label = getAssessmentLabel(assessmentType, lang);
  const safeTitle = (title || '').toString().trim();
  const base = safeTitle || label;
  const isCompare = String(arguments?.[0]?.payload?.type || '').toLowerCase() === 'completed_compare';

  if (lang === 'en') {
    if (isCompare) {
      const hasReportWord = /\breport\b/i.test(base);
      return hasReportWord ? `${base} comparison generated successfully` : `${base} comparison report generated successfully`;
    }
    const hasReportWord = /\breport\b/i.test(base);
    return hasReportWord ? `${base} generated successfully` : `${base} report generated successfully`;
  }

  if (isCompare) {
    // 需求：{title}对比报告生成完成
    return `${base}对比报告生成完成`;
  }
  const hasReportWord = base.includes('报告');
  return hasReportWord ? `${base}生成成功` : `${base}报告生成成功`;
}

function buildFailureTitle() {
  const lang = getUiLang();
  return lang === 'en' ? 'Report generation failed' : '报告生成失败';
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
  if (status === 'success') {
    // 构建报告详情页路由
    const reportRoutes = {
      'physical': '/physical-report',
      'mental': '/mental-report',
      'skills': '/skills-report',
      'technique': '/skills-report'
    };
    const baseRoute = reportRoutes[String(assessmentType || '').toLowerCase()] || '/physical-report';
    const navigation = assessmentId ? `${baseRoute}/${assessmentId}` : null;

    return {
      kind: 'success',
      title: buildSuccessTitle({ assessmentType, title, payload }),
      description: '',
      durationMs: 5000,
      navigation
    };
  }

  // 对客户展示：失败/超时等只提示失败，不暴露错误细节
  if (status === 'timeout' || status === 'failure') {
    return {
      kind: 'error',
      title: buildFailureTitle(),
      description: '',
      durationMs: 7000
    };
  }

  return null;
}
