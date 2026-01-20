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

export async function createAIReport(
  assessmentId,
  {
    token = getToken(),
    language = getBackendLang(),
    // Optional coach custom input (new backend supports these).
    reportIntro,
    fitnessDiagnosis,
    trainingPlan,
    goal,
    // Also accept backend-doc snake_case in case callers already use it.
    report_intro,
    fitness_diagnosis,
    training_plan,
    assessment_id
  } = {}
) {
  if (!assessmentId) {
    throw new Error('Missing assessmentId');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const resolvedAssessmentId = assessment_id || assessmentId;
  const resolvedReportIntro = reportIntro ?? report_intro;
  const resolvedFitnessDiagnosis = fitnessDiagnosis ?? fitness_diagnosis;
  const resolvedTrainingPlan = trainingPlan ?? training_plan;

  // Compatibility: send both snake_case and camelCase keys.
  // Backend will pick whichever matches its struct json tags.
  const payload = {
    assessment_id: resolvedAssessmentId,
    assessmentId: resolvedAssessmentId,
    language
  };

  if (resolvedReportIntro) {
    payload.report_intro = resolvedReportIntro;
    payload.reportIntro = resolvedReportIntro;
  }
  if (resolvedFitnessDiagnosis) {
    payload.fitness_diagnosis = resolvedFitnessDiagnosis;
    payload.fitnessDiagnosis = resolvedFitnessDiagnosis;
  }
  if (resolvedTrainingPlan) {
    payload.training_plan = resolvedTrainingPlan;
    payload.trainingPlan = resolvedTrainingPlan;
  }
  if (goal != null) {
    payload.goal = goal;
  }

  const body = JSON.stringify(payload);

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

