# ngrok 拦截页面问题解决方案

## 问题说明

即使添加了 `ngrok-skip-browser-warning: true` header，仍然出现 ngrok 拦截页面（ERR_NGROK_6024）。

## 问题原因

1. **浏览器直接访问**：如果你在浏览器地址栏直接访问 `https://unwisely-unaudited-lovetta.ngrok-free.dev`，浏览器会显示拦截页面。这是浏览器级别的行为，不是 fetch 请求。

2. **环境变量配置**：如果设置了 `VITE_API_BASE_URL=https://unwisely-unaudited-lovetta.ngrok-free.dev`，`request()` 函数会直接请求 ngrok URL，而不是通过 Vite proxy。

## 解决方案

### ✅ 方案 1：使用 Vite Proxy（推荐，最简单）

**不要设置 `VITE_API_BASE_URL` 环境变量**，让所有请求走 Vite proxy：

1. **删除或注释掉 `.env.local` 中的 `VITE_API_BASE_URL`**：
   ```bash
   # .env.local
   # VITE_API_BASE_URL=https://unwisely-unaudited-lovetta.ngrok-free.dev  # 注释掉这行
   ```

2. **确保 `vite.config.js` 中的 proxy 配置正确**（已配置）：
   ```javascript
   proxy: {
       '/api': {
           target: 'https://unwisely-unaudited-lovetta.ngrok-free.dev',
           changeOrigin: true,
           rewrite: (path) => path.replace(/^\/api/, ''),
           configure: (proxy) => {
               proxy.on('proxyReq', (proxyReq) => {
                   proxyReq.setHeader('ngrok-skip-browser-warning', 'true')
               })
           }
       }
   }
   ```

3. **使用相对路径请求**：
   ```javascript
   import request from '../utils/request';
   
   // 使用 /api 开头的路径，会自动走 Vite proxy
   const data = await request('/api/users');
   ```

**优点：**
- ✅ Vite proxy 会自动添加 `ngrok-skip-browser-warning` header
- ✅ 不会出现拦截页面
- ✅ 开发环境配置简单

### ⚠️ 方案 2：直接访问 ngrok URL（不推荐）

如果必须设置 `VITE_API_BASE_URL`：

1. **确保 `.env.local` 中设置了环境变量**：
   ```bash
   VITE_API_BASE_URL=https://unwisely-unaudited-lovetta.ngrok-free.dev
   ```

2. **`request()` 函数会自动添加 header**（已实现）

3. **重要限制**：
   - ✅ fetch 请求会正常工作（header 已添加）
   - ❌ 浏览器直接访问 ngrok URL 仍会显示拦截页面（这是浏览器行为，无法避免）

**注意：** 如果使用此方案，不要直接在浏览器地址栏访问 ngrok URL。

## 验证方法

### 检查请求是否添加了 header

1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 发起一个 API 请求
4. 点击请求，查看 Request Headers
5. 确认是否有 `ngrok-skip-browser-warning: true`

### 检查是否走 Vite proxy

如果使用方案 1（Vite proxy），请求 URL 应该是：
- ✅ `http://localhost:5173/api/users`（相对路径，走 proxy）
- ❌ `https://unwisely-unaudited-lovetta.ngrok-free.dev/users`（绝对路径，不走 proxy）

## 常见问题

### Q: 为什么设置了 header 还是出现拦截页面？

**A:** 可能的原因：
1. 你在浏览器地址栏直接访问了 ngrok URL（浏览器行为，无法避免）
2. 设置了 `VITE_API_BASE_URL`，请求直接访问 ngrok，但 header 没有正确发送
3. 某些浏览器扩展或安全设置阻止了 header

### Q: 如何确认 header 是否正确发送？

**A:** 
1. 打开浏览器开发者工具（F12）
2. Network 标签 → 找到 API 请求
3. 查看 Request Headers，确认有 `ngrok-skip-browser-warning: true`

### Q: 生产环境怎么办？

**A:** 
- 生产环境应该使用固定域名（不是 ngrok）
- 如果必须使用 ngrok，考虑升级到付费版（无拦截页面）

## 推荐配置

**开发环境（`.env.local`）：**
```bash
# 不设置 VITE_API_BASE_URL，使用 Vite proxy
# VITE_API_BASE_URL=
```

**生产环境（Vercel 环境变量）：**
```bash
# 使用固定后端域名（不是 ngrok）
VITE_API_BASE_URL=https://api.yourdomain.com
```

## 总结

- ✅ **最佳实践**：不设置 `VITE_API_BASE_URL`，使用 Vite proxy
- ✅ **`request()` 函数已自动添加 header**，无需手动配置
- ❌ **不要直接在浏览器访问 ngrok URL**（会显示拦截页面）
