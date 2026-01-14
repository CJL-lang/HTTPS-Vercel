/*
 * 添加记录页面（重构版）
 * 功能：添加新的测评记录，包括体能数据、技能数据、心理数据，以及对应的诊断和训练方案
 * 路由：/add-record
 * 
 * 模块化结构：
 * - hooks/: 自定义 Hooks (数据管理、草稿、导航、保存逻辑)
 * - components/: UI 组件 (头部、导航、按钮、对话框)
 * - utils/: 工具函数 (API、辅助函数、常量)
 */
import React, { useState, useEffect, useRef } from 'react';
import { User as UserIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../utils/LanguageContext';

// Custom Hooks
import { useAssessmentData } from './hooks/useAssessmentData';
import { useAssessmentDraft } from './hooks/useAssessmentDraft';
import { useUnsavedChanges } from './hooks/useUnsavedChanges';
import { useAssessmentNavigation } from './hooks/useAssessmentNavigation';
import { useAssessmentSave } from './hooks/useAssessmentSave';

// Components
import AssessmentHeader from './components/AssessmentHeader';
import PrimaryNavigation from './components/PrimaryNavigation';
import SecondaryNavigation from './components/SecondaryNavigation';
import AssessmentContent from './components/AssessmentContent';
import SaveButton from './components/SaveButton';
import UnsavedChangesDialog from './components/UnsavedChangesDialog';

// Utils
import { ROUTE_MAP, TYPE_MAP } from './utils/assessmentConstants';
import { updateAssessment } from './utils/assessmentApi';
import { saveAssessmentStep } from './utils/assessmentProgress';

const AddRecordPage = ({ 
    onBack, 
    initialPrimary = 0, 
    initialSecondary = 0, 
    assessmentData, 
    data, 
    setData, 
    navigate, 
    user, 
    onLogout 
}) => {
    const { t } = useLanguage();
    const location = useLocation();
    
    // 从 location.state 或 props 获取 assessmentData
    const actualAssessmentData = location.state?.assessmentData || assessmentData;
    
    const mode = actualAssessmentData?.mode || 'complete';
    const isSingleMode = mode === 'single';
    
    // 学员信息
    const student = location.state?.student || data;

    // 标题编辑状态
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    // 自定义 Hooks
    const unsavedChanges = useUnsavedChanges(null, null, t);

    // 让“标题”跨二级路由保持一致：在导航时把最新 title 写入 location.state
    const titleRef = useRef(actualAssessmentData?.title || '');

    const getNavigationState = () => {
        const baseState = location.state || {};
        const baseAssessmentData = baseState.assessmentData || actualAssessmentData || {};
        return {
            ...baseState,
            student: baseState.student || student,
            assessmentData: {
                ...baseAssessmentData,
                title: titleRef.current
            }
        };
    };
    
    const navigation = useAssessmentNavigation({
        initialPrimary,
        initialSecondary,
        isSingleMode,
        assessmentData: actualAssessmentData,
        hasUnsavedChanges: unsavedChanges.hasUnsavedChanges,
        setPendingNavigation: unsavedChanges.setPendingNavigation,
        setShowUnsavedDialog: unsavedChanges.setShowUnsavedDialog,
        getNavigationState,
        navigate,
        t
    });

    // 完成操作状态 - 必须在 navigation 定义之后
    const getShowCompleteActionsKey = (activePrimaryIndex = navigation.activePrimary) => {
        const type = TYPE_MAP[activePrimaryIndex] || 'unknown';
        const studentId = student?.id || 'no-student';
        return `showCompleteActions_${studentId}_${type}`;
    };

    const [showCompleteActions, setShowCompleteActionsState] = useState(() => {
        try {
            const key = getShowCompleteActionsKey(initialPrimary);
            const saved = sessionStorage.getItem(key);
            return saved === 'true';
        } catch {
            return false;
        }
    });

    const setShowCompleteActions = (value) => {
        setShowCompleteActionsState(value);
        try {
            const key = getShowCompleteActionsKey();
            sessionStorage.setItem(key, String(value));
        } catch (e) {

        }
    };

    const assessmentData_hook = useAssessmentData(actualAssessmentData, navigation.activePrimary, navigation.activeSecondary, t, user);

    // 任何页面修改标题后，后续导航都携带最新值
    useEffect(() => {
        titleRef.current = assessmentData_hook.recordData?.title || '';
    }, [assessmentData_hook.recordData?.title]);
    
    const draft = useAssessmentDraft(
        navigation.activePrimary,
        student,
        user,
        assessmentData_hook.recordData,
        assessmentData_hook.setRecordData,
        actualAssessmentData
    );

    // 包装 updateRecordData 以自动标记未保存更改
    const wrappedUpdateRecordData = (path, val, isSilent = false) => {
        assessmentData_hook.updateRecordData(path, val);
        // 如果不是静默更新，标记有未保存的更改
        if (!isSilent) {
            unsavedChanges.setHasUnsavedChanges(true);
        }
    };


    // 当 activePrimary 改变时，从 sessionStorage 恢复 showCompleteActions 状态
    useEffect(() => {
        try {
            const key = getShowCompleteActionsKey();
            const saved = sessionStorage.getItem(key);
            const shouldShow = saved === 'true';
            setShowCompleteActionsState(shouldShow);
        } catch (e) {
            // 忽略错误
        }
    }, [navigation.activePrimary, student?.id]);

    // 记录“上次停留步骤”，用于待处理报告继续填写时恢复到对应页面
    useEffect(() => {
        const assessmentId =
            assessmentData_hook.recordData?.assessmentId ||
            actualAssessmentData?.assessment_id ||
            actualAssessmentData?.id;

        if (!assessmentId) return;

        saveAssessmentStep({
            userId: user?.id || 'guest',
            assessmentId,
            step: navigation.activeSecondary
        });
    }, [navigation.activeSecondary, assessmentData_hook.recordData?.assessmentId, actualAssessmentData?.assessment_id, actualAssessmentData?.id, user?.id]);

    // 关键逻辑：完成测试后的“稍后生成/生成AI报告”只应停留在目标制定页
    // 如果用户未选择操作就切走，回到目标制定应恢复为“完成测试”按钮
    useEffect(() => {
        if (navigation.activeSecondary !== 3 && showCompleteActions) {
            try {
                const key = getShowCompleteActionsKey();
                sessionStorage.removeItem(key);
            } catch (e) {
                // 忽略错误
            }
            setShowCompleteActionsState(false);
        }
    }, [navigation.activeSecondary, showCompleteActions, student?.id]);

    const save = useAssessmentSave({
        recordData: assessmentData_hook.recordData,
        setRecordData: assessmentData_hook.setRecordData,
        activePrimary: navigation.activePrimary,
        activeSecondary: navigation.activeSecondary,
        student,
        user,
        data,
        setData,
        saveDraft: draft.saveDraft,
        updateDraftId: draft.updateDraftId,
        deleteDraft: draft.deleteDraft,
        setHasUnsavedChanges: unsavedChanges.setHasUnsavedChanges,
        setInitialDataSnapshot: draft.setInitialDataSnapshot,
        setShowCompleteActions,
        getShowCompleteActionsKey,
        isSingleMode,
        navigateToPrimary: navigation.navigateToPrimary,
        t,
        hasBackendData: assessmentData_hook.hasBackendData,
        setHasBackendData: assessmentData_hook.setHasBackendData
    });

    // 开发辅助：如果 URL 包含 ?autoSave=1，则在页面加载后自动触发保存（用于自动化验证）
    useEffect(() => {
        try {
            const params = new URLSearchParams(location.search);
            const auto = params.get('autoSave');
            if (auto === '1' && process.env.NODE_ENV !== 'production') {
                // 延迟一点时间以便页面和数据初始化完成
                const timer = setTimeout(async () => {
                    try {
                        console.info('[AutoSave] autoSave=1 detected, triggering save...');
                        await save.handleSave(navigation.navigateToSecondary);
                        console.info('[AutoSave] save triggered');
                    } catch (e) {
                        console.error('[AutoSave] save failed', e);
                    }
                }, 1200);
                return () => clearTimeout(timer);
            }
        } catch (e) {
            // ignore
        }
    }, [location.search, save, navigation.navigateToSecondary]);

    // 学员信息验证
    useEffect(() => {
        if (!student || !student.id) {

            if (navigate) {
                navigate('/students');
            } else if (onBack) {
                onBack();
            }
        }
    }, [student, navigate, onBack]);

    if (!student || !student.id) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
                <div className="text-white text-center">
                    <p>正在加载学生信息...</p>
                </div>
            </div>
        );
    }

    // 事件处理
    const ensureDefaultTitlePatchedIfNeeded = async () => {
        const assessmentId = assessmentData_hook.recordData?.assessmentId;
        if (!assessmentId || !user?.token) return;

        const defaultTitles = {
            0: t('physicalAssessment'),
            1: t('mentalAssessment'),
            2: t('skillsAssessment')
        };
        const desiredTitle = defaultTitles[navigation.activePrimary] || t('autoAssessment') || '';

        const currentTitle = (assessmentData_hook.recordData?.title || '').toString().trim();
        const englishDefaultPattern = /^(physical|mental|skills)\s*assessment\s+on\s+/i;
        const shouldPatch =
            !currentTitle ||
            currentTitle === desiredTitle ||
            englishDefaultPattern.test(currentTitle);

        if (!shouldPatch || !desiredTitle) return;

        try {
            await updateAssessment(assessmentId, { title: desiredTitle }, user);
        } catch (e) {
            // ignore title patch errors on navigation
        }
    };

    const handleBack = async () => {
        if (unsavedChanges.hasUnsavedChanges) {
            unsavedChanges.setPendingNavigation({ type: 'back' });
            unsavedChanges.setShowUnsavedDialog(true);
            return;
        }

        await ensureDefaultTitlePatchedIfNeeded();
        
        // 根据当前测评类型返回到对应的历史测评记录页面
        const reportPages = { 0: 'physical-report', 1: 'mental-report', 2: 'skills-report' };
        const reportPage = reportPages[navigation.activePrimary] || 'physical-report';
        
        if (navigate && student?.id) {
            navigate(`/student/${student.id}/${reportPage}`);
        } else if (onBack) {
            onBack();
        } else if (navigate) {
            navigate(`/${reportPage}`);
        }
    };

    const executePendingNavigation = async () => {
        const pending = unsavedChanges.pendingNavigation;
        if (!pending) return;
        
        if (pending.type === 'secondary') {
            const type = ROUTE_MAP[navigation.activePrimary];
            const step = navigation.secondaryTabs[pending.target].path;
            if (navigate) {
                // 必须带上最新的 state（含最新 title），否则切页会回滚
                navigate(`/add-record/${type}/${step}`, { state: getNavigationState() });
            }
        } else if (pending.type === 'back') {
            await ensureDefaultTitlePatchedIfNeeded();
            // 根据当前测评类型返回到对应的历史测评记录页面
            const reportPages = { 0: 'physical-report', 1: 'mental-report', 2: 'skills-report' };
            const reportPage = reportPages[navigation.activePrimary] || 'physical-report';
            
            if (navigate && student?.id) {
                navigate(`/student/${student.id}/${reportPage}`);
            } else if (onBack) {
                onBack();
            } else if (navigate) {
                navigate(`/${reportPage}`);
            }
        }
        
        unsavedChanges.setPendingNavigation(null);
        unsavedChanges.setShowUnsavedDialog(false);
    };

    const handleGenerateLater = async () => {
        if (!isNavigating) {
            setShowCompleteActions(false);
            save.handleGenerateLater(navigate, actualAssessmentData);
        }
    };

    const handleTitleSave = async () => {
        const assessmentId = assessmentData_hook.recordData.assessmentId;
        let newTitle = assessmentData_hook.recordData.title;

        // 如果标题为空，使用默认标题并同步到前端 state
        if (!newTitle || !newTitle.trim()) {
            const titleMap = {
                0: '身体素质测评',
                1: '心理测评',
                2: '技能测评'
            };
            newTitle = titleMap[navigation.activePrimary] || t('autoAssessment');
            assessmentData_hook.updateRecordData('title', newTitle);
        }

        console.log('[AddRecordPage] handleTitleSave called', { assessmentId, newTitle });

        if (assessmentId && newTitle && user?.token) {
            const success = await updateAssessment(assessmentId, { title: newTitle }, user);
            console.log('[AddRecordPage] updateAssessment result:', success);
            // 标题保存成功后，重置未保存标记，避免切换页面时提示
            unsavedChanges.setHasUnsavedChanges(false);

            // 同步更新草稿（待处理列表/重新进入时使用草稿标题）
            try {
                if (success) {
                    titleRef.current = newTitle;
                    draft.saveDraft(navigation.activeSecondary);
                }
            } catch (e) {
                // ignore
            }
        } else {
            console.error('[AddRecordPage] handleTitleSave error: missing ID or title', { assessmentId, newTitle });
        }
    };

    return (
        <div className="min-h-screen text-white p-4 sm:p-6 pb-24 sm:pb-32 relative bg-transparent">
            <AssessmentHeader
                title={assessmentData_hook.recordData.title}
                isEditingTitle={isEditingTitle}
                setIsEditingTitle={setIsEditingTitle}
                rightContent={
                    student?.name ? (
                        <div className="inline-flex items-center h-9 sm:h-10 rounded-full surface-strong border border-white/20 mr-2 shadow-lg pl-4 pr-1.5 py-1">
                            <span className="text-white text-sm sm:text-base font-bold mr-2 truncate max-w-[9rem] sm:max-w-[12rem]">
                                {student.name}
                            </span>
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#d4af37] flex items-center justify-center rounded-full text-black shadow-md shrink-0">
                                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                        </div>
                    ) : null
                }
                onTitleChange={(value) => {
                    titleRef.current = value;
                    assessmentData_hook.updateRecordData('title', value);
                    // 标题修改时标记为已修改
                    unsavedChanges.setHasUnsavedChanges(true);
                }}
                onSave={handleTitleSave}
                onBack={handleBack}
                t={t}
            />

            <PrimaryNavigation
                primaryTabs={navigation.primaryTabs}
                activePrimary={navigation.activePrimary}
                isSingleMode={isSingleMode}
                hideSinglePrimaryLabel={true}
            />

            <SecondaryNavigation
                secondaryTabs={navigation.secondaryTabs}
                activeSecondary={navigation.activeSecondary}
                onNavigate={navigation.navigateToSecondary}
            />

            <div className="relative z-10 flex-1 pb-20">
                <AssessmentContent
                    activePrimary={navigation.activePrimary}
                    activeSecondary={navigation.activeSecondary}
                    recordData={assessmentData_hook.recordData}
                    updateRecordData={wrappedUpdateRecordData}
                    primaryTabs={navigation.primaryTabs}
                    secondaryTabs={navigation.secondaryTabs}
                    t={t}
                />
            </div>

            <SaveButton
                showCompleteActions={showCompleteActions}
                activeSecondary={navigation.activeSecondary}
                onSave={() => save.handleSave(navigation.navigateToSecondary)}
                onGenerateLater={handleGenerateLater}
                onGenerateAI={() => {
                    // 清除完成状态
                    try {
                        const key = getShowCompleteActionsKey();
                        sessionStorage.removeItem(key);
                        setShowCompleteActions(false);
                    } catch (e) {

                    }
                    save.handleGenerateAIReport(navigate, actualAssessmentData, draft.recordId, isNavigating, setIsNavigating);
                }}
                isNavigating={isNavigating}
                t={t}
            />

            <UnsavedChangesDialog
                show={unsavedChanges.showUnsavedDialog}
                onSaveAndContinue={async () => {
                    await save.handleSave(navigation.navigateToSecondary);
                    executePendingNavigation();
                }}
                onLeaveWithoutSaving={() => {
                    unsavedChanges.setHasUnsavedChanges(false);
                    executePendingNavigation();
                }}
                onCancel={() => {
                    unsavedChanges.setShowUnsavedDialog(false);
                    unsavedChanges.setPendingNavigation(null);
                }}
                t={t}
            />
        </div>
    );
};

export default AddRecordPage;
