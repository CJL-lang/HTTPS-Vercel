/**
 * 完整测评设置页面
 * 功能：设置完整测评的时间和备注，将依次完成三项测评
 * 路由：/new-assessment
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Layers, Calendar, Clock, FileText, ChevronRight, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../utils/LanguageContext';
import { cn } from '../../utils/cn';

const NewAssessmentPage = ({ onBack, onStartAssessment }) => {
    const { t } = useLanguage();
    const [assessmentDate, setAssessmentDate] = useState('');
    const [assessmentTime, setAssessmentTime] = useState('');
    const [notes, setNotes] = useState('');
    const [isStarting, setIsStarting] = useState(false);

    // 自动识别当前日期和时间
    useEffect(() => {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().slice(0, 5); // HH:MM
        setAssessmentDate(dateStr);
        setAssessmentTime(timeStr);
    }, []);

    const handleStart = () => {
        if (isStarting) return;
        setIsStarting(true);

        const assessmentData = {
            type: 'complete',
            mode: 'complete',
            date: assessmentDate,
            time: assessmentTime,
            notes: notes,
            timestamp: new Date(`${assessmentDate}T${assessmentTime}`).toISOString()
        };

        // 完整测评从第一项开始（身体素质）
        onStartAssessment(0, assessmentData);
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
                <h1 className="text-xl font-black tracking-tighter text-white/90">
                    {t('completeAssessment') || '完整测评'}
                </h1>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* 完整测评说明 */}
            <div className="relative z-10 mb-8">
                <div className="bg-black/40 border border-white/20 rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#d4af37]/30 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                            <Layers size={24} className="text-[#d4af37]" />
                        </div>
                        <div>
                            <h3 className="text-guide-title font-black mb-2">
                                {t('completeAssessmentGuide') || '完整测评流程'}
                            </h3>
                            <p className="text-guide-desc leading-relaxed">
                                {t('completeAssessmentGuideDesc') || '将依次完成身体素质、心理、技能三项测评，全面评估学员状态'}
                            </p>
                        </div>
                    </div>

                    {/* 流程步骤 */}
                    <div className="space-y-3">
                        {[
                            { step: 1, title: t('physicalAssessment'), color: 'text-[#d4af37]' },
                            { step: 2, title: t('mentalAssessment'), color: 'text-[#d4af37]' },
                            { step: 3, title: t('skillsAssessment'), color: 'text-[#d4af37]' }
                        ].map((item) => (
                            <div key={item.step} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-black/60 border border-white/20 flex items-center justify-center text-sm font-black text-white/80 backdrop-blur-sm">
                                    {item.step}
                                </div>
                                <span className="text-step-label font-bold">
                                </span>
                                <CheckCircle size={16} className="text-white/30 ml-auto" />
                            </div>
                        ))}
                    </div>

                    {/* AI报告提示 */}
                    <div className="mt-5 pt-5 border-t border-white/20">
                        <div className="flex items-center gap-2">
                            <span className="text-step-label font-bold">
                                {t('完成后可生成AI智能报告') || '完成后可生成AI智能报告'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 测评时间设置 */}
            <div className="relative z-10 mb-8">
                <p className="text-section-title ml-4 mb-4">
                    {t('assessmentDateTime') || '测评时间'}
                </p>
                <div className="space-y-4">
                    {/* 日期选择 */}
                    <div className="bg-black/50 border border-white/20 rounded-2xl p-5 backdrop-blur-lg">
                        <div className="flex items-center gap-3 mb-3">
                            <Calendar size={20} className="text-[#d4af37]" />
                            <label className="text-field-label font-bold">
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
                            <label className="text-field-label font-bold">
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
                <p className="text-section-title ml-4 mb-4">
                    {t('notes') || '备注'}
                </p>
                <div className="bg-black/50 border border-white/20 rounded-2xl p-5 backdrop-blur-lg">
                    <div className="flex items-center gap-3 mb-3">
                        <FileText size={20} className="text-[#d4af37]" />
                        <label className="text-field-label font-bold">
                            {t('assessmentNotes') || '测评备注（可选）'}
                        </label>
                    </div>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t('notesPlaceholder') || '记录测评相关信息，如测评目的、学员状态等...'}
                        rows={4}
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 transition-all resize-none placeholder:text-white/30"
                    />
                </div>
            </div>

            {/* 底部开始按钮 */}
            <div className="fixed bottom-8 left-0 right-0 px-6 z-20">
                <motion.button
                    onClick={handleStart}
                    className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-[#d4af37] via-[#f9e29c] to-[#b8860b] text-black shadow-[#d4af37]/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Layers size={20} />
                    <span>{t('completeAssessmentBtn')}</span>
                    <ChevronRight size={20} />
                </motion.button>
            </div>
        </div>
    );
};

export default NewAssessmentPage;
