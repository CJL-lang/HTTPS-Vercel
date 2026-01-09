/**
 * 能力评估主页
 * 功能：显示选中学员信息，功能模块入口（体能、心理、技能测评），操作指引
 * 路由：/student/:id
 * 大白话：这是登录后的主工作台，显示当前学员的基本信息、评估进度、历史报告入口，还有开始新测评的按钮
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Activity, Brain, Trophy, User, ChevronLeft } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';

const HomePage = ({ student: initialStudent, navigate, onAddRecord, onStartCompleteAssessment, user }) => {
    const { id } = useParams();
    const { t } = useLanguage(); // 翻译函数
    const [isNavigating, setIsNavigating] = useState(false); // 导航中状态
    const [student, setStudent] = useState(initialStudent);
    const [loading, setLoading] = useState(!initialStudent || String(initialStudent.id) !== String(id));

    // 格式化 ID，如果长于 6 位取后 6 位
    const fmtId = (id) => {
        if (!id) return '--';
        const s = String(id);
        return s.length > 6 ? s.slice(-6) : s;
    };

    useEffect(() => {
        // 先使用从 App.jsx 传下来的学员基础数据（如果已存在且ID匹配）
        if (id && initialStudent && String(initialStudent.id) === String(id)) {
            setStudent({
                ...initialStudent,
                gender: typeof initialStudent.gender === 'number'
                    ? (initialStudent.gender === 0 ? t('female') : t('male'))
                    : initialStudent.gender,
                yearsOfGolf: initialStudent.years_of_golf || initialStudent.yearsOfGolf,
                history: initialStudent.bio || initialStudent.history
            });
            setLoading(false);
            return;
        }

        // 如果没有初始学员或ID不匹配，则主动 GET 学员详情
        if (id && (!student || String(student?.id) !== String(id))) {
            const saved = localStorage.getItem('user');
            let token = null;
            try {
                token = saved ? JSON.parse(saved)?.token : null;
            } catch (e) {
                token = null;
            }

            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            setLoading(true);
            fetch(`/api/students/${id}`, { method: 'GET', headers })
                .then(async (res) => {
                    if (!res.ok) throw new Error(`GET /api/students/${id} failed: ${res.status}`);
                    const data = await res.json();
                    setStudent({
                        ...data,
                        gender: typeof data.gender === 'number' ? (data.gender === 0 ? t('female') : t('male')) : data.gender,
                        yearsOfGolf: data.years_of_golf || data.yearsOfGolf,
                        history: data.bio || data.history
                    });
                })
                .catch(() => {
                    // 保守降级：如果获取失败，保持加载结束以避免卡住
                })
                .finally(() => setLoading(false));
        }
    }, [id, initialStudent, t]);

    // 使用处理后的学员数据
    const getGenderDisplay = (gender) => {
        if (!gender || gender === '--') return '--';
        if (gender === 'male' || gender === '男') return t('male');
        if (gender === 'female' || gender === '女') return t('female');
        if (typeof gender === 'number') return gender === 0 ? t('female') : t('male');
        return gender; // 如果已经是翻译后的值，直接返回
    };

    const displayStudent = {
        name: student?.name || t('unselectedStudent'), // 学员姓名
        age: student?.age || "--", // 年龄
        gender: getGenderDisplay(student?.gender), // 性别
        yearsOfGolf: student?.yearsOfGolf ? `${student.yearsOfGolf}${t('yearUnit')}` : `--${t('yearUnit')}`, // 高尔夫年限
        history: student?.bio || student?.history || t('noHistory'), // 优先使用后端返回的 bio 作为训练历史
        purpose: student?.manualCheck?.purpose || student?.goal || t('coreGoalNotSet') // 核心训练目标
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
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
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
                <div className="student-info-card p-3 sm:p-4 flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 w-full h-[120px]">
                    <div className="student-avatar">
                        <User size={32} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-3xl font-black mb-2 truncate tracking-tight text-[#d4af37]">{displayStudent.name}</p>
                        <p className="student-info-value text-xs sm:text-sm truncate">ID: {fmtId(student?.id)}</p>
                    </div>
                </div>

                {/* Student Info Section - 3 Column Layout */}
                <div className="grid w-full grid-cols-[repeat(3,minmax(0,max-content))] justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                    <div className="student-info-card py-3 sm:py-4 px-8 sm:px-10">
                        <p className="student-info-label truncate px-0.5">{t('age')}</p>
                        <p className="student-info-value truncate">{displayStudent.age}{t('years')}</p>
                    </div>
                    <div className="student-info-card py-3 sm:py-4 px-8 sm:px-10">
                        <p className="student-info-label truncate px-0.5">{t('gender')}</p>
                        <p className="student-info-value truncate">{displayStudent.gender}</p>
                    </div>
                    <div className="student-info-card py-3 sm:py-4 px-8 sm:px-10">
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
                            <p className="student-info-value break-words px-1">{displayStudent.history}</p>
                        </div>
                    )}
                </div>

                {/* Core Goal Card - Swapped to bottom */}
                <div className="student-info-card p-3 sm:p-4 mb-6 sm:mb-8 w-full">
                    <p className="text-xs sm:text-sm font-bold text-[#d4af37] mb-1 uppercase tracking-widest">{t('coreGoal')}</p>
                    <p className="student-info-value tracking-tight relative z-10 break-words px-1">{displayStudent.purpose}</p>
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
                                    { label: '爆发力', value: '85%' },
                                    { label: '核心稳定', value: '70%' },
                                    { label: '柔韧度', value: '90%' }
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
                                            <h3 className="text-lg font-black text-white group-hover:text-[#d4af37] transition-colors duration-300 leading-tight truncate">{card.title}</h3>
                                            <p className="text-[9px] font-bold text-[#6c7281] uppercase tracking-[0.15em] mb-0.5 whitespace-normal break-words">{data?.subtitle}</p>
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
                                            <div className="flex-1">
                                                <svg viewBox="0 0 110 110" className="w-full h-full drop-shadow-[0_0_8px_rgba(212,175,55,0.2)]">
                                                    <polygon points="55,10 95,35 80,85 30,85 15,35" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                                                    <polygon points="55,25 85,45 75,75 35,75 25,45" fill="rgba(212,175,55,0.08)" stroke="#d4af37" strokeWidth="1.5" className="group-hover:fill-[#d4af37]/20 transition-all duration-500" />
                                                    <g fill="#d4af37">
                                                        <circle cx="55" cy="25" r="2.5" />
                                                        <circle cx="85" cy="45" r="2.5" />
                                                        <circle cx="75" cy="75" r="2.5" />
                                                        <circle cx="35" cy="75" r="2.5" />
                                                        <circle cx="25" cy="45" r="2.5" />
                                                    </g>
                                                </svg>
                                            </div>

                                            {/* 指标 */}
                                            <div className="flex-1 space-y-2.5">
                                                {data?.indicators.map((ind, i) => (
                                                    <div key={i} className="space-y-1">
                                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
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

                                {/* 波浪线 */}
                                <div className="relative h-10 -mx-5 -mb-5 mt-auto overflow-hidden opacity-40 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-full h-full" viewBox="0 0 300 60" preserveAspectRatio="none">
                                        <path d={data?.waveData.d1} fill="none" stroke="#d4af37" strokeWidth="2" className="animate-[pulse_3s_ease-in-out_infinite]" />
                                    </svg>
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#1e2430]">
                                        <div className="h-full bg-[#d4af37]" style={{ width: `${data?.waveData.fill}%` }}></div>
                                    </div>
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
        </motion.div>
    );
};

export default HomePage;

