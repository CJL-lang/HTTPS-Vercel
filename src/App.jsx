import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomNav from './components/BottomNav';
import AppRoutes from './router/AppRoute';
import { useLanguage } from './utils/LanguageContext';
import { setupFetchInterceptor } from './utils/fetchInterceptor';
import { createAssessment } from './pages/assessment/utils/assessmentApi';

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) return false;
        try {
            const user = JSON.parse(savedUser);
            return !!user.token;
        } catch (e) {
            return false;
        }
    });
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [isCheckingAuth, setIsCheckingAuth] = useState(() => {
        // 如果localStorage中有token，需要验证
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                return !!user.token;
            } catch (e) {
                return false;
            }
        }
        return false;
    });
    const navigate = useNavigate();
    const location = useLocation();
    const initialPathRef = useRef(location.pathname); // 存储初始路径
    const [initialPrimaryTab, setInitialPrimaryTab] = useState(0);
    const [currentAssessmentData, setCurrentAssessmentData] = useState(null);
    const { t, language, setLanguage } = useLanguage();

    // 初始化时验证token有效性
    useEffect(() => {
        const verifyToken = async () => {
            const savedUser = localStorage.getItem('user');
            if (!savedUser) {
                setIsCheckingAuth(false);
                return;
            }

            try {
                const user = JSON.parse(savedUser);
                if (!user.token) {
                    setIsCheckingAuth(false);
                    setIsLoggedIn(false);
                    setCurrentUser(null);
                    return;
                }

                // 验证token是否有效 - 使用一个轻量级的API调用
                const response = await fetch('/api/relatedStudents', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`
                    },
                });

                if (response.status === 401) {
                    // Token过期，清除登录状态
                    setIsLoggedIn(false);
                    setCurrentUser(null);
                    localStorage.removeItem('user');
                    // 如果当前不在登录页，跳转到登录页
                    if (initialPathRef.current !== '/login' && initialPathRef.current !== '/register') {
                        navigate('/login', { replace: true });
                    }
                } else if (response.ok) {
                    // Token有效，保持登录状态，不跳转（保持在当前页面）
                    setIsLoggedIn(true);
                    setCurrentUser(user);
                } else {
                    // 其他错误，保持当前状态但标记验证完成
                    setIsLoggedIn(true);
                    setCurrentUser(user);
                }
            } catch (error) {
                // 网络错误等，保持当前状态但标记验证完成
                // 如果localStorage中有token，保持登录状态
                const user = JSON.parse(savedUser);
                setIsLoggedIn(!!user.token);
                setCurrentUser(user);
            } finally {
                setIsCheckingAuth(false);
            }
        };

        // 只在有token时才验证
        if (isCheckingAuth) {
            verifyToken();
        }
    }, []); // 只在组件挂载时执行一次

    // Handle redirection for logged-in users visiting auth pages or root
    // 只在验证完成后才进行重定向
    useEffect(() => {
        if (isCheckingAuth) return; // 正在验证时，不进行重定向

        if (isLoggedIn) {
            const isAuthPage = ['/login', '/register', '/'].includes(location.pathname);
            const isStudentOnCoachPage = currentUser?.role === 'student' && location.pathname === '/students';

            if (isAuthPage || isStudentOnCoachPage) {
                if (currentUser?.role === 'student') {
                    const studentId = currentUser.studentId || currentUser.id;
                    navigate(studentId ? `/student/${studentId}` : '/students', { replace: true });
                } else {
                    navigate('/students', { replace: true });
                }
            }
        } else {
            // 如果未登录且不在登录/注册页，且验证已完成，跳转到登录页
            if (!['/login', '/register'].includes(location.pathname)) {
                navigate('/login', { replace: true });
            }
        }
    }, [isLoggedIn, location.pathname, navigate, currentUser, isCheckingAuth]);

    // 路由变化时滚动到页面顶部（解决局域网环境下的滚动问题）
    useEffect(() => {
        // 延迟执行确保页面已渲染
        const timer = setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    const [students, setStudents] = useState([]);
    const lastFetchedStudentsTokenRef = useRef(null);

    // 集中刷新学生列表的函数，可在创建新学员后调用
    const refreshStudents = React.useCallback(async () => {
        if (!isLoggedIn || !currentUser?.token) return;
        try {
            const response = await fetch('/api/relatedStudents', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
            });

            if (response.ok) {
                const studentsData = await response.json();
                if (Array.isArray(studentsData)) {
                    const mappedStudents = studentsData.map(student => ({
                        ...student,
                        gender: student.gender === 0 ? t('female') : student.gender === 1 ? t('male') : t('unknown'),
                        displayId: student.id ? student.id.slice(-6) : t('unknown'),
                        yearsOfGolf: student.golf_of_year ?? student.years_of_golf ?? student.yearsOfGolf,
                        history: student.bio || student.history
                    }));
                    setStudents(mappedStudents);
                }
            }
        } catch (error) {
            // 忽略错误，保持现有列表
        }
    }, [isLoggedIn, currentUser?.token]);

    // 首次登录后加载学生列表（避免重复拉取）
    useEffect(() => {
        if (isCheckingAuth) return;
        if (isLoggedIn && currentUser?.token && lastFetchedStudentsTokenRef.current !== currentUser.token) {
            lastFetchedStudentsTokenRef.current = currentUser.token;
            refreshStudents();
        }
    }, [isLoggedIn, currentUser?.token, isCheckingAuth, refreshStudents]);

    const [currentStudentIndex, setCurrentStudentIndex] = useState(null);

    // 根据 URL 自动同步 currentStudentIndex
    useEffect(() => {
        if (students.length > 0) {
            // 匹配多种路径模式: /student/:id, /physical-report/:id, /mental-report/:id, etc.
            // 注意：报告详情页的 ID 是 assessment_id，我们需要通过报告数据反查学生，或者匹配包含 student 的路径
            const path = location.pathname;

            // 1. 直接匹配 /student/:id
            let match = path.match(/\/student\/([^/]+)/);
            let studentId = match ? match[1] : null;

            if (studentId) {
                const index = students.findIndex(s => String(s.id) === String(studentId));
                if (index !== -1 && index !== currentStudentIndex) {
                    setCurrentStudentIndex(index);
                }
            }
        }
    }, [students, location.pathname, currentStudentIndex]);

    const [tempStudent, setTempStudent] = useState({
        name: '',
        gender: '',
        age: '',
        yearsOfGolf: '',
        history: '',
        physical: { height: '', weight: '', bodyFat: '' },
        manualCheck: { historyFreq: '', purpose: '', medical: '' },
        introduction: '',
        whyGoal: '',
        goalBenefits: '',
        trainingRisks: '',
        stykuData: {
            height: '', weight: '', sittingHeight: '', bmi: '',
            torso: { chest: '', waist: '', hip: '' },
            upperLimbs: { upperArm: '', forearm: '' },
            lowerLimbs: { thigh: '', calf: '' }
        },
        trackmanData: {
            problems: '',
            layerA: {
                ballSpeed: '', launchAngle: '', launchDirection: '', spinRate: '',
                spinAxis: '', carry: '', landingAngle: '', offline: ''
            },
            layerB: {
                clubSpeed: '', attackAngle: '', clubPath: '', faceAngle: '',
                faceToPath: '', dynamicLoft: '', smashFactor: '', spinLoft: ''
            },
            layerC: {
                lowPoint: '', impactOffset: '', indexing: ''
            }
        },
        diagnosis: {
            stance: '', grip: '', coordination: '',
            backswing: '', downswing: '', tempo: '',
            stability: '', direction: '', power: '',
            shortGame: '', greenside: '',
            handCoordination: '', bodyUsage: ''
        },
        plan: { point1: '', point2: '', extra: '' },
        goal: ''
    });

    const selectStudent = (index) => {
        setCurrentStudentIndex(index);
        const studentId = students[index].id;
        navigate(`/student/${studentId}`);
        // 滚动到页面顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 新测评入口：导航到测评类型选择页面
    const handleStartNewAssessment = () => {
        navigate('/assessment-type');
    };

    // 直接开始完整测评
    const handleStartCompleteAssessment = async () => {
        const student = students[currentStudentIndex];
        const studentId = student?.id;

        if (!studentId) {
            alert(language === 'en' ? 'Please select a student first' : '请先选择学员');
            return;
        }

        try {
            const backendLang = language === 'en' ? 'en' : 'cn';
            const defaultTitle = language === 'en' ? 'Complete Assessment' : '完整测评';

            // 1. 立即创建 physical 类型的 assessment
            const assessmentId = await createAssessment(
                studentId,
                'physical',
                currentUser,
                defaultTitle,
                backendLang
            );

            if (assessmentId) {
                // 清除之前的草稿和状态，确保是全新的测评
                const userId = currentUser?.id || 'guest';
                localStorage.removeItem(`draft_${userId}_${studentId}_physical`);
                localStorage.removeItem(`draft_${userId}_${studentId}_mental`);
                localStorage.removeItem(`draft_${userId}_${studentId}_skills`);
                sessionStorage.removeItem(`showCompleteActions_${studentId}_physical`);
                sessionStorage.removeItem(`showCompleteActions_${studentId}_mental`);
                sessionStorage.removeItem(`showCompleteActions_${studentId}_technique`);
                sessionStorage.removeItem('continueCompleteTest');

                const assessmentData = {
                    assessment_id: assessmentId,
                    id: assessmentId,
                    mode: 'complete',
                    type: 'physical',
                    title: defaultTitle,
                    date: new Date().toISOString().split('T')[0],
                    note: ''
                };
                setInitialPrimaryTab(0);
                setCurrentAssessmentData(assessmentData);
                navigate('/add-record/physical/data', {
                    state: {
                        assessmentData,
                        student: student
                    }
                });
            } else {
                alert(language === 'en' ? 'Failed to create assessment' : '创建测评记录失败');
            }
        } catch (error) {
            console.error('Failed to start complete assessment:', error);
        }
    };

    // 从身体素质报告页面直接开始单项测评
    const handleStartPhysicalAssessment = () => {
        const assessmentData = {
            mode: 'single',
            type: 'physical',
            date: new Date().toISOString().split('T')[0],
            note: ''
        };
        setInitialPrimaryTab(0); // 身体素质是第一个tab
        setCurrentAssessmentData(assessmentData);
        navigate('/add-record/physical/data', { state: { assessmentData } });
    };

    // 从心理报告页面直接开始单项测评
    const handleStartMentalAssessment = () => {
        const assessmentData = {
            mode: 'single',
            type: 'mental',
            date: new Date().toISOString().split('T')[0],
            note: ''
        };
        setInitialPrimaryTab(1); // 心理是第二个tab
        setCurrentAssessmentData(assessmentData);
        navigate('/add-record/mental/data', { state: { assessmentData } });
    };

    // 从技能报告页面直接开始单项测评
    const handleStartSkillsAssessment = () => {
        const assessmentData = {
            mode: 'single',
            type: 'technique',
            date: new Date().toISOString().split('T')[0],
            note: ''
        };
        setInitialPrimaryTab(2); // 技能是第三个tab
        setCurrentAssessmentData(assessmentData);
        navigate('/add-record/technique/data', { state: { assessmentData } });
    };

    // 从新测评页开始具体测评（带入类型/时间/备注等数据）
    const handleStartAssessment = async (typeIndex, assessmentData) => {
        setInitialPrimaryTab(typeIndex);

        const student = students[currentStudentIndex];
        const studentId = student?.id;

        if (!studentId) {
            alert(language === 'en' ? 'Please select a student first' : '请先选择学员');
            return;
        }

        try {
            const backendLang = language === 'en' ? 'en' : 'cn';
            const typeMap = { physical: 'physical', mental: 'mental', technique: 'technique', skills: 'technique' };

            // 确定要创建的类型：如果是完整测评则默认为 physical
            const currentType = assessmentData?.mode === 'complete' ? 'physical' : (assessmentData?.type || 'physical');
            const backendType = typeMap[currentType] || 'physical';

            // 根据类型生成中文标题
            let defaultTitle = assessmentData?.title;
            if (!defaultTitle) {
                const titleMap = {
                    'physical': '身体素质测评',
                    'mental': '心理测评',
                    'technique': '技能测评',
                    'skills': '技能测评'
                };
                defaultTitle = titleMap[currentType] || (language === 'en' ? 'New Assessment' : '新测评');
            }

            // 预先创建 assessment 记录
            const assessmentId = await createAssessment(
                studentId,
                backendType,
                currentUser,
                defaultTitle,
                backendLang
            );

            if (assessmentId) {
                // 清除该类型的旧草稿和状态
                const userId = currentUser?.id || 'guest';
                const typeForStorage = backendType === 'technique' ? 'skills' : backendType;
                localStorage.removeItem(`draft_${userId}_${studentId}_${typeForStorage}`);
                sessionStorage.removeItem(`showCompleteActions_${studentId}_${backendType}`);

                // 如果是完整测评，清除所有相关草稿
                if (assessmentData?.mode === 'complete') {
                    localStorage.removeItem(`draft_${userId}_${studentId}_mental`);
                    localStorage.removeItem(`draft_${userId}_${studentId}_skills`);
                    sessionStorage.removeItem(`showCompleteActions_${studentId}_mental`);
                    sessionStorage.removeItem(`showCompleteActions_${studentId}_technique`);
                    sessionStorage.removeItem('continueCompleteTest');
                }

                const finalAssessmentData = {
                    ...assessmentData,
                    assessment_id: assessmentId,
                    id: assessmentId,
                    type: currentType,
                    title: defaultTitle
                };

                setCurrentAssessmentData(finalAssessmentData);

                const routeType = typeMap[currentType] || 'physical';
                navigate(`/add-record/${routeType}/data`, {
                    state: { assessmentData: finalAssessmentData, student }
                });

                // 滚动到页面顶部（延迟执行确保页面已渲染）
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
            } else {
                alert(language === 'en' ? 'Failed to create assessment' : '创建测评记录失败');
            }
        } catch (error) {
            console.error('Failed to pre-create assessment:', error);
        }
    }; const startAddStudent = () => {
        setCurrentStudentIndex(null);
        setTempStudent({
            name: '',
            gender: '',
            age: '',
            yearsOfGolf: '',
            history: '',
            physical: { height: '', weight: '', bodyFat: '' },
            manualCheck: { historyFreq: '', purpose: '', medical: '' },
            stykuData: {
                height: '', weight: '', sittingHeight: '', bmi: '',
                torso: { chest: '', waist: '', hip: '' },
                upperLimbs: { upperArm: '', forearm: '' },
                lowerLimbs: { thigh: '', calf: '' }
            },
            trackmanData: {
                problems: '',
                layerA: {
                    ballSpeed: '', launchAngle: '', launchDirection: '', spinRate: '',
                    spinAxis: '', carry: '', landingAngle: '', offline: ''
                },
                layerB: {
                    clubSpeed: '', attackAngle: '', clubPath: '', faceAngle: '',
                    faceToPath: '', dynamicLoft: '', smashFactor: '', spinLoft: ''
                },
                layerC: {
                    lowPoint: '', impactOffset: '', indexing: ''
                }
            },
            diagnosis: {
                stance: '', grip: '', coordination: '',
                backswing: '', downswing: '', tempo: '',
                stability: '', direction: '', power: '',
                shortGame: '', greenside: '',
                handCoordination: '', bodyUsage: ''
            },
            plan: { point1: '', point2: '', extra: '' },
            goal: ''
        });
        navigate('/basic-info');
    };

    const saveNewStudent = () => {
        if (!tempStudent.name) {
            alert('请至少填写学员姓名');
            return;
        }
        const newStudent = {
            ...tempStudent,
            id: `G${String(students.length + 1).padStart(4, '0')}`
        };
        const newStudents = [...students, newStudent];
        setStudents(newStudents);
        setCurrentStudentIndex(newStudents.length - 1);
        navigate(`/student/${newStudent.id}`);
    };

    const updateCurrentStudent = (updatedData) => {
        if (currentStudentIndex !== null) {
            const newStudents = [...students];
            newStudents[currentStudentIndex] = updatedData;
            setStudents(newStudents);
        } else {
            setTempStudent(updatedData);
        }
    };

    const resetData = () => {
        // Just return to students list for now, or we could delete the current student
        navigate('/students');
    };

    // 智能返回逻辑：根据当前路由返回到合适的页面
    const handleSmartBack = () => {
        const currentPath = location.pathname;
        const studentId = currentData?.id;
        const homePath = studentId ? `/student/${studentId}` : '/students';

        // 处理报告详情页的返回（带 ID 的详情页不要返回首页，而是返回列表页）
        // 报告详情页的返回逻辑已经在各个详情页组件内部处理，这里不需要拦截

        // 处理报告列表页的返回
        if (currentPath === '/mental-report' ||
            currentPath === '/physical-report' ||
            currentPath === '/skills-report' ||
            currentPath === '/ai-report' ||
            currentPath.match(/^\/student\/[^/]+\/(mental|physical|skills)-report$/)) {
            navigate(homePath);
            return;
        }

        // 根据当前页面提供特定的返回目标
        const backRoutes = {
            '/add-record': homePath,
            '/add-record/physical': '/physical-report',
            // ... existing code ...
            '/home-old': homePath
        };

        // 如果当前路由有定义的返回目标，使用之；否则使用历史记录回退
        if (backRoutes[currentPath]) {
            navigate(backRoutes[currentPath]);
        } else {
            navigate(-1);
        }
    };

    // Sync currentStudentIndex with URL if on a student-specific page
    useEffect(() => {
        const pathParts = location.pathname.split('/');
        // 检查路径中是否包含 student/:id 或者 report/:id 等模式
        // 简单起见，如果路径中有任何一部分匹配已有的学生ID，就切换到该学生
        const potentialId = pathParts.find(part => students.some(s => s.id === part));

        if (potentialId) {
            const index = students.findIndex(s => s.id === potentialId);
            if (index !== -1 && index !== currentStudentIndex) {
                setCurrentStudentIndex(index);
            }
        }
    }, [location.pathname, students, currentStudentIndex]);

    const currentData = currentStudentIndex !== null ? students[currentStudentIndex] : tempStudent;

    const handleLogin = async (userData) => {
        if (userData.action === 'goRegister') {
            navigate('/register');
            return;
        }
        setCurrentUser(userData);
        setIsLoggedIn(true);
        setIsCheckingAuth(false); // 登录成功，不需要验证
        localStorage.setItem('user', JSON.stringify(userData));

        // 根据用户角色导航到不同页面
        if (userData.role === 'coach') {
            navigate('/students');
        } else if (userData.role === 'student') {
            // 如果是学生登录，尝试跳转到其个人主页，如果没有ID则跳转到学生列表（或报错）
            const studentId = userData.studentId || userData.id;
            if (studentId) {
                navigate(`/student/${studentId}`);
            } else {
                navigate('/students');
            }
        } else {
            navigate('/students'); // 默认页面
        }
    };

    const handleRegister = (regData) => {
        // 注册成功后的逻辑，自动登录并跳转到学员列表页
        console.log('handleRegister 被调用，接收到的数据:', regData);

        if (regData && regData.token) {
            console.log('检测到 token，保存用户信息并跳转到学员列表页');
            setCurrentUser(regData);
            setIsLoggedIn(true);
            setIsCheckingAuth(false);
            localStorage.setItem('user', JSON.stringify(regData));
            navigate('/students');
        } else {
            console.log('未检测到 token，跳转到登录页');
            navigate('/login');
        }
    };

    const handleLogout = useCallback(() => {
        setIsLoggedIn(false);
        setCurrentUser(null);
        localStorage.removeItem('user');
        navigate('/login');
    }, [navigate]);

    // 处理页面跳转并滚动到顶部
    const handleNext = useCallback((target) => {
        const path = typeof target === 'string' ? (target.startsWith('/') ? target : `/${target}`) : '/students';
        navigate(path);
        // 滚动到页面顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [navigate]);

    // 全局 Fetch 拦截器：处理 401 Token 失效并统一注入 Token
    useEffect(() => {
        // Use a getter that always reads from localStorage to avoid stale closure capturing
        const getTokenFromStorage = () => {
            try {
                const saved = localStorage.getItem('user');
                if (!saved) return null;
                const parsed = JSON.parse(saved);
                return parsed?.token || null;
            } catch (e) {
                return null;
            }
        };

        return setupFetchInterceptor(handleLogout, getTokenFromStorage);
    }, [handleLogout]);

    // 权限控制：目前不做角色限制，所有角色可访问所有页面
    const hasPermission = (page) => {
        return true;
    };

    // 获取当前页面标识（用于导航高亮）
    const currentPage = location.pathname.split('/')[1] || 'students';

    return (
        <div className="min-h-screen bg-black">
            {/* Global Background Layer - Always Present */}
            <div className="fixed inset-0 z-0 app-background-image">
                {/* Dark overlay for readability */}
                <div className="absolute inset-0 backdrop-blur-md" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}></div>
            </div>

            <div className="relative z-10">
                <div className="max-w-md mx-auto min-h-screen relative selection:bg-[#d4af37]/30">
                    {/* Premium Dynamic Glows */}
                    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#d4af37]/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#b8860b]/10 rounded-full blur-[120px] animate-pulse-slow animation-delay-negative"></div>
                    </div>

                    {isCheckingAuth ? (
                        // 验证token时显示loading，避免闪现LoginPage
                        <div className="flex items-center justify-center min-h-screen">
                            <div className="text-white text-lg">{t('loading')}</div>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <motion.div layout key={location.pathname} className="relative">
                                <AppRoutes
                                    isLoggedIn={isLoggedIn}
                                    location={location}
                                    student={currentData}
                                    data={currentData}
                                    setData={updateCurrentStudent}
                                    onLogin={handleLogin}
                                    onRegister={handleRegister}
                                    onLogout={handleLogout}
                                    user={currentUser}
                                    userRole={currentUser?.role}
                                    navigate={(path, options) => navigate(path.startsWith('/') ? path : `/${path}`, options)}
                                    onBack={handleSmartBack}
                                    onNext={handleNext}
                                    students={students}
                                    onSelectStudent={selectStudent}
                                    onAddStudent={startAddStudent}
                                    refreshStudents={refreshStudents}
                                    handleStartPhysicalAssessment={handleStartPhysicalAssessment}
                                    handleStartMentalAssessment={handleStartMentalAssessment}
                                    handleStartSkillsAssessment={handleStartSkillsAssessment}
                                    handleStartCompleteAssessment={handleStartCompleteAssessment}
                                    handleStartNewAssessment={handleStartNewAssessment}
                                    onStartNewAssessment={handleStartNewAssessment}
                                    onStartAssessment={handleStartAssessment}
                                    onReset={resetData}
                                    initialPrimary={initialPrimaryTab}
                                    setInitialPrimaryTab={setInitialPrimaryTab}
                                    assessmentData={currentAssessmentData}
                                />
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {/* Bottom Navigation - show on all pages except specific ones like addRecord and login */}
                    {isLoggedIn && !['add-record', 'assessment-type', 'new-assessment', 'single-assessment', 'ai-report', 'login', 'register'].includes(currentPage) &&
                        !location.pathname.match(/\/(physical-report|mental-report|skills-report)\/[^/]+$/) && (
                            <BottomNav
                                currentPage={currentPage}
                                onNavigate={async (path) => {
                                    // 点击学员导航时先刷新学员列表
                                    if (path === 'students') {
                                        await refreshStudents();
                                    }
                                    navigate(`/${path}`);
                                }}
                                userRole={currentUser?.role}
                            />
                        )}
                </div>
            </div>
        </div>
    );
}
