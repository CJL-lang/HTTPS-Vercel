import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, Plus, X, ChevronDown } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useLanguage } from '../../utils/LanguageContext';
import { cn } from '../../utils/cn';

const presetTitles = [
    "核心改进点",
    "辅助练习建议"
];

// 中文标题 -> 翻译键映射
const titleToTranslationKey = {
    "核心改进点": "coreImprovementPoint",
    "辅助练习建议": "auxiliaryPracticeSuggestion",
};

const SkillsPlanItem = React.forwardRef(({ item, updateItem, removeItem, showTitleSelector, setShowTitleSelector, setListeningId, listeningId, startListening }, ref) => {
    const { t } = useLanguage();
    const [displayTitle, setDisplayTitle] = useState(item.title);
    const inputRef = useRef(null);
    const dropdownInputRef = useRef(null);

    // 获取标题的显示文本
    const getTitleDisplay = (title) => {
        if (!title) return '';
        // 如果是带数字的核心改进点，提取基础部分进行翻译
        if (title.startsWith("核心改进点")) {
            const match = title.match(/^核心改进点(\d+)?$/);
            if (match) {
                const number = match[1] || '';
                const baseTranslation = t('coreImprovementPoint');
                return number ? `${baseTranslation} ${number}` : baseTranslation;
            }
        }
        if (titleToTranslationKey[title]) {
            return t(titleToTranslationKey[title]);
        }
        return title; // 自定义标题直接返回
    };

    // 当外部 title 改变时，同步显示状态
    useEffect(() => {
        // 如果是预设标题，显示翻译后的文本；否则显示原始标题
        if (!item.isCustom) {
            if (item.title.startsWith("核心改进点")) {
                // 核心改进点带数字的情况，提取数字并翻译
                const match = item.title.match(/^核心改进点(\d+)?$/);
                if (match) {
                    const number = match[1] || '';
                    const baseTranslation = t('coreImprovementPoint');
                    setDisplayTitle(number ? `${baseTranslation} ${number}` : baseTranslation);
                } else {
                    setDisplayTitle(item.title);
                }
            } else if (titleToTranslationKey[item.title]) {
                setDisplayTitle(t(titleToTranslationKey[item.title]));
            } else {
                setDisplayTitle(item.title);
            }
        } else {
            setDisplayTitle(item.title);
        }
    }, [item.title, item.isCustom, t]);

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
                            <span className="truncate">{item.isCustom ? (displayTitle || t('enterTitle')) : (getTitleDisplay(item.title) || t('selectPlanType'))}</span>
                            <ChevronDown size={12} className={cn("transition-transform shrink-0", showTitleSelector === item.id && "rotate-180")} />
                        </button>

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
                                    onChange={(e) => {
                                        // 如果开始编辑预设标题，转换为自定义标题
                                        if (!item.isCustom && presetTitles.includes(item.title)) {
                                            updateItem(item.id, { title: item.title, isCustom: true });
                                        }
                                        setDisplayTitle(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const finalValue = e.target.value.trim();
                                        if (finalValue) {
                                            // 检查是否是预设标题的翻译文本
                                            const presetTitle = Object.keys(titleToTranslationKey).find(
                                                key => {
                                                    const translation = t(titleToTranslationKey[key]);
                                                    // 处理核心改进点带数字的情况
                                                    if (key === "核心改进点") {
                                                        return finalValue === translation || finalValue.startsWith(translation + " ");
                                                    }
                                                    return finalValue === translation;
                                                }
                                            );
                                            if (presetTitle) {
                                                // 如果是核心改进点，检查是否有数字
                                                if (presetTitle === "核心改进点" && finalValue.includes(" ")) {
                                                    const match = finalValue.match(/^(.+?)\s*(\d+)$/);
                                                    if (match) {
                                                        const number = match[2];
                                                        updateItem(item.id, { title: `核心改进点${number}`, isCustom: false });
                                                    } else {
                                                        updateItem(item.id, { title: presetTitle, isCustom: false });
                                                    }
                                                } else {
                                                    updateItem(item.id, { title: presetTitle, isCustom: false });
                                                }
                                            } else {
                                                updateItem(item.id, { title: finalValue, isCustom: true });
                                            }
                                        } else {
                                            // 如果没填内容，保持原有标题/状态，避免触发重复标题提示
                                            updateItem(item.id, { title: item.title, isCustom: item.isCustom });
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
                                        updateItem(item.id, { isCustom: false });
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
                                                // 处理核心改进点标题的数字
                                                let finalTitle = title;
                                                if (title === "核心改进点") {
                                                    // 在选择时重新计算当前该类型的序号
                                                    // 这里为了简单，如果用户手动选“核心改进点”，动态计算序号
                                                    // 注意：这取决于父组件addItem的逻辑一致性
                                                    finalTitle = title; // 会被 addItem 的逻辑覆盖或在此处重新计算
                                                }
                                                updateItem(item.id, { title: finalTitle, isCustom: false });
                                                setShowTitleSelector(null);
                                            }}
                                            className="title-selector-option"
                                        >
                                            {getTitleDisplay(title)}
                                        </button>
                                    ))}
                                    <div className="custom-title-container" style={{ margin: '8px' }}>
                                        <input
                                            ref={dropdownInputRef}
                                            type="text"
                                            value={displayTitle}
                                            onChange={(e) => setDisplayTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const finalValue = displayTitle.trim();
                                                    if (finalValue) {
                                                        // 检查是否是预设标题的翻译文本
                                                        const presetTitle = Object.keys(titleToTranslationKey).find(
                                                            key => {
                                                                const translation = t(titleToTranslationKey[key]);
                                                                // 处理核心改进点带数字的情况
                                                                if (key === "核心改进点") {
                                                                    return finalValue === translation || finalValue.startsWith(translation + " ");
                                                                }
                                                                return finalValue === translation;
                                                            }
                                                        );
                                                        if (presetTitle) {
                                                            // 如果是核心改进点，检查是否有数字
                                                            if (presetTitle === "核心改进点" && finalValue.includes(" ")) {
                                                                const match = finalValue.match(/^(.+?)\s*(\d+)$/);
                                                                if (match) {
                                                                    const number = match[2];
                                                                    updateItem(item.id, {
                                                                        title: `核心改进点${number}`,
                                                                        isCustom: false
                                                                    });
                                                                } else {
                                                                    updateItem(item.id, {
                                                                        title: presetTitle,
                                                                        isCustom: false
                                                                    });
                                                                }
                                                            } else {
                                                                updateItem(item.id, {
                                                                    title: presetTitle,
                                                                    isCustom: false
                                                                });
                                                            }
                                                        } else {
                                                            updateItem(item.id, {
                                                                title: finalValue,
                                                                isCustom: true
                                                            });
                                                        }
                                                        setDisplayTitle('');
                                                        setShowTitleSelector(null);
                                                    }
                                                }
                                                if (e.key === 'Escape') {
                                                    setDisplayTitle('');
                                                    setShowTitleSelector(null);
                                                }
                                            }}
                                            onBlur={(e) => {
                                                setTimeout(() => {
                                                    const finalValue = e.target.value.trim();
                                                    if (finalValue) {
                                                        // 检查是否是预设标题的翻译文本
                                                        const presetTitle = Object.keys(titleToTranslationKey).find(
                                                            key => {
                                                                const translation = t(titleToTranslationKey[key]);
                                                                // 处理核心改进点带数字的情况
                                                                if (key === "核心改进点") {
                                                                    return finalValue === translation || finalValue.startsWith(translation + " ");
                                                                }
                                                                return finalValue === translation;
                                                            }
                                                        );
                                                        if (presetTitle) {
                                                            // 如果是核心改进点，检查是否有数字
                                                            if (presetTitle === "核心改进点" && finalValue.includes(" ")) {
                                                                const match = finalValue.match(/^(.+?)\s*(\d+)$/);
                                                                if (match) {
                                                                    const number = match[2];
                                                                    updateItem(item.id, {
                                                                        title: `核心改进点${number}`,
                                                                        isCustom: false
                                                                    });
                                                                } else {
                                                                    updateItem(item.id, {
                                                                        title: presetTitle,
                                                                        isCustom: false
                                                                    });
                                                                }
                                                            } else {
                                                                updateItem(item.id, {
                                                                    title: presetTitle,
                                                                    isCustom: false
                                                                });
                                                            }
                                                        } else {
                                                            updateItem(item.id, {
                                                                title: finalValue,
                                                                isCustom: true
                                                            });
                                                        }
                                                    }
                                                    setDisplayTitle('');
                                                }, 150);
                                            }}
                                            placeholder={t('enterTitle')}
                                            className="custom-title-input"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
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
                            listeningId === item.id ? "active active-gold" : "inactive"
                        )}
                    >
                        <Mic size={14} className={cn("icon-sm", listeningId === item.id && "animate-pulse")} />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.id);
                        }}
                        className="remove-diagnosis-btn"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            <div className="diagnosis-card-content">
                <textarea
                    value={item.content}
                    onChange={(e) => updateItem(item.id, { content: e.target.value })}
                    placeholder={t('enterPlanContent')}
                    className={cn(
                        "textarea-diagnosis",
                        showTitleSelector === item.id ? "opacity-20 pointer-events-none" : "opacity-100"
                    )}
                />
            </div>
        </motion.div>
    );
});

const SkillsPlan = ({ data, update }) => {
    const { t } = useLanguage();
    const { startListening, stopListening, isListening } = useVoiceInput();
    const [listeningId, setListeningId] = useState(null);
    const [showTitleSelector, setShowTitleSelector] = useState(null);
    const containerRef = useRef(null);

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

    useEffect(() => {
        if (!isListening) {
            setListeningId(null);
        }
    }, [isListening]);

    // 初始化数据结构，如果不存在
    useEffect(() => {
        if (data.skillsPlan === null || data.skillsPlan === undefined) {
            const newItem = {
                id: crypto?.randomUUID?.() || Date.now().toString(),
                title: "核心改进点1",
                content: '',
                isCustom: false
            };
            update('skillsPlan', [newItem], true);
            return;
        }

        if (Array.isArray(data.skillsPlan) && data.skillsPlan.length === 0) {
            const newItem = {
                id: crypto?.randomUUID?.() || Date.now().toString(),
                title: "核心改进点1",
                content: '',
                isCustom: false
            };
            update('skillsPlan', [newItem], true);
        }
    }, [data.skillsPlan, update]);

    const planItems = data.skillsPlan || [];

    const addItem = () => {
        // 统计已使用的标题类型
        const usedTitles = planItems.map(item => {
            if (item.title.startsWith('核心改进点')) return '核心改进点';
            return item.title;
        });

        let newItem;
        // 按优先级顺序添加
        if (!usedTitles.includes('核心改进点')) {
            // 第一个框：核心改进点1
            newItem = {
                id: crypto?.randomUUID?.() || Date.now().toString(),
                title: "核心改进点1",
                content: '',
                isCustom: false
            };
        } else if (!usedTitles.includes('辅助练习建议')) {
            // 第二个框：辅助练习建议
            newItem = {
                id: crypto?.randomUUID?.() || Date.now().toString(),
                title: "辅助练习建议",
                content: '',
                isCustom: false
            };
        } else {
            // 第三个框及以后：自定义框
            newItem = {
                id: crypto?.randomUUID?.() || Date.now().toString(),
                title: '',
                content: '',
                isCustom: true
            };
        }

        const newItems = [...planItems, newItem];
        update('skillsPlan', newItems);
        setShowTitleSelector(null);
        // 自动滚动到新添加的项
        setTimeout(() => {
            const lastItem = containerRef.current?.lastElementChild;
            lastItem?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const removeItem = (id) => {
        const newItems = planItems.filter(item => item.id !== id);
        update('skillsPlan', newItems);
    };

    const updateItem = (id, updates) => {
        // 如果更新包含标题，检查是否与现有的诊断或训练方案标题重复
        if (updates.title) {
            const trimmedTitle = updates.title.trim();
            const isDuplicateInPlan = planItems.some(item =>
                item.id !== id && (item.title || '').trim() === trimmedTitle
            );
            if (isDuplicateInPlan) {
                alert(t('duplicateTitle'));
                return;
            }
        }

        const newItems = planItems.map(item =>
            item.id === id ? { ...item, ...updates } : item
        );
        update('skillsPlan', newItems);
    };

    // 辅助函数：重新对所有“核心改进点”进行顺序编号
    const reorderCorePoints = (items) => {
        let coreCount = 0;
        return items.map(item => {
            // 如果不是自定义标题，且标题是“核心改进点”或以其开头，则重新编号
            if (!item.isCustom && (item.title === "核心改进点" || item.title.startsWith("核心改进点"))) {
                coreCount++;
                return { ...item, title: `核心改进点${coreCount}` };
            }
            return item;
        });
    };

    return (
        <div className="page-container">
            <div className="page-header px-2">
                <div className="page-title-group">
                    <h2 className="title-main">{t('skillsPlan')}</h2>
                    <p className="title-subtitle">{t('skillsPlanSubtitle')}</p>
                </div>
            </div>

            <div ref={containerRef} className="space-y-6 pb-20 px-2">
                <AnimatePresence mode="popLayout" initial={false}>
                    {planItems.map((item) => (
                        <SkillsPlanItem
                            key={item.id}
                            item={item}
                            updateItem={updateItem}
                            removeItem={removeItem}
                            showTitleSelector={showTitleSelector}
                            setShowTitleSelector={setShowTitleSelector}
                            setListeningId={setListeningId}
                            listeningId={listeningId}
                            startListening={startListening}
                        />
                    ))}
                </AnimatePresence>

                <motion.button
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.1 }}
                    onClick={addItem}
                    className="add-button-dashed group touch-action-manipulation"
                >
                    <div className="add-button-icon">
                        <Plus size={20} />
                    </div>
                    <span className="add-button-text">{t('addTrainingPlan')}</span>
                </motion.button>
            </div>
        </div>
    );
};

export default SkillsPlan;
