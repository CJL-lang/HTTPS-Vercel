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
    getSingleAssessment
} from '../utils/assessmentApi';
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
                diagnosisContent = recordData.mentalDiagnosis;
            } else if (activePrimary === 2) {
                // 技能测评：将 diagnosisData 对象提取为后端要求的数组格式
                const rawData = recordData.diagnosisData || recordData.skillsDiagnosis || {};
                const potentialKeys = [
                    'stance', 'grip', 'coordination', 
                    'backswing', 'downswing', 'tempo', 
                    'stability', 'direction', 'power', 
                    'shortGame', 'greenside', 
                    'handCoordination', 'bodyUsage'
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
                        // 排除已经在 potentialKeys 中的（虽然结构不同，但以防万一）
                        if (item.id && (item.content || item.level)) {
                            diagnosisContent.push({
                                title: t(item.club) || item.club,
                                grade: item.level || 'L1',
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

            if (activePrimary === 2 && recordData.planData) {
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
                    await updatePlanToBackend(currentAssessmentId, cleanContent, user, backendLang);
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
                        await updateStykuDataToBackend(finalId, stykuDataPayload, user, backendLang);
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
                        await updateMentalDataToBackend(finalId, mentalDataPayload, user, backendLang);
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
                        await updateTrackmanDataToBackend(finalId, trackmanDataPayload, user, backendLang);
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
            let goalContent = null;
            if (activePrimary === 0) goalContent = recordData.physicalGoals;
            else if (activePrimary === 1) goalContent = recordData.mentalGoals;
            else if (activePrimary === 2) goalContent = recordData.skillsGoals;

            const currentAssessmentId = recordData.assessmentId;

            if (goalContent != null && currentAssessmentId) {
                if (hasBackendData.goal) {
                    console.log('[useAssessmentSave] Updating existing goals via PATCH');
                    await updateGoalToBackend(currentAssessmentId, goalContent, user, backendLang);
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

        // 每次完成一个测评类别（无论是单项还是完整测评）都显示完成操作面板
        // 这样用户可以选择"生成报告"或"稍后生成"
        console.log('Category step 3 completed, showing complete actions');
        setShowCompleteActions(true);
    };

    const handleGenerateAIReport = async (navigate, assessmentData, recordId, isNavigating, setIsNavigating) => {
        if (isNavigating) return;
        
        // 优先使用后端返回的真正的 assessmentId
        const finalRecordId = recordData.assessmentId || recordId;

        // 清理本地保存的“上次停留步骤”
        clearAssessmentStep({ userId: user?.id || 'guest', assessmentId: finalRecordId });
        
        // 在生成AI报告前，先调用接口获取单个测评数据
        // finalRecordId 就是 assessment_id，会作为路径参数传递给后端
        if (finalRecordId && user?.token) {
            try {
                console.log('[handleGenerateAIReport] Fetching single assessment data for assessment_id:', finalRecordId);
                const singleAssessmentData = await getSingleAssessment(finalRecordId, user);
                if (singleAssessmentData) {
                    console.log('[handleGenerateAIReport] Single assessment data retrieved:', singleAssessmentData);
                    // 可以在这里处理返回的数据，比如更新 recordData 或传递给报告页面
                } else {
                    console.warn('[handleGenerateAIReport] Failed to fetch single assessment data');
                }
            } catch (error) {
                console.error('[handleGenerateAIReport] Error fetching single assessment:', error);
                // 即使获取失败，也继续执行后续流程
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
        const hasNextTest = !isSingleMode && activePrimary < 2;
        if (hasNextTest) {
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
            // 所有测评都完成了（包括单项测评完成后），返回到学员的测评工作台
            if (navigate) {
                if (studentId && studentId !== 'no-student') {
                    navigate(`/student/${studentId}`);
                } else {
                    navigate('/');
                }
            }
        }
    };

    return { handleSave, handleGenerateAIReport, handleGenerateLater };
};
