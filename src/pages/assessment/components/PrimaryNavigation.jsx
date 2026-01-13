/**
 * 一级导航组件（步骤条）
 */
import React from 'react';
import { Check } from 'lucide-react';
import styles from '../AddRecordPage.module.css';

const PrimaryNavigation = ({ primaryTabs, activePrimary, isSingleMode = false, hideSinglePrimaryLabel = false }) => {
    const isSinglePrimary = isSingleMode && Array.isArray(primaryTabs) && primaryTabs.length === 1;

    if (isSinglePrimary) {
        if (hideSinglePrimaryLabel) return null;
        return (
            <div className="relative z-10 mb-4 sm:mb-6 px-2 sm:px-4">
                <div className="flex justify-center">
                    <span className="text-base sm:text-lg font-semibold text-white">
                        {primaryTabs[0]?.label}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative z-10 mb-4 sm:mb-6 px-2 sm:px-4">
            <div className="flex relative">
                {/* Background Line */}
                <div
                    className={`absolute top-[14px] sm:top-[18px] h-[2px] surface -z-10 ${styles.progressLine}`}
                    style={{
                        left: `${100 / (primaryTabs.length * 2)}%`,
                        right: `${100 / (primaryTabs.length * 2)}%`
                    }}
                />

                {primaryTabs.map((tab) => (
                    <div
                        key={tab.id}
                        className="flex-1 flex flex-col items-center group cursor-default"
                    >
                        <div className={`
                            w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500
                            ${activePrimary === tab.id
                                ? 'bg-[#d4af37] border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.5)]'
                                : activePrimary > tab.id
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'bg-[#1a1a1a] border-white/20'}
                        `}>
                            {activePrimary > tab.id ? (
                                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            ) : (
                                <span className={`text-[11px] sm:text-xs font-bold ${activePrimary === tab.id ? 'text-black' : 'text-white/40'}`}>
                                    {tab.id + 1}
                                </span>
                            )}
                        </div>
                        <div className="h-7 sm:h-8 mt-1.5 sm:mt-2 flex items-center justify-center">
                            <span className={`
                                transition-colors duration-300 text-center leading-tight px-0.5 sm:px-1
                                ${activePrimary === tab.id ? 'text-xs sm:text-sm font-semibold text-white' : 'text-[11px] sm:text-[12px] font-medium text-white'}
                            `}>
                                {tab.label}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Active Progress Line */}
                <div
                    className={`absolute top-[14px] sm:top-[18px] h-[2px] bg-[#d4af37] -z-10 ${styles.activeProgressLine}`}
                    style={{
                        left: `${100 / (primaryTabs.length * 2)}%`,
                        width: (() => {
                            if (primaryTabs.length <= 1) return '0%';
                            const displayIdx = primaryTabs.findIndex(x => x.id === activePrimary);
                            const safeIdx = displayIdx < 0 ? 0 : displayIdx;
                            return `${(safeIdx / primaryTabs.length) * 100}%`;
                        })()
                    }}
                />
            </div>
        </div>
    );
};

export default PrimaryNavigation;
