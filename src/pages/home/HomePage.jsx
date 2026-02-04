/**
 * 能力评估主页
 * 功能：显示选中学员信息，功能模块入口（体能、心理、技能测评），操作指引
 * 路由：/student/:id
 * 大白话：这是登录后的主工作台，显示当前学员的基本信息、评估进度、历史报告入口，还有开始新测评的按钮
 */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronRight, Activity, Brain, Trophy, User, ChevronLeft } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useParams, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';

const HomePage = ({ student: initialStudent, navigate, onAddRecord, onStartCompleteAssessment, user }) => {
    const { id } = useParams();
    const location = useLocation();
    const { t, language } = useLanguage(); // 翻译函数
    const [isNavigating, setIsNavigating] = useState(false); // 导航中状态
    const [student, setStudent] = useState(initialStudent);
    const [loading, setLoading] = useState(!initialStudent || String(initialStudent.id) !== String(id));

    const pickLocalizedField = (obj, key) => {
        if (!obj) return '';
        if (language === 'en') return obj?.[`${key}_en`] ?? obj?.[key] ?? '';
        return obj?.[key] ?? obj?.[`${key}_en`] ?? '';
    };

    // 格式化 ID，如果长于 6 位取后 6 位
    const fmtId = (id) => {
        if (!id) return '--';
        const s = String(id);
        return s.length > 6 ? s.slice(-6) : s;
    };

    const animationsPaths = {
        bunny: '/animations_lottie/Bunny.lottie',
        robot: '/animations_lottie/Robot_Futuristic_Ai_animated.lottie',
        tiger: '/animations_lottie/Cute%20Tiger.lottie',
        cat: '/animations_lottie/Lovely_Cat.lottie',
        powerRobot: '/animations_lottie/Little_power_robot.lottie',
        pigeon: '/animations_lottie/Just%20a%20pigeon..lottie',
        chatbot: '/animations_lottie/chatbot.lottie',
        bloomingo: '/animations_lottie/Bloomingo.lottie',
        giraffe: '/animations_lottie/Meditating%20Giraffe.lottie',
        balloonRabbit: '/animations_lottie/Nice%20rabbit%20with%20balloon.lottie',
        partyDance: '/animations_lottie/Party%20Dance.lottie',
    };

    const getStudentAvatarKey = (targetStudent) => {
        const direct =
            targetStudent?.avatarAnimationKey ||
            targetStudent?.avatarKey ||
            targetStudent?.avatar_animation_key ||
            targetStudent?.avatarAnimation ||
            targetStudent?.avatar;

        if (direct) return direct;

        try {
            const raw = localStorage.getItem('studentAvatarMap');
            const map = raw ? JSON.parse(raw) : {};
            const lookupId = targetStudent?.id ?? id;
            return lookupId ? map[String(lookupId)] : undefined;
        } catch {
            return undefined;
        }
    };

    const avatarAnimationKey = useMemo(() => getStudentAvatarKey(student), [student]);
    const avatarAnimationSrc = avatarAnimationKey ? animationsPaths[avatarAnimationKey] : null;

    useEffect(() => {
        const routeStudent = location.state?.student;
        if (routeStudent && String(routeStudent.id) === String(id)) {
            setStudent({
                ...routeStudent,
                gender: typeof routeStudent.gender === 'number'
                    ? (routeStudent.gender === 0 ? t('female') : t('male'))
                    : routeStudent.gender,
                yearsOfGolf: routeStudent.golf_of_year ?? routeStudent.years_of_golf ?? routeStudent.yearsOfGolf,
                history: routeStudent.bio || routeStudent.history
            });
            setLoading(false);
            return;
        }
        // 先使用从 App.jsx 传下来的学员基础数据（如果已存在且ID匹配）
        if (id && initialStudent && String(initialStudent.id) === String(id)) {
            setStudent({
                ...initialStudent,
                gender: typeof initialStudent.gender === 'number'
                    ? (initialStudent.gender === 0 ? t('female') : t('male'))
                    : initialStudent.gender,
                yearsOfGolf: initialStudent.golf_of_year ?? initialStudent.years_of_golf ?? initialStudent.yearsOfGolf,
                history: initialStudent.bio || initialStudent.history
            });
            setLoading(false);
            return;
        }

        // 不再在首页兜底请求学员详情（GET /api/students/:id）。
        // 如果上游没有传入 initialStudent 或 ID 不匹配，则结束 loading 并显示占位信息。
        setStudent(initialStudent);
        setLoading(false);
    }, [id, initialStudent, t, location.state]);

    // 使用处理后的学员数据
    const getGenderDisplay = (gender) => {
        if (gender === undefined || gender === null || gender === '' || gender === '--') return '--';
        if (typeof gender === 'number') return gender === 0 ? t('female') : t('male');

        const g = String(gender).toLowerCase().trim();
        if (g === 'male' || g === '男') return t('male');
        if (g === 'female' || g === '女') return t('female');

        return gender; // 如果已经是翻译后的值，直接返回
    };

    const displayStudent = {
        name: student?.name || t('unselectedStudent'), // 学员姓名
        age: student?.age || "--", // 年龄
        gender: getGenderDisplay(student?.gender), // 性别
        yearsOfGolf: student?.yearsOfGolf ? `${student.yearsOfGolf}${t('yearUnit')}` : `--${t('yearUnit')}`, // 高尔夫年限
        history: pickLocalizedField(student, 'history') || student?.bio || t('noHistory'),
        purpose: pickLocalizedField(student, 'purpose') || student?.manualCheck?.purpose || student?.goal || t('coreGoalNotSet')
    };

    const handleNavigate = (path) => {
        if (isNavigating) return;
        setIsNavigating(true);
        // 统一导航到带 ID 的路径: /student/:id/physical-report
        navigate(`/student/${id}/${path}`);
    };

    const mainCards = [
        {
            title: t('physicalAssessment'),
            subtitle: "STYKU 3D DATA",
            icon: Activity,
            path: 'physical-report',
            isFull: true
        },
        {
            title: t('mentalAssessment'),
            subtitle: "MENTAL STABILITY",
            icon: Brain,
            path: 'mental-report',
            isFull: false
        },
        {
            title: t('skillsAssessment'),
            subtitle: "TRACKMAN PARAMETERS",
            icon: Trophy,
            path: 'skills-report',
            isFull: false
        }
    ];

    // 滚动动画：监听滚动位置，实现折叠效果
    const { scrollY } = useScroll();
    const scrollThreshold = 50; // 滚动阈值，超过这个值开始折叠

    // 头像缩放：从 1 缩小到 0.6
    const avatarScale = useTransform(
        scrollY,
        [0, scrollThreshold],
        [1, 0.6]
    );

    // 头像和文本的透明度：从 1 到 0.3
    const opacity = useTransform(
        scrollY,
        [0, scrollThreshold],
        [1, 0.3]
    );

    // 文本和ID的缩放：从 1 缩小到 0.7
    const textScale = useTransform(
        scrollY,
        [0, scrollThreshold],
        [1, 0.7]
    );

    // 垂直位置：向上移动
    const yOffset = useTransform(
        scrollY,
        [0, scrollThreshold],
        [0, -20]
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]"></div>
                    <p className="text-[#d4af37] font-bold tracking-widest uppercase text-xs">{t('loading') || 'LOADING...'}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen text-white relative overflow-hidden font-sans"
        >
            <div className="relative z-10 p-4 sm:p-6 pb-24 sm:pb-32 max-w-md mx-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-4 sm:mb-6 gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            onClick={() => navigate('/students')}
                            className="btn-back shrink-0"
                        >
                            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                        </button>
                        <h1 className="title-workbench">{t('workbenchTitle')}</h1>
                    </div>
                </header>

                {/* Student Info Card - Second Row */}
                <motion.div
                    className="relative flex flex-col items-center mb-6 sm:mb-8 p-6 sm:p-8 rounded-3xl backdrop-blur-xl bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/20 shadow-2xl shadow-black/20"
                    style={{
                        scale: textScale,
                        opacity: opacity,
                        y: yOffset
                    }}
                >
                    {/* 雾状光晕效果 */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#d4af37]/10 via-transparent to-transparent opacity-50"></div>
                    <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-[#d4af37]/20 via-transparent to-transparent blur-xl opacity-30"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent"></div>

                    {/* 内容容器 */}
                    <div className="relative z-10 w-full flex flex-col items-center">
                        <motion.div
                            className="relative mb-4"
                            style={{
                                scale: avatarScale
                            }}
                        >
                            {/* 多层金色光晕效果 */}
                            <div className="absolute inset-0 rounded-full bg-[#d4af37]/40 blur-xl animate-pulse-slow"></div>
                            <div className="absolute inset-[-8px] rounded-full bg-[#d4af37]/30 blur-2xl animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
                            <div className="absolute inset-[-16px] rounded-full bg-[#d4af37]/20 blur-[40px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
                            <div className="absolute inset-[-24px] rounded-full bg-[#d4af37]/15 blur-[60px] animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

                            {/* 头像容器 */}
                            <div className="student-avatar shadow-2xl shadow-[#d4af37]/50 border-4 border-black/20 relative z-10 w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] overflow-hidden">
                                {avatarAnimationSrc ? (
                                    <DotLottieReact src={avatarAnimationSrc} loop autoplay style={{ width: '100%', height: '100%' }} />
                                ) : (
                                    <User size={50} className="sm:w-[60px] sm:h-[60px]" />
                                )}
                            </div>
                        </motion.div>
                        <div className="text-center">
                            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-3 tracking-tighter text-white">{displayStudent.name}</p>
                            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-black/40 border border-white/10 shadow-inner">
                                <span className="text-[10px] sm:text-xs font-black text-[#d4af37] uppercase tracking-[0.2em] mr-3">OFFICIAL ID</span>
                                <span className="student-info-value text-xs sm:text-sm font-mono tracking-widest text-white/90">{fmtId(student?.id)}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Student Info Section - 3 Column Layout */}
                <div className="flex w-full justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                    <div className="student-info-card py-3 sm:py-4 px-7 sm:px-8 shrink-0">
                        <p className="student-info-label truncate px-0.5">{t('age')}</p>
                        <p className="student-info-value truncate">{displayStudent.age}{t('years')}</p>
                    </div>
                    <div className="student-info-card py-3 sm:py-4 px-3 sm:px-4 flex-1 min-w-0">
                        <p className="student-info-label truncate px-0.5">{t('gender')}</p>
                        <p className="student-info-value truncate">{displayStudent.gender}</p>
                    </div>
                    <div className="student-info-card py-3 sm:py-4 px-3 sm:px-4 flex-1 min-w-0">
                        <p className="student-info-label truncate px-0.5">{t('yearsOfGolf')}</p>
                        <p className="student-info-value truncate">{displayStudent.yearsOfGolf}</p>
                    </div>
                </div>

                {/* Detailed Info - Swapped to top */}
                {/* 12px vertical spacing */}
                <div className="space-y-3.5 sm:space-y-4 mb-4 sm:mb-6">
                    {displayStudent.history.length > 0 && (
                        <div className="student-info-card p-3 sm:p-4 w-full">
                            <p className="text-xs sm:text-sm font-bold text-[#d4af37] uppercase tracking-widest mb-1">{t('detailedHistory')}</p>
                            <p className="student-info-value break-words px-1 whitespace-pre-line">{displayStudent.history}</p>
                        </div>
                    )}
                </div>

                {/* Core Goal Card - Swapped to bottom */}
                <div className="student-info-card p-3 sm:p-4 mb-6 sm:mb-8 w-full">
                    <p className="text-xs sm:text-sm font-bold text-[#d4af37] mb-1 uppercase tracking-widest">{t('coreGoal')}</p>
                    <p className="student-info-value tracking-tight relative z-10 break-words px-1 whitespace-pre-line">{displayStudent.purpose}</p>
                </div>

                {/* Main Action Cards - 优化设计 */}
                <div className="grid grid-cols-2 gap-3 mb-6 sm:mb-8">
                    {mainCards.map((card, idx) => {
                        const Icon = card.icon;
                        // 为每个卡片模拟数据
                        const cardData = {
                            'physical-report': {
                                subtitle: 'STYKU 3D DATA',
                                indicators: [
                                    { label: t('explosiveness'), value: '85%' },
                                    { label: t('coreStabilityShort'), value: '70%' },
                                    { label: t('flexibility'), value: '90%' }
                                ],
                                waveData: { d1: "M0 30 Q40 10 80 30 T160 30 T240 30 T320 30", fill: 60 }
                            },
                            'mental-report': {
                                subtitle: 'MENTAL STABILITY',
                                indicators: [
                                    { label: '压力管理', value: '75%' },
                                    { label: '专注度', value: '80%' },
                                    { label: '心理韧性', value: '85%' }
                                ],
                                waveData: { d1: "M0 35 Q50 15 100 35 T200 35 T300 35", fill: 75 }
                            },
                            'skills-report': {
                                subtitle: 'TRACKMAN PARAMETERS',
                                indicators: [
                                    { label: '准确度', value: '88%' },
                                    { label: '距离控制', value: '92%' },
                                    { label: '挥杆稳定', value: '79%' }
                                ],
                                waveData: { d1: "M0 32 Q45 12 90 32 T180 32 T270 32", fill: 80 }
                            }
                        };
                        const data = cardData[card.path];

                        return (
                            <motion.button
                                key={idx}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleNavigate(card.path)}
                                className={cn(
                                    "relative surface-strong border-[#d4af37]/20 rounded-3xl p-5 text-left transition-all duration-300 hover:border-[#d4af37]/40 shadow-xl group overflow-hidden flex flex-col justify-between min-h-[160px]",
                                    card.isFull ? "col-span-2" : "col-span-1"
                                )}
                            >
                                <div className="w-full">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#d4af37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                    {/* 标题区 */}
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-10 h-10 rounded-xl surface-weak flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform duration-500 shrink-0">
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <h3 className="text-base sm:text-lg md:text-xl font-black text-white group-hover:text-[#d4af37] transition-colors duration-300 leading-tight truncate">{card.title}</h3>
                                            <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-[#6c7281] uppercase tracking-[0.15em] mb-0.5 whitespace-normal break-words">{data?.subtitle}</p>
                                        </div>
                                    </div>

                                    {/* 心理卡片波浪线动画 */}
                                    {card.path === 'mental-report' && (
                                        <div className="flex justify-center items-center h-16 mb-2 relative">
                                            <svg className="w-full h-12 overflow-visible" viewBox="0 0 160 30" preserveAspectRatio="none">
                                                <defs>
                                                    <filter id="wave-glow-mental" x="-20%" y="-20%" width="140%" height="140%">
                                                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                    </filter>
                                                </defs>
                                                <motion.path
                                                    d="M10 15 Q40 0 80 15 T150 15"
                                                    fill="none"
                                                    stroke="#d4af37"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    filter="url(#wave-glow-mental)"
                                                    animate={{ d: ["M10 15 Q40 5 80 15 T150 15", "M10 15 Q40 25 80 15 T150 15", "M10 15 Q40 5 80 15 T150 15"] }}
                                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                    className="opacity-80"
                                                />
                                                <motion.path
                                                    d="M10 15 Q40 30 80 15 T150 15"
                                                    fill="none"
                                                    stroke="#d4af37"
                                                    strokeWidth="1"
                                                    strokeLinecap="round"
                                                    filter="url(#wave-glow-mental)"
                                                    animate={{ d: ["M10 15 Q40 25 80 15 T150 15", "M10 15 Q40 5 80 15 T150 15", "M10 15 Q40 25 80 15 T150 15"] }}
                                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                    className="opacity-40"
                                                />
                                            </svg>
                                        </div>
                                    )}

                                    {/* 技能卡片特殊动画 */}
                                    {card.path === 'skills-report' && (
                                        <div className="flex justify-center items-center h-16 mb-2 relative">
                                            <svg className="w-full h-12 overflow-visible" viewBox="0 0 160 40" preserveAspectRatio="none">
                                                <defs>
                                                    <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
                                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                                        <feMerge>
                                                            <feMergeNode in="blur" />
                                                            <feMergeNode in="SourceGraphic" />
                                                        </feMerge>
                                                    </filter>
                                                </defs>
                                                <motion.path
                                                    d="M10 30 Q60 5 140 10"
                                                    fill="none"
                                                    stroke="#d4af37"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    className="opacity-80"
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 2, ease: "easeOut" }}
                                                />
                                                <motion.circle
                                                    cx="140"
                                                    cy="10"
                                                    r="4"
                                                    fill="#d4af37"
                                                    filter="url(#dot-glow)"
                                                    animate={{ r: [3, 5, 3], opacity: [0.6, 1, 0.6] }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                />
                                            </svg>
                                        </div>
                                    )}

                                    {/* 指标 - 仅物理卡片 */}
                                    {card.path === 'physical-report' && (
                                        <div className="flex items-center gap-4 mb-5">
                                            <div className="flex-[1] mt-4">
                                                <svg viewBox="0 0 110 110" className="w-full h-full drop-shadow-[0_0_12px_rgba(212,175,55,0.3)]">
                                                    <defs>
                                                        {/* 渐变定义 */}
                                                        <linearGradient id="radarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                            <stop offset="0%" stopColor="rgba(212,175,55,0.15)" />
                                                            <stop offset="50%" stopColor="rgba(255,214,120,0.25)" />
                                                            <stop offset="100%" stopColor="rgba(212,175,55,0.08)" />
                                                        </linearGradient>
                                                        <linearGradient id="radarStrokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#d4af37" />
                                                            <stop offset="50%" stopColor="#f5d36a" />
                                                            <stop offset="100%" stopColor="#d4af37" />
                                                        </linearGradient>
                                                        {/* 光晕效果 */}
                                                        <filter id="glow">
                                                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                                            <feMerge>
                                                                <feMergeNode in="coloredBlur" />
                                                                <feMergeNode in="SourceGraphic" />
                                                            </feMerge>
                                                        </filter>
                                                    </defs>
                                                    {/* 外圈 - 更柔和的样式 */}
                                                    <polygon
                                                        points="55,10 95,35 80,85 30,85 15,35"
                                                        fill="none"
                                                        stroke="rgba(255,255,255,0.08)"
                                                        strokeWidth="1.2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                    {/* 内圈 - 带渐变填充 */}
                                                    <polygon
                                                        points="55,25 85,45 75,75 35,75 25,45"
                                                        fill="url(#radarGradient)"
                                                        stroke="url(#radarStrokeGradient)"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        filter="url(#glow)"
                                                        className="group-hover:fill-[#d4af37]/25 group-hover:stroke-[#f5d36a] transition-all duration-500"
                                                    />
                                                    {/* 数据点 - 带光晕效果 */}
                                                    <g fill="#d4af37" filter="url(#glow)">
                                                        <circle cx="55" cy="25" r="3.5" opacity="0.9" />
                                                        <circle cx="85" cy="45" r="3.5" opacity="0.9" />
                                                        <circle cx="75" cy="75" r="3.5" opacity="0.9" />
                                                        <circle cx="35" cy="75" r="3.5" opacity="0.9" />
                                                        <circle cx="25" cy="45" r="3.5" opacity="0.9" />
                                                    </g>
                                                    {/* 中心点装饰 */}
                                                    <circle cx="55" cy="50" r="1.5" fill="#d4af37" opacity="0.6" />
                                                </svg>
                                            </div>

                                            {/* 指标 */}
                                            <div className="flex-[2] space-y-2.5">
                                                {data?.indicators.map((ind, i) => (
                                                    <div key={i} className="space-y-1">
                                                        <div className="flex justify-between text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-widest">
                                                            <span className="text-gray-500">{ind.label}</span>
                                                            <span className="text-[#d4af37]">{ind.value}</span>
                                                        </div>
                                                        <div className="h-[3px] bg-[#1e2430] rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: ind.value }}
                                                                className="h-full bg-gradient-to-r from-[#d4af37] to-[#b8860b]"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 装饰图标 - 仅物理测评 */}
                                {card.path === 'physical-report' && (
                                    <div className="absolute -top-10 -right-10 w-48 h-48 opacity-[0.03] group-hover:opacity-10 pointer-events-none transition-all duration-1000 rotate-12 group-hover:scale-110">
                                        <Icon size={150} />
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Complete Assessment Button */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onStartCompleteAssessment && onStartCompleteAssessment()}
                    className="w-full h-[54px] sm:h-[60px] rounded-2xl sm:rounded-[32px] bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-base sm:text-lg uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(212,175,55,0.2)] flex items-center justify-center gap-3 transition-all hover:shadow-[0_25px_50px_rgba(212,175,55,0.3)] active:scale-95"
                >
                    <span>{t('completeTest')}</span>
                </motion.button>
            </div>
        </div>
    );
};

export default HomePage;

