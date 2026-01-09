/**
 * MentalDiagnosis - 心理测评诊断组件
 * 功能：用于填写心理测评的诊断分析，支持多个诊断项，每个诊断项包含标题和内容
 * 特性：
 *   - 支持预设标题选择（专注能力、心理韧性、自信与动机）或自定义标题
 *   - 支持动态添加/删除诊断项
 *   - 支持语音输入和文本编辑
 *   - 卡片式布局，支持悬停效果
 * 使用场景：新增测评记录页面的心理测评-诊断步骤
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, Plus, X, ChevronDown } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useLanguage } from '../../utils/LanguageContext';
import { cn } from '../../utils/cn';

const presetTitles = [
    "专注能力",
    "心理韧性",
    "自信与动机"
];

// 中文标题 -> 翻译键映射
const titleToTranslationKey = {
    "专注能力": "focusAbility",
    "心理韧性": "mentalResilience",
    "自信与动机": "confidenceAndMotivation",
};

const MentalDiagnosisItem = React.forwardRef(({ item, updateItem, removeItem, showTitleSelector, setShowTitleSelector, setListeningId, listeningId, startListening, mentalData }, ref) => {
    const { t } = useLanguage();
    const [displayTitle, setDisplayTitle] = useState(item.title);
    const inputRef = useRef(null);

    // 获取标题的翻译显示文本
    const getTitleDisplay = (title) => {
        if (!title) return '';
        if (titleToTranslationKey[title]) {
            return t(titleToTranslationKey[title]);
        }
        return title; // 自定义标题直接返回
    };

    // 根据标题获取对应的分数
    const getScoreByTitle = (title) => {
        if (!title || !mentalData) return null;
        const scoreMap = {
            "专注能力": mentalData.focus,
            "心理韧性": mentalData.stability,
            "自信与动机": mentalData.confidence
        };
        return scoreMap[title] || null;
    };

    // 当外部 title 改变时（比如从下拉菜单选择），同步显示状态和输入框的值
    useEffect(() => {
        setDisplayTitle(item.title);
    }, [item.title, item.isCustom]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                opacity: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
            }}
            className={cn(
                "will-change-transform-opacity diagnosis-card group",
                showTitleSelector === item.id && "selector-open"
            )}
        >

            <div className="diagnosis-card-header">
                <div className="relative-container">
                    <div className="title-container-col">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowTitleSelector(showTitleSelector === item.id ? null : item.id);
                                }}
                                className="title-selector-btn"
                            >
                                <Sparkles size={12} className="icon-sparkles" />
                                <span className="truncate">{item.isCustom ? (displayTitle || t('enterTitle')) : (getTitleDisplay(item.title) || t('selectDiagnosisDimension'))}</span>
                                <ChevronDown size={12} className={cn("transition-transform shrink-0", showTitleSelector === item.id && "rotate-180")} />
                            </button>

                            {/* 分数展示 - 只在非自定义标题且有数据时显示 */}
                            {!item.isCustom && presetTitles.includes(item.title) && getScoreByTitle(item.title) && (
                                <button
                                    type="button"
                                    className="title-selector-btn"
                                    disabled
                                >
                                    <span className="truncate">{getScoreByTitle(item.title)} 分</span>
                                </button>
                            )}
                        </div>

                        {item.isCustom && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="custom-title-container"
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={displayTitle}
                                    onChange={(e) => setDisplayTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const finalValue = e.target.value.trim();
                                        if (finalValue) {
                                            updateItem(item.id, { title: finalValue, isCustom: false });
                                        } else {
                                            updateItem(item.id, { title: presetTitles[0], isCustom: false });
                                        }
                                    }}
                                    placeholder={t('enterTitle')}
                                    className="custom-title-input"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateItem(item.id, { isCustom: false, title: presetTitles[0] });
                                    }}
                                    className="custom-title-cancel-btn"
                                >
                                    <X size={14} />
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Title Selector Dropdown */}
                    <AnimatePresence>
                        {showTitleSelector === item.id && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                onWheel={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                className="title-selector-dropdown"
                            >
                                <div
                                    className="dropdown-scroll-container"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                >
                                    {presetTitles.map((title) => (
                                        <button
                                            key={title}
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateItem(item.id, { title: title, isCustom: false });
                                                setShowTitleSelector(null);
                                            }}
                                            className="title-selector-option"
                                        >
                                            {getTitleDisplay(title)}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateItem(item.id, { isCustom: true, title: '' });
                                            setShowTitleSelector(null);
                                        }}
                                        className="title-selector-custom"
                                    >
                                        {t('customTitle')}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="goal-actions">
                    <button
                        type="button"
                        onClick={() => {
                            setListeningId(item.id);
                            startListening((text) => {
                                updateItem(item.id, { content: item.content + text });
                                setListeningId(null);
                            });
                        }}
                        className={cn(
                            "voice-btn",
                            listeningId === item.id ? "active" : "inactive"
                        )}
                    >
                        <Mic size={14} className="icon-sm" />
                    </button>
                    {item.id !== 'initial' && (
                        <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="delete-btn"
                        >
                            <X size={14} className="icon-sm" />
                        </button>
                    )}
                </div>
            </div>

            <textarea
                value={item.content}
                onChange={(e) => updateItem(item.id, { content: e.target.value })}
                placeholder={t('enterMentalDiagnosisContent')}
                className={cn(
                    "textarea-standard-transition",
                    showTitleSelector === item.id ? "opacity-20 pointer-events-none" : "opacity-100"
                )}
            />
        </motion.div>
    );
});

const MentalDiagnosis = ({ data, update }) => {
    const { t } = useLanguage();
    const { startListening } = useVoiceInput();
    const [listeningId, setListeningId] = useState(null);
    const [showTitleSelector, setShowTitleSelector] = useState(null);

    // 点击外部关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = () => {
            if (showTitleSelector) setShowTitleSelector(null);
        };
        if (showTitleSelector) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [showTitleSelector]);

    // 初始化数据结构，如果不存在
    useEffect(() => {
        if (data.mentalDiagnosis === null) return;

        if (data.mentalDiagnosis.length === 0) {
            const newItem = {
                id: crypto?.randomUUID?.() || Date.now().toString(),
                title: presetTitles[0],
                content: '',
                isCustom: false
            };
            update('mentalDiagnosis', [newItem]);
        }
    }, [data.mentalDiagnosis, update]);

    const diagnosisItems = data.mentalDiagnosis || [];

    const addItem = () => {
        // 找到下一个未被使用的标题
        const usedTitles = new Set(diagnosisItems.map(item => item.title).filter(title => presetTitles.includes(title)));
        const nextTitle = presetTitles.find(title => !usedTitles.has(title)) || presetTitles[0];

        const newItem = {
            id: crypto?.randomUUID?.() || Date.now().toString(),
            title: nextTitle,
            content: '',
            isCustom: false
        };
        const newItems = [...diagnosisItems, newItem];
        update('mentalDiagnosis', newItems);
        setShowTitleSelector(null);
    };

    const removeItem = (id) => {
        const newItems = diagnosisItems.filter(item => item.id !== id);
        update('mentalDiagnosis', newItems);
    };

    const updateItem = (id, updates) => {
        const newItems = diagnosisItems.map(item =>
            item.id === id ? { ...item, ...updates } : item
        );
        update('mentalDiagnosis', newItems);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-title-group">
                    <h2 className="title-main">{t('mentalDiagnosis')}</h2>
                    <p className="title-subtitle">{t('mentalDiagnosisSubtitle')}</p>
                </div>
            </div>

            <div className="space-y-6 px-2">
                <AnimatePresence mode="popLayout">
                    {diagnosisItems.map((item) => (
                        <MentalDiagnosisItem
                            key={item.id}
                            item={item}
                            updateItem={updateItem}
                            removeItem={removeItem}
                            showTitleSelector={showTitleSelector}
                            setShowTitleSelector={setShowTitleSelector}
                            setListeningId={setListeningId}
                            listeningId={listeningId}
                            startListening={startListening}
                            mentalData={data.mentalData}
                        />
                    ))}
                </AnimatePresence>

                {/* Add Button at the bottom */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.1 }}
                    onClick={addItem}
                    className="add-button-dashed group touch-action-manipulation"
                >
                    <div className="add-button-icon">
                        <Plus size={20} />
                    </div>
                    <span className="add-button-text">{t('addDiagnosisItem')}</span>
                </motion.button>
            </div>
        </div>
    );
};

export default MentalDiagnosis;
