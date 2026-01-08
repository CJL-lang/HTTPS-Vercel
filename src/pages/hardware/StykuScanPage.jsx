/**
 * Styku 3D扫描页面
 * 功能：接收和编辑Styku 3D扫描数据（身高、体重、坐高、BMI），躯干围度、上肢围度、下肢围度数据
 * 路由：/styku-scan
 * 大白话：这个页面连接Styku 3D扫描仪，显示学员的身体测量数据（身高、体重、各部位围度等），用户可以修改这些数据
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion'; // 动画库
import { ArrowRight, Scan, Activity, User } from 'lucide-react'; // 图标
import PageWrapper from '../../components/PageWrapper'; // 页面容器
import Card from '../../components/Card'; // 卡片组件
import SectionTitle from '../../components/SectionTitle'; // 标题组件
import { cn } from '../../utils/cn'; // CSS工具
import { useLanguage } from '../../utils/LanguageContext'; // 多语言

const StykuScanPage = ({ data, setData, onBack, onNext }) => {
    const { t } = useLanguage(); // 翻译函数
    const [isScanning, setIsScanning] = useState(false); // 正在扫描中的状态

    // 模拟从Styku接收数据的过程
    const startScan = () => {
        setIsScanning(true); // 开始扫描
        setTimeout(() => { // 2秒后完成
            setIsScanning(false); // 扫描完成
            // 填充模拟的扫描数据
            setData({
                ...data,
                stykuData: {
                    height: 182, // 身高
                    weight: 75.4, // 体重
                    sittingHeight: 92, // 坐高
                    bmi: 22.8, // BMI指数
                    torso: { chest: 98, waist: 82, hip: 94 }, // 躯干：胸围、腰围、臀围
                    upperLimbs: { upperArm: 32, forearm: 26 }, // 上肢：上臂、前臂
                    lowerLimbs: { thigh: 54, calf: 38 } // 下肢：大腿、小腿
                }
            });
        }, 2000);
    };

    const updateStyku = (path, val) => {
        const keys = path.split('.');
        const newData = JSON.parse(JSON.stringify(data));
        let current = newData.stykuData;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = val;
        setData(newData);
    };

    return (
        <PageWrapper
            title="Styku 3D 扫描"
            onBack={onBack}
            footer={
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onNext}
                    className="w-full py-6 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-lg shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group"
                >
                    <span className="text-lg font-bold tracking-widest uppercase">完成扫描</span>
                    <ArrowRight size={22} strokeWidth={3} />
                </motion.button>
            }
        >
            <div className="space-y-12">
                <section>
                    <div className="flex justify-between items-center mb-8">
                        <SectionTitle className="mb-0">系统自动采集</SectionTitle>
                        <motion.button
                            onClick={startScan}
                            disabled={isScanning}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all",
                                isScanning
                                    ? "surface text-white/50 cursor-not-allowed border border-white/5"
                                    : "bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black shadow-2xl shadow-yellow-500/20 active:scale-90"
                            )}
                        >
                            <Scan size={16} className={isScanning ? "animate-spin" : ""} strokeWidth={3} />
                            {isScanning ? "正在接收..." : "接收数据"}
                        </motion.button>
                    </div>

                    <div className="space-y-6">
                        {isScanning ? (
                            <div className="glass-card h-64 flex flex-col items-center justify-center border-[#d4af37]/20 relative overflow-hidden">
                                <motion.div
                                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent z-20"
                                    animate={{ top: ['0%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/5 to-transparent"></div>
                                <Scan size={64} className="text-[#d4af37] mb-6 opacity-80" strokeWidth={1} />
                                <p className="text-[#d4af37] text-[11px] font-bold animate-pulse tracking-[0.4em] uppercase">正在分析 3D 身体模型...</p>
                            </div>
                        ) : data.stykuData?.height ? (
                            <div className="glass-card h-64 flex items-center justify-center border-[#d4af37]/30 surface relative group">
                                <div className="absolute top-6 left-8">
                                    <span className="text-[11px] text-[#d4af37] font-bold tracking-[0.2em] uppercase opacity-40">系统状态: 已加密</span>
                                </div>
                                <div className="flex flex-col items-center relative z-10">
                                    <div className="relative">
                                        <User size={120} strokeWidth={0.5} className="text-[#d4af37]/10" />
                                        <motion.div
                                            className="absolute inset-0 flex items-center justify-center"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <div className="w-32 h-32 rounded-full border border-[#d4af37]/20 animate-ping"></div>
                                        </motion.div>
                                    </div>
                                    <p className="text-[13px] text-white font-bold mt-6 tracking-[0.3em] uppercase">3D 模型已生成</p>
                                </div>
                                <div className="absolute bottom-6 right-8">
                                    <div className="flex gap-1">
                                        {[1, 2, 3].map(i => <div key={i} className="w-1 h-4 bg-[#d4af37]/20 rounded-full"></div>)}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card h-64 flex flex-col items-center justify-center border-dashed border-white/10 opacity-30">
                                <Scan size={48} className="text-white mb-4" strokeWidth={1} />
                                <p className="text-[11px] text-white font-bold tracking-[0.3em] uppercase">未找到扫描数据</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            <StykuInput label="身高" unit="厘米" value={data.stykuData?.height} onChange={v => updateStyku('height', v)} />
                            <StykuInput label="体重" unit="公斤" value={data.stykuData?.weight} onChange={v => updateStyku('weight', v)} />
                            <StykuInput label="坐高" unit="厘米" value={data.stykuData?.sittingHeight} onChange={v => updateStyku('sittingHeight', v)} />
                            <StykuInput label="BMI指数" unit="" value={data.stykuData?.bmi} onChange={v => updateStyku('bmi', v)} />
                        </div>

                        <div className="glass-card overflow-hidden border-white/5 mt-8">
                            <div className="surface p-6 border-b border-white/5">
                                <h4 className="text-[12px] text-white font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                                    <Activity size={16} className="text-[#d4af37]" />
                                    详细围度数据
                                </h4>
                            </div>
                            <div className="p-8 space-y-10">
                                <div>
                                    <h5 className="text-[11px] text-white/70 uppercase font-semibold tracking-[0.4em] mb-6 flex items-center gap-2">
                                        <div className="w-4 h-[1px] bg-gray-800"></div>
                                        躯干围度
                                    </h5>
                                    <div className="grid grid-cols-3 gap-6">
                                        <CircumferenceItem label="胸围" value={data.stykuData?.torso?.chest} onChange={v => updateStyku('torso.chest', v)} />
                                        <CircumferenceItem label="腰围" value={data.stykuData?.torso?.waist} onChange={v => updateStyku('torso.waist', v)} />
                                        <CircumferenceItem label="臀围" value={data.stykuData?.torso?.hip} onChange={v => updateStyku('torso.hip', v)} />
                                    </div>
                                </div>
                                <div>
                                    <h5 className="text-[11px] text-white/70 uppercase font-semibold tracking-[0.4em] mb-6 flex items-center gap-2">
                                        <div className="w-4 h-[1px] bg-gray-800"></div>
                                        上肢围度
                                    </h5>
                                    <div className="grid grid-cols-2 gap-6">
                                        <CircumferenceItem label="上臂围" value={data.stykuData?.upperLimbs?.upperArm} onChange={v => updateStyku('upperLimbs.upperArm', v)} />
                                        <CircumferenceItem label="前臂围" value={data.stykuData?.upperLimbs?.forearm} onChange={v => updateStyku('upperLimbs.forearm', v)} />
                                    </div>
                                </div>
                                <div>
                                    <h5 className="text-[11px] text-white/70 uppercase font-semibold tracking-[0.4em] mb-6 flex items-center gap-2">
                                        <div className="w-4 h-[1px] bg-gray-800"></div>
                                        下肢围度
                                    </h5>
                                    <div className="grid grid-cols-2 gap-6">
                                        <CircumferenceItem label="大腿围" value={data.stykuData?.lowerLimbs?.thigh} onChange={v => updateStyku('lowerLimbs.thigh', v)} />
                                        <CircumferenceItem label="小腿围" value={data.stykuData?.lowerLimbs?.calf} onChange={v => updateStyku('lowerLimbs.calf', v)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </PageWrapper>
    );
};

const StykuInput = ({ label, unit, value, onChange }) => (
    <div className="border border-white/5 rounded-[32px] p-6 transition-all focus-within:border-[#d4af37]/30 group bg-black/50">
        <p className="text-[11px] text-white uppercase font-bold mb-2 group-focus-within:text-[#d4af37] transition-colors tracking-widest">{label}</p>
        <div className="flex items-baseline gap-2">
            <input
                type="number"
                className="bg-transparent text-2xl font-normal text-white w-full focus:outline-none placeholder:text-white/40 placeholder:font-normal"
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                placeholder="0.0"
            />
            {unit && <span className="text-[11px] font-bold text-white/70 uppercase">{unit}</span>}
        </div>
    </div>
);

const CircumferenceItem = ({ label, value, onChange }) => (
    <div className="p-4 rounded-[32px] border border-white/5 group focus-within:border-[#d4af37]/20 transition-all bg-black/50">
        <p className="text-[11px] text-white uppercase mb-2 font-bold tracking-widest group-focus-within:text-[#d4af37]/70">{label}</p>
        <div className="flex items-baseline gap-2">
            <input
                type="number"
                className="bg-transparent font-normal text-white text-2xl w-full focus:outline-none placeholder:text-white/40 placeholder:font-normal"
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                placeholder="0"
            />
            <span className="text-[11px] font-bold text-white/70 uppercase tracking-tighter">厘米</span>
        </div>
    </div>
);

export default StykuScanPage;

