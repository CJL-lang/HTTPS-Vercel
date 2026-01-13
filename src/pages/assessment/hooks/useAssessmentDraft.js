/**
 * 测评草稿管理 Hook
 * 负责草稿的保存、加载和删除
 */
import { useState, useEffect } from 'react';

export const useAssessmentDraft = (activePrimary, student, user, recordData, setRecordData, assessmentData) => {
    const [recordId, setRecordId] = useState(null);
    const [initialDataSnapshot, setInitialDataSnapshot] = useState(null);

    const getType = () => {
        const typeMap = { 0: 'physical', 1: 'mental', 2: 'skills' };
        return typeMap[activePrimary];
    };

    const getDraftStorageKey = (userId, studentId, type, assessmentId) => {
        // 新规则：同一学员同一类型，按 assessmentId 隔离草稿，避免切换报告时串数据
        if (assessmentId) return `draft_${userId}_${studentId}_${type}_${assessmentId}`;
        // 兼容旧规则（无 assessmentId 的情况）
        return `draft_${userId}_${studentId}_${type}`;
    };

    // 初始化recordId并加载草稿
    useEffect(() => {
        const type = getType();
        const studentId = student?.id || 'no-student';
        const userId = user?.id || 'guest';

        // 当前要打开的测评ID（后端 assessment_id）
        const currentAssessmentId = assessmentData?.id || assessmentData?.assessment_id || recordData?.assessmentId || '';

        const storageKey = getDraftStorageKey(userId, studentId, type, currentAssessmentId);
        const legacyKey = `draft_${userId}_${studentId}_${type}`;
        
        // 尝试加载现有草稿
        const tryLoadDraft = (raw) => {
            if (!raw) return false;
            try {
                const draft = JSON.parse(raw);

                // 关键：只有当草稿的 assessmentId 与当前打开的一致时才加载，避免串数据
                const draftAssessmentId = draft?.data?.assessmentId || draft?.data?.assessment_id || '';
                if (currentAssessmentId && draftAssessmentId && draftAssessmentId !== currentAssessmentId) {
                    return false;
                }

                setRecordId(draft.id);

                const mergedData = {
                    ...draft.data,
                    assessmentId: currentAssessmentId || draftAssessmentId || ''
                };

                // 标题优先级：若后端/列表传入了明确标题（且不是英文默认），优先用它
                try {
                    const passedTitle = (assessmentData?.title || '').toString().trim();
                    const englishDefaultPattern = /^(physical|mental|skills)\s*assessment\s+on\s+/i;
                    if (passedTitle && !englishDefaultPattern.test(passedTitle)) {
                        mergedData.title = passedTitle;
                    }
                } catch {
                    // ignore
                }

                setRecordData(mergedData);
                setInitialDataSnapshot(JSON.stringify(mergedData));
                return true;
            } catch {
                return false;
            }
        };

        // 1) 优先加载“按 assessmentId 隔离”的草稿
        if (tryLoadDraft(localStorage.getItem(storageKey))) return;

        // 2) 兼容旧 key：只在 assessmentId 匹配（或当前没有 assessmentId）时加载
        if (!currentAssessmentId) {
            if (tryLoadDraft(localStorage.getItem(legacyKey))) return;
        } else {
            const legacyRaw = localStorage.getItem(legacyKey);
            try {
                const legacy = legacyRaw ? JSON.parse(legacyRaw) : null;
                const legacyAssessmentId = legacy?.data?.assessmentId || legacy?.data?.assessment_id || '';
                if (legacyAssessmentId && legacyAssessmentId === currentAssessmentId) {
                    if (tryLoadDraft(legacyRaw)) return;
                }
            } catch {
                // ignore
            }
        }
        
        // 创建新记录ID
        const newId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setRecordId(newId);
        setInitialDataSnapshot(JSON.stringify(recordData));
    }, [activePrimary, student?.id, user?.id, assessmentData?.id, assessmentData?.assessment_id]);

    const saveDraft = (activeSecondary) => {
        if (!recordId) return;
        
        const type = getType();
        const studentId = student?.id || 'no-student';
        const userId = user?.id || 'guest';
        const currentAssessmentId = recordData?.assessmentId || assessmentData?.id || assessmentData?.assessment_id || '';
        const storageKey = getDraftStorageKey(userId, studentId, type, currentAssessmentId);
        const listKey = `drafts_${userId}_${studentId}`;
        
        const draftData = {
            id: recordId,
            type: type,
            status: 'draft',
            currentStep: activeSecondary,
            lastModified: new Date().toISOString(),
            data: recordData
        };
        
        // 保存单个草稿
        localStorage.setItem(storageKey, JSON.stringify(draftData));
        
        // 更新草稿列表
        const draftsList = JSON.parse(localStorage.getItem(listKey) || '[]');
        const existingIndex = draftsList.findIndex(d => d.id === recordId && d.type === type);
        
        const listItem = {
            id: recordId,
            type: type,
            status: 'draft',
            currentStep: activeSecondary,
            lastModified: new Date().toISOString(),
            sortTime: new Date().toISOString(),
            title: recordData?.title || '', // 保存标题
            assessmentId: currentAssessmentId || ''
        };
        
        if (existingIndex >= 0) {
            draftsList[existingIndex] = listItem;
        } else {
            draftsList.push(listItem);
        }
        
        localStorage.setItem(listKey, JSON.stringify(draftsList));
    };

    const updateDraftId = (newId) => {
        if (!newId || !recordId) return;
        
        // 更新本地状态中的 recordId
        setRecordId(newId);
        
        const type = getType();
        const studentId = student?.id || 'no-student';
        const userId = user?.id || 'guest';
        const listKey = `drafts_${userId}_${studentId}`;
        
        // 更新草稿列表中的ID
        const draftsList = JSON.parse(localStorage.getItem(listKey) || '[]');
        const existingIndex = draftsList.findIndex(d => d.id === recordId && d.type === type);
        
        if (existingIndex >= 0) {
            draftsList[existingIndex].id = newId;
            localStorage.setItem(listKey, JSON.stringify(draftsList));
        }

        // 兼容更新：如果存在旧草稿，尽量把 assessmentId 同步为 newId
        const oldAssessmentId = recordData?.assessmentId || assessmentData?.id || assessmentData?.assessment_id || '';
        const oldKey = getDraftStorageKey(userId, studentId, type, oldAssessmentId);
        const savedDraft = localStorage.getItem(oldKey);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                draft.id = newId;
                if (draft?.data) draft.data.assessmentId = newId;
                const newKey = getDraftStorageKey(userId, studentId, type, newId);
                localStorage.setItem(newKey, JSON.stringify(draft));
                if (newKey !== oldKey) localStorage.removeItem(oldKey);
            } catch {}
        }
    };

    const deleteDraft = () => {
        const type = getType();
        const studentId = student?.id || 'no-student';
        const userId = user?.id || 'guest';
        const currentAssessmentId = recordData?.assessmentId || assessmentData?.id || assessmentData?.assessment_id || '';
        const storageKey = getDraftStorageKey(userId, studentId, type, currentAssessmentId);
        const listKey = `drafts_${userId}_${studentId}`;
        
        localStorage.removeItem(storageKey);
        // 同时清理 legacy key（仅在当前没有 assessmentId 或 legacy 指向同一个 assessmentId 时）
        const legacyKey = `draft_${userId}_${studentId}_${type}`;
        try {
            const legacyRaw = localStorage.getItem(legacyKey);
            const legacy = legacyRaw ? JSON.parse(legacyRaw) : null;
            const legacyAssessmentId = legacy?.data?.assessmentId || legacy?.data?.assessment_id || '';
            if (!currentAssessmentId || (legacyAssessmentId && legacyAssessmentId === currentAssessmentId)) {
                localStorage.removeItem(legacyKey);
            }
        } catch {
            // ignore
        }
        
        const draftsList = JSON.parse(localStorage.getItem(listKey) || '[]');
        const updatedDrafts = draftsList.filter(d => !(d.id === recordId && d.type === type));
        localStorage.setItem(listKey, JSON.stringify(updatedDrafts));
    };

    return { recordId, initialDataSnapshot, setInitialDataSnapshot, saveDraft, updateDraftId, deleteDraft };
};
