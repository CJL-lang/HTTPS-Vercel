/**
 * SkillsDiagnosis - 技能测评诊断组件
 * 功能：用于填写技能测评的诊断分析，包括基础动作、挥杆技术和问题分析
 * 特性：
 *   - 分类填写：基础动作、挥杆技术、问题分析
 *   - 支持语音输入和文本编辑
 *   - 卡片式布局，支持悬停效果
 *   - 支持动态添加自定义诊断项
 * 使用场景：新增测评记录页面的技能测评-诊断步骤
 */
import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ClipboardCheck, Sparkles, Plus, X, ChevronDown } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';

// 等级下拉框组件 - 自动检测位置，避免超出容器，支持滚动
const GradeDropdown = ({ grades, onSelect, onClose, buttonRef }) => {
    const dropdownRef = useRef(null);
    const [position, setPosition] = useState('bottom'); // 'bottom' 或 'top'

    useEffect(() => {
        if (!dropdownRef.current || !buttonRef?.current) return;

        const checkPosition = () => {
            const button = buttonRef.current;
            if (!button) return;

            const buttonRect = button.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const dropdownHeight = 220; // 最大高度（L1-L9 需要更多空间）
            const spaceBelow = viewportHeight - buttonRect.bottom;
            const spaceAbove = buttonRect.top;

            // 如果下方空间不足，且上方空间足够，则向上展开
            if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                setPosition('top');
            } else {
                setPosition('bottom');
            }
        };

        // 延迟检查，确保 DOM 已渲染
        setTimeout(checkPosition, 0);
    }, [buttonRef]);

    return (
        <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: position === 'top' ? -10 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === 'top' ? -10 : 10 }}
            onWheel={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className={cn(
                "title-selector-dropdown grade-dropdown",
                position === 'top' && "bottom-full mb-2"
            )}
            onClick={(e) => e.stopPropagation()}
            style={position === 'top' ? { top: 'auto', bottom: '100%', marginTop: 0 } : {}}
        >
            <div
                className="dropdown-scroll-container"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {grades.map((grade) => (
                    <button
                        key={grade}
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(grade);
                        }}
                        className="title-selector-option"
                    >
                        {grade}
                    </button>
                ))}
            </div>
        </motion.div>
    );
};

const presetTitles = [
    "基础动作",
    "挥杆分析",
    "1号木杆",
    "主力铁杆",
    "铁杆",
    "木杆",
    "推杆",
    "救球率",
    "切杆"
];

// 中文标题 -> 翻译键映射
const titleToTranslationKey = {
    "基础动作": "basicAction",
    "挥杆分析": "swingAnalysis",
    "1号木杆": "clubDriver",
    "主力铁杆": "clubMainIron",
    "铁杆": "clubIrons",
    "木杆": "clubWood",
    "推杆": "clubPutting",
    "救球率": "clubScrambling",
    "切杆": "clubFinesseWedges",
};

// 需要显示等级下拉框的标题列表 - 技能测评全项目都需要等级
const titlesWithGrade = [...presetTitles];

// 等级列表 L1-L9
const levelOptions = Array.from({ length: 9 }, (_, i) => `L${i + 1}`);

const group1 = ["基础动作", "挥杆分析"];
const group2 = ["1号木杆", "主力铁杆", "铁杆", "木杆", "推杆", "救球率", "切杆"];

const SkillsDiagnosisItem = forwardRef(({
    item,
    updateItem,
    removeItem,
    showTitleSelector,
    setShowTitleSelector,
    listeningId,
    startListening,
    index,
    showSeparator
}, ref) => {
    const { t } = useLanguage();
    const [displayTitle, setDisplayTitle] = useState(item.title);
    const [showGradeSelector, setShowGradeSelector] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const inputRef = useRef(null);
    const dropdownInputRef = useRef(null);
    const gradeButtonRef = useRef(null);

    // 获取标题的翻译显示文本
    const getTitleDisplay = (title) => {
        if (!title) return '';
        if (titleToTranslationKey[title]) {
            return t(titleToTranslationKey[title]);
        }
        return title; // 自定义标题直接返回
    };

    useEffect(() => {
        // 如果是预设标题，显示翻译后的文本；否则显示原始标题
        if (!item.isCustom && titleToTranslationKey[item.title]) {
            setDisplayTitle(t(titleToTranslationKey[item.title]));
        } else {
            setDisplayTitle(item.title);
        }
    }, [item.title, item.isCustom, t]);

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                opacity: { duration: 0.2 }
            }}
            className="w-full space-y-4"
        >
            {showSeparator && (
                <div className="flex items-center gap-4 py-4 mt-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-[#d4af37]/60"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-[#d4af37] shadow-[0_0_10px_rgba(212,175,55,0.6)]"></div>
                    <div className="h-px flex-1 bg-gradient-to-r from-[#d4af37]/60 via-[#d4af37]/40 to-transparent"></div>
                </div>
            )}

            <div
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
                                    <span className="truncate">{item.isCustom ? (displayTitle || t('enterTitle')) : getTitleDisplay(item.title)}</span>
                                    <ChevronDown size={12} className={cn("transition-transform shrink-0", showTitleSelector === item.id && "rotate-180")} />
                                </button>

                                <div className="relative-container">
                                    <button
                                        ref={gradeButtonRef}
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
                                            <GradeDropdown
                                                buttonRef={gradeButtonRef}
                                                grades={levelOptions}
                                                onSelect={(grade) => {
                                                    updateItem(item.id, { grade });
                                                    setShowGradeSelector(false);
                                                }}
                                                onClose={() => setShowGradeSelector(false)}
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>
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
                                                // 检查是否是预设标题的翻译文本，如果是则恢复为原始预设标题
                                                const presetTitle = Object.keys(titleToTranslationKey).find(
                                                    key => t(titleToTranslationKey[key]) === finalValue
                                                );
                                                if (presetTitle) {
                                                    updateItem(item.id, { title: presetTitle, isCustom: false });
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

                            <AnimatePresence>
                                {showTitleSelector === item.id && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        className="title-selector-dropdown"
                                        onMouseDown={(e) => e.stopPropagation()}
                                    >
                                        <div className="dropdown-scroll-container">
                                            {presetTitles.map((title, idx) => (
                                                <React.Fragment key={title}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateItem(item.id, {
                                                                title,
                                                                isCustom: false
                                                            });
                                                            setShowTitleSelector(null);
                                                        }}
                                                        className={cn(
                                                            "title-selector-option",
                                                            item.title === title && "active",
                                                            // 如果下一项是1号木杆，隐藏当前项（挥杆分析）的底部白线
                                                            idx < presetTitles.length - 1 && presetTitles[idx + 1] === "1号木杆" && "border-b-0"
                                                        )}
                                                    >
                                                        {getTitleDisplay(title)}
                                                    </button>
                                                    {/* 在“挥杆分析”和“1号木杆”之间插入唯一的金色分割线 */}
                                                    {title === "挥杆分析" && idx < presetTitles.length - 1 && presetTitles[idx + 1] === "1号木杆" && (
                                                        <div className="dropdown-divider-gold-thin" />
                                                    )}
                                                </React.Fragment>
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
                                                                    key => t(titleToTranslationKey[key]) === finalValue
                                                                );
                                                                if (presetTitle) {
                                                                    updateItem(item.id, {
                                                                        title: presetTitle,
                                                                        isCustom: false
                                                                    });
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
                                                                    key => t(titleToTranslationKey[key]) === finalValue
                                                                );
                                                                if (presetTitle) {
                                                                    updateItem(item.id, {
                                                                        title: presetTitle,
                                                                        isCustom: false
                                                                    });
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
                    </div>

                    <div className="action-buttons-container">
                        <button
                            type="button"
                            onClick={() => startListening(item.id)}
                            className={cn(
                                "voice-btn",
                                listeningId === item.id ? "active active-gold" : "inactive"
                            )}
                        >
                            <Mic size={14} className={cn("icon-sm", listeningId === item.id && "animate-pulse")} />
                        </button>
                        <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="delete-btn"
                        >
                            <X size={14} className="icon-sm" />
                        </button>
                    </div>
                </div>

                <div className="diagnosis-card-content">
                    <textarea
                        value={item.content || ''}
                        onChange={(e) => updateItem(item.id, { content: e.target.value })}
                        placeholder={t('enterDiagnosisContent')}
                        className="textarea-diagnosis"
                        onFocus={(e) => {
                            const container = e.target.closest('.diagnosis-card');
                            if (container) {
                                setTimeout(() => {
                                    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 300);
                            }
                        }}
                    />
                </div>
            </div>
        </motion.div>
    );
});

const SkillsDiagnosis = ({ data, update }) => {
    const { t } = useLanguage();
    const { isListening, startListening, stopListening } = useVoiceInput();
    const [listeningId, setListeningId] = useState(null);
    const [showTitleSelector, setShowTitleSelector] = useState(null);
    const containerRef = useRef(null);

    // 数据结构：从 data.skillsDiagnosis 获取
    const items = data.skillsDiagnosis || [];

    // 初始化数据结构，如果不存在
    useEffect(() => {
        if (data.skillsDiagnosis === null || data.skillsDiagnosis === undefined) {
            const newItem = {
                id: crypto?.randomUUID?.() || Date.now().toString(),
                title: presetTitles[0],
                grade: 'L1',
                content: '',
                isCustom: false
            };
            update('skillsDiagnosis', [newItem], true);
            return;
        }

        if (Array.isArray(data.skillsDiagnosis) && data.skillsDiagnosis.length === 0) {
            const newItem = {
                id: crypto?.randomUUID?.() || Date.now().toString(),
                title: presetTitles[0],
                grade: 'L1',
                content: '',
                isCustom: false
            };
            update('skillsDiagnosis', [newItem], true);
        }
    }, [data.skillsDiagnosis, update]);

    useEffect(() => {
        if (!isListening) {
            setListeningId(null);
        }
    }, [isListening]);

    // 语音输入处理
    const handleStartListening = (id) => {
        if (listeningId === id) {
            stopListening();
            setListeningId(null);
            return;
        }

        setListeningId(id);
        startListening((text) => {
            const item = items.find(i => i.id === id);
            if (item) {
                const updatedContent = (item.content || '') + text;
                updateItem(id, { content: updatedContent });
            }
        });
    };

    const updateItem = (id, updates) => {
        // 如果更新包含标题，检查是否与现有的诊断或训练方案标题重复
        if (updates.title) {
            const trimmedTitle = updates.title.trim();
            const isDuplicateInDiagnosis = items.some(item =>
                item.id !== id && (item.title || '').trim() === trimmedTitle
            );
            if (isDuplicateInDiagnosis) {
                alert(t('duplicateTitle'));
                return;
            }
        }

        const newItems = items.map(item =>
            item.id === id ? { ...item, ...updates } : item
        );
        update('skillsDiagnosis', newItems);
    };

    const removeItem = (id) => {
        const newItems = items.filter(item => item.id !== id);
        update('skillsDiagnosis', newItems);
    };

    const addItem = () => {
        // 找到下一个未被使用的标题
        const usedTitles = new Set(items.map(item => item.title).filter(title => presetTitles.includes(title)));
        const nextTitle = presetTitles.find(title => !usedTitles.has(title));

        // 如果所有预设标题都已使用，创建自定义框
        const isCustom = !nextTitle;
        const newItem = {
            id: Date.now().toString(),
            title: isCustom ? '' : nextTitle,
            grade: 'L1',
            content: '',
            isCustom: isCustom
        };
        update('skillsDiagnosis', [...items, newItem]);
        // 自动滚动到新添加的项
        setTimeout(() => {
            const lastItem = containerRef.current?.lastElementChild;
            lastItem?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // 判断是否需要显示金色分割线
    // 逻辑：如果当前项属于 group2，且前一项属于 group1，则在当前项上方显示分割线
    const shouldShowSeparator = (index) => {
        if (index === 0) return false;
        const currentItem = items[index];
        const prevItem = items[index - 1];

        const currentInGroup2 = group2.includes(currentItem.title);
        const prevInGroup1 = group1.includes(prevItem.title);

        return currentInGroup2 && prevInGroup1;
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-title-group">
                    <h2 className="title-main">{t('skillsDiagnosis')}</h2>
                    <p className="title-subtitle">{t('skillsDiagnosisSubtitle')}</p>
                </div>
            </div>

            <div ref={containerRef} className="space-y-6 pb-20">
                <AnimatePresence mode="popLayout" initial={false}>
                    {items.map((item, index) => (
                        <SkillsDiagnosisItem
                            key={item.id}
                            index={index}
                            item={item}
                            updateItem={updateItem}
                            removeItem={removeItem}
                            showTitleSelector={showTitleSelector}
                            setShowTitleSelector={setShowTitleSelector}
                            listeningId={listeningId}
                            startListening={handleStartListening}
                            showSeparator={shouldShowSeparator(index)}
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
                    <span className="add-button-text">{t('addDiagnosisItem')}</span>
                </motion.button>
            </div>
        </div>
    );
};

export default SkillsDiagnosis;
