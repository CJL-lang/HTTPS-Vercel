import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import translations from './i18n';
import { getUiLanguage, normalizeUiLanguage, setUiLanguage } from './language';

const LanguageContext = createContext();

export const LanguageProvider = ({ children, initialLanguage }) => {
    const [language, setLanguage] = useState(() => {
        const stored = getUiLanguage('zh');
        return normalizeUiLanguage(initialLanguage ?? stored, 'zh');
    });

    // Keep <html lang="..."> in sync so CSS :lang() can pick correct fonts.
    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    }, [language]);

    // Persist language for API + refresh consistency.
    useEffect(() => {
        setUiLanguage(language);
    }, [language]);

    const setLanguageSafe = useMemo(() => {
        return (nextLanguage) => setLanguage(normalizeUiLanguage(nextLanguage, 'zh'));
    }, []);

    const t = (key) => {
        return translations[language]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: setLanguageSafe, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

