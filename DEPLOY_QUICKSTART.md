# Vercel 快速部署指南

## 前置要求

1. 已部署的 Go 后端（必须支持 HTTPS）
2. Vercel 账户（可通过 GitHub/GitLab 登录）

## 快速步骤

### 1. 配置后端地址

编辑 `vercel.json`，将 `your-go-backend-domain.com` 替换为实际的后端域名：

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-actual-backend.com/:path*"
    },
    {
      "source": "/ws/:path*",
      "destination": "https://your-actual-backend.com/ws/:path*"
    }
  ]
}
```

### 2. 通过 Vercel Dashboard 部署

1. 访问 [vercel.com](https://vercel.com)
2. 点击 **Add New Project**
3. 导入你的 GitHub/GitLab 仓库
4. 配置项目：
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (自动检测)
   - **Output Directory**: `dist` (自动检测)
5. 点击 **Deploy**

### 3. 配置环境变量（必需）

在 Vercel 项目设置 → Environment Variables 中添加：

```
VITE_WS_BASE_URL=wss://your-backend.com
```

> **重要**: 
> - `VITE_WS_BASE_URL` 是**必需的**，因为 Vercel 的 `rewrites` **不支持 WebSocket 连接转发**
> - WebSocket 必须直接连接到后端服务器
> - 确保后端支持 WSS（WebSocket Secure）协议
> - 如果后端是 ngrok，使用 `wss://your-ngrok-domain.ngrok-free.dev`

### 4. 验证部署

部署完成后：

- ✅ 前端自动获得 HTTPS 证书
- ✅ API 请求自动转发到后端
- ✅ WebSocket 连接自动转发

## 通过 CLI 部署

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel --prod
```

## 部署后检查

1. 打开部署的网站
2. 打开浏览器开发者工具（F12）
3. 检查 Network 标签：
   - API 请求应该返回 200 状态
   - 没有 CORS 错误
4. 测试 WebSocket 连接（如果使用）

## 常见问题

**Q: API 请求返回 404？**
A: 检查 `vercel.json` 中的后端域名是否正确

**Q: WebSocket 连接失败？**
A: 
1. 确保在 Vercel 环境变量中配置了 `VITE_WS_BASE_URL=wss://your-backend.com`
2. 确保后端支持 WSS（WebSocket Secure）协议
3. 检查浏览器控制台的错误信息，确认 WebSocket URL 是否正确
4. 如果使用 ngrok，确保使用 `wss://` 协议（不是 `ws://`）

**Q: 如何绑定自定义域名？**
A: 在 Vercel 项目设置 → Domains 中添加域名，按照提示配置 DNS

---

📖 详细文档请查看 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
