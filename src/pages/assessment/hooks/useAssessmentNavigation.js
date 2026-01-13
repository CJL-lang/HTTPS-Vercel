/**
 * 测评导航逻辑 Hook
 */
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTE_MAP, TYPE_TO_INDEX, STEP_MAP } from '../utils/assessmentConstants';

export const useAssessmentNavigation = ({
    initialPrimary,
    initialSecondary,
    isSingleMode,
    assessmentData,
    hasUnsavedChanges,
    setPendingNavigation,
    setShowUnsavedDialog,
    getNavigationState,
    navigate,
    t
}) => {
    const location = useLocation();

    // 从路由路径解析当前的一级和二级导航
    const parseRoute = () => {
        const path = location.pathname;
        const match = path.match(/\/add-record\/(physical|mental|skills|technique)\/(data|diagnosis|plan|goal)/);
        if (match) {
            return {
                primary: TYPE_TO_INDEX[match[1]] ?? getInitialPrimaryFromType(),
                secondary: STEP_MAP[match[2]] ?? initialSecondary
            };
        }
        return { primary: getInitialPrimaryFromType(), secondary: initialSecondary };
    };

    const getInitialPrimaryFromType = () => {
        if (isSingleMode && assessmentData?.type) {
            return TYPE_TO_INDEX[assessmentData.type] ?? initialPrimary;
        }
        return initialPrimary;
    };

    const routeInfo = parseRoute();
    const [activePrimary, setActivePrimary] = useState(routeInfo.primary);
    const [activeSecondary, setActiveSecondary] = useState(routeInfo.secondary);

    // 当路由变化时同步状态
    useEffect(() => {
        const info = parseRoute();
        setActivePrimary(info.primary);
        setActiveSecondary(info.secondary);
    }, [location.pathname]);

    // 一级导航标签
    const primaryTabsAll = useMemo(() => ([
        { id: 0, label: t('physicalAssessment') },
        { id: 1, label: t('mentalAssessment') },
        { id: 2, label: t('skillsAssessment') }
    ]), [t]);

    const primaryTabs = useMemo(() => {
        if (!isSingleMode) return primaryTabsAll;
        // 在单项模式下，根据当前路由或初始值确定显示的唯一标签
        const currentPrimary = activePrimary !== undefined ? activePrimary : initialPrimary;
        const tab = primaryTabsAll.find(x => x.id === currentPrimary) || primaryTabsAll[0];
        return [tab];
    }, [isSingleMode, initialPrimary, activePrimary, primaryTabsAll]);

    // 二级导航标签
    const secondaryTabs = useMemo(() => {
        const diagnosisLabel = activePrimary === 0 
            ? t('bodyDiagnosis')
            : activePrimary === 1 
                ? t('mentalDiagnosis')
                : t('skillsDiagnosis');
        
        return [
            { id: 0, label: t('dataCollection'), path: 'data' },
            { id: 1, label: diagnosisLabel, path: 'diagnosis' },
            { id: 2, label: t('trainingPlan'), path: 'plan' },
            { id: 3, label: t('goalSetting'), path: 'goal' }
        ];
    }, [activePrimary, t]);

    // 导航到指定的二级页面
    const navigateToSecondary = (secondaryId, skipCheck = false) => {
        if (!skipCheck && hasUnsavedChanges && secondaryId !== activeSecondary) {
            setPendingNavigation({ type: 'secondary', target: secondaryId });
            setShowUnsavedDialog(true);
            return;
        }
        
        const type = ROUTE_MAP[activePrimary];
        const step = secondaryTabs[secondaryId]?.path || 'data';
        if (navigate) {
            // 关键修复：必须带上当前的 location.state，否则 mode='single' 会丢失
            const state = typeof getNavigationState === 'function' ? getNavigationState() : location.state;
            navigate(`/add-record/${type}/${step}`, { state });
        }
    };

    // 导航到指定的一级页面
    const navigateToPrimary = (primaryId) => {
        const type = ROUTE_MAP[primaryId];
        if (navigate) {
            // 关键修复：必须带上当前的 location.state
            const state = typeof getNavigationState === 'function' ? getNavigationState() : location.state;
            navigate(`/add-record/${type}/data`, { state });
        }
    };

    return {
        activePrimary,
        activeSecondary,
        primaryTabs,
        secondaryTabs,
        navigateToSecondary,
        navigateToPrimary
    };
};
