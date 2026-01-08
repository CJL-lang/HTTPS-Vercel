/**
 * 二级导航组件（标签页）
 */
import React from 'react';

const SecondaryNavigation = ({ secondaryTabs, activeSecondary, onNavigate }) => {
    return (
        <div className="relative z-10 mb-4 sm:mb-6 px-2">
            <div className="flex surface-strong rounded-xl sm:rounded-2xl p-0.5 sm:p-1 border border-white/10 shadow-2xl">
                {secondaryTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onNavigate(tab.id)}
                        className={`
                            flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[12px] font-bold transition-all duration-300 px-1
                            ${activeSecondary === tab.id
                                ? 'bg-[#d4af37] text-black shadow-lg'
                                : 'text-white/40 hover:text-white/60'}
                        `}
                    >
                        <span className="truncate block">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SecondaryNavigation;
