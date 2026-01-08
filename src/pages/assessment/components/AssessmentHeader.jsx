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
        <div className="relative z-10 mb-4 sm:mb-6 flex items-center gap-3">
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
                            // 给点击 √ 留出足够的时间，不要因为失焦立即销毁组件
                            setTimeout(() => {
                                setIsEditingTitle((current) => {
                                    // 如果还在编辑模式（说明没有点击 √ 触发 handleSave），则由 blur 负责关闭
                                    return false;
                                });
                            }, 200);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSave();
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
                <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer flex-1 min-w-0" onClick={() => setIsEditingTitle(true)}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <h1 className="title-workbench">
                            {title || t('addRecordTitle')}
                        </h1>
                        <Edit2 size={18} className="text-[#d4af37] opacity-40 group-hover:opacity-100 transition-opacity shrink-0 sm:w-5 sm:h-5" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssessmentHeader;
