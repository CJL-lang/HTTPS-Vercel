import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Activity, ClipboardList, Target, Zap, Quote, HelpCircle, AlertTriangle, Sparkles, ChevronDown, ArrowRight } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../utils/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { TextSection, DynamicSection } from '../../components/reports/ReportSharedComponents';
import RadarChart from '../../components/reports/RadarChart';
import { createAssessment } from '../assessment/utils/assessmentApi';
import { diagnosesToRadarGradeData } from '../../utils/diagnosesToRadar';
import { createAIReport, getBackendLang } from './utils/aiReportApi';

const PhysicalReportDetailPage = ({ onBack, student }) => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const passedTitle = location.state?.title || location.state?.assessmentData?.title;
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [isBodyDataExpanded, setIsBodyDataExpanded] = useState(false);
    const [continueTestInfo, setContinueTestInfo] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);
    const [isCreatingAIReport, setIsCreatingAIReport] = useState(false);
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
                
                // 如果返回 404，自动创建 AI 报告
                if (response.status === 404) {
                    console.log('[PhysicalReportDetailPage] AI report not found, creating empty report');
                    const { createAIReport } = await import('./utils/aiReportApi');
                    
                    // 创建空的 AI 报告
                    const created = await createAIReport(id);
                    if (created) {
                        console.log('[PhysicalReportDetailPage] Empty AI report created, reloading...');
                        // 重新加载报告数据
                        setReloadToken(token => token + 1);
                        return;
                    } else {
                        console.error('[PhysicalReportDetailPage] Failed to create AI report');
                        setReportData(null);
                        setLoading(false);
                        return;
                    }
                }
                
                if (!response.ok) throw new Error('Failed to fetch AI report data');

                const data = await response.json();

                // Fetch diagnoses grades for radar chart
                let diagnosesGradeData = null;
                try {
                    const diagnosesRes = await fetch(`/api/diagnoses/${id}`, { headers });
                    if (diagnosesRes.ok) {
                        const diagnosesJson = await diagnosesRes.json();
                        const mapped = diagnosesToRadarGradeData(diagnosesJson, 'physical');
                        if (mapped.matchedCount > 0) {
                            diagnosesGradeData = mapped.gradeData;
                        } else if (Array.isArray(diagnosesJson?.content) && diagnosesJson.content.some((x) => x?.grade)) {
                            console.warn('[diagnoses] physical titles did not match radar fields', diagnosesJson.content);
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

                // 辅助函数：解析文本为结构化数组（用于诊断和训练计划）
                const parseTextToSections = (text) => {
                    if (!text) return [];
                    // 根据【】符号分隔内容
                    const sections = [];
                    const regex = /【([^】]+)】([^【]*)/g;
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        sections.push({
                            title: match[1].trim(),
                            content: match[2].trim()
                        });
                    }
                    // 如果没有【】符号，则将整个文本作为一个段落
                    if (sections.length === 0 && text.trim()) {
                        sections.push({
                            title: t('physicalAssessmentDiagnosisTitle'),
                            content: text.trim()
                        });
                    }
                    return sections;
                };

                // 雷达图数据：优先使用 diagnoses 的 grade；失败则 fallback 到 AIReport.grade
                const rawGrade = data.grade || {};
                const fallbackGradeData = {
                    flexibility: 0,
                    upperBodyStrength: 0,
                    lowerBodyStrength: 0,
                    coordination: 0,
                    coreStability: 0,
                    explosiveness: 0,
                    cardio: 0,
                    ...rawGrade
                };
                const gradeData = diagnosesGradeData || fallbackGradeData;

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

                // 从 AIReport 接口直接获取 styku_data
                const stykuRaw = data.styku_data || [];
                const stykuList = Array.isArray(stykuRaw) ? stykuRaw : [stykuRaw];
                const stykuData = stykuList[stykuList.length - 1] || {};

                // 组装数据
                const report = {
                    id: id,
                    studentId: data.student_id,
                    title: passedTitle || t('physicalReportTitle'),
                    date: data.created_at ? new Date(data.created_at).toLocaleDateString() : new Date().toLocaleDateString(),

                    // (a) 训练引言
                    trainingIntroduction: getLocalizedField('report_intro'),

                    // 雷达图数据
                    gradeData: gradeData,

                    // (b) 身体数据采集
                    stykuGroups: [
                        {
                            title: t('basicIndicators'),
                            items: [
                                { label: t('height'), value: stykuData?.height || '-', unit: 'cm' },
                                { label: t('weight'), value: stykuData?.weight || '-', unit: 'kg' },
                                { label: t('sittingHeight'), value: stykuData?.sitting_height || '-', unit: 'cm' },
                                { label: 'BMI', value: stykuData?.bmi || '-', unit: '' },
                            ]
                        },
                        {
                            title: t('torsoCircumference'),
                            items: [
                                { label: t('chest'), value: stykuData?.chest || '-', unit: 'cm' },
                                { label: t('waist'), value: stykuData?.waist || '-', unit: 'cm' },
                                { label: t('hip'), value: stykuData?.hip || '-', unit: 'cm' },
                            ]
                        },
                        {
                            title: t('limbCircumference'),
                            items: [
                                { label: t('upperArm'), value: stykuData?.upper_arm || '-', unit: 'cm' },
                                { label: t('forearm'), value: stykuData?.forearm || '-', unit: 'cm' },
                                { label: t('thigh'), value: stykuData?.thigh || '-', unit: 'cm' },
                                { label: t('calf'), value: stykuData?.calf || '-', unit: 'cm' },
                            ]
                        }
                    ],

                    // (c) 训练目标
                    trainingGoals: trainingGoals,
                    goalSettingReason: '', // 新接口中目标说明已包含在目标内容中

                    // (d) 身体情况测评诊断
                    qualityAssessment: diagnosisSections.length > 0
                        ? diagnosisSections.map(section => ({
                            title: section.title,
                            level: t('pendingEvaluation'),
                            description: section.content
                        }))
                        : [
                            { title: t('flexibility'), level: t('pendingEvaluation'), description: diagnosisText || t('evaluationByTest') },
                            { title: t('strength'), level: t('pendingEvaluation'), description: t('evaluationByTest') },
                            { title: t('coordination'), level: t('pendingEvaluation'), description: t('evaluationByObservation') },
                            { title: t('coreStability'), level: t('pendingEvaluation'), description: t('evaluationByTest') },
                            { title: t('explosiveness'), level: t('pendingEvaluation'), description: t('evaluationByTest') },
                            { title: t('cardio'), level: t('pendingEvaluation'), description: t('evaluationByFitnessTest') }
                        ],

                    // (e) 训练计划及展望
                    potentialRisks: '', // 可以从 training_plan 中提取【潜在风险】部分
                    coreTrainingContent: planSections.filter(s => !s.title.includes('风险') && !s.title.includes('回报')),
                    trainingOutlook: planSections.find(s => s.title.includes('回报') || s.title.includes('激励'))?.content || trainingPlanText || t('physicalBenefitsDefault')
                };

                setReportData(report);

                const initialExpanded = {};
                report.stykuGroups.forEach(group => {
                    initialExpanded[group.title] = true;
                });
                setExpandedGroups(initialExpanded);
            } catch (error) {
                console.error('Error fetching physical report:', error);
                setReportData({
                    title: t('reportLoadFailed'),
                    stykuGroups: [],
                    trainingGoals: [],
                    qualityAssessment: [],
                    coreTrainingContent: []
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
            console.log('[PhysicalReportDetailPage] Single assessment data:', data);

            // 触发重新拉取报告数据
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
            // 从 location.state 检查
            if (location.state?.continueCompleteTest) {
                setContinueTestInfo({
                    nextPrimary: location.state.nextPrimary,
                    assessmentData: location.state.assessmentData,
                    student: location.state.student
                });
                return;
            }

            // 从 sessionStorage 检查
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

    const handleBack = () => {
        // 返回到历史测评列表页面
        const backStudentId =
            reportData?.studentId ||
            student?.id ||
            location.state?.studentId ||
            location.state?.student?.id;

        if (backStudentId) {
            navigate(`/student/${backStudentId}/physical-report`);
            return;
        }

        if (onBack) {
            onBack();
            return;
        }

        navigate('/physical-report');
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

    const handleRegenerate = () => {
        // 重新生成 AI 报告（后端重新计算）
        handleGenerateAIReport();
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
        <div className="report-detail-page">
            {/* Header */}
            <div className="report-detail-header">
                <button
                    onClick={handleBack}
                    className="btn-back shrink-0"
                >
                    <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                </button>
                <h1 className="report-detail-title">{passedTitle || reportData.title || t('physicalDetail')}</h1>
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

                {/* 雷达图 - 身体素质评估 */}
                <RadarChart
                    data={reportData.gradeData}
                    type="physical"
                />

                {/* 身体数据采集 */}
                {reportData.stykuGroups && reportData.stykuGroups.length > 0 && (
                    <div className="report-section">
                        <div className="space-y-4 sm:space-y-6">
                            <div className="glass-card border border-white/10 surface-strong rounded-2xl sm:rounded-[32px] p-4 sm:p-5 shadow-xl">
                                <div className="space-y-4 sm:space-y-5">
                                    {/* 初始化：仅显示第一组（基础指标） */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                        {(reportData.stykuGroups?.[0]?.items || []).map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                                            >
                                                <p className="text-[10px] sm:text-[11px] font-bold text-white/50 truncate">
                                                    {item.label}
                                                </p>
                                                <div className="mt-0.5 flex items-baseline gap-1">
                                                    <span className="text-[13px] sm:text-[14px] font-black text-white/50 truncate">
                                                        {item.value}
                                                    </span>
                                                    <span className="text-[10px] sm:text-[11px] font-bold text-white/50">
                                                        {item.unit}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 下拉显示其余分组内容 */}
                                    {isBodyDataExpanded && reportData.stykuGroups.length > 1 && (
                                        <div className="pt-3 sm:pt-4 border-t border-white/5 space-y-4 sm:space-y-5">
                                            {reportData.stykuGroups.slice(1).map((group, gIdx) => (
                                                <div
                                                    key={`${group.title}-${gIdx}`}
                                                    className={gIdx === 0 ? '' : 'pt-3 sm:pt-4 border-t border-white/5'}
                                                >
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                                        {(group.items || []).map((item, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                                                            >
                                                                <p className="text-[10px] sm:text-[11px] font-bold text-white/50 truncate">
                                                                    {item.label}
                                                                </p>
                                                                <div className="mt-0.5 flex items-baseline gap-1">
                                                                    <span className="text-[13px] sm:text-[14px] font-black text-white/50 truncate">
                                                                        {item.value}
                                                                    </span>
                                                                    <span className="text-[10px] sm:text-[11px] font-bold text-white/50">
                                                                        {item.unit}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* 展开按钮（有更多内容才显示）- 放到底部，展开后仍在容器内部居中 */}
                                    {reportData.stykuGroups.length > 1 && (
                                        <div className="pt-2 sm:pt-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsBodyDataExpanded(v => !v)}
                                                aria-expanded={isBodyDataExpanded}
                                                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-[11px] sm:text-xs font-bold uppercase tracking-widest hover:border-[#d4af37]/30 hover:text-white transition-all active:scale-[0.99]"
                                            >
                                                <span>{isBodyDataExpanded ? '收起' : '查看更多指标'}</span>
                                                <ChevronDown className={`w-4 h-4 transition-transform ${isBodyDataExpanded ? 'rotate-180 text-[#d4af37]' : ''}`} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
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
                        <div className="report-card">
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
                    </div>
                )}

                {/* 身体情况测评诊断 */}
                {reportData.qualityAssessment && reportData.qualityAssessment.length > 0 && (
                    <div className="report-section">
                        <div className="mb-4 sm:mb-8 flex flex-col gap-1">
                            <h2 className="text-[16px] sm:text-[20px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#d4af37]">
                                {t('physicalAssessmentDiagnosisTitle')}
                            </h2>
                            <div className="h-[2px] w-12 sm:w-20 bg-gradient-to-r from-[#d4af37] to-transparent"></div>
                        </div>
                        <div className="report-card">
                            {reportData.qualityAssessment.map((item, idx) => (
                                <div key={idx}>
                                    <div className="report-list-item group">
                                        <div className="report-list-item-body">
                                            <div className="report-list-row">
                                                <div className="report-bullet"></div>
                                                <div className="flex-1">
                                                    <div className="report-item-header-row">
                                                        <h3 className="report-item-title !mb-0">{item.title}</h3>
                                                        <span className="report-item-badge">{item.level}</span>
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
                            <div className="report-outlook-card">
                                <p className="report-outlook-text">{reportData.trainingOutlook}</p>
                            </div>
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
                    <div className="max-w-md mx-auto flex gap-3">
                        <button
                            onClick={handleRegenerate}
                            disabled={loading || isCreatingAIReport}
                            className="flex-1 h-[50px] sm:h-[54px] rounded-full bg-white/10 border border-white/20 text-white font-bold text-sm sm:text-base uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95"
                        >
                            重新生成
                        </button>
                        <button
                            onClick={handleGenerateAIReport}
                            disabled={loading || isCreatingAIReport}
                            className="flex-1 h-[50px] sm:h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-sm sm:text-base uppercase tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            {t('generateAIReport')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhysicalReportDetailPage;

