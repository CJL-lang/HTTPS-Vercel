/**
 * 通用请求封装工具
 * 统一处理所有 HTTP 请求，自动添加 ngrok header 和 baseURL
 */

/**
 * 获取 API 基础 URL
 * 优先读取 VITE_API_BASE_URL 环境变量，否则使用空字符串（同域请求）
 */
const getBaseURL = () => {
    return import.meta.env.VITE_API_BASE_URL || '';
};

/**
 * 构建完整 URL
 * @param {string} url - 请求路径（如 '/api/users' 或 'api/users'）
 * @param {object} query - 查询参数对象
 * @returns {string} 完整的 URL
 */
const buildURL = (url, query = {}) => {
    const baseURL = getBaseURL();

    // 处理路径：确保以 / 开头
    let path = url.startsWith('/') ? url : `/${url}`;

    // 如果有 baseURL，拼接完整 URL
    let fullURL = baseURL ? `${baseURL}${path}` : path;

    // 处理查询参数
    if (query && Object.keys(query).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                searchParams.append(key, String(value));
            }
        });
        const queryString = searchParams.toString();
        if (queryString) {
            fullURL += (fullURL.includes('?') ? '&' : '?') + queryString;
        }
    }

    return fullURL;
};

/**
 * 判断是否为 FormData
 */
const isFormData = (value) => {
    return value instanceof FormData;
};

/**
 * 通用请求函数
 * @param {string} url - 请求路径（如 '/api/users'）
 * @param {object} options - 请求选项
 * @param {string} options.method - HTTP 方法（GET, POST, PUT, DELETE, PATCH），默认 'GET'
 * @param {object} options.headers - 自定义请求头（会与默认请求头合并）
 * @param {object} options.query - 查询参数对象（自动拼接到 URL）
 * @param {object|FormData|string} options.body - 请求体（对象会自动 JSON.stringify）
 * @returns {Promise<any>} 响应数据（JSON 或文本）
 * @throws {Error} 非 2xx 状态码时抛出错误
 * 
 * @example
 * // GET 请求
 * const data = await request('/api/users', { query: { page: 1 } });
 * 
 * @example
 * // POST 请求
 * const result = await request('/api/login', {
 *   method: 'POST',
 *   body: { username: 'admin', password: '123456' }
 * });
 * 
 * @example
 * // 带自定义 header
 * const data = await request('/api/profile', {
 *   headers: { 'Authorization': 'Bearer token123' }
 * });
 */
export const request = async (url, options = {}) => {
    const {
        method = 'GET',
        headers = {},
        query = {},
        body = null
    } = options;

    // 构建完整 URL
    const fullURL = buildURL(url, query);

    // 构建请求头
    const requestHeaders = new Headers();

    // 1. 自动添加 ngrok-skip-browser-warning header（所有请求都需要）
    requestHeaders.set('ngrok-skip-browser-warning', 'true');

    // 2. 自动添加 Content-Type（如果 body 是对象且不是 FormData）
    if (body !== null && body !== undefined) {
        if (!isFormData(body) && typeof body === 'object') {
            // 只有对象类型才设置 Content-Type: application/json
            // FormData 会自动设置 multipart/form-data，不需要手动设置
            if (!requestHeaders.has('Content-Type')) {
                requestHeaders.set('Content-Type', 'application/json');
            }
        }
    }

    // 3. 合并用户自定义 headers
    if (headers && typeof headers === 'object') {
        Object.entries(headers).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                requestHeaders.set(key, String(value));
            }
        });
    }

    // 准备请求体
    let requestBody = null;
    if (body !== null && body !== undefined) {
        if (isFormData(body) || typeof body === 'string') {
            // FormData 或字符串直接使用
            requestBody = body;
        } else if (typeof body === 'object') {
            // 对象自动 JSON.stringify
            requestBody = JSON.stringify(body);
        } else {
            requestBody = String(body);
        }
    }

    // 发起请求
    let response;

    try {
        response = await fetch(fullURL, {
            method: method.toUpperCase(),
            headers: requestHeaders,
            body: requestBody
        });
    } catch (error) {
        // 网络错误或其他 fetch 错误
        throw new Error(`Request failed: ${error.message}`);
    }

    // 处理非 2xx 状态码
    if (!response.ok) {
        // 读取错误响应文本
        let errorText = '';
        try {
            errorText = await response.text();
        } catch (e) {
            // 如果读取失败，使用空字符串
        }

        const error = new Error(`Request failed with status ${response.status}`);
        error.status = response.status;
        error.url = fullURL;
        error.responseText = errorText;
        throw error;
    }

    // 处理响应数据
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        try {
            return await response.json();
        } catch (parseError) {
            // JSON 解析失败，返回错误
            console.warn('Failed to parse JSON response:', parseError);
            throw new Error(`Failed to parse JSON response: ${parseError.message}`);
        }
    } else {
        // 非 JSON 响应，返回文本
        return await response.text();
    }
};

// 导出便捷方法
export const get = (url, options = {}) => {
    return request(url, { ...options, method: 'GET' });
};

export const post = (url, options = {}) => {
    return request(url, { ...options, method: 'POST' });
};

export const put = (url, options = {}) => {
    return request(url, { ...options, method: 'PUT' });
};

export const del = (url, options = {}) => {
    return request(url, { ...options, method: 'DELETE' });
};

export const patch = (url, options = {}) => {
    return request(url, { ...options, method: 'PATCH' });
};

export default request;
