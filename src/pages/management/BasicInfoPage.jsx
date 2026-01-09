/**
 * 基础信息页面
 * 功能：录入学员基本信息（姓名、性别、年龄、训练历史），深度背景信息（球龄频率、训练目标、身体局限）
 * 路由：/basic-info
 * 大白话：这是学员注册或编辑资料的页面，分两部分填写：基础信息和详细背景，支持语音输入
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion'; // 动画库
import { Info, Target, Shield, Mic } from 'lucide-react'; // 图标
import PageWrapper from '../../components/PageWrapper'; // 页面容器
import SectionTitle from '../../components/SectionTitle'; // 标题
import { useVoiceInput } from '../../hooks/useVoiceInput'; // 语音输入hook
import { useLanguage } from '../../utils/LanguageContext'; // 多语言

const BasicInfoPage = ({ data, setData, onBack, onNext, isEdit, user, refreshStudents }) => {
    const { t } = useLanguage(); // 翻译函数
    const { isListening, startListening, stopListening } = useVoiceInput(); // 语音输入状态和启动/停止函数
    const [isSaving, setIsSaving] = useState(false);

    // 初始化 manualCheck 对象，确保深度背景字段总是有效
    useEffect(() => {
        if (!data.manualCheck) {
            setData({
                ...data,
                manualCheck: {
                    historyFreq: '',
                    medical: '',
                    purpose: ''
                }
            });
        }
    }, []);

    // 安全地更新 manualCheck 字段的辅助函数
    const updateManualCheck = (key, value) => {
        setData({
            ...data,
            manualCheck: {
                ...(data.manualCheck || {}),
                [key]: value
            }
        });
    };

    // 保存新学员到后端注册接口（注册并关联教练）
    const handleSaveStudent = async () => {
        // If editing profile, delegate to onNext / parent
        if (isEdit) {
            onNext && onNext();
            return;
        }

        // basic front validation
        if (!data.name || data.name.trim() === '') {
            alert(t('nameLabel') + ' ' + '不能为空');
            return;
        }
        if (!data.email || data.email.trim() === '') {
            alert('请填写邮箱（用于创建学员账号）');
            return;
        }

        setIsSaving(true);
        try {
            // 从 user 对象中获取教练 ID
            const coachId = user?.id || user?.coachId;

            const payload = {
                coach_id: coachId, // 添加教练 ID 字段
                name: data.name,
                email: data.email,
                username: data.username || undefined,
                // map UI gender string to backend int (1 = male, 0 = female)
                // Accept values: 'male'/'female', '男'/'女', or localized labels
                gender: (() => {
                    const g = data.gender;
                    if (g === undefined || g === null) return undefined;
                    const gs = String(g).toLowerCase();
                    // robust matching: Chinese characters or English words
                    if (gs.includes('男') || gs.includes('male')) return 1;
                    if (gs.includes('女') || gs.includes('female')) return 0;
                    return undefined;
                })(),
                age: data.age ? (Number.isFinite(Number(data.age)) ? Number(data.age) : undefined) : undefined,
                years_of_golf: data.yearsOfGolf ? (Number.isFinite(Number(data.yearsOfGolf)) ? Number(data.yearsOfGolf) : undefined) : undefined,
                history: data.manualCheck?.historyFreq || data.history || undefined,
                height: data.physical?.height ? Number(data.physical.height) : undefined,
                weight: data.physical?.weight ? Number(data.physical.weight) : undefined,
                body_fat: data.physical?.bodyFat || undefined,
                medical_history: data.manualCheck?.medical || undefined,
                purpose: data.manualCheck?.purpose || undefined,
                introduction: data.introduction || undefined,
                why_goal: data.whyGoal || undefined,
                goal_benefits: data.goalBenefits || undefined,
                training_risks: data.trainingRisks || undefined,
            };

            // debug - log payload before sending


            const token = user?.token || (() => {
                try {
                    const saved = localStorage.getItem('user');
                    if (!saved) return null;
                    const parsed = JSON.parse(saved);
                    return parsed?.token || null;
                } catch (e) {
                    return null;
                }
            })();

            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // 使用代理路径，自动带入 Token 并避免跨域问题
            const res = await fetch('/api/students', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });

            // debug - log status


            if (res.status === 401) {
                // reset saving state, inform user and return
                setIsSaving(false);
                alert('未授权：请先登录或重新登录');
                return;
            }

            // parse response JSON once and reuse
            const result = await res.json().catch(() => ({}));

            // debug - log body


            if (!res.ok) {

                setIsSaving(false);
                alert('保存学员失败：' + (result.error || res.statusText || res.status));
                return;
            }

            // success
            alert('学员已保存！');

            // 刷新学员列表，确保新学员立刻出现在列表中
            if (typeof refreshStudents === 'function') {
                try {
                    await refreshStudents();
                } catch (e) {
                    // ignore refresh errors
                }
            }

            // 如果返回了学员ID，跳转到该学员的主页，否则跳转到列表页
            if (result.student_user_id) {
                onNext && onNext(`/student/${result.student_user_id}`);
            } else {
                onNext && onNext();
            }
        } catch (e) {

            setIsSaving(false);
            alert('保存学员出错，请检查控制台');
        }
    };

    return (
        <PageWrapper
            title={isEdit ? t('editProfile') : t('studentRegistration')}
            onBack={onBack}
            footer={
                <motion.button
                    onClick={handleSaveStudent}
                    className="w-full h-[50px] sm:h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-base sm:text-lg shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 sm:gap-3 group px-4"
                    whileTap={{ scale: 0.95 }}
                    disabled={isSaving}
                >
                    <span className="text-lg font-bold tracking-widest">{isEdit ? t('saveChanges') : t('createStudent')}</span>
                </motion.button>
            }
        >
            <SectionTitle>{t('basicProfile')}</SectionTitle>
            <div className="surface-strong p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] border border-white/5 space-y-4 sm:space-y-6 mb-8 sm:mb-12 shadow-2xl shadow-black/50 relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-32 h-32 sm:w-40 sm:h-40 bg-[#d4af37]/5 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <label className="label-gold">{t('nameLabel')}</label>
                    <div className="relative">
                        <input
                            className="input-dark text-sm font-normal tracking-tight pr-12 sm:pr-14 h-[48px] sm:h-[52px]"
                            placeholder={t('namePlaceholder')}
                            value={data.name}
                            onChange={e => setData({ ...data, name: e.target.value })}
                        />
                        <button
                            onClick={() => {
                                if (isListening) {
                                    stopListening();
                                } else {
                                    startListening((text) => setData({ ...data, name: text }));
                                }
                            }}
                            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 hover:surface rounded-lg sm:rounded-xl transition-colors group"
                        >
                            <Mic size={16} className={`sm:w-[18px] sm:h-[18px] ${isListening ? "text-[#d4af37] animate-pulse" : "text-[#d4af37]/60 group-hover:text-[#d4af37] transition-colors"}`} />
                        </button>
                    </div>
                </div>

                {/* Email field - required by /register_zl endpoint */}
                <div className="relative z-10">
                    <label className="label-gold">邮箱</label>
                    <div className="relative">
                        <input
                            className="input-dark text-sm font-normal tracking-tight pr-14 h-[52px]"
                            placeholder="example@domain.com"
                            value={data.email || ''}
                            onChange={e => setData({ ...data, email: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div>
                        <label className="label-gold">{t('genderLabel')}</label>
                        <div className="flex p-1 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 relative h-[48px] sm:h-[52px]">
                            {data.gender && (
                                <motion.div
                                    className="absolute top-1 bottom-1 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                                    initial={false}
                                    animate={{
                                        left: (data.gender === t('female') || data.gender === '女' || data.gender === 'female') ? '50%' : '4px',
                                        right: (data.gender === t('female') || data.gender === '女' || data.gender === 'female') ? '4px' : '50%',
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => setData({ ...data, gender: 'male' })}
                                className={`flex-1 relative z-10 text-[11px] sm:text-xs font-black tracking-widest transition-colors duration-500 ${(data.gender === t('male') || data.gender === '男' || data.gender === 'male') ? 'text-black' : 'text-white/40'}`}
                            >
                                {t('male')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setData({ ...data, gender: 'female' })}
                                className={`flex-1 relative z-10 text-[11px] sm:text-xs font-black tracking-widest transition-colors duration-500 ${(data.gender === t('female') || data.gender === '女' || data.gender === 'female') ? 'text-black' : 'text-white/40'}`}
                            >
                                {t('female')}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="label-gold">{t('ageLabel')}</label>
                        <input
                            type="number"
                            className="input-dark text-sm font-normal h-[48px] sm:h-[52px]"
                            placeholder={t('agePlaceholder')}
                            value={data.age}
                            onChange={e => setData({ ...data, age: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 relative z-10">
                    <div>
                        <label className="label-gold">{t('yearsOfGolf')}</label>
                        <input
                            type="number"
                            className="input-dark text-sm font-normal h-[48px] sm:h-[52px]"
                            placeholder={t('yearsOfGolfPlaceholder')}
                            value={data.yearsOfGolf}
                            onChange={e => setData({ ...data, yearsOfGolf: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div>
                            <label className="label-gold">{t('height')}</label>
                            <input
                                type="number"
                                className="input-dark text-sm font-normal h-[48px] sm:h-[52px]"
                                placeholder="cm"
                                value={data.physical?.height || ''}
                                onChange={e => setData({ ...data, physical: { ...data.physical, height: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="label-gold">{t('weight')}</label>
                            <input
                                type="number"
                                className="input-dark text-sm font-normal h-[48px] sm:h-[52px]"
                                placeholder="kg"
                                value={data.physical?.weight || ''}
                                onChange={e => setData({ ...data, physical: { ...data.physical, weight: e.target.value } })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <SectionTitle>{t('deepBackground')}</SectionTitle>
            <div className="space-y-4 sm:space-y-6">
                <div className="surface-strong p-4 sm:p-6 rounded-2xl sm:rounded-[32px] border border-white/5 relative overflow-hidden group shadow-2xl shadow-black/50 focus-within:border-[#d4af37]/50 focus-within:shadow-[#d4af37]/20 transition-all duration-500">
                    <div className="absolute top-[-20%] right-[-10%] w-24 h-24 sm:w-32 sm:h-32 bg-[#d4af37]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-700" />
                    <label className="text-xs sm:text-sm font-bold text-[#d4af37] mb-1 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                        <Info size={12} className="sm:w-[14px] sm:h-[14px] text-[#d4af37] shrink-0" />
                        {t('golfHistory')}
                    </label>
                    <div className="relative mt-2">
                        <textarea
                            className="textarea-dark h-20 sm:h-24 text-xs sm:text-sm font-normal leading-relaxed pr-10 sm:pr-12"
                            placeholder={t('golfHistoryPlaceholder')}
                            value={data.manualCheck?.historyFreq || ""}
                            onChange={e => updateManualCheck('historyFreq', e.target.value)}
                        />
                        <button
                            onClick={() => {
                                if (isListening) {
                                    stopListening();
                                } else {
                                    startListening((text) => updateManualCheck('historyFreq', (data.manualCheck?.historyFreq || "") + text));
                                }
                            }}
                            className="absolute right-0 top-0 p-1.5 sm:p-2 hover:surface rounded-lg sm:rounded-xl transition-colors group"
                        >
                            <Mic size={16} className={`sm:w-[18px] sm:h-[18px] ${isListening ? "text-[#d4af37] animate-pulse" : "text-[#d4af37]/60 group-hover:text-[#d4af37] transition-colors"}`} />
                        </button>
                    </div>
                </div>

                <div className="surface-strong p-4 sm:p-6 rounded-2xl sm:rounded-[32px] border border-white/5 relative overflow-hidden group shadow-2xl shadow-black/50 focus-within:border-[#d4af37]/50 focus-within:shadow-[#d4af37]/20 transition-all duration-500">
                    <div className="absolute top-[-20%] right-[-10%] w-24 h-24 sm:w-32 sm:h-32 bg-[#d4af37]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-700" />
                    <label className="text-xs sm:text-sm font-bold text-[#d4af37] mb-1 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                        <Shield size={12} className="sm:w-[14px] sm:h-[14px] text-[#d4af37] shrink-0" />
                        {t('injuryHistory')}
                    </label>
                    <div className="relative mt-2">
                        <textarea
                            className="textarea-dark h-20 sm:h-24 text-xs sm:text-sm font-normal leading-relaxed pr-10 sm:pr-12"
                            placeholder={t('injuryHistoryPlaceholder')}
                            value={data.manualCheck?.medical || ""}
                            onChange={e => updateManualCheck('medical', e.target.value)}
                        />
                        <button
                            onClick={() => {
                                if (isListening) {
                                    stopListening();
                                } else {
                                    startListening((text) => updateManualCheck('medical', text));
                                }
                            }}
                            className="absolute right-0 top-0 p-1.5 sm:p-2 hover:surface rounded-lg sm:rounded-xl transition-colors group"
                        >
                            <Mic size={16} className={`sm:w-[18px] sm:h-[18px] ${isListening ? "text-[#d4af37] animate-pulse" : "text-[#d4af37]/60 group-hover:text-[#d4af37] transition-colors"}`} />
                        </button>
                    </div>
                </div>

                <div className="surface-strong p-4 sm:p-6 rounded-2xl sm:rounded-[32px] border border-white/5 relative overflow-hidden group shadow-2xl shadow-black/50 focus-within:border-[#d4af37]/50 focus-within:shadow-[#d4af37]/20 transition-all duration-500">
                    <div className="absolute top-[-20%] right-[-10%] w-24 h-24 sm:w-32 sm:h-32 bg-[#d4af37]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-700" />
                    <label className="text-xs sm:text-sm font-bold text-[#d4af37] mb-1 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                        <Target size={12} className="sm:w-[14px] sm:h-[14px] text-[#d4af37] shrink-0" />
                        {t('personalTrainingGoals')}
                    </label>
                    <div className="relative mt-2">
                        <textarea
                            className="textarea-dark h-20 sm:h-24 text-xs sm:text-sm font-normal leading-relaxed pr-10 sm:pr-12"
                            placeholder={t('personalTrainingGoalsPlaceholder')}
                            value={data.manualCheck?.purpose || ""}
                            onChange={e => updateManualCheck('purpose', e.target.value)}
                        />
                        <button
                            onClick={() => {
                                if (isListening) {
                                    stopListening();
                                } else {
                                    startListening((text) => updateManualCheck('purpose', text));
                                }
                            }}
                            className="absolute right-0 top-0 p-1.5 sm:p-2 hover:surface rounded-lg sm:rounded-xl transition-colors group"
                        >
                            <Mic size={16} className={`sm:w-[18px] sm:h-[18px] ${isListening ? "text-[#d4af37] animate-pulse" : "text-[#d4af37]/60 group-hover:text-[#d4af37] transition-colors"}`} />
                        </button>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default BasicInfoPage;
