/**
 * 能力评估主页
 * 功能：显示选中学员信息，功能模块入口（体能、心理、技能测评），操作指引
 * 路由：/home
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Activity, Brain, Trophy, Info, User, ChevronLeft } from 'lucide-react';
import { cn } from '../utils/cn';
import { useLanguage } from '../utils/LanguageContext';

const HomePage = ({ student, navigate, onAddRecord }) => {
    const { t } = useLanguage();
    const [isNavigating, setIsNavigating] = useState(false);

    // 使用传入的学员数据，如果没有则显示占位符
    const displayStudent = {
        name: student?.name || t('unselectedStudent'),
        age: student?.age || "--",
        gender: student?.gender || "--",
        yearsOfGolf: student?.yearsOfGolf ? `${student.yearsOfGolf}${t('years')} ${t('yearsOfGolf')}` : `--${t('years')} ${t('yearsOfGolf')}`,
        history: student?.history || t('noHistory'),
        // 核心目标优先使用后端 students.purpose，其次 manualCheck.purpose，再次 goal
        purpose: student?.purpose || student?.manualCheck?.purpose || student?.goal || t('coreGoal')
    };

    const handleNavigate = (path) => {
        if (isNavigating) return;
        setIsNavigating(true);
        if (path === 'physical-report' && student?.id) {
            navigate(`${path}/${student.id}`);
        } else {
            navigate(path);
        }
    };

    const handleStartAssessment = () => {
        if (isNavigating) return;
        setIsNavigating(true);
        if (onAddRecord) {
            onAddRecord();
        } else {
            navigate('assessment-type');
        }
    };

    // 动态判断各模块状态
    const getStatus = (type) => {
        switch (type) {
            case 'styku':
                return Object.keys(student?.stykuData || {}).length > 0 ? t('statusSynced') : t('statusPendingSync');
            case 'diagnosis':
                return student?.diagnosis?.stance ? t('statusEvaluated') : t('statusPendingEval');
            case 'trackman':
                return student?.trackmanData?.layerA?.ballSpeed ? t('statusCompleted') : t('statusPendingTest');
            case 'basic':
                return student?.manualCheck?.purpose ? t('statusCompleted') : t('statusPendingFill');
            default:
                return t('statusPending');
        }
    };

    const mainCards = [
        {
            title: t('physicalAssessment'),
            subtitle: "STYKU 3D DATA",
            status: getStatus('styku'),
            icon: Activity,
            path: 'physical-report',
            isFull: true
        },
        {
            title: t('mentalAssessment'),
            subtitle: "MENTAL STABILITY",
            status: getStatus('diagnosis'),
            icon: Brain,
            path: 'mental-report',
            isFull: false
        },
        {
            title: t('skillsAssessment'),
            subtitle: "TRACKMAN PARAMETERS",
            status: getStatus('trackman'),
            icon: Trophy,
            path: 'skills-report',
            isFull: false
        }
    ];

    return (
        <div className="min-h-screen text-white relative overflow-hidden font-sans">
            <div className="relative z-10 p-6 pb-32 max-w-md mx-auto">
                {/* Back Button */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate('students')}
                        className="btn-back"
                    >
                        <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                    </button>

                    <button
                        onClick={() => navigate('home-old')}
                        className="px-3 py-1.5 rounded-full surface-weak border border-white/10 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/40 hover:text-[#d4af37] hover:border-[#d4af37]/30 transition-all active:scale-95"
                    >
                        <Info size={12} />
                        {t('returnOldVersion')}
                    </button>
                </div>

                {/* Header */}
                <header className="flex justify-between items-start mb-10">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#d4af37] mb-1">{t('managementPortal')}</p>
                        <h1 className="text-4xl font-bold tracking-tighter">{t('workbenchTitle')}</h1>
                    </div>
                    <div className="surface rounded-2xl p-3 flex items-center gap-3 border border-white/10">
                        <div className="text-right">
                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">{t('currentStudentLabel')}</p>
                            <p className="text-sm font-bold">{displayStudent.name}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-[#d4af37] flex items-center justify-center text-black font-bold text-xs">
                            <User size={20} />
                        </div>
                    </div>
                </header>

                {/* Student Info Section - 3 Column Layout */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="student-info-card py-4 px-2">
                        <p className="text-sm font-bold text-[#d4af37] mb-1 uppercase tracking-widest">{t('age')}</p>
                        <p className="text-sm font-bold text-white">{displayStudent.age}{t('years')}</p>
                    </div>
                    <div className="student-info-card py-4 px-2">
                        <p className="text-sm font-bold text-[#d4af37] mb-1 uppercase tracking-widest">{t('gender')}</p>
                        <p className="text-sm font-bold text-white">{displayStudent.gender}</p>
                    </div>
                    <div className="student-info-card py-4 px-2">
                        <p className="text-sm font-bold text-[#d4af37] mb-1 uppercase tracking-widest">{t('yearsOfGolf')}</p>
                        <p className="text-sm font-bold text-white">{displayStudent.yearsOfGolf}</p>
                    </div>
                </div>

                {/* Detailed Info - Swapped to top */}
                <div className="space-y-3 mb-3">
                    {displayStudent.history.length > 0 && (
                        <div className="student-info-card p-4">
                            <p className="text-sm font-bold text-[#d4af37] uppercase tracking-widest mb-1">{t('detailedHistory')}</p>
                            <p className="text-sm font-bold text-white">"{displayStudent.history}"</p>
                        </div>
                    )}
                </div>

                {/* Core Goal Card - Swapped to bottom */}
                <div className="student-info-card p-4 mb-6">
                    <p className="text-sm font-bold text-[#d4af37] mb-1 uppercase tracking-widest">{t('coreGoal')}</p>
                    <p className="text-sm font-bold text-white tracking-tight relative z-10">{displayStudent.purpose}</p>
                </div>

                {/* Progress Section */}
                <div className="relative overflow-hidden rounded-2xl sm:rounded-[32px] p-8 mb-8 border border-[#d4af37]/30 surface-strong shadow-2xl shadow-black/50">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">{t('assessmentProgress')}</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#d4af37] tracking-widest">75%</span>
                    </div>
                    <div className="h-2 w-full surface-weak rounded-full overflow-hidden p-[1px] border border-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '75%' }}
                            className="h-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] rounded-full shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                        />
                    </div>
                </div>

                {/* Main Action Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {mainCards.map((card, idx) => (
                        <motion.button
                            key={idx}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleNavigate(card.path)}
                            className={cn(
                                "relative group overflow-hidden rounded-2xl sm:rounded-[32px] p-6 text-left transition-all duration-500",
                                "border border-[#d4af37]/30 surface-strong  hover:border-[#d4af37]/60 shadow-2xl shadow-black/50",
                                card.isFull ? "col-span-2 py-8" : "col-span-1"
                            )}
                        >
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 rounded-2xl bg-[#d4af37]/10 text-[#d4af37] flex-shrink-0 border border-[#d4af37]/20">
                                        <card.icon size={24} />
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 ml-2 flex-shrink-0">
                                        <span className="text-[11px] font-bold text-[#d4af37] uppercase tracking-widest whitespace-nowrap">{card.status}</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold tracking-tight text-white uppercase">{card.title}</h3>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Bottom Action */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartAssessment}
                    className="w-full py-6 rounded-2xl sm:rounded-[32px] bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-lg shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group"
                >
                    {t('startNewAssessment')}
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
            </div>
        </div>
    );
};
export default HomePage;