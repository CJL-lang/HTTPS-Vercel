# 项目交接文档 (Project Handover Document)

**项目名称**: Golf Coach Demo (高尔夫智能教练系统)  
**当前版本**: 1.0.0  
**最后更新**: 2026-02-06  

---

## 1. 项目背景与目标 (Project Background & Objectives)

**项目简介**：  
本项目是一个高尔夫智能教练系统的通过式前端应用（Web App）。旨在协助教练和学员进行科学化的高尔夫训练管理。系统集成了学员管理、多维度测评（身体素质、心理素质、高尔夫技能）、AI 智能分析报告生成以及一个基于语音交互的 AI 虚拟助手。

**核心业务价值**：  
1.  **数字化档案**：建立完整的学员成长档案，涵盖身体、心理、技能三维数据。
2.  **智能化分析**：利用 AI 针对测评数据生成个性化的诊断报告和训练计划。
3.  **互动体验**：通过 AI虚拟助手（Lottie 动画形象）提供自然语言交互的学员建档和引导体验。
4.  **硬件集成**：预留了 Styku（体测）和 TrackMan（雷达）等专业设备的接入界面/数据录入入口。

---

## 2. 技术栈概览 (Tech Stack Overview)

### 前端核心
*   **框架**: [React 18](https://react.dev/)
*   **构建工具**: [Vite 5](https://vitejs.dev/)
*   **语言**: JavaScript (ES6+), JSX
*   **路由**: React Router (项目依赖中标识为 `^7.11.0`，实际运行模式接近 v6)
*   **样式**: [Tailwind CSS v3](https://tailwindcss.com/) + Vanilla CSS
*   **动画**: [Framer Motion](https://www.framer.com/motion/), [Lottie React](https://lottiefiles.com/) (DotLottie)

### 数据与可视化
*   **HTTP 请求**: Axios
*   **图表**: Chart.js (`react-chartjs-2`)
*   **图标库**: Lucide React

### AI 与多媒体
*   **语音交互**: 浏览器原生 Web Speech API (VAD/TTS) + 百度 AI 语音服务 (ASR/TTS 代理)
*   **WebSockets**: 用于 AI 报告生成的实时状态推送

### 开发环境
*   **包管理**: npm
*   **运行环境**: Node.js (推荐 v18+ LTS)

---

## 3. 快速启动指南 (Quick Start Guide)

### 环境要求
*   Node.js: >= 18.0.0
*   npm: >= 9.0.0

### 安装步骤
1.  克隆代码库到本地。
2.  进入项目根目录：
    ```bash
    cd golf_frontend_new
    ```
3.  安装依赖：
    ```bash
    npm install
    # 或者
    npm i
    ```

### 运行开发服务
启动本地开发服务器（默认端口可能是 5173 或 9000，视 vite 配置而定）：
```bash
npm run dev
```
如果需要局域网访问（例如手机测试）：
```bash
npm run dev:network
```

### 本地调试配置
在 `vite.config.js` 中配置了 API 代理，默认将 `/api` 请求转发至后端服务器（通常是 `http://127.0.0.1:8080` 或远程服务器）。
确保本地或远程后端服务已启动。

---

## 4. 核心模块解析 (Core Module Analysis)

### 1. `src/pages/assessment` (测评录入)
*   **功能**: 负责身体、心理、技能三类测评数据的录入流程。
*   **逻辑**: 包含 `AddRecordPage`，该页面是一个复杂的表单容器，根据路由参数（如 `/physical/data`, `/mental/diagnosis`）动态渲染不同的子组件（数据录入、诊断结果、训练计划制定）。

### 2. `src/pages/reports/ThreeDPage.jsx` (AI 虚拟助手)
*   **功能**: 提供一个基于 Lottie 动画的“3D”虚拟角色对话界面。
*   **逻辑**: 集成了 `useVoiceChat` (语音活动检测 VAD) 和 `useTextToSpeech`。使用 WebSocket 或 HTTP 请求与后端 `/api/AIDialog` 交互，完成学员信息的语音采集和自动建档。

### 3. `src/services/aiReportWsClient.js` (AI 报告 WebSocket)
*   **功能**: 管理 AI 报告生成的长连接。
*   **逻辑**: 建立 WebSocket 连接，监听后端 AI 任务的进度（生成中、完成、失败），并通过 EventBus 或回调函数更新前端 UI（如 Toast 提示或报告页面的状态刷新）。

### 4. `src/utils/api.js` (API 封装)
*   **功能**: 全局 Axios 实例。
*   **逻辑**: 统一配置了 `baseURL`、超时时间 (30s)，以及请求拦截器（添加 `ngrok-skip-browser-warning` 头，处理 `/api` 前缀补全）。

---

## 5. 核心业务流程 (Core Business Flows)

### 1. 学员建档流程 (Student Onboarding)
*   **入口**: `VoiceChatDemo` 或 `ThreeDPage` (AI 助手)。
*   **流程**: 
    1. 用户选择虚拟角色。
    2. AI 语音询问用户基本信息（姓名、年龄、球龄等）。
    3. 前端 `detectFieldMismatch` 逻辑校验回答。
    4. 对话结束触发 `createStudent` API 调用。
    5. 成功后跳转至学员主页 `StudentHomePage`。

### 2. 测评与报告生成 (Assessment & Reporting)
*   **入口**: 首页 "新测评" -> 选择测评类型 (AssessmentTypeSelection)。
*   **流程**:
    1. `AddRecordPage`: 教练/学员输入各项测试数据。
    2. 点击“保存”或“生成报告”。
    3. 后端异步开始 AI 分析。
    4. `aiReportWsClient` 接收到 "Task Started"。
    5. 前端显示“报告生成中”状态。
    6. 接收到 "Task Completed"，前端刷新报告页面（如 `SkillsReportPage`），展示雷达图和 AI 建议。

### 3. 登录鉴权 (Authentication)
*   **流程**: 表单提交 -> `/auth/login` -> 获取 JWT Token -> 存入 LocalStorage (`user` 字段) -> 路由守卫 (`auth: true`) 允许访问受保护页面。

---

## 6. 外部依赖与配置 (External Dependencies & Configuration)

### 环境变量 (`.env`)
项目目前主要依赖 `vite.config.js` 中的代理配置而非复杂的 `.env` 文件。
*   **Vite Proxy**: 
    *   `/api`: 转发至后端 API。
    *   `/ws`: 转发至后端 WebSocket 端口。
    *   `/baidu-token`: 转发至百度云鉴权接口。

### 第三方服务
1.  **Backend API**: 核心业务逻辑支撑（默认端口 8080）。
2.  **Baidu AI Cloud**:
    *   ASR (语音识别): 用于将用户语音转为文本。
    *   TTS (语音合成): 用于 AI 助手发声。
    *   **配置**: 需要在 Nginx 层或 Vite 代理层配置 `baidu-token`, `baidu-asr`, `baidu-tts` 的反向代理以解决 CORS 和鉴权问题。

---

## 7. 已知问题与待办项目 (Known Issues & TODOs)

基于 `TODO.md` 和代码现状：

### 待办功能 (TODO)
*   **技能报告**: 增加/删减诊断模块和训练方案模块的功能。
*   **数据模拟**: 实现 Trackman/Styku 数据的范围随机值模拟（前端 Mock）。
*   **完整流程**: 完善从“身体”到“技能”的一站式全链路测评流程。

### 已知缺陷 (Bugs)
*   **重复建表**: 在“身体素质报告”中，多次点击保存会创建多个重复报告表。
*   **数据丢失**: 心理/技能详细报告页面，刷新后可能导致数据丢失（前端未正确持久化或重新获取 State）。
*   **WebSocket**: AI 生成报告如果时间过长，Nginx 代理可能会断开连接（需配置 `proxy_read_timeout`）。

---

## 8. 部署说明 (Deployment Instructions)

### 构建生产包
```bash
npm run build
```
输出目录：`dist/`

### 部署注意事项 (基于宝塔面板)
请参考项目根目录下的 `BAOTA_DEPLOYMENT_GUIDE.md` 进行详细配置。

**关键 Nginx 配置**：
1.  **SPA 路由支持**:
    ```nginx
    location / {
        try_files $uri $uri/ /index.html;
    }
    ```
2.  **WebSocket 代理** (必须配置，否则 AI 报告进度无法更新):
    ```nginx
    location /ws/ {
        proxy_pass http://127.0.0.1:8080/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    ```
3.  **百度 AI 代理**: 必须配置 `/baidu-token` 等路径的 SSL 代理，否则语音功能在生产环境将失效。

---
