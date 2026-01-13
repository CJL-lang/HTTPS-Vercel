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

const SkillsPlanItem = React.forwardRef(({ item, updateItem, removeItem, showTitleSelector, setShowTitleSelector, setListeningId, listeningId, startListening }, ref) => {
    const { t } = useLanguage();
    const [displayTitle, setDisplayTitle] = useState(item.title);
    const inputRef = useRef(null);

    // 获取标题的显示文本
    const getTitleDisplay = (title) => {
        if (!title) return '';
        // 如果是带数字的核心改进点，保持原样
        if (title.startsWith("核心改进点")) return title;
        return t(title) || title;
    };

    // 当外部 title 改变时，同步显示状态
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
                                            // 如果没填内容，恢复回原标题或第一个预设标题
                                            updateItem(item.id, { title: item.title || presetTitles[0], isCustom: false });
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

    const planItems = data.skillsPlan || [];

    const addItem = () => {
        const newItem = {
            id: crypto?.randomUUID?.() || Date.now().toString(),
            title: "核心改进点",
            content: '',
            isCustom: false
        };
        const newItems = reorderCorePoints([...planItems, newItem]);
        update('skillsPlan', newItems);
        setShowTitleSelector(null);
    };

    const removeItem = (id) => {
        let newItems = planItems.filter(item => item.id !== id);
        // 重新排序核心改进点的数字
        newItems = reorderCorePoints(newItems);
        update('skillsPlan', newItems);
    };

    const updateItem = (id, updates) => {
        let newItems = planItems.map(item =>
            item.id === id ? { ...item, ...updates } : item
        );
        // 只要涉及到标题变动，就重新排序核心改进点的数字
        if (updates.title !== undefined || updates.isCustom !== undefined) {
            newItems = reorderCorePoints(newItems);
        }
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
                    <h2 className="title-main">{t('planTitle')}</h2>
                    <p className="title-subtitle">{t('planSubtitle')}</p>
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
                    <span className="add-button-text">添加训练方案</span>
                </motion.button>
            </div>
        </div>
    );
};

export default SkillsPlan;
