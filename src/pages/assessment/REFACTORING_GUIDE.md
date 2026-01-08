# AddRecordPage 重构文档

## 📊 重构效果

- **原文件**：1038 行 → **新文件**：~250 行（减少 76%）
- **模块化**：13 个独立模块
- **可维护性**：大幅提升
- **可测试性**：每个模块可独立测试

## 📁 新文件结构

```
pages/assessment/
├── AddRecordPage.jsx              # 原文件（可保留作为参考）
├── AddRecordPage.refactored.jsx   # 重构后的主文件（~250行）
├── AddRecordPage.module.css       # 样式文件
├── hooks/                         # 自定义 Hooks
│   ├── useAssessmentData.js       # 数据状态管理
│   ├── useAssessmentDraft.js      # 草稿保存/加载
│   ├── useUnsavedChanges.js       # 未保存变更检测
│   ├── useAssessmentNavigation.js # 导航逻辑
│   └── useAssessmentSave.js       # 保存业务逻辑
├── components/                    # UI 组件
│   ├── AssessmentHeader.jsx       # 顶部标题栏
│   ├── PrimaryNavigation.jsx      # 一级导航（步骤条）
│   ├── SecondaryNavigation.jsx    # 二级导航（标签页）
│   ├── AssessmentContent.jsx      # 内容渲染器
│   ├── SaveButton.jsx             # 底部保存按钮
│   └── UnsavedChangesDialog.jsx   # 未保存确认对话框
└── utils/                         # 工具函数
    ├── assessmentApi.js           # API 调用
    ├── assessmentHelpers.js       # 辅助函数
    └── assessmentConstants.js     # 常量配置
```

## 🔄 如何切换到新版本

### 方法 1：直接替换（推荐）

```bash
# 1. 备份原文件
mv AddRecordPage.jsx AddRecordPage.old.jsx

# 2. 使用新文件
mv AddRecordPage.refactored.jsx AddRecordPage.jsx
```

### 方法 2：并行测试

保留两个文件，在路由中切换：

```javascript
// 原版本
import AddRecordPage from './pages/assessment/AddRecordPage';

// 新版本
import AddRecordPage from './pages/assessment/AddRecordPage.refactored';
```

## 📦 各模块说明

### Hooks

#### useAssessmentData
- **职责**：管理测评数据状态
- **主要功能**：
  - 初始化测评数据结构
  - 提供数据更新方法
  - 自动设置默认标题

#### useAssessmentDraft
- **职责**：草稿管理
- **主要功能**：
  - 加载现有草稿
  - 保存草稿到 localStorage
  - 删除草稿
  - 生成唯一记录ID

#### useUnsavedChanges
- **职责**：未保存变更检测
- **主要功能**：
  - 检测数据变化
  - 浏览器刷新/关闭警告
  - 管理确认对话框状态

#### useAssessmentNavigation
- **职责**：导航状态管理
- **主要功能**：
  - 路由解析
  - 一级/二级导航状态
  - 导航跳转逻辑

#### useAssessmentSave
- **职责**：保存业务逻辑
- **主要功能**：
  - 保存数据到后端
  - 保存诊断和方案
  - 生成AI报告

### Components

#### AssessmentHeader
- 返回按钮
- 标题显示/编辑

#### PrimaryNavigation
- 一级导航步骤条
- 完成状态显示
- 进度线动画

#### SecondaryNavigation
- 二级导航标签页
- 标签切换

#### AssessmentContent
- 根据导航状态渲染对应组件
- 支持体能/心理/技能三种类型
- 支持数据/诊断/方案/目标四个步骤

#### SaveButton
- 保存并继续
- 完成测评
- 生成AI报告/稍后生成

#### UnsavedChangesDialog
- 未保存变更提示
- 保存并继续/不保存离开/取消

### Utils

#### assessmentApi.js
- `savePlanToBackend` - 保存训练方案
- `saveDiagnosisToBackend` - 保存诊断
- `saveAssessmentData` - 保存测评数据

#### assessmentHelpers.js
- `hasAnyValue` - 检查值是否非空
- `checkHasAnyData` - 检查是否有数据
- `persistModuleToStudent` - 持久化到学员

#### assessmentConstants.js
- `TYPE_MAP` - 类型映射
- `ROUTE_MAP` - 路由映射
- `STEP_MAP` - 步骤映射

## ✅ 优势

1. **可维护性**：每个模块职责单一，易于理解和修改
2. **可复用性**：Hooks 和组件可在其他页面复用
3. **可测试性**：每个模块可独立编写单元测试
4. **可读性**：主文件只关注组合逻辑，代码清晰
5. **扩展性**：新增功能只需修改对应模块

## 🧪 测试建议

1. **功能测试**：确保所有功能与原版本一致
2. **边界测试**：测试无学员信息、网络错误等边界情况
3. **性能测试**：确认没有性能退化
4. **兼容性测试**：测试不同浏览器和设备

## 🔧 后续优化建议

1. **TypeScript**：添加类型定义提升代码安全性
2. **单元测试**：为每个 Hook 和组件编写测试
3. **错误边界**：添加 Error Boundary 处理异常
4. **加载状态**：优化 API 调用的加载提示
5. **缓存策略**：优化草稿保存频率

## 📝 注意事项

- 重构后逻辑与原文件完全一致
- 所有 API 调用保持不变
- localStorage 键名保持不变，向后兼容
- 样式类名保持不变

## 🚀 迁移步骤

1. ✅ 测试新版本功能是否正常
2. ✅ 确认所有 API 调用成功
3. ✅ 检查草稿保存/加载是否正常
4. ✅ 验证导航跳转是否正确
5. ✅ 确认完成后替换原文件
6. ✅ 删除 `.old.jsx` 备份文件

---

**重构完成时间**：2026年1月3日  
**重构类型**：模块化拆分、关注点分离  
**向后兼容**：是
