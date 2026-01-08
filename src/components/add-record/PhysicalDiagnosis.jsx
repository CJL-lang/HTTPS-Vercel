/**
 * PhysicalDiagnosis - 身体素质测评诊断组件
 * 功能：用于填写身体素质测评的诊断分析，支持多个诊断项，每个诊断项包含标题和内容
 * 特性：
 *   - 支持预设标题选择（柔软度等级、上肢力量等级、下肢力量等级等）或自定义标题
 *   - 支持动态添加/删除诊断项
 *   - 支持语音输入和文本编辑
 *   - 卡片式布局，支持悬停效果
 * 使用场景：新增测评记录页面的身体素质测评-诊断步骤
 */
import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Sparkles, Plus, X, ChevronDown } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useLanguage } from '../../utils/LanguageContext';
import { cn } from '../../utils/cn';

const presetTitles = [
    "柔软度等级",
    "上肢力量等级",
    "下肢力量等级",
    "协调性等级",
    "核心稳定性等级",
    "旋转爆发力等级",
    "心肺耐力"
];

// 需要显示等级下拉框的标题列表
const titlesWithGrade = [
    "柔软度等级",
    "上肢力量等级",
    "下肢力量等级",
    "协调性等级",
    "核心稳定性等级",
    "旋转爆发力等级"
];

// 定义等级范围的辅助函数
const getGradeOptions = (title) => {
    // 统一改为 L1-L8
    return Array.from({ length: 8 }, (_, i) => `L${i + 1}`);
};

// ✅ 中文标题 -> problem_category enum 映射（关键）
const titleToCategory = {
    "体态": "posture",
    "柔软度等级": "flexibility_level",
    "上肢力量等级": "upper_body_strength_level",
    "下肢力量等级": "lower_body_strength_level",
    "协调性等级": "coordination_level",
    "核心稳定性等级": "core_stability_level",
    "旋转爆发力等级": "rotational_explosiveness_level",
    "心肺耐力": "cardiorespiratory_endurance"
};

// 中文标题 -> 翻译键映射
const titleToTranslationKey = {
    "体态": "posture",
    "柔软度等级": "flexibilityLevel",
    "上肢力量等级": "upperBodyStrengthLevel",
    "下肢力量等级": "lowerBodyStrengthLevel",
    "协调性等级": "coordinationLevel",
    "核心稳定性等级": "coreStabilityLevel",
    "旋转爆发力等级": "rotationalExplosivenessLevel",
    "心肺耐力": "cardiorespiratoryEndurance"
};

const PhysicalDiagnosisItem = forwardRef(({
    item,
    updateItem,
    removeItem,
    showTitleSelector,
    setShowTitleSelector,
    setListeningId,
    listeningId,
    startListening
}, ref) => {
    const { t } = useLanguage();
    const [displayTitle, setDisplayTitle] = useState(item.title);
    const [showGradeSelector, setShowGradeSelector] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const inputRef = useRef(null);

    // 获取标题的翻译显示文本
    const getTitleDisplay = (title) => {
        if (!title) return '';
        
        // 1. 如果 title 本身已经是翻译键（英文字符串），先尝试翻译
        if (/^[a-zA-Z]/.test(title)) {
            const translated = t(title);
            if (translated !== title) return translated;
        }

        // 2. 如果 title 是预设中文标题，寻找翻译键并翻译
        if (titleToTranslationKey[title]) {
            return t(titleToTranslationKey[title]);
        }

        // 3. 原样返回（如后端返回的中文“体态”或“灵活性”）
        return title;
    };

    useEffect(() => {
        setDisplayTitle(item.title);
    }, [item.title]);

    useEffect(() => {
        if (isEditingTitle && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditingTitle]);

    useEffect(() => {
        const handleClickOutside = () => {
            if (showGradeSelector) setShowGradeSelector(false);
        };
        if (showGradeSelector) {
            window.addEventListener('click', handleClickOutside);
            return () => window.removeEventListener('click', handleClickOutside);
        }
    }, [showGradeSelector]);

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
                                <span className="truncate">{getTitleDisplay(item.title) || t('selectTitle')}</span>
                                <ChevronDown size={12} className={cn("transition-transform shrink-0", showTitleSelector === item.id && "rotate-180")} />
                            </button>

                            {/* 等级下拉框 - 显示逻辑改为：只要不是心肺耐力，或者只要是自定义项，都允许选等级 */}
                            {(item.isCustom || titlesWithGrade.includes(item.title)) && (
                                <div className="relative-container">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setShowGradeSelector(!showGradeSelector);
                                        }}
                                        className="title-selector-btn"
                                    >
                                        <span className="truncate">{item.grade || 'L1'}</span>
                                        <ChevronDown size={12} className={cn("transition-transform shrink-0", showGradeSelector && "rotate-180")} />
                                    </button>

                                    <AnimatePresence>
                                        {showGradeSelector && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                onWheel={(e) => e.stopPropagation()}
                                                onTouchStart={(e) => e.stopPropagation()}
                                                className="title-selector-dropdown w-20"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div
                                                    className="dropdown-scroll-container"
                                                    onPointerDown={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                >
                                                    {getGradeOptions(item.title).map((grade) => (
                                                        <button
                                                            key={grade}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateItem(item.id, { grade });
                                                                setShowGradeSelector(false);
                                                            }}
                                                            className="title-selector-option"
                                                        >
                                                            {grade}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {isEditingTitle && (
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
                                        if (e.key === 'Enter') e.currentTarget.blur();
                                        if (e.key === 'Escape') setIsEditingTitle(false);
                                    }}
                                    onBlur={(e) => {
                                        const finalValue = e.target.value.trim();
                                        if (finalValue) {
                                            updateItem(item.id, { 
                                                title: finalValue, 
                                                isCustom: !presetTitles.includes(finalValue) 
                                            });
                                        }
                                        setIsEditingTitle(false);
                                    }}
                                    placeholder={t('enterTitle')}
                                    className="custom-title-input"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditingTitle(false);
                                    }}
                                    className="custom-title-cancel-btn"
                                >
                                    <X size={14} />
                                </button>
                            </motion.div>
                        )}
                    </div>

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
                                                updateItem(item.id, {
                                                    title,
                                                    category: titleToCategory[title],
                                                    isCustom: false
                                                });
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
                                            setIsEditingTitle(true);
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

                <div className="action-buttons-container">
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
                            "physical-voice-btn",
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
                placeholder={t('enterDiagnosisContent')}
                className={cn(
                    "textarea-standard-transition",
                    showTitleSelector === item.id ? "opacity-20 pointer-events-none" : "opacity-100"
                )}
            />
        </motion.div>
    );
});
PhysicalDiagnosisItem.displayName = 'PhysicalDiagnosisItem';

const PhysicalDiagnosis = ({ data, update }) => {
    const { t } = useLanguage();
    const { startListening } = useVoiceInput();
    const [listeningId, setListeningId] = useState(null);
    const [showTitleSelector, setShowTitleSelector] = useState(null);

    useEffect(() => {
        const handleClickOutside = () => {
            if (showTitleSelector) setShowTitleSelector(null);
        };
        if (showTitleSelector) window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [showTitleSelector]);

    useEffect(() => {
        // 如果数据还是 null（说明 initial state 还没准备好），或者已经有数据了，则不处理
        if (data.physicalDiagnosis === null) return;
        
        if (data.physicalDiagnosis.length === 0) {
            const defaultTitle = presetTitles[0];
            const newItem = {
                id: crypto?.randomUUID?.() || Date.now().toString(),
                title: defaultTitle,
                category: titleToCategory[defaultTitle],
                content: '',
                isCustom: false,
                grade: '' // 初始化 grade 字段
            };
            update('physicalDiagnosis', [newItem]);
        }
    }, [data.physicalDiagnosis, update]);

    const diagnosisItems = data.physicalDiagnosis || [];

    const addItem = () => {
        // 找到下一个未被使用的标题
        const usedTitles = new Set(diagnosisItems.map(item => item.title).filter(title => presetTitles.includes(title)));
        const nextTitle = presetTitles.find(title => !usedTitles.has(title)) || presetTitles[0];

        const newItem = {
            id: crypto?.randomUUID?.() || Date.now().toString(),
            title: nextTitle,
            category: titleToCategory[nextTitle], // ✅ 必须有
            content: '',
            isCustom: false,
            grade: '' // 初始化 grade 字段
        };
        const newItems = [...diagnosisItems, newItem];
        update('physicalDiagnosis', newItems);
        setShowTitleSelector(null);
    };

    const removeItem = (id) => {
        const newItems = diagnosisItems.filter(item => item.id !== id);
        update('physicalDiagnosis', newItems);
    };

    const updateItem = (id, updates) => {
        const newItems = diagnosisItems.map(item =>
            item.id === id ? { ...item, ...updates } : item
        );
        update('physicalDiagnosis', newItems);
    };

    return (
        <div className="page-container px-2">
            <div className="page-header">
                <div className="page-title-group">
                    <h2 className="title-main">{t('physicalDiagnosis')}</h2>
                    <p className="title-subtitle">{t('physicalDiagnosisSubtitle')}</p>
                </div>
            </div>

            <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {diagnosisItems.map((item) => (
                        <PhysicalDiagnosisItem
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
                    <span className="add-button-text">{t('addDiagnosisItem')}</span>
                </motion.button>
            </div>
        </div>
    );
};

export default PhysicalDiagnosis;
// Force reload

