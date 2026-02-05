# 宝塔面板 (Baota) 部署与 Nginx 配置指南

本指南旨在帮助您将编译后的前端项目 (`dist`) 部署到阿里云宝塔面板，并配置 Nginx 以支持 SPA 路由和后端 API 代理。

## 1. 准备工作

1. 在本地运行 `npm run build` 生成 `dist` 文件夹。
2. 将 `dist` 文件夹内的 **所有内容** 上传至宝塔面板指定的网站根目录（例如 `/www/wwwroot/your-project/`）。

## 2. Nginx 核心配置

在宝塔面板中，点击 **【网站】** -> **【设置】** -> **【配置文件】**，在 `server` 块中添加或修改以下内容：

server {
    listen 80;
    server_name 8.148.244.222; # 你的IP
    index index.html index.htm default.php default.htm default.html;
    root /www/wwwroot/8.148.244.222; # 宝塔默认网站根目录，请确保文件传对了位置

    # ===============================================
    # 1. 核心配置：解决 React 路由刷新 404
    # ===============================================
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # ===============================================
    # 2. 接口反向代理
    # ===============================================
    location /api/ {
        # 走内网环回地址，速度最快
        proxy_pass http://127.0.0.1:8080/; 
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # ===============================================
    # 3. WebSocket 代理 (关键优化)
    # ===============================================
    location /ws/ {
        proxy_pass http://127.0.0.1:8080/ws/;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        
        # 🔴【重要】防止 AI 生成报告时间过长导致连接断开 🔴
        proxy_read_timeout 3600s; 
        proxy_send_timeout 3600s;
    }
    
    # ===============================================
    # 4. 百度 AI 语音代理 (必须有，否则语音功能失效)
    # ===============================================
    
    # 鉴权 Token
    location /baidu-token {
        proxy_pass https://aip.baidubce.com/oauth/2.0/token;
        proxy_ssl_server_name on; # 必须开启 SSL 名称验证
        proxy_set_header Host aip.baidubce.com;
    }
    
    # 语音识别 (ASR)
    location /baidu-asr {
        proxy_pass https://vop.baidu.com/server_api;
        proxy_ssl_server_name on;
        proxy_set_header Host vop.baidu.com;
    }
    
    # 语音合成 (TTS)
    location /baidu-tts {
        proxy_pass https://tsn.baidu.com/text2audio;
        proxy_ssl_server_name on;
        proxy_set_header Host tsn.baidu.com;
    }
    
    # 日志
    access_log  /www/wwwlogs/8.148.244.222.log;
    error_log  /www/wwwlogs/8.148.244.222.error.log;

}