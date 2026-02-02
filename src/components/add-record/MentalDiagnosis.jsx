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
import { Mic, Sparkles, Plus, X, ChevronDown, Lightbulb } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useLanguage } from '../../utils/LanguageContext';
import { cn } from '../../utils/cn';
import { requestAIAdvice } from '../../pages/assessment/utils/aiAdviceApi';

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
    const [displayGrade, setDisplayGrade] = useState(item.grade ?? '');
    const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
    const inputRef = useRef(null);
    const gradeInputRef = useRef(null);

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

    // 当外部 grade 改变时，同步显示状态
    useEffect(() => {
        setDisplayGrade(item.grade || 0);
    }, [item.grade]);

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

                            {/* 分数展示 - 预设标题的分数显示 */}
                            {!item.isCustom && presetTitles.includes(item.title) && getScoreByTitle(item.title) && (
                                <span className="text-sm font-bold text-[#d4af37] uppercase tracking-widest shrink-0">
                                    {getScoreByTitle(item.title)} {t('Point')}
                                </span>
                            )}

                            {/* 自定义标题的分数输入框 - 自定义模式或不在预设列表中，且有grade字段 */}
                            {(item.isCustom || !presetTitles.includes(item.title)) && (item.grade !== undefined && item.grade !== null) && (
                                <div className="flex items-center gap-1 shrink-0">
                                    <input
                                        ref={gradeInputRef}
                                        type="number"
                                        value={displayGrade}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            if (raw === '') {
                                                setDisplayGrade('');
                                                return;
                                            }
                                            const value = parseInt(raw, 10);
                                            if (!Number.isNaN(value)) {
                                                setDisplayGrade(value);
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const raw = e.target.value.trim();
                                            if (raw === '') {
                                                updateItem(item.id, { grade: '' });
                                                return;
                                            }
                                            const value = parseInt(raw, 10);
                                            updateItem(item.id, { grade: Number.isNaN(value) ? '' : value });
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                            }
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        min="0"
                                        max="100"
                                        className="text-sm font-bold text-[#d4af37] uppercase tracking-widest bg-transparent border-none outline-none focus:outline-none w-10 text-center"
                                        style={{
                                            appearance: 'textfield',
                                            MozAppearance: 'textfield'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="text-sm font-bold text-[#d4af37] uppercase tracking-widest">{t('Point')}</span>
                                </div>
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
                                            // 确认自定义标题，保留grade字段
                                            updateItem(item.id, { title: finalValue, isCustom: false });
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
                                        // 取消自定义，保留原标题，避免触发重复标题提示
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
                                            // 切换到自定义标题时，如果原先没有分数（也就是从预设切换过来），赋予一个初始空字符串使其可编辑
                                            // 如果原先已经有分数（比如已经是自定义了，虽然UI上不会这么操作），保留原分数
                                            const newGrade = (item.grade === undefined || item.grade === null) ? '' : item.grade;
                                            updateItem(item.id, { isCustom: true, title: '', grade: newGrade });
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

            {/* 智能建议按钮 - 文本框下方（避免遮挡内容） */}
            <div className="mt-3 flex justify-end">
                <button
                    type="button"
                    disabled={isGeneratingAdvice}
                    onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isGeneratingAdvice) return;

                        try {
                            setIsGeneratingAdvice(true);
                            const dimension = item.title || '';
                            const category = 'mental';
                            const level = '';

                            const score = presetTitles.includes(item.title)
                                ? getScoreByTitle(item.title)
                                : (item.grade ?? '');

                            const scores = {
                                [dimension]: score === '' || score === null || score === undefined ? '' : `${score}分`
                            };

                            const { diag, advice } = await requestAIAdvice({
                                dimension,
                                category,
                                level,
                                scores
                            });

                            const nextContent = [diag, advice].filter(Boolean).join('\n\n');
                            updateItem(item.id, { content: nextContent });
                        } catch (err) {
                            console.error('[AIAdvice] failed:', err);
                            alert('生成智能建议失败，请稍后重试');
                        } finally {
                            setIsGeneratingAdvice(false);
                        }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#b8860b]/20 border border-[#d4af37]/30 hover:from-[#d4af37]/30 hover:to-[#b8860b]/30 hover:border-[#d4af37]/50 transition-all active:scale-95 shadow-lg shadow-[#d4af37]/10 group/btn backdrop-blur-sm"
                    title={t('smartSuggestion')}
                >
                    <Lightbulb size={14} className="text-[#d4af37] group-hover/btn:text-[#d4af37] transition-colors shrink-0" />
                    <span className="text-xs font-bold text-[#d4af37] uppercase tracking-wider">{t('smartSuggestion')}</span>
                </button>
            </div>
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
        if (data.mentalDiagnosis === null || data.mentalDiagnosis === undefined) {
            const newItem = {
                id: crypto?.randomUUID?.() || Date.now().toString(),
                title: presetTitles[0],
                content: '',
                isCustom: false,
                grade: undefined
            };
            update('mentalDiagnosis', [newItem], true);
            return;
        }

        if (Array.isArray(data.mentalDiagnosis) && data.mentalDiagnosis.length === 0) {
            const newItem = {
                id: crypto?.randomUUID?.() || Date.now().toString(),
                title: presetTitles[0],
                content: '',
                isCustom: false,
                grade: undefined
            };
            update('mentalDiagnosis', [newItem], true);
        }
    }, [data.mentalDiagnosis, update]);

    const diagnosisItems = data.mentalDiagnosis || [];
    const containerRef = useRef(null);

    const addItem = () => {
        // 找到下一个未被使用的标题
        const usedTitles = new Set(diagnosisItems.map(item => item.title).filter(title => presetTitles.includes(title)));
        const nextTitle = presetTitles.find(title => !usedTitles.has(title));

        // 如果所有预设标题都已使用，创建自定义框
        const isCustom = !nextTitle;
        const newItem = {
            id: crypto?.randomUUID?.() || Date.now().toString(),
            title: isCustom ? '' : nextTitle,
            content: '',
            isCustom: isCustom,
            grade: isCustom ? '' : undefined  // 自定义标题初始化为空字符串，允许用户输入
        };
        const newItems = [...diagnosisItems, newItem];
        update('mentalDiagnosis', newItems);
        setShowTitleSelector(null);
        // 自动滚动到新添加的项
        setTimeout(() => {
            const lastItem = containerRef.current?.lastElementChild;
            lastItem?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const removeItem = (id) => {
        const newItems = diagnosisItems.filter(item => item.id !== id);
        update('mentalDiagnosis', newItems);
    };

    const updateItem = (id, updates) => {
        // 如果更新包含标题，检查是否与现有的诊断或训练方案标题重复
        if (updates.title) {
            const trimmedTitle = updates.title.trim();
            const isDuplicateInDiagnosis = diagnosisItems.some(item =>
                item.id !== id && (item.title || '').trim() === trimmedTitle
            );
            if (isDuplicateInDiagnosis) {
                alert(t('duplicateTitle'));
                return;
            }
        }

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

            <div ref={containerRef} className="space-y-6 px-2 pb-20">
                <AnimatePresence mode="popLayout" initial={false}>
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
