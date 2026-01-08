import React, { createContext, useContext, useEffect, useState } from 'react';
import translations from './i18n';

const LanguageContext = createContext();

export const LanguageProvider = ({ children, initialLanguage = 'zh' }) => {
    const [language, setLanguage] = useState(initialLanguage);

    // Keep <html lang="..."> in sync so CSS :lang() can pick correct fonts.
    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    }, [language]);

    const t = (key) => {
        return translations[language]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
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

