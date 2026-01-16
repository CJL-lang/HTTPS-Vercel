/**
 * AI智能报告页面
 * 功能：展示根据测评数据生成的AI分析报告
 * 路由：/ai-report
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Activity,
    AlertCircle,
    Brain,
    CheckCircle,
    ChevronLeft,
    Download,
    Share2,
    Sparkles,
    Target,
    TrendingUp,
    Trophy
} from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';
import { cn } from '../../utils/cn';

const fallbackReport = {
    assessmentDate: '2024-12-20',
    assessmentTime: '14:30',
    overallScore: 88,
    summary: {
        title: 'AI综合分析',
        content: '根据最新测评数据，AI 为你梳理了体能、心理与技术表现的关键要点，并生成可执行的训练建议。'
    },
    dimensions: [
        {
            key: 'physical',
            title: '体能',
            score: 86,
            strengths: ['力量均衡', '稳定性良好'],
            weaknesses: ['爆发力偏弱'],
            suggestions: ['增加每周 2 次力量+速度训练', '加入间歇跑提升爆发能力'],
            color: 'from-[#d4af37] to-[#b8860b]'
        },
        {
            key: 'mental',
            title: '心理',
            score: 80,
            strengths: ['专注度高'],
            weaknesses: ['压力下情绪波动'],
            suggestions: ['赛前 3 分钟呼吸练习', '以节奏目标代替成绩目标'],
            color: 'from-[#22c55e] to-[#16a34a]'
        },
        {
            key: 'skills',
            title: '技术',
            score: 82,
            strengths: ['挥杆节奏稳定'],
            weaknesses: ['切杆落点控制'],
            suggestions: ['短杆距离控制练习', '每周 2 次推杆节奏训练'],
            color: 'from-[#60a5fa] to-[#2563eb]'
        }
    ],
    priorities: [
        {
            title: '提升爆发力与速度',
            level: 'high',
            description: '加入力量+速度训练组合，每周 2 次，关注髋部快速发力。'
        },
        {
            title: '情绪管理与赛后复盘',
            level: 'medium',
            description: '比赛后进行情绪复盘，形成可复制的赛前流程与放松节奏。'
        }
    ],
    goals: {
        shortTerm: '4 周内挥杆初速度提升 3%，心率恢复 2 分钟内降至 120 以下。',
        midTerm: '8 周内稳定切推成功率至 70%，建立固定热身与呼吸流程。',
        longTerm: '全年保持低差点表现，在高压下维持稳定的技术动作库。'
    }
};

const getStoredReport = () => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem('aiReportData');
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        return null;
    }
};

const LoadingScreen = ({ onBack, t }) => (
    <div className="min-h-screen text-white p-6 flex items-center justify-center bg-transparent relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-48 h-48 sm:w-64 sm:h-64 bg-[#d4af37]/8 rounded-full blur-[100px] opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 sm:w-64 sm:h-64 bg-white/5 rounded-full blur-[80px] opacity-60" />

        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
            <button onClick={onBack} className="btn-back">
                <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
            </button>
        </div>

        <motion.div
            className="text-center relative z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6"
                initial={{ scale: 0.85, rotate: -4 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                <motion.img
                    src="/logo.png"
                    alt="Logo"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ filter: 'grayscale(100%) brightness(0.35)', opacity: 0.7 }}
                />
                <motion.img
                    src="/logo.png"
                    alt="Logo"
                    className="absolute inset-0 w-full h-full object-contain"
                    initial={{ clipPath: 'inset(100% 0 0 0)' }}
                    animate={{ clipPath: 'inset(0% 0 0 0)' }}
                    transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
                />
            </motion.div>
            <motion.h2
                className="text-2xl sm:text-3xl font-black text-white mb-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.6 }}
            >
                {t('generatingAIReport') || '正在生成AI报告'}
            </motion.h2>
            <motion.p
                className="text-white/70 text-sm sm:text-base"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
            >
                {t('analyzingData') || '正在分析测评数据...'}
            </motion.p>
        </motion.div>
    </div>
);

const AIReportPage = ({ onBack }) => {
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const [isGenerating, setIsGenerating] = useState(true);

    useEffect(() => {
        // 强制等待至少 10 秒，满足"如果没到10秒...也要等到第10秒"
        const timer = setTimeout(() => setIsGenerating(false), 10000);
        return () => clearTimeout(timer);
    }, []);

    const reportFromState = location.state?.report || location.state?.reportData || location.state || null;
    const reportData = reportFromState || getStoredReport() || fallbackReport;

    const singleType = location.state?.singleType || reportData.singleType || null;
    const isSingleMode = Boolean(singleType);
    const completedAssessments = reportData.completedAssessments || [];
    const displayScore = reportData.overallScore ?? fallbackReport.overallScore;
    const dimensions = Array.isArray(reportData.dimensions) && reportData.dimensions.length > 0
        ? reportData.dimensions
        : fallbackReport.dimensions;

    const titleText = (() => {
        if (isSingleMode) {
            if (singleType === 'physical') return t('physicalReportTitle') || '体能报告';
            if (singleType === 'mental') return t('mentalReportTitle') || '心理报告';
            if (singleType === 'technique' || singleType === 'skills') return t('skillsReportTitle') || '技术报告';
        }
        return (completedAssessments.length === 3 ? t('comprehensiveReportTitle') : t('aiAnalysisReport')) || 'AI分析报告';
    })();

    if (isGenerating) {
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

    return (
        <div className="min-h-screen text-white p-4 sm:p-6 pb-24 sm:pb-32 relative bg-transparent">
            <div className="absolute top-[-10%] right-[-10%] w-48 h-48 sm:w-64 sm:h-64 bg-[#d4af37]/8 rounded-full blur-[100px] opacity-60" />
            <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 sm:w-64 sm:h-64 bg-white/5 rounded-full blur-[80px] opacity-60" />

            <div className="relative z-10 mb-6 sm:mb-8">
                <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
                    <button onClick={onBack} className="btn-back shrink-0">
                        <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                    </button>

                    <div className="flex gap-2 shrink-0">
                        <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all backdrop-blur-lg">
                            <Share2 size={16} className="sm:w-[18px] sm:h-[18px] text-white/70" />
                        </button>
                        <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center hover:bg-black/80 transition-all backdrop-blur-lg">
                            <Download size={16} className="sm:w-[18px] sm:h-[18px] text-white/70" />
                        </button>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/40 border border-[#d4af37] rounded-2xl sm:rounded-3xl p-4 sm:p-6 backdrop-blur-xl"
                >
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#d4af37]/30 flex items-center justify-center backdrop-blur-sm shrink-0">
                            <Sparkles size={20} className="sm:w-6 sm:h-6 text-[#d4af37]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-sm sm:text-base font-black text-white truncate">{titleText}</h1>
                            <p className="text-[11px] sm:text-xs text-white/70 truncate">
                                {reportData.assessmentDate || fallbackReport.assessmentDate} · {reportData.assessmentTime || fallbackReport.assessmentTime}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-4xl sm:text-5xl font-black text-[#d4af37]">{displayScore}</div>
                        <div className="text-[11px] sm:text-xs text-white/90">/100</div>
                    </div>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative z-10 mb-4 sm:mb-6"
            >
                <div className="bg-black/50 border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-lg">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <Brain size={18} className="sm:w-5 sm:h-5 text-[#d4af37] shrink-0" />
                        <h3 className="text-base sm:text-lg font-black text-white truncate flex-1">
                            {reportData.summary?.title || fallbackReport.summary.title}
                        </h3>
                    </div>
                    <p className="text-white/90 text-xs sm:text-sm leading-relaxed break-words">
                        {reportData.summary?.content || fallbackReport.summary.content}
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative z-10 mb-6"
            >
                <h3 className="text-sm sm:text-base font-black uppercase tracking-[0.2em] ml-2 sm:ml-4 mb-3 sm:mb-4 text-white">
                    {t('threeDimensionalAssessment') || '三维评估'}
                </h3>
                <div className="space-y-3 sm:space-y-4">
                    {dimensions.map((dimension, index) => {
                        const Icon = dimension.icon || (dimension.key === 'physical' ? Activity : dimension.key === 'mental' ? Brain : Trophy);
                        return (
                            <div
                                key={dimension.key || index}
                                className="bg-black/50 border border-white/15 rounded-xl sm:rounded-2xl p-4 sm:p-5 backdrop-blur-lg"
                            >
                                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                        <Icon size={18} className="sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-white font-bold text-sm sm:text-base truncate">{dimension.title}</h4>
                                            <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/80">{dimension.score}</span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-white/80 break-words">
                                            {dimension.description || ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${dimension.score}%` }}
                                            transition={{ duration: 0.9, delay: 0.15 + index * 0.08 }}
                                            className={cn('h-full rounded-full bg-gradient-to-r', dimension.color)}
                                        />
                                    </div>
                                </div>

                                <div className="mb-2 sm:mb-3">
                                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                        <CheckCircle size={14} className="sm:w-4 sm:h-4 text-[#d4af37] shrink-0" />
                                        <span className="text-xs sm:text-sm font-bold text-white/90">{t('strengths') || '优势'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {(dimension.strengths || []).map((strength, idx) => (
                                            <span
                                                key={idx}
                                                className="text-[11px] sm:text-xs md:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40 backdrop-blur-sm break-words"
                                            >
                                                {strength}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-2 sm:mb-3">
                                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                        <AlertCircle size={14} className="sm:w-4 sm:h-4 text-white/80 shrink-0" />
                                        <span className="text-xs sm:text-sm font-bold text-white/90">{t('weaknesses') || '待提升'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {(dimension.weaknesses || []).map((weakness, idx) => (
                                            <span
                                                key={idx}
                                                className="text-[11px] sm:text-xs md:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-black/60 text-white/90 border border-white/30 backdrop-blur-sm break-words"
                                            >
                                                {weakness}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                                        <Target size={14} className="sm:w-4 sm:h-4 text-[#d4af37] shrink-0" />
                                        <span className="text-xs sm:text-sm font-bold text-white/90">{t('suggestions') || '改进建议'}</span>
                                    </div>
                                    <ul className="space-y-1">
                                        {(dimension.suggestions || []).map((suggestion, idx) => (
                                            <li
                                                key={idx}
                                                className="text-xs sm:text-sm text-white/90 pl-3 sm:pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[#d4af37] break-words"
                                            >
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="relative z-10 mb-4 sm:mb-6"
            >
                <h3 className="text-sm sm:text-base font-black uppercase tracking-[0.2em] ml-2 sm:ml-4 mb-3 sm:mb-4 text-white">
                    {(() => {
                        if (isSingleMode) {
                            if (singleType === 'physical') return t('physicalTrainingPriorities') || '体能训练重点';
                            if (singleType === 'mental') return t('mentalTrainingPriorities') || '心理训练重点';
                            if (singleType === 'technique' || singleType === 'skills') return t('skillsTrainingPriorities') || '技术训练重点';
                        }
                        return t('trainingPriorities') || '训练重点';
                    })()}
                </h3>
                {isSingleMode && (
                    <div className="px-2 sm:px-4 mb-3 sm:mb-4 flex items-center gap-2">
                        <span className="text-[11px] sm:text-[12px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-black uppercase backdrop-blur-sm bg-[#d4af37]/20 text-[#d4af37] truncate">
                            {singleType === 'physical'
                                ? t('physicalAssessment') || '体能测评'
                                : singleType === 'mental'
                                    ? t('mentalAssessment') || '心理测评'
                                    : t('skillsAssessment') || '技术测评'}
                        </span>
                    </div>
                )}
                <div className="space-y-2 sm:space-y-3">
                    {(reportData.priorities || fallbackReport.priorities).map((priority, index) => (
                        <div
                            key={`${priority.title}-${index}`}
                            className={cn(
                                'bg-black/50 border rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-lg',
                                priority.level === 'high' ? 'border-[#d4af37]/40' : 'border-white/30'
                            )}
                        >
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                                <h4 className="text-white font-bold text-xs sm:text-sm flex-1 min-w-0 truncate">{priority.title}</h4>
                                <span
                                    className={cn(
                                        'text-[11px] sm:text-[12px] px-1.5 sm:px-2 py-0.5 rounded-full font-black uppercase backdrop-blur-sm shrink-0',
                                        priority.level === 'high'
                                            ? 'bg-[#d4af37]/30 text-[#d4af37]'
                                            : 'bg-black/60 text-white/70'
                                    )}
                                >
                                    {priority.level === 'high' ? t('high') || '高' : t('medium') || '中'}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-white/90 break-words">{priority.description}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative z-10 mb-4 sm:mb-6"
            >
                <h3 className="text-sm sm:text-base font-black uppercase tracking-[0.2em] ml-2 sm:ml-4 mb-3 sm:mb-4 text-white">
                    {(() => {
                        if (isSingleMode) {
                            if (singleType === 'physical') return t('physicalExpectedGoals') || '体能预期目标';
                            if (singleType === 'mental') return t('mentalExpectedGoals') || '心理预期目标';
                            if (singleType === 'technique' || singleType === 'skills') return t('skillsExpectedGoals') || '技术预期目标';
                        }
                        return t('expectedGoals') || '预期目标';
                    })()}
                </h3>
                {isSingleMode && (
                    <div className="px-2 sm:px-4 mb-3 sm:mb-4 flex items-center gap-2">
                        <span className="text-[11px] sm:text-[12px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-black uppercase backdrop-blur-sm bg-[#d4af37]/20 text-[#d4af37] truncate">
                            {singleType === 'physical'
                                ? t('physicalAssessment') || '体能测评'
                                : singleType === 'mental'
                                    ? t('mentalAssessment') || '心理测评'
                                    : t('skillsAssessment') || '技术测评'}
                        </span>
                    </div>
                )}
                <div className="space-y-2 sm:space-y-3">
                    <div className="bg-black/50 border border-[#d4af37]/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-lg">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <TrendingUp size={14} className="sm:w-4 sm:h-4 text-[#d4af37] shrink-0" />
                            <span className="text-xs sm:text-sm font-bold text-[#d4af37]">{t('shortTerm') || '短期'}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-white/90 break-words">{(reportData.goals || fallbackReport.goals).shortTerm}</p>
                    </div>
                    <div className="bg-black/50 border border-[#d4af37]/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-lg">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <TrendingUp size={14} className="sm:w-4 sm:h-4 text-[#d4af37] shrink-0" />
                            <span className="text-xs sm:text-sm font-bold text-[#d4af37]">{t('midTerm') || '中期'}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-white/90 break-words">{(reportData.goals || fallbackReport.goals).midTerm}</p>
                    </div>
                    <div className="bg-black/50 border border-[#d4af37]/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-lg">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <TrendingUp size={14} className="sm:w-4 sm:h-4 text-[#d4af37] shrink-0" />
                            <span className="text-xs sm:text-sm font-bold text-[#d4af37]">{t('longTerm') || '长期'}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-white/90 break-words">{(reportData.goals || fallbackReport.goals).longTerm}</p>
                    </div>
                </div>
            </motion.div>

            <div className="fixed bottom-6 sm:bottom-8 left-0 right-0 px-4 sm:px-6 z-20">
                <div className="max-w-md mx-auto flex gap-4">
                    {isSingleMode ? (
                        <>
                            <button
                                onClick={() => {
                                    const reportPages = {
                                        physical: '/physical-report',
                                        mental: '/mental-report',
                                        technique: '/skills-report',
                                        skills: '/skills-report'
                                    };
                                    const targetPage = singleType ? reportPages[singleType] || '/physical-report' : '/physical-report';
                                    navigate(targetPage);
                                }}
                                className="flex-1 h-[50px] sm:h-[54px] rounded-full font-bold text-sm sm:text-base uppercase tracking-widest bg-white/10 border border-white/20 text-white shadow-xl flex items-center justify-center transition-all active:scale-[0.98] px-4"
                            >
                                <span className="truncate">{t('backToHistory') || '返回历史'}</span>
                            </button>
                            <button
                                onClick={() => {
                                    const reportPages = {
                                        physical: '/physical-report',
                                        mental: '/mental-report',
                                        technique: '/skills-report',
                                        skills: '/skills-report'
                                    };
                                    const basePath = singleType ? reportPages[singleType] || '/physical-report' : '/physical-report';
                                    const recordId = reportData?.recordId;
                                    if (recordId) {
                                        navigate(`${basePath}/${recordId}`);
                                    } else {
                                        navigate(basePath);
                                    }
                                }}
                                className="flex-1 h-[50px] sm:h-[54px] rounded-full font-bold text-sm sm:text-base uppercase tracking-widest bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center transition-all active:scale-[0.98] px-4"
                            >
                                <span className="truncate">{t('viewDetail') || '查看详情'}</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => navigate('/students')}
                            className="w-full h-[50px] sm:h-[54px] rounded-full font-bold text-base sm:text-lg uppercase tracking-widest bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center transition-all active:scale-[0.98] px-4"
                        >
                            <span className="truncate">{t('backToHome') || '返回首页'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIReportPage;
