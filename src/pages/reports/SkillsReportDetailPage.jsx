import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Activity, ClipboardList, Target, Quote, Sparkles, AlertTriangle, ChevronDown, ArrowRight } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../utils/LanguageContext';
import { TextSection } from '../../components/reports/ReportSharedComponents';
import RadarChart from '../../components/reports/RadarChart';
import { createAssessment } from '../assessment/utils/assessmentApi';
import { diagnosesToRadarGradeData } from '../../utils/diagnosesToRadar';

const SkillsReportDetailPage = ({ onBack, student }) => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
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

            // --- 增加 Mock 调试逻辑 ---
            if (id === 'mock') {
                setLoading(true);
                setTimeout(() => {
                    const report = {
                        id: 'mock-skill-1',
                        title: "技能水平测评报告 (演示)",
                        date: "2026-01-06",
                        trainingIntroduction: "高尔夫技能水平的提升是一个系统工程，需要通过科学的数据驱动训练。基于 TrackMan 雷达系统和慢速摄像机等专业装备的诊断分析，我们能够精准定位每一位学员的技术特点与改善空间，制定个性化的技能提升方案。",
                        gradeData: {
                            driver: 'L5',
                            mainIron: 'L6',
                            wood: 'L5',
                            putting: 'L7',
                            scrambling: 'L6',
                            finesseWedges: 'L6',
                            irons: 'L6'
                        },
                        trackmanGroups: [
                            {
                                title: "击球概览",
                                items: [
                                    { label: "球速", value: 156.4, unit: 'MPH' },
                                    { label: "起飞角", value: 12.8, unit: 'DEG' },
                                    { label: "回旋率", value: 2450, unit: 'RPM' },
                                    { label: "落点距离", value: 268.5, unit: 'YDS' },
                                ]
                            },
                            {
                                title: "挥杆轨迹与效率",
                                items: [
                                    { label: "杆头速度", value: 108.2, unit: 'MPH' },
                                    { label: "攻角", value: 2.5, unit: 'DEG' },
                                    { label: "挤压因子", value: 1.48, unit: '' },
                                ]
                            }
                        ],
                        trainingGoals: [
                            { title: "优化攻角", content: "通过动作调整，使 1 号木的攻角稳定在 3度以上，降低回旋，在任何风况下都能保持稳定距离。" },
                            { title: "提效击球", content: "将铁杆的 Smash Factor 平均值提升至 1.38 以上，通过提升击球效率来增加距离和稳定性。" }
                        ],
                        goalSettingReason: "当前击球回旋过高，导致顶风时距离损失严重。同时杆面一致性不够，侧向偏差影响了球路的稳定性。这两点是限制技能进一步提升的关键瓶颈。",
                        qualityAssessment: [
                            { title: "长打距离", level: "中等", description: "一号木平均距离 268.5 码，在同龄段中等水平。回旋过高限制了潜力发挥。" },
                            { title: "中铁精准度", level: "良好", description: "中铁击球垂直一致性较好，但水平分散度有待改善。" },
                            { title: "短铁控制", level: "良好", description: "短铁距离控制精准，误差在 ±5 码以内。" },
                            { title: "击球一致性", level: "中等", description: "十杆击球中，杆头轨迹和杆面角度存在 1-2 杆的明显波动。" },
                            { title: "压缩质量", level: "中等", description: "Smash Factor 平均 1.42，与潜力值相比有 0.1-0.15 的提升空间。" },
                            { title: "技术稳定性", level: "待改善", description: "风力或疲劳状态下，技术形变明显，需加强重复强化。" }
                        ],
                        potentialRisks: "如果不重视技能打基础和纠正动作问题，将来即使体能再强，也难以稳定地在竞技场景中发挥。错误的技术动作如果重复强化，会越来越难以纠正。",
                        coreTrainingContent: [
                            { title: "毛巾练习法", content: "腋下夹毛巾练习半挥杆，强化身体与手臂的协同带动，培养正确的释放感觉和杆头加速轨迹。" },
                            { title: "手腕固定架辅助", content: "练习维持延迟释放感，提升压缩感和击球效率。配合 TrackMan 实时反馈，调整发力节奏。" },
                            { title: "目标线反复对应", content: "通过场地上的目标线进行对应训练，强化瞄准准确度，建立肌肉记忆。" }
                        ],
                        trainingOutlook: "完成本阶段技能训练后，预期击球一致性将明显提升，单杆离散度从现在的 15 码降低到 8 码以内。整体击球效率提升 0.1 以上，长打距离增加 10-15 码。更重要的是，建立稳定的技术基础，为更高难度的竞技训练奠定基础。"
                    };
                    setReportData(report);
                    setLoading(false);
                }, 500);
                return;
            }
            // ------------------------

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
                        const mapped = diagnosesToRadarGradeData(diagnosesJson, 'skills');
                        if (mapped.matchedCount > 0) {
                            diagnosesGradeData = mapped.gradeData;
                        } else if (Array.isArray(diagnosesJson?.content) && diagnosesJson.content.some((x) => x?.grade)) {
                            console.warn('[diagnoses] skills titles did not match radar fields', diagnosesJson.content);
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
                            title: t('trainingPlan'),
                            content: text.trim()
                        });
                    }
                    return sections;
                };

                // 雷达图数据：优先使用 diagnoses 的 grade；失败则 fallback 到 AIReport.grade
                const rawGrade = data.grade || {};
                const fallbackGradeData = {
                    driver: 0,
                    mainIron: 0,
                    wood: 0,
                    putting: 0,
                    scrambling: 0,
                    finesseWedges: 0,
                    irons: 0,
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

                // 使用 trackman_data
                const trackmanData = data.trackman_data || {};

                // 组装数据
                const report = {
                    id: id,
                    title: t('skillsReportTitle'),
                    date: trackmanData.created_at ? new Date(trackmanData.created_at).toLocaleDateString() : new Date().toLocaleDateString(),

                    // 训练引言
                    trainingIntroduction: getLocalizedField('report_intro'),

                    // 雷达图数据
                    gradeData: gradeData,

                    // TrackMan 数据采集
                    trackmanGroups: [
                        {
                            title: t('ballFlightData') || '击球飞行数据',
                            items: [
                                { label: t('ballSpeed') || '球速', value: trackmanData.ball_speed || '-', unit: 'MPH' },
                                { label: t('launchAngle') || '起飞角', value: trackmanData.launch_angle || '-', unit: 'DEG' },
                                { label: t('launchDirection') || '起飞方向', value: trackmanData.launch_direction || '-', unit: 'DEG' },
                                { label: t('spinRate') || '回旋率', value: trackmanData.spin_rate || '-', unit: 'RPM' },
                                { label: t('spinAxis') || '回旋轴', value: trackmanData.spin_axis || '-', unit: 'DEG' },
                                { label: t('carry') || '落点距离', value: trackmanData.carry || '-', unit: 'YDS' },
                                { label: t('landingAngle') || '落地角', value: trackmanData.landing_angle || '-', unit: 'DEG' },
                                { label: t('offline') || '侧向偏差', value: trackmanData.offline || '-', unit: 'YDS' },
                            ]
                        },
                        {
                            title: t('clubAndImpactData') || '挥杆与击球数据',
                            items: [
                                { label: t('clubSpeed') || '杆头速度', value: trackmanData.club_speed || '-', unit: 'MPH' },
                                { label: t('attackAngle') || '攻角', value: trackmanData.attack_angle || '-', unit: 'DEG' },
                                { label: t('clubPath') || '杆头轨迹', value: trackmanData.club_path || '-', unit: 'DEG' },
                                { label: t('faceAngle') || '杆面角度', value: trackmanData.face_angle || '-', unit: 'DEG' },
                                { label: t('faceToPath') || '杆面-轨迹差', value: trackmanData.face_to_path || '-', unit: 'DEG' },
                                { label: t('dynamicLoft') || '动态杆面角', value: trackmanData.dynamic_loft || '-', unit: 'DEG' },
                                { label: t('smashFactor') || '挤压因子', value: trackmanData.smash_factor || '-', unit: '' },
                                { label: t('spinLoft') || '有效杆面角', value: trackmanData.spin_loft || '-', unit: 'DEG' },
                                { label: t('lowPoint') || '最低点', value: trackmanData.low_point || '-', unit: '' },
                                { label: t('impactOffset') || '击球位置', value: trackmanData.impact_offset || '-', unit: '' },
                                { label: t('indexing') || '杆面指向', value: trackmanData.indexing || '-', unit: '' },
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
                            title: t('skillsAssessment') || '技能评估',
                            level: t('pendingEvaluation') || '待评估',
                            description: diagnosisText || t('evaluationByTest')
                        }],

                    // 训练计划内容
                    coreTrainingContent: planSections.filter(s => !s.title.includes('风险') && !s.title.includes('回报')),
                    potentialRisks: planSections.find(s => s.title.includes('风险') || s.title.includes('警示'))?.content || '',
                    trainingOutlook: planSections.find(s => s.title.includes('回报') || s.title.includes('激励') || s.title.includes('展望'))?.content || trainingPlanText || t('benefitsDefault')
                };

                setReportData(report);
            } catch (error) {
                console.error('Error fetching skills report:', error);
                setReportData({
                    title: t('reportLoadFailed'),
                    trackmanGroups: [],
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
            
            const defaultTitle = continueTestInfo.title || (nextType === 'mental' ? t('mentalAssessment') : (nextType === 'physical' ? t('physicalAssessment') : t('skillsAssessment')));
            const backendLang = t('langCode') || 'cn';
            
            const nextAssessmentId = await createAssessment(
                studentId,
                nextType === 'skills' ? 'technique' : nextType,
                user,
                defaultTitle,
                backendLang
            );

            if (nextAssessmentId) {
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
        if (student?.id) {
            navigate(`/student/${student.id}/skills-report`);
        } else if (onBack) {
            onBack();
        } else {
            navigate('/skills-report');
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

                {/* 雷达图 - 技能水平评估 */}
                <RadarChart
                    data={reportData.gradeData}
                    type="skills"
                />

                {/* 技能数据采集 */}
                {reportData.trackmanGroups && reportData.trackmanGroups.length > 0 && (
                    <div className="report-section">
                        <div className="space-y-4 sm:space-y-6">
                            <div className="glass-card border border-white/10 surface-strong rounded-2xl sm:rounded-[32px] p-4 sm:p-5 shadow-xl">
                                <div className="space-y-4 sm:space-y-5">
                                    {/* 初始化：仅显示第一组（核心数据）的前4个指标 */}
                                    {reportData.trackmanGroups[0] && (
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                            {(reportData.trackmanGroups[0].items?.slice(0, 4) || []).map((item, idx) => (
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
                                    )}

                                    {/* 展开后显示所有数据 */}
                                    {isTrackmanDataExpanded && (
                                        <div className="pt-3 sm:pt-4 border-t border-white/5 space-y-4 sm:space-y-5">
                                            {reportData.trackmanGroups.map((group, gIdx) => {
                                                // 第一组已经显示前4个，展开时显示剩余的和所有其他组
                                                const itemsToShow = gIdx === 0
                                                    ? group.items?.slice(4) || []
                                                    : group.items || [];

                                                if (itemsToShow.length === 0) return null;

                                                return (
                                                    <div
                                                        key={`${group.title}-${gIdx}`}
                                                        className={gIdx === 0 ? '' : 'pt-3 sm:pt-4 border-t border-white/5'}
                                                    >
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                                                            {itemsToShow.map((item, idx) => (
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
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* 展开按钮（有更多内容才显示） */}
                                    {(() => {
                                        const totalItems = reportData.trackmanGroups.reduce((sum, group) => sum + (group.items?.length || 0), 0);
                                        const hasMore = totalItems > 4;
                                        return hasMore && (
                                            <div className="pt-2 sm:pt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsTrackmanDataExpanded(v => !v)}
                                                    aria-expanded={isTrackmanDataExpanded}
                                                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-[11px] sm:text-xs font-bold uppercase tracking-widest hover:border-[#d4af37]/30 hover:text-white transition-all active:scale-[0.99]"
                                                >
                                                    <span>{isTrackmanDataExpanded ? '收起' : '查看更多指标'}</span>
                                                    <ChevronDown className={`w-4 h-4 transition-transform ${isTrackmanDataExpanded ? 'rotate-180 text-[#d4af37]' : ''}`} />
                                                </button>
                                            </div>
                                        );
                                    })()}
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

                {/* 技能情况测评诊断 */}
                {reportData.qualityAssessment && reportData.qualityAssessment.length > 0 && (
                    <div className="report-section">
                        <div className="mb-4 sm:mb-8 flex flex-col gap-1">
                            <h2 className="text-[16px] sm:text-[20px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#d4af37]">
                                {t('skillsAssessmentDiagnosisTitle')}
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
                                    {idx < reportData.qualityAssessment.length - 1 && (
                                        <div className="mx-6 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                    )}
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

export default SkillsReportDetailPage;
