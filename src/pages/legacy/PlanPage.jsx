/**
 * 训练方案页面
 * 功能：制定训练方案，填写训练要点和额外说明
 * 路由：/plan
 */
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clipboard, Mic } from 'lucide-react';
import PageWrapper from '../../components/PageWrapper';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useLanguage } from '../../utils/LanguageContext';

const PlanPage = ({ data, setData, onBack, onNext }) => {
    const { t } = useLanguage();
    const { isListening, startListening, stopListening } = useVoiceInput();

    return (
        <PageWrapper
            title={t('trainingPlan')}
            onBack={onBack}
            footer={
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onNext}
                    className="w-full py-6 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-lg shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group"
                >
                    <span className="text-lg font-bold tracking-widest uppercase">{t('goalSetting')}</span>
                    <ArrowRight size={22} strokeWidth={3} />
                </motion.button>
            }
        >
            <motion.div
                className="mb-10 p-6 glass-card border-[#d4af37]/20 bg-[#d4af37]/5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="flex items-start gap-4">
                    <Clipboard size={24} className="text-[#d4af37] flex-shrink-0" />
                    <div>
                        <h4 className="text-lg font-bold text-white uppercase tracking-widest mb-1">{t('planGuideTitle')}</h4>
                        <p className="text-[12px] text-white font-bold leading-relaxed uppercase tracking-wider">{t('planGuideDesc')}</p>
                    </div>
                </div>
            </motion.div>

            <div className="space-y-8">
                <div className="glass-card p-6 border-white/5">
                    <label className="label-gold">{t('labelPoint1')}</label>
                    <div className="relative">
                        <textarea
                            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/40 placeholder:font-normal h-28 text-sm font-normal leading-relaxed resize-none scrollbar-hide pr-12"
                            placeholder={t('placeholderPoint1')}
                            value={data.plan.point1}
                            onChange={e => setData({ ...data, plan: { ...data.plan, point1: e.target.value } })}
                        />
                        <button className="absolute right-2 top-2 p-2 hover:surface rounded-xl transition-colors group">
                            <Mic size={16} className="text-white/60 group-hover:text-[#d4af37] transition-colors" />
                        </button>
                    </div>
                </div>
                <div className="glass-card p-6 border-white/5">
                    <label className="label-gold">{t('labelPoint2')}</label>
                    <div className="relative">
                        <textarea
                            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/40 placeholder:font-normal h-28 text-sm font-normal leading-relaxed resize-none scrollbar-hide pr-12"
                            placeholder={t('placeholderPoint2')}
                            value={data.plan.point2}
                            onChange={e => setData({ ...data, plan: { ...data.plan, point2: e.target.value } })}
                        />
                        <button
                            onClick={() => {
                                if (isListening) {
                                    stopListening();
                                } else {
                                    startListening((text) => setData({ ...data, plan: { ...data.plan, point2: text } }));
                                }
                            }}
                            className="absolute right-2 top-2 p-2 hover:surface rounded-xl transition-colors group"
                        >
                            <Mic size={16} className={isListening ? "text-[#d4af37] animate-pulse" : "text-white/60 group-hover:text-[#d4af37] transition-colors"} />
                        </button>
                    </div>
                </div>
                <div className="glass-card p-6 border-white/5">
                    <label className="label-gold">{t('labelExtra')}</label>
                    <div className="relative">
                        <textarea
                            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/40 placeholder:font-normal h-28 text-sm font-normal leading-relaxed resize-none scrollbar-hide pr-12"
                            placeholder={t('placeholderExtra')}
                            value={data.plan.extra}
                            onChange={e => setData({ ...data, plan: { ...data.plan, extra: e.target.value } })}
                        />
                        <button
                            onClick={() => {
                                if (isListening) {
                                    stopListening();
                                } else {
                                    startListening((text) => setData({ ...data, plan: { ...data.plan, extra: text } }));
                                }
                            }}
                            className="absolute right-2 top-2 p-2 hover:surface rounded-xl transition-colors group"
                        >
                            <Mic size={16} className={isListening ? "text-[#d4af37] animate-pulse" : "text-white/60 group-hover:text-[#d4af37] transition-colors"} />
                        </button>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default PlanPage;

