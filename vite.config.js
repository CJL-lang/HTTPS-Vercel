import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        // https: true, // 如果后端不支持HTTPS，先注释掉
        host: '0.0.0.0', // 允许局域网访问
        port: 5173, // 默认端口，可根据需要修改
        strictPort: false, // 如果端口被占用，自动尝试下一个可用端口
        cors: true, // 允许跨域请求
        proxy: {
            '/api': {
                target: 'http://8.148.244.222:8081',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, ''),
                configure: (proxy) => {
                    proxy.on('proxyReq', (proxyReq) => {
                        proxyReq.setHeader('ngrok-skip-browser-warning', 'true')
                    })
                }
            },
            '/ws': {
                target: 'ws://8.148.244.222:8081',
                changeOrigin: true,
                secure: false,
                ws: true,
                configure: (proxy) => {
                    proxy.on('proxyReq', (proxyReq) => {
                        proxyReq.setHeader('ngrok-skip-browser-warning', 'true')
                    })
                }
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
            },
            // 百度语音合成 API 代理
            '/baidu-tts': {
                target: 'https://tsn.baidu.com',
                changeOrigin: true,
                rewrite: (path) => '/text2audio',
                secure: false
            }
        }
    },
    preview: {
        host: '0.0.0.0', // 预览模式也允许局域网访问
        port: 9000,      // 模拟服务器运行在 9000 端口
        strictPort: true,
        cors: true,     // 允许预览下的跨域
        proxy: {
            '/api': {
                target: 'http://8.148.244.222:8081',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, ''),
                configure: (proxy) => {
                    proxy.on('proxyReq', (proxyReq) => {
                        proxyReq.setHeader('ngrok-skip-browser-warning', 'true')
                    })
                }
            },
            '/ws': {
                target: 'ws://8.148.244.222:8081',
                changeOrigin: true,
                secure: false,
                ws: true,
                configure: (proxy) => {
                    proxy.on('proxyReq', (proxyReq) => {
                        proxyReq.setHeader('ngrok-skip-browser-warning', 'true')
                    })
                }
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
            },
            '/baidu-tts': {
                target: 'https://tsn.baidu.com',
                changeOrigin: true,
                rewrite: (path) => '/text2audio',
                secure: false
            }
        }
    }
})

