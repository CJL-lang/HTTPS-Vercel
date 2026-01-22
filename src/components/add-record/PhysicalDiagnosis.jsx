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
            const dropdownHeight = 180; // 最大高度
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
    "旋转爆发力等级",
    "心肺耐力" // 添加心肺耐力，也需要等级选择器
];

// 定义等级范围的辅助函数
const getGradeOptions = (title) => {
    // 身体素质测评只支持 L1-L4
    return Array.from({ length: 4 }, (_, i) => `L${i + 1}`);
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

// 标题 -> 测试项目与结果映射（用于显示固定格式）
const titleToTestItem = {
    "柔软度等级": {
        items: [
            { testName: "胸椎旋转", unit: "分" },
            { testName: "髋关节旋转", unit: "分" },
            { testName: "肩部活动度", unit: "分" },
            { testName: "脊柱灵活性", unit: "分" },
            { testName: "下肢柔韧性", unit: "分" }
        ]
    },
    "协调性等级": {
        testName: "30秒跳绳",
        unit: "次"
    },
    "上肢力量等级": {
        testName: "1分钟俯卧撑",
        unit: "个"
    },
    "下肢力量等级": {
        testName: "立定跳远",
        unit: "米"
    },
    "旋转爆发力等级": {
        testName: "药球侧向投掷",
        unit: "米"
    },
    "核心稳定性等级": {
        testName: "平板支撑",
        unit: "秒"
    },
    "心肺耐力": {
        testName: "20m往返跑 VO2max",
        unit: "ml/kg/min"
    }
};

// 获取测试项目显示格式
const getTestItemDisplay = (title) => {
    const testItem = titleToTestItem[title];
    if (!testItem) return null;
    if (Array.isArray(testItem.items) && testItem.items.length > 0) {
        return { items: testItem.items };
    }
    return { items: [{ testName: testItem.testName, unit: testItem.unit }] };
};

// 从 workoutroutine 字符串中解析出输入值
const parseWorkoutRoutineValue = (workoutroutine, testItem, itemIndex = 0) => {
    if (!testItem) return '';
    const target = Array.isArray(workoutroutine)
        ? workoutroutine[itemIndex]
        : (itemIndex === 0 ? workoutroutine : '');
    if (!target) return '';

    // 转义特殊字符用于正则表达式
    const escapedTestName = testItem.testName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedUnit = testItem.unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 如果已经是完整格式: "30秒跳绳：30 次" 或 "30秒跳绳：请输入 次"
    const pattern = new RegExp(`${escapedTestName}：(.+?)\\s*${escapedUnit}`);
    const match = target.match(pattern);
    if (match) {
        const value = match[1].trim();
        // 如果是占位符文本，返回空字符串
        if (value === '请输入' || value === '') {
            return '';
        }
        return value;
    }

    // 如果 workoutroutine 不包含测试名称，可能是旧格式或纯数值
    // 如果包含单位，尝试提取数值部分
    if (target.includes(testItem.unit)) {
        const unitPattern = new RegExp(`(.+?)\\s*${escapedUnit}`);
        const unitMatch = target.match(unitPattern);
        if (unitMatch) {
            const value = unitMatch[1].trim();
            if (value === '请输入' || value === '') {
                return '';
            }
            return value;
        }
    }

    // 如果都不匹配，可能是旧格式的纯数值，直接返回（但排除占位符）
    const trimmed = target.trim();
    return (trimmed === '请输入' || trimmed === '') ? '' : trimmed;
};

// 格式化完整的 workoutroutine 字符串
const formatWorkoutRoutine = (inputValue, testItem) => {
    if (!testItem) return '';
    const value = inputValue.trim();
    if (!value) return `${testItem.testName}：请输入 ${testItem.unit}`;
    return `${testItem.testName}：${value} ${testItem.unit}`;
};

const buildDefaultWorkoutRoutine = (title) => {
    const testItem = getTestItemDisplay(title);
    if (!testItem) return '';
    const defaults = testItem.items.map((item) => formatWorkoutRoutine('', item));
    return testItem.items.length > 1 ? defaults : defaults[0];
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
    const dropdownInputRef = useRef(null);
    const cardRef = useRef(null);
    const gradeButtonRef = useRef(null);

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
            ref={(node) => {
                cardRef.current = node;
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref) {
                    ref.current = node;
                }
            }}
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
                                <span className="truncate">{item.isCustom ? (displayTitle || t('enterTitle')) : (getTitleDisplay(item.title) || t('selectTitle'))}</span>
                                <ChevronDown size={12} className={cn("transition-transform shrink-0", showTitleSelector === item.id && "rotate-180")} />
                            </button>

                            {/* 等级下拉框 - 始终显示，与技能诊断一致 */}
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
                                            grades={getGradeOptions(item.title)}
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
                                    onChange={(e) => setDisplayTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    onBlur={(e) => {
                                        const finalValue = e.target.value.trim();
                                        if (finalValue) {
                                            const isPreset = presetTitles.includes(finalValue);
                                            const testItem = isPreset ? getTestItemDisplay(finalValue) : null;
                                            updateItem(item.id, {
                                                title: finalValue,
                                                category: isPreset ? titleToCategory[finalValue] : '',
                                                isCustom: !isPreset,
                                                workoutroutine: isPreset ? buildDefaultWorkoutRoutine(finalValue) : item.workoutroutine
                                            });
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
                                                    isCustom: false,
                                                    workoutroutine: buildDefaultWorkoutRoutine(title)
                                                });
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
                                                        const isPreset = presetTitles.includes(finalValue);
                                                        const testItem = isPreset ? getTestItemDisplay(finalValue) : null;
                                                        updateItem(item.id, {
                                                            title: finalValue,
                                                            category: isPreset ? titleToCategory[finalValue] : '',
                                                            isCustom: !isPreset,
                                                            workoutroutine: isPreset ? buildDefaultWorkoutRoutine(finalValue) : item.workoutroutine
                                                        });
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
                                                        const isPreset = presetTitles.includes(finalValue);
                                                        const testItem = isPreset ? getTestItemDisplay(finalValue) : null;
                                                        updateItem(item.id, {
                                                            title: finalValue,
                                                            category: isPreset ? titleToCategory[finalValue] : '',
                                                            isCustom: !isPreset,
                                                            workoutroutine: isPreset ? buildDefaultWorkoutRoutine(finalValue) : item.workoutroutine
                                                        });
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

            {/* 固定的测试项目格式显示 */}
            {(() => {
                const testItem = getTestItemDisplay(item.title);
                if (!testItem) return null;

                return (
                    <div className="mb-3 p-3 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg border border-[#d4af37]/30 shadow-md backdrop-blur-sm transition-all duration-300 hover:border-[#d4af37]/40">
                        <div className="space-y-2 text-sm">
                            {testItem.items.map((itemDef, idx) => {
                                const inputValue = parseWorkoutRoutineValue(item.workoutroutine, itemDef, idx);
                                return (
                                    <div key={`${itemDef.testName}-${idx}`} className="flex items-center gap-2">
                                        <span className="font-semibold text-white/90 shrink-0">{itemDef.testName}：</span>
                                        <div className="relative w-24">
                                            <input
                                                type="text"
                                                value={inputValue}
                                                onChange={(e) => {
                                                    const newValue = e.target.value;
                                                    const formattedRoutine = formatWorkoutRoutine(newValue, itemDef);
                                                    if (testItem.items.length > 1) {
                                                        const next = Array.isArray(item.workoutroutine)
                                                            ? [...item.workoutroutine]
                                                            : Array(testItem.items.length).fill('');
                                                        next[idx] = formattedRoutine;
                                                        updateItem(item.id, { workoutroutine: next });
                                                    } else {
                                                        updateItem(item.id, { workoutroutine: formattedRoutine });
                                                    }
                                                }}
                                                placeholder="请输入"
                                                className="w-full bg-transparent border-b-2 border-[#d4af37]/40 text-[#d4af37] font-semibold text-sm focus:outline-none focus:border-[#d4af37] px-1 py-1 transition-all duration-200 placeholder:text-[#d4af37]/40 placeholder:font-normal"
                                            />
                                        </div>
                                        <span className="text-[#d4af37] font-semibold shrink-0 text-sm">{itemDef.unit}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

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
        // 如果数据是 null 或 undefined，初始化为包含一个默认项的数组
        if (data.physicalDiagnosis === null || data.physicalDiagnosis === undefined) {
            const defaultTitle = presetTitles[0];
            const newItems = [{
                id: crypto?.randomUUID?.() || Date.now().toString() + Math.random(),
                title: defaultTitle,
                category: titleToCategory[defaultTitle],
                content: '',
                workoutroutine: buildDefaultWorkoutRoutine(defaultTitle),
                isCustom: false,
                grade: 'L1' // 默认等级
            }];

            // 使用静默更新，避免触发"有未保存修改"的提示
            update('physicalDiagnosis', newItems, true);
            return;
        }

        // 如果是空数组，也添加一个默认项
        if (Array.isArray(data.physicalDiagnosis) && data.physicalDiagnosis.length === 0) {
            const defaultTitle = presetTitles[0];
            const newItems = [{
                id: crypto?.randomUUID?.() || Date.now().toString() + Math.random(),
                title: defaultTitle,
                category: titleToCategory[defaultTitle],
                content: '',
                workoutroutine: buildDefaultWorkoutRoutine(defaultTitle),
                isCustom: false,
                grade: 'L1' // 默认等级
            }];

            update('physicalDiagnosis', newItems, true);
        }
    }, [data.physicalDiagnosis, update]);

    const diagnosisItems = data.physicalDiagnosis || [];
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
            category: isCustom ? '' : titleToCategory[nextTitle],
            content: '',
            workoutroutine: buildDefaultWorkoutRoutine(nextTitle),
            isCustom: isCustom,
            grade: ''
        };
        const newItems = [...diagnosisItems, newItem];
        update('physicalDiagnosis', newItems);
        setShowTitleSelector(null);
        // 自动滚动到新添加的项
        setTimeout(() => {
            const lastItem = containerRef.current?.lastElementChild;
            lastItem?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const removeItem = (id) => {
        const newItems = diagnosisItems.filter(item => item.id !== id);
        update('physicalDiagnosis', newItems);
    };

    const updateItem = (id, updates) => {
        // 如果更新包含标题，检查是否与现有的诊断或训练方案标题重复
        if (updates.title) {
            const trimmedTitle = updates.title.trim();
            const isDuplicateInDiagnosis = diagnosisItems.some(item =>
                item.id !== id && (item.title || '').trim() === trimmedTitle
            );
            const planItems = data.physicalPlan || [];
            const isDuplicateInPlan = planItems.some(item =>
                (item.title || '').trim() === trimmedTitle
            );

            if (isDuplicateInDiagnosis || isDuplicateInPlan) {
                alert(t('duplicateTitle'));
                return;
            }
        }

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

            <div ref={containerRef} className="space-y-6 pb-20">
                <AnimatePresence mode="popLayout" initial={false}>
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

