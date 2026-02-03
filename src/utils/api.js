import axios from 'axios';

// 创建一个 axios 实例
const api = axios.create({
    // 这里不需要写完整的 ngrok 地址，因为 vercel 会处理 /api 的转发
    timeout: 30000,
});

// 请求拦截器：在发送请求之前做些什么
api.interceptors.request.use(config => {
    // 统一添加 ngrok 绕过警告的 header
    // 只要是 ngrok 的免费域名，这个 header 就能生效，值可以是任意字符串
    config.headers['ngrok-skip-browser-warning'] = 'true';

    // 你也可以在这里统一加 token
    // const token = localStorage.getItem('token');
    // if (token) {
    //     config.headers['Authorization'] = `Bearer ${token}`;
    // }

    return config;
}, error => {
    return Promise.reject(error);
});

export default api;