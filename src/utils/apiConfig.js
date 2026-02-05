/**
 * API 配置工具
 */

// 获取 API 基础 URL
export const getApiBaseUrl = () => {
    // 优先使用环境变量
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    // 生产环境或预览模式默认使用相对路径 /api (会被 Vite 或 Nginx 代理)
    return '';
};

// 获取 WebSocket 基础 URL
export const getWsBaseUrl = () => {
    if (import.meta.env.VITE_WS_BASE_URL) {
        return import.meta.env.VITE_WS_BASE_URL;
    }
    // 自动适配协议
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // 如果是开发/预览环境，通常我们希望走代理
    return `${protocol}//${host}`;
};

// 构建完整的 API URL
export const buildApiUrl = (path) => {
    const baseUrl = getApiBaseUrl();
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    if (baseUrl) {
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        return `${cleanBaseUrl}/${cleanPath}`;
    }
    // 默认走 /api 前缀
    return `/api/${cleanPath}`;
};

// 构建完整的 WebSocket URL
export const buildWsUrl = (path) => {
    const baseUrl = getWsBaseUrl();
    // 确保路径以 /ws 开头或者符合代理规则
    let cleanPath = path;
    if (!cleanPath.startsWith('/ws') && !cleanPath.startsWith('ws/')) {
        cleanPath = cleanPath.startsWith('/') ? `/ws${cleanPath}` : `/ws/${cleanPath}`;
    } else {
        cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    }

    if (baseUrl.includes('://')) {
        const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        return `${cleanBaseUrl}${cleanPath}`;
    }
    return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${cleanPath}`;
};

// 导出默认配置
export default {
    getApiBaseUrl,
    getWsBaseUrl,
    buildApiUrl,
    buildWsUrl,
};
