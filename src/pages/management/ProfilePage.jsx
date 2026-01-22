/**
 * 个人中心页面
 * 功能：显示用户个人信息、统计数据、功能入口（设置、学员管理、帮助、退出登录等）
 * 路由：/profile
 */
import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, User, Settings, Shield, Bell, CreditCard, Users, HelpCircle, Camera } from 'lucide-react';
import PageWrapper from '../../components/PageWrapper';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';
import AvatarSelector from '../../components/AvatarSelector';

const ProfilePage = ({ user, onLogout, navigate }) => {
    const { t } = useLanguage();
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || null); // 头像URL或base64
    const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
    const avatarObjectUrlRef = useRef(null);

    const getAuthToken = () => {
        if (user?.token) return user.token;
        try {
            const saved = localStorage.getItem('user');
            const parsed = saved ? JSON.parse(saved) : null;
            return parsed?.token || null;
        } catch (e) {
            return null;
        }
    };

    const normalizeAvatarSource = (url) => {
        if (!url) return null;
        if (url.startsWith('data:')) {
            return { type: 'direct', url };
        }
        if (url.startsWith('http')) {
            try {
                const parsed = new URL(url);
                if (parsed.pathname.startsWith('/uploads/') || parsed.pathname.startsWith('/avatars/')) {
                    return { type: 'api', path: parsed.pathname };
                }
                return { type: 'direct', url };
            } catch (e) {
                return { type: 'direct', url };
            }
        }
        if (url.startsWith('/uploads/') || url.startsWith('/avatars/')) {
            return { type: 'api', path: url };
        }
        return { type: 'direct', url };
    };

    const setAvatarFromBlob = (blob) => {
        if (avatarObjectUrlRef.current) {
            URL.revokeObjectURL(avatarObjectUrlRef.current);
        }
        const objectUrl = URL.createObjectURL(blob);
        avatarObjectUrlRef.current = objectUrl;
        setAvatarUrl(objectUrl);
    };

    const fetchAvatarBlob = async (path) => {
        const headers = {
            'ngrok-skip-browser-warning': 'true'
        };
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`/api${path}`, { headers });
        if (!response.ok) {
            throw new Error(`获取头像失败: ${response.status}`);
        }
        const blob = await response.blob();
        setAvatarFromBlob(blob);
    };

    const applyAvatarSource = async (url) => {
        const normalized = normalizeAvatarSource(url);
        if (!normalized) return;
        if (normalized.type === 'api') {
            await fetchAvatarBlob(normalized.path);
            return;
        }
        setAvatarUrl(normalized.url);
    };

    const dataUrlToFile = async (dataUrl, filename = 'avatar.jpg') => {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const type = blob.type || 'image/jpeg';
        return new File([blob], filename, { type });
    };

    // 处理头像点击
    const handleAvatarClick = () => {
        setIsAvatarSelectorOpen(true);
    };

    // 处理头像确认
    const handleAvatarConfirm = async (croppedImage) => {
        console.log('收到裁剪后的头像:', croppedImage ? '有数据' : '无数据');
        if (!croppedImage) {
            console.error('裁剪后的图片为空');
            return;
        }

        try {
            const file = await dataUrlToFile(croppedImage);
            const formData = new FormData();
            formData.append('avatar', file);

            const headers = {
                'ngrok-skip-browser-warning': 'true'
            };
            const token = getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/users/avatar', {
                method: 'POST',
                headers,
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(`上传头像失败: ${response.status} ${errorText}`);
            }

            const result = await response.json().catch(() => ({}));
            if (result.avatar_url) {
                await applyAvatarSource(result.avatar_url);
            } else {
                setAvatarUrl(croppedImage);
            }
        } catch (error) {
            console.error('上传头像失败:', error);
            setAvatarUrl(croppedImage);
        }
    };

    useEffect(() => {
        const fetchAvatar = async () => {
            if (!user?.id) return;
            try {
                const headers = {
                    'ngrok-skip-browser-warning': 'true'
                };
                const token = getAuthToken();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
                const response = await fetch(`/api/user-avatars/${user.id}`, { headers });
                if (!response.ok) return;
                const result = await response.json().catch(() => ({}));
                if (result.avatar_url) {
                    await applyAvatarSource(result.avatar_url);
                }
            } catch (error) {
                console.error('获取头像失败:', error);
            }
        };

        fetchAvatar();
    }, [user?.id]);

    useEffect(() => {
        return () => {
            if (avatarObjectUrlRef.current) {
                URL.revokeObjectURL(avatarObjectUrlRef.current);
                avatarObjectUrlRef.current = null;
            }
        };
    }, []);

    const menuGroups = [
        {
            title: t('coreFunctions'),
            items: [
                { icon: Bell, label: t('messageCenter'), count: 3, color: "text-blue-400" },
                { icon: CreditCard, label: t('mySubscription'), color: "text-purple-400" },
                { icon: Users, label: t('teamCollab'), color: "text-orange-400" },
            ]
        },
        {
            title: t('systemManagement'),
            items: [
                { icon: Settings, label: t('settings'), action: () => navigate('settings') },
                { icon: Shield, label: t('securityCenter') },
                { icon: HelpCircle, label: t('helpFeedback') },
            ]
        }
    ];

    return (
        <PageWrapper title={t('profileTitle')}>
            <div className="space-y-6 sm:space-y-10 pb-20">
                {/* Profile Card */}
                <div className="surface-strong p-5 sm:p-8 border border-white/5 rounded-[32px] relative overflow-hidden group shadow-2xl shadow-black/50">
                    <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-[#d4af37]/10 rounded-full blur-3xl animate-pulse-slow" />
                    <div className="relative z-10 flex items-center gap-4 sm:gap-6 py-2 sm:py-4">
                        <div className="relative">
                            <button
                                onClick={handleAvatarClick}
                                className="relative group/avatar cursor-pointer"
                            >
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] p-[2px] shadow-2xl shadow-yellow-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                        {avatarUrl ? (
                                            <img
                                                src={avatarUrl}
                                                alt="Avatar"
                                                className="w-full h-full object-cover rounded-full"
                                            />
                                        ) : (
                                            <User size={40} className="text-[#d4af37] sm:w-[48px] sm:h-[48px]" />
                                        )}
                                    </div>
                                </div>
                                {/* 更换头像提示图标 */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300">
                                    <Camera size={20} className="text-[#d4af37] sm:w-[24px] sm:h-[24px]" />
                                </div>
                            </button>
                            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 border-[3px] sm:border-4 border-black rounded-full shadow-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1 sm:mb-2">
                                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tighter uppercase truncate">{user.username}</h2>
                            </div>
                            <p className="text-[#d4af37] text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] truncate opacity-60">ID: GC-8829310</p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-10">
                        {[
                            { label: t('studentsTaught'), value: "128", color: "text-white" },
                            { label: t('plansGenerated'), value: "456", color: "text-white" },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className="surface-weak rounded-[28px] sm:rounded-[32px] py-5 sm:py-8 px-3 sm:px-4 text-center flex flex-col items-center justify-center border border-white/5 relative"
                            >
                                <div className="flex items-center gap-1 mb-1 sm:mb-2">
                                    <span className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</span>
                                    {stat.unit && (
                                        <div className="flex flex-col items-start leading-[0.8] opacity-40">
                                            <span className="text-[11px] font-bold uppercase">{stat.unit.substring(0, 1)}</span>
                                            <span className="text-[11px] font-bold uppercase">{stat.unit.substring(1, 2)}</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[11px] sm:text-[12px] text-white/40 font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em]">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Menu Groups */}
                {menuGroups.map((group, idx) => (
                    <div key={idx} className="space-y-3 sm:space-y-4">
                        <div className="mb-4 sm:mb-8 flex flex-col gap-1">
                            <h2 className="text-[16px] sm:text-[20px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#d4af37]">
                                {group.title}
                            </h2>
                            <div className="h-[2px] w-12 sm:w-20 bg-gradient-to-r from-[#d4af37] to-transparent"></div>
                        </div>
                        <div className="surface-strong p-0 overflow-hidden divide-y divide-white/5 border border-white/5 rounded-[24px] sm:rounded-[32px]">
                            {group.items.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={item.action}
                                    className="w-full px-5 sm:px-8 py-4 sm:py-6 flex items-center justify-between hover:bg-white/[0.03] active:scale-98 transition-all group"
                                >
                                    <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                                        <div className={cn("p-2 sm:p-3 rounded-xl sm:rounded-2xl surface border border-white/5 group-hover:border-[#d4af37]/30 transition-colors shrink-0", item.color)}>
                                            <item.icon size={18} className="sm:w-[20px] sm:h-[20px]" />
                                        </div>
                                        <span className="text-sm sm:text-base font-bold text-white uppercase tracking-widest truncate">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                        {item.count && (
                                            <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b] text-black text-[11px] sm:text-[12px] font-bold shadow-xl shadow-yellow-500/20">
                                                {item.count}
                                            </span>
                                        )}
                                        <ChevronRight size={16} className="text-white/20 group-hover:text-[#d4af37] transition-colors sm:w-[18px] sm:h-[18px]" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Logout Button */}
                <button
                    onClick={onLogout}
                    className="w-full py-4 sm:py-6 rounded-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-lg uppercase tracking-[0.2em] sm:tracking-[0.3em] flex items-center justify-center gap-2 sm:gap-3 hover:from-red-700 hover:to-red-600 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition-all active:scale-[0.98]"
                >
                    {t('logout')}
                </button>
            </div>

            {/* Avatar Selector Modal */}
            <AvatarSelector
                isOpen={isAvatarSelectorOpen}
                onClose={() => setIsAvatarSelectorOpen(false)}
                onConfirm={handleAvatarConfirm}
            />
        </PageWrapper>
    );
};

export default ProfilePage;

