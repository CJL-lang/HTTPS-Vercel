# Vercel 部署指南

本指南说明如何将 React 前端和 Go 后端部署到 Vercel，并启用 HTTPS。

## 部署架构

### 方案一：前后端分离部署（推荐）

- **前端（React）**: 部署在 Vercel
- **后端（Go）**: 单独部署在其他平台（如 Railway、Fly.io、Heroku、或自己的服务器）

### 方案二：全栈 Vercel 部署

- **前端（React）**: 部署在 Vercel
- **后端（Go）**: 使用 Vercel Serverless Functions（需将 Go 后端转换为 serverless functions）

---

## 方案一：前后端分离部署（推荐）

### 1. 前端部署到 Vercel

#### 步骤 1：准备项目

确保项目根目录有：
- ✅ `vercel.json` (已创建)
- ✅ `package.json` (已存在)
- ✅ `.vercelignore` (已创建)

#### 步骤 2：安装 Vercel CLI（可选）

```bash
npm i -g vercel
```

#### 步骤 3：登录 Vercel

```bash
vercel login
```

#### 步骤 4：部署

```bash
# 部署到生产环境
vercel --prod

# 或者通过 GitHub/GitLab 集成自动部署
```

#### 步骤 5：配置环境变量

在 Vercel 项目设置中添加环境变量：

**必需的环境变量：**
```env
VITE_API_BASE_URL=https://your-go-backend-domain.com
VITE_WS_BASE_URL=wss://your-go-backend-domain.com
```

**可选的环境变量：**
```env
VITE_BAIDU_API_KEY=your_baidu_api_key
VITE_BAIDU_SECRET_KEY=your_baidu_secret_key
```

#### 步骤 6：更新 vercel.json

修改 `vercel.json` 中的 `rewrites` 部分，将后端域名替换为实际的后端地址：

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-actual-backend-domain.com/:path*"
    },
    {
      "source": "/ws/:path*",
      "destination": "https://your-actual-backend-domain.com/ws/:path*"
    }
  ]
}
```

### 2. Go 后端部署（其他平台）

#### 选项 A: Railway 部署

1. 访问 [Railway](https://railway.app)
2. 创建新项目，连接 GitHub 仓库
3. 添加 Go 服务
4. 配置环境变量
5. Railway 会自动提供 HTTPS 域名

#### 选项 B: Fly.io 部署

```bash
# 安装 flyctl
curl -L https://fly.io/install.sh | sh

# 登录
fly auth login

# 初始化（在后端项目目录）
fly launch

# 部署
fly deploy
```

#### 选项 C: 自有服务器

确保：
- Go 后端运行在支持 HTTPS 的服务器上
- 配置 Nginx 反向代理
- 使用 Let's Encrypt 获取 SSL 证书

---

## 方案二：全栈 Vercel 部署（使用 Serverless Functions）

### 1. 创建 API 目录结构

如果要将 Go 后端转换为 Vercel Serverless Functions，需要创建 `api/` 目录：

```
project-root/
├── api/
│   └── [route].go  # 或根据路由创建多个文件
├── src/
├── vercel.json
└── package.json
```

### 2. 转换 Go 后端为 Serverless Functions

Vercel 支持 Go Serverless Functions，但需要遵循特定格式：

**示例：`api/users.go`**
```go
package handler

import (
    "encoding/json"
    "net/http"
)

func Handler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "message": "Hello from Vercel Go Function",
    })
}
```

### 3. 更新 vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.go",
      "use": "@vercel/go"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ]
}
```

---

## HTTPS 配置

Vercel **自动提供 HTTPS** 和 SSL 证书，无需额外配置：

- ✅ 所有部署自动启用 HTTPS
- ✅ 自动续期 SSL 证书
- ✅ 支持自定义域名（需要配置 DNS）

### 自定义域名配置

1. 在 Vercel 项目设置中添加域名
2. 按照提示配置 DNS 记录
3. Vercel 会自动申请 SSL 证书

---

## 环境变量管理

### 在 Vercel 中添加环境变量

1. 进入项目设置 → Environment Variables
2. 添加变量：
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-domain.com`
   - **Environment**: 选择 Production、Preview、Development

### 在代码中使用环境变量

Vite 要求环境变量以 `VITE_` 开头才能在客户端访问：

```javascript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
```

---

## 部署检查清单

- [ ] `vercel.json` 已配置
- [ ] `.vercelignore` 已创建
- [ ] 环境变量已在 Vercel 中设置
- [ ] Go 后端已单独部署并获取 HTTPS URL
- [ ] `vercel.json` 中的后端 URL 已更新
- [ ] 前端代码中的 API 调用使用环境变量
- [ ] 测试部署后的 API 连接

---

## 常见问题

### 1. CORS 错误

确保后端设置了正确的 CORS 头：
```go
w.Header().Set("Access-Control-Allow-Origin", "https://your-frontend-domain.vercel.app")
w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
```

### 2. WebSocket 连接失败

确保：
- 后端支持 WSS (WebSocket Secure)
- `vercel.json` 中配置了 `/ws` 的 rewrite
- 前端使用 `wss://` 协议连接

### 3. 环境变量未生效

- 确保变量名以 `VITE_` 开头
- 重新部署项目（环境变量更改需要重新部署）
- 检查变量是否添加到正确的环境（Production/Preview）

---

## 快速部署命令

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 首次部署（会创建项目）
vercel

# 4. 部署到生产环境
vercel --prod

# 5. 查看部署日志
vercel logs
```

---

## 参考链接

- [Vercel 文档](https://vercel.com/docs)
- [Vercel 环境变量](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Go Functions](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/go)
- [Railway 文档](https://docs.railway.app/)
- [Fly.io 文档](https://fly.io/docs/)
