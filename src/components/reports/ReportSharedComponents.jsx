import React from 'react';
import { motion } from 'framer-motion';

// 纯文本章节组件
export const TextSection = ({ title, icon: Icon, content, colorClass = "text-[#d4af37]" }) => {
    if (!content) return null;
    return (
        <div className="mb-10">
            <div className="mb-4 sm:mb-8 flex flex-col gap-1">
                <h2 className="text-[16px] sm:text-[20px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#d4af37]">
                    {title}
                </h2>
                <div className="h-[2px] w-12 sm:w-20 bg-gradient-to-r from-[#d4af37] to-transparent"></div>
            </div>
            <div className="glass-card p-7 border border-white/10 surface-strong rounded-2xl sm:rounded-[32px] relative overflow-hidden shadow-xl">
                <p className="text-white/70 text-[15px] leading-[1.8] font-light relative z-10">
                    {content}
                </p>
            </div>
        </div>
    );
};

// 通用动态部分渲染组件
export const DynamicSection = ({ title, icon: Icon, items, colorClass = "text-[#d4af37]", t }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="mb-10">
            <div className="mb-4 sm:mb-8 flex flex-col gap-1">
                <h2 className="text-[16px] sm:text-[20px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#d4af37]">
                    {title}
                </h2>
                <div className="h-[2px] w-12 sm:w-20 bg-gradient-to-r from-[#d4af37] to-transparent"></div>
            </div>

            <div className="glass-card border border-white/10 surface-strong rounded-2xl sm:rounded-[32px] overflow-hidden shadow-xl">
                {items.map((item, index) => (
                    <div key={index} className="relative group">
                        <div className="p-6 relative z-10">
                            <div className="flex items-start gap-4">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.5)] shrink-0" />
                                <div>
                                    <h3 className="text-[13px] font-bold text-[#d4af37] mb-2 uppercase tracking-widest">
                                        {item.title || (t ? t('untitled') : '未命名')}
                                    </h3>
                                    <p className="text-white/70 text-sm leading-relaxed font-light">
                                        {item.content || (t ? t('noContent') : '暂无内容')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 分割线 - 最后一项不显示 */}
                        {index < items.length - 1 && (
                            <div className="mx-6 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        )}

                        {/* 悬停背景效果 */}
                        <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                ))}
            </div>
        </div>
    );
};
