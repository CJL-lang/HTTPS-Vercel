/**
 * 测评数据管理 Hook
 * 负责测评数据的状态管理和更新
 */
import { useState, useEffect, useRef } from 'react';
import {
    getDiagnosisFromBackend,
    getPlanFromBackend,
    getGoalFromBackend,
    getSingleAssessment
} from '../utils/assessmentApi';

export const useAssessmentData = (assessmentData, activePrimary, activeSecondary, t, user) => {
    const initialAssessmentId = assessmentData?.assessment_id || assessmentData?.id || '';

    // 标记各模块是否在后端已有数据，用于决定保存时用 POST 还是 PATCH
    const [hasBackendData, setHasBackendData] = useState({
        assessment_data: false, // 采集数据 (Styku/Trackman/Mental)
        diagnosis: false,
        plan: false,
        goal: false
    });

    // 防止“旧请求晚返回覆盖新报告数据”
    const requestSeqRef = useRef(0);

    // 按 assessmentId 缓存已加载的数据，避免重复请求（含 StrictMode 双执行）
    const moduleCacheRef = useRef({});

    const createEmptyRecordData = (assessmentId, title = '', activePrimaryForDefault = 0, tForDefault = (k) => k) => ({
        assessmentId: assessmentId,
        title: title || ({
            0: tForDefault('physicalAssessment'),
            1: tForDefault('mentalAssessment'),
            2: tForDefault('skillsAssessment')
        }[activePrimaryForDefault] || ''),
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
            focus: '', stress: '', confidence: '', stability: '', notes: ''
        },
        diagnosisData: {
            stance: '', grip: '', coordination: '',
            backswing: '', downswing: '', tempo: '',
            stability: '', direction: '', power: '',
            shortGame: '', greenside: '',
            handCoordination: '', bodyUsage: ''
        },
        physicalDiagnosis: null,
        mentalDiagnosis: null,
        skillsDiagnosis: null,
        mentalPlan: null,
        physicalPlan: null,
        physicalGoals: null,
        mentalGoals: null,
        skillsGoals: null,
        planData: {
            point1: '', point2: '', extra: ''
        },
        goalData: {
            stage1: '', stage2: '', stage3: ''
        }
    });

    const [recordData, setRecordData] = useState(() => {
        const titleToUse = assessmentData?.title != null ? assessmentData.title : '';
        return createEmptyRecordData(initialAssessmentId, titleToUse, activePrimary, t);
    });

    // 当切换到另一份报告（assessmentId 变化）时：立即清空旧 state，避免先展示上一份数据
    useEffect(() => {
        // 重置后端数据存在标记
        setHasBackendData({
            assessment_data: false,
            diagnosis: false,
            plan: false,
            goal: false
        });

        // 清空旧数据并同步标题
        const titleToUse = assessmentData?.title != null ? assessmentData.title : '';
        setRecordData(createEmptyRecordData(initialAssessmentId, titleToUse, activePrimary, t));

        // 重置缓存
        if (initialAssessmentId) {
            moduleCacheRef.current[initialAssessmentId] = {
                assessment_data: undefined,
                diagnosis: undefined,
                plan: undefined,
                goal: undefined
            };
        }
    }, [initialAssessmentId]);

    // 按当前二级 Tab 懒加载：点哪个板块只请求哪个模块
    useEffect(() => {
        const moduleBySecondary = {
            0: 'assessment_data',
            1: 'diagnosis',
            2: 'plan',
            3: 'goal'
        };

        const applyAssessmentData = (basicData) => {
            setRecordData(prev => {
                const newData = { ...prev };
                newData.assessmentId = initialAssessmentId;
                if (assessmentData?.title) newData.title = assessmentData.title;

                if (basicData) {
                    const ad = basicData;
                    if (activePrimary === 0) {
                        newData.stykuData = {
                            height: ad.height || '', weight: ad.weight || '',
                            sittingHeight: ad.sitting_height || '', bmi: ad.bmi || '',
                            torso: { chest: ad.chest || '', waist: ad.waist || '', hip: ad.hip || '' },
                            upperLimbs: { upperArm: ad.upper_arm || '', forearm: ad.forearm || '' },
                            lowerLimbs: { thigh: ad.thigh || '', calf: ad.calf || '' }
                        };
                    } else if (activePrimary === 1) {
                        newData.mentalData = {
                            focus: ad.focus || '',
                            stability: ad.stability || '',
                            confidence: ad.confidence || '',
                            stress: ad.stress || '',
                            notes: ad.notes || ''
                        };
                    } else if (activePrimary === 2) {
                        newData.trackmanData = {
                            ...newData.trackmanData,
                            layerA: {
                                ballSpeed: ad.ball_speed || '', launchAngle: ad.launch_angle || '',
                                launchDirection: ad.launch_direction || '', spinRate: ad.spin_rate || '',
                                spinAxis: ad.spin_axis || '', carry: ad.carry || '',
                                landingAngle: ad.landing_angle || '', offline: ad.offline || ''
                            },
                            layerB: {
                                clubSpeed: ad.club_speed || '', attackAngle: ad.attack_angle || '',
                                clubPath: ad.club_path || '', faceAngle: ad.face_angle || '',
                                faceToPath: ad.face_to_path || '', dynamicLoft: ad.dynamic_loft || '',
                                smashFactor: ad.smash_factor || '', spinLoft: ad.spin_loft || ''
                            },
                            layerC: {
                                lowPoint: ad.low_point || '', impactOffset: ad.impact_offset || '',
                                indexing: ad.indexing || ''
                            }
                        };
                    }
                }

                return newData;
            });
        };

        const applyDiagnosis = (diagnosisList) => {
            if (!diagnosisList || diagnosisList.length === 0) return;
            setRecordData(prev => {
                const newData = { ...prev };

                // Get existing items to reuse IDs
                let existingItems = [];
                if (activePrimary === 0) existingItems = prev.physicalDiagnosis || [];
                else if (activePrimary === 1) existingItems = prev.mentalDiagnosis || [];
                else if (activePrimary === 2) existingItems = prev.skillsDiagnosis || [];

                const existingMap = new Map();
                existingItems.forEach(item => {
                    if (item && item.title) existingMap.set(item.title, item.id);
                });

                const formattedDiagnosis = diagnosisList.map(item => ({
                    id: existingMap.get(item.title) || crypto?.randomUUID?.() || Math.random().toString(36).substring(2, 11),
                    title: item.title,
                    content: item.content,
                    grade: item.grade || '',
                    workoutroutine: item.workoutroutine || item.testResult || ''
                }));

                if (activePrimary === 0) newData.physicalDiagnosis = formattedDiagnosis;
                else if (activePrimary === 1) newData.mentalDiagnosis = formattedDiagnosis;
                else if (activePrimary === 2) {
                    const skillsData = {};
                    formattedDiagnosis.forEach(item => {
                        skillsData[item.title] = item.content;
                        skillsData[`${item.title}_level`] = item.grade;
                    });
                    newData.skillsDiagnosis = formattedDiagnosis;
                    newData.diagnosisData = { ...newData.diagnosisData, ...skillsData };
                }

                return newData;
            });
        };

        const applyPlans = (planList) => {
            if (!planList || planList.length === 0) return;
            setRecordData(prev => {
                const newData = { ...prev };

                // Get existing items to reuse IDs
                let existingItems = [];
                if (activePrimary === 0) existingItems = prev.physicalPlan || [];
                else if (activePrimary === 1) existingItems = prev.mentalPlan || [];
                else if (activePrimary === 2) existingItems = prev.skillsPlan || [];

                const existingMap = new Map();
                existingItems.forEach(item => {
                    if (item && item.title) existingMap.set(item.title, item.id);
                });

                const formattedPlans = planList.map(item => ({
                    id: existingMap.get(item.title) || crypto?.randomUUID?.() || Math.random().toString(36).substring(2, 11),
                    title: item.title,
                    content: item.content
                }));

                if (activePrimary === 0) newData.physicalPlan = formattedPlans;
                else if (activePrimary === 1) newData.mentalPlan = formattedPlans;
                else if (activePrimary === 2) {
                    newData.skillsPlan = formattedPlans;
                    const pMap = { '训练要点1': 'point1', '训练要点2': 'point2', '额外说明': 'extra' };
                    formattedPlans.forEach(p => {
                        if (pMap[p.title]) newData.planData[pMap[p.title]] = p.content;
                    });
                }

                return newData;
            });
        };

        const applyGoals = (goalList) => {
            if (!goalList || goalList.length === 0) return;
            setRecordData(prev => {
                const newData = { ...prev };

                // Get existing items to reuse IDs
                let existingItems = [];
                if (activePrimary === 0) existingItems = prev.physicalGoals || [];
                else if (activePrimary === 1) existingItems = prev.mentalGoals || [];
                else if (activePrimary === 2) existingItems = prev.skillsGoals || [];

                const existingMap = new Map();
                existingItems.forEach(item => {
                    if (item && item.title) existingMap.set(item.title, item.id);
                });

                const formattedGoals = goalList.map(item => ({
                    id: existingMap.get(item.title) || crypto?.randomUUID?.() || Math.random().toString(36).substring(2, 11),
                    title: item.title,
                    content: item.content
                }));

                if (activePrimary === 0) newData.physicalGoals = formattedGoals;
                else if (activePrimary === 1) newData.mentalGoals = formattedGoals;
                else if (activePrimary === 2) newData.skillsGoals = formattedGoals;

                return newData;
            });
        };

        const loadModule = async () => {
            if (!initialAssessmentId || !user?.token) return;

            const currentModule = moduleBySecondary[activeSecondary] || 'assessment_data';
            moduleCacheRef.current[initialAssessmentId] = moduleCacheRef.current[initialAssessmentId] || {
                assessment_data: undefined,
                diagnosis: undefined,
                plan: undefined,
                goal: undefined
            };

            const cacheEntry = moduleCacheRef.current[initialAssessmentId];

            // 有缓存则直接应用，避免重复请求
            if (cacheEntry[currentModule] !== undefined) {
                if (currentModule === 'assessment_data') applyAssessmentData(cacheEntry.assessment_data);
                if (currentModule === 'diagnosis') applyDiagnosis(cacheEntry.diagnosis);
                if (currentModule === 'plan') applyPlans(cacheEntry.plan);
                if (currentModule === 'goal') applyGoals(cacheEntry.goal);

                setHasBackendData(prev => ({
                    ...prev,
                    [currentModule]: Array.isArray(cacheEntry[currentModule])
                        ? cacheEntry[currentModule].length > 0
                        : !!cacheEntry[currentModule]
                }));
                return;
            }

            const seq = ++requestSeqRef.current;

            if (currentModule === 'assessment_data') {
                // 重新接回后端聚合接口：GET /singleAssess/:ass_id
                // 用于“数据采集”页面回显已存在的采集数据（Styku/Mental/Trackman）
                const res = await getSingleAssessment(initialAssessmentId, user);
                if (seq !== requestSeqRef.current) return;

                // 兼容不同后端返回结构
                const basicData = res?.data ?? res?.assessment_data ?? res?.content ?? res;

                cacheEntry.assessment_data = basicData || null;
                applyAssessmentData(basicData || null);
                setHasBackendData(prev => ({ ...prev, assessment_data: !!basicData }));
                return;
            }

            if (currentModule === 'diagnosis') {
                const diagnosisList = await getDiagnosisFromBackend(initialAssessmentId, user);
                if (seq !== requestSeqRef.current) return;

                const normalized = diagnosisList || [];
                setHasBackendData(prev => ({ ...prev, diagnosis: normalized.length > 0 }));
                cacheEntry.diagnosis = normalized;
                applyDiagnosis(normalized);
                return;
            }

            if (currentModule === 'plan') {
                const planList = await getPlanFromBackend(initialAssessmentId, user);
                if (seq !== requestSeqRef.current) return;

                const normalized = planList || [];
                setHasBackendData(prev => ({ ...prev, plan: normalized.length > 0 }));
                cacheEntry.plan = normalized;
                applyPlans(normalized);
                return;
            }

            if (currentModule === 'goal') {
                const goalList = await getGoalFromBackend(initialAssessmentId, user);
                if (seq !== requestSeqRef.current) return;

                const normalized = goalList || [];
                setHasBackendData(prev => ({ ...prev, goal: normalized.length > 0 }));
                cacheEntry.goal = normalized;
                applyGoals(normalized);
            }
        };

        loadModule();
    }, [initialAssessmentId, user?.token, activePrimary, activeSecondary, assessmentData?.title]);

    // NOTE: default title is now applied during initial state creation

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
    };

    return { recordData, setRecordData, updateRecordData, hasBackendData, setHasBackendData };
};
