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

  // 1. Start WS connection first (Prepare the channel)
  // Backend returns: { job_id, ws_endpoint: "/ws/ai-report/:ass_id", status: "processing" }
  // We anticipate the endpoint based on assessmentId.
  const wsEndpoint = wsPath || `/ws/ai-report/${assessmentId}`;

  const jobMeta = {
    ...(assessmentType ? { assessmentType } : {}),
    ...(title ? { title } : {})
  };

  // Start connecting immediately. Note: jobId is not yet available, but usually connecting by assessmentId is sufficient for subscription.
  const wsJob = startAIReportWsJob({
    token,
    assessmentId,
    wsEndpoint,
    jobMeta
    // jobId: undefined (not yet created)
  });

  try {
    console.debug('[requestAIReportGeneration] Waiting for WebSocket connection...');
    await wsJob.connectionPromise;
    console.debug('[requestAIReportGeneration] WebSocket connected. Triggering AI report generation...');
  } catch (wsErr) {
    console.error('[requestAIReportGeneration] WebSocket connection failed, aborting generation request:', wsErr);
    throw wsErr;
  }

  try {
    const language = getBackendLang();
    // 2. Trigger generation via POST
    const res = await createAIReport(assessmentId, { token, language });

    // Optional: Warn if backend returned a different endpoint (usually shouldn't happen for the same assessment)
    if (res?.ws_endpoint && res.ws_endpoint !== wsEndpoint) {
      console.warn('[requestAIReportGeneration] Note: Backend returned a specific WS endpoint different from default:', res.ws_endpoint);
    }

    return { wsJob, res };
  } catch (err) {
    // If POST fails, close the WS connection we just opened since the job failed to start
    wsJob.close();
    throw err;
  }
}
