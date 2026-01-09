# ThreeDPage — /AIDialog Integration (Incremental Changes)

说明：对 `src/pages/reports/ThreeDPage.jsx` 做了增量改造，使其以“表单式 AI 对话向导”真实调用后端 `/AIDialog` 接口，满足用户要求的字段采集顺序与对话规则。所有更改均为局部修改，保留原有角色选择、Lottie、语音输入、DialogBubbles 等功能。

## 主要改动（概要）

- 移除本地随机回复生成器 `generateAIResponse`（不再 mock AI）。
- 修改 `handleConfirm`：
  - 移除对 `startAIDialog()` 的自动调用。
  - 在角色确认后，前端直接显示固定欢迎语（见下），并初始化 `currentInfo = {}` 与 `nextField = 'name'`。
- 修改 `handleSendMessage`：
  - 每次用户输入都使用 `fetch` POST 到 `/AIDialog`。
  - 请求体：`{ current_info: currentInfo, last_user_message: text }`。
  - 永远显示后端返回的 `reply`；仅当 `is_valid === true` 时更新 `currentInfo`。
  - 使用 `next_field` 控制流程，`next_field === 'done'` 时标记完成。
  - 使用 `async/await`、`try/catch`，并在失败时显示基础提示。
- 调整 `FIELD_LABELS` 中的 key：`history` -> `golf_history`，与后端字段命名保持一致。

## 固定欢迎语（前端显示）

```
欢迎来到 AI 学员信息注册助手 😊
我会一步一步了解你的情况，帮助我们更好地制定训练方案。
我们先开始吧：请输入你的姓名
```

## 关键代码片段（可复制）

### 【修改代码】 `handleConfirm`（替换原角色确认逻辑，初始化表单流程）

```jsx
const handleConfirm = () => {
  setSelectedChar(tempChar);
  setIsSelecting(false);
  const intro = `你好！我是 ${tempChar.name}。${tempChar.description}`;
  const welcome = `欢迎来到 AI 学员信息注册助手 😊\n我会一步一步了解你的情况，帮助我们更好地制定训练方案。\n我们先开始吧：请输入你的姓名`;

  setMessages([
    { id: 1, sender: 'ai', text: intro, timestamp: Date.now() },
    { id: 2, sender: 'ai', text: welcome, timestamp: Date.now() + 1 }
  ]);

  // 初始化表单数据与流程控制，后续每次用户输入都会调用 /AIDialog
  setCurrentInfo({});
  setNextField('name');
};
```

说明：此处不再在前端模拟初始 AI 问答，而是直接显示固定欢迎语，之后由后端根据用户输入进行校验和下一步指引。

---

### 【修改代码】 `handleSendMessage`（替换旧逻辑，真实调用 `/AIDialog`）

```jsx
const handleSendMessage = async (overrideText) => {
  const text = (typeof overrideText === 'string' ? overrideText : inputValue).trim();
  if (!text || !selectedChar) return;

  // Append user message
  setMessages(prev => {
    const lastId = prev.length ? prev[prev.length - 1].id : 0;
    return [...prev, { id: lastId + 1, sender: 'user', text, timestamp: Date.now() }];
  });
  setInputValue('');
  setIsLoading(true);

  try {
    const payload = { current_info: currentInfo, last_user_message: text };
    const resp = await fetch('/AIDialog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) throw new Error(`AIDialog HTTP ${resp.status}`);
    const res = await resp.json();

    // Always display reply
    setMessages(prev => {
      const lastId = prev.length ? prev[prev.length - 1].id : 0;
      return [...prev, { id: lastId + 1, sender: 'ai', text: res.reply || '...', timestamp: Date.now() }];
    });

    // Only update collected info when backend validates the input
    if (res.is_valid) setCurrentInfo(res.updated_info || currentInfo);
    setNextField(res.next_field || null);

    if (res.next_field === 'done') console.log('学员信息采集完成', res.updated_info || currentInfo);
  } catch (err) {
    console.error('AIDialog request failed', err);
    setMessages(prev => {
      const lastId = prev.length ? prev[prev.length - 1].id : 0;
      return [...prev, { id: lastId + 1, sender: 'ai', text: '网络或服务暂不可用，请稍后再试。', timestamp: Date.now() }];
    });
    try { alert('网络或服务暂不可用，请稍后再试。'); } catch (e) {}
  } finally {
    setIsLoading(false);
  }
};
```

说明：此函数严格遵守接口约定，按每次用户输入调用 `/AIDialog`，并依赖后端给出的 `is_valid` 和 `next_field` 做流程控制。

---

### 【修改代码】 `FIELD_LABELS`（字段 key 对齐）

```jsx
const FIELD_LABELS = {
  name: '姓名',
  email: '邮箱',
  gender: '性别',
  age: '年龄',
  years_of_golf: '球龄',
  height: '身高(cm)',
  weight: '体重(kg)',
  golf_history: '高尔夫历史',
  medical_history: '伤病历史',
  purpose: '个人训练目的',
};
```

说明：将 `history` key 改为 `golf_history`，以匹配后端字段命名约定（若后端使用不同键名，请告知我再做微调）。

## 操作记录（已执行）

- 已在 `src/pages/reports/ThreeDPage.jsx` 应用上述变更（增量修改）。
- 保留所有现有功能：角色选择、Lottie、DialogBubbles、语音输入等。

## 新增：自动创建学员（POST /students）

- 新增 `isSubmittingStudent` 状态用于避免重复提交。
- 新增 `createStudent()` 函数：当 `next_field === 'done'` 时触发，真实调用 `POST /students` 并携带 `Authorization: Bearer <token>`（从 `localStorage.user` 中读取）。
 - 新增 `createStudent()` 函数：当 `next_field === 'done'` 时触发，真实调用 `POST /api/students` 并携带 `Authorization: Bearer <token>`（从 `localStorage.user` 中读取）。
- 在请求体中进行了字段映射：
  - `gender` 支持中文或英文文本到后端 int（"男"/"male" → 1，"女"/"female" → 0）。
  - 同时兼容 `golf_history` 与 `history` 两种命名来源。
- 创建成功后在对话中追加成功提示文本：

```
太好了！你的学员信息已经成功创建 🎉
接下来我们可以开始评估与训练计划了 ⛳
```

说明：该逻辑为增量实现，保留现有页面结构与交互，确保在 `next_field === 'done'` 时自动完成后端学员创建并向用户反馈。

## 下一步建议

- 在真实后端环境下逐步测试流程：选择角色 -> 查看欢迎语 -> 输入姓名（触发 `/AIDialog`）-> 根据后端返回继续填写。
- 如需，我可继续：
  - 在页面上显示当前 `nextField` 的输入提示/校验规则；
  - 在 `next_field === 'done'` 时把 `currentInfo` 提交到正式保存 API；
  - 添加更友好的 UI 提示（加载指示、表单预览等）。

---

如需我把这些改动拆成更小的提交或增加前端输入校验规则，请告诉我你偏好的行动项。