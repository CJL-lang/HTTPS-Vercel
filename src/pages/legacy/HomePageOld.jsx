/**
 * 能力评估主页（旧页面）
 * 功能：旧版能力评估主页，显示学员信息，功能模块入口（Styku扫描、TrackMan数据、技能诊断、训练方案、目标设定、查看报告）
 * 路由：/home-old
 * 注意：此为旧版本页面，建议使用新版本 HomePage
 */
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, User, Target, Brain, Activity, Info, Shield, Clipboard, Lock, FileText } from 'lucide-react';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/Card';
import SectionTitle from '../../components/SectionTitle';
import { cn } from '../../utils/cn';

const HomePageOld = ({ student, onNext, onBack, navigate, userRole }) => (
    <PageWrapper title="能力评估" onBack={onBack}>
        <div className="glass-card p-8 mb-10 overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#d4af37]/5 rounded-full blur-3xl group-hover:bg-[#d4af37]/10 transition-colors"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-[32px] bg-gradient-to-br from-[#d4af37]/20 to-transparent flex items-center justify-center border border-[#d4af37]/30 shadow-2xl shadow-yellow-500/10">
                        <User size={40} className="text-[#d4af37]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[11px] bg-[#d4af37] text-black px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                                ID: {student.id || "NEW"}
                            </span>
                        </div>
                        <h2 className="text-4xl font-bold text-white tracking-tighter uppercase">{student.name}</h2>
                        <p className="text-[13px] font-bold text-white uppercase tracking-[0.2em] mt-1">{student.gender} · {student.age}岁</p>
                    </div>
                </div>

                {student.history && (
                    <div className="pt-6 border-t border-white/5">
                        <p className="text-[11px] text-[#d4af37] uppercase font-bold tracking-[0.3em] mb-2">训练历史</p>
                        <p className="text-sm text-white leading-relaxed font-medium">
                            "{student.history}"
                        </p>
                    </div>
                )}

                {(student.manualCheck?.historyFreq || student.manualCheck?.purpose || student.manualCheck?.medical) && (
                    <div className="pt-6 border-t border-white/5 space-y-5">
                        {student.manualCheck?.historyFreq && (
                            <div>
                                <p className="text-[11px] text-[#d4af37] uppercase font-bold tracking-[0.3em] mb-2 flex items-center gap-2">
                                    <Info size={12} />
                                    球龄及频率
                                </p>
                                <p className="text-sm text-white leading-relaxed font-bold">
                                    {student.manualCheck.historyFreq}
                                </p>
                            </div>
                        )}
                        {student.manualCheck?.purpose && (
                            <div>
                                <p className="text-[11px] text-white uppercase font-bold tracking-[0.3em] mb-2 flex items-center gap-2">
                                    <Target size={12} className="text-[#d4af37]" />
                                    训练目标
                                </p>
                                <p className="text-sm text-white leading-relaxed font-bold">
                                    {student.manualCheck.purpose}
                                </p>
                            </div>
                        )}
                        {student.manualCheck?.medical && (
                            <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                                <p className="text-[11px] text-red-500 uppercase font-bold tracking-[0.3em] mb-2 flex items-center gap-2">
                                    <Shield size={12} />
                                    身体局限
                                </p>
                                <p className="text-sm text-red-200 leading-relaxed font-bold">
                                    {student.manualCheck.medical}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        <SectionTitle>功能模块</SectionTitle>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
        >
            {/* 1. Styku 3D 扫描 */}
            <div
                onClick={() => navigate('stykuScan')}
                className="glass-card p-6 flex items-center justify-between border-l-4 transition-all duration-500 group active:scale-98 cursor-pointer border-l-[#d4af37] shadow-yellow-500/5"
            >
                <div className="flex items-center gap-6 relative z-10">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 bg-white/15 border-white/20 group-hover:border-[#d4af37]/50">
                            <Target size={28} className="text-[#d4af37]" />
                        </div>
                        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] text-black text-[12px] font-bold flex items-center justify-center border-4 border-black">1</div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tighter uppercase text-white">Styku 3D 扫描</h3>
                        <p className="text-[11px] font-bold text-white uppercase tracking-[0.2em] mt-1">身体数据采集</p>
                    </div>
                </div>
                <ChevronRight size={24} className="text-[#d4af37]" />
            </div>

            {/* 2. TrackMan 挥杆数据 */}
            <div
                onClick={() => navigate('trackman')}
                className="glass-card p-6 flex items-center justify-between border-l-4 transition-all duration-500 group active:scale-98 cursor-pointer border-l-[#d4af37] shadow-yellow-500/5"
            >
                <div className="flex items-center gap-6 relative z-10">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 surface border-white/10 group-hover:border-[#d4af37]/50">
                            <Activity size={28} className="text-[#d4af37]" />
                        </div>
                        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] text-black text-[12px] font-bold flex items-center justify-center border-4 border-black">2</div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tighter uppercase text-white">TrackMan 数据</h3>
                        <p className="text-[11px] font-bold text-white uppercase tracking-[0.2em] mt-1">挥杆数据分析</p>
                    </div>
                </div>
                <ChevronRight size={24} className="text-[#d4af37]" />
            </div>

            {/* 3. 教练技能诊断 */}
            <div
                onClick={() => navigate('diagnosis')}
                className="glass-card p-6 flex items-center justify-between border-l-4 transition-all duration-500 group active:scale-98 cursor-pointer border-l-[#d4af37] shadow-yellow-500/5"
            >
                <div className="flex items-center gap-6 relative z-10">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 surface border-white/10 group-hover:border-[#d4af37]/50">
                            <Brain size={28} className="text-[#d4af37]" />
                        </div>
                        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] text-black text-[12px] font-bold flex items-center justify-center border-4 border-black">3</div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tighter uppercase text-white">技能诊断</h3>
                        <p className="text-[11px] font-bold text-white uppercase tracking-[0.2em] mt-1">专家技术诊断</p>
                    </div>
                </div>
                <ChevronRight size={24} className="text-[#d4af37]" />
            </div>

            {/* 4. 训练方案建议 */}
            <div
                onClick={() => navigate('plan')}
                className="glass-card p-6 flex items-center justify-between border-l-4 transition-all duration-500 group active:scale-98 cursor-pointer border-l-[#d4af37] shadow-yellow-500/5"
            >
                <div className="flex items-center gap-6 relative z-10">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 surface border-white/10 group-hover:border-[#d4af37]/50">
                            <Clipboard size={26} className="text-[#d4af37]" />
                        </div>
                        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] text-black text-[12px] font-bold flex items-center justify-center border-4 border-black">4</div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tighter uppercase text-white">训练方案</h3>
                        <p className="text-[11px] font-bold text-white uppercase tracking-[0.2em] mt-1">定制训练方案</p>
                    </div>
                </div>
                <ChevronRight size={24} className="text-[#d4af37]" />
            </div>

            {/* 5. 训练目标设定 */}
            <div
                onClick={() => navigate('goals')}
                className="glass-card p-6 flex items-center justify-between border-l-4 transition-all duration-500 group active:scale-98 cursor-pointer border-l-[#d4af37] shadow-yellow-500/5"
            >
                <div className="flex items-center gap-6 relative z-10">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 surface border-white/10 group-hover:border-[#d4af37]/50">
                            <Target size={26} className="text-[#d4af37]" />
                        </div>
                        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] text-black text-[12px] font-bold flex items-center justify-center border-4 border-black">5</div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tighter uppercase text-white">目标设定</h3>
                        <p className="text-[11px] font-bold text-white uppercase tracking-[0.2em] mt-1">阶段目标设定</p>
                    </div>
                </div>
                <ChevronRight size={24} className="text-[#d4af37]" />
            </div>

            {/* 6. 查看测评报告 */}
            <div
                onClick={() => navigate('report')}
                className="glass-card p-6 flex items-center justify-between border-l-4 transition-all duration-500 group active:scale-98 cursor-pointer border-l-green-500/50 shadow-green-500/5 bg-green-500/5"
            >
                <div className="flex items-center gap-6 relative z-10">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 bg-green-500/10 border-green-500/20 group-hover:border-green-500/50">
                            <FileText size={26} className="text-green-400" />
                        </div>
                        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white text-[12px] font-bold flex items-center justify-center border-4 border-black">6</div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tighter uppercase text-white">查看报告</h3>
                        <p className="text-[11px] font-bold text-green-400/80 uppercase tracking-[0.2em] mt-1">生成完整测评报告</p>
                    </div>
                </div>
                <ChevronRight size={24} className="text-green-400" />
            </div>

            {/* Instructions */}
            <div className="glass-card p-8 border-l-4 border-l-gray-700 surface mt-10">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl surface flex items-center justify-center flex-shrink-0 border border-white/10">
                        <Info size={24} className="text-white/70" />
                    </div>
                    <div>
                        <h4 className="text-[13px] font-bold text-white uppercase tracking-[0.2em] mb-2">
                            操作指引
                        </h4>
                        <p className="text-[12px] text-white font-bold uppercase tracking-widest leading-relaxed">
                            请按顺序完成 1-5 步测评，最后点击“查看报告”生成完整数据分析。
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    </PageWrapper>
);

export default HomePageOld;


