/**
 * 3维测评页面
 * 功能：选择3D卡通人物形象，进行技能测评、心理测评、素质测评
 * 路由：/three-d
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../../components/PageWrapper';
import { X, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';

// 15个自定义立体卡通人物数据
const characters = [
    {
        id: 1,
        name: '智高星',
        emoji: '🏌️‍♂️',
        color: 'from-blue-500 via-blue-400 to-blue-600',
        animation: 'bounce',
        description: '智慧型高尔夫球手'
    },
    {
        id: 2,
        name: '钢铁挥杆',
        emoji: '🤖',
        color: 'from-gray-400 via-gray-300 to-gray-500',
        animation: 'float',
        description: '科技感十足的机器人'
    },
    {
        id: 3,
        name: '闪电球手',
        emoji: '⚡',
        color: 'from-yellow-400 via-yellow-300 to-yellow-500',
        animation: 'shake',
        description: '速度与激情的化身'
    },
    {
        id: 4,
        name: '禅意大师',
        emoji: '🧘',
        color: 'from-purple-500 via-purple-400 to-purple-600',
        animation: 'float',
        description: '内心平静的智者'
    },
    {
        id: 5,
        name: '力量泰坦',
        emoji: '💥',
        color: 'from-red-600 via-red-500 to-red-700',
        animation: 'pulse',
        description: '充满力量的战士'
    },
    {
        id: 6,
        name: '精准之眼',
        emoji: '🎯',
        color: 'from-emerald-500 via-emerald-400 to-emerald-600',
        animation: 'rotate',
        description: '百发百中的神射手'
    },
    {
        id: 7,
        name: '风行者',
        emoji: '🌬️',
        color: 'from-cyan-400 via-cyan-300 to-cyan-500',
        animation: 'float',
        description: '如风般轻盈的舞者'
    },
    {
        id: 8,
        name: '果岭精灵',
        emoji: '🧚',
        color: 'from-pink-400 via-pink-300 to-pink-500',
        animation: 'bounce',
        description: '灵巧的魔法精灵'
    },
    {
        id: 9,
        name: '烈阳击球手',
        emoji: '☀️',
        color: 'from-orange-500 via-yellow-500 to-red-500',
        animation: 'pulse',
        description: '热情如火的球手'
    },
    {
        id: 10,
        name: '幽灵推杆',
        emoji: '👤',
        color: 'from-indigo-600 via-indigo-500 to-indigo-700',
        animation: 'float',
        description: '神秘莫测的推杆手'
    },
    {
        id: 11,
        name: '龙之魂',
        emoji: '🐲',
        color: 'from-green-600 via-green-500 to-lime-600',
        animation: 'shake',
        description: '东方神龙的力量'
    },
    {
        id: 12,
        name: '科技球童',
        emoji: '📱',
        color: 'from-slate-700 via-slate-600 to-slate-800',
        animation: 'pulse',
        description: '未来科技的助手'
    },
    {
        id: 13,
        name: '传奇教练',
        emoji: '👨‍🏫',
        color: 'from-[#d4af37] via-[#f7e48b] to-[#b8860b]',
        animation: 'float',
        description: '经验丰富的导师'
    },
    {
        id: 14,
        name: '金杯勇士',
        emoji: '🏆',
        color: 'from-yellow-600 via-amber-400 to-yellow-700',
        animation: 'bounce',
        description: '冠军的荣耀'
    },
    {
        id: 15,
        name: '深海王牌',
        emoji: '🌊',
        color: 'from-blue-700 via-cyan-600 to-blue-900',
        animation: 'float',
        description: '深不可测的高手'
    },
];

const ThreeDPage = () => {
    const { t } = useLanguage();
    const [selectedChar, setSelectedChar] = useState(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [tempChar, setTempChar] = useState(null);

    const handleConfirm = () => {
        setSelectedChar(tempChar);
        setIsSelecting(false);
    };

    // 动画配置
    const getAnimationProps = (type) => {
        switch (type) {
            case 'bounce':
                return {
                    animate: { y: [0, -15, 0] },
                    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                };
            case 'float':
                return {
                    animate: { y: [0, -10, 0], x: [0, 5, 0] },
                    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                };
            case 'pulse':
                return {
                    animate: { scale: [1, 1.05, 1] },
                    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                };
            case 'shake':
                return {
                    animate: { rotate: [-2, 2, -2] },
                    transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
                };
            case 'rotate':
                return {
                    animate: { rotate: 360 },
                    transition: { duration: 10, repeat: Infinity, ease: "linear" }
                };
            default:
                return {};
        }
    };

    return (
        <PageWrapper title={t('threeDTitle')}>
            <div className="flex flex-col items-center justify-between min-h-[70vh] py-10 relative">
                {/* Central Cartoon/Avatar Section */}
                <div className="relative flex-1 flex items-center justify-center w-full">
                    {/* Background Glows */}
                    <div className="absolute w-80 h-80 bg-[#d4af37]/15 rounded-full blur-[100px] animate-pulse"></div>

                    {/* Character Container - Clickable to change */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => {
                            setTempChar(selectedChar);
                            setIsSelecting(true);
                        }}
                        className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 rounded-full border-2 border-white/20 surface-weak flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#d4af37]/50 transition-all duration-500 group shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                    >
                        <AnimatePresence mode="wait">
                            {selectedChar ? (
                                <motion.div
                                    key={selectedChar.id}
                                    initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
                                    className="flex flex-col items-center justify-center relative z-20"
                                >
                                    <motion.div
                                        {...getAnimationProps(selectedChar.animation)}
                                        className={cn(
                                            "w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative mb-4 border-4 border-white/30 transform-3d-container",
                                            selectedChar.color
                                        )}
                                    >
                                        {/* Volumetric Lighting Effect */}
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-white/40 pointer-events-none"></div>
                                        <motion.span
                                            className="text-6xl sm:text-8xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform-3d-medium"
                                        >
                                            {selectedChar.emoji}
                                        </motion.span>
                                        {/* 3D Depth Shadow */}
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-6 sm:h-8 surface-weak rounded-full blur-xl"></div>
                                    </motion.div>
                                    <motion.span
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-white font-bold uppercase tracking-[0.2em] text-base sm:text-lg drop-shadow-lg"
                                    >
                                        {selectedChar.name}
                                    </motion.span>
                                    <span className="text-[#d4af37]/80 text-[11px] sm:text-[12px] uppercase font-bold tracking-[0.3em] mt-2 group-hover:text-white transition-colors">{t('clickToChangeCharacter')}</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center gap-4 relative z-20"
                                >
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 border-4 border-black/20">
                                        <span className="text-3xl sm:text-4xl font-bold text-black">3D</span>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-white font-bold uppercase tracking-[0.3em] text-xs sm:text-sm mb-1">{t('cartoonCharacter')}</h3>
                                        <p className="text-[#d4af37]/60 text-[11px] sm:text-[12px] uppercase font-bold tracking-widest">{t('clickToSelectAvatar')}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Decorative Rings */}
                        <motion.div
                            className="absolute inset-0 border-2 border-[#d4af37]/20 rounded-full z-10"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div
                            className="absolute inset-4 border border-white/10 rounded-full z-10"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                    </motion.div>

                    {/* Scanning Line Effect */}
                    <motion.div
                        className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent z-20 pointer-events-none shadow-[0_0_15px_#d4af37]"
                        animate={{ top: ['30%', '70%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>

                {/* Bottom Assessment Controls */}
                <div className="w-full space-y-10 px-8 mt-12">
                    {/* Custom Progress Bar */}
                    <div className="relative h-14 surface-weak rounded-[32px] border border-white/10 overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] p-1">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '33%' }}
                            className="h-full bg-gradient-to-r from-sky-500 via-sky-400 to-sky-300 rounded-[32px] shadow-[0_0_25px_rgba(56,189,248,0.6)] relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                            <motion.div
                                className="absolute right-0 top-0 bottom-0 w-8 bg-white/30 blur-md"
                                animate={{ x: [-20, 0] }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                        </motion.div>
                    </div>

                    {/* Labels Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center gap-4">
                            <span className="text-sm font-bold text-white tracking-tighter uppercase drop-shadow-md">{t('skillsAssessmentLabel')}</span>
                            <div className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_15px_#38bdf8] border-2 border-white/30"></div>
                        </div>
                        <div className="flex flex-col items-center gap-4 opacity-30">
                            <span className="text-sm font-bold text-white/70 tracking-tighter uppercase">{t('mentalAssessmentLabel')}</span>
                            <div className="w-2 h-2 rounded-full bg-white/20 border border-white/10"></div>
                        </div>
                        <div className="flex flex-col items-center gap-4 opacity-30">
                            <span className="text-sm font-bold text-white/70 tracking-tighter uppercase">{t('qualityAssessmentLabel')}</span>
                            <div className="w-2 h-2 rounded-full bg-white/20 border border-white/10"></div>
                        </div>
                    </div>
                </div>

                {/* Character Selection Modal */}
                <AnimatePresence>
                    {isSelecting && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-24 bg-black/85"
                            onClick={() => setIsSelecting(false)}
                        >
                            <motion.div
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="w-full max-w-md bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_-10px_50px_rgba(0,0,0,0.8)]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-10">
                                    <div className="flex justify-between items-center mb-10">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white uppercase tracking-tighter">{t('selectYourCharacter')}</h3>
                                            <p className="text-[11px] text-[#d4af37] font-bold uppercase tracking-widest mt-1">{t('pickYourGolfCharacter')}</p>
                                        </div>
                                        <button
                                            onClick={() => setIsSelecting(false)}
                                            className="w-12 h-12 rounded-2xl surface-weak flex items-center justify-center text-white/60 hover:surface hover:text-white transition-all border border-white/5 active:scale-90"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>

                                    {/* Grid of characters */}
                                    <div className="grid grid-cols-3 gap-5 max-h-[45vh] overflow-y-auto pr-3 scrollbar-hide">
                                        {characters.map((char) => (
                                            <button
                                                key={char.id}
                                                onClick={() => setTempChar(char)}
                                                className={cn(
                                                    "flex flex-col items-center gap-4 p-5 rounded-[32px] border transition-all duration-500 relative group/item",
                                                    tempChar?.id === char.id
                                                        ? "bg-[#d4af37]/15 border-[#d4af37] scale-105 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                                                        : "surface-weak border-white/5 hover:border-white/20 hover:surface"
                                                )}
                                            >
                                                <motion.div
                                                    {...getAnimationProps(char.animation)}
                                                    className={cn(
                                                        "w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center shadow-xl relative overflow-hidden transition-transform duration-500 group-hover/item:scale-110 border-2 border-white/10 transform-3d-container",
                                                        char.color
                                                    )}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/40"></div>
                                                    <motion.span
                                                        className="text-3xl drop-shadow-md transform-3d-shallow"
                                                    >
                                                        {char.emoji}
                                                    </motion.span>
                                                    {/* 3D Depth Shadow */}
                                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-4 surface-weak rounded-full blur-md"></div>
                                                </motion.div>
                                                <span className={cn(
                                                    "text-[11px] font-bold uppercase tracking-widest text-center leading-tight transition-colors",
                                                    tempChar?.id === char.id ? "text-[#d4af37]" : "text-white/40"
                                                )}>
                                                    {char.name}
                                                </span>
                                                {tempChar?.id === char.id && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#d4af37] flex items-center justify-center text-black border-2 border-[#1a1a1a]"
                                                    >
                                                        <Check size={14} strokeWidth={4} />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-10 pt-8 border-t border-white/5">
                                        <button
                                            onClick={handleConfirm}
                                            disabled={!tempChar}
                                            className={cn(
                                                "w-full py-5 rounded-[32px] flex items-center justify-center gap-4 font-bold uppercase tracking-[0.3em] transition-all duration-500",
                                                tempChar
                                                    ? "bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black shadow-[0_15px_30px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-95"
                                                    : "surface-weak text-white/10 cursor-not-allowed"
                                            )}
                                        >
                                            <span className="text-lg">确认选择</span>
                                            <Check size={24} strokeWidth={4} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageWrapper>
    );
};

export default ThreeDPage;
