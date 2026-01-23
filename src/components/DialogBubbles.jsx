import React, { useEffect, useRef } from 'react';
import { cn } from '../utils/cn';

/**
 * ChatMessage - 单条消息气泡
 * 参考：gemini-pulse-ai ChatMessage 组件
 */
const ChatMessage = ({ message }) => {
    const isUser = message.sender === 'user';

    return (
        <div
            className={cn(
                'flex w-full mb-4 px-4 transition-all duration-300 ease-out',
                isUser ? 'justify-end' : 'justify-start'
            )}
        >
            <div className={cn('max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
                <div className={cn(
                    'px-4 py-2.5 rounded-2xl text-[14px] leading-snug shadow-lg backdrop-blur-md',
                    isUser
                        ? 'bg-slate-400/40 text-white rounded-tr-none border border-white/10'
                        : 'bg-white/10 border border-white/5 text-slate-100 rounded-tl-none'
                )}>
                    {message.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 uppercase px-1 block">
                    {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
            </div>
        </div>
    );
};

/**
 * DialogBubbles - 对话历史容器（可滚动）
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
        <div className={cn('relative flex flex-col', className)}>
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto scrollbar-hide focus:outline-none"
            >
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
                <div style={{ height: 1 }} />
            </div>
        </div>
    );
};

export default DialogBubbles;
