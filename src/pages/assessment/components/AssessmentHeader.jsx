/**
 * 测评页面头部组件
 * 包含返回按钮和标题编辑
 */
import React from 'react';
import { ChevronLeft, Check, Edit2 } from 'lucide-react';

const AssessmentHeader = ({ 
    title, 
    isEditingTitle, 
    setIsEditingTitle, 
    onTitleChange, 
    onSave,
    onBack,
    rightContent,
    t 
}) => {
    const handleSave = async () => {
        // 先异步调用保存接口
        if (onSave) {
            try {
                await onSave();
            } catch (err) {
                console.error('Save title failed:', err);
            }
        }
        // 接口调用（或者至少发出）后再关闭编辑状态
        setIsEditingTitle(false);
    };

    const handleCheckClick = (e) => {
        // 关键：阻止默认行为和冒泡，确保 MouseDown 触发的逻辑完整执行
        e.preventDefault(); 
        e.stopPropagation();
        handleSave();
    };

    return (
        <div className="relative z-10 mb-4 sm:mb-6 flex items-center gap-2">
            <button
                onClick={onBack}
                className="btn-back shrink-0"
            >
                <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
            </button>

            {isEditingTitle ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                        autoFocus
                        className="bg-white/5 border border-[#d4af37]/30 rounded-lg px-2 sm:px-3 py-1 text-white text-2xl font-bold tracking-tighter w-full focus:outline-none focus:border-[#d4af37]"
                        value={title}
                        onChange={(e) => onTitleChange(e.target.value)}
                        onBlur={() => {
                            // 失去焦点时始终尝试保存（页面层会补默认标题）
                            handleSave();
                            setIsEditingTitle(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSave();
                                setIsEditingTitle(false);
                            } else if (e.key === 'Escape') {
                                setIsEditingTitle(false);
                            }
                        }}
                    />
                    <button 
                        onMouseDown={handleCheckClick}
                        className="p-2 text-[#d4af37] active:scale-90 transition-transform shrink-0"
                    >
                        <Check size={20} className="sm:w-6 sm:h-6" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2 flex-1 min-w-0 justify-between">
                    <div
                        className="flex items-center gap-2 group cursor-pointer min-w-0"
                        onClick={() => setIsEditingTitle(true)}
                    >
                        <h1 className="title-workbench truncate">
                            {title}
                        </h1>
                        <Edit2 size={16} className="text-[#d4af37] transition-colors shrink-0" />
                    </div>
                    {rightContent ? (
                        <div className="shrink-0 min-w-0">
                            {rightContent}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default AssessmentHeader;
