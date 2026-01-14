import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Brain, ClipboardList, Target, Zap, Quote, HelpCircle, AlertTriangle, Sparkles, Target as TargetIcon, ShieldCheck, ChevronDown, ArrowRight } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../utils/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { TextSection, DynamicSection } from '../../components/reports/ReportSharedComponents';
import RadarChart from '../../components/reports/RadarChart';
import { createAssessment } from '../assessment/utils/assessmentApi';
import { diagnosesToRadarGradeData } from '../../utils/diagnosesToRadar';
import { createAIReport, getBackendLang } from './utils/aiReportApi';

const MentalReportDetailPage = ({ onBack, student }) => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const passedTitle = location.state?.title || location.state?.assessmentData?.title;
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedMetrics, setExpandedMetrics] = useState({});
    const [continueTestInfo, setContinueTestInfo] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);
    const [isCreatingAIReport, setIsCreatingAIReport] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [oldReportData, setOldReportData] = useState(null);
    const [newReportData, setNewReportData] = useState(null);
    // 每个部分的选择状态：'old' | 'new' | null
    const [selectedVersions, setSelectedVersions] = useState({
        trainingGoals: null,
        qualityAssessment: null,
        trainingOutlook: null
    });
    // 用于防止重复加载的 Ref
    const lastFetchedIdRef = useRef(null);

    // 从后端获取真实数据
    useEffect(() => {
        const fetchReportData = async () => {
            if (!id) return;

            // 防止重复加载相同 ID 的报告
            if (lastFetchedIdRef.current === id && reloadToken === 0) return;
            lastFetchedIdRef.current = id;

            setLoading(true);
            try {
                const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).token : '';
                const headers = { 'Authorization': `Bearer ${token}` };

                // 使用新的 AI Report 接口
                const response = await fetch(`/api/AIReport/${id}`, { headers });

                // 处理后端返回 200 但提示“找不到记录”的情况，或者 404
                let data = null;
                if (response.ok) {
                    data = await response.json();
                }

                if (response.status === 404 || (data && data.message === '找不到记录')) {
                    console.log('[MentalReportDetailPage] AI report not found, creating empty report');
                    const { createAIReport } = await import('./utils/aiReportApi');

                    // 创建空的 AI 报告
                    const created = await createAIReport(id);
                    if (created) {
                        console.log('[MentalReportDetailPage] Empty AI report created, reloading...');
                        // 重新加载报告数据
                        setReloadToken(token => token + 1);
                        return;
                    } else {
                        console.error('[MentalReportDetailPage] Failed to create AI report');
                        setReportData(null);
                        setLoading(false);
                        return;
                    }
                }

                if (!response.ok) throw new Error('Failed to fetch AI report data');

                // Fetch diagnoses grades for radar chart
                let diagnosesGradeData = null;
                try {
                    const diagnosesRes = await fetch(`/api/diagnoses/${id}`, { headers });
                    if (diagnosesRes.ok) {
                        const diagnosesJson = await diagnosesRes.json();
                        const mapped = diagnosesToRadarGradeData(diagnosesJson, 'mental');
                        if (mapped.totalCount > 0) {
                            diagnosesGradeData = mapped; // 新格式: {labels: [], values: []}
                        }
                    }
                } catch (e) {
                    console.warn('Failed to fetch diagnoses:', e);
                }

                // 获取当前语言环境
                const currentLanguage = localStorage.getItem('language') || 'zh';
                const isEnglish = currentLanguage === 'en';

                // 辅助函数：获取本地化字段
                const getLocalizedField = (fieldName) => {
                    return isEnglish ? (data[`${fieldName}_en`] || data[fieldName]) : data[fieldName];
                };

                // 辅助函数：解析文本为结构化数组
                const parseTextToSections = (text) => {
                    if (!text) return [];
                    const sections = [];
                    const regex = /【([^】]+)】([^【]*)/g;
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        sections.push({
                            title: match[1].trim(),
                            content: match[2].trim()
                        });
                    }
                    if (sections.length === 0 && text.trim()) {
                        sections.push({
                            title: t('mentalAssessment') || '心理评估',
                            content: text.trim()
                        });
                    }
                    return sections;
                };

                // 雷达图数据：优先使用 diagnoses 的数据；失败则 fallback 到 AIReport.grade
                let gradeData;
                if (diagnosesGradeData) {
                    gradeData = diagnosesGradeData; // 新格式: {labels: [], values: []}
                } else {
                    // fallback到旧格式
                    const rawGrade = data.grade || {};
                    gradeData = {
                        focus: 0,
                        stability: 0,
                        confidence: 0,
                        ...rawGrade
                    };
                }

                // 处理目标数据（注意：中文版本使用中文键名，英文版本使用英文键名）
                const goalData = isEnglish ? data.goal_en : data.goal;
                const trainingGoals = [];
                if (goalData) {
                    // 英文版本
                    if (isEnglish) {
                        if (goalData.long_term) {
                            trainingGoals.push({
                                title: t('longTermGoal') || 'Long-term Goal',
                                content: goalData.long_term
                            });
                        }
                        if (goalData.short_term) {
                            trainingGoals.push({
                                title: t('shortTermGoal') || 'Short-term Goal',
                                content: goalData.short_term
                            });
                        }
                    }
                    // 中文版本（使用中文键名）
                    else {
                        if (goalData['长期目标'] || goalData.long_term) {
                            trainingGoals.push({
                                title: t('longTermGoal') || '长期目标',
                                content: goalData['长期目标'] || goalData.long_term
                            });
                        }
                        if (goalData['短期目标'] || goalData.short_term) {
                            trainingGoals.push({
                                title: t('shortTermGoal') || '短期目标',
                                content: goalData['短期目标'] || goalData.short_term
                            });
                        }
                    }
                }

                // 处理诊断数据 - 解析文本
                const diagnosisText = getLocalizedField('fitness_diagnosis');
                const diagnosisSections = parseTextToSections(diagnosisText);

                // 处理训练计划 - 解析文本
                const trainingPlanText = getLocalizedField('training_plan');
                const planSections = parseTextToSections(trainingPlanText);

                // 心理指标数据 - 从 AIReport 接口的 grade 数据中获取，或使用默认值
                const mentalMetrics = {
                    focus: gradeData.focus || '-',
                    stability: gradeData.stability || '-',
                    confidence: gradeData.confidence || '-'
                };

                // 组装数据
                setReportData({
                    id: id,
                    aiReportId: data.id || data.report_id || id,
                    studentId: data.student_id,
                    title: passedTitle || t('mentalReportTitle'),
                    date: data.created_at ? new Date(data.created_at).toLocaleDateString() : new Date().toLocaleDateString(),

                    // 训练引言
                    trainingIntroduction: getLocalizedField('report_intro'),

                    // 雷达图数据
                    gradeData: gradeData,

                    // 心理素质指标
                    mentalMetricsGroups: [
                        {
                            title: t('coreMentalQualities') || "核心心理素质",
                            items: [
                                { label: t('focusAbility') || '专注力', value: mentalMetrics.focus, unit: '/ 100' },
                                { label: t('mentalResilience') || '心理韧性', value: mentalMetrics.stability, unit: '/ 100' },
                                { label: t('confidenceAndMotivation') || '自信与动力', value: mentalMetrics.confidence, unit: '/ 100' }
                            ]
                        }
                    ],

                    // 训练目标
                    trainingGoals: trainingGoals,
                    goalSettingReason: '',

                    // 诊断评估
                    qualityAssessment: diagnosisSections.length > 0
                        ? diagnosisSections.map(section => ({
                            title: section.title,
                            level: t('pendingEvaluation') || '待评估',
                            description: section.content
                        }))
                        : [{
                            title: t('mentalAssessment') || '心理评估',
                            level: t('pendingEvaluation') || '待评估',
                            description: diagnosisText || t('evaluationByTest')
                        }],

                    // 训练计划内容
                    coreTrainingContent: planSections.filter(s => !s.title.includes('风险') && !s.title.includes('回报')),
                    potentialRisks: planSections.find(s => s.title.includes('风险') || s.title.includes('警示'))?.content || '',
                    trainingOutlook: trainingPlanText || t('mentalBenefitsDefault')
                });
            } catch (error) {
                console.error('Error fetching mental report:', error);
                setReportData({
                    title: t('reportLoadFailed'),
                    mentalMetrics: [],
                    trainingGoals: [],
                    qualityAssessment: [],
                    coreTrainingContent: [],
                    trainingOutlook: ''
                });
            } finally {
                // 保证动画至少显示 2 秒
                setTimeout(() => {
                    setLoading(false);
                }, 2000);
            }
        };

        fetchReportData();
    }, [id, t, reloadToken]);

    const handleGenerateAIReport = async () => {
        if (!id || loading || isCreatingAIReport) return;

        setIsCreatingAIReport(true);
        setLoading(true);
        try {
            const userJson = localStorage.getItem('user');
            const user = userJson ? JSON.parse(userJson) : null;
            const token = user?.token || '';
            const headers = { 'Authorization': `Bearer ${token}` };

            // 直接使用 singleAssess 接口
            const response = await fetch(`/api/singleAssess/${id}`, { headers });

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(errorText || `Failed to fetch assessment data (${response.status})`);
            }

            const data = await response.json();
            console.log('[MentalReportDetailPage] Single assessment data:', data);

            setReloadToken(token => token + 1);
        } catch (error) {
            console.error('Failed to fetch single assessment:', error);
            alert(error?.message || '生成AI报告失败');
            setLoading(false);
        } finally {
            setIsCreatingAIReport(false);
        }
    };

    // 检查是否需要继续完整测试
    useEffect(() => {
        const checkContinueTest = () => {
            if (location.state?.continueCompleteTest) {
                setContinueTestInfo({
                    nextPrimary: location.state.nextPrimary,
                    assessmentData: location.state.assessmentData,
                    student: location.state.student
                });
                return;
            }

            try {
                const saved = sessionStorage.getItem('continueCompleteTest');
                if (saved) {
                    const data = JSON.parse(saved);
                    setContinueTestInfo(data);
                    sessionStorage.removeItem('continueCompleteTest');
                }
            } catch (e) {
                console.error('Failed to parse continue test data:', e);
            }
        };

        checkContinueTest();
    }, [location]);

    const handleContinueNextTest = async () => {
        if (!continueTestInfo) return;

        try {
            const TYPE_MAP = ['physical', 'mental', 'skills'];
            const nextType = TYPE_MAP[continueTestInfo.nextPrimary];
            const routeType = nextType === 'skills' ? 'technique' : nextType;
            const studentId = student?.id || continueTestInfo.student?.id;

            const userJson = localStorage.getItem('user');
            const user = userJson ? JSON.parse(userJson) : null;

            // 关键修改：点击继续下一项之前，先创建 assessment 记录
            let defaultTitle = continueTestInfo.title;
            if (!defaultTitle) {
                const titleMap = {
                    'mental': '心理测评',
                    'skills': '技能测评',
                    'technique': '技能测评'
                };
                defaultTitle = titleMap[nextType] || (nextType === 'mental' ? t('mentalAssessment') : t('skillsAssessment'));
            }
            const backendLang = t('langCode') || 'cn';

            const nextAssessmentId = await createAssessment(
                studentId,
                nextType === 'skills' ? 'technique' : nextType,
                user,
                defaultTitle,
                backendLang
            );

            if (nextAssessmentId) {
                // 清除下一项测评的旧草稿和状态
                const userId = user?.id || 'guest';
                localStorage.removeItem(`draft_${userId}_${studentId}_${nextType}`);
                sessionStorage.removeItem(`showCompleteActions_${studentId}_${nextType}`);
                sessionStorage.removeItem(`showCompleteActions_${studentId}_${routeType}`);

                const nextAssessmentData = {
                    ...(continueTestInfo.assessmentData || {}),
                    assessment_id: nextAssessmentId,
                    id: nextAssessmentId,
                    type: nextType
                };

                navigate(`/add-record/${routeType}/data`, {
                    state: {
                        assessmentData: nextAssessmentData,
                        student: continueTestInfo.student || student
                    }
                });
            } else {
                alert('创建下一项测评记录失败');
            }
        } catch (error) {
            console.error('Failed to create next assessment:', error);
        }
    };

    const toggleMetric = (title) => {
        setExpandedMetrics(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    const handleBack = () => {
        // 返回到历史测评列表页面
        const backStudentId =
            reportData?.studentId ||
            student?.id ||
            location.state?.studentId ||
            location.state?.student?.id;

        if (backStudentId) {
            navigate(`/student/${backStudentId}/mental-report`);
            return;
        }

        if (onBack) {
            onBack();
            return;
        }

        navigate('/mental-report');
    };

    const handleSaveAndGoHome = () => {
        // 保存并返回对应学员的测评工作台
        if (reportData?.studentId) {
            navigate(`/student/${reportData.studentId}`);
        } else if (student?.id) {
            navigate(`/student/${student.id}`);
        } else {
            navigate('/');
        }
    };

    // 选择某个部分的版本
    const handleSelectVersion = (section, version) => {
        setSelectedVersions(prev => ({
            ...prev,
            [section]: version
        }));
    };

    // 检查是否所有部分都已选择
    const allSectionsSelected = () => {
        if (!showComparison || !newReportData) return false;
        return selectedVersions.trainingGoals !== null &&
            selectedVersions.qualityAssessment !== null &&
            selectedVersions.trainingOutlook !== null;
    };

    // 保存自定义版本
    const handleSaveCustomVersion = async () => {
        if (!allSectionsSelected() || !id || !reportData?.aiReportId) {
            console.warn('[handleSaveCustomVersion] Missing required data:', {
                allSectionsSelected: allSectionsSelected(),
                id,
                aiReportId: reportData?.aiReportId
            });
            return;
        }

        setIsCreatingAIReport(true);
        try {
            const userJson = localStorage.getItem('user');
            const user = userJson ? JSON.parse(userJson) : null;
            const token = user?.token || '';
            const backendLang = getBackendLang();

            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            // 确保有有效的 report_id
            let reportId = reportData.aiReportId;
            if (!reportId || reportId === id) {
                // 如果 aiReportId 实际上是 assessment_id，需要获取真实的 report_id
                try {
                    const aiGetRes = await fetch(`/api/AIReport/${id}`, { headers });
                    if (aiGetRes.ok) {
                        const aiData = await aiGetRes.json();
                        // 如果后端返回 200 但提示“找不到记录”
                        if (aiData?.message === '找不到记录') {
                            throw new Error('报告不存在，请先点击"重新生成"按钮生成报告');
                        }
                        reportId = aiData?.id || aiData?.report_id || aiData?.report?.id || null;
                        if (!reportId) {
                            console.warn('[handleSaveCustomVersion] Report exists but no report_id found. Report may need to be regenerated first.');
                        }
                    } else if (aiGetRes.status === 404) {
                        throw new Error('报告不存在，请先点击"重新生成"按钮生成报告');
                    }
                } catch (e) {
                    console.error('[handleSaveCustomVersion] Failed to fetch report:', e);
                }

                // 如果仍然没有 report_id，抛出错误
                if (!reportId) {
                    throw new Error('无法获取报告ID，请先点击"重新生成"按钮生成报告');
                }
            }

            // 获取现有报告数据（用于构建完整的 PATCH 请求体）
            let aiReportPayload = null;
            if (reportId) {
                try {
                    const existingRes = await fetch(`/api/AIReport/${id}`, { headers });
                    if (existingRes.ok) {
                        aiReportPayload = await existingRes.json();
                    }
                } catch (e) {
                    console.warn('[handleSaveCustomVersion] Failed to fetch existing report data:', e);
                }
            }

            // 根据选择构建最终数据
            const finalTrainingGoals = selectedVersions.trainingGoals === 'new'
                ? newReportData.trainingGoals
                : oldReportData.trainingGoals;

            const finalQualityAssessment = selectedVersions.qualityAssessment === 'new'
                ? newReportData.qualityAssessment
                : oldReportData.qualityAssessment;

            const finalTrainingOutlook = selectedVersions.trainingOutlook === 'new'
                ? newReportData.trainingOutlook
                : oldReportData.trainingOutlook;

            // 构建目标数据
            const goalData = {};
            finalTrainingGoals.forEach(goal => {
                const title = goal.title || '';
                const content = goal.content || '';
                if (title.includes('长期') || title.includes('Long-term') || title.toLowerCase().includes('long')) {
                    goalData['长期目标'] = content;
                    goalData.long_term = content;
                } else if (title.includes('短期') || title.includes('Short-term') || title.toLowerCase().includes('short')) {
                    goalData['短期目标'] = content;
                    goalData.short_term = content;
                }
            });

            if (Object.keys(goalData).length === 0 && finalTrainingGoals.length > 0) {
                if (finalTrainingGoals.length >= 1) {
                    goalData['长期目标'] = finalTrainingGoals[0].content || '';
                    goalData.long_term = finalTrainingGoals[0].content || '';
                }
                if (finalTrainingGoals.length >= 2) {
                    goalData['短期目标'] = finalTrainingGoals[1].content || '';
                    goalData.short_term = finalTrainingGoals[1].content || '';
                }
            }

            // 构建诊断数据
            const diagnosisText = finalQualityAssessment.map(item =>
                `【${item.title}】${item.description}`
            ).join('\n');

            // 构建训练计划数据
            const trainingPlanText = finalTrainingOutlook || '';

            // 构建 PATCH 请求体
            const basePatch = {
                assessment_id: id,
                report_id: reportId,
                language: backendLang,
                report_intro: aiReportPayload?.report_intro,
                goal: goalData,
                fitness_diagnosis: diagnosisText,
                training_plan: trainingPlanText,
                report_intro_en: aiReportPayload?.report_intro_en,
                goal_en: undefined,
                fitness_diagnosis_en: undefined,
                training_plan_en: undefined
            };

            if (backendLang === 'en') {
                const goalEn = {};
                finalTrainingGoals.forEach(goal => {
                    if (goal.title.includes('长期') || goal.title.includes('Long-term')) {
                        goalEn.long_term = goal.content;
                    } else if (goal.title.includes('短期') || goal.title.includes('Short-term')) {
                        goalEn.short_term = goal.content;
                    }
                });
                basePatch.goal_en = goalEn;
                basePatch.fitness_diagnosis_en = diagnosisText;
                basePatch.training_plan_en = trainingPlanText;
            } else {
                if (aiReportPayload?.goal_en) {
                    basePatch.goal_en = aiReportPayload.goal_en;
                }
                if (aiReportPayload?.fitness_diagnosis_en) {
                    basePatch.fitness_diagnosis_en = aiReportPayload.fitness_diagnosis_en;
                }
                if (aiReportPayload?.training_plan_en) {
                    basePatch.training_plan_en = aiReportPayload.training_plan_en;
                }
            }

            const patchBody = Object.entries(basePatch).reduce((acc, [k, v]) => {
                if (v !== undefined && v !== null) acc[k] = v;
                return acc;
            }, {});

            const response = await fetch('/api/AIReport', {
                method: 'PATCH',
                headers,
                body: JSON.stringify(patchBody)
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(errorText || `保存自定义版本失败 (${response.status})`);
            }

            // 更新本地报告数据
            setReportData(prev => ({
                ...prev,
                trainingGoals: finalTrainingGoals,
                qualityAssessment: finalQualityAssessment,
                trainingOutlook: finalTrainingOutlook
            }));

            // 退出对比模式
            setShowComparison(false);
            setOldReportData(null);
            setNewReportData(null);
            setSelectedVersions({
                trainingGoals: null,
                qualityAssessment: null,
                trainingOutlook: null
            });
        } catch (error) {
            console.error('Failed to save custom version:', error);
            alert(error?.message || '保存自定义版本失败');
        } finally {
            setIsCreatingAIReport(false);
        }
    };

    // 选择使用新报告（全部使用新版本）
    const handleUseNewReport = () => {
        if (newReportData) {
            setReportData(prev => ({
                ...prev,
                trainingGoals: newReportData.trainingGoals,
                qualityAssessment: newReportData.qualityAssessment,
                trainingOutlook: newReportData.trainingOutlook
            }));
            setShowComparison(false);
            setOldReportData(null);
            setNewReportData(null);
            setSelectedVersions({
                trainingGoals: null,
                qualityAssessment: null,
                trainingOutlook: null
            });
        }
    };

    // 选择保留旧报告（全部使用旧版本）
    const handleKeepOldReport = () => {
        setShowComparison(false);
        setOldReportData(null);
        setNewReportData(null);
        setSelectedVersions({
            trainingGoals: null,
            qualityAssessment: null,
            trainingOutlook: null
        });
    };

    const handleRegenerate = async () => {
        if (!id || loading || isCreatingAIReport) return;

        setIsCreatingAIReport(true);
        setLoading(true);

        try {
            const userJson = localStorage.getItem('user');
            const user = userJson ? JSON.parse(userJson) : null;
            const token = user?.token || '';
            const backendLang = getBackendLang();

            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            // 先获取现有诊断内容，PATCH 时带上
            let diagnosisContent = [];
            try {
                const diagGetRes = await fetch(`/api/diagnoses/${id}`, { headers });
                if (diagGetRes.ok) {
                    const diagData = await diagGetRes.json();
                    diagnosisContent = (diagData?.content || []).map(item => ({
                        title: item.title || '',
                        grade: item.grade || item.level || 'L1',
                        content: item.content || ''
                    }));
                }
            } catch (e) {
                console.warn('Failed to fetch diagnoses before regenerate', e);
            }

            // 确保有可用的 AI 报告 ID；若不存在则先创建再拉取，同时保留原始 AI 报告内容供 PATCH 使用
            let aiReportId = reportData?.aiReportId || null;
            let aiReportPayload = null;
            try {
                const fetchAIReportId = async () => {
                    const aiGetRes = await fetch(`/api/AIReport/${id}`, { headers });
                    if (aiGetRes.ok) {
                        const aiData = await aiGetRes.json();
                        // 如果后端返回 200 但提示“找不到记录”
                        if (aiData?.message === '找不到记录') return null;

                        aiReportPayload = aiData;
                        const resolved = aiData?.id || aiData?.report_id || aiData?.report?.id || null;
                        console.log('[Mental] AI report GET resolved id:', resolved, 'raw:', aiData);
                        return resolved;
                    }
                    if (aiGetRes.status === 404) {
                        return null;
                    }
                    const txt = await aiGetRes.text().catch(() => '');
                    throw new Error(txt || '获取 AI 报告失败');
                };

                aiReportId = await fetchAIReportId();

                if (!aiReportId) {
                    const created = await createAIReport(id, { token, language: backendLang });
                    if (created?.id) {
                        aiReportId = created.id;
                        console.log('[Mental] AI report created with id:', aiReportId);
                        aiReportPayload = created;
                    } else if (created?.report?.id) {
                        aiReportId = created.report.id;
                        console.log('[Mental] AI report created (nested) id:', aiReportId);
                        aiReportPayload = created.report;
                    } else if (created?.old_report_id) {
                        aiReportId = created.old_report_id;
                        console.log('[Mental] AI report created (old_report_id) id:', aiReportId);
                        aiReportPayload = created.report || null;
                    }
                    if (!aiReportId) aiReportId = await fetchAIReportId();
                }
            } catch (e) {
                console.warn('Failed to ensure AI report exists before regenerate', e);
            }

            if (!aiReportId) {
                alert('未能获取 AI 报告记录，无法重新生成。请确认该测评已存在 AI 报告或联系后台支持。');
                setLoading(false);
                setIsCreatingAIReport(false);
                return;
            }

            const diagnosesRes = await fetch('/api/diagnoses', {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    assessment_id: id,
                    content: diagnosisContent,
                    language: backendLang
                })
            });

            if (!diagnosesRes.ok) {
                const msg = await diagnosesRes.text().catch(() => '');
                throw new Error(msg || '重新生成诊断失败');
            }

            // 构造 PATCH 体：带上已有字段，避免后端 “no fields to update”
            const basePatch = {
                assessment_id: id,
                report_id: aiReportId,
                language: backendLang,
                report_intro: aiReportPayload?.report_intro,
                goal: aiReportPayload?.goal,
                fitness_diagnosis: aiReportPayload?.fitness_diagnosis,
                training_plan: aiReportPayload?.training_plan,
                report_intro_en: aiReportPayload?.report_intro_en,
                goal_en: aiReportPayload?.goal_en,
                fitness_diagnosis_en: aiReportPayload?.fitness_diagnosis_en,
                training_plan_en: aiReportPayload?.training_plan_en,
            };

            const patchBody = Object.entries(basePatch).reduce((acc, [k, v]) => {
                if (v !== undefined && v !== null) acc[k] = v;
                return acc;
            }, {});

            const aiReportRes = await fetch('/api/AIReport', {
                method: 'PATCH',
                headers,
                body: JSON.stringify(patchBody)
            });

            if (!aiReportRes.ok) {
                const msg = await aiReportRes.text().catch(() => '');
                throw new Error(msg || '重新生成AI报告失败');
            }

            // 保存当前报告数据作为旧报告
            const currentReportData = reportData;
            setOldReportData(currentReportData);

            // 获取新生成的报告数据
            const newReportResponse = await fetch(`/api/AIReport/${id}`, { headers });
            if (!newReportResponse.ok) {
                throw new Error('获取新报告数据失败');
            }

            const newReportRaw = await newReportResponse.json();

            // 处理新报告数据（复用 fetchReportData 中的逻辑）
            const currentLanguage = localStorage.getItem('language') || 'zh';
            const isEnglish = currentLanguage === 'en';
            const getLocalizedField = (fieldName) => {
                return isEnglish ? (newReportRaw[`${fieldName}_en`] || newReportRaw[fieldName]) : newReportRaw[fieldName];
            };
            const parseTextToSections = (text) => {
                if (!text) return [];
                const sections = [];
                const regex = /【([^】]+)】([^【]*)/g;
                let match;
                while ((match = regex.exec(text)) !== null) {
                    sections.push({
                        title: match[1].trim(),
                        content: match[2].trim()
                    });
                }
                if (sections.length === 0 && text.trim()) {
                    sections.push({
                        title: t('mentalAssessment') || '心理评估',
                        content: text.trim()
                    });
                }
                return sections;
            };

            // 处理目标数据
            const goalData = isEnglish ? newReportRaw.goal_en : newReportRaw.goal;
            const trainingGoals = [];
            if (goalData) {
                if (isEnglish) {
                    if (goalData.long_term) {
                        trainingGoals.push({
                            title: t('longTermGoal') || 'Long-term Goal',
                            content: goalData.long_term
                        });
                    }
                    if (goalData.short_term) {
                        trainingGoals.push({
                            title: t('shortTermGoal') || 'Short-term Goal',
                            content: goalData.short_term
                        });
                    }
                } else {
                    if (goalData['长期目标'] || goalData.long_term) {
                        trainingGoals.push({
                            title: t('longTermGoal') || '长期目标',
                            content: goalData['长期目标'] || goalData.long_term
                        });
                    }
                    if (goalData['短期目标'] || goalData.short_term) {
                        trainingGoals.push({
                            title: t('shortTermGoal') || '短期目标',
                            content: goalData['短期目标'] || goalData.short_term
                        });
                    }
                }
            }

            // 处理诊断数据
            const diagnosisText = getLocalizedField('fitness_diagnosis');
            const diagnosisSections = parseTextToSections(diagnosisText);

            // 处理训练计划
            const trainingPlanText = getLocalizedField('training_plan');
            const planSections = parseTextToSections(trainingPlanText);

            // 组装新报告数据（只包含需要对比的3个部分）
            const processedNewReport = {
                trainingGoals: trainingGoals,
                qualityAssessment: diagnosisSections.length > 0
                    ? diagnosisSections.map(section => ({
                        title: section.title,
                        description: section.content
                    }))
                    : [],
                trainingOutlook: trainingPlanText || t('mentalBenefitsDefault')
            };

            setNewReportData(processedNewReport);
            setShowComparison(true);
            // 重置选择状态
            setSelectedVersions({
                trainingGoals: null,
                qualityAssessment: null,
                trainingOutlook: null
            });

            // 更新 reportData 中的 aiReportId（使用重新生成时获取的 aiReportId）
            if (aiReportId && aiReportId !== id) {
                setReportData(prev => ({
                    ...prev,
                    aiReportId: aiReportId
                }));
            }

            setLoading(false);
        } catch (error) {
            console.error('Failed to regenerate report:', error);
            alert(error?.message || '重新生成失败');
            setLoading(false);
        } finally {
            setIsCreatingAIReport(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen text-white p-6 flex items-center justify-center bg-transparent">
                <div className="text-center">
                    <div className="logo-progress-container">
                        {/* 灰色底层logo */}
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="logo-progress-base"
                        />
                        {/* 金色填充logo（从下到上动画） */}
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="logo-progress-fill"
                        />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">
                        {t('generatingAIReport')}
                    </h2>
                    <p className="text-white/60 text-sm">
                        {t('analyzingData')}
                    </p>
                </div>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="report-empty">
                <Sparkles className="w-12 h-12 text-[#d4af37] mb-4" />
                <p className="report-empty-title">还未生成AI报告</p>
                <p className="text-white/60 text-sm mb-6">请点击下方按钮生成智能分析报告</p>
                <div className="flex gap-3">
                    <button
                        onClick={handleBack}
                        className="px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 transition-all"
                    >
                        {t('backToList')}
                    </button>
                    <button
                        onClick={handleGenerateReport}
                        disabled={generating}
                        className="px-6 py-3 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-sm shadow-[0_10px_20px_rgba(212,175,55,0.3)] flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>{generating ? '生成中...' : '生成AI报告'}</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`report-detail-page ${showComparison ? 'pb-32 sm:pb-40' : ''}`}>
            {/* Header */}
            <div className="report-detail-header">
                <button
                    onClick={handleBack}
                    className="btn-back shrink-0"
                >
                    <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                </button>
                <h1 className="report-detail-title">{passedTitle || reportData.title}</h1>
            </div>

            <div className="report-detail-content">
                {/* 训练引言 */}
                {reportData.trainingIntroduction && (
                    <TextSection
                        title={t('trainingIntroductionTitle')}
                        icon={Quote}
                        content={reportData.trainingIntroduction}
                    />
                )}

                {/* 雷达图 - 心理素质评估 */}
                <RadarChart
                    data={reportData.gradeData}
                    type="mental"
                />

                {/* 心理素质数据采集 */}
                {reportData.mentalMetrics && reportData.mentalMetrics.length > 0 && (
                    <div className="report-section">
                        <div className="report-metrics-grid">
                            {reportData.mentalMetrics.map((metric, idx) => (
                                <div key={idx} className="report-metric-card">
                                    <div className="report-metric-left">
                                        <div className="report-metric-icon">
                                            {metric.icon}
                                        </div>
                                        <div>
                                            <h4 className="report-field-label !text-white">
                                                {metric.label}
                                            </h4>
                                        </div>
                                    </div>
                                    <div className="report-metric-value-row">
                                        <span className="report-field-value !text-xl sm:!text-2xl">
                                            {metric.value}
                                        </span>
                                        <span className="report-field-unit">
                                            {metric.unit}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 训练目标 */}
                {reportData.trainingGoals && reportData.trainingGoals.length > 0 && (
                    <div className="report-section">
                        <div className="mb-4 sm:mb-8 flex flex-col gap-1">
                            <h2 className="text-[16px] sm:text-[20px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#d4af37]">
                                {t('trainingGoalsTitle')}
                            </h2>
                            <div className="h-[2px] w-12 sm:w-20 bg-gradient-to-r from-[#d4af37] to-transparent"></div>
                        </div>
                        {/* 旧版本 */}
                        <div className={`report-card relative ${showComparison && selectedVersions.trainingGoals === 'old' ? 'ring-2 ring-[#d4af37]' : ''}`}>
                            {showComparison && (
                                <button
                                    onClick={() => handleSelectVersion('trainingGoals', 'old')}
                                    className={`absolute top-2 right-2 z-20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${selectedVersions.trainingGoals === 'old'
                                        ? 'bg-[#d4af37] text-black'
                                        : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {selectedVersions.trainingGoals === 'old' ? '已选中' : '选择'}
                                </button>
                            )}
                            {reportData.trainingGoals.map((goal, idx) => (
                                <div key={idx}>
                                    <div className="report-list-item group">
                                        <div className="report-list-item-body">
                                            <div className="report-list-row">
                                                <div className="report-bullet"></div>
                                                <div>
                                                    <h3 className="report-item-title">{goal.title}</h3>
                                                    <p className="report-item-text">{goal.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="report-list-hover-bg"></div>
                                    </div>
                                    {idx < reportData.trainingGoals.length - 1 && (
                                        <div className="report-list-divider"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {/* 新版本对比（如果存在） */}
                        {showComparison && newReportData?.trainingGoals && newReportData.trainingGoals.length > 0 && (
                            <>
                                <div className="mt-4 sm:mt-6 mb-2 sm:mb-3 px-2">
                                    <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent"></div>
                                    <div className="mt-2 text-xs sm:text-sm text-[#d4af37]/80 font-bold uppercase tracking-widest text-center">
                                        新版本
                                    </div>
                                </div>
                                <div className={`report-card border border-[#d4af37]/30 bg-[#d4af37]/10 relative ${selectedVersions.trainingGoals === 'new' ? 'ring-2 ring-[#d4af37]' : ''}`}>
                                    {showComparison && (
                                        <button
                                            onClick={() => handleSelectVersion('trainingGoals', 'new')}
                                            className={`absolute top-2 right-2 z-20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${selectedVersions.trainingGoals === 'new'
                                                ? 'bg-[#d4af37] text-black'
                                                : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                                                }`}
                                        >
                                            {selectedVersions.trainingGoals === 'new' ? '已选中' : '选择'}
                                        </button>
                                    )}
                                    {newReportData.trainingGoals.map((goal, idx) => (
                                        <div key={idx}>
                                            <div className="report-list-item group">
                                                <div className="report-list-item-body">
                                                    <div className="report-list-row">
                                                        <div className="report-bullet"></div>
                                                        <div>
                                                            <h3 className="report-item-title">{goal.title}</h3>
                                                            <p className="report-item-text">{goal.content}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="report-list-hover-bg"></div>
                                            </div>
                                            {idx < newReportData.trainingGoals.length - 1 && (
                                                <div className="report-list-divider"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* 心理情况测评诊断 */}
                {reportData.qualityAssessment && reportData.qualityAssessment.length > 0 && (
                    <div className="report-section">
                        <div className="mb-4 sm:mb-8 flex flex-col gap-1">
                            <h2 className="text-[16px] sm:text-[20px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#d4af37]">
                                {t('mentalAssessmentDiagnosisTitle')}
                            </h2>
                            <div className="h-[2px] w-12 sm:w-20 bg-gradient-to-r from-[#d4af37] to-transparent"></div>
                        </div>
                        {/* 旧版本 */}
                        <div className={`report-card relative ${showComparison && selectedVersions.qualityAssessment === 'old' ? 'ring-2 ring-[#d4af37]' : ''}`}>
                            {showComparison && (
                                <button
                                    onClick={() => handleSelectVersion('qualityAssessment', 'old')}
                                    className={`absolute top-2 right-2 z-20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${selectedVersions.qualityAssessment === 'old'
                                        ? 'bg-[#d4af37] text-black'
                                        : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                                        }`}
                                >
                                    {selectedVersions.qualityAssessment === 'old' ? '已选中' : '选择'}
                                </button>
                            )}
                            {reportData.qualityAssessment.map((item, idx) => (
                                <div key={idx}>
                                    <div className="report-list-item group">
                                        <div className="report-list-item-body">
                                            <div className="report-list-row">
                                                <div className="report-bullet"></div>
                                                <div className="flex-1">
                                                    <div className="report-item-header-row">
                                                        <h3 className="report-item-title !mb-0">{item.title}</h3>
                                                    </div>
                                                    <p className="report-item-text">{item.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="report-list-hover-bg"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* 新版本对比（如果存在） */}
                        {showComparison && newReportData?.qualityAssessment && newReportData.qualityAssessment.length > 0 && (
                            <>
                                <div className="mt-4 sm:mt-6 mb-2 sm:mb-3 px-2">
                                    <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent"></div>
                                    <div className="mt-2 text-xs sm:text-sm text-[#d4af37]/80 font-bold uppercase tracking-widest text-center">
                                        新版本
                                    </div>
                                </div>
                                <div className={`report-card border border-[#d4af37]/30 bg-[#d4af37]/10 relative ${selectedVersions.qualityAssessment === 'new' ? 'ring-2 ring-[#d4af37]' : ''}`}>
                                    {showComparison && (
                                        <button
                                            onClick={() => handleSelectVersion('qualityAssessment', 'new')}
                                            className={`absolute top-2 right-2 z-20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${selectedVersions.qualityAssessment === 'new'
                                                ? 'bg-[#d4af37] text-black'
                                                : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                                                }`}
                                        >
                                            {selectedVersions.qualityAssessment === 'new' ? '已选中' : '选择'}
                                        </button>
                                    )}
                                    {newReportData.qualityAssessment.map((item, idx) => (
                                        <div key={idx}>
                                            <div className="report-list-item group">
                                                <div className="report-list-item-body">
                                                    <div className="report-list-row">
                                                        <div className="report-bullet"></div>
                                                        <div className="flex-1">
                                                            <div className="report-item-header-row">
                                                                <h3 className="report-item-title !mb-0">{item.title}</h3>
                                                            </div>
                                                            <p className="report-item-text">{item.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="report-list-hover-bg"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* 训练计划及展望 */}
                <div className="report-section">
                    {reportData.trainingOutlook && (
                        <div>
                            <div className="mb-4 sm:mb-8 flex flex-col gap-1">
                                <h2 className="text-[16px] sm:text-[20px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#d4af37]">
                                    {t('trainingPlanAndOutlookTitle')}
                                </h2>
                                <div className="h-[2px] w-12 sm:w-20 bg-gradient-to-r from-[#d4af37] to-transparent"></div>
                            </div>
                            {/* 旧版本 */}
                            <div className={`report-outlook-card relative ${showComparison && selectedVersions.trainingOutlook === 'old' ? 'ring-2 ring-[#d4af37]' : ''}`}>
                                {showComparison && (
                                    <button
                                        onClick={() => handleSelectVersion('trainingOutlook', 'old')}
                                        className={`absolute top-2 right-2 z-20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${selectedVersions.trainingOutlook === 'old'
                                            ? 'bg-[#d4af37] text-black'
                                            : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                                            }`}
                                    >
                                        {selectedVersions.trainingOutlook === 'old' ? '已选中' : '选择'}
                                    </button>
                                )}
                                <p className="report-outlook-text">{reportData.trainingOutlook}</p>
                            </div>
                            {/* 新版本对比（如果存在） */}
                            {showComparison && newReportData?.trainingOutlook && (
                                <>
                                    <div className="mt-4 sm:mt-6 mb-2 sm:mb-3 px-2">
                                        <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent"></div>
                                        <div className="mt-2 text-xs sm:text-sm text-[#d4af37]/80 font-bold uppercase tracking-widest text-center">
                                            新版本
                                        </div>
                                    </div>
                                    <div className={`report-outlook-card border border-[#d4af37]/30 bg-[#d4af37]/10 relative ${selectedVersions.trainingOutlook === 'new' ? 'ring-2 ring-[#d4af37]' : ''}`}>
                                        {showComparison && (
                                            <button
                                                onClick={() => handleSelectVersion('trainingOutlook', 'new')}
                                                className={`absolute top-2 right-2 z-20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${selectedVersions.trainingOutlook === 'new'
                                                    ? 'bg-[#d4af37] text-black'
                                                    : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                                                    }`}
                                            >
                                                {selectedVersions.trainingOutlook === 'new' ? '已选中' : '选择'}
                                            </button>
                                        )}
                                        <p className="report-outlook-text">{newReportData.trainingOutlook}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="report-footer">
                    <p className="report-footer-text">
                        {t('reportIdLabel')}: {id} • {t('generatedByGolfCoachAI')}
                    </p>
                </div>
            </div>

            {/* 继续下一项测评按钮 */}
            {continueTestInfo && (
                <div className="fixed bottom-6 sm:bottom-8 left-0 right-0 px-4 sm:px-6 z-[60]">
                    <div className="max-w-md mx-auto">
                        <button
                            onClick={handleContinueNextTest}
                            className="w-full h-[50px] sm:h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-base sm:text-lg uppercase tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <span>{t('continueNextAssessment')}</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* 底部操作按钮 */}
            {!continueTestInfo && (
                <div className="fixed bottom-6 sm:bottom-8 left-0 right-0 px-4 sm:px-6 z-[60]">
                    <div className="max-w-md mx-auto">
                        {showComparison ? (
                            allSectionsSelected() ? (
                                // 所有部分都已选择，显示自定义版本按钮
                                <div className="flex gap-3">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleKeepOldReport}
                                        className="flex-1 h-[54px] rounded-full bg-white/10 border border-white/20 text-white font-bold text-sm sm:text-base uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95"
                                    >
                                        保留旧版本
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSaveCustomVersion}
                                        disabled={isCreatingAIReport}
                                        className="flex-1 h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-sm sm:text-base uppercase tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCreatingAIReport ? '保存中...' : '选中自定义版本'}
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleUseNewReport}
                                        className="flex-1 h-[54px] rounded-full bg-white/10 border border-white/20 text-white font-bold text-sm sm:text-base uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95"
                                    >
                                        使用新版本
                                    </motion.button>
                                </div>
                            ) : (
                                // 未全部选择，显示提示
                                <div className="flex gap-3">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleKeepOldReport}
                                        className="flex-1 h-[54px] rounded-full bg-white/10 border border-white/20 text-white font-bold text-sm sm:text-base uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95"
                                    >
                                        保留旧版本
                                    </motion.button>
                                    <div className="flex-1 h-[54px] rounded-full bg-white/5 border border-white/10 text-white/60 font-bold text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center">
                                        请选择所有部分
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleUseNewReport}
                                        className="flex-1 h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-sm sm:text-base uppercase tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group"
                                    >
                                        使用新版本
                                    </motion.button>
                                </div>
                            )
                        ) : (
                            <motion.button
                                whileTap={{ scale: loading || isCreatingAIReport ? 1 : 0.95 }}
                                onClick={handleRegenerate}
                                disabled={loading || isCreatingAIReport}
                                className="w-full h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-base sm:text-lg shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                重新生成
                            </motion.button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentalReportDetailPage;
