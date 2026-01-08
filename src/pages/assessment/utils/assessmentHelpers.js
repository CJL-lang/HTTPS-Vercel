/**
 * 测评辅助函数
 */

export const hasAnyValue = (v) => {
    if (v == null) return false;
    if (typeof v === 'string') return v.trim().length > 0;
    if (typeof v === 'number') return Number.isFinite(v) && v !== 0;
    if (Array.isArray(v)) return v.some(hasAnyValue);
    if (typeof v === 'object') return Object.values(v).some(hasAnyValue);
    return false;
};

export const checkHasAnyData = (activePrimary, recordData) => {
    if (activePrimary === 0) {
        return hasAnyValue(recordData.stykuData) || 
               hasAnyValue(recordData.physicalDiagnosis) || 
               hasAnyValue(recordData.physicalPlan) || 
               hasAnyValue(recordData.physicalGoals);
    } else if (activePrimary === 1) {
        return hasAnyValue(recordData.mentalData) || 
               hasAnyValue(recordData.mentalDiagnosis) || 
               hasAnyValue(recordData.mentalPlan) || 
               hasAnyValue(recordData.mentalGoals);
    } else if (activePrimary === 2) {
        return hasAnyValue(recordData.trackmanData) || 
               hasAnyValue(recordData.diagnosisData) || 
               hasAnyValue(recordData.planData) || 
               hasAnyValue(recordData.skillsGoals);
    }
    return false;
};

export const persistModuleToStudent = (primaryId, recordData, data, setData) => {
    if (!setData || !data) return;

    const patch = {};
    if (primaryId === 0) {
        if (hasAnyValue(recordData.stykuData)) patch.stykuData = recordData.stykuData;
        if (hasAnyValue(recordData.physicalDiagnosis)) patch.physicalDiagnosis = recordData.physicalDiagnosis;
        if (hasAnyValue(recordData.physicalPlan)) patch.physicalPlan = recordData.physicalPlan;
        if (hasAnyValue(recordData.physicalGoals)) patch.physicalGoals = recordData.physicalGoals;
    } else if (primaryId === 1) {
        if (hasAnyValue(recordData.mentalData)) patch.mentalData = recordData.mentalData;
        if (hasAnyValue(recordData.mentalDiagnosis)) patch.mentalDiagnosis = recordData.mentalDiagnosis;
        if (hasAnyValue(recordData.mentalPlan)) patch.mentalPlan = recordData.mentalPlan;
        if (hasAnyValue(recordData.mentalGoals)) patch.mentalGoals = recordData.mentalGoals;
    } else if (primaryId === 2) {
        if (hasAnyValue(recordData.trackmanData)) patch.trackmanData = recordData.trackmanData;
        if (hasAnyValue(recordData.diagnosisData)) patch.diagnosisData = recordData.diagnosisData;
        if (hasAnyValue(recordData.planData)) patch.planData = recordData.planData;
        if (hasAnyValue(recordData.skillsGoals)) patch.skillsGoals = recordData.skillsGoals;
    }

    if (Object.keys(patch).length > 0) {
        setData({ ...data, ...patch });
    }
};
