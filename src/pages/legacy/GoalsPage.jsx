/**
 * 目标设定页面
 * 功能：设定训练目标，填写阶段目标内容
 * 路由：/goals
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Clipboard, Target, Mic } from 'lucide-react';
import PageWrapper from '../../components/PageWrapper';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useLanguage } from '../../utils/LanguageContext';

const GoalsPage = ({ data, setData, onBack, onNext }) => {
    const { t } = useLanguage();
    const { isListening, startListening, stopListening } = useVoiceInput();

    return (
        <PageWrapper
            title={t('goalSetting')}
            onBack={onBack}
            footer={
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onNext}
                    className="w-full py-6 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-lg shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group"
                >
                    <span className="text-lg font-bold tracking-widest uppercase">{t('reportTitle')}</span>
                    <Clipboard size={22} strokeWidth={3} />
                </motion.button>
            }
        >
            <motion.div
                className="flex flex-col items-center justify-center py-16 glass-card border-[#d4af37]/10 surface mb-10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="relative mb-8">
                    <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-[#d4af37]/30 to-transparent border-2 border-[#d4af37]/50 flex items-center justify-center shadow-2xl shadow-yellow-500/20 rotate-12">
                        <Target size={48} className="text-white -rotate-12" />
                    </div>
                    <motion.div
                        className="absolute inset-0 rounded-[32px] border-2 border-[#d4af37]/30 rotate-12"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
                <h3 className="text-2xl font-bold mb-3 uppercase tracking-tighter text-white text-center px-8">
                    {t('goalStrategic')}
                </h3>
                <p className="text-[12px] font-medium text-white/70 uppercase tracking-[0.3em] text-center px-12 leading-relaxed">{t('goalSubtitle')}</p>
            </motion.div>

            <div className="glass-card p-8 border-white/5">
                <label className="label-gold text-white mb-6">{t('labelStage1')}</label>
                <div className="relative">
                    <textarea
                        className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/40 placeholder:font-normal h-48 text-sm font-normal leading-relaxed resize-none scrollbar-hide tracking-tight pr-12"
                        placeholder={t('placeholderStage1')}
                        value={data.goal}
                        onChange={e => setData({ ...data, goal: e.target.value })}
                    />
                    <button
                        onClick={() => {
                            if (isListening) {
                                stopListening();
                            } else {
                                startListening((text) => setData({ ...data, goal: text }));
                            }
                        }}
                        className="absolute right-2 top-2 p-2 hover:surface rounded-xl transition-colors group"
                    >
                        <Mic size={18} className={isListening ? "text-[#d4af37] animate-pulse" : "text-white/60 group-hover:text-[#d4af37] transition-colors"} />
                    </button>
                </div>
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5">
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#d4af37]"></div>
                        <div className="w-2 h-2 rounded-full bg-white/20"></div>
                        <div className="w-2 h-2 rounded-full bg-white/20"></div>
                    </div>
                    <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest">{t('expertInput')}</span>
                </div>
            </div>
        </PageWrapper>
    );
};

export default GoalsPage;

