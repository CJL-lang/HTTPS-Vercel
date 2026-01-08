# CSS 样式模块说明

本目录包含项目的 CSS 模块文件，用于组织和管理全局样式，减少 JSX 文件中的内联样式。

## 文件结构

### `components.css` - 组件样式
包含可复用组件的样式类，按功能分类：

#### 数据卡片和指标
- `.data-card` - 数据卡片容器
- `.metric-content` - 指标内容区域
- `.metric-icon-container` - 指标图标容器
- `.metric-label-container` - 指标标签容器
- `.metric-controls` - 指标控制区域
- `.number-input-container` - 数值输入容器
- `.number-input-btn` - 增减按钮
- `.number-input` - 数值输入框
- `.unit-label` - 单位标签

#### 页面布局
- `.page-container` - 页面容器（带淡入动画）
- `.page-header` - 页面头部
- `.page-title-group` - 页面标题组
- `.grid-container` - 网格布局容器

#### 目标卡片
- `.goal-card` - 目标卡片（带 focus-within 状态）
- `.goal-card-header` - 目标卡片头部
- `.goal-icon-container` - 目标图标容器
- `.goal-title` - 目标标题
- `.goal-subtitle` - 目标副标题
- `.goal-actions` - 目标操作按钮组
- `.goal-item-header-container` - 目标项头部容器

#### 按钮样式
- `.voice-btn` - 语音按钮（基础样式）
- `.voice-btn.active` - 语音按钮激活状态（红色，带脉冲动画）
- `.voice-btn.inactive` - 语音按钮非激活状态
- `.voice-btn.active-gold` - 语音按钮激活状态（金色主题）
- `.physical-voice-btn` - 物理诊断语音按钮
- `.physical-voice-btn.active` - 物理诊断语音按钮激活状态
- `.physical-voice-btn.inactive` - 物理诊断语音按钮非激活状态
- `.delete-btn` - 删除按钮
- `.add-button-dashed` - 添加按钮（虚线边框）
- `.add-button-icon` - 添加按钮图标容器
- `.add-button-text` - 添加按钮文本
- `.custom-title-cancel-btn` - 自定义标题取消按钮
- `.action-buttons-container` - 操作按钮容器
- `.btn-back` - 返回按钮
- `.btn-gold-gradient` - 金色渐变按钮（基础样式）
- `.btn-gold-gradient-full` - 金色渐变按钮（完整样式，带阴影）

#### STYKU 输入组件
- `.styku-input-card` - STYKU 输入卡片
- `.styku-input-content` - Styku 输入内容容器
- `.styku-input-label` - STYKU 输入标签
- `.styku-input-unit` - STYKU 输入单位
- `.styku-input-field` - STYKU 输入框
- `.styku-buttons-container` - STYKU 增减按钮容器
- `.styku-button` - STYKU 增减按钮

#### 扫描状态
- `.scan-status-container` - 扫描状态容器
- `.scan-complete-container` - 扫描完成容器
- `.no-data-container` - 无数据容器
- `.scan-status-animation-line` - 扫描状态动画线条
- `.scan-status-gradient` - 扫描状态渐变背景
- `.processing-text` - 处理状态文本（带脉冲动画）
- `.system-encrypted-label` - 系统加密标签
- `.data-sync-text` - 数据同步文本
- `.no-data-text` - 无数据文本

#### 章节和标题
- `.section-header` - 章节标题容器
- `.section-header-line` - 章节标题装饰线
- `.section-header-title` - 章节标题文本
- `.section-decorative-line` - 章节标题装饰线（独立使用）
- `.section-title-text` - 章节标题文本（独立使用）

#### 诊断卡片
- `.diagnosis-card` - 诊断卡片（带 focus-within 和 selector-open 状态）
- `.diagnosis-card-header` - 诊断卡片头部
- `.title-selector-btn` - 标题选择按钮
- `.custom-title-container` - 自定义标题输入容器
- `.custom-title-input` - 自定义标题输入框
- `.title-selector-dropdown` - 标题选择器下拉菜单
- `.title-selector-option` - 标题选择器选项
- `.title-selector-custom` - 自定义标题选项

#### 计划指南
- `.plan-guide-card` - 计划指南卡片
- `.plan-guide-icon` - 计划指南图标容器
- `.plan-guide-title` - 计划指南标题
- `.plan-guide-desc` - 计划指南描述

#### 目标战略
- `.goal-strategic-card` - 目标战略卡片
- `.goal-strategic-gradient` - 目标战略卡片渐变背景
- `.goal-strategic-icon-container` - 目标战略图标容器
- `.goal-strategic-icon-border` - 目标战略图标边框动画
- `.goal-strategic-label` - 目标战略标签
- `.goal-strategic-title` - 目标战略标题

#### 分类标题
- `.category-title-line-left` - 分类标题装饰线（左侧）
- `.category-title` - 分类标题
- `.category-title-line-right` - 分类标题装饰线（右侧）

#### 文本输入框
- `.textarea-standard` - 标准 Textarea 样式
- `.textarea-standard-transition` - 带过渡效果的 Textarea
- `.textarea-diagnosis` - 诊断 Textarea 样式（较矮版本）

#### 图标样式
- `.icon-plus-minus` - 增减按钮图标样式
- `.icon-sparkles` - Sparkles 图标样式
- `.icon-sm` - 小图标尺寸

#### 容器样式
- `.dropdown-scroll-container` - 下拉菜单滚动容器
- `.relative-container` - 相对定位容器
- `.title-container-col` - 标题容器列布局
- `.centered-content-container` - 居中内容容器

#### 学生信息
- `.student-info-card` - 学生信息卡片
- `.student-info-label` - 学生信息卡片标签
- `.student-info-value` - 学生信息卡片值

#### 背景和动画
- `.app-background-image` - App.jsx 背景图片样式
- `.animation-delay-negative` - 动画延迟（第二个光晕效果）
- `.will-change-transform-opacity` - 性能优化（willChange）
- `.touch-action-manipulation` - 触摸操作优化

#### 3D 变换
- `.transform-3d-container` - 3D变换容器
- `.transform-3d-medium` - 3D变换（中等深度）
- `.transform-3d-shallow` - 3D变换（浅深度）

#### Logo 进度条（@layer 外部）
- `.logo-progress-container` - Logo 进度条容器
- `.logo-progress-base` - Logo 进度条基础（灰度）
- `.logo-progress-fill` - Logo 进度条填充（动画）
- `@keyframes logoProgressFill` - Logo 进度条填充动画

#### 动画定义（@layer 外部）
- `@keyframes fadeInUp` - 淡入向上动画

### `typography.css` - 文字样式
包含文字相关的样式类：
- `.title-main` - 主标题
- `.title-subtitle` - 副标题
- `.metric-label` - 指标标签
- `.section-title` - 章节标题
- `.section-subtitle` - 章节副标题
- `.title-workbench` - 工作台主标题（响应式大标题，带截断）

### `buttons.css` - 按钮样式
包含按钮相关的样式类：
- `.btn-receive-data` - 接收数据按钮（正常状态）
- `.btn-receive-data:disabled` / `.btn-receive-data.disabled` - 接收数据按钮（禁用状态）
- `.btn-scan` - 扫描按钮（正常状态）
- `.btn-scan:disabled` / `.btn-scan.disabled` - 扫描按钮（禁用状态）

### `layout.css` - 布局样式
包含布局和响应式相关的样式类：
- `.spacing-container` - 响应式间距容器
- `.padding-responsive` - 响应式内边距
- `.padding-x-responsive` - 响应式水平内边距
- `.padding-y-responsive` - 响应式垂直内边距
- `.gap-responsive` - 响应式间距
- `.text-responsive-sm` - 响应式小字体
- `.text-responsive-md` - 响应式中等字体
- `.text-responsive-lg` - 响应式大字体
- `.w-responsive-icon` - 响应式图标宽度
- `.w-responsive-input` - 响应式输入宽度

## 使用方法

所有 CSS 模块文件已在 `index.css` 中导入，可以直接在 JSX 中使用这些类名。

### 示例

**之前（内联样式）：**
```jsx
<div className="surface-strong p-4 sm:p-6 border border-white/5 rounded-2xl sm:rounded-[32px] flex items-center justify-between group transition-all shadow-2xl shadow-black/50 gap-3">
  <h4 className="text-xs sm:text-sm font-bold text-[#d4af37] uppercase tracking-widest transition-colors break-words leading-tight">
    {label}
  </h4>
</div>
```

**之后（使用CSS类）：**
```jsx
<div className="data-card">
  <h4 className="metric-label">
    {label}
  </h4>
</div>
```

### 组合使用示例

```jsx
{/* 诊断卡片示例 */}
<div className="diagnosis-card group">
  <div className="diagnosis-card-header">
    <button className="title-selector-btn">
      <Sparkles size={12} className="icon-sparkles" />
      <span>选择标题</span>
    </button>
    <button className="voice-btn inactive">
      <Mic size={14} className="icon-sm" />
    </button>
  </div>
  <textarea className="textarea-standard" />
</div>

{/* 目标卡片示例 */}
<div className="goal-card">
  <div className="goal-card-header">
    <div className="goal-item-header-container">
      <div className="goal-icon-container">
        <Target size={14} />
      </div>
      <span className="goal-title">第一阶段目标</span>
    </div>
    <div className="goal-actions">
      <button className="voice-btn active-gold">
        <Mic size={14} />
      </button>
      <button className="delete-btn">
        <X size={14} />
      </button>
    </div>
  </div>
  <textarea className="textarea-standard-transition" />
</div>
```

## 添加新样式

1. 根据样式类型选择对应的 CSS 文件
2. 在 `@layer components` 中添加新的类
3. 使用 Tailwind 的 `@apply` 指令组合样式
4. 在 JSX 中使用新的类名
5. 更新本 README 文档，添加新样式类的说明

## 样式命名规范

- 使用语义化命名，清晰表达样式的用途
- 组件相关样式使用组件名作为前缀（如 `.goal-card`, `.diagnosis-card`）
- 状态样式使用状态名作为后缀（如 `.active`, `.inactive`）
- 修饰样式使用描述性后缀（如 `.icon-sparkles`, `.textarea-standard`）
- 容器样式使用 `-container` 后缀

## 注意事项

- 所有样式都使用 `@layer components` 以确保正确的优先级
- 响应式样式使用 Tailwind 的断点前缀（`sm:`, `md:`, `lg:` 等）
- 保持类名的语义化命名
- 避免在 CSS 模块中重复定义已在 `index.css` 中定义的通用样式
- 相同功能的样式应统一命名，避免重复定义（如多种 textarea 样式）
- 图标相关样式使用 `.icon-` 前缀以便统一管理