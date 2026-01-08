/**
 * 未保存变更检测 Hook
 * 负责检测数据变更并提供保存提示
 */
import { useState, useEffect } from 'react';

export const useUnsavedChanges = (recordData, initialDataSnapshot, t) => {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    // 监听数据变化以设置hasUnsavedChanges
    useEffect(() => {
        if (initialDataSnapshot) {
            const currentSnapshot = JSON.stringify(recordData);
            setHasUnsavedChanges(currentSnapshot !== initialDataSnapshot);
        }
    }, [recordData, initialDataSnapshot]);

    // 浏览器关闭/刷新提示
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = t('unsavedChangesWarning');
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges, t]);

    return {
        hasUnsavedChanges,
        setHasUnsavedChanges,
        showUnsavedDialog,
        setShowUnsavedDialog,
        pendingNavigation,
        setPendingNavigation
    };
};
