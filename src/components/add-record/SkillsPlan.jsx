/**
 * SkillsPlan - 技能测评计划组件
 * 功能：用于制定技能训练计划，包括多个训练要点和额外说明
 * 特性：
 *   - 支持多个训练要点输入
 *   - 支持额外说明（可选）
 *   - 支持语音输入和文本编辑
 * 使用场景：新增测评记录页面的技能测评-计划步骤
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clipboard, Mic, Sparkles } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';

const SkillsPlan = ({ data, update }) => {
    const { t } = useLanguage();
    const { isListening, startListening } = useVoiceInput();
    const [listeningField, setListeningField] = useState(null);

    useEffect(() => {
        if (!isListening) {
            setListeningField(null);
        }
    }, [isListening]);

    const updateField = (key, val) => {
        update(`planData.${key}`, val);
    };

    const planPoints = [
        { key: 'point1', label: t('labelPoint1'), placeholder: t('placeholderPoint1') },
        { key: 'point2', label: t('labelPoint2'), placeholder: t('placeholderPoint2') },
        { key: 'extra', label: t('labelExtra'), placeholder: t('placeholderExtra'), isExtra: true }
    ];

    return (
        <div className="page-container px-2">
            <div className="page-title-group">
                <h2 className="title-main">{t('planTitle')}</h2>
                <p className="title-subtitle">{t('planSubtitle')}</p>
            </div>

            <motion.div
                className="plan-guide-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-start gap-3 sm:gap-4">
                    <div className="plan-guide-icon">
                        <Clipboard size={20} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="plan-guide-title">{t('planGuideTitle')}</h4>
                        <p className="plan-guide-desc">{t('planGuideDesc')}</p>
                    </div>
                </div>
            </motion.div>

            <div className="space-y-6 sm:space-y-8">
                {planPoints.map((point) => (
                    <div key={point.key} className="diagnosis-card group">
                        <div className="diagnosis-card-header">
                            <label className="title-selector-btn">
                                <Sparkles size={12} className="icon-sparkles" />
                                <span className="truncate">{point.label}</span>
                            </label>
                            <button
                                onClick={() => {
                                    setListeningField(point.key);
                                    startListening((text) => {
                                        const current = data.planData?.[point.key] || "";
                                        updateField(point.key, current + text);
                                        setListeningField(null);
                                    });
                                }}
                                className={cn(
                                    "voice-btn",
                                    (isListening && listeningField === point.key) ? "active active-gold" : "inactive"
                                )}
                            >
                                <Mic size={14} className={(isListening && listeningField === point.key) ? "animate-pulse" : ""} />
                            </button>
                        </div>
                        <textarea
                            className="textarea-standard"
                            placeholder={point.placeholder}
                            value={data.planData?.[point.key] || ""}
                            onChange={e => updateField(point.key, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SkillsPlan;
