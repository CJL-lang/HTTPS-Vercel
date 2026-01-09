// 以 assessmentId 为维度记录“上次停留步骤”，避免不同报告互相覆盖
// step: 0=data, 1=diagnosis, 2=plan, 3=goal

const getKey = (userId, assessmentId) => {
    const uid = userId || 'guest';
    return `assessmentStep_${uid}_${assessmentId}`;
};

export const saveAssessmentStep = ({ userId, assessmentId, step }) => {
    if (!assessmentId && assessmentId !== 0) return;
    const n = Number(step);
    if (!Number.isInteger(n) || n < 0 || n > 3) return;

    try {
        localStorage.setItem(getKey(userId, assessmentId), String(n));
    } catch {
        // ignore
    }
};

export const loadAssessmentStep = ({ userId, assessmentId }) => {
    if (!assessmentId && assessmentId !== 0) return null;

    try {
        const raw = localStorage.getItem(getKey(userId, assessmentId));
        if (raw == null) return null;
        const n = Number(raw);
        if (!Number.isInteger(n) || n < 0 || n > 3) return null;
        return n;
    } catch {
        return null;
    }
};

export const clearAssessmentStep = ({ userId, assessmentId }) => {
    if (!assessmentId && assessmentId !== 0) return;

    try {
        localStorage.removeItem(getKey(userId, assessmentId));
    } catch {
        // ignore
    }
};
