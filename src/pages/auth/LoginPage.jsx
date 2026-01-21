/**
 * 登录页面
 * 功能：用户登录，支持角色选择（顾问/教练），账号密码登录，前端开发模式
 * 路由：/login
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Mail, Lock, Eye, EyeOff, Brain, UserCheck } from 'lucide-react';
import axios from 'axios';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';

const LoginPage = ({ onLogin }) => {
    const { t } = useLanguage();
    const [role, setRole] = useState('coach'); // 'coach' or 'consultant'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError(t('loginAlert'));
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    account: username,
                    password: password,
                    role: role === 'consultant' ? 'consultation' : role,
                }),
            });

            const data = await response.json();

            if (response.ok && data.token) {
                onLogin({
                    username: data.user?.username || username,
                    role: data.user?.role || role,
                    token: data.token,
                    id: data.user?.id,
                    name: data.user?.name,
                    email: data.user?.email
                });
            } else {
                setError(data.message || t('loginFailed'));
            }
        } catch (error) {

            setError(t('connectionError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center px-4 sm:px-6 md:px-8 relative overflow-hidden bg-transparent py-8 sm:py-0">
            {/* Subtle gold accent */}
            <div className="absolute top-[-10%] right-[-10%] w-48 h-48 sm:w-72 sm:h-72 bg-[#d4af37]/10 rounded-full blur-[100px] opacity-60 animate-pulse-slow" />
            <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 sm:w-72 sm:h-72 bg-[#b8860b]/5 rounded-full blur-[80px] opacity-60" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md mx-auto"
            >
                <div className="mb-8 sm:mb-12 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#d4af37] to-[#b8860b] rounded-2xl sm:rounded-[32px] mx-auto flex items-center justify-center shadow-2xl shadow-[#d4af37]/30 mb-4 sm:mb-6 rotate-3">
                        <Activity size={32} className="sm:w-10 sm:h-10 text-black" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 tracking-tighter uppercase">GOLF COACH</h1>
                    <p className="text-[#d4af37] text-[11px] sm:text-[12px] font-bold tracking-[0.3em] uppercase opacity-60 px-2">{t('loginTitle') || 'Professional Training Management'}</p>
                </div>

                <div className="surface-strong p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] border border-white/5 shadow-2xl shadow-black/50">
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                        {/* Role Selection */}
                        <div className="flex p-0.5 sm:p-1 surface-weak rounded-xl sm:rounded-2xl border border-white/5 mb-6 sm:mb-8">
                            <button
                                type="button"
                                onClick={() => setRole('consultant')}
                                className={cn(
                                    "flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 uppercase tracking-widest px-1",
                                    role === 'consultant' ? "bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20" : "text-white/40 hover:text-white/60"
                                )}
                            >
                                <UserCheck size={14} className="sm:w-4 sm:h-4 shrink-0" /> <span className="truncate">{t('consultantLogin')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('coach')}
                                className={cn(
                                    "flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 uppercase tracking-widest px-1",
                                    role === 'coach' ? "bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20" : "text-white/40 hover:text-white/60"
                                )}
                            >
                                <Brain size={14} className="sm:w-4 sm:h-4 shrink-0" /> <span className="truncate">{t('coachLogin')}</span>
                            </button>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] sm:text-xs py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl text-center font-bold uppercase tracking-wider break-words"
                            >
                                {error.message || error.toString() || 'Login failed'}
                            </motion.div>
                        )}

                        <div className="space-y-3 sm:space-y-4">
                            <div className="relative">
                                <label className="label-gold ml-1">{t('usernameLabel')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                        <Mail size={16} className="sm:w-[18px] sm:h-[18px] text-[#d4af37]/60" />
                                    </div>
                                    <input
                                        type="text"
                                        className="input-dark pl-10 sm:pl-12 text-sm font-normal"
                                        placeholder={t('loginAccountPlaceholder')}
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <label className="label-gold ml-1">{t('passwordLabel')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                                        <Lock size={16} className="sm:w-[18px] sm:h-[18px] text-[#d4af37]/60" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="input-dark pl-10 sm:pl-12 pr-10 sm:pr-12 text-sm font-normal"
                                        placeholder={t('passwordPlaceholder')}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-white/40 hover:text-[#d4af37] transition-colors"
                                        disabled={loading}
                                    >
                                        {showPassword ? <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-white/40 px-1 font-bold uppercase tracking-widest">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="w-4 h-4 rounded border border-white/20 flex items-center justify-center group-hover:border-[#d4af37] transition-colors">
                                    <div className="w-2 h-2 bg-[#d4af37] rounded-sm opacity-0 group-hover:opacity-40 transition-opacity" />
                                </div>
                                {t('rememberMe')}
                            </label>
                            <button type="button" className="hover:text-[#d4af37] transition-colors">{t('forgotPassword')}</button>
                        </div>

                        <div className="space-y-3 pt-2">
                            {/* 正式登录按钮 (联调后端) */}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "w-full h-[54px] bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold rounded-full shadow-2xl shadow-[#d4af37]/30 flex items-center justify-center gap-3 group active:scale-[0.98] transition-all uppercase tracking-widest text-lg",
                                    loading ? "opacity-70 cursor-not-allowed" : ""
                                )}
                            >
                                {loading ? t('verifying') : t('backendLogin')}
                            </motion.button>
                        </div>

                        <p className="text-center text-[11px] text-white/40 mt-8 font-bold uppercase tracking-widest">
                            {t('noAccount')}
                            <button
                                type="button"
                                onClick={() => onLogin({ action: 'goRegister' })}
                                className="text-[#d4af37] font-bold ml-2 hover:underline"
                            >
                                {t('registerNow')}
                            </button>
                        </p>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;

