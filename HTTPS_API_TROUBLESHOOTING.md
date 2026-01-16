# HTTPS 环境下 API 调用问题排查指南

## 为什么 HTTPS 会比 HTTP 更严格？

HTTPS 环境下，浏览器会执行更严格的安全策略，导致以下问题：

### 1. **CORS 预检请求（Preflight Request）**

**问题现象：**
- GET 请求可能正常，但 POST/PUT/DELETE/PATCH 请求失败
- 浏览器控制台显示 `OPTIONS` 请求返回 404 或 405
- 某些 HTTP 方法无法使用

**原因：**
HTTPS 环境下，浏览器对**非简单请求**会先发送 `OPTIONS` 预检请求：

```javascript
// 简单请求（不需要预检）：
// - GET, HEAD, POST
// - Content-Type: text/plain, application/x-www-form-urlencoded, multipart/form-data
// - 只有标准请求头

// 非简单请求（需要预检）：
// - PUT, DELETE, PATCH
// - Content-Type: application/json
// - 自定义请求头（如 Authorization）
```

**解决方案：**

#### 方案 A：后端支持 OPTIONS 预检请求

Go 后端需要处理 OPTIONS 请求并返回正确的 CORS 头：

```go
// Go 后端示例
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 设置 CORS 头
        origin := r.Header.Get("Origin")
        w.Header().Set("Access-Control-Allow-Origin", origin) // 或 "*"
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, ngrok-skip-browser-warning")
        w.Header().Set("Access-Control-Allow-Credentials", "true")
        w.Header().Set("Access-Control-Max-Age", "3600")
        
        // 处理预检请求
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }
        
        next.ServeHTTP(w, r)
    })
}
```

#### 方案 B：Vercel 配置处理 OPTIONS 请求

在 `vercel.json` 中添加 OPTIONS 请求的处理：

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend.com/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, ngrok-skip-browser-warning"
        },
        {
          "key": "Access-Control-Max-Age",
          "value": "3600"
        }
      ]
    }
  ]
}
```

### 2. **混合内容（Mixed Content）问题**

**问题现象：**
- HTTPS 页面无法请求 HTTP 接口
- 浏览器控制台显示 "Mixed Content" 错误

**原因：**
HTTPS 页面不能请求 HTTP 资源（安全策略）

**解决方案：**
- ✅ 确保后端也使用 HTTPS
- ✅ 使用 Vercel rewrites 统一通过 HTTPS 转发

### 3. **ngrok 浏览器警告页面**

**问题现象：**
- 使用 ngrok 时，请求被重定向到警告页面
- 某些请求返回 HTML 而不是 JSON

**解决方案：**
已在 `fetchInterceptor.js` 中添加了 `ngrok-skip-browser-warning` header，确保：
1. 后端也支持这个 header
2. 在 CORS 配置中包含这个 header

### 4. **证书验证问题**

**问题现象：**
- 自签名证书或 ngrok 证书被浏览器拒绝
- 请求失败，显示证书错误

**解决方案：**
- 生产环境使用有效的 SSL 证书
- 开发环境可以临时禁用证书验证（仅开发环境）

---

## 完整解决方案

### 步骤 1：更新 `vercel.json` 配置

确保 CORS 配置完整：

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, PATCH, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization, ngrok-skip-browser-warning, X-Requested-With"
        },
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        },
        {
          "key": "Access-Control-Max-Age",
          "value": "3600"
        }
      ]
    }
  ]
}
```

### 步骤 2：确保后端支持 OPTIONS 请求

Go 后端必须：
1. 处理 OPTIONS 预检请求
2. 返回正确的 CORS 头
3. 支持所有需要的 HTTP 方法

### 步骤 3：前端处理预检请求

如果后端不支持 OPTIONS，可以在前端拦截并处理：

```javascript
// 在 fetchInterceptor.js 中添加
window.fetch = async (input, init = {}) => {
    const method = (init && init.method) || 'GET';
    const url = typeof input === 'string' ? input : input.url;
    
    // 对于非简单请求，先检查是否需要预检
    if (['PUT', 'DELETE', 'PATCH'].includes(method)) {
        // 可以在这里添加预检请求处理逻辑
        // 或者确保后端已经处理了 OPTIONS
    }
    
    // ... 原有逻辑
};
```

---

## 调试技巧

### 1. 检查网络请求

打开浏览器开发者工具 → Network 标签：
- 查看是否有 OPTIONS 请求
- 检查 OPTIONS 请求的响应状态码和头信息
- 查看实际请求（GET/POST 等）的响应

### 2. 检查 CORS 错误

浏览器控制台常见错误：
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

### 3. 测试不同 HTTP 方法

```javascript
// 测试 GET（简单请求，通常没问题）
fetch('/api/test', { method: 'GET' })

// 测试 POST with JSON（非简单请求，需要预检）
fetch('/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
})

// 测试 PUT（非简单请求，需要预检）
fetch('/api/test', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
})
```

---

## 常见问题 FAQ

**Q: 为什么 GET 请求正常，但 POST 失败？**
A: POST 请求如果包含 `Content-Type: application/json` 或自定义 header，会被视为非简单请求，需要预检。

**Q: 为什么本地开发正常，部署到 Vercel 后失败？**
A: 可能是 CORS 配置问题，或者后端没有正确处理来自 Vercel 域名的请求。

**Q: ngrok 环境下如何避免警告页面？**
A: 确保请求头包含 `ngrok-skip-browser-warning: true`，并且后端在 CORS 配置中允许这个 header。

**Q: 如何快速测试 CORS 配置？**
A: 使用 curl 测试 OPTIONS 请求：
```bash
curl -X OPTIONS https://your-backend.com/api/test \
  -H "Origin: https://your-frontend.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

---

## 推荐的最佳实践

1. ✅ **后端统一处理 CORS**：在中间件中统一处理所有 CORS 相关逻辑
2. ✅ **支持 OPTIONS 预检**：确保所有路由都支持 OPTIONS 请求
3. ✅ **使用环境变量**：区分开发和生产环境的 CORS 配置
4. ✅ **测试所有 HTTP 方法**：确保 GET、POST、PUT、DELETE、PATCH 都正常工作
5. ✅ **监控 CORS 错误**：在生产环境中监控和记录 CORS 相关错误
