import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', // 允许局域网访问
        port: 5173, // 默认端口，可根据需要修改
        strictPort: false, // 如果端口被占用，自动尝试下一个可用端口
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, '')
            },
            // 百度语音识别 API 代理
            '/baidu-token': {
                target: 'https://aip.baidubce.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/baidu-token/, '/oauth/2.0/token'),
                secure: false
            },
            '/baidu-asr': {
                target: 'https://vop.baidu.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/baidu-asr/, '/server_api'),
                secure: false
            }
        }
    },
    preview: {
        host: '0.0.0.0', // 预览模式也允许局域网访问
        port: 4173,
    }
})

