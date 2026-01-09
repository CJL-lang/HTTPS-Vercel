/**
 * 技能诊断页面
 * 功能：教练进行技能诊断，填写技术诊断内容
 * 路由：/diagnosis
 */
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mic } from 'lucide-react';
import PageWrapper from '../../components/PageWrapper';
import SectionTitle from '../../components/SectionTitle';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useLanguage } from '../../utils/LanguageContext';

const DiagnosisPage = ({ data, setData, onBack, onNext }) => {
    const { t } = useLanguage();
    const { isListening, startListening, stopListening } = useVoiceInput();

    const updateDiagnosis = (key, val) => {
        setData({
            ...data,
            diagnosis: {
                ...data.diagnosis,
                [key]: val
            }
        });
    };

    const categories = [
        {
            title: t('catBasic'),
            items: [
                { key: 'stance', label: t('labelStance'), placeholder: t('placeholderStance') },
                { key: 'grip', label: t('labelGrip'), placeholder: t('placeholderGrip') },
                { key: 'coordination', label: t('labelCoordination'), placeholder: t('placeholderCoordination') },
            ]
        },
        {
            title: t('catSwing'),
            items: [
                { key: 'backswing', label: t('labelBackswing'), placeholder: t('placeholderBackswing') },
                { key: 'downswing', label: t('labelDownswing'), placeholder: t('placeholderDownswing') },
                { key: 'tempo', label: t('labelTempo'), placeholder: t('placeholderTempo') },
            ]
        },
        {
            title: t('catQuality'),
            items: [
                { key: 'stability', label: t('labelStability'), placeholder: t('placeholderStability') },
                { key: 'direction', label: t('labelDirection'), placeholder: t('placeholderDirection') },
                { key: 'power', label: t('labelPower'), placeholder: t('placeholderPower') },
            ]
        },
        {
            title: t('catSpecial'),
            items: [
                { key: 'shortGame', label: t('labelShortGame'), placeholder: t('placeholderShortGame') },
                { key: 'greenside', label: t('labelGreenside'), placeholder: t('placeholderGreenside') },
            ]
        },
        {
            title: t('catBody'),
            items: [
                { key: 'handCoordination', label: t('labelHandCoord'), placeholder: t('placeholderHandCoord') },
                { key: 'bodyUsage', label: t('labelBodyUsage'), placeholder: t('placeholderBodyUsage') },
            ]
        }
    ];

    return (
        <PageWrapper
            title={t('skillsDiagnosis')}
            onBack={onBack}
            footer={
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onNext}
                    className="w-full py-6 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-lg shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group"
                >
                    <span className="text-lg font-bold tracking-widest uppercase">{t('trainingPlan')}</span>
                    <ArrowRight size={22} strokeWidth={3} />
                </motion.button>
            }
        >
            <div className="space-y-16 pb-12">
                {categories.map((cat, catIdx) => (
                    <div key={catIdx} className="space-y-8">
                        <SectionTitle>{cat.title}</SectionTitle>
                        <div className="space-y-8">
                            {cat.items.map((item) => (
                                <div key={item.key} className="glass-card p-6 border-white/5 group transition-all duration-300 hover:border-[#d4af37]/20">
                                    <label className="label-gold flex items-center gap-3 mb-4 group-hover:text-white transition-colors">
                                        <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b]"></span>
                                        {item.label}
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/40 h-28 text-sm font-medium leading-relaxed resize-none scrollbar-hide pr-12"
                                            placeholder={item.placeholder}
                                            value={data.diagnosis[item.key] || ""}
                                            onChange={e => updateDiagnosis(item.key, e.target.value)}
                                        />
                                        <button
                                            onClick={() => {
                                                if (isListening) {
                                                    stopListening();
                                                } else {
                                                    startListening((text) => updateDiagnosis(item.key, text));
                                                }
                                            }}
                                            className="absolute right-2 top-2 p-2 hover:surface rounded-xl transition-colors group/mic"
                                        >
                                            <Mic size={16} className={isListening ? "text-[#d4af37] animate-pulse" : "text-white/60 group-hover/mic:text-[#d4af37] transition-colors"} />
                                        </button>
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <div className="text-[11px] font-bold text-white/70 uppercase tracking-widest">需要专家输入</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </PageWrapper>
    );
};

export default DiagnosisPage;

