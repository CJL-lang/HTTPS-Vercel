/**
 * 底部保存按钮组件
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const SaveButton = ({ 
    showCompleteActions, 
    activeSecondary, 
    onSave, 
    onGenerateLater, 
    onGenerateAI,
    isNavigating,
    generateLaterText,
    generateAIText,
    t 
}) => {
    // 解决显示完整操作按钮组的条件
    const shouldShowCompleteActions = showCompleteActions && activeSecondary === 3;
    
    return (
        <div className="fixed bottom-6 sm:bottom-8 left-0 right-0 px-4 sm:px-6 z-[60]">
            <div className="max-w-md mx-auto">
                <AnimatePresence mode="wait">
                    {isNavigating ? (
                        <motion.div
                            key="navigating"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full h-[48px] sm:h-[52px] md:h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-xs sm:text-sm md:text-base uppercase tracking-wider sm:tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4"
                        >
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                            <span className="text-[11px] sm:text-sm md:text-base">{t('generatingReport')}</span>
                        </motion.div>
                    ) : !shouldShowCompleteActions ? (
                        <motion.button
                            key="save"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onSave}
                            className="w-full h-[48px] sm:h-[52px] md:h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-xs sm:text-sm md:text-base uppercase tracking-wider sm:tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 sm:gap-3 group transition-all px-3 sm:px-4"
                        >
                            <span className="truncate text-[11px] sm:text-sm md:text-base">
                                {activeSecondary < 3 
                                    ? t('saveAndContinue')
                                    : t('completeAssessment')}
                            </span>
                        </motion.button>
                    ) : (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex gap-2 sm:gap-3"
                        >
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={onGenerateLater}
                                disabled={isNavigating}
                                className="flex-1 h-[48px] sm:h-[52px] md:h-[54px] rounded-full bg-black/60 border border-white/20 text-white font-bold text-[11px] sm:text-xs md:text-sm uppercase tracking-wider sm:tracking-widest backdrop-blur-lg flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 group transition-all px-2 sm:px-3 md:px-4 hover:bg-black/80 disabled:opacity-50"
                            >
                                <span className="truncate text-[11px] sm:text-xs md:text-sm">{generateLaterText || t('generateLater')}</span>
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={onGenerateAI}
                                disabled={isNavigating}
                                className="flex-1 h-[48px] sm:h-[52px] md:h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-[11px] sm:text-xs md:text-sm uppercase tracking-wider sm:tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 group transition-all px-2 sm:px-3 md:px-4 disabled:opacity-50"
                            >
                                <span className="truncate text-[11px] sm:text-xs md:text-sm">{generateAIText || t('generateAIReport')}</span>
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SaveButton;
