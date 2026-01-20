# request() 工具函数使用示例

本文档展示如何将现有的 `fetch` 调用替换为统一的 `request()` 函数。

## 导入方式

```javascript
import request from '../utils/request';
// 或者使用便捷方法
import { get, post, put, del, patch } from '../utils/request';
```

---

## 示例 1：POST 请求 - 登录接口

### 原代码（LoginPage.jsx）

```javascript
const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        account: username,
        password: password,
        role: role === 'consultant' ? 'consultation' : role,
    }),
});

const data = await response.json();

if (response.ok && data.token) {
    onLogin({
        username: data.user?.username || username,
        role: data.user?.role || role,
        token: data.token,
        id: data.user?.id,
        name: data.user?.name,
        email: data.user?.email
    });
} else {
    setError(data.message || t('loginFailed'));
}
```

### 替换后

```javascript
import request from '../utils/request';

try {
    const data = await request('/api/login', {
        method: 'POST',
        body: {
            account: username,
            password: password,
            role: role === 'consultant' ? 'consultation' : role,
        }
    });

    if (data.token) {
        onLogin({
            username: data.user?.username || username,
            role: data.user?.role || role,
            token: data.token,
            id: data.user?.id,
            name: data.user?.name,
            email: data.user?.email
        });
    } else {
        setError(data.message || t('loginFailed'));
    }
} catch (error) {
    // request() 会自动处理非 2xx 状态码，抛出错误
    setError(error.responseText || t('connectionError'));
}
```

### 或者使用便捷方法

```javascript
import { post } from '../utils/request';

try {
    const data = await post('/api/login', {
        body: {
            account: username,
            password: password,
            role: role === 'consultant' ? 'consultation' : role,
        }
    });
    // ... 处理响应
} catch (error) {
    setError(error.responseText || t('connectionError'));
}
```

**改进点：**
- ✅ 自动添加 `ngrok-skip-browser-warning` header
- ✅ 自动添加 `Content-Type: application/json`
- ✅ 自动 `JSON.stringify` body
- ✅ 自动解析 JSON 响应
- ✅ 自动处理错误状态码

---

## 示例 2：GET 请求 - 获取诊断数据

### 原代码（assessmentApi.js）

```javascript
const response = await fetch(`/api/diagnoses/${assessmentId}`, {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${user.token}`
    }
});

if (response.ok) {
    const data = await response.json();
    console.log('[API] GET /diagnoses success:', data);
    return pickLocalizedContent(data);
}

// 404 是正常的（新 assessment 还没有诊断数据）
if (response.status === 404) {
    return [];
}

console.warn('[API] GET /diagnoses unexpected status:', response.status);
return null;
```

### 替换后

```javascript
import request from '../utils/request';

try {
    const data = await request(`/api/diagnoses/${assessmentId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${user.token}`
        }
    });
    
    console.log('[API] GET /diagnoses success:', data);
    return pickLocalizedContent(data);
} catch (error) {
    // 404 是正常的（新 assessment 还没有诊断数据）
    if (error.status === 404) {
        return [];
    }
    
    console.warn('[API] GET /diagnoses unexpected status:', error.status);
    return null;
}
```

### 或者使用便捷方法

```javascript
import { get } from '../utils/request';

try {
    const data = await get(`/api/diagnoses/${assessmentId}`, {
        headers: {
            'Authorization': `Bearer ${user.token}`
        }
    });
    // ... 处理响应
} catch (error) {
    if (error.status === 404) {
        return [];
    }
    return null;
}
```

**改进点：**
- ✅ 自动添加 `ngrok-skip-browser-warning` header
- ✅ 自动解析 JSON 响应
- ✅ 错误对象包含 `status`、`url`、`responseText` 便于排查

---

## 示例 3：PATCH 请求 - 更新诊断数据

### 原代码（assessmentApi.js）

```javascript
const response = await fetch('/api/diagnoses', {
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
    },
    body: JSON.stringify(requestBody),
});

if (!response.ok) {
    const errText = await response.text();
    console.error('[API] updateDiagnosisToBackend failed:', response.status, errText);
}

return response.ok;
```

### 替换后

```javascript
import { patch } from '../utils/request';

try {
    await patch('/api/diagnoses', {
        headers: {
            'Authorization': `Bearer ${user.token}`
        },
        body: requestBody
    });
    return true;
} catch (error) {
    console.error('[API] updateDiagnosisToBackend failed:', error.status, error.responseText);
    return false;
}
```

**改进点：**
- ✅ 自动添加 `ngrok-skip-browser-warning` header
- ✅ 自动添加 `Content-Type: application/json`
- ✅ 自动 `JSON.stringify` body
- ✅ 简化错误处理

---

## 示例 4：带查询参数的 GET 请求

### 原代码

```javascript
const url = `/api/users?page=${page}&limit=${limit}`;
const response = await fetch(url, {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
const data = await response.json();
```

### 替换后

```javascript
import { get } from '../utils/request';

const data = await get('/api/users', {
    query: {
        page: page,
        limit: limit
    },
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

**改进点：**
- ✅ 自动处理 URL 编码
- ✅ 自动过滤 null/undefined 参数

---

## 示例 5：FormData 上传

### 原代码

```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('userId', userId);

const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
});
```

### 替换后

```javascript
import { post } from '../utils/request';

const formData = new FormData();
formData.append('file', file);
formData.append('userId', userId);

const result = await post('/api/upload', {
    body: formData
});
```

**改进点：**
- ✅ 自动识别 FormData，不设置 `Content-Type`（浏览器会自动设置）
- ✅ 自动添加 `ngrok-skip-browser-warning` header

---

## 错误处理

`request()` 函数在遇到非 2xx 状态码时会抛出错误，错误对象包含以下属性：

```javascript
try {
    const data = await request('/api/some-endpoint');
} catch (error) {
    console.error('Status:', error.status);        // HTTP 状态码，如 404, 500
    console.error('URL:', error.url);             // 完整请求 URL
    console.error('Response:', error.responseText); // 响应文本内容
    console.error('Message:', error.message);      // 错误消息
}
```

---

## 环境变量配置

在 `.env.local` 或 `.env` 文件中配置：

```bash
# 如果后端通过 ngrok 暴露，设置完整 URL
VITE_API_BASE_URL=https://unwisely-unaudited-lovetta.ngrok-free.dev

# 如果不设置，默认使用空字符串（同域请求，走 Vite proxy）
# VITE_API_BASE_URL=
```

**注意：** 项目已使用 `VITE_API_BASE_URL` 环境变量，命名一致，无需修改。
