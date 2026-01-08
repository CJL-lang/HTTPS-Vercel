/**
 * 技术报告页面
 * 功能：显示完整的测评报告，包括学员基础信息、Styku数据、TrackMan数据、诊断与方案摘要
 * 路由：/report
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Activity, Target, Clipboard, User, Info } from 'lucide-react';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/Card';
import SectionTitle from '../../components/SectionTitle';
import { useLanguage } from '../../utils/LanguageContext';

const ReportPage = ({ data, onReset, onBack }) => {
    const { t } = useLanguage();

    return (
        <PageWrapper title={t('reportTitle')} onBack={onBack}>
            <div className="space-y-12 pb-20">
                {/* 1. 学员基础信息 */}
                <div className="glass-card p-8 border-l-4 border-l-[#d4af37] bg-[#d4af37]/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4af37]/5 rounded-full blur-3xl group-hover:bg-[#d4af37]/10 transition-all duration-700"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-3xl font-bold text-white mb-2 tracking-tighter uppercase">{data.name}</h3>
                                <p className="text-[13px] font-bold text-white uppercase tracking-[0.2em]">{data.gender} · {data.age}{t('years')}</p>
                            </div>
                            <div className="bg-gradient-to-br from-[#d4af37] to-[#b8860b] text-black text-[11px] font-bold px-4 py-2 rounded-full shadow-2xl shadow-yellow-500/30 uppercase tracking-widest">
                                {t('officialAssessment')}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6 py-6 border-y border-white/5 mt-6">
                            <div className="text-center group/item">
                                <p className="text-[11px] text-white uppercase font-bold tracking-widest mb-2 group-hover/item:text-[#d4af37] transition-colors">{t('height')}</p>
                                <p className="font-bold text-white text-lg">{data.stykuData?.height || data.physical.height || "--"} <span className="text-[11px] text-white/70">{t('heightUnit')}</span></p>
                            </div>
                            <div className="text-center group/item">
                                <p className="text-[11px] text-white uppercase font-bold tracking-widest mb-2 group-hover/item:text-[#d4af37] transition-colors">{t('weight')}</p>
                                <p className="font-bold text-white text-lg">{data.stykuData?.weight || data.physical.weight || "--"} <span className="text-[11px] text-white/70">{t('weightUnit')}</span></p>
                            </div>
                            <div className="text-center group/item">
                                <p className="text-[11px] text-white uppercase font-bold tracking-widest mb-2 group-hover/item:text-[#d4af37] transition-colors">{t('bmiLabel')}</p>
                                <p className="font-bold text-[#d4af37] text-lg">{data.stykuData?.bmi || "--"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Styku 3D 扫描数据摘要 */}
                {data.stykuData?.torso && (
                    <div className="space-y-8">
                        <SectionTitle>{t('bodyDimensions')}</SectionTitle>
                        <div className="glass-card p-8 border-white/5 grid grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <p className="text-lg text-[#d4af37] font-bold uppercase tracking-[0.3em] mb-4">{t('torsoData')}</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                        <span className="text-[12px] text-white font-bold uppercase">{t('chestLabel')}</span>
                                        <span className="text-sm font-bold text-white">{data.stykuData.torso.chest} {t('heightUnit')}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                        <span className="text-[12px] text-white font-bold uppercase">{t('waistLabel')}</span>
                                        <span className="text-sm font-bold text-white">{data.stykuData.torso.waist} {t('heightUnit')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] text-white font-bold uppercase">{t('hipLabel')}</span>
                                        <span className="text-sm font-bold text-white">{data.stykuData.torso.hip} {t('heightUnit')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-lg text-[#d4af37] font-bold uppercase tracking-[0.3em] mb-4">{t('limbData')}</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                        <span className="text-[12px] text-white font-bold uppercase">{t('thighLabel')}</span>
                                        <span className="text-sm font-bold text-white">{data.stykuData.lowerLimbs?.thigh} {t('heightUnit')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[12px] text-white font-bold uppercase">{t('upperArmLabel')}</span>
                                        <span className="text-sm font-bold text-white">{data.stykuData.upperLimbs?.upperArm} {t('heightUnit')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. TrackMan 挥杆数据摘要 */}
                {data.trackmanData?.layerA && (
                    <div className="space-y-8">
                        <SectionTitle>{t('swingPerformance')}</SectionTitle>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="glass-card p-6 border-white/10">
                                <p className="text-lg text-white font-bold uppercase tracking-widest mb-2">{t('ballSpeedLabel')}</p>
                                <p className="text-3xl font-bold text-white">{data.trackmanData.layerA.ballSpeed} <span className="text-[11px] text-white/70 uppercase font-bold">MPH</span></p>
                            </div>
                            <div className="glass-card p-6 border-white/10">
                                <p className="text-lg text-white font-bold uppercase tracking-widest mb-2">{t('carryLabel')}</p>
                                <p className="text-3xl font-bold text-white">{data.trackmanData.layerA.carry} <span className="text-[11px] text-white/70 uppercase font-bold">YDS</span></p>
                            </div>
                            <div className="glass-card p-6 border-white/10">
                                <p className="text-lg text-white font-bold uppercase tracking-widest mb-2">{t('launchAngleLabel')}</p>
                                <p className="text-3xl font-bold text-white">{data.trackmanData.layerA.launchAngle}<span className="text-[13px] text-white/70 uppercase font-bold">°</span></p>
                            </div>
                            <div className="glass-card p-6 border-white/10">
                                <p className="text-lg text-white font-bold uppercase tracking-widest mb-2">{t('spinRateLabel')}</p>
                                <p className="text-3xl font-bold text-white">{data.trackmanData.layerA.spinRate} <span className="text-[11px] text-white/70 uppercase font-bold">RPM</span></p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. 诊断与方案摘要 */}
                <div className="space-y-8">
                    <SectionTitle>{t('diagnosisAndPlan')}</SectionTitle>
                    <div className="space-y-6">
                        {data.diagnosisData?.stance && (
                            <div className="glass-card p-8 border-white/5">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                                        <Shield size={20} />
                                    </div>
                                    <h4 className="text-xl font-bold text-white uppercase tracking-widest">{t('technicalDiagnosis')}</h4>
                                </div>
                                <p className="text-sm text-white/60 leading-relaxed">
                                    {data.diagnosisData.stance}
                                </p>
                            </div>
                        )}

                        {data.planData?.point1 && (
                            <div className="glass-card p-8 border-white/5">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                                        <Clipboard size={20} />
                                    </div>
                                    <h4 className="text-xl font-bold text-white uppercase tracking-widest">{t('trainingPlan')}</h4>
                                </div>
                                <p className="text-sm text-white/60 leading-relaxed">
                                    {data.planData.point1}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 重置按钮 */}
                <div className="pt-10">
                    <button
                        onClick={onReset}
                        className="w-full py-6 rounded-[32px] surface-weak border border-white/10 text-white/40 font-bold text-sm uppercase tracking-[0.3em] hover:surface hover:text-white transition-all"
                    >
                        {t('startNewAssessment')}
                    </button>
                </div>
            </div>
        </PageWrapper>
    );
};

export default ReportPage;
