import axios from 'axios';
import { getApiBaseUrl } from './apiConfig';

// 创建一个 axios 实例
const api = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 30000,
});

// 请求拦截器：在发送请求之前做些什么
api.interceptors.request.use(config => {
    // 统一添加 ngrok 绕过警告的 header
    config.headers['ngrok-skip-browser-warning'] = 'true';

    // 默认所有请求都应该以 /api 开头，如果没有，我们手动补上（除非是绝对路径）
    if (config.url && !config.url.startsWith('http') && !config.url.startsWith('/api')) {
        config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }
    
    return config;
}, error => {
    return Promise.reject(error);
});

export default api;