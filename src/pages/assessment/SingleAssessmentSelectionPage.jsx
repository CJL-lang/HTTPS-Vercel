/**
 * 单项测评选择页面
 * 功能：选择身体素质/心理/技能其中一项进行测评
 * 路由：/single-assessment
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Activity, Brain, Trophy, Calendar, Clock, FileText, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';
import { cn } from '../../utils/cn';

const SingleAssessmentSelectionPage = ({ onBack, onStartAssessment, assessmentConfig }) => {
    const { t } = useLanguage();
    const [selectedType, setSelectedType] = useState(null);
    const [assessmentDate, setAssessmentDate] = useState('');
    const [assessmentTime, setAssessmentTime] = useState('');
    const [notes, setNotes] = useState('');
    const [isStarting, setIsStarting] = useState(false);

    // 自动识别当前日期和时间
    useEffect(() => {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().slice(0, 5);
        setAssessmentDate(dateStr);
        setAssessmentTime(timeStr);
    }, []);

    // 默认配置（使用统一的金色主题）
    const defaultAssessmentTypes = [
        {
            id: 'physical',
            label: t('physicalAssessment'),
            icon: Activity,
            color: 'from-[#d4af37] to-[#f9e29c]',
            borderColor: 'border-[#d4af37]/30',
            shadowColor: 'shadow-[#d4af37]/20',
            description: t('physicalQualityAssessmentDesc')
        },
        {
            id: 'mental',
            label: t('mentalAssessment'),
            icon: Brain,
            color: 'from-[#d4af37] to-[#f9e29c]',
            borderColor: 'border-[#d4af37]/30',
            shadowColor: 'shadow-[#d4af37]/20',
            description: t('mentalQualityAssessmentDesc')
        },
        {
            id: 'technique',
            label: t('skillsAssessment'),
            icon: Trophy,
            color: 'from-[#d4af37] to-[#f9e29c]',
            borderColor: 'border-[#d4af37]/30',
            shadowColor: 'shadow-[#d4af37]/20',
            description: t('skillsLevelAssessmentDesc')
        }
    ];

    // 如果传入了自定义配置，使用自定义配置；否则使用默认配置
    const assessmentTypes = assessmentConfig || defaultAssessmentTypes;

    const handleStart = () => {
        if (!selectedType || isStarting) {
            if (!selectedType) {
                alert(t('pleaseSelectAssessmentType'));
            }
            return;
        }

        setIsStarting(true);

        const assessmentData = {
            type: selectedType,
            mode: 'single',
            date: assessmentDate,
            time: assessmentTime,
            notes: notes,
            timestamp: new Date(`${assessmentDate}T${assessmentTime}`).toISOString()
        };

        const typeIndex = assessmentTypes.findIndex(t => t.id === selectedType);
        onStartAssessment(typeIndex, assessmentData);
    };

    return (
        <div className="min-h-screen text-white p-6 pb-32 relative bg-transparent">
            {/* 背景装饰 */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-[#d4af37]/8 rounded-full blur-[100px] opacity-60" />
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-[80px] opacity-60" />

            {/* Header */}
            <div className="relative z-10 mb-8 flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="btn-back"
                >
                    <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                </button>
                <h1 className="text-xl font-bold tracking-tighter text-white/90">
                    {t('singleAssessment') || '单项测评'}
                </h1>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* 选择测评类型 */}
            <div className="relative z-10 mb-8">
                <p className="text-xs text-white/80 font-black uppercase tracking-[0.2em] ml-4 mb-4">
                    {t('selectAssessmentType') || '选择测评类型'}
                </p>
                <div className="space-y-4">
                    {assessmentTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selectedType === type.id;

                        return (
                            <motion.div
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={cn(
                                    "relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-300 border-2 backdrop-blur-lg",
                                    isSelected
                                        ? `bg-gradient-to-br ${type.color} ${type.borderColor} shadow-lg ${type.shadowColor}`
                                        : "bg-black/50 border-white/30 hover:border-white/40"
                                )}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-sm",
                                        isSelected ? "bg-black/20" : "bg-white/10"
                                    )}>
                                        <Icon size={28} className={isSelected ? "text-white" : "text-[#d4af37]"} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={cn(
                                            "font-black text-lg tracking-tight uppercase mb-1",
                                            isSelected ? "text-white" : "text-white/90"
                                        )}>
                                            {type.label}
                                        </h3>
                                        <p className={cn(
                                            "text-xs font-medium",
                                            isSelected ? "text-white/80" : "text-white/50"
                                        )}>
                                            {type.description}
                                        </p>
                                    </div>
                                    <div className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        isSelected
                                            ? "border-white bg-white"
                                            : "border-white/30"
                                    )}>
                                        {isSelected && (
                                            <div className="w-3 h-3 rounded-full bg-black" />
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* 测评时间设置 */}
            <div className="relative z-10 mb-8">
                <p className="text-xs text-white/80 font-black uppercase tracking-[0.2em] ml-4 mb-4">
                    {t('assessmentDateTime') || '测评时间'}
                </p>
                <div className="space-y-4">
                    {/* 日期选择 */}
                    <div className="bg-black/50 border border-white/20 rounded-2xl p-5 backdrop-blur-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <Calendar size={20} className="text-[#d4af37]" />
                            <label className="text-sm font-bold text-white/90">
                                {t('date') || '日期'}
                            </label>
                        </div>
                        <input
                            type="date"
                            value={assessmentDate}
                            onChange={(e) => setAssessmentDate(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all"
                        />
                    </div>

                    {/* 时间选择 */}
                    <div className="bg-black/50 border border-white/20 rounded-2xl p-5 backdrop-blur-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <Clock size={20} className="text-[#d4af37]" />
                            <label className="text-sm font-bold text-white/90">
                                {t('time') || '时间'}
                            </label>
                        </div>
                        <input
                            type="time"
                            value={assessmentTime}
                            onChange={(e) => setAssessmentTime(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* 备注 */}
            <div className="relative z-10 mb-8">
                <p className="text-xs text-white/80 font-black uppercase tracking-[0.2em] ml-4 mb-4">
                    {t('notes') || '备注'}
                </p>
                <div className="bg-black/50 border border-white/20 rounded-2xl p-5 backdrop-blur-lg">
                    <div className="flex items-center gap-3 mb-3">
                        <FileText size={20} className="text-[#d4af37]" />
                        <label className="text-sm font-bold text-white/90">
                            {t('assessmentNotes') || '测评备注（可选）'}
                        </label>
                    </div>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t('notesPlaceholder') || '记录测评相关信息...'}
                        rows={4}
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all resize-none placeholder:text-white/30"
                    />
                </div>
            </div>

            {/* 底部开始按钮 */}
            <div className="fixed bottom-8 left-0 right-0 px-6 z-20">
                <motion.button
                    onClick={handleStart}
                    disabled={!selectedType}
                    className={cn(
                        "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3",
                        selectedType
                            ? "bg-gradient-to-r from-[#d4af37] via-[#f9e29c] to-[#b8860b] text-black shadow-[#d4af37]/30 active:scale-[0.98]"
                            : "bg-white/10 text-white/30 cursor-not-allowed"
                    )}
                    whileHover={selectedType ? { scale: 1.02 } : {}}
                    whileTap={selectedType ? { scale: 0.98 } : {}}
                >
                    <span>{t('startAssessment') || '开始测评'}</span>
                    <ChevronRight size={20} />
                </motion.button>
            </div>
        </div>
    );
};

export default SingleAssessmentSelectionPage;
