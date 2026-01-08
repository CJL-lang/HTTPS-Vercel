import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

/**
 * DialogBubbles - 滑动查看历史的对话气泡组件
 * 特性：
 * - 内部可滚动查看历史消息
 * - 顶/底部淡出遮罩，提示可滑动（淡出效果）
 * - 用户消息金色渐变，AI消息半透明白色
 */
const DialogBubbles = ({ messages = [], className }) => {
    const scrollRef = useRef(null);

    // 新消息出现时滚到底部
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [messages]);

    return (
        <div className={cn('relative rounded-2xl', className)}>
            <div ref={scrollRef} className="h-full overflow-y-auto pr-2 scrollbar-hide space-y-3 focus:outline-none tap-highlight-transparent">
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn('flex', msg.sender === 'user' ? 'justify-end' : 'justify-start')}
                    >
                        <div
                            className={cn(
                                'max-w-[80%] px-5 py-3 rounded-3xl text-base sm:text-lg leading-relaxed shadow-lg backdrop-blur-sm',
                                msg.sender === 'user'
                                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-medium'
                                    : 'bg-white/10 border border-white/20 text-white'
                            )}
                        >
                            {msg.text}
                        </div>
                    </motion.div>
                ))}
                {/* 占位，确保滚动到最底部 */}
                <div style={{ height: 1 }} />
            </div>

            {/* 顶部淡出遮罩 */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/40 via-black/20 to-transparent rounded-t-2xl" />
            {/* 底部淡出遮罩 */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 via-black/20 to-transparent rounded-b-2xl" />
        </div>
    );
};

export default DialogBubbles;
