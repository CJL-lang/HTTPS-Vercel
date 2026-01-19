/**
 * 添加记录页面
 * 功能：添加新的测评记录，包括体能数据、技能数据、心理数据，以及对应的诊断和训练方案
 * 路由：/add-record
 */
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Check, Save, Edit2 } from 'lucide-react';
import PhysicalData from '../../components/add-record/PhysicalData';
import PhysicalDiagnosis from '../../components/add-record/PhysicalDiagnosis';
import PhysicalPlan from '../../components/add-record/PhysicalPlan';
import GoalSetting from '../../components/add-record/GoalSetting';
import SkillsData from '../../components/add-record/SkillsData';
import MentalData from '../../components/add-record/MentalData';
import MentalDiagnosis from '../../components/add-record/MentalDiagnosis';
import MentalPlan from '../../components/add-record/MentalPlan';
import SkillsDiagnosis from '../../components/add-record/SkillsDiagnosis';
import SkillsPlan from '../../components/add-record/SkillsPlan';
import { useLanguage } from '../../utils/LanguageContext';
import styles from './AddRecordPage.module.css';

const AddRecordPage = ({ onBack, initialPrimary = 0, initialSecondary = 0, assessmentData, data, setData, navigate, user, onLogout }) => {
    const { t } = useLanguage();
    const location = useLocation();
    const mode = assessmentData?.mode || 'complete'; // 'complete' | 'single'
    const isSingleMode = mode === 'single';

    // 从路由state获取学员信息
    const student = location.state?.student || data;

    // 如果没有学生信息，重定向到学生列表
    React.useEffect(() => {
        if (!student || !student.id) {

            if (navigate) {
                navigate('/students');
            } else if (onBack) {
                onBack();
            }
            return;
        }
    }, [student, navigate, onBack]);

    // 如果没有学生信息，不渲染内容
    if (!student || !student.id) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
                <div className="text-white text-center">
                    <p>正在加载学生信息...</p>
                </div>
            </div>
        );
    }

    // 根据 assessmentData.type 计算初始的 primary tab
    const getInitialPrimaryFromType = () => {
        if (isSingleMode && assessmentData?.type) {
            const typeMap = { physical: 0, mental: 1, skills: 2 };
            return typeMap[assessmentData.type] ?? initialPrimary;
        }
        return initialPrimary;
    };

    // 从路由路径解析当前的一级和二级导航
    const parseRoute = () => {
        const path = location.pathname;
        // /add-record/physical/data -> primary: 0, secondary: 0
        // /add-record/physical/diagnosis -> primary: 0, secondary: 1
        // /add-record/physical/plan -> primary: 0, secondary: 2
        // /add-record/physical/goal -> primary: 0, secondary: 3
        const match = path.match(/\/add-record\/(physical|mental|skills|technique)\/(data|diagnosis|plan|goal)/);
        if (match) {
            const typeMap = { physical: 0, mental: 1, skills: 2, technique: 2 };
            const stepMap = { data: 0, diagnosis: 1, plan: 2, goal: 3 };
            return {
                primary: typeMap[match[1]] ?? getInitialPrimaryFromType(),
                secondary: stepMap[match[2]] ?? initialSecondary
            };
        }
        return { primary: getInitialPrimaryFromType(), secondary: initialSecondary };
    };

    const routeInfo = parseRoute();
    // 一级导航状态：0-身体素质测评, 1-心理测评, 2-技能测评
    const [activePrimary, setActivePrimary] = useState(routeInfo.primary);
    // 二级导航状态：0-数据采集, 1-技能诊断, 2-训练方案, 3-目标制定
    const [activeSecondary, setActiveSecondary] = useState(routeInfo.secondary);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    // 当路由变化时同步状态
    useEffect(() => {
        const info = parseRoute();
        setActivePrimary(info.primary);
        setActiveSecondary(info.secondary);
    }, [location.pathname]);

    // 设置默认标题
    useEffect(() => {
        const defaultTitles = {
            0: t('physicalAssessment'),
            1: t('mentalAssessment'),
            2: t('skillsAssessment')
        };
        if (!recordData.title) {
            setRecordData(prev => ({ ...prev, title: defaultTitles[activePrimary] }));
        }
    }, [activePrimary]);
    const [completedAssessments, setCompletedAssessments] = useState([]);

    // 使用 sessionStorage 持久化 showCompleteActions 状态，避免组件重新挂载时丢失
    const getShowCompleteActionsKey = () => {
        const typeMap = { 0: 'physical', 1: 'mental', 2: 'skills' };
        const type = typeMap[activePrimary] || 'unknown';
        const studentId = student?.id || 'no-student';
        return `showCompleteActions_${studentId}_${type}`;
    };

    const [showCompleteActions, setShowCompleteActionsState] = useState(() => {
        try {
            const key = getShowCompleteActionsKey();
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

    const [isNavigating, setIsNavigating] = useState(false);

    // 记录ID和草稿跟踪
    const [recordId, setRecordId] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [initialDataSnapshot, setInitialDataSnapshot] = useState(null);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    // 测评数据状态
    const [recordData, setRecordData] = useState({
        assessmentId: assessmentData?.id || '',
        title: assessmentData?.title || '',
        stykuData: {
            height: '', weight: '', sittingHeight: '', bmi: '',
            torso: { chest: '', waist: '', hip: '' },
            upperLimbs: { upperArm: '', forearm: '' },
            lowerLimbs: { thigh: '', calf: '' }
        },
        trackmanData: {
            problems: '',
            layerA: {
                ballSpeed: '', launchAngle: '', launchDirection: '',
                spinRate: '', spinAxis: '', carry: '',
                landingAngle: '', offline: ''
            },
            layerB: {
                clubSpeed: '', attackAngle: '', clubPath: '',
                faceAngle: '', faceToPath: '', dynamicLoft: '',
                smashFactor: '', spinLoft: ''
            },
            layerC: {
                lowPoint: '', impactOffset: '', indexing: ''
            }
        },
        mentalData: {
            focus: '',
            stress: '',
            confidence: '',
            stability: '',
            notes: ''
        },
        diagnosisData: {
            stance: '', grip: '', coordination: '',
            backswing: '', downswing: '', tempo: '',
            stability: '', direction: '', power: '',
            shortGame: '', greenside: '',
            handCoordination: '', bodyUsage: ''
        },
        physicalDiagnosis: [],
        mentalDiagnosis: [],
        mentalPlan: [],
        physicalPlan: [],
        physicalGoals: [],
        mentalGoals: [],
        skillsGoals: [],
        planData: {
            point1: '',
            point2: '',
            extra: ''
        },
        goalData: {
            stage1: '',
            stage2: '',
            stage3: ''
        }
    });

    // 初始化recordId并加载草稿
    useEffect(() => {
        const typeMap = { 0: 'physical', 1: 'mental', 2: 'skills' };
        const type = typeMap[activePrimary];
        const studentId = student?.id || 'no-student';
        const userId = user?.id || 'guest';
        const storageKey = `draft_${userId}_${studentId}_${type}`;

        // 尝试加载现有草稿
        const savedDraft = localStorage.getItem(storageKey);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                setRecordId(draft.id);
                setRecordData(draft.data);
                setInitialDataSnapshot(JSON.stringify(draft.data));
                return;
            } catch (e) {

            }
        }

        // 创建新记录ID
        const newId = `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setRecordId(newId);
        setInitialDataSnapshot(JSON.stringify(recordData));
    }, [activePrimary, student]);

    // 监听数据变化以设置hasUnsavedChanges
    useEffect(() => {
        if (initialDataSnapshot) {
            const currentSnapshot = JSON.stringify(recordData);
            setHasUnsavedChanges(currentSnapshot !== initialDataSnapshot);
        }
    }, [recordData, initialDataSnapshot]);

    // 浏览器关闭/刷新提示
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = t('unsavedChangesWarning');
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const primaryTabsAll = useMemo(() => ([
        { id: 0, label: t('physicalAssessment') },
        { id: 1, label: t('mentalAssessment') },
        { id: 2, label: t('skillsAssessment') }
    ]), [t]);

    const primaryTabs = useMemo(() => {
        if (!isSingleMode) return primaryTabsAll;
        const tab = primaryTabsAll.find(x => x.id === initialPrimary) || primaryTabsAll[0];
        return [tab];
    }, [isSingleMode, initialPrimary, primaryTabsAll]);

    const updateRecordData = (path, val) => {
        const keys = path.split('.');
        setRecordData(prev => {
            const newData = { ...prev };
            let current = newData;
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                current[key] = Array.isArray(current[key]) ? [...current[key]] : { ...current[key] };
                current = current[key];
            }
            current[keys[keys.length - 1]] = val;
            return newData;
        });
        setHasUnsavedChanges(true);
    };

    // 根据当前测评类型动态调整二级导航标签
    const secondaryTabs = useMemo(() => {
        const diagnosisLabel = activePrimary === 0
            ? t('bodyDiagnosis')
            : activePrimary === 1
                ? t('mentalDiagnosis')
                : t('skillsDiagnosis');

        return [
            { id: 0, label: t('dataCollection'), path: 'data' },
            { id: 1, label: diagnosisLabel, path: 'diagnosis' },
            { id: 2, label: t('trainingPlan'), path: 'plan' },
            { id: 3, label: t('goalSetting'), path: 'goal' }
        ];
    }, [activePrimary, t]);

    // 路由映射表
    const routeMap = {
        0: 'physical',
        1: 'mental',
        2: 'technique'
    };

    // 导航到指定的二级页面
    const navigateToSecondary = (secondaryId, skipCheck = false) => {
        if (!skipCheck && hasUnsavedChanges && secondaryId !== activeSecondary) {
            setPendingNavigation({ type: 'secondary', target: secondaryId });
            setShowUnsavedDialog(true);
            return;
        }

        const type = routeMap[activePrimary];
        const step = secondaryTabs[secondaryId].path;
        if (navigate) {
            navigate(`/add-record/${type}/${step}`);
        }
    };

    // 执行待定的导航
    const executePendingNavigation = () => {
        if (!pendingNavigation) return;

        if (pendingNavigation.type === 'secondary') {
            const type = routeMap[activePrimary];
            const step = secondaryTabs[pendingNavigation.target].path;
            if (navigate) {
                navigate(`/add-record/${type}/${step}`);
            }
        } else if (pendingNavigation.type === 'back') {
            // 返回到对应的历史测评记录页面
            const reportPages = { 0: 'physical-report', 1: 'mental-report', 2: 'skills-report' };
            const reportPage = reportPages[activePrimary] || 'physical-report';

            if (navigate && student?.id) {
                navigate(`/student/${student.id}/${reportPage}`);
            } else if (onBack) {
                onBack();
            } else if (navigate) {
                navigate(`/${reportPage}`);
            }
        }

        setPendingNavigation(null);
        setShowUnsavedDialog(false);
    };

    const hasAnyValue = (v) => {
        if (v == null) return false;
        if (typeof v === 'string') return v.trim().length > 0;
        if (typeof v === 'number') return Number.isFinite(v) && v !== 0;
        if (Array.isArray(v)) return v.some(hasAnyValue);
        if (typeof v === 'object') return Object.values(v).some(hasAnyValue);
        return false;
    };

    const persistModuleToStudent = (primaryId) => {
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

    // 检查当前测评类型是否至少有一项数据被填写
    const checkHasAnyData = () => {
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

    const handleGenerateAIReport = () => {
        if (isNavigating) {
            return;
        }

        // 清除 showCompleteActions 状态
        try {
            const key = getShowCompleteActionsKey();
            sessionStorage.removeItem(key);
        } catch (e) {

        }

        // 删除草稿并标记为已完成
        const typeMap = { 0: 'physical', 1: 'mental', 2: 'skills' };
        const type = typeMap[activePrimary];
        const studentId = student?.id || 'no-student';
        const userId = user?.id || 'guest';
        const storageKey = `draft_${userId}_${studentId}_${type}`;
        const listKey = `drafts_${userId}_${studentId}`;
        const completedKey = `completed_${userId}_${studentId}`;

        // 删除草稿
        localStorage.removeItem(storageKey);

        // 从草稿列表中删除
        const draftsList = JSON.parse(localStorage.getItem(listKey) || '[]');
        const updatedDrafts = draftsList.filter(d => !(d.id === recordId && d.type === type));
        localStorage.setItem(listKey, JSON.stringify(updatedDrafts));

        // 添加到已完成列表
        const completedList = JSON.parse(localStorage.getItem(completedKey) || '[]');
        completedList.push({
            id: recordId,
            type: type,
            status: 'completed',
            completedAt: new Date().toISOString(),
            data: recordData
        });
        localStorage.setItem(completedKey, JSON.stringify(completedList));

        // 准备报告数据 - 确保单项测评模式和类型正确传递
        const state = {
            ...(assessmentData || {}),
            mode: 'single', // 从单项测评进入，始终是单项模式
            type: type, // 当前测评类型：'physical', 'mental', 'skills'
            completedAssessments: [activePrimary], // 当前完成的测评项
            recordData
        };

        try {
            sessionStorage.setItem('aiReportData', JSON.stringify(state));
        } catch (e) {

        }

        // 设置导航状态并执行跳转
        setIsNavigating(true);

        if (navigate) {
            navigate('/ai-report', { state });
        } else if (typeof window !== 'undefined') {
            window.location.href = '/ai-report';
        }
    };

    const savePlanToBackend = async (type, content, currentId) => {
        if (!user?.token) return null;
        try {
            const response = await fetch('/api/plans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    assessment_id: currentId || assessmentData?.id || '',
                    student_id: assessmentData?.studentId || data?.id || '',
                    title: recordData.title,
                    type: type,
                    content: content
                }),
            });

            if (response.ok) {
                const resData = await response.json();
                return resData.assessment_id;
            }
        } catch (error) {

        }
        return null;
    };

    // 新增：保存诊断到后端的 helper，发送到 /physical-diagnosis（按产品需求）
    const saveDiagnosisToBackend = async (type, content, currentId) => {
        // allow saving even without token, but include token if available
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

            const candidateUrls = [
                '/api/diagnosis' // alternate route bound to same handler
            ];

            // If there's no token, avoid calling protected endpoints that will return 401
            const urlsToTry = user?.token
                ? candidateUrls
                : candidateUrls.filter(u => u.includes('_p') || u.includes('/public/') || u.includes('physical-diagnosis_p'));

            if (!urlsToTry || urlsToTry.length === 0) {
                // No safe public endpoint available for anonymous saving - skip backend save

                return null;
            }

            for (const url of urlsToTry) {
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            assessment_id: currentId || assessmentData?.id || '',
                            student_id: assessmentData?.studentId || data?.id || '',
                            type: type,
                            content: content
                        }),
                    });

                    if (response.ok) {
                        const resData = await response.json();
                        return resData.assessment_id || resData.assessmentId || null;
                    }

                    // If not ok, log and try next candidate
                    const txt = await response.text();

                } catch (err) {

                    // try next url
                }
            }
        } catch (error) {

        }
        return null;
    };

    const handleSave = async () => {
        if (!recordId) return;

        // 保存草稿到localStorage
        const typeMap = { 0: 'physical', 1: 'mental', 2: 'skills' };
        const type = typeMap[activePrimary];
        const studentId = student?.id || 'no-student';
        const userId = user?.id || 'guest';
        const storageKey = `draft_${userId}_${studentId}_${type}`;
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
            sortTime: new Date().toISOString()
        };

        if (existingIndex >= 0) {
            draftsList[existingIndex] = listItem;
        } else {
            draftsList.push(listItem);
        }

        localStorage.setItem(listKey, JSON.stringify(draftsList));

        // 重置变化标记
        setHasUnsavedChanges(false);
        setInitialDataSnapshot(JSON.stringify(recordData));

        // 如果当前是诊断页面，发送诊断数据到后端
        if (activeSecondary === 1) {
            // 选择要保存的诊断数据字段，依据当前一级类型
            let diagnosisContent = null;
            if (activePrimary === 0) diagnosisContent = recordData.physicalDiagnosis;
            else if (activePrimary === 1) diagnosisContent = recordData.mentalDiagnosis;
            else if (activePrimary === 2) diagnosisContent = recordData.diagnosisData || recordData.skillsDiagnosis || null;

            if (diagnosisContent != null) {
                const newAssessmentId = await saveDiagnosisToBackend(type, diagnosisContent, recordData.assessmentId);
                if (newAssessmentId && newAssessmentId !== recordData.assessmentId) {
                    setRecordData(prev => ({ ...prev, assessmentId: newAssessmentId }));
                }
            }
        }

        // 保存训练方案到后端
        if (activeSecondary === 2) {
            let skillsPlanData = recordData.skillsPlan;

            // 如果是技能测评，且使用了 planData 结构，则进行转换
            if (activePrimary === 2 && recordData.planData) {
                const p = recordData.planData;
                skillsPlanData = [];
                if (p.point1) skillsPlanData.push({ title: '训练要点1', content: p.point1 });
                if (p.point2) skillsPlanData.push({ title: '训练要点2', content: p.point2 });
                if (p.extra) skillsPlanData.push({ title: '额外说明', content: p.extra });
            }

            const plansToSave = [
                { type: 'physical', data: recordData.physicalPlan },
                { type: 'mental', data: recordData.mentalPlan },
                { type: 'skills', data: skillsPlanData }
            ];

            let currentAssessmentId = recordData.assessmentId;

            for (const plan of plansToSave) {
                if (Array.isArray(plan.data) && plan.data.length > 0) {
                    const cleanContent = plan.data.map(({ title, content }) => ({ title, content }));
                    const newId = await savePlanToBackend(plan.type, cleanContent, currentAssessmentId);
                    if (newId) {
                        currentAssessmentId = newId;
                    }
                }
            }

            if (currentAssessmentId && currentAssessmentId !== recordData.assessmentId) {
                setRecordData(prev => ({ ...prev, assessmentId: currentAssessmentId }));
            }
        }

        // 保存数据到后端 (数据步骤)
        if (activeSecondary === 0) {
            try {
                // 清理数据，只发送非空值
                const cleanData = (obj) => {
                    if (obj === null || obj === undefined) return null;
                    if (typeof obj === 'string') return obj.trim() === '' ? null : obj;
                    if (typeof obj === 'object') {
                        const cleaned = {};
                        for (const [key, value] of Object.entries(obj)) {
                            const cleanedValue = cleanData(value);
                            if (cleanedValue !== null) {
                                cleaned[key] = cleanedValue;
                            }
                        }
                        return Object.keys(cleaned).length > 0 ? cleaned : null;
                    }
                    return obj;
                };

                const requestBody = {
                    student_id: student?.id,
                    title: recordData.title || t('autoAssessment'),
                    type: typeMap[activePrimary],
                    stykuData: cleanData(recordData.stykuData),
                    trackmanData: cleanData(recordData.trackmanData),
                    mentalData: cleanData(recordData.mentalData)
                };

                // 验证必要字段
                if (!requestBody.student_id) {

                    return;
                }

                // 如果所有数据都是空的，不发送请求
                if (!requestBody.stykuData && !requestBody.trackmanData && !requestBody.mentalData) {
                    return;
                }

                const response = await fetch('/api/figuredata', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                // 保存 assessment_id 到 recordData
                if (result.assessment_id) {
                    setRecordData(prev => ({ ...prev, assessmentId: result.assessment_id }));
                }
            } catch (error) {

                // 可以在这里添加错误处理，比如显示提示
            }
        }

        // 完成一个模块（目标制定）时：写回学员数据
        if (activeSecondary < 3) {
            // 如果不是最后一个二级菜单，跳到下一个二级菜单（跳过未保存检查）
            navigateToSecondary(activeSecondary + 1, true);
            return;
        }

        // 到这里说明 secondary === 3（目标制定）
        persistModuleToStudent(activePrimary);

        // 单项测评完成：显示"生成AI报告/稍后生成"
        // 注意：从单项测评历史页面进入时，只完成当前测评类型的4个步骤
        setShowCompleteActions(true);
        return;
    };

    const renderContent = () => {
        // 内容现在由路由渲染，这里使用 Outlet 或者直接渲染对应的组件
        // 为了保持向后兼容，我们仍然在这里渲染内容
        const type = routeMap[activePrimary];
        const step = secondaryTabs[activeSecondary]?.path;

        // 根据路由渲染对应的组件
        if (activePrimary === 0) {
            if (activeSecondary === 0) return <PhysicalData data={recordData} update={updateRecordData} />;
            if (activeSecondary === 1) return <PhysicalDiagnosis data={recordData} update={updateRecordData} />;
            if (activeSecondary === 2) return <PhysicalPlan data={recordData} update={updateRecordData} />;
            if (activeSecondary === 3) return (
                <GoalSetting
                    data={recordData}
                    update={updateRecordData}
                    dataKey="physicalGoals"
                    title={t('physicalGoal')}
                    subtitle={t('physicalGoalSubtitle')}
                />
            );
        }

        if (activePrimary === 1) {
            if (activeSecondary === 0) return <MentalData data={recordData} update={updateRecordData} />;
            if (activeSecondary === 1) return <MentalDiagnosis data={recordData} update={updateRecordData} />;
            if (activeSecondary === 2) return <MentalPlan data={recordData} update={updateRecordData} />;
            if (activeSecondary === 3) return (
                <GoalSetting
                    data={recordData}
                    update={updateRecordData}
                    dataKey="mentalGoals"
                    title={t('mentalGoal')}
                    subtitle={t('mentalGoalSubtitle')}
                />
            );
        }

        if (activePrimary === 2) {
            if (activeSecondary === 0) return <SkillsData data={recordData} update={updateRecordData} />;
            if (activeSecondary === 1) return <SkillsDiagnosis data={recordData} update={updateRecordData} />;
            if (activeSecondary === 2) return <SkillsPlan data={recordData} update={updateRecordData} />;
            if (activeSecondary === 3) return (
                <GoalSetting
                    data={recordData}
                    update={updateRecordData}
                    dataKey="skillsGoals"
                    title={t('skillsGoal')}
                    subtitle={t('skillsGoalSubtitle')}
                />
            );
        }

        // 默认占位
        return (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[32px] surface-weak">
                <p className="text-white/20 font-bold text-lg uppercase tracking-widest">
                    {primaryTabs[activePrimary]?.label || t('unknown')}
                </p>
                <p className="text-white/40 font-bold text-2xl mt-2 uppercase">
                    {secondaryTabs[activeSecondary]?.label || t('unknown')}
                </p>
                <p className="text-white/10 text-xs mt-4">内容开发中...</p>
            </div>
        );
    };

    return (
        <div className="min-h-screen text-white p-4 sm:p-6 pb-24 sm:pb-32 relative bg-transparent">
            {/* Header */}
            <div className="relative z-10 mb-4 sm:mb-6 flex justify-between items-center gap-2">
                <button
                    onClick={() => {
                        if (hasUnsavedChanges) {
                            setPendingNavigation({ type: 'back' });
                            setShowUnsavedDialog(true);
                            return;
                        }

                        // 返回到对应的历史测评记录页面
                        const reportPages = { 0: 'physical-report', 1: 'mental-report', 2: 'skills-report' };
                        const reportPage = reportPages[activePrimary] || 'physical-report';

                        if (navigate && student?.id) {
                            navigate(`/student/${student.id}/${reportPage}`);
                        } else if (onBack) {
                            onBack();
                        } else if (navigate) {
                            navigate(`/${reportPage}`);
                        }
                    }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full surface-weak border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors active:scale-90 shrink-0"
                >
                    <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                </button>

                {isEditingTitle ? (
                    <div className="flex items-center gap-2 flex-1 px-2 sm:px-4 min-w-0">
                        <input
                            autoFocus
                            className="bg-white/5 border border-[#d4af37]/30 rounded-lg px-2 sm:px-3 py-1 text-white text-base sm:text-lg font-bold w-full focus:outline-none focus:border-[#d4af37]"
                            value={recordData.title}
                            onChange={(e) => updateRecordData('title', e.target.value)}
                            onBlur={() => setIsEditingTitle(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                        />
                        <button onClick={() => setIsEditingTitle(false)} className="p-1 text-[#d4af37] active:scale-90 transition-transform shrink-0">
                            <Check size={18} className="sm:w-5 sm:h-5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group cursor-pointer flex-1 min-w-0" onClick={() => setIsEditingTitle(true)}>
                        <h1 className="text-lg sm:text-xl font-bold tracking-tighter text-white/90 truncate">
                            {recordData.title || t('addRecordTitle')}
                        </h1>
                        <Edit2 size={14} className="text-[#d4af37] opacity-40 group-hover:opacity-100 transition-opacity shrink-0 sm:w-4 sm:h-4" />
                    </div>
                )}

                <div className="w-9 sm:w-10 shrink-0" /> {/* Spacer */}
            </div>

            {/* 一级导航 (Stepper Style) */}
            <div className="relative z-10 mb-4 sm:mb-6 px-2 sm:px-4">
                <div className="flex relative">
                    {/* Background Line - 仅在圆圈中心之间绘制 */}
                    <div
                        className={`absolute top-[14px] sm:top-[18px] h-[2px] surface -z-10 ${styles.progressLine}`}
                        style={{
                            left: `${100 / (primaryTabs.length * 2)}%`,
                            right: `${100 / (primaryTabs.length * 2)}%`
                        }}
                    />

                    {primaryTabs.map((tab) => (
                        <div
                            key={tab.id}
                            className="flex-1 flex flex-col items-center group cursor-default"
                        >
                            <div className={`
                                w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500
                                ${activePrimary === tab.id
                                    ? 'bg-[#d4af37] border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.5)]'
                                    : activePrimary > tab.id
                                        ? 'bg-blue-500 border-blue-500'
                                        : 'bg-[#1a1a1a] border-white/20'}
                            `}>
                                {activePrimary > tab.id ? (
                                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                ) : (
                                    <span className={`text-[11px] sm:text-xs font-bold ${activePrimary === tab.id ? 'text-black' : 'text-white/40'}`}>
                                        {tab.id + 1}
                                    </span>
                                )}
                            </div>
                            {/* 为文字固定一个容器高度，防止大小切换时垂直抖动 */}
                            <div className="h-7 sm:h-8 mt-1.5 sm:mt-2 flex items-center justify-center">
                                <span className={`
                                    transition-colors duration-300 text-center leading-tight px-0.5 sm:px-1
                                    ${activePrimary === tab.id ? 'text-xs sm:text-sm font-semibold text-white' : 'text-[11px] sm:text-[12px] font-medium text-white'}
                                `}>
                                    {tab.label}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Active Progress Line */}
                    <div
                        className={`absolute top-[14px] sm:top-[18px] h-[2px] bg-[#d4af37] -z-10 ${styles.activeProgressLine}`}
                        style={{
                            left: `${100 / (primaryTabs.length * 2)}%`,
                            width: (() => {
                                if (primaryTabs.length <= 1) return '0%';
                                // 找到当前 activePrimary 在 primaryTabs 数组中的索引
                                const displayIdx = primaryTabs.findIndex(x => x.id === activePrimary);
                                const safeIdx = displayIdx < 0 ? 0 : displayIdx;
                                // 从第一个圆心开始，宽度为当前索引占总数的百分比
                                return `${(safeIdx / primaryTabs.length) * 100}%`;
                            })()
                        }}
                    />
                </div>
            </div>

            {/* 二级导航 (Sub-tabs) */}
            <div className="relative z-10 mb-4 sm:mb-6 px-2">
                <div className="flex surface-strong rounded-xl sm:rounded-2xl p-0.5 sm:p-1 border border-white/10 shadow-2xl">
                    {secondaryTabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => navigateToSecondary(tab.id)}
                            className={`
                                flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-[12px] font-bold transition-all duration-300 px-1
                                ${activeSecondary === tab.id
                                    ? 'bg-[#d4af37] text-black shadow-lg'
                                    : 'text-white/40 hover:text-white/60'}
                            `}
                        >
                            <span className="truncate block">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="relative z-10 flex-1 pb-20">
                {renderContent()}
            </div>

            {/* Bottom Save Button */}
            <div className="fixed bottom-6 sm:bottom-8 left-0 right-0 px-4 sm:px-6 z-20">
                <div className="max-w-md mx-auto">
                    {!showCompleteActions ? (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSave}
                            className="w-full h-[50px] sm:h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-base sm:text-lg uppercase tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 sm:gap-3 group transition-all px-4"
                        >
                            <span className="truncate">
                                {activeSecondary < 3
                                    ? t('saveAndContinue')
                                    : t('completeAssessment')}
                            </span>
                        </motion.button>
                    ) : (
                        <div className="w-full flex gap-2 sm:gap-3">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={async () => {
                                    if (!isNavigating) {
                                        setIsNavigating(true);

                                        // 清除 showCompleteActions 状态
                                        try {
                                            const key = getShowCompleteActionsKey();
                                            sessionStorage.removeItem(key);
                                        } catch (e) {

                                        }

                                        await handleSave();

                                        // 返回到对应的历史测评记录页面
                                        const reportPages = { 0: 'physical-report', 1: 'mental-report', 2: 'skills-report' };
                                        const reportPage = reportPages[activePrimary] || 'physical-report';

                                        if (navigate && student?.id) {
                                            navigate(`/student/${student.id}/${reportPage}`);
                                        } else if (navigate) {
                                            navigate(`/${reportPage}`);
                                        } else {
                                            onBack();
                                        }
                                    }
                                }}
                                className="flex-1 h-[50px] sm:h-[54px] rounded-full surface-weak border border-white/10 text-white/80 font-bold text-sm sm:text-lg uppercase tracking-widest transition-all px-2"
                            >
                                <span className="truncate block">{t('generateLater')}</span>
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleGenerateAIReport}
                                className="flex-1 h-[50px] sm:h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-sm sm:text-lg uppercase tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-1 sm:gap-2 transition-all px-2"
                            >
                                <span className="truncate block">{t('generateAIReport')}</span>
                            </motion.button>
                        </div>
                    )}
                </div>
            </div>

            {/* 未保存变更确认对话框 */}
            {showUnsavedDialog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="surface-strong border-2 border-[#d4af37]/30 rounded-3xl p-8 max-w-sm w-full">
                        <h3 className="text-xl font-bold text-white mb-4 text-center">{t('unsavedChangesTitle')}</h3>
                        <p className="text-white/60 text-sm mb-8 text-center">{t('unsavedChangesMessage')}</p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={async () => {
                                    await handleSave();
                                    executePendingNavigation();
                                }}
                                className="w-full py-3 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f9e29c] to-[#b8860b] text-black font-bold text-sm active:scale-95 transition-all"
                            >
                                {t('saveAndContinue')}
                            </button>
                            <button
                                onClick={() => {
                                    setHasUnsavedChanges(false);
                                    executePendingNavigation();
                                }}
                                className="w-full py-3 rounded-full surface-weak border border-white/10 text-white/80 font-bold text-sm active:scale-95 transition-all"
                            >
                                {t('leaveWithoutSaving')}
                            </button>
                            <button
                                onClick={() => {
                                    setShowUnsavedDialog(false);
                                    setPendingNavigation(null);
                                }}
                                className="w-full py-3 rounded-full surface-weak border border-white/10 text-white/60 font-bold text-sm active:scale-95 transition-all"
                            >
                                {t('cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddRecordPage;

