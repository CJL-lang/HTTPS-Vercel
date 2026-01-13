/**
 * PageWrapper - 页面包装器组件
 * 功能：为页面提供统一的布局结构，包括返回按钮、标题区域、浮动操作按钮和页脚
 * 特性：
 *   - 固定返回按钮（左上角）
 *   - 浮动添加按钮（右下角，可选）
 *   - 页脚区域（可选，固定在底部）
 *   - 页面进入/退出动画
 * 使用场景：所有需要统一布局的页面
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft } from 'lucide-react';
import { cn } from '../utils/cn';

const PageWrapper = ({ children, title, onBack, onAdd, footer }) => {
    // Adjusted padding for the new button position (bottom-8)
    const bottomPadding = footer ? 'pb-32' : 'pb-24';

    return (
        <div
            className={cn("min-h-screen flex flex-col relative bg-transparent selection:bg-[#d4af37]/30", bottomPadding)}
        >
            {/* Floating Back Button */}
            {onBack && (
                <motion.button
                    onClick={onBack}
                    className="fixed top-4 left-4 z-50 btn-back"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                </motion.button>
            )}

            <main className={cn("flex-1 px-8 py-8 overflow-y-auto relative z-10 scrollbar-hide", onBack && "pt-20")}>
                {children}
            </main>

            {/* Floating Add Button */}
            {onAdd && (
                <motion.button
                    onClick={onAdd}
                    className="fixed bottom-32 right-8 z-50 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#b8860b] text-black flex items-center justify-center shadow-2xl shadow-yellow-500/30 active:scale-90"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <Plus size={28} strokeWidth={3} />
                </motion.button>
            )}

            {/* Premium Footer: Direct button rendering */}
            {footer && (
                <div className="fixed bottom-24 left-0 right-0 z-40 px-6 safe-area-inset-bottom">
                    <div className="max-w-md mx-auto">
                        {footer}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PageWrapper;


