/**
 * 测评数据管理 Hook
 * 负责测评数据的状态管理和更新
 */
import { useState, useEffect, useRef } from 'react';
import { 
    getDiagnosisFromBackend, 
    getPlanFromBackend, 
    getGoalFromBackend,
    getFullAssessmentData 
} from '../utils/assessmentApi';

export const useAssessmentData = (assessmentData, activePrimary, activeSecondary, t, user) => {
    const initialAssessmentId = assessmentData?.id || assessmentData?.assessment_id || '';

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

    const createEmptyRecordData = (assessmentId, title = '', activePrimaryForDefault = 0, tForDefault = (k)=>k) => ({
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

    const [recordData, setRecordData] = useState(() => createEmptyRecordData(initialAssessmentId, assessmentData?.title || '', activePrimary, t));

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
        setRecordData(createEmptyRecordData(initialAssessmentId, assessmentData?.title || '', activePrimary, t));

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

                const formattedDiagnosis = diagnosisList.map(item => ({
                    id: crypto?.randomUUID?.() || Math.random().toString(36).substring(2, 11),
                    title: item.title,
                    content: item.content,
                    grade: item.grade || ''
                }));

                if (activePrimary === 0) newData.physicalDiagnosis = formattedDiagnosis;
                else if (activePrimary === 1) newData.mentalDiagnosis = formattedDiagnosis;
                else if (activePrimary === 2) {
                    const skillsData = {};
                    diagnosisList.forEach(item => {
                        skillsData[item.title] = item.content;
                        skillsData[`${item.title}_level`] = item.grade;
                    });
                    newData.skillsDiagnosis = diagnosisList;
                    newData.diagnosisData = { ...newData.diagnosisData, ...skillsData };
                }

                return newData;
            });
        };

        const applyPlans = (planList) => {
            if (!planList || planList.length === 0) return;
            setRecordData(prev => {
                const newData = { ...prev };

                const formattedPlans = planList.map(item => ({
                    id: crypto?.randomUUID?.() || Math.random().toString(36).substring(2, 11),
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

                const formattedGoals = goalList.map(item => ({
                    id: crypto?.randomUUID?.() || Math.random().toString(36).substring(2, 11),
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
            console.log('[useAssessmentData] Lazy loading module:', currentModule, 'for ID:', initialAssessmentId);

            if (currentModule === 'assessment_data') {
                // 采集数据模块不需要从后端加载，会在数据采集步骤中创建或更新
                // 跳过加载，避免调用不存在的 /singleAssess 接口
                console.log('[useAssessmentData] Skipping assessment_data load - will be created in data collection step');
                cacheEntry.assessment_data = null;
                setHasBackendData(prev => ({ ...prev, assessment_data: false }));
                return;
            }

            if (currentModule === 'diagnosis') {
                const diagnosisList = await getDiagnosisFromBackend(initialAssessmentId, user);
                if (seq !== requestSeqRef.current) return;
                
                // 如果 GET 返回空（新 assessment 还没有诊断数据），创建一个空记录
                if (!diagnosisList || diagnosisList.length === 0) {
                    console.log('[useAssessmentData] No diagnosis data found, creating empty record');
                    const { saveDiagnosisToBackend } = await import('../utils/assessmentApi');
                    const TYPE_MAP = ['physical', 'mental', 'skills'];
                    const type = TYPE_MAP[activePrimary];
                    const backendLang = localStorage.getItem('language') === 'en' ? 'en' : 'cn';
                    
                    // 创建空的诊断记录，避免后续 404
                    await saveDiagnosisToBackend(type, [], initialAssessmentId, user, null, backendLang);
                    setHasBackendData(prev => ({ ...prev, diagnosis: false }));
                } else {
                    setHasBackendData(prev => ({ ...prev, diagnosis: true }));
                }
                
                cacheEntry.diagnosis = diagnosisList || [];
                applyDiagnosis(diagnosisList || []);
                return;
            }

            if (currentModule === 'plan') {
                const planList = await getPlanFromBackend(initialAssessmentId, user);
                if (seq !== requestSeqRef.current) return;
                
                // 如果 GET 返回空（新 assessment 还没有训练计划），创建一个空记录
                if (!planList || planList.length === 0) {
                    console.log('[useAssessmentData] No plan data found, creating empty record');
                    const { savePlanToBackend } = await import('../utils/assessmentApi');
                    const TYPE_MAP = ['physical', 'mental', 'skills'];
                    const type = TYPE_MAP[activePrimary];
                    const backendLang = localStorage.getItem('language') === 'en' ? 'en' : 'cn';
                    
                    // 创建空的训练计划记录，避免后续 404
                    await savePlanToBackend(type, [], initialAssessmentId, user, null, '', backendLang);
                    setHasBackendData(prev => ({ ...prev, plan: false }));
                } else {
                    setHasBackendData(prev => ({ ...prev, plan: true }));
                }
                
                cacheEntry.plan = planList || [];
                applyPlans(planList || []);
                return;
            }

            if (currentModule === 'goal') {
                const goalList = await getGoalFromBackend(initialAssessmentId, user);
                if (seq !== requestSeqRef.current) return;
                
                // 如果 GET 返回空（新 assessment 还没有目标数据），创建一个空记录
                if (!goalList || goalList.length === 0) {
                    console.log('[useAssessmentData] No goal data found, creating empty record');
                    const { saveGoalToBackend } = await import('../utils/assessmentApi');
                    const TYPE_MAP = ['physical', 'mental', 'skills'];
                    const type = TYPE_MAP[activePrimary];
                    const backendLang = localStorage.getItem('language') === 'en' ? 'en' : 'cn';
                    
                    // 创建空的目标记录，避免后续 404
                    await saveGoalToBackend(type, [], initialAssessmentId, user, null, backendLang);
                    setHasBackendData(prev => ({ ...prev, goal: false }));
                } else {
                    setHasBackendData(prev => ({ ...prev, goal: true }));
                }
                
                cacheEntry.goal = goalList || [];
                applyGoals(goalList || []);
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
