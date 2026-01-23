/**
 * 注册页面
 * 功能：新用户注册，填写账号、密码、手机号等信息
 * 路由：/register
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Mail, Lock, Eye, EyeOff, User, Phone, ShieldCheck, ChevronLeft, FileText } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';

const RegisterPage = ({ onRegister, navigate }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        username: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'coach'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [passwordMismatch, setPasswordMismatch] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const roles = [
        { id: 'coach', labelKey: 'coachRole' },
        { id: 'student', labelKey: 'studentRole' },
        { id: 'parent', labelKey: 'parentRole' },
        { id: 'assistant', labelKey: 'assistantRole' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const next = { ...prev, [name]: value };
            // 清除对应字段的必填高亮
            if (fieldErrors[name]) {
                setFieldErrors(prevErr => ({ ...prevErr, [name]: false }));
            }
            // 如果密码/确认密码修改后两者相同，清除“不一致”提示
            if ((name === 'password' || name === 'confirmPassword') && passwordMismatch) {
                const otherKey = name === 'password' ? 'confirmPassword' : 'password';
                if (next[name] === next[otherKey]) {
                    setPasswordMismatch(false);
                    setError('');
                }
            }
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});
        setPasswordMismatch(false);
        const { username, phone, email, password, confirmPassword, role, bio } = formData;

        const requiredFields = [
            { key: 'username', label: t('username') || '用户名' },
            { key: 'phone', label: t('phoneLabel') || '手机号码' },
            { key: 'email', label: t('emailLabel') || '电子邮箱' },
            { key: 'password', label: t('passwordLabel') || '设置密码' },
            { key: 'confirmPassword', label: t('confirmPasswordLabel') || '确认密码' }
        ];

        const missing = requiredFields.filter(f => !formData[f.key]);
        if (missing.length > 0) {
            const errorMap = missing.reduce((acc, cur) => ({ ...acc, [cur.key]: true }), {});
            setFieldErrors(errorMap);
            setError(`以下必填项未填写：${missing.map(m => m.label).join('、')}`);
            return;
        }

        if (password !== confirmPassword) {
            setFieldErrors(prev => ({ ...prev, password: true, confirmPassword: true }));
            setPasswordMismatch(true);
            setError('两次输入的密码不一致');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: role,
                    username: username,
                    email: email,
                    password: password,
                    phone: phone,
                    bio: '新注册用户'
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('注册成功，返回数据:', data);

                // 注册成功后自动登录（尝试用 phone 登录）
                try {
                    const loginResponse = await fetch('/api/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            account: phone,  // 使用手机号登录
                            password: password,
                            role: role,
                        }),
                    });

                    const loginData = await loginResponse.json();
                    console.log('自动登录返回数据:', loginData);

                    if (loginResponse.ok && loginData.token) {
                        alert('注册成功！');

                        // 构建完整的用户信息对象
                        const userInfo = {
                            username: loginData.user?.username || username,
                            role: loginData.user?.role || role,
                            token: loginData.token,
                            id: loginData.user?.id || data.user_id,
                            name: loginData.user?.name,
                            email: loginData.user?.email || email,
                            phone: loginData.user?.phone || phone
                        };

                        console.log('准备传递的用户信息:', userInfo);

                        if (onRegister) {
                            onRegister(userInfo);
                        } else {
                            navigate('/students');
                        }
                    } else {
                        // 自动登录失败，提示用户手动登录
                        alert('注册成功！请登录');
                        navigate('/login');
                    }
                } catch (loginError) {
                    console.error('自动登录失败:', loginError);
                    alert('注册成功！请登录');
                    navigate('/login');
                }
            } else {
                setError(data.message || '注册失败，请稍后重试');
            }
        } catch (err) {
            setError('网络连接错误，请检查后端服务是否开启');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center px-4 sm:px-8 py-8 sm:py-12 relative overflow-hidden bg-transparent">
            {/* Background Accents */}
            <div className="absolute top-[-5%] right-[-10%] w-72 h-72 bg-[#d4af37]/10 rounded-full blur-[100px] opacity-60 animate-pulse-slow" />
            <div className="absolute bottom-[-5%] left-[-10%] w-72 h-72 bg-[#b8860b]/5 rounded-full blur-[80px] opacity-60" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md mx-auto"
            >
                {/* Back Button */}
                <button
                    onClick={() => navigate('/login')}
                    className="mb-6 sm:mb-8 btn-back"
                >
                    <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                </button>

                <div className="mb-8 sm:mb-10 text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#d4af37] to-[#b8860b] rounded-[24px] mx-auto flex items-center justify-center shadow-2xl shadow-[#d4af37]/20 mb-4 sm:mb-6 rotate-3">
                        <Activity size={28} className="sm:w-8 sm:h-8 text-black" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tighter uppercase">{t('createAccount') || '创建账户'}</h1>
                    <p className="text-[#d4af37] text-[11px] sm:text-[12px] font-bold tracking-[0.3em] uppercase opacity-60">Join the Elite Golf Community</p>
                </div>

                <div className="surface-strong p-6 sm:p-8 rounded-2xl sm:rounded-[32px] border border-white/5 shadow-2xl shadow-black/50">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold text-center">
                                {error}
                            </div>
                        )}
                        {/* Role Selection Grid */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2">
                            {roles.map((r) => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, role: r.id }))}
                                    className={cn(
                                        "py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-[12px] font-bold transition-all border uppercase tracking-widest",
                                        formData.role === r.id
                                            ? "bg-[#d4af37] text-black border-[#d4af37] shadow-lg shadow-[#d4af37]/20"
                                            : "surface-weak text-white/40 border-white/10 hover:border-white/20"
                                    )}
                                >
                                    {t(r.labelKey)}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            {/* Username */}
                            <div className="relative">
                                <label className="label-gold label-required ml-1">
                                    {t('username') || '用户名'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User size={18} className="text-[#d4af37]/60" />
                                    </div>
                                    <input
                                        name="username"
                                        type="text"
                                        className={cn(
                                            "input-dark pl-12 text-sm font-normal",
                                            fieldErrors.username && "border border-red-500/50 focus:ring-red-500/40"
                                        )}
                                        placeholder={t('usernamePlaceholder') || '请输入用户名'}
                                        value={formData.username}
                                        onChange={handleChange}
                                    />
                                </div>
                                {fieldErrors.username && <p className="text-red-400 text-xs mt-1">必填项未填写</p>}
                            </div>

                            {/* Phone */}
                            <div className="relative">
                                <label className="label-gold label-required ml-1">
                                    {t('phoneLabel') || '手机号码'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Phone size={18} className="text-[#d4af37]/60" />
                                    </div>
                                    <input
                                        name="phone"
                                        type="tel"
                                        className={cn(
                                            "input-dark pl-12 text-sm font-normal",
                                            fieldErrors.phone && "border border-red-500/50 focus:ring-red-500/40"
                                        )}
                                        placeholder={t('phonePlaceholder') || '请输入手机号'}
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">必填项未填写</p>}
                            </div>

                            {/* Email */}
                            <div className="relative">
                                <label className="label-gold label-required ml-1">
                                    {t('emailLabel') || '电子邮箱'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-[#d4af37]/60" />
                                    </div>
                                    <input
                                        name="email"
                                        type="email"
                                        className={cn(
                                            "input-dark pl-12 text-sm font-normal",
                                            fieldErrors.email && "border border-red-500/50 focus:ring-red-500/40"
                                        )}
                                        placeholder={t('emailPlaceholder') || '请输入邮箱'}
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                {fieldErrors.email && <p className="text-red-400 text-xs mt-1">必填项未填写</p>}
                            </div>

                            {/* Password */}
                            <div className="relative">
                                <label className="label-gold label-required ml-1">
                                    {t('passwordLabel') || '设置密码'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-[#d4af37]/60" />
                                    </div>
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        className={cn(
                                            "input-dark pl-12 pr-12 text-sm font-normal",
                                            (fieldErrors.password || passwordMismatch) && "border border-red-500/50 focus:ring-red-500/40"
                                        )}
                                        placeholder={t('passwordPlaceholder') || '请输入密码'}
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-[#d4af37] transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {fieldErrors.password && !passwordMismatch && (
                                    <p className="text-red-400 text-xs mt-1">必填项未填写</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="relative">
                                <label className="label-gold label-required ml-1">
                                    {t('confirmPasswordLabel') || '确认密码'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <ShieldCheck size={18} className="text-[#d4af37]/60" />
                                    </div>
                                    <input
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        className={cn(
                                            "input-dark pl-12 pr-12 text-sm font-normal",
                                            (fieldErrors.confirmPassword || passwordMismatch) && "border border-red-500/50 focus:ring-red-500/40"
                                        )}
                                        placeholder={t('confirmPasswordPlaceholder') || '请再次输入密码'}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-[#d4af37] transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {fieldErrors.confirmPassword && !passwordMismatch && (
                                    <p className="text-red-400 text-xs mt-1">必填项未填写</p>
                                )}
                                {passwordMismatch && <p className="text-red-400 text-xs mt-1">两次输入的密码不一致</p>}
                            </div>
                        </div>

                        <div className="pt-2">
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "w-full py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-base uppercase tracking-widest shadow-xl shadow-[#d4af37]/20 flex items-center justify-center gap-2",
                                    loading && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {loading ? t('registering') : t('signUp')}
                            </motion.button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
