import { createAIReport, getBackendLang } from '../../reports/utils/aiReportApi';
import { startAIReportWsJob } from '../../../services/aiReportWsClient';

function getTokenFromLocalStorage() {
  try {
    const raw = localStorage.getItem('user');
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.token || '';
  } catch {
    return '';
  }
}

export async function requestAIReportGeneration(
  assessmentId,
  { token = getTokenFromLocalStorage(), wsPath, assessmentType, title } = {}
) {
  if (!assessmentId) throw new Error('Missing assessmentId');
  if (!token) throw new Error('Missing token');

  try {
    const language = getBackendLang();
    const res = await createAIReport(assessmentId, { token, language });

    // Backend returns: { job_id, ws_endpoint: "/ws/ai-report/:ass_id", status: "processing" }
    const wsEndpoint = res?.ws_endpoint || wsPath || `/ws/ai-report/${assessmentId}`;
    const jobId = res?.job_id;
    const jobMeta = {
      ...(assessmentType ? { assessmentType } : {}),
      ...(title ? { title } : {})
    };
    const wsJob = startAIReportWsJob({ token, assessmentId, wsEndpoint, jobId, jobMeta });

    return { wsJob, res };
  } catch (err) {
    throw err;
  }
}
