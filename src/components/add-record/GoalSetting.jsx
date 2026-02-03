/**
 * GoalSetting - 目标设置组件（通用）
 * 功能：用于设置多阶段目标，支持添加、删除、编辑目标内容，支持语音输入
 * 特性：
 *   - 支持多阶段目标（第一阶段、第二阶段...）
 *   - 每个目标支持语音输入和文本编辑
 *   - 动态添加/删除目标阶段
 *   - 卡片式布局，支持悬停效果
 * 使用场景：技能测评、心理测评、身体素质测评的目标设置步骤
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Plus, X, Target, Edit2, Check } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useLanguage } from '../../utils/LanguageContext';
import { cn } from '../../utils/cn';
import { numberToChinese } from '../../utils/numberToChinese';

const GoalItem = React.forwardRef(({ item, index, updateItem, removeItem, setListeningId, listeningId, startListening }, ref) => {
    const { t, language } = useLanguage();
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingTitle, setEditingTitle] = useState('');
    const inputRef = useRef(null);
    const isSavingRef = useRef(false);

    const stageNamesEn = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh", "Eighth", "Ninth", "Tenth"];

    // Get Chinese number string for current index + 1
    const chineseNumber = numberToChinese(index + 1);

    const defaultStageTitle = language === 'en'
        ? `${stageNamesEn[index] || `Stage ${index + 1}`} ${t('goal')}`
        : `第${chineseNumber}阶段目标`;

    const displayTitle = item.title || defaultStageTitle;

    useEffect(() => {
        if (isEditingTitle && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditingTitle]);

    const handleStartEdit = () => {
        setEditingTitle(displayTitle);
        setIsEditingTitle(true);
        isSavingRef.current = false;
    };

    const handleSaveTitle = () => {
        if (isSavingRef.current) return; // 防止重复保存
        isSavingRef.current = true;
        const finalTitle = editingTitle.trim() || defaultStageTitle;
        updateItem(item.id, { title: finalTitle });
        setIsEditingTitle(false);
        setTimeout(() => {
            isSavingRef.current = false;
        }, 100);
    };

    const handleCancelEdit = () => {
        setEditingTitle('');
        setIsEditingTitle(false);
        isSavingRef.current = false;
    };

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
            className="will-change-transform-opacity goal-card group"
        >

            <div className="goal-card-header">
                <div className="goal-item-header-container">
                    <div className="goal-icon-container">
                        <Target size={14} className="text-[#d4af37]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        {isEditingTitle ? (
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <input
                                    ref={inputRef}
                                    className="bg-white/5 border border-[#d4af37]/30 rounded-lg px-2 py-1 text-white text-sm font-bold w-full focus:outline-none focus:border-[#d4af37] flex-1 min-w-0"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onBlur={handleSaveTitle}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSaveTitle();
                                        } else if (e.key === 'Escape') {
                                            handleCancelEdit();
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveTitle();
                                    }}
                                    className="p-1 text-[#d4af37] active:scale-90 transition-transform shrink-0"
                                >
                                    <Check size={14} className="sm:w-4 sm:h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                className="flex items-center gap-2 group cursor-pointer flex-1 min-w-0"
                                onClick={handleStartEdit}
                            >
                                <span className="goal-title truncate">
                                    {displayTitle}
                                </span>
                                <Edit2 size={12} className="text-[#d4af37] opacity-40 group-hover:opacity-100 transition-opacity shrink-0 sm:w-3 sm:h-3" />
                            </div>
                        )}
                    </div>
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
                placeholder={t('stageGoalPlaceholder').replace('{stage}', displayTitle)}
                className="textarea-standard-transition"
            />
        </motion.div>
    );
});

const GoalSetting = ({ data, update, dataKey, title, subtitle }) => {
    const { t } = useLanguage();
    const { startListening } = useVoiceInput();
    const [listeningId, setListeningId] = useState(null);

    // 初始化数据结构，如果不存在则创建初始目标项
    useEffect(() => {
        if (data[dataKey] === null) return;

        if (data[dataKey].length === 0) {
            const newItem = {
                id: crypto?.randomUUID?.() || Date.now().toString(),
                content: ''
            };
            // 使用静默更新，避免触发“有未保存修改”的提示
            update(dataKey, [newItem], true);
        }
    }, [data[dataKey], dataKey, update]);

    const goalItems = data[dataKey] || [];
    const containerRef = useRef(null);

    const addItem = () => {
        const newItem = {
            id: crypto?.randomUUID?.() || Date.now().toString(),
            content: ''
        };
        const newItems = [...goalItems, newItem];
        update(dataKey, newItems);
        // 自动滚动到新添加的项
        setTimeout(() => {
            const lastItem = containerRef.current?.lastElementChild;
            lastItem?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const removeItem = (id) => {
        const newItems = goalItems.filter(item => item.id !== id);
        update(dataKey, newItems);
    };

    const updateItem = (id, updates) => {
        const newItems = goalItems.map(item =>
            item.id === id ? { ...item, ...updates } : item
        );
        update(dataKey, newItems);
    };

    return (
        <div className="page-container px-2">
            <div className="page-header">
                <div className="page-title-group">
                    <h2 className="title-main">{title}</h2>
                    <p className="title-subtitle">{subtitle}</p>
                </div>
            </div>

            <div ref={containerRef} className="space-y-6 pb-20">
                <AnimatePresence mode="popLayout" initial={false}>
                    {goalItems.map((item, index) => (
                        <GoalItem
                            key={item.id}
                            item={item}
                            index={index}
                            updateItem={updateItem}
                            removeItem={removeItem}
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
                    <span className="add-button-text">{t('addNextStageGoal')}</span>
                </motion.button>
            </div>
        </div>
    );
};

export default GoalSetting;
