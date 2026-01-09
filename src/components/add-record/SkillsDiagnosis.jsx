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
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, ClipboardCheck, Sparkles, Plus, X, ChevronDown } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';

// 等级下拉框组件 - 自动检测位置，避免超出容器，支持滚动（技能测评使用 L1-L9）
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
            const dropdownHeight = 200; // 最大高度（L1-L9 需要更多空间）
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

// 等级选择器组件 - 封装按钮和下拉框
const LevelSelector = ({ currentLevel, onSelect, levels }) => {
    const [showGradeSelector, setShowGradeSelector] = useState(false);
    const gradeButtonRef = useRef(null);

    return (
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
                <span className="truncate">{currentLevel || 'L1'}</span>
                <ChevronDown size={12} className={cn("transition-transform shrink-0", showGradeSelector && "rotate-180")} />
            </button>

            <AnimatePresence>
                {showGradeSelector && (
                    <GradeDropdown
                        buttonRef={gradeButtonRef}
                        grades={levels}
                        onSelect={(level) => {
                            onSelect(level);
                            setShowGradeSelector(false);
                        }}
                        onClose={() => setShowGradeSelector(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const SkillsDiagnosis = ({ data, update }) => {
    const { t } = useLanguage();
    const { isListening, startListening } = useVoiceInput();
    const [listeningField, setListeningField] = useState(null);
    const [openSelector, setOpenSelector] = useState(null);

    // 同步自定义诊断项到 recordData
    const customItems = data.skillsDiagnosis || [];
    const setCustomItems = (items) => update('skillsDiagnosis', items);

    useEffect(() => {
        if (!isListening) {
            setListeningField(null);
        }
    }, [isListening]);

    // 点击外部关闭下拉菜单 - 参考心理诊断的逻辑
    useEffect(() => {
        const handleClickOutside = () => {
            if (openSelector) setOpenSelector(null);
        };
        if (openSelector) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [openSelector]);

    const updateField = (key, val) => {
        update(`diagnosisData.${key}`, val);
    };

    // 更新诊断项的等级
    const updateDiagnosisLevel = (key, level) => {
        update(`diagnosisData.${key}_level`, level);
    };

    // 获取诊断项的等级
    const getDiagnosisLevel = (key) => {
        return data.diagnosisData?.[`${key}_level`] || 'L1';
    };

    // 自定义诊断项的选项配置 - 使用翻译键（木杆位于第3位）
    const clubOptions = ["clubDriver", "clubMainIron", "clubWood", "clubPutting", "clubScrambling", "clubFinesseWedges", "clubIrons"];
    const levelOptions = ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9"]; // 技能测评支持 L1-L9

    // 添加自定义诊断项 - 默认选择"铁杆"
    const addCustomItem = () => {
        const newItem = {
            id: crypto?.randomUUID?.() || Date.now().toString(),
            club: "clubIrons", // 默认选择"铁杆"
            level: levelOptions[0],
            content: ''
        };
        setCustomItems([...customItems, newItem]);
        setOpenSelector(null); // 关闭任何打开的选择器
    };

    // 删除自定义诊断项
    const removeCustomItem = (id) => {
        setCustomItems(customItems.filter(item => item.id !== id));
    };

    // 更新自定义诊断项
    const updateCustomItem = (id, field, value) => {
        setCustomItems(customItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const categories = [
        {
            title: t('catBasic'),
            items: [
                { key: 'stance', label: t('labelStance'), placeholder: t('placeholderStance') },
            ]
        },
        {
            title: t('catSwing'),
            items: [
                { key: 'backswing', label: t('labelBackswing'), placeholder: t('placeholderBackswing') },
            ]
        },
        {
            title: '',
            items: [
                { key: 'clubDriver', label: t('clubDriver'), placeholder: t('placeholderClubDriver') },
                { key: 'clubMainIron', label: t('clubMainIron'), placeholder: t('placeholderClubMainIron') },
                { key: 'clubIrons', label: t('clubIrons'), placeholder: t('placeholderClubIrons') },
                { key: 'clubWood', label: t('clubWood'), placeholder: t('placeholderClubWood') },
                { key: 'clubPutting', label: t('clubPutting'), placeholder: t('placeholderClubPutting') },
                { key: 'clubScrambling', label: t('clubScrambling'), placeholder: t('placeholderClubScrambling') },
                { key: 'clubFinesseWedges', label: t('clubFinesseWedges'), placeholder: t('placeholderClubFinesseWedges') },
            ]
        }
    ];

    return (
        <div className="page-container px-2">
            <div className="page-header">
                <div className="page-title-group">
                    <h2 className="title-main">{t('diagnosisTitle')}</h2>
                    <p className="title-subtitle">{t('diagnosisSubtitle')}</p>
                </div>
            </div>

            <div className="space-y-6">
                {categories.map((cat, catIdx) => (
                    <div key={catIdx} className="space-y-6">
                        {catIdx !== 0 && catIdx !== 1 && (
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="category-title-line-left"></div>
                                <h3 className="category-title">{cat.title}</h3>
                                <div className="category-title-line-right"></div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6">
                            {cat.items.map((item) => (
                                <div key={item.key} className="diagnosis-card group">

                                    <div className="diagnosis-card-header">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <label className="title-selector-btn">
                                                <Sparkles size={12} className="icon-sparkles" />
                                                <span className="truncate">{item.label}</span>
                                            </label>
                                            {/* 等级选择器 */}
                                            <LevelSelector
                                                currentLevel={getDiagnosisLevel(item.key)}
                                                onSelect={(level) => {
                                                    updateDiagnosisLevel(item.key, level);
                                                }}
                                                levels={levelOptions}
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                setListeningField(item.key);
                                                startListening((text) => {
                                                    const current = data.diagnosisData?.[item.key] || "";
                                                    updateField(item.key, current + text);
                                                    setListeningField(null);
                                                });
                                            }}
                                            className={cn(
                                                "voice-btn",
                                                (isListening && listeningField === item.key) ? "active active-gold" : "inactive"
                                            )}
                                        >
                                            <Mic size={14} className={cn("icon-sm", (isListening && listeningField === item.key) && "animate-pulse")} />
                                        </button>
                                    </div>

                                    <textarea
                                        value={data.diagnosisData?.[item.key] || ''}
                                        onChange={(e) => updateField(item.key, e.target.value)}
                                        placeholder={item.placeholder}
                                        className="textarea-diagnosis"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* 自定义诊断项 */}
                <AnimatePresence>
                    {customItems.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="will-change-transform-opacity diagnosis-card group"
                        >
                            <div className="diagnosis-card-header">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {/* 球杆类型选择器 */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setOpenSelector(openSelector === `club-${item.id}` ? null : `club-${item.id}`);
                                            }}
                                            className="title-selector-btn"
                                        >
                                            <span className="truncate">{t(item.club)}</span>
                                            <ChevronDown size={12} className={cn("transition-transform shrink-0", openSelector === `club-${item.id}` && "rotate-180")} />
                                        </button>
                                        {openSelector === `club-${item.id}` && (
                                            <div
                                                className="title-selector-dropdown"
                                                onMouseDown={(e) => e.stopPropagation()}
                                            >
                                                <div className="dropdown-scroll-container">
                                                    {clubOptions.map((option) => (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                updateCustomItem(item.id, 'club', option);
                                                                setOpenSelector(null);
                                                            }}
                                                            className="title-selector-option"
                                                        >
                                                            {t(option)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 等级选择器 */}
                                    <LevelSelector
                                        currentLevel={item.level}
                                        onSelect={(level) => {
                                            updateCustomItem(item.id, 'level', level);
                                        }}
                                        levels={levelOptions}
                                    />
                                </div>

                                {/* 语音输入和删除按钮 */}
                                <div className="action-buttons-container">
                                    <button
                                        onClick={() => {
                                            setListeningField(`custom-${item.id}`);
                                            startListening((text) => {
                                                updateCustomItem(item.id, 'content', item.content + text);
                                                setListeningField(null);
                                            });
                                        }}
                                        className={cn(
                                            "voice-btn",
                                            (isListening && listeningField === `custom-${item.id}`) ? "active active-gold" : "inactive"
                                        )}
                                    >
                                        <Mic size={14} className={cn("icon-sm", (isListening && listeningField === `custom-${item.id}`) && "animate-pulse")} />
                                    </button>
                                    <button
                                        onClick={() => removeCustomItem(item.id)}
                                        className="delete-btn"
                                    >
                                        <X size={14} className="icon-sm" />
                                    </button>
                                </div>
                            </div>

                            <textarea
                                value={item.content}
                                onChange={(e) => updateCustomItem(item.id, 'content', e.target.value)}
                                placeholder={t('enterDiagnosisContent')}
                                className="textarea-diagnosis"
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SkillsDiagnosis;
