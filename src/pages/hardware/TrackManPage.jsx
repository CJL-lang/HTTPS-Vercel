/**
 * TrackMan挥杆数据页面
 * 功能：同步和编辑TrackMan挥杆数据，包括A层（球路核心）、B层（击球效率）、C层（深度分析）数据
 * 路由：/trackman
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Activity, Info } from 'lucide-react';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/Card';
import SectionTitle from '../../components/SectionTitle';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';

const TrackManPage = ({ data, setData, onBack, onNext, onLogout }) => {
    const { t } = useLanguage();
    const [isTesting, setIsTesting] = useState(false);

    const startTest = async () => {
        setIsTesting(true);
        try {
            // 从后端 API 获取最新的 trackman 数据
            const response = await fetch('/api/trackman/latest');

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            const trackmanRecord = await response.json();

            // 将数据库数据转换为前端期望的格式
            setData({
                ...data,
                trackmanData: {
                    problems: data.trackmanData?.problems || "",
                    layerA: {
                        ballSpeed: trackmanRecord.ball_speed?.toString() || "",
                        launchAngle: trackmanRecord.launch_angle?.toString() || "",
                        launchDirection: trackmanRecord.launch_direction || "",
                        spinRate: trackmanRecord.spin_rate?.toString() || "",
                        spinAxis: trackmanRecord.spin_axis || "",
                        carry: trackmanRecord.carry?.toString() || "",
                        landingAngle: trackmanRecord.landing_angle?.toString() || "",
                        offline: trackmanRecord.offline || ""
                    },
                    layerB: {
                        clubSpeed: trackmanRecord.club_speed?.toString() || "",
                        attackAngle: trackmanRecord.attack_angle?.toString() || "",
                        clubPath: trackmanRecord.club_path?.toString() || "",
                        faceAngle: trackmanRecord.face_angle?.toString() || "",
                        faceToPath: trackmanRecord.face_to_path?.toString() || "",
                        dynamicLoft: trackmanRecord.dynamic_loft?.toString() || "",
                        smashFactor: trackmanRecord.smash_factor?.toString() || "",
                        spinLoft: trackmanRecord.spin_loft?.toString() || ""
                    },
                    layerC: {
                        lowPoint: trackmanRecord.low_point || "",
                        impactOffset: trackmanRecord.impact_offset || "",
                        indexing: trackmanRecord.indexing || ""
                    }
                }
            });
        } catch (error) {

            // 降级处理：使用默认数据
            setData({
                ...data,
                trackmanData: {
                    problems: data.trackmanData?.problems || "球路略微偏右，触球瞬间杆面稍开。",
                    layerA: {
                        ballSpeed: "156.2",
                        launchAngle: "12.4",
                        launchDirection: "R 1.2",
                        spinRate: "2450",
                        spinAxis: "L 2.1",
                        carry: "264",
                        landingAngle: "45.2",
                        offline: "R 12"
                    },
                    layerB: {
                        clubSpeed: "105.4",
                        attackAngle: "-3.2",
                        clubPath: "+2.1",
                        faceAngle: "-1.2",
                        faceToPath: "-3.3",
                        dynamicLoft: "15.4",
                        smashFactor: "1.48",
                        spinLoft: "18.6"
                    },
                    layerC: {
                        lowPoint: "4.2 / -1.2",
                        impactOffset: "H 2.1 / V 1.5",
                        indexing: "Smash: 102 / Spin: 98"
                    }
                }
            });
        } finally {
            setIsTesting(false);
        }
    };

    const updateProblems = (val) => {
        setData({
            ...data,
            trackmanData: { ...data.trackmanData, problems: val }
        });
    };

    const updateLayer = (layer, key, val) => {
        setData({
            ...data,
            trackmanData: {
                ...data.trackmanData,
                [layer]: {
                    ...data.trackmanData[layer],
                    [key]: val
                }
            }
        });
    };

    return (
        <PageWrapper
            title="挥杆数据"
            onBack={onBack}
            footer={
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onNext}
                    className="w-full py-6 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-lg shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group"
                >
                    <span className="text-lg font-bold tracking-widest uppercase">技能诊断</span>
                    <ArrowRight size={22} strokeWidth={3} />
                </motion.button>
            }
        >
            <div className="space-y-12 pb-12">
                <div className="flex justify-between items-center mb-8">
                    <SectionTitle className="mb-0">挥杆数据采集</SectionTitle>
                    <motion.button
                        onClick={startTest}
                        disabled={isTesting}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all",
                            isTesting
                                ? "surface text-white/50 cursor-not-allowed border border-white/5"
                                : "bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black shadow-2xl shadow-yellow-500/20 active:scale-90"
                        )}
                    >
                        <Activity size={16} className={isTesting ? "animate-pulse" : ""} strokeWidth={3} />
                        {isTesting ? "正在同步..." : "同步数据"}
                    </motion.button>
                </div>

                {isTesting ? (
                    <div className="glass-card h-64 flex flex-col items-center justify-center border-[#d4af37]/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/5 to-transparent"></div>
                        <Activity size={64} className="text-[#d4af37] mb-6 animate-bounce" strokeWidth={1} />
                        <p className="text-[#d4af37] text-[11px] font-bold animate-pulse tracking-[0.4em] uppercase">正在处理挥杆数据...</p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        <section className="glass-card p-8 border-white/5 surface">
                            <h4 className="text-xl text-white font-bold mb-6 flex items-center gap-3 uppercase tracking-[0.2em]">
                                <Info size={16} className="text-[#d4af37]" />
                                问题描述与分类
                            </h4>
                            <textarea
                                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-white/40 placeholder:font-normal h-28 text-sm font-normal leading-relaxed resize-none scrollbar-hide"
                                placeholder="Classification (Ball flight, direction, mechanics...)"
                                value={data.trackmanData?.problems || ""}
                                onChange={e => updateProblems(e.target.value)}
                            />
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                                <h4 className="text-lg text-[#d4af37] uppercase font-bold tracking-[0.4em]">A 层 (球路核心)</h4>
                                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <MetricCard label="Ball Speed" value={data.trackmanData?.layerA?.ballSpeed} unit="mph" onChange={v => updateLayer('layerA', 'ballSpeed', v)} />
                                <MetricCard label="Launch Angle" value={data.trackmanData?.layerA?.launchAngle} unit="°" onChange={v => updateLayer('layerA', 'launchAngle', v)} />
                                <MetricCard label="Launch Dir" value={data.trackmanData?.layerA?.launchDirection} unit="" onChange={v => updateLayer('layerA', 'launchDirection', v)} />
                                <MetricCard label="Spin Rate" value={data.trackmanData?.layerA?.spinRate} unit="rpm" onChange={v => updateLayer('layerA', 'spinRate', v)} />
                                <MetricCard label="Spin Axis" value={data.trackmanData?.layerA?.spinAxis} unit="" onChange={v => updateLayer('layerA', 'spinAxis', v)} />
                                <MetricCard label="Carry" value={data.trackmanData?.layerA?.carry} unit="yd" onChange={v => updateLayer('layerA', 'carry', v)} />
                                <MetricCard label="Landing Angle" value={data.trackmanData?.layerA?.landingAngle} unit="°" onChange={v => updateLayer('layerA', 'landingAngle', v)} />
                                <MetricCard label="Offline" value={data.trackmanData?.layerA?.offline} unit="yd" onChange={v => updateLayer('layerA', 'offline', v)} />
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                                <h4 className="text-lg text-[#d4af37] uppercase font-bold tracking-[0.4em]">B 层 (击球效率)</h4>
                                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <MetricCard label="Club Speed" value={data.trackmanData?.layerB?.clubSpeed} unit="mph" onChange={v => updateLayer('layerB', 'clubSpeed', v)} />
                                <MetricCard label="Attack Angle" value={data.trackmanData?.layerB?.attackAngle} unit="°" onChange={v => updateLayer('layerB', 'attackAngle', v)} />
                                <MetricCard label="Club Path" value={data.trackmanData?.layerB?.clubPath} unit="°" onChange={v => updateLayer('layerB', 'clubPath', v)} />
                                <MetricCard label="Face Angle" value={data.trackmanData?.layerB?.faceAngle} unit="°" onChange={v => updateLayer('layerB', 'faceAngle', v)} />
                                <MetricCard label="Face-to-Path" value={data.trackmanData?.layerB?.faceToPath} unit="°" onChange={v => updateLayer('layerB', 'faceToPath', v)} />
                                <MetricCard label="Dynamic Loft" value={data.trackmanData?.layerB?.dynamicLoft} unit="°" onChange={v => updateLayer('layerB', 'dynamicLoft', v)} />
                                <MetricCard label="Smash Factor" value={data.trackmanData?.layerB?.smashFactor} unit="" onChange={v => updateLayer('layerB', 'smashFactor', v)} />
                                <MetricCard label="Spin Loft" value={data.trackmanData?.layerB?.spinLoft} unit="°" onChange={v => updateLayer('layerB', 'spinLoft', v)} />
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                                <h4 className="text-lg text-[#d4af37] uppercase font-bold tracking-[0.4em]">C 层 (深度分析)</h4>
                                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                            </div>
                            <div className="space-y-4">
                                <MetricCardWide label="Low Point (Dist/Height)" value={data.trackmanData?.layerC?.lowPoint} onChange={v => updateLayer('layerC', 'lowPoint', v)} />
                                <MetricCardWide label="Impact Offset (H/V)" value={data.trackmanData?.layerC?.impactOffset} onChange={v => updateLayer('layerC', 'impactOffset', v)} />
                                <MetricCardWide label="Indices (Efficiency)" value={data.trackmanData?.layerC?.indexing} onChange={v => updateLayer('layerC', 'indexing', v)} />
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
};

const MetricCardWide = ({ label, value, onChange }) => (
    <div className="glass-card p-6 mb-0 border-white/5 flex items-center justify-between group">
        <p className="text-[11px] text-white uppercase font-bold tracking-widest w-1/2 group-hover:text-[#d4af37] transition-colors">{label}</p>
        <input
            type="text"
            className="bg-transparent text-right font-normal text-white w-1/2 focus:outline-none placeholder:font-normal text-sm"
            value={value || ""}
            onChange={e => onChange(e.target.value)}
            placeholder="--"
        />
    </div>
);

const MetricCard = ({ label, value, unit, onChange }) => (
    <div className="glass-card p-5 mb-0 border-white/10 group hover:border-[#d4af37]/20 transition-all">
        <p className="text-lg text-white uppercase font-bold mb-3 tracking-widest group-hover:text-[#d4af37] transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
            {label} {unit && `(${unit})`}
        </p>
        <input
            type="text"
            className="bg-transparent text-2xl font-normal text-white w-full focus:outline-none placeholder:font-normal"
            value={value || ""}
            onChange={e => onChange(e.target.value)}
            placeholder="--"
        />
    </div>
);

export default TrackManPage;

