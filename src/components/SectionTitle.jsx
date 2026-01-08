/**
 * SectionTitle - 章节标题组件
 * 功能：提供统一的章节标题样式，包含标题文字和金色渐变下划线装饰
 * 特性：
 *   - 使用统一的标题样式类（t-title-section）
 *   - 金色渐变装饰线
 * 使用场景：页面中的章节标题展示
 */
import React from 'react';
import { cn } from '../utils/cn';

const SectionTitle = ({ children, className }) => (
    <div className={cn("mb-4 sm:mb-8 flex flex-col gap-1", className)}>
        <h2 className="text-[16px] sm:text-[20px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#d4af37]">
            {children}
        </h2>
        <div className="h-[2px] w-12 sm:w-20 bg-gradient-to-r from-[#d4af37] to-transparent"></div>
    </div>
);

export default SectionTitle;


