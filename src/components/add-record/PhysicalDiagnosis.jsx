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
import { Mic, Sparkles, Plus, X, ChevronDown, Lightbulb } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useLanguage } from '../../utils/LanguageContext';
import translations from '../../utils/i18n';
import { cn } from '../../utils/cn';
import { requestAIAdvice } from '../../pages/assessment/utils/aiAdviceApi';

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
// 使用 i18n key，在渲染时通过 t(key) 转换为当前语言。
// 同时保留 key 用于解析时做多语言兼容，避免切换语言后解析失败导致“标题被塞进输入框”。
const titleToTestItem = {
    "柔软度等级": {
        items: [
            { testNameKey: 'thoracicRotation', unitKey: 'Point' },
            { testNameKey: 'hipRotation', unitKey: 'Point' },
            { testNameKey: 'shoulderMobility', unitKey: 'Point' },
            { testNameKey: 'spinalFlexibility', unitKey: 'Point' },
            { testNameKey: 'lowerLimbFlexibility', unitKey: 'Point' }
        ]
    },
    "协调性等级": {
        testNameKey: 'jumpRope30Seconds',
        unitKey: 'count'
    },
    "上肢力量等级": {
        testNameKey: 'oneMinutePushUps',
        unitKey: 'quantity'
    },
    "下肢力量等级": {
        testNameKey: 'standingLongJump',
        unitKey: 'meter'
    },
    "旋转爆发力等级": {
        testNameKey: 'medicineBallSideThrow',
        unitKey: 'meter'
    },
    "核心稳定性等级": {
        testNameKey: 'PlankHold',
        unitKey: 'second'
    },
    "心肺耐力": {
        testNameKey: 'shuttleRun20mVO2max',
        unitKey: 'mlPerKgPerMin'
    }
};

const getTranslationValue = (lang, key) => {
    return translations?.[lang]?.[key] || key;
};

const uniqNonEmpty = (arr) => {
    const seen = new Set();
    return (arr || []).filter(Boolean).filter((v) => {
        const s = v.toString();
        if (seen.has(s)) return false;
        seen.add(s);
        return true;
    });
};

const PLEASE_ENTER_CANDIDATES = uniqNonEmpty([
    getTranslationValue('zh', 'pleaseEnter'),
    getTranslationValue('en', 'pleaseEnter'),
    '请输入',
    'Please enter',
    'Enter'
].map(s => s && s.toString().trim()));

const isPleaseEnterText = (value) => {
    const v = (value ?? '').toString().trim();
    if (!v) return true;
    return PLEASE_ENTER_CANDIDATES.some((c) => c && v === c.toString().trim());
};

// 获取测试项目显示格式
const getTestItemDisplay = (title, t) => {
    let keyTitle = title;
    let testItem = titleToTestItem[title];

    // 如果直接匹配失败，尝试通过翻译键反向查找（解决英文标题匹配不到配置的问题）
    if (!testItem && typeof t === 'function') {
        const entry = Object.entries(titleToTranslationKey).find(([cnTitle, key]) => {
            // 检查翻译后的值是否匹配，或者 key 本身是否匹配
            return t(key) === title || key === title || t(key)?.toUpperCase() === title?.toUpperCase();
        });
        if (entry) {
            keyTitle = entry[0];
            testItem = titleToTestItem[keyTitle];
        }
    }

    if (!testItem) return null;

    const translate = (key) => (typeof t === 'function' ? t(key) : key);

    const toDisplayItem = ({ testNameKey, unitKey }) => {
        const testNameDisplay = translate(testNameKey);
        const unitDisplay = translate(unitKey);

        const testNameCandidates = uniqNonEmpty([
            testNameDisplay,
            getTranslationValue('zh', testNameKey),
            getTranslationValue('en', testNameKey),
            testNameKey
        ]);

        const unitCandidates = uniqNonEmpty([
            unitDisplay,
            getTranslationValue('zh', unitKey),
            getTranslationValue('en', unitKey),
            unitKey
        ]);

        return {
            testName: testNameDisplay,
            unit: unitDisplay,
            testNameKey,
            unitKey,
            testNameCandidates,
            unitCandidates
        };
    };

    if (Array.isArray(testItem.items) && testItem.items.length > 0) {
        return { items: testItem.items.map(toDisplayItem) };
    }

    return {
        items: [toDisplayItem({ testNameKey: testItem.testNameKey, unitKey: testItem.unitKey })]
    };
};

// 从 workoutroutine 字符串中解析出输入值
const parseWorkoutRoutineValue = (workoutroutine, testItem, itemIndex = 0) => {
    if (!testItem) return '';
    const target = Array.isArray(workoutroutine)
        ? workoutroutine[itemIndex]
        : (itemIndex === 0 ? workoutroutine : '');
    if (!target) return '';

    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const extractNumeric = (raw) => {
        const s = (raw ?? '').toString().trim();
        if (isPleaseEnterText(s)) return '';

        // 优先匹配 "10." 或 "-" 这种未完成输入的格式
        // 解决 "10." 被 match(/-?\d*\.?\d+/) 匹配为 "10" 导致无法输入小数点的问题
        // 同时支持单独输入负号
        if (/^-?(\d+\.?)?$/.test(s)) return s;

        const m = s.match(/-?\d*\.?\d+/); // 至少需要有一位数字
        return m && m[0] ? m[0] : '';
    };

    const testNameCandidates = Array.isArray(testItem.testNameCandidates) && testItem.testNameCandidates.length
        ? testItem.testNameCandidates
        : [testItem.testName];
    const unitCandidates = Array.isArray(testItem.unitCandidates) && testItem.unitCandidates.length
        ? testItem.unitCandidates
        : [testItem.unit];

    // 1) 尝试严格匹配：<name>：<value> <unit>
    for (const name of testNameCandidates) {
        const escapedName = escapeRegExp(name);
        for (const unit of unitCandidates) {
            const escapedUnit = escapeRegExp(unit);
            const pattern = new RegExp(`^\\s*${escapedName}[：:]\\s*(.+?)\\s*${escapedUnit}\\s*$`, 'i');
            const match = target.match(pattern);
            if (!match) continue;
            const value = (match[1] ?? '').trim();
            const numeric = extractNumeric(value);
            return numeric;
        }
    }

    // 2) 宽松提取：如果有分隔符，取分隔符后内容，并去掉末尾 unit。
    const delimiterIndex = target.indexOf('：') >= 0 ? target.indexOf('：') : target.indexOf(':');
    if (delimiterIndex >= 0) {
        let rest = target.slice(delimiterIndex + 1).trim();
        for (const unit of unitCandidates) {
            if (!unit) continue;
            const u = unit.toString().trim();
            if (!u) continue;
            // 支持 "30 次" / "30次" (Case insensitive)
            const unitPattern = new RegExp(`\\s*${escapeRegExp(u)}\\s*$`, 'i');
            rest = rest.replace(unitPattern, '').trim();
        }
        return extractNumeric(rest);
    }

    // 3) 兼容旧格式：仅包含单位时，剥离单位
    for (const unit of unitCandidates) {
        if (!unit) continue;
        const escapedUnit = escapeRegExp(unit);
        // Case insensitive match for unit
        const unitPattern = new RegExp(`(.+?)\\s*${escapedUnit}`, 'i');
        const unitMatch = target.match(unitPattern);
        if (unitMatch) {
            const value = (unitMatch[1] ?? '').trim();
            return extractNumeric(value);
        }
    }

    // 如果都不匹配，可能是旧格式的纯数值
    const trimmed = target.trim();
    return extractNumeric(trimmed);
};

// 格式化完整的 workoutroutine 字符串
const formatWorkoutRoutine = (inputValue, testItem, pleaseEnterText = getTranslationValue('zh', 'pleaseEnter')) => {
    if (!testItem) return '';
    const value = inputValue.trim();
    if (!value) return `${testItem.testName}：${pleaseEnterText} ${testItem.unit}`;
    return `${testItem.testName}：${value} ${testItem.unit}`;
};

const buildDefaultWorkoutRoutine = (title, t) => {
    const testItem = getTestItemDisplay(title, t);
    if (!testItem) return '';
    const pleaseEnterText = typeof t === 'function' ? t('pleaseEnter') : getTranslationValue('zh', 'pleaseEnter');
    const defaults = testItem.items.map((item) => formatWorkoutRoutine('', item, pleaseEnterText));
    return testItem.items.length > 1 ? defaults : defaults[0];
};

const parseWorkoutLineDynamic = (line) => {
    const raw = (line ?? '').toString().trim();
    if (!raw) return null;

    // Support both Chinese and English delimiters.
    const delimiterIndex = raw.indexOf('：') >= 0 ? raw.indexOf('：') : raw.indexOf(':');
    if (delimiterIndex < 0) return null;

    const testName = raw.slice(0, delimiterIndex).trim();
    const rest = raw.slice(delimiterIndex + 1).trim();
    if (!testName) return null;

    // Fix: Explicitly check for placeholder text
    if (isPleaseEnterText(rest)) {
        return { testName, value: '', unit: '' };
    }

    // Check if rest starts with any known placeholder text (e.g. "Please enter minutes")
    for (const placeholder of PLEASE_ENTER_CANDIDATES) {
        if (!placeholder) continue;
        if (rest.toLowerCase().startsWith(placeholder.toLowerCase())) {
            // Trim the placeholder from start and treat remaining as unit
            const potentialUnit = rest.slice(placeholder.length).trim();
            return { testName, value: '', unit: potentialUnit };
        }
    }

    // Extract leading number as value, remaining as unit.
    // Use stricter regex: require at least one digit
    const m = rest.match(/^(-?\d+\.?\d*|-?\d*\.\d+)(?:\s*(.*))?$/);
    if (m && m[1]) {
        const value = (m[1] ?? '').trim();
        const unit = (m[2] ?? '').trim();
        return { testName, value, unit };
    }

    // Fallback: if no digit found, check if it's "Please enter" again or treat as empty
    // If we're here, it's non-numeric content that didn't match placeholder check.
    // It's likely text. Return as is, or empty if it looks like garbage?
    // Let's assume it's the value if it's not empty.
    return { testName, value: rest, unit: '' };
};

const formatWorkoutLineDynamic = (testName, value, unit, pleaseEnterText = getTranslationValue('zh', 'pleaseEnter')) => {
    const v = (value ?? '').toString().trim();
    const u = (unit ?? '').toString().trim();
    if (!v) return `${testName}: ${pleaseEnterText}${u ? ` ${u}` : ''}`;
    return `${testName}: ${v}${u ? ` ${u}` : ''}`;
};

const buildScoresFromWorkoutRoutine = (title, workoutroutine, t) => {
    const testItem = getTestItemDisplay(title, t);
    if (testItem?.items?.length) {
        const scores = {};
        testItem.items.forEach((itemDef, idx) => {
            const value = parseWorkoutRoutineValue(workoutroutine, itemDef, idx);
            scores[itemDef.testName] = value ? `${value}${itemDef.unit}` : '';
        });
        return scores;
    }

    // Fallback: parse dynamic (e.g. English) workoutroutine lines.
    const list = Array.isArray(workoutroutine)
        ? workoutroutine
        : (workoutroutine ? [workoutroutine] : []);

    const scores = {};
    list.forEach((line) => {
        const parsed = parseWorkoutLineDynamic(line);
        if (!parsed) return;
        scores[parsed.testName] = parsed.value && !isPleaseEnterText(parsed.value)
            ? `${parsed.value}${parsed.unit ? ` ${parsed.unit}` : ''}`
            : '';
    });
    return scores;
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
    const [displayTitle, setDisplayTitle] = useState(item.isCustom ? item.title : '');
    const [showGradeSelector, setShowGradeSelector] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
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
        if (item.isCustom) {
            setDisplayTitle(item.title);
        } else {
            setDisplayTitle('');
        }
    }, [item.title, item.isCustom]);

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
                                            const testItem = isPreset ? getTestItemDisplay(finalValue, t) : null;
                                            updateItem(item.id, {
                                                title: finalValue,
                                                category: isPreset ? titleToCategory[finalValue] : '',
                                                isCustom: !isPreset,
                                                workoutroutine: isPreset ? buildDefaultWorkoutRoutine(finalValue, t) : item.workoutroutine
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
                                                    workoutroutine: buildDefaultWorkoutRoutine(title, t)
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
                                                        const testItem = isPreset ? getTestItemDisplay(finalValue, t) : null;
                                                        updateItem(item.id, {
                                                            title: finalValue,
                                                            category: isPreset ? titleToCategory[finalValue] : '',
                                                            isCustom: !isPreset,
                                                            workoutroutine: isPreset ? buildDefaultWorkoutRoutine(finalValue, t) : item.workoutroutine
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
                                                        const testItem = isPreset ? getTestItemDisplay(finalValue, t) : null;
                                                        updateItem(item.id, {
                                                            title: finalValue,
                                                            category: isPreset ? titleToCategory[finalValue] : '',
                                                            isCustom: !isPreset,
                                                            workoutroutine: isPreset ? buildDefaultWorkoutRoutine(finalValue, t) : item.workoutroutine
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
                const testItem = getTestItemDisplay(item.title, t);
                const dynamicLines = !testItem && item.workoutroutine
                    ? (Array.isArray(item.workoutroutine) ? item.workoutroutine : [item.workoutroutine])
                    : [];
                const dynamicItems = dynamicLines
                    .map(parseWorkoutLineDynamic)
                    .filter(Boolean);

                if (!testItem && dynamicItems.length === 0) return null;

                return (
                    <div className="mb-3 p-3 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg border border-[#d4af37]/30 shadow-md backdrop-blur-sm transition-all duration-300 hover:border-[#d4af37]/40">
                        <div className="space-y-2 text-sm">
                            {(testItem ? testItem.items : dynamicItems).map((itemDef, idx) => {
                                const isPreset = !!testItem;
                                const inputValue = isPreset
                                    ? parseWorkoutRoutineValue(item.workoutroutine, itemDef, idx)
                                    : (itemDef.value ?? '');

                                const testName = itemDef.testName;
                                const unit = itemDef.unit || '';

                                return (
                                    <div key={`${testName}-${idx}`} className="flex items-center gap-2">
                                        <span className="font-semibold text-white/90 shrink-0">{testName}：</span>
                                        <div className="relative w-24">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={inputValue}
                                                onChange={(e) => {
                                                    // 限制只能输入数字、小数点和负号
                                                    const rawValue = e.target.value;
                                                    // 允许空值，否则只允许数字/小数点/负号
                                                    const newValue = rawValue.replace(/[^\d.-]/g, '');

                                                    // 防止多个小数点
                                                    if ((newValue.match(/\./g) || []).length > 1) return;
                                                    // 防止多个负号或负号不在开头
                                                    if (newValue.indexOf('-') > 0 || (newValue.match(/-/g) || []).length > 1) return;

                                                    if (isPreset) {
                                                        const formattedRoutine = formatWorkoutRoutine(newValue, itemDef, t('pleaseEnter'));
                                                        if (testItem.items.length > 1) {
                                                            const next = Array.isArray(item.workoutroutine)
                                                                ? [...item.workoutroutine]
                                                                : Array(testItem.items.length).fill('');
                                                            next[idx] = formattedRoutine;
                                                            updateItem(item.id, { workoutroutine: next });
                                                        } else {
                                                            updateItem(item.id, { workoutroutine: formattedRoutine });
                                                        }
                                                        return;
                                                    }

                                                    const formatted = formatWorkoutLineDynamic(testName, newValue, unit, t('pleaseEnter'));
                                                    const next = Array.isArray(item.workoutroutine)
                                                        ? [...item.workoutroutine]
                                                        : Array(Math.max(dynamicItems.length, 1)).fill('');
                                                    next[idx] = formatted;
                                                    updateItem(item.id, { workoutroutine: next.length === 1 ? next[0] : next });
                                                }}
                                                placeholder={t('pleaseEnter')}
                                                className="w-full bg-transparent border-b-2 border-[#d4af37]/40 text-[#d4af37] font-semibold text-sm focus:outline-none focus:border-[#d4af37] px-1 py-1 transition-all duration-200 placeholder:text-[#d4af37]/40 placeholder:font-normal"
                                            />
                                        </div>
                                        {!!unit && (
                                            <span className="text-[#d4af37] font-semibold shrink-0 text-sm">{unit}</span>
                                        )}
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
                            const category = 'body';
                            const level = item.grade || '';
                            const scores = buildScoresFromWorkoutRoutine(item.title, item.workoutroutine, t);

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
                workoutroutine: buildDefaultWorkoutRoutine(defaultTitle, t),
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
                workoutroutine: buildDefaultWorkoutRoutine(defaultTitle, t),
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
            workoutroutine: buildDefaultWorkoutRoutine(nextTitle, t),
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
            if (isDuplicateInDiagnosis) {
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

