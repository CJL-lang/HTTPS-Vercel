# iPad 端 CSS 样式文档（数值详细版）

本说明基于当前样式实现，整理为**可直接开发使用的数值级规范**，涵盖字体、颜色、间距、圆角、阴影、模糊度与动画参数。适用 iPad 竖屏与横屏。

---

## 1. 断点与适配

- 主要断点：
  - iPad 竖屏：`sm`（>= 640px）
  - iPad 横屏：仍以 `sm` 为主（项目内大多数仅使用 `sm`）

### 尺寸换算（Tailwind 标准）

- `p-4` = 16px，`p-6` = 24px
- `gap-3` = 12px，`gap-4` = 16px
- `text-xs` = 12px，`text-sm` = 14px，`text-base` = 16px
- `text-lg` = 18px，`text-xl` = 20px，`text-2xl` = 24px
- `h-1.5` = 6px，`h-2` = 8px
- `rounded-xl` = 12px，`rounded-2xl` = 16px
- `rounded-[32px]` = 32px（用于 iPad 放大）

---

## 2. 颜色与主题（核心色值）

### 金色主色

- 主金色：#d4af37
- 深金色：#b8860b
- 明金色：#f5d36a

### 深色背景体系

- 深背景：#121827 / #111726 / #1a2132 / #1e2638
- 进度条底色：#2a3248 / #26304a

### 透明层（苹果风格）

在全局变量中定义：

- --apple-surface-weak = rgba(255, 255, 255, 0.06)
- --apple-surface = rgba(255, 255, 255, 0.10)
- --apple-surface-strong = rgba(20, 20, 20, 0.7)
- --apple-border = rgba(255, 255, 255, 0.0)
- --apple-border-strong = rgba(255, 255, 255, 0.06)

---

## 3. 字体与字号层级（typography.css + index.css）

### 标题类

- `.t-title-page`：24px，font-weight 700，white
- `.t-title-card`：18px，font-weight 600，white
- `.t-title-section`：11px，font-weight 600，uppercase，letter-spacing 0.4em，gold

### 文本类

- `.t-label`：14px，white/70
- `.t-body`：14px，white/60
- `.t-muted`：14px，white/40
- `.t-value`：24px，font-weight 600

### 详细字段样式

- `.report-field-label`：14px，gold，uppercase，tracking-widest
- `.report-field-value`：20px -> 24px (sm)，white/90
- `.report-field-unit`：11px -> 12px (sm)，uppercase，opacity 0.4

---

## 4. 容器与卡片（数值级）

### 通用卡片

- `.glass-card`
  - 圆角：16px -> 32px
  - 阴影：shadow-2xl（大型阴影）
  - 背景：--apple-surface-strong
  - 边框：1px solid rgba(255,255,255,0.06)

### 报告卡片优化版

- 背景：linear-gradient(180deg, #1a2132, #111726)
- 边框：rgba(255,215,100,0.15)
- 阴影：0 20px 60px rgba(0,0,0,0.6)

### 统一模糊度

- 卡片 blur：backdrop-filter: blur(12px)

---

## 5. 间距体系（layout.css）

### 推荐使用

- `.padding-responsive`：16px -> 24px
- `.gap-responsive`：12px -> 16px
- `.spacing-container`：纵向间距 40px（space-y-10）

---

## 6. 按钮数值

### 金色按钮

- `.btn-gold` / `.btn-gold-gradient`
  - 背景渐变：#d4af37 -> #b8860b
  - 圆角：32px 或 16px
  - 阴影：0 20px 40px rgba(212,175,55,0.3)（完整版）

### 扫描/接收数据按钮

- 内边距：px 20px / py 10px
- 字号：11px -> 13px

---

## 7. 进度条数值

### 通用进度条

- `.progress-bar-bg`：高度 6px -> 8px
- `.progress-bar-fill`：
  - 渐变：#f5d36a -> #d4a82f
  - 光晕：0 0 12px rgba(255,215,120,0.6)

### Logo 进度条

- 容器：128px -> 160px
- 基础灰色滤镜：grayscale(100%) brightness(0.4)
- 填充动画：10s 进度、2s 快速、0.6s 完成
- 光条高度：20px
- 光条渐变透明度：rgba(255,255,255,0.3)

---

## 8. 模糊与阴影值总结

### 模糊

- card blur：12px

### 阴影

- 0 20px 40px rgba(212,175,55,0.3)
- 0 20px 60px rgba(0,0,0,0.6)
- 0 25px 70px rgba(0,0,0,0.7)
- 0 0 12px rgba(255,215,120,0.6)
- 0 0 10px rgba(80,180,255,0.7)

---

## 9. iPad 实际开发推荐值（速查）

- 页面容器：`p-4 sm:p-6`（16px -> 24px）
- 卡片圆角：`rounded-2xl sm:rounded-[32px]`
- 字号：正文 12-14px，标题 18-24px
- 模糊：统一 blur(12px)
- 主色：#d4af37

---

如需更细化的 iPad Pro 或分屏支持，可在此基础上扩展 `md:`。
