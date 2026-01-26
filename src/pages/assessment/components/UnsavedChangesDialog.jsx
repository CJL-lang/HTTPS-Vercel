/**
 * 未保存变更确认对话框
 */
import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const UnsavedChangesDialog = ({ 
    show, 
    onSaveAndContinue, 
    onLeaveWithoutSaving, 
    onCancel,
    t 
}) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="surface-strong border-2 border-[#d4af37]/30 rounded-3xl p-8 max-w-sm w-full"
                    >
                        <h3 className="text-xl font-bold text-white mb-4 text-center">
                            {t('unsavedChangesTitle')}
                        </h3>
                        <p className="text-white/60 text-sm mb-8 text-center">
                            {t('unsavedChangesMessage')}
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={onSaveAndContinue}
                                className="w-full py-3 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] active:scale-95 transition-all"
                            >
                                {t('saveAndContinue')}
                            </button>
                            <button
                                onClick={onLeaveWithoutSaving}
                                className="w-full py-3 rounded-full surface-weak border border-white/10 text-white/80 font-bold text-sm active:scale-95 transition-all"
                            >
                                {t('leaveWithoutSaving')}
                            </button>
                            <button
                                onClick={onCancel}
                                className="w-full py-3 rounded-full surface-weak border border-white/10 text-white/60 font-bold text-sm active:scale-95 transition-all"
                            >
                                {t('cancel')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UnsavedChangesDialog;
