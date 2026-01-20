/**
 * 通用确认弹窗（样式对齐 UnsavedChangesDialog）
 */
import React from 'react';

const ConfirmDialog = ({
    show,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    confirmVariant = 'primary' // primary | danger
}) => {
    if (!show) return null;

    const confirmClassName =
        confirmVariant === 'danger'
            ? 'w-full py-3 rounded-full bg-red-500/15 border border-red-500/30 text-red-200 font-bold text-sm uppercase tracking-widest active:scale-95 transition-all'
            : 'w-full py-3 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] active:scale-95 transition-all';

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="surface-strong border-2 border-[#d4af37]/30 rounded-3xl p-8 max-w-sm w-full">
                <h3 className="text-xl font-bold text-white mb-4 text-center">
                    {title}
                </h3>
                <p className="text-white/60 text-sm mb-8 text-center whitespace-pre-line">
                    {message}
                </p>

                <div className="flex flex-col gap-3">
                    <button onClick={onConfirm} className={confirmClassName}>
                        {confirmText}
                    </button>
                    {cancelText ? (
                        <button
                            onClick={onCancel}
                            className="w-full py-3 rounded-full surface-weak border border-white/10 text-white/60 font-bold text-sm active:scale-95 transition-all"
                        >
                            {cancelText}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
