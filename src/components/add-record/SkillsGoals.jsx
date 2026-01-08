/**
 * SkillsGoals - 技能测评目标组件
 * 功能：用于设置技能训练的多阶段目标，每个阶段包含目标描述和预期效果
 * 特性：
 *   - 支持多阶段目标设置（第一阶段、第二阶段、第三阶段）
 *   - 每个阶段包含目标描述和预期效果两个字段
 *   - 支持语音输入和文本编辑
 * 使用场景：新增测评记录页面的技能测评-目标步骤
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Mic, Sparkles, Flag } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';

const SkillsGoals = ({ data, update }) => {
    const { t } = useLanguage();
    const { isListening, startListening } = useVoiceInput();
    const [listeningField, setListeningField] = useState(null);

    useEffect(() => {
        if (!isListening) {
            setListeningField(null);
        }
    }, [isListening]);

    const updateField = (key, val) => {
        update(`goalData.${key}`, val);
    };

    const goalStages = [
        {
            key: 'stage1',
            label: t('labelStage1'),
            subtitle: t('subtitleStage1'),
            placeholder: t('placeholderStage1'),
            icon: <Flag size={14} />
        },
        {
            key: 'stage2',
            label: t('labelStage2'),
            subtitle: t('subtitleStage2'),
            placeholder: t('placeholderStage2'),
            icon: <Target size={14} />
        },
        {
            key: 'stage3',
            label: t('labelStage3'),
            subtitle: t('subtitleStage3'),
            placeholder: t('placeholderStage3'),
            icon: <Sparkles size={14} />
        }
    ];

    return (
        <div className="page-container px-2">
            <div className="page-title-group">
                <h2 className="title-main">{t('goalTitle')}</h2>
                <p className="title-subtitle">{t('goalSubtitle')}</p>
            </div>

            <motion.div
                className="goal-strategic-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="goal-strategic-gradient"></div>
                <div className="relative mb-4 sm:mb-6">
                    <div className="goal-strategic-icon-container">
                        <Target size={28} className="text-[#d4af37] -rotate-12" />
                    </div>
                    <motion.div
                        className="goal-strategic-icon-border"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
                <p className="goal-strategic-label">Strategic Planning</p>
                <h3 className="goal-strategic-title">
                    {t('goalStrategic')}
                </h3>
            </motion.div>

            <div className="space-y-6 sm:space-y-8">
                {goalStages.map((stage, index) => (
                    <div key={stage.key} className="goal-card group">
                        <div className="goal-card-header">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="goal-icon-container">
                                    {stage.icon}
                                </div>
                                <div className="min-w-0">
                                    <label className="goal-title">
                                        {stage.label}
                                    </label>
                                    <span className="goal-subtitle">{stage.subtitle}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setListeningField(stage.key);
                                    startListening((text) => {
                                        const current = data.goalData?.[stage.key] || "";
                                        updateField(stage.key, current + text);
                                        setListeningField(null);
                                    });
                                }}
                                className={cn(
                                    "voice-btn",
                                    (isListening && listeningField === stage.key) ? "active active-gold" : "inactive"
                                )}
                            >
                                <Mic size={14} className={(isListening && listeningField === stage.key) ? "animate-pulse" : ""} />
                            </button>
                        </div>
                        <textarea
                            className="textarea-standard"
                            placeholder={stage.placeholder}
                            value={data.goalData?.[stage.key] || ""}
                            onChange={e => updateField(stage.key, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SkillsGoals;
