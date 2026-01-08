# 测评配置JSON使用说明

## 概述

`SingleAssessmentSelectionPage` 组件已重构为支持JSON配置，所有颜色已统一为金色主题。你可以通过传入自定义的JSON配置来动态生成测评选项。

## 主要改动

### 1. 移除硬编码颜色
- ❌ 删除：蓝色渐变 `from-blue-500 to-cyan-500`
- ❌ 删除：粉色渐变 `from-purple-500 to-pink-500`
- ✅ 统一使用：金色主题 `from-[#d4af37] to-[#f9e29c]`

### 2. 支持JSON配置
组件现在接受 `assessmentConfig` prop，可以动态传入配置：

```jsx
<SingleAssessmentSelectionPage
  onBack={handleBack}
  onStartAssessment={handleStart}
  assessmentConfig={customConfig}  // 传入自定义配置
/>
```

## JSON配置格式

### 基本结构

```json
[
  {
    "id": "physical",              // 唯一标识符
    "label": "身体素质测评",        // 显示名称
    "icon": "Activity",            // 图标名称（Lucide React）
    "color": "from-[#d4af37] to-[#f9e29c]",     // 渐变色
    "borderColor": "border-[#d4af37]/30",       // 边框颜色
    "shadowColor": "shadow-[#d4af37]/20",       // 阴影颜色
    "description": "身体素质测评描述"            // 描述文本
  }
]
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识符，用于数据提交 |
| `label` | string | ✅ | 卡片标题 |
| `icon` | string | ✅ | Lucide React图标名称 (Activity, Brain, Trophy, Heart, Target等) |
| `color` | string | ✅ | Tailwind渐变类名，格式：`from-[颜色] to-[颜色]` |
| `borderColor` | string | ✅ | Tailwind边框类名，格式：`border-[颜色]/透明度` |
| `shadowColor` | string | ✅ | Tailwind阴影类名，格式：`shadow-[颜色]/透明度` |
| `description` | string | ✅ | 测评描述文本 |

### 支持的图标

常用的Lucide React图标名称：
- `Activity` - 活动/身体
- `Brain` - 大脑/心理
- `Trophy` - 奖杯/技能
- `Heart` - 心脏/心率
- `Target` - 目标/精准度
- `Zap` - 闪电/力量
- `Wind` - 风/速度

[查看完整图标列表](https://lucide.dev/icons/)

## 使用示例

### 示例1：使用默认配置

```jsx
// 不传配置参数，使用默认的三项测评（全部金色主题）
<SingleAssessmentSelectionPage
  onBack={() => navigate(-1)}
  onStartAssessment={handleStart}
/>
```

### 示例2：自定义测评项目

```jsx
const customConfig = [
  {
    id: "balance",
    label: "平衡力测评",
    icon: "Target",
    color: "from-[#d4af37] to-[#f9e29c]",
    borderColor: "border-[#d4af37]/30",
    shadowColor: "shadow-[#d4af37]/20",
    description: "评估身体平衡能力和稳定性"
  },
  {
    id: "flexibility",
    label: "柔韧性测评",
    icon: "Heart",
    color: "from-[#d4af37] to-[#f9e29c]",
    borderColor: "border-[#d4af37]/30",
    shadowColor: "shadow-[#d4af37]/20",
    description: "测试关节活动度和肌肉伸展能力"
  }
];

<SingleAssessmentSelectionPage
  onBack={() => navigate(-1)}
  onStartAssessment={handleStart}
  assessmentConfig={customConfig}
/>
```

### 示例3：从AI API动态生成

```jsx
import { useState, useEffect } from 'react';

function AssessmentPage() {
  const [aiConfig, setAiConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从AI API获取配置
    async function fetchAIConfig() {
      try {
        const response = await fetch('/api/ai/generate-assessment-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: currentStudent.id,
            level: currentStudent.level,
            preferences: currentStudent.preferences
          })
        });
        
        const config = await response.json();
        setAiConfig(config.assessmentTypes);
      } catch (error) {
        console.error('获取AI配置失败:', error);
        // 降级到默认配置
        setAiConfig(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAIConfig();
  }, [currentStudent]);

  if (loading) return <LoadingSpinner />;

  return (
    <SingleAssessmentSelectionPage
      onBack={() => navigate(-1)}
      onStartAssessment={handleStart}
      assessmentConfig={aiConfig}  // AI生成的配置
    />
  );
}
```

## AI API响应示例

### 请求格式

```json
POST /api/ai/generate-assessment-config
{
  "studentId": "student_123",
  "level": "intermediate",
  "preferences": {
    "focusAreas": ["swing", "mental"],
    "goals": ["consistency", "distance"]
  }
}
```

### 响应格式

```json
{
  "success": true,
  "assessmentTypes": [
    {
      "id": "swing_analysis",
      "label": "挥杆技术分析",
      "icon": "Activity",
      "color": "from-[#d4af37] to-[#f9e29c]",
      "borderColor": "border-[#d4af37]/30",
      "shadowColor": "shadow-[#d4af37]/20",
      "description": "针对你的挥杆一致性问题，进行详细的动作捕捉与分析"
    },
    {
      "id": "mental_toughness",
      "label": "心理韧性训练",
      "icon": "Brain",
      "color": "from-[#d4af37] to-[#f9e29c]",
      "borderColor": "border-[#d4af37]/30",
      "shadowColor": "shadow-[#d4af37]/20",
      "description": "提升比赛心态和压力管理能力"
    },
    {
      "id": "distance_power",
      "label": "距离与力量",
      "icon": "Zap",
      "color": "from-[#d4af37] to-[#f9e29c]",
      "borderColor": "border-[#d4af37]/30",
      "shadowColor": "shadow-[#d4af37]/20",
      "description": "增加击球距离和爆发力训练"
    }
  ],
  "recommendedOrder": ["swing_analysis", "mental_toughness", "distance_power"]
}
```

## 注意事项

1. **颜色格式**：必须使用Tailwind CSS类名格式，不支持直接的hex或rgb值
2. **图标名称**：必须是有效的Lucide React图标名称（区分大小写）
3. **降级策略**：如果传入的配置无效或为null，会自动使用默认配置
4. **统一主题**：建议所有测评项使用相同的金色主题以保持UI一致性

## 完整配置示例

查看 `ASSESSMENT_CONFIG_EXAMPLE.json` 文件获取完整的配置示例和更多用法说明。

## 后续集成步骤

1. **创建AI API端点**：实现 `/api/ai/generate-assessment-config` 接口
2. **处理响应**：解析AI返回的JSON并验证格式
3. **错误处理**：添加降级策略和用户友好的错误提示
4. **测试**：使用不同的配置测试UI渲染效果
5. **优化**：添加配置缓存以减少API调用

---

**文件位置：**
- 组件：`src/pages/SingleAssessmentSelectionPage.jsx`
- 配置示例：`ASSESSMENT_CONFIG_EXAMPLE.json`
- 使用说明：`测评配置JSON使用说明.md`
