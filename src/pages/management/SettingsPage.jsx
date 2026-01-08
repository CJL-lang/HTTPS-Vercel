/**
 * 设置页面
 * 功能：系统设置，包括语言切换（中文/英文）
 * 路由：/settings
 */
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import PageWrapper from '../../components/PageWrapper';
import { useLanguage } from '../../utils/LanguageContext';

const SettingsPage = ({ onBack }) => {
    const { language, setLanguage, t } = useLanguage();

    return (
        <PageWrapper title={t('settings')} onBack={onBack}>
            <div className="space-y-8">
                <div className="space-y-4">
                    <p className="text-[11px] text-[#d4af37] font-bold uppercase tracking-[0.3em] ml-2 mb-2">{t('systemPrefs')}</p>
                    <div className="surface-strong p-0 overflow-hidden border border-white/5 rounded-[32px]">
                        <div className="px-4 sm:px-6 py-6 sm:py-8 flex items-center justify-between">
                            <div>
                                <p className="text-[#d4af37] text-xs sm:text-sm font-bold uppercase tracking-widest mb-1">{t('language')}</p>
                                <p className="text-white text-xs sm:text-sm font-bold">{language === 'zh' ? t('chinese') : t('english')}</p>
                            </div>
                            <div className="relative overflow-hidden">
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="appearance-none surface-strong border border-[#d4af37]/50 rounded-xl px-4 sm:px-6 py-2 pr-8 sm:pr-10 text-white text-xs sm:text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[#d4af37] transition-all cursor-pointer"
                                >
                                    <option value="zh">{t('chinese')}</option>
                                    <option value="en">{t('english')}</option>
                                </select>
                                <ChevronDown size={14} className="sm:w-4 sm:h-4 absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[#d4af37] pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default SettingsPage;
