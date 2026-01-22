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
            data-bubble
            className={`flex w-full mb-4 px-4 transition-all duration-300 ease-out ${isUser ? 'justify-end' : 'justify-start'}`}
            style={{ willChange: 'opacity, filter' }}
        >
            <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-snug shadow-lg ${isUser
                    ? 'bg-slate-400/40 text-white rounded-tr-none border border-white/10 backdrop-blur-md'
                    : 'bg-white/10 backdrop-blur-md border border-white/5 text-slate-100 rounded-tl-none'
                    }`}>
                    {message.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 uppercase px-1">
                    {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
            </div>
        </div>
    );
};

/**
 * DialogBubbles - 对话历史容器（可滚动）
 */
const DialogBubbles = ({ messages = [], className, centerOffset = 400 }) => {
    const scrollRef = useRef(null);
    const rafRef = useRef(0);

    const updateBubbleStyles = () => {
        const el = scrollRef.current;
        if (!el) return;

        const bubbles = el.querySelectorAll('[data-bubble]');
        const containerRect = el.getBoundingClientRect();
        const containerHeight = el.clientHeight || 1;
        const centerY = containerRect.top + containerHeight / 2 + centerOffset;

        const fadeRange = 220; // px
        const blurRange = 260; // px
        const maxBlur = 6; // px

        bubbles.forEach((bubble) => {
            const rect = bubble.getBoundingClientRect();
            const bubbleCenter = rect.top + rect.height / 2;
            const distAboveCenter = centerY - bubbleCenter;

            if (distAboveCenter <= 0) {
                bubble.style.opacity = '1';
                bubble.style.filter = 'blur(0px)';
                return;
            }

            const fadeT = Math.min(Math.max(distAboveCenter / fadeRange, 0), 1);
            const opacity = 1 - fadeT;
            const blur = Math.min((distAboveCenter / blurRange) * maxBlur, maxBlur);

            bubble.style.opacity = opacity.toFixed(3);
            bubble.style.filter = `blur(${blur.toFixed(2)}px)`;
        });
    };

    // 新消息出现时滚到底部
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
        updateBubbleStyles();
    }, [messages]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return undefined;

        const onScroll = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(updateBubbleStyles);
        };

        const onResize = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(updateBubbleStyles);
        };

        el.addEventListener('scroll', onScroll);
        window.addEventListener('resize', onResize);

        updateBubbleStyles();

        return () => {
            el.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

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
