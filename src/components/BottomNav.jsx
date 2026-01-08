/**
 * BottomNav - 底部导航栏组件
 * 功能：提供应用底部导航功能，包括学员管理、3D评估和个人资料三个主要入口
 * 特性：
 *   - 中间按钮为突出的3D评估入口（金色渐变，圆形大按钮）
 *   - 支持当前页面高亮显示
 *   - 响应式设计，适配安全区域
 * 使用场景：应用主界面底部导航
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Users, User, Box } from 'lucide-react';
import { cn } from '../utils/cn';
import { useLanguage } from '../utils/LanguageContext';

const BottomNav = ({ currentPage, onNavigate, userRole }) => {
    const { t } = useLanguage();

    const navItems = [
        { id: 'students', label: t('studentManagement'), icon: Users, page: 'students' },
        { id: 'three-d', label: '', icon: Box, page: 'three-d', isMain: true },
        { id: 'profile', label: t('profileTitle'), icon: User, page: 'profile' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-dark-border/50 z-50 safe-area-inset-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <div className="max-w-md mx-auto flex items-end justify-around px-4 py-2 h-20">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.page ||
                        (item.page === 'students' && (['students', 'home', 'home-old', 'basic-info', 'diagnosis', 'plan', 'goals', 'report', 'styku-scan', 'trackman', 'mental-report', 'physical-report', 'skills-report'].includes(currentPage))) ||
                        (item.page === 'profile' && (['profile', 'settings'].includes(currentPage))) ||
                        (item.page === 'three-d' && currentPage === 'three-d');

                    if (item.isMain) {
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.page)}
                                className="relative flex flex-col items-center self-end"
                            >
                                <motion.div
                                    className={cn(
                                        "w-20 h-20 rounded-full flex items-center justify-center shadow-2xl border-4 transition-all duration-500 relative overflow-hidden group",
                                        isActive
                                            ? "bg-gradient-to-br from-[#d4af37] via-[#f7e48b] to-[#b8860b] border-white/20"
                                            : "bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#d4af37]/30 hover:border-[#d4af37]/60"
                                    )}
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    {/* Premium Ornate Effects */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <Icon size={38} className={cn(
                                        "transition-all duration-500",
                                        isActive ? "text-black drop-shadow-md" : "text-[#d4af37]"
                                    )} strokeWidth={1.5} />
                                </motion.div>
                                <span className={cn(
                                    "text-[11px] font-semibold uppercase tracking-widest mt-1 transition-all duration-300",
                                    isActive ? "text-[#d4af37] opacity-100" : "text-white/40 opacity-70"
                                )}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.page)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 relative self-end pb-2",
                                isActive
                                    ? "text-gold"
                                    : "text-white/60 active:text-white/40"
                            )}
                        >
                            <div className={cn(
                                "relative p-2 rounded-xl transition-all duration-300",
                                isActive && "bg-gold/10"
                            )}>
                                <Icon size={24} className={cn(
                                    "transition-transform duration-300",
                                    isActive && "scale-110"
                                )} />
                            </div>
                            <span className={cn(
                                "text-[11px] font-normal transition-all duration-300",
                                isActive ? "opacity-100" : "opacity-70"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;


