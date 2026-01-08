import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Brain, ClipboardList, Target, Zap, Quote, HelpCircle, AlertTriangle, Sparkles, Target as TargetIcon, ShieldCheck, ChevronDown, ArrowRight } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../utils/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { TextSection, DynamicSection } from '../../components/reports/ReportSharedComponents';
import RadarChart from '../../components/reports/RadarChart';
import { createAssessment } from '../assessment/utils/assessmentApi';
import { diagnosesToRadarGradeData } from '../../utils/diagnosesToRadar';

const MentalReportDetailPage = ({ onBack, student }) => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedMetrics, setExpandedMetrics] = useState({});
    const [continueTestInfo, setContinueTestInfo] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);
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
                const response = await fetch(`http://localhost:8080/AIReport/${id}`, { headers });
                if (!response.ok) throw new Error('Failed to fetch AI report data');

                const data = await response.json();

                // Fetch diagnoses grades for radar chart
                let diagnosesGradeData = null;
                try {
                    const diagnosesRes = await fetch(`http://localhost:8080/diagnoses/${id}`, { headers });
                    if (diagnosesRes.ok) {
                        const diagnosesJson = await diagnosesRes.json();
                        const mapped = diagnosesToRadarGradeData(diagnosesJson, 'mental');
                        if (mapped.matchedCount > 0) {
                            diagnosesGradeData = mapped.gradeData;
                        } else if (Array.isArray(diagnosesJson?.content) && diagnosesJson.content.some((x) => x?.grade)) {
                            console.warn('[diagnoses] mental titles did not match radar fields', diagnosesJson.content);
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

                // 雷达图数据：优先使用 diagnoses 的 grade；失败则 fallback 到 AIReport.grade
                const rawGrade = data.grade || {};
                const fallbackGradeData = {
                    focus: 0,
                    stability: 0,
                    confidence: 0,
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

                // 心理指标数据 - 从 AIReport 接口的 grade 数据中获取，或使用默认值
                const mentalMetrics = {
                    focus: gradeData.focus || '-',
                    resilience: gradeData.resilience || '-',
                    confidence: gradeData.confidence || '-'
                };

                // 组装数据
                setReportData({
                    id: id,
                    title: t('mentalReportTitle'),
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
                                { label: t('mentalResilience') || '心理韧性', value: mentalMetrics.resilience, unit: '/ 100' },
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
                    trainingOutlook: planSections.find(s => s.title.includes('回报') || s.title.includes('激励') || s.title.includes('展望'))?.content || trainingPlanText || t('mentalBenefitsDefault')
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
            const defaultTitle = continueTestInfo.title || (nextType === 'mental' ? t('mentalAssessment') : t('skillsAssessment'));
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
        if (student?.id) {
            navigate(`/student/${student.id}/mental-report`);
        } else if (onBack) {
            onBack();
        } else {
            navigate('/mental-report');
        }
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
        setLoading(true);
        setReloadToken(token => token + 1);
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
                <AlertTriangle className="w-12 h-12 text-[#d4af37] mb-4" />
                <p className="report-empty-title">{t('noAssessmentDetailData')}</p>
                <button
                    onClick={handleBack}
                    className="report-empty-btn"
                >
                    {t('backToList')}
                </button>
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
                <h1 className="report-detail-title">{reportData.title}</h1>
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

                {/* 心理情况测评诊断 */}
                {reportData.qualityAssessment && reportData.qualityAssessment.length > 0 && (
                    <div className="report-section">
                        <div className="mb-4 sm:mb-8 flex flex-col gap-1">
                            <h2 className="text-[16px] sm:text-[20px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#d4af37]">
                                {t('mentalAssessmentDiagnosisTitle')}
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
                            className="flex-1 h-[50px] sm:h-[54px] rounded-full bg-white/10 border border-white/20 text-white font-bold text-sm sm:text-base uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95"
                        >
                            重新生成
                        </button>
                        <button
                            onClick={handleSaveAndGoHome}
                            className="flex-1 h-[50px] sm:h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-sm sm:text-base uppercase tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            {t('saveAndReturn')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentalReportDetailPage;
