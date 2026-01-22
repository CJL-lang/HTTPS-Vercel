/**
 * PhysicalPlan - 身体素质测评计划组件
 * 功能：用于制定身体素质训练计划，支持多个计划项，每个计划项包含标题和内容
 * 特性：
 *   - 支持预设标题选择（力量和爆发力提升、核心提升、柔软度和协调性提升）或自定义标题
 *   - 支持动态添加/删除计划项
 *   - 支持语音输入和文本编辑
 *   - 卡片式布局，支持悬停效果
 * 使用场景：新增测评记录页面的身体素质测评-计划步骤
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, Plus, X, ChevronDown } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useLanguage } from '../../utils/LanguageContext';
import { cn } from '../../utils/cn';

const presetTitles = [
    "力量和爆发力提升",
    "核心提升",
    "柔软度和协调性提升"
];

// 中文标题 -> 翻译键映射
const titleToTranslationKey = {
    "力量和爆发力提升": "powerAndExplosivenessImprovement",
    "核心提升": "coreImprovement",
    "柔软度和协调性提升": "flexibilityAndCoordinationImprovement",
};

const PhysicalPlanItem = React.forwardRef(({ item, updateItem, removeItem, showTitleSelector, setShowTitleSelector, setListeningId, listeningId, startListening }, ref) => {
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
                                        updateItem(item.id, { isCustom: false, title: item.title });
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
                placeholder={t('enterPlanContent')}
                className={cn(
                    "textarea-standard-transition",
                    showTitleSelector === item.id ? "opacity-20 pointer-events-none" : "opacity-100"
                )}
            />
        </motion.div>
    );
});

const PhysicalPlan = ({ data, update }) => {
    const { t } = useLanguage();
    const { startListening } = useVoiceInput();
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

    // 初始化数据结构，如果不存在
    useEffect(() => {
        if (data.physicalPlan === null || data.physicalPlan === undefined) {
            const newItem = {
                id: crypto?.randomUUID?.() || Date.now().toString(),
                title: presetTitles[0],
                content: '',
                isCustom: false
            };
            update('physicalPlan', [newItem], true);
            return;
        }

        if (Array.isArray(data.physicalPlan) && data.physicalPlan.length === 0) {
            const newItem = {
                id: crypto?.randomUUID?.() || Date.now().toString(),
                title: presetTitles[0],
                content: '',
                isCustom: false
            };
            update('physicalPlan', [newItem], true);
        }
    }, [data.physicalPlan, update]);

    const planItems = data.physicalPlan || [];

    const addItem = () => {
        // 找到下一个未被使用的标题
        const usedTitles = new Set(planItems.map(item => item.title).filter(title => presetTitles.includes(title)));
        const nextTitle = presetTitles.find(title => !usedTitles.has(title));

        // 如果所有预设标题都已使用，创建自定义框
        const isCustom = !nextTitle;
        const newItem = {
            id: crypto?.randomUUID?.() || Date.now().toString(),
            title: isCustom ? '' : nextTitle,
            content: '',
            isCustom: isCustom
        };
        const newItems = [...planItems, newItem];
        update('physicalPlan', newItems);
        setShowTitleSelector(null);
        // 自动滚动到新添加的项
        setTimeout(() => {
            const lastItem = containerRef.current?.lastElementChild;
            lastItem?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const removeItem = (id) => {
        const newItems = planItems.filter(item => item.id !== id);
        update('physicalPlan', newItems);
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
        update('physicalPlan', newItems);
    };

    return (
        <div className="page-container px-2">
            <div className="page-header">
                <div className="page-title-group">
                    <h2 className="title-main">{t('physicalPlan')}</h2>
                    <p className="title-subtitle">{t('physicalPlanSubtitle')}</p>
                </div>
            </div>

            <div ref={containerRef} className="space-y-6">
                <AnimatePresence mode="popLayout" initial={false}>
                    {planItems.map((item) => (
                        <PhysicalPlanItem
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
                    <span className="add-button-text">{t('addTrainingPlan')}</span>
                </motion.button>
            </div>
        </div>
    );
};

export default PhysicalPlan;
