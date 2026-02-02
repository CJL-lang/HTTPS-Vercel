/**
 * 测评保存逻辑 Hook
 * 负责处理测评数据的保存、提交等业务逻辑
 */
import {
    saveDiagnosisToBackend,
    savePlanToBackend,
    saveGoalToBackend,
    saveStykuDataToBackend,
    saveMentalDataToBackend,
    saveTrackmanDataToBackend,
    createAssessment,
    updateDiagnosisToBackend,
    updatePlanToBackend,
    updateGoalToBackend,
    updateStykuDataToBackend,
    updateMentalDataToBackend,
    updateTrackmanDataToBackend,
    updateAssessment
} from '../utils/assessmentApi';
import { requestAIReportGeneration } from '../utils/aiReportGeneration';
import { persistModuleToStudent } from '../utils/assessmentHelpers';
import { TYPE_MAP } from '../utils/assessmentConstants';
import { useLanguage } from '../../../utils/LanguageContext';
import { clearAssessmentStep } from '../utils/assessmentProgress';

export const useAssessmentSave = ({
    recordData,
    setRecordData,
    activePrimary,
    activeSecondary,
    student,
    user,
    data,
    setData,
    saveDraft,
    updateDraftId,
    deleteDraft,
    setHasUnsavedChanges,
    setInitialDataSnapshot,
    setShowCompleteActions,
    getShowCompleteActionsKey,
    isSingleMode,
    navigateToPrimary,
    t,
    hasBackendData,
    setHasBackendData
}) => {
    const { language: currentLang } = useLanguage();

    // 助手函数：将前端语言代码映射为后端要求的代码
    const getBackendLang = () => {
        if (currentLang === 'en') return 'en';
        return 'cn'; // 默认或中文返回 cn
    };

    const backendLang = getBackendLang();

    const ensureDefaultTitlePatchedIfNeeded = async () => {
        const assessmentId = recordData?.assessmentId;
        if (!assessmentId || !user?.token) return;

        const defaultTitles = {
            0: t('physicalAssessment'),
            1: t('mentalAssessment'),
            2: t('skillsAssessment')
        };
        const desiredTitle = defaultTitles[activePrimary] || t('autoAssessment') || '';

        const currentTitle = (recordData?.title || '').toString().trim();
        const englishDefaultPattern = /^(physical|mental|skills)\s*assessment\s+on\s+/i;
        const shouldPatch =
            !currentTitle ||
            currentTitle === desiredTitle ||
            englishDefaultPattern.test(currentTitle);

        if (!shouldPatch || !desiredTitle) return;

        try {
            await updateAssessment(assessmentId, { title: desiredTitle }, user);
        } catch (e) {
            // ignore
        }
    };

    const patchCurrentTitleIfNeeded = async () => {
        const assessmentId = recordData?.assessmentId;
        if (!assessmentId || !user?.token) return;

        const currentTitle = (recordData?.title || '').toString().trim();
        if (!currentTitle) return;

        try {
            await updateAssessment(assessmentId, { title: currentTitle }, user);
        } catch (e) {
            // ignore
        }
    };

    const handleSave = async (navigateToSecondary) => {
        // DEBUG: 打印 recordData / 快照以便验证默认值是否进入数据模型
        try {
            console.debug('[DEBUG useAssessmentSave] recordData before save:', JSON.parse(JSON.stringify(recordData)));
        } catch (e) {
            console.debug('[DEBUG useAssessmentSave] recordData (raw):', recordData);
        }

        // SAVE-TIME Fallback: 确保 title 一定存在（最后一道防线，避免 useEffect 竞态）
        try {
            const defaultTitles = {
                0: t('physicalAssessment'),
                1: t('mentalAssessment'),
                2: t('skillsAssessment')
            };
            if (!recordData.title || !recordData.title.toString().trim()) {
                const fallback = defaultTitles[activePrimary] || t('autoAssessment') || '';
                console.info('[useAssessmentSave] title empty, applying fallback:', fallback);
                setRecordData(prev => ({ ...prev, title: fallback }));
            }
        } catch (e) {
            // ignore
        }

        // 保存草稿
        saveDraft(activeSecondary);

        // 重置变化标记
        setHasUnsavedChanges(false);
        setInitialDataSnapshot(JSON.stringify(recordData));

        const type = TYPE_MAP[activePrimary];

        // 诊断步骤：保存诊断到后端
        if (activeSecondary === 1) {
            let diagnosisContent = null;
            if (activePrimary === 0) {
                diagnosisContent = recordData.physicalDiagnosis;
            } else if (activePrimary === 1) {
                // 心理诊断：需要将分数从 mentalData 映射到 grade 字段
                const mentalDiagnosisItems = recordData.mentalDiagnosis || [];
                const mentalData = recordData.mentalData || {};

                // 标题到分数的映射
                const titleToScoreMap = {
                    "专注能力": mentalData.focus,
                    "心理韧性": mentalData.stability,
                    "自信与动机": mentalData.confidence
                };

                diagnosisContent = mentalDiagnosisItems.map(item => ({
                    ...item,
                    grade: titleToScoreMap[item.title] || item.grade || 'L1'
                }));
            } else if (activePrimary === 2) {
                // 技能测评：将 diagnosisData 对象提取为后端要求的数组格式
                const rawData = recordData.diagnosisData || recordData.skillsDiagnosis || {};
                const potentialKeys = [
                    'stance', 'grip', 'coordination',
                    'backswing', 'downswing', 'tempo',
                    'stability', 'direction', 'power',
                    'shortGame', 'greenside',
                    'handCoordination', 'bodyUsage',
                    // 添加球杆类型字段
                    'clubDriver', 'clubMainIron', 'clubIrons', 'clubWood',
                    'clubPutting', 'clubScrambling', 'clubFinesseWedges'
                ];

                diagnosisContent = potentialKeys.map(key => {
                    const content = rawData[key] || '';
                    const grade = rawData[`${key}_level`] || '';
                    // 只要内容不为空，或者等级不是初始值（如果有选择等级）
                    if (content.trim() !== '' || (grade !== '' && grade !== 'L1-L4')) {
                        return {
                            title: t(key) || key,
                            grade: grade || 'L1',
                            content: content
                        };
                    }
                    return null;
                }).filter(item => item !== null);

                // 加上自定义项 (SkillsDiagnosis 中的 customItems 现在同步到了 skillsDiagnosis 数组)
                if (recordData.skillsDiagnosis && Array.isArray(recordData.skillsDiagnosis)) {
                    recordData.skillsDiagnosis.forEach(item => {
                        // 只要有 title 就添加（过滤空 title 会在 API 层面处理）
                        if (item.title && item.title.trim() !== '') {
                            diagnosisContent.push({
                                title: item.title,  // 使用 item.title 而不是 item.club
                                grade: item.level || item.grade || 'L1',
                                content: item.content || ''
                            });
                        }
                    });
                }
            }

            if (diagnosisContent != null && (Array.isArray(diagnosisContent) ? diagnosisContent.length > 0 : true)) {
                let success = false;
                let newId = recordData.assessmentId;

                if (hasBackendData.diagnosis) {
                    // 如果后端已有数据，使用 PATCH
                    console.log('[useAssessmentSave] Updating existing diagnosis via PATCH');
                    success = await updateDiagnosisToBackend(recordData.assessmentId, diagnosisContent, user, backendLang);
                    if (success) {
                        setHasBackendData(prev => ({ ...prev, diagnosis: true }));
                    }
                } else {
                    // 否则使用 POST
                    console.log('[useAssessmentSave] Creating new diagnosis via POST');
                    const resId = await saveDiagnosisToBackend(type, diagnosisContent, recordData.assessmentId, user, student?.id, backendLang);
                    if (resId) {
                        success = true;
                        newId = resId;
                        setHasBackendData(prev => ({ ...prev, diagnosis: true }));
                    }
                }

                if (success && newId && newId !== recordData.assessmentId) {
                    setRecordData(prev => ({ ...prev, assessmentId: newId }));
                }
            }
        }

        // 训练方案步骤：保存方案到后端
        if (activeSecondary === 2) {
            let skillsPlanData = recordData.skillsPlan;

            // 兼容旧的 planData 结构（仅在新结构不存在时使用）
            if (activePrimary === 2 && recordData.planData && (!skillsPlanData || skillsPlanData.length === 0)) {
                const p = recordData.planData;
                skillsPlanData = [];
                if (p.point1) skillsPlanData.push({ title: '训练要点1', content: p.point1 });
                if (p.point2) skillsPlanData.push({ title: '训练要点2', content: p.point2 });
                if (p.extra) skillsPlanData.push({ title: '额外说明', content: p.extra });
            }

            // 获取当前类型的计划数据
            let currentPlanData = null;
            if (activePrimary === 0) currentPlanData = recordData.physicalPlan;
            else if (activePrimary === 1) currentPlanData = recordData.mentalPlan;
            else if (activePrimary === 2) currentPlanData = skillsPlanData;

            let currentAssessmentId = recordData.assessmentId;

            if (currentPlanData && Array.isArray(currentPlanData) && currentPlanData.length > 0) {
                const cleanContent = currentPlanData.map(({ title, content }) => ({ title, content }));

                if (hasBackendData.plan) {
                    console.log('[useAssessmentSave] Updating existing plans via PATCH');
                    const ok = await updatePlanToBackend(currentAssessmentId, cleanContent, user, backendLang);
                    if (ok) {
                        setHasBackendData(prev => ({ ...prev, plan: true }));
                    }
                } else {
                    console.log('[useAssessmentSave] Creating new plans via POST');
                    const newId = await savePlanToBackend(
                        type,
                        cleanContent,
                        currentAssessmentId,
                        user,
                        student?.id,
                        recordData.title || t('autoAssessment'),
                        backendLang
                    );
                    if (newId) {
                        currentAssessmentId = newId;
                        setHasBackendData(prev => ({ ...prev, plan: true }));
                        if (currentAssessmentId !== recordData.assessmentId) {
                            setRecordData(prev => ({ ...prev, assessmentId: currentAssessmentId }));
                        }
                    }
                }
            }
        }

        // 数据采集步骤：保存数据到后端
        if (activeSecondary === 0) {
            const finalId = recordData.assessmentId;

            if (finalId) {
                // 如果是身体素质测评，额外保存一份到专门的 styku 接口
                if (activePrimary === 0) {
                    const stykuDataPayload = {
                        ...recordData.stykuData
                    };
                    // 只在有备注时添加 notes 字段
                    if (recordData.stykuData?.notes) {
                        stykuDataPayload.notes = recordData.stykuData.notes;
                    }

                    if (hasBackendData.assessment_data) {
                        console.log('[useAssessmentSave] Updating existing styku via PATCH');
                        const ok = await updateStykuDataToBackend(finalId, stykuDataPayload, user, backendLang);
                        if (ok) {
                            setHasBackendData(prev => ({ ...prev, assessment_data: true }));
                        }
                        if (!ok) {
                            console.warn('[useAssessmentSave] PATCH styku failed; falling back to POST');
                            const created = await saveStykuDataToBackend(finalId, stykuDataPayload, user, backendLang);
                            if (created) setHasBackendData(prev => ({ ...prev, assessment_data: true }));
                        }
                    } else {
                        console.log('[useAssessmentSave] Creating new styku via POST');
                        await saveStykuDataToBackend(finalId, stykuDataPayload, user, backendLang);
                        setHasBackendData(prev => ({ ...prev, assessment_data: true }));
                    }
                }

                // 如果是心理测评，保存心理数据
                if (activePrimary === 1) {
                    const mentalDataPayload = {
                        focus: recordData.mentalData?.focus,
                        stability: recordData.mentalData?.stability,
                        confidence: recordData.mentalData?.confidence,
                        stress: recordData.mentalData?.stress,
                        notes: recordData.mentalData?.notes
                    };

                    if (hasBackendData.assessment_data) {
                        console.log('[useAssessmentSave] Updating existing mental via PATCH');
                        const ok = await updateMentalDataToBackend(finalId, mentalDataPayload, user, backendLang);
                        if (ok) {
                            setHasBackendData(prev => ({ ...prev, assessment_data: true }));
                        }
                    } else {
                        console.log('[useAssessmentSave] Creating new mental via POST');
                        await saveMentalDataToBackend(finalId, mentalDataPayload, user, backendLang);
                        setHasBackendData(prev => ({ ...prev, assessment_data: true }));
                    }
                }

                // 如果是技能测评，保存 Trackman 数据
                if (activePrimary === 2) {
                    const trackmanDataPayload = {
                        ...recordData.trackmanData
                    };
                    // 只在有备注时添加 notes 字段
                    if (recordData.trackmanData?.notes) {
                        trackmanDataPayload.notes = recordData.trackmanData.notes;
                    }

                    if (hasBackendData.assessment_data) {
                        console.log('[useAssessmentSave] Updating existing trackman via PATCH');
                        const ok = await updateTrackmanDataToBackend(finalId, trackmanDataPayload, user, backendLang);
                        if (ok) {
                            setHasBackendData(prev => ({ ...prev, assessment_data: true }));
                        }
                        if (!ok) {
                            console.warn('[useAssessmentSave] PATCH trackman failed; falling back to POST');
                            const created = await saveTrackmanDataToBackend(finalId, trackmanDataPayload, user, backendLang);
                            if (created) setHasBackendData(prev => ({ ...prev, assessment_data: true }));
                        }
                    } else {
                        console.log('[useAssessmentSave] Creating new trackman via POST');
                        await saveTrackmanDataToBackend(finalId, trackmanDataPayload, user, backendLang);
                        setHasBackendData(prev => ({ ...prev, assessment_data: true }));
                    }
                }
            }
        }

        // 目标制定步骤：保存目标到后端
        if (activeSecondary === 3) {
            let rawGoalContent = null;
            if (activePrimary === 0) rawGoalContent = recordData.physicalGoals;
            else if (activePrimary === 1) rawGoalContent = recordData.mentalGoals;
            else if (activePrimary === 2) rawGoalContent = recordData.skillsGoals;

            // 预处理目标数据：如果标题为空，生成默认的“第X阶段目标”
            // 这样确保后端保存的是具体的阶段标题，而不是默认的 fallback "目标"
            let goalContent = null;
            if (rawGoalContent && Array.isArray(rawGoalContent)) {
                const stageNames = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
                const stageNamesEn = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];

                goalContent = rawGoalContent.map((item, index) => {
                    // 如果已有标题则保留
                    if (item.title && item.title.trim()) return item;

                    // 否则生成默认标题
                    let defaultTitle;
                    if (backendLang === 'en') {
                        defaultTitle = `${stageNamesEn[index] || `Stage ${index + 1}`} Goal`;
                    } else {
                        defaultTitle = `第${stageNames[index] || (index + 1)}阶段目标`;
                    }

                    return { ...item, title: defaultTitle };
                });
            }

            const currentAssessmentId = recordData.assessmentId;

            if (goalContent != null && currentAssessmentId) {
                if (hasBackendData.goal) {
                    console.log('[useAssessmentSave] Updating existing goals via PATCH');
                    const ok = await updateGoalToBackend(currentAssessmentId, goalContent, user, backendLang);
                    if (ok) {
                        setHasBackendData(prev => ({ ...prev, goal: true }));
                    }
                } else {
                    console.log('[useAssessmentSave] Creating new goals via POST');
                    const newAssessmentId = await saveGoalToBackend(type, goalContent, currentAssessmentId, user, student?.id, backendLang);

                    if (newAssessmentId) {
                        setHasBackendData(prev => ({ ...prev, goal: true }));
                        if (newAssessmentId !== recordData.assessmentId) {
                            setRecordData(prev => ({ ...prev, assessmentId: newAssessmentId }));
                        }
                    }
                }
            }
        }

        // 如果不是最后一步，导航到下一步
        console.log('Final check before navigating, activeSecondary:', activeSecondary);
        if (activeSecondary < 3) {
            navigateToSecondary(activeSecondary + 1, true);
            return;
        }

        // 最后一步：写回学员数据
        persistModuleToStudent(activePrimary, recordData, data, setData);

        // 完整测评/单项测评：点击“完成测评”时，确保把当前标题写回后端
        const titleNow = (recordData?.title || '').toString().trim();
        if (titleNow) {
            await patchCurrentTitleIfNeeded();
        } else {
            await ensureDefaultTitlePatchedIfNeeded();
        }

        // NOTE: 后端文档尚未声明 PATCH /assessment 支持 status 字段；
        // 之前尝试写入 status 会触发 400。这里先不写 status，避免“完成测评”失败。

        // 每次完成一个测评类别（无论是单项还是完整测评）都显示完成操作面板
        // 这样用户可以选择"生成报告"或"稍后生成"
        console.log('Category step 3 completed, showing complete actions');
        setShowCompleteActions(true);
    };

    const handleGenerateAIReport = async (navigate, assessmentData, recordId, isNavigating, setIsNavigating) => {
        if (isNavigating) return;

        // 完整测评：前两项（身体/心理）点击“生成报告”应直接进入下一项（不进入等待页）
        const hasNextTest = !isSingleMode && activePrimary < 2;
        if (hasNextTest) {
            // 优先使用后端返回的真正的 assessmentId
            const finalRecordId = recordData.assessmentId || recordId;

            // 触发 AI 报告生成：发送 POST /AIReport 后开始 WS 监听；成功/失败会通过 WS 全局吐司通知
            if (finalRecordId && user?.token) {
                try {
                    const assessmentType = TYPE_MAP[activePrimary];
                    await requestAIReportGeneration(finalRecordId, {
                        token: user.token,
                        assessmentType,
                        title: recordData?.title
                    });
                } catch (error) {
                    console.error('[handleGenerateAIReport] Failed to request AI report generation (continue flow):', error);
                }
            }

            // 进入下一项测评（不等待 AI 报告页面）
            if (typeof setIsNavigating === 'function') {
                setIsNavigating(true);
            }
            await handleGenerateLater(navigate, assessmentData);
            return;
        }

        // 优先使用后端返回的真正的 assessmentId
        const finalRecordId = recordData.assessmentId || recordId;

        // 清理本地保存的“上次停留步骤”
        clearAssessmentStep({ userId: user?.id || 'guest', assessmentId: finalRecordId });

        // 生成 AI 报告：发送 POST /AIReport 后开始 WS 监听；后端成功/失败会通过 WS 通知，前端全局弹提示
        let aiReportGenerating = false;
        if (finalRecordId && user?.token) {
            try {
                const assessmentType = TYPE_MAP[activePrimary];
                await requestAIReportGeneration(finalRecordId, {
                    token: user.token,
                    assessmentType,
                    title: recordData?.title
                });
                aiReportGenerating = true;
            } catch (error) {
                console.error('[handleGenerateAIReport] Failed to request AI report generation:', error);
            }
        }

        // 清除 showCompleteActions 状态
        try {
            const key = getShowCompleteActionsKey();
            sessionStorage.removeItem(key);
        } catch (e) {
            console.error('Failed to remove session storage:', e);
        }

        // 删除当前测评的草稿
        deleteDraft();

        const type = TYPE_MAP[activePrimary];
        const studentId = student?.id || 'no-student';
        const userId = user?.id || 'guest';

        // 为每个测评类型单独保存到对应的历史记录
        const completedKey = `completed_${userId}_${studentId}_${type}`;

        // 添加到该类型的已完成列表
        const completedList = JSON.parse(localStorage.getItem(completedKey) || '[]');
        completedList.push({
            id: finalRecordId,
            type: type,
            status: 'completed',
            completedAt: new Date().toISOString(),
            data: recordData
        });
        localStorage.setItem(completedKey, JSON.stringify(completedList));

        setIsNavigating(true);

        // 如果是完整测试模式且还有未完成的测评，在 sessionStorage 中标记需要继续
        // （最后一项或单项模式会走到报告详情页）
        if (!isSingleMode && activePrimary < 2) {
            const nextPrimary = activePrimary + 1;
            const nextType = TYPE_MAP[nextPrimary];

            try {
                sessionStorage.setItem('continueCompleteTest', JSON.stringify({
                    nextPrimary,
                    assessmentData,
                    student,
                    title: recordData.title
                }));
            } catch (e) {
                console.error('Failed to save continue state:', e);
            }
        } else {
            // 如果没有下一项测试（最后一项或单项模式），确保清除 sessionStorage
            try {
                sessionStorage.removeItem('continueCompleteTest');
            } catch (e) {
                console.error('Failed to remove session storage:', e);
            }
        }

        if (navigate) {
            try {
                // 直接跳转到对应类型的详情页
                const reportPages = {
                    'physical': '/physical-report',
                    'mental': '/mental-report',
                    'skills': '/skills-report',
                    'technique': '/skills-report'
                };
                const basePath = reportPages[type] || '/physical-report';

                // 跳转时携带 title/student，保证详情页能显示正确标题并返回到对应列表
                const navState = {
                    title: recordData?.title,
                    student,
                    studentId: student?.id,
                    ...(aiReportGenerating ? { aiReportGenerating: true } : {}),
                    ...(hasNextTest
                        ? {
                            continueCompleteTest: true,
                            nextPrimary: activePrimary + 1,
                            assessmentData,
                        }
                        : {})
                };

                // Use the actual finalRecordId when navigating to the report detail
                const targetId = finalRecordId || recordId;
                navigate(`${basePath}/${targetId}`, { state: navState });
            } catch (e) {
                console.error('Navigate failed:', e);
                if (typeof window !== 'undefined') {
                    const reportPages = {
                        'physical': 'physical-report',
                        'mental': 'mental-report',
                        'skills': 'skills-report',
                        'technique': 'skills-report'
                    };
                    const path = `${reportPages[type] || 'physical-report'}/${finalRecordId || recordId}`;
                    window.location.href = `/${path}`;
                }
            }
        }
    };

    const handleGenerateLater = async (navigate, assessmentData) => {
        // Ensure title is saved before leaving
        const titleNow = (recordData?.title || '').toString().trim();
        if (titleNow) {
            await patchCurrentTitleIfNeeded();
        } else {
            await ensureDefaultTitlePatchedIfNeeded();
        }

        // 清理本地保存的“上次停留步骤”
        clearAssessmentStep({ userId: user?.id || 'guest', assessmentId: recordData.assessmentId });

        // 清除当前测评的 showCompleteActions 状态
        try {
            const key = getShowCompleteActionsKey();
            sessionStorage.removeItem(key);
        } catch (e) {
            console.error('Failed to remove session storage:', e);
        }

        // 删除当前测评的草稿
        deleteDraft();

        const type = TYPE_MAP[activePrimary];
        const studentId = student?.id || 'no-student';
        const userId = user?.id || 'guest';

        // 保存到对应类型的已完成列表（稍后生成报告）
        const completedKey = `completed_${userId}_${studentId}_${type}`;
        const completedList = JSON.parse(localStorage.getItem(completedKey) || '[]');
        completedList.push({
            id: recordData.assessmentId,
            type: type,
            status: 'pending',
            completedAt: new Date().toISOString(),
            data: recordData
        });
        localStorage.setItem(completedKey, JSON.stringify(completedList));

        // 如果是完整测试模式且还有未完成的测评，跳转到下一个测评
        if (!isSingleMode && activePrimary < 2) {
            const nextPrimary = activePrimary + 1;
            const NEXT_ROUTE_MAP = { 1: 'mental', 2: 'technique' };
            const nextType = NEXT_ROUTE_MAP[nextPrimary];

            try {
                // 关键修改：在跳转到下一项之前，先创建下一项的 assessment 记录
                // 根据类型生成中文标题
                let defaultTitle = recordData.title;
                if (!defaultTitle) {
                    const titleMap = {
                        'physical': '身体素质测评',
                        'mental': '心理测评',
                        'technique': '技能测评'
                    };
                    defaultTitle = titleMap[nextType] || t('autoAssessment');
                }

                const nextAssessmentId = await createAssessment(
                    student?.id,
                    nextType,
                    user,
                    defaultTitle,
                    backendLang
                );

                if (nextAssessmentId) {
                    // 清除下一项测评的旧草稿和状态
                    const nextTypeForDraft = nextType === 'technique' ? 'skills' : nextType;
                    localStorage.removeItem(`draft_${userId}_${student?.id}_${nextTypeForDraft}`);

                    // 清除新测评的 showCompleteActions 状态
                    try {
                        const nextTypeForStorage = nextType === 'technique' ? 'technique' : nextType;
                        const nextKey = `showCompleteActions_${student?.id}_${nextTypeForStorage}`;
                        sessionStorage.removeItem(nextKey);
                    } catch (e) {
                        console.error('Failed to remove next session storage:', e);
                    }

                    // 跳转到下一个测评的数据采集页面
                    if (navigate) {
                        const nextAssessmentData = {
                            ...assessmentData,
                            mode: 'complete',
                            type: nextType,
                            id: nextAssessmentId,
                            assessment_id: nextAssessmentId
                        };
                        navigate(`/add-record/${nextType}/data`, {
                            state: {
                                assessmentData: nextAssessmentData,
                                student
                            }
                        });
                    }
                } else {
                    alert(t('failedToCreateNextAssessment') || '创建下一项测评失败');
                }
            } catch (error) {
                console.error('Error creating next assessment in handleGenerateLater:', error);
            }
        } else {
            // 所有测评都完成了（包括单项测评完成后），返回到对应的历史报告列表
            if (navigate) {
                const reportPages = {
                    'physical': 'physical-report',
                    'mental': 'mental-report',
                    'skills': 'skills-report',
                    'technique': 'skills-report'
                };
                const reportPage = reportPages[type] || 'physical-report';

                if (studentId && studentId !== 'no-student') {
                    navigate(`/student/${studentId}/${reportPage}`);
                } else {
                    navigate(`/${reportPage}`);
                }
            }
        }
    };

    return { handleSave, handleGenerateAIReport, handleGenerateLater };
};
