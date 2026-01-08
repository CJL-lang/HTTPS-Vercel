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
        // 直接使用从 App.jsx 传下来的学员基础数据
        if (id && initialStudent && String(initialStudent.id) === String(id)) {
            setStudent({
                ...initialStudent,
                gender: typeof initialStudent.gender === 'number'
                    ? (initialStudent.gender === 0 ? t('female') : t('male'))
                    : initialStudent.gender,
                yearsOfGolf: initialStudent.years_of_golf || initialStudent.yearsOfGolf
            });
            setLoading(false);
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
                            <p className="student-info-value break-words px-1">"{displayStudent.history}"</p>
                        </div>
                    )}
                </div>

                {/* Core Goal Card - Swapped to bottom */}
                <div className="student-info-card p-3 sm:p-4 mb-6 sm:mb-8 w-full">
                    <p className="text-xs sm:text-sm font-bold text-[#d4af37] mb-1 uppercase tracking-widest">{t('coreGoal')}</p>
                    <p className="student-info-value tracking-tight relative z-10 break-words px-1">{displayStudent.purpose}</p>
                </div>

                {/* Main Action Cards */}
                <div className="grid grid-cols-2 gap-3 mb-6 sm:mb-8">
                    {mainCards.map((card, idx) => {
                        const Icon = card.icon;
                        return (
                            <motion.button
                                key={idx}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleNavigate(card.path)}
                                className={cn(
                                    "relative group overflow-hidden rounded-2xl sm:rounded-[32px] p-4 sm:p-6 text-left transition-all duration-500",
                                    "border border-[#d4af37]/30 surface-strong hover:border-[#d4af37]/60 shadow-2xl shadow-black/50",
                                    card.isFull ? "col-span-2 py-6 sm:py-8" : "col-span-1"
                                )}
                            >
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                                        <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#d4af37]/10 text-[#d4af37] flex-shrink-0 border border-[#d4af37]/20">
                                            <Icon size={20} className="sm:w-6 sm:h-6" />
                                        </div>
                                        {/* 为身体素质测评卡片添加装饰图 - 调大尺寸并优化响应式 */}
                                        {card.path === 'physical-report' && (
                                            <div className="absolute -top-6 -right-6 w-44 h-44 sm:w-72 sm:h-72 opacity-30 sm:opacity-40 group-hover:opacity-50 sm:group-hover:opacity-60 group-hover:scale-110 transition-all duration-1000 pointer-events-none select-none overflow-hidden">
                                                <img
                                                    src="/img1.png"
                                                    alt="decoration"
                                                    className="w-full h-full object-contain filter brightness-200 contrast-200"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 relative z-20">
                                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-white uppercase truncate drop-shadow-md">{card.title}</h3>
                                    </div>
                                </div>
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

