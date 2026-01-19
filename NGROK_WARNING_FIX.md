# ngrok-free 警告页面问题解决方案

## 问题原因

**ngrok-free 版本的限制：**
- ngrok 免费版**不支持**跳过浏览器警告页面
- 即使设置了 `ngrok-skip-browser-warning: true` header，ngrok-free 也不会接受
- 这会导致浏览器显示警告页面，阻止 API 请求

## 当前配置状态

✅ **已配置的内容：**
1. `fetchInterceptor.js` - 客户端自动添加 `ngrok-skip-browser-warning` header
2. `vercel.json` - CORS headers 配置完整
3. `vite.config.js` - 本地开发代理配置正确

❌ **问题：**
- ngrok-free 不接受跳过警告的 header
- 这是 ngrok 免费版的硬性限制

## 解决方案

### 方案 1：升级到 ngrok 付费版（推荐，最简单）

1. 访问 [ngrok.com](https://ngrok.com) 注册付费账户
2. 获取付费版域名（不再显示警告页面）
3. 更新 `vercel.json` 和 `vite.config.js` 中的后端地址

**优点：** 最简单，立即生效  
**缺点：** 需要付费（约 $8/月起）

### 方案 2：使用 Cloudflare Tunnel（免费替代方案）

1. 安装 Cloudflare Tunnel：
   ```bash
   # 下载 cloudflared
   # Windows: https://github.com/cloudflare/cloudflared/releases
   ```

2. 创建隧道：
   ```bash
   cloudflared tunnel create golf-backend
   ```

3. 配置并运行：
   ```bash
   cloudflared tunnel route dns golf-backend your-domain.com
   cloudflared tunnel run golf-backend
   ```

4. 更新后端地址为 Cloudflare Tunnel 域名

**优点：** 完全免费，无警告页面  
**缺点：** 需要配置 DNS

### 方案 3：部署到固定域名（最佳长期方案）

1. 将后端部署到：
   - Railway
   - Fly.io
   - Render
   - 自己的服务器

2. 使用固定域名（如 `api.yourdomain.com`）

3. 更新 `vercel.json` 和 `vite.config.js` 中的后端地址

**优点：** 最稳定，无警告页面，适合生产环境  
**缺点：** 需要部署后端

## 临时解决方案（仅限开发环境）

如果只是本地开发，可以：

1. **手动点击警告页面的 "Visit Site" 按钮**
   - 每次首次访问需要手动确认
   - 不适合生产环境

2. **使用浏览器扩展跳过警告**
   - 不推荐，可能不安全

## 验证配置

检查请求是否包含 header：
1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 查看 API 请求的 Request Headers
4. 确认是否包含 `ngrok-skip-browser-warning: true`

## 注意事项

⚠️ **重要：**
- Vercel 的 `rewrites` 会自动转发所有请求头
- 客户端代码（`fetchInterceptor.js`）已经正确添加了 header
- 问题在于 ngrok-free 不接受这个 header，这是 ngrok 的限制，不是配置问题

## 推荐行动

**生产环境：** 使用方案 3（固定域名）  
**开发环境：** 使用方案 1（ngrok 付费版）或方案 2（Cloudflare Tunnel）
