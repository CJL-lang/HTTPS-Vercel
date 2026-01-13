/**
 * Card - 卡片容器组件
 * 功能：提供统一的卡片样式容器，支持点击交互和悬停效果
 * 特性：
 *   - 深色渐变背景，金色边框高亮
 *   - 支持点击事件（可选）
 *   - Framer Motion 动画效果
 * 使用场景：各种内容卡片展示
 */
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const Card = ({ children, className, onClick }) => (
    <motion.div
        onClick={onClick}
        className={cn(
            "surface-strong rounded-2xl p-5 mb-4 shadow-lg shadow-black/40",
            onClick && "cursor-pointer hover:border-gold/40 active:scale-[0.98] transition-all duration-200 hover:shadow-gold/10",
            className
        )}
        whileHover={onClick ? { scale: 1.01 } : {}}
        whileTap={onClick ? { scale: 0.98 } : {}}
    >
        {children}
    </motion.div>
);

export default Card;


