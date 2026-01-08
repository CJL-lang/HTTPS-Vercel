/**
 * 测评类型选择页面
 * 功能：选择"完整测评"或"单项测评"
 * 路由：/assessment-type
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Layers, Target, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';
import { cn } from '../../utils/cn';

const AssessmentTypeSelectionPage = ({ onBack, onStartAssessment }) => {
    const { t } = useLanguage();
    const [isNavigating, setIsNavigating] = useState(false);

    const handleStartAssessment = (type) => {
        if (isNavigating) return;
        setIsNavigating(true);

        const assessmentData = {
            type: type === 'complete' ? 'complete' : 'single',
            mode: type === 'complete' ? 'complete' : 'single',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5),
            notes: '',
            timestamp: new Date().toISOString()
        };

        if (onStartAssessment) {
            onStartAssessment(0, assessmentData);
        }
    };

    const assessmentOptions = [
        {
            id: 'complete',
            type: 'complete',
            title: t('completeAssessment') || '完整测评',
            description: t('completeAssessmentDesc') || '依次完成身体素质、心理、技能三项测评，全面评估学员状态',
            icon: Layers,
            color: 'from-[#d4af37] via-[#f9e29c] to-[#b8860b]',
            iconBg: 'bg-[#d4af37]/20',
            features: [t('comprehensiveDataCollection'), t('threeDimensionalAnalysis'), t('completeTrainingPlan'), t('aiIntelligentReportFeature')],
            highlight: true
        },
        {
            id: 'single',
            type: 'single',
            title: t('singleAssessment') || '单项测评',
            description: t('singleAssessmentDesc') || '针对性完成某一项测评，快速聚焦重点领域',
            icon: Target,
            color: 'from-[#d4af37] to-[#f9e29c]',
            iconBg: 'bg-[#d4af37]/20',
            features: [t('quickAssessment'), t('targeted'), t('flexibleEfficient')],
            highlight: false
        }
    ];

    return (
        <div className="min-h-screen text-white p-6 pb-32 relative bg-transparent">
            {/* 背景装饰 */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#d4af37]/8 rounded-full blur-[100px] opacity-60" />
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-[80px] opacity-60" />

            {/* Header */}
            <div className="relative z-10 mb-12 flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="btn-back"
                >
                    <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                </button>
                <h1 className="text-xl font-bold tracking-tighter text-white/90">
                    {t('startNewAssessment') || '开始新测评'}
                </h1>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* 说明文字 */}
            <div className="relative z-10 mb-8 text-center">
                <p className="text-guide-desc font-medium">
                    {t('selectAssessmentMode') || '请选择测评模式'}
                </p>
            </div>

            {/* 选项卡片 */}
            <div className="relative z-10 space-y-6">
                {assessmentOptions.map((option) => {
                    const Icon = option.icon;

                    return (
                        <motion.div
                            key={option.id}
                            onClick={() => handleStartAssessment(option.type)}
                            className={cn(
                                "relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all duration-300 border-2 backdrop-blur-lg",
                                option.highlight
                                    ? "bg-black/40 border-white/20 hover:border-white/30"
                                    : "bg-black/50 border-white/30 hover:border-white/40"
                            )}
                            whileHover={{ scale: 1.02, y: -4 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* 推荐标签 */}
                            {option.highlight && (
                                <div className="absolute top-4 right-4">
                                    <span className="text-[11px] bg-[#d4af37] text-black px-3 py-1 rounded-full font-black uppercase tracking-wider">
                                        {t('recommended') || '推荐'}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-start gap-5 mb-5">
                                {/* 图标 */}
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm",
                                    option.iconBg
                                )}>
                                    <Icon size={32} className="text-[#d4af37]" />
                                </div>

                                {/* 标题和描述 */}
                                <div className="flex-1">
                                    <h3 className="text-guide-title font-bold tracking-tight uppercase mb-2">
                                        {option.title}
                                    </h3>
                                    <p className="text-guide-desc font-medium leading-relaxed">
                                        {option.description}
                                    </p>
                                </div>
                            </div>

                            {/* 特性列表 */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {option.features.map((feature, idx) => (
                                    <span
                                        key={idx}
                                        className={cn(
                                            "text-xs px-3 py-1.5 rounded-lg font-bold backdrop-blur-sm",
                                            option.highlight
                                                ? "bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40"
                                                : "bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30"
                                        )}
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>

                            {/* 箭头 */}
                            <div className="flex justify-end">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-sm",
                                    option.highlight
                                        ? "bg-[#d4af37]/30 text-[#d4af37]"
                                        : "bg-[#d4af37]/20 text-[#d4af37]"
                                )}>
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default AssessmentTypeSelectionPage;
