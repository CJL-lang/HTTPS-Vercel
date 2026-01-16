/**
 * 全局 Fetch 拦截器 (生产级实现)
 * 
 * 功能：
 * 1. 统一注入 Authorization Token
 * 2. 自动拦截 401 状态码并触发登出
 * 3. 防抖/锁机制：防止多个并发请求失效时重复触发登出
 * 4. 白名单机制：支持排除特定接口
 * 5. 防止重复注册
 * 6. CORS 错误检测和处理提示
 * 7. 自动注入必要的 CORS 相关 headers
 */

// 拦截器状态锁
let isInterceptorSetup = false;
let isUnauthorizedHandling = false;

// 接口白名单 (不需要注入 Token 且不触发 401 登出的接口)
const AUTH_WHITELIST = [
    '/login',
    '/register',
    '/public/'
];

/**
 * 设置全局 Fetch 拦截器
 * @param {Function} onUnauthorized - 401 时的回调函数 (通常是 handleLogout)
 * @param {Function} getToken - 获取当前最新 Token 的函数
 */
export const setupFetchInterceptor = (onUnauthorized, getToken) => {
    // 1. 防止重复注册拦截器
    if (isInterceptorSetup) {

        return () => { };
    }

    const originalFetch = window.fetch;
    isInterceptorSetup = true;

    window.fetch = async (input, init = {}) => {
        // 获取请求 URL 字符串
        const url = typeof input === 'string' ? input : input.url;
        const method = (init && init.method) || (typeof input !== 'string' && input.method) || 'GET';

        // 检查是否在白名单中
        const isWhitelisted = AUTH_WHITELIST.some(path => url.includes(path));

        // 2. 统一注入 Headers
        // 兼容 Headers 对象或普通对象
        const headers = init.headers instanceof Headers
            ? init.headers
            : new Headers(init.headers || {});

        // 2.1 注入 Authorization Header（只有不在白名单且有 token 时才注入）
        const token = getToken();
        if (token && !isWhitelisted) {
            if (!headers.has('Authorization')) {
                headers.set('Authorization', `Bearer ${token}`);
            }
        }

        // 2.2 注入 ngrok-skip-browser-warning header（用于 ngrok 后端）
        // 检查是否是 API 请求（转发到 ngrok 后端）
        if (url.startsWith('/api/') || url.startsWith('/ws/')) {
            if (!headers.has('ngrok-skip-browser-warning')) {
                headers.set('ngrok-skip-browser-warning', 'true');
            }
        }

        // 2.3 对于非简单请求，确保 Content-Type 正确设置
        // 非简单请求包括：PUT, DELETE, PATCH, 以及使用 application/json 的 POST
        const isNonSimpleRequest = ['PUT', 'DELETE', 'PATCH'].includes(method) ||
            (method === 'POST' && headers.get('Content-Type')?.includes('application/json'));

        if (isNonSimpleRequest && !headers.has('Content-Type')) {
            // 如果请求体存在且是对象，自动设置 Content-Type
            if (init.body && typeof init.body === 'object' && !(init.body instanceof FormData)) {
                headers.set('Content-Type', 'application/json');
            }
        }

        init.headers = headers;

        // DEBUG: log outgoing request for troubleshooting
        try {

        } catch (err) {
            // ignore logging errors
        }

        try {
            const response = await originalFetch(input, init);

            // DEBUG: log response status


            // 3. 拦截 401 Unauthorized
            if (response.status === 401 && !isWhitelisted) {
                // 防抖锁：确保多个并发请求只触发一次登出逻辑
                if (!isUnauthorizedHandling) {
                    isUnauthorizedHandling = true;
                    // Enhanced debug info

                    onUnauthorized();

                    // 3秒后重置锁，允许后续操作（通常页面已跳转，此为保险）
                    setTimeout(() => {
                        isUnauthorizedHandling = false;
                    }, 3000);
                } else {

                }
            }

            // 4. 检测 CORS 相关错误（虽然 fetch 不会抛出 CORS 错误，但可以检测异常响应）
            // 如果响应状态为 0 且不是真正的网络错误，可能是 CORS 问题
            if (response.status === 0 && response.type === 'opaque') {
                console.warn('[Fetch Interceptor] 可能的 CORS 错误:', {
                    url,
                    method,
                    hint: '请检查后端 CORS 配置，确保支持 OPTIONS 预检请求'
                });
            }

            return response;
        } catch (error) {
            // 5. 捕获网络错误和 CORS 错误
            // CORS 错误通常表现为 TypeError: Failed to fetch
            if (error instanceof TypeError && error.message.includes('fetch')) {
                console.error('[Fetch Interceptor] 请求失败，可能是 CORS 或网络问题:', {
                    url,
                    method,
                    error: error.message,
                    hint: '请检查：1) 后端是否支持 CORS 2) 是否支持 OPTIONS 预检请求 3) 网络连接是否正常'
                });
            }

            // 保持原始错误抛出，不破坏业务逻辑的 catch
            throw error;
        }
    };

    // 返回还原函数
    return () => {
        window.fetch = originalFetch;
        isInterceptorSetup = false;
    };
};
