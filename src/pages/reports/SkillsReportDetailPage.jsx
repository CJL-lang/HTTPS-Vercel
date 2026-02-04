import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Activity, ClipboardList, Target, Quote, Sparkles, AlertTriangle, ChevronDown, ArrowRight } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../utils/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { TextSection } from '../../components/reports/ReportSharedComponents';
import RadarChart from '../../components/reports/RadarChart';
import { createAssessment, updateAssessment } from '../assessment/utils/assessmentApi';
import { diagnosesToRadarGradeData } from '../../utils/diagnosesToRadar';
import { pickLocalizedContent } from '../../utils/language';
import { createAIReport, getBackendLang } from './utils/aiReportApi';
import { clearAIReportGenerating, isAIReportGenerating, onAIReportWsEvent, startAIReportWsJob } from '../../services/aiReportWsClient';
import AssessmentHeader from '../assessment/components/AssessmentHeader';
import api from '../../utils/api';

const SkillsReportDetailPage = ({ onBack, student }) => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const passedTitle = location.state?.title || location.state?.assessmentData?.title;
    const initialWaitingForAiReport = Boolean(location.state?.aiReportGenerating) || isAIReportGenerating(id);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isTrackmanDataExpanded, setIsTrackmanDataExpanded] = useState(false);
    const [continueTestInfo, setContinueTestInfo] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);
    const [isCreatingAIReport, setIsCreatingAIReport] = useState(false);
    const [isWaitingForAiReport, setIsWaitingForAiReport] = useState(initialWaitingForAiReport);
    const [aiReportFetchEnabled, setAiReportFetchEnabled] = useState(!initialWaitingForAiReport);
    const [skipLogoLoading, setSkipLogoLoading] = useState(false);
    const [isCompletingProgress, setIsCompletingProgress] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [oldReportData, setOldReportData] = useState(null);
    const [newReportData, setNewReportData] = useState(null);
    const [showLeaveComparisonConfirm, setShowLeaveComparisonConfirm] = useState(false);
    // 每个部分的选择状态：'old' | 'new' | null
    const [selectedVersions, setSelectedVersions] = useState({
        trainingGoals: null,
        qualityAssessment: null,
        trainingOutlook: null
    });
    // 用于防止重复加载的 Ref
    const lastFetchedIdRef = useRef(null);
    const lastSavedTitleRef = useRef('');

    // 标题编辑（用于确保返回/刷新后标题不丢）
    const assessmentId = id;
    const titleStorageKey = assessmentId ? `assessmentTitle:${assessmentId}` : null;
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isSavingTitle, setIsSavingTitle] = useState(false);
    const [titleTouched, setTitleTouched] = useState(false);
    const [titleDraft, setTitleDraft] = useState(() => {
        const fromRoute = (passedTitle || '').toString().trim();
        if (fromRoute) return fromRoute;
        try {
            const cached = titleStorageKey ? sessionStorage.getItem(titleStorageKey) : '';
            return (cached || '').toString().trim();
        } catch {
            return '';
        }
    });

    useEffect(() => {
        const candidate = (passedTitle || reportData?.title || '').toString().trim();
        if (!candidate) return;
        if (!lastSavedTitleRef.current) lastSavedTitleRef.current = candidate;
        if (titleTouched) return;
        if (!titleDraft) setTitleDraft(candidate);
    }, [passedTitle, reportData?.title, titleDraft, titleTouched]);

    useEffect(() => {
        if (!titleStorageKey) return;
        const trimmed = (titleDraft || '').toString().trim();
        if (!trimmed) return;
        try {
            sessionStorage.setItem(titleStorageKey, trimmed);
        } catch {
            // ignore
        }
    }, [titleDraft, titleStorageKey]);

    const saveTitleIfNeeded = async (nextTitle) => {
        const trimmed = (nextTitle ?? titleDraft ?? '').toString().trim();
        if (!assessmentId || !trimmed) return true;
        if (trimmed === lastSavedTitleRef.current) return true;

        const userJson = localStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : null;
        if (!user?.token) return false;

        setIsSavingTitle(true);
        try {
            const ok = await updateAssessment(assessmentId, { title: trimmed }, user);
            if (ok) lastSavedTitleRef.current = trimmed;
            return ok;
        } catch (error) {
            console.error('[SkillsReportDetailPage] saveTitleIfNeeded: Failed to update assessment title', error);
            return false;
        } finally {
            setIsSavingTitle(false);
        }
    };

    // 如果是从“完成测评 -> 生成AI报告”进入，则等待 WS 结果；成功后自动刷新页面展示报告
    useEffect(() => {
        if (!isWaitingForAiReport) return;
        if (!id) return;

        return onAIReportWsEvent((event) => {
            if (event?.type !== 'message') return;
            if (!event?.terminal) return;
            if (event?.assessmentId !== id) return;

            if (event?.status === 'success') {
                setAiReportFetchEnabled(true);
                setIsCompletingProgress(true);
                setTimeout(() => {
                    setIsWaitingForAiReport(false);
                    setIsCompletingProgress(false);
                    setSkipLogoLoading(true);
                    setLoading(true);
                    setReloadToken((x) => x + 1);
                }, 600);
                return;
            }

            // failure/timeout: 停止等待，让页面回到“未生成/可手动生成”的状态
            // failure/timeout: 停止等待，且不自动拉取 AIReport
            setIsWaitingForAiReport(false);
            setLoading(false);
        });
    }, [isWaitingForAiReport, id]);

    // 从后端获取真实数据
    useEffect(() => {
        if (!aiReportFetchEnabled) return;
        if (isWaitingForAiReport) return;
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
                const response = await api.get(`/api/AIReport/${id}`, { headers });

                // 处理后端返回 200 但提示“找不到记录”的情况，或者 404
                const data = response.data ?? null;
                if (response.status === 404 || (data && data.message === '找不到记录')) {
                    // 不再在详情页自动触发生成：避免多人/刷新时重复创建任务
                    setReportData(null);
                    setLoading(false);
                    return;
                }
                if (response.status < 200 || response.status >= 300) {
                    throw new Error(`Failed to fetch AI report data (${response.status})`);
                }

                // 后端已能返回报告，则清理本地“正在生成”标记
                clearAIReportGenerating(id, 'backend-fetched');

                // Fetch diagnoses grades for radar chart
                let diagnosesGradeData = null;
                try {
                    const diagnosesRes = await api.get(`/api/diagnoses/${id}`, { headers });
                    if (diagnosesRes.data) {
                        const diagnosesJson = diagnosesRes.data;
                        diagnosesJson.content = pickLocalizedContent(diagnosesJson);
                        const mapped = diagnosesToRadarGradeData(diagnosesJson, 'skills');
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
                    const unwrapText = (v) => {
                        if (typeof v === 'string') return v;
                        if (v && typeof v === 'object') {
                            if (typeof v.content === 'string') return v.content;
                            if (typeof v.text === 'string') return v.text;
                        }
                        return '';
                    };
                    const pick = (...vals) => vals.find((v) => v !== undefined && v !== null);

                    if (!isEnglish) {
                        if (fieldName === 'fitness_diagnosis') return unwrapText(pick(data.fitness_diagnosis, data.diagnosis));
                        if (fieldName === 'training_plan') return unwrapText(pick(data.training_plan, data.plan));
                        if (fieldName === 'report_intro') return unwrapText(pick(data.report_intro, data.reportIntro));
                        return unwrapText(data[fieldName]);
                    }

                    if (fieldName === 'fitness_diagnosis') return unwrapText(pick(data.diagnosis_en, data.fitness_diagnosis_en, data.fitness_diagnosis));
                    if (fieldName === 'training_plan') return unwrapText(pick(data.plan_en, data.training_plan_en, data.training_plan));
                    if (fieldName === 'report_intro') return unwrapText(pick(data.report_intro_en, data.report_intro));

                    return unwrapText(pick(data[`${fieldName}_en`], data[fieldName]));
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

                // 雷达图数据：优先使用 diagnoses 的数据；失败则 fallback 到 AIReport.grade
                let gradeData;
                if (diagnosesGradeData) {
                    gradeData = diagnosesGradeData; // 新格式: {labels: [], values: []}
                } else {
                    // fallback到旧格式
                    const rawGrade = data.grade || {};
                    gradeData = {
                        driver: 0,
                        mainIron: 0,
                        wood: 0,
                        putting: 0,
                        scrambling: 0,
                        finesseWedges: 0,
                        irons: 0,
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

                // 使用 trackman_data
                const trackmanData = data.trackman_data || {};

                // 组装数据
                const report = {
                    id: id,
                    aiReportId: data.id || data.report_id || id,
                    rawAIReport: data,
                    studentId: data.student_id,
                    title: passedTitle || t('skillsReportTitle'),
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
                    trainingOutlook: trainingPlanText || t('benefitsDefault')
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
    }, [id, t, reloadToken, aiReportFetchEnabled, isWaitingForAiReport]);

    const handleGenerateAIReport = async () => {
        if (!id || loading || isCreatingAIReport) return;

        setAiReportFetchEnabled(true);
        setIsCreatingAIReport(true);
        setLoading(true);
        try {
            const userJson = localStorage.getItem('user');
            const user = userJson ? JSON.parse(userJson) : null;
            const token = user?.token || '';
            const headers = { 'Authorization': `Bearer ${token}` };

            // 直接使用 singleAssess 接口
            const response = await api.get(`/api/singleAssess/${id}`, { headers });

            const data = response.data;
            if (!data) {
                throw new Error('接口请求成功但返回数据为空');
            }
            console.log('[MentalReportDetailPage] Single assessment data:', data);

            // 触发重新拉取报告数据
            setReloadToken(token => token + 1);
        } catch (error) {
            const serverMsg = error.response?.data?.message || error.response?.data;
            const finalMsg = typeof serverMsg === 'string' ? serverMsg : (error.message || '生成AI报告失败');
            alert(finalMsg);
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

    const navigateBackToList = () => {
        // 返回到历史测评列表页面
        const backStudentId =
            reportData?.studentId ||
            student?.id ||
            location.state?.studentId ||
            location.state?.student?.id;

        if (backStudentId) {
            navigate(`/student/${backStudentId}/skills-report`);
            return;
        }

        if (onBack) {
            onBack();
            return;
        }

        navigate('/skills-report');
    };

    const handleBack = async () => {
        try {
            await saveTitleIfNeeded();
        } catch {
            // ignore
        }

        // 对比选择页：未选择直接返回 -> 二次确认
        if (showComparison && newReportData && !allSectionsSelected()) {
            setShowLeaveComparisonConfirm(true);
            return;
        }

        navigateBackToList();
    };

    useEffect(() => {
        // 不显示“还未生成AI报告”空态页：无报告时直接返回列表
        if (!loading && !reportData) {
            navigateBackToList();
        }
    }, [loading, reportData]);

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
        setIsCreatingAIReport(true);
        try {
            const userJson = localStorage.getItem('user');
            const user = userJson ? JSON.parse(userJson) : null;
            const token = user?.token || '';
            const uiLang = localStorage.getItem('language') || 'zh';
            const isEnglishUI = uiLang === 'en';

            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            // 保存报告前先确保标题已落库
            await saveTitleIfNeeded();

            if (!allSectionsSelected() || !id) {
                throw new Error('请先为所有部分选择版本');
            }

            // 优先使用新报告的 aiReportId；如果没有新报告，则使用当前报告的 aiReportId
            const reportId = newReportData?.aiReportId || reportData?.aiReportId;
            if (!reportId || reportId === id) {
                throw new Error('无法获取有效的 report_id。请先点击"重新生成"生成对比版本后再保存。');
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

            // 构建目标数据：按 UI 语言只生成对应侧，避免英文 UI 把英文写入中文字段
            const goalZhData = {};
            const goalEnData = {};
            finalTrainingGoals.forEach(goal => {
                const title = (goal.title || '').toString();
                const content = (goal.content || '').toString();
                const isLong = title.includes('长期') || title.includes('Long-term') || title.toLowerCase().includes('long');
                const isShort = title.includes('短期') || title.includes('Short-term') || title.toLowerCase().includes('short');

                if (isLong) {
                    if (isEnglishUI) {
                        goalEnData.long_term = content;
                    } else {
                        goalZhData['长期目标'] = content;
                        goalZhData.long_term = content;
                    }
                } else if (isShort) {
                    if (isEnglishUI) {
                        goalEnData.short_term = content;
                    } else {
                        goalZhData['短期目标'] = content;
                        goalZhData.short_term = content;
                    }
                }
            });

            if (finalTrainingGoals.length > 0) {
                if (isEnglishUI) {
                    if (!goalEnData.long_term && finalTrainingGoals[0]?.content) goalEnData.long_term = finalTrainingGoals[0].content;
                    if (!goalEnData.short_term && finalTrainingGoals[1]?.content) goalEnData.short_term = finalTrainingGoals[1].content;
                } else {
                    if (!goalZhData.long_term && finalTrainingGoals[0]?.content) {
                        goalZhData['长期目标'] = finalTrainingGoals[0].content;
                        goalZhData.long_term = finalTrainingGoals[0].content;
                    }
                    if (!goalZhData.short_term && finalTrainingGoals[1]?.content) {
                        goalZhData['短期目标'] = finalTrainingGoals[1].content;
                        goalZhData.short_term = finalTrainingGoals[1].content;
                    }
                }
            }

            // 构建诊断数据
            const diagnosisText = finalQualityAssessment.map(item =>
                `【${item.title}】${item.description}`
            ).join('\n');

            // 构建训练计划数据
            const trainingPlanText = finalTrainingOutlook || '';

            const toContentMap = (v, fallbackText) => {
                if (v && typeof v === 'object' && !Array.isArray(v)) {
                    if (typeof v.content === 'string') return { content: v.content };
                    if (typeof v.text === 'string') return { content: v.text };
                }
                if (typeof v === 'string') return { content: v };
                if (typeof fallbackText === 'string' && fallbackText.trim()) return { content: fallbackText };
                return null;
            };

            const goalSourceRaw = (selectedVersions.trainingGoals === 'new' ? newReportData : oldReportData)?.rawAIReport;
            const diagnosisSourceRaw = (selectedVersions.qualityAssessment === 'new' ? newReportData : oldReportData)?.rawAIReport;
            const planSourceRaw = (selectedVersions.trainingOutlook === 'new' ? newReportData : oldReportData)?.rawAIReport;

            const baseRaw = reportData?.rawAIReport || oldReportData?.rawAIReport || null;

            const goalZh = (goalSourceRaw?.goal && typeof goalSourceRaw.goal === 'object')
                ? goalSourceRaw.goal
                : (baseRaw?.goal && typeof baseRaw.goal === 'object')
                    ? baseRaw.goal
                    : (!isEnglishUI ? goalZhData : null);

            const goalEn = (goalSourceRaw?.goal_en && typeof goalSourceRaw.goal_en === 'object')
                ? goalSourceRaw.goal_en
                : (baseRaw?.goal_en && typeof baseRaw.goal_en === 'object')
                    ? baseRaw.goal_en
                    : (isEnglishUI ? goalEnData : null);

            const diagnosisZhMap = toContentMap(
                diagnosisSourceRaw?.fitness_diagnosis || diagnosisSourceRaw?.diagnosis || baseRaw?.fitness_diagnosis || baseRaw?.diagnosis,
                isEnglishUI ? undefined : diagnosisText
            );
            const planZhMap = toContentMap(
                planSourceRaw?.training_plan || planSourceRaw?.plan || baseRaw?.training_plan || baseRaw?.plan,
                isEnglishUI ? undefined : trainingPlanText
            );

            const diagnosisEnMap = toContentMap(
                diagnosisSourceRaw?.diagnosis_en || diagnosisSourceRaw?.fitness_diagnosis_en || baseRaw?.diagnosis_en || baseRaw?.fitness_diagnosis_en,
                isEnglishUI ? diagnosisText : undefined
            );
            const planEnMap = toContentMap(
                planSourceRaw?.plan_en || planSourceRaw?.training_plan_en || baseRaw?.plan_en || baseRaw?.training_plan_en,
                isEnglishUI ? trainingPlanText : undefined
            );

            const patchBody = {
                report_id: reportId,
                goal: goalZh || {},
                fitness_diagnosis: diagnosisZhMap,
                training_plan: planZhMap
            };

            if (goalEn) patchBody.goal_en = goalEn;
            if (diagnosisEnMap) patchBody.diagnosis_en = diagnosisEnMap;
            if (planEnMap) patchBody.plan_en = planEnMap;

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
        setIsWaitingForAiReport(true);
        setSkipLogoLoading(false);
        setLoading(true);
        const startTime = Date.now();

        try {
            const userJson = localStorage.getItem('user');
            const user = userJson ? JSON.parse(userJson) : null;
            const token = user?.token || '';
            const backendLang = getBackendLang();

            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            // 先取回当前诊断内容，用于 PATCH 重新生成时传回后端
            let diagnosisContent = [];
            try {
                const diagGetRes = await api.get(`/api/diagnoses/${id}`, { headers });
                if (diagGetRes.data) {
                    const diagData = diagGetRes.data;
                    const selected = pickLocalizedContent(diagData, backendLang === 'en' ? 'en' : 'zh');
                    diagnosisContent = (selected || []).map(item => ({
                        title: item.title || '',
                        grade: item.grade || item.level || 'L1',
                        content: item.content || ''
                    }));
                }
            } catch (e) {
                console.warn('Failed to fetch diagnoses before regenerate', e);
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

            // 保存当前报告数据作为旧报告
            const currentReportData = reportData;
            setOldReportData(currentReportData);
            setNewReportData(null);
            setShowComparison(false);

            const currentTitle = (titleDraft || passedTitle || reportData?.title || '').toString().trim();

            // 触发后端异步生成，并通过 WS 接收 completed/completed_compare
            const created = await createAIReport(id, { token, language: backendLang });
            const wsJob = startAIReportWsJob({
                token,
                assessmentId: id,
                wsEndpoint: created?.ws_endpoint || created?.wsEndpoint,
                jobId: created?.job_id || created?.jobId,
                jobMeta: { source: 'regenerate', title: currentTitle }
            });

            let wsResult;
            try {
                wsResult = await wsJob.done;
            } catch (wsErr) {
                throw new Error(wsErr?.message || wsErr?.payload?.error || '重新生成AI报告失败');
            }

            const wsPayload = wsResult?.payload || {};
            const resolvedReportId = wsPayload?.old_report_id || wsPayload?.report_id || null;
            const newReportRaw = wsPayload?.new_report || wsPayload?.report || null;
            if (!newReportRaw) {
                throw new Error('生成成功但未返回报告内容');
            }

            // 处理新报告数据（复用 fetchReportData 中的逻辑）
            const currentLanguage = localStorage.getItem('language') || 'zh';
            const isEnglish = currentLanguage === 'en';
            const getLocalizedField = (fieldName) => {
                const unwrapText = (v) => {
                    if (typeof v === 'string') return v;
                    if (v && typeof v === 'object') {
                        if (typeof v.content === 'string') return v.content;
                        if (typeof v.text === 'string') return v.text;
                    }
                    return '';
                };
                const pick = (...vals) => vals.find((v) => v !== undefined && v !== null);

                if (!isEnglish) {
                    if (fieldName === 'fitness_diagnosis') return unwrapText(pick(newReportRaw.fitness_diagnosis, newReportRaw.diagnosis));
                    if (fieldName === 'training_plan') return unwrapText(pick(newReportRaw.training_plan, newReportRaw.plan));
                    if (fieldName === 'report_intro') return unwrapText(pick(newReportRaw.report_intro, newReportRaw.reportIntro));
                    return unwrapText(newReportRaw[fieldName]);
                }

                if (fieldName === 'fitness_diagnosis') return unwrapText(pick(newReportRaw.diagnosis_en, newReportRaw.fitness_diagnosis_en, newReportRaw.fitness_diagnosis));
                if (fieldName === 'training_plan') return unwrapText(pick(newReportRaw.plan_en, newReportRaw.training_plan_en, newReportRaw.training_plan));
                if (fieldName === 'report_intro') return unwrapText(pick(newReportRaw.report_intro_en, newReportRaw.report_intro));

                return unwrapText(pick(newReportRaw[`${fieldName}_en`], newReportRaw[fieldName]));
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
                        title: t('skillsAssessment') || '技能评估',
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
                aiReportId: newReportRaw.id || newReportRaw.report_id || resolvedReportId,
                rawAIReport: newReportRaw,
                trainingGoals: trainingGoals,
                qualityAssessment: diagnosisSections.length > 0
                    ? diagnosisSections.map(section => ({
                        title: section.title,
                        description: section.content
                    }))
                    : [],
                trainingOutlook: trainingPlanText || t('benefitsDefault')
            };

            setNewReportData(processedNewReport);
            setShowComparison(true);
            // 重置选择状态
            setSelectedVersions({
                trainingGoals: null,
                qualityAssessment: null,
                trainingOutlook: null
            });

            // 更新 reportData 中的 aiReportId（使用 WS 返回的真实 report_id）
            if (resolvedReportId && resolvedReportId !== id) {
                setReportData(prev => (prev ? ({
                    ...prev,
                    aiReportId: resolvedReportId
                }) : prev));
            }

            // 确保logo动画至少运行10秒后再显示完成动画（与首次生成逻辑一致）
            const elapsedTime = Date.now() - startTime;
            const minAnimationTime = 10000; // 10秒
            const remainingTime = Math.max(0, minAnimationTime - elapsedTime);

            setTimeout(() => {
                setIsCompletingProgress(true);
                setTimeout(() => {
                    setIsWaitingForAiReport(false);
                    setIsCompletingProgress(false);
                    setSkipLogoLoading(true);
                    setLoading(false);
                }, 600);
            }, remainingTime);
        } catch (error) {
            console.error('Failed to regenerate report:', error);
            alert(error?.message || '重新生成失败');
            setIsWaitingForAiReport(false);
            setSkipLogoLoading(true);
            setLoading(false);
        } finally {
            setIsCreatingAIReport(false);
        }
    };

    if (isWaitingForAiReport || isCompletingProgress || (loading && !skipLogoLoading)) {
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
                            className={`logo-progress-fill${isCompletingProgress ? ' logo-progress-fill--complete' : !isWaitingForAiReport ? ' logo-progress-fill--fast' : ''}`}
                        />
                        {/* 95%时的向上加载光条效果 */}
                        {isWaitingForAiReport && !isCompletingProgress && (
                            <div className="logo-loading-energy">
                                <div className="logo-loading-stripe"></div>
                                <div className="logo-loading-stripe"></div>
                                <div className="logo-loading-stripe"></div>
                                <div className="logo-loading-stripe"></div>
                                <div className="logo-loading-stripe"></div>
                            </div>
                        )}
                    </div>
                    {isWaitingForAiReport && (
                        <>
                            <h2 className="text-2xl font-black text-white mb-2">
                                {t('generatingAIReport')}
                            </h2>
                            <p className="text-white/60 text-sm">
                                {t('waitAIReport')}
                            </p>
                            {!isCreatingAIReport && (
                                <div className="mt-6 flex items-center justify-center">
                                    <button
                                        onClick={handleBack}
                                        className="px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 transition-all"
                                        type="button"
                                    >
                                        {t('WatchLater')}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (loading && skipLogoLoading) {
        return (
            <div className="min-h-screen text-white p-6 flex items-center justify-center bg-transparent">
                <div className="text-center animate-pulse">
                    <p className="text-white/70 text-sm">{t('loadingAIReport')}</p>
                </div>
            </div>
        );
    }

    if (!reportData) return null;

    return (
        <div className={`report-detail-page ${showComparison ? 'pb-32 sm:pb-40' : ''}`}>
            <AssessmentHeader
                title={titleDraft || passedTitle || reportData.title || t('skillsReportTitle')}
                isEditingTitle={isEditingTitle}
                setIsEditingTitle={setIsEditingTitle}
                onTitleChange={(value) => {
                    setTitleTouched(true);
                    setTitleDraft(value);
                }}
                onSave={async () => {
                    await saveTitleIfNeeded();
                }}
                onBack={handleBack}
                t={t}
            />

            {showLeaveComparisonConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="surface-strong border border-white/10 rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-white text-lg font-bold mb-3 text-center">{t('confirmReturn')}</h3>
                        <p className="text-white/60 text-sm mb-6 text-center">{t('comparisonReminder')}</p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowLeaveComparisonConfirm(false)}
                                className="flex-1 px-6 py-3 rounded-full bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 transition-all"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowLeaveComparisonConfirm(false);
                                    navigateBackToList();
                                }}
                                className="flex-1 px-6 py-3 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-sm shadow-[0_10px_20px_rgba(212,175,55,0.3)] active:scale-95 transition-all"
                            >
                                {t('confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
                                                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                                            {itemsToShow.map((item, idx) => {
                                                                const isLast = idx === itemsToShow.length - 1;
                                                                const isOdd = itemsToShow.length % 2 !== 0;
                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={`rounded-xl border border-white/10 bg-white/5 px-3 py-2 ${isLast && isOdd ? 'col-span-2' : ''}`}
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
                                                                );
                                                            })}
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
                                                    <span>{isTrackmanDataExpanded ? t('collapse') : t('viewMoreMetrics')}</span>
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
                                    {selectedVersions.trainingGoals === 'old' ? t('selected') : t('select')}
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
                                        {t('NewVersion')}
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
                                            {selectedVersions.trainingGoals === 'new' ? t('selected') : t('select')}
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

                {/* 技能情况测评诊断 */}
                {reportData.qualityAssessment && reportData.qualityAssessment.length > 0 && (
                    <div className="report-section">
                        <div className="mb-4 sm:mb-8 flex flex-col gap-1">
                            <h2 className="text-[16px] sm:text-[20px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#d4af37]">
                                {t('skillsAssessmentDiagnosisTitle')}
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
                                    {selectedVersions.qualityAssessment === 'old' ? t('selected') : t('select')}
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
                                    {idx < reportData.qualityAssessment.length - 1 && (
                                        <div className="mx-6 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {/* 新版本对比（如果存在） */}
                        {showComparison && newReportData?.qualityAssessment && newReportData.qualityAssessment.length > 0 && (
                            <>
                                <div className="mt-4 sm:mt-6 mb-2 sm:mb-3 px-2">
                                    <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent"></div>
                                    <div className="mt-2 text-xs sm:text-sm text-[#d4af37]/80 font-bold uppercase tracking-widest text-center">
                                        {t('NewVersion')}
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
                                            {selectedVersions.qualityAssessment === 'new' ? t('selected') : t('select')}
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
                                            {idx < newReportData.qualityAssessment.length - 1 && (
                                                <div className="mx-6 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                            )}
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
                                        {selectedVersions.trainingOutlook === 'old' ? t('selected') : t('select')}
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
                                            {t('NewVersion')}
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
                                                {selectedVersions.trainingOutlook === 'new' ? t('selected') : t('select')}
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
                            <motion.button
                                whileTap={{ scale: allSectionsSelected() && !isCreatingAIReport ? 0.95 : 1 }}
                                onClick={handleSaveCustomVersion}
                                disabled={!allSectionsSelected() || isCreatingAIReport}
                                className="w-full h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-base sm:text-lg shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreatingAIReport ? t('saving') : (allSectionsSelected() ? t('saveChanges') : t('chooseVersion'))}
                            </motion.button>
                        ) : (
                            <div className="flex items-center gap-3">
                                <motion.button
                                    whileTap={{ scale: loading || isCreatingAIReport ? 1 : 0.95 }}
                                    onClick={handleSaveAndGoHome}
                                    disabled={loading || isCreatingAIReport}
                                    className="flex-1 h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-base sm:text-lg shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('saveOnly')}
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: loading || isCreatingAIReport ? 1 : 0.95 }}
                                    onClick={handleRegenerate}
                                    disabled={loading || isCreatingAIReport}
                                    className="flex-1 h-[54px] rounded-full surface-weak border border-white/10 text-white/80 font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t('RegenerateReport')}
                                </motion.button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillsReportDetailPage;
