# 雷达图动态化更新文档

## 更新内容

### 主要改动
将雷达图从固定字段映射改为完全动态，后端传多少项就显示多少项。

### 修改的文件

#### 1. `src/utils/diagnosesToRadar.js`
- **之前**: 使用固定的字段映射（mental: 3项, physical: 7项, skills: 7项）
- **现在**: 直接使用后端返回的所有 title 和 grade，无字段过滤
- **返回格式**: `{ labels: string[], values: (string|number)[], totalCount: number }`

```javascript
// 旧代码返回格式
{ gradeData: { focus: 0, stability: 0, ... }, matchedCount: 0, totalCount: 0 }

// 新代码返回格式
{ labels: ['专注力', '抗压力', ...], values: ['L3', 'L2', ...], totalCount: 2 }
```

#### 2. `src/components/reports/RadarChart.jsx`
- **之前**: 固定的 labels 和 fields 配置
- **现在**: 接受动态的 `{labels: [], values: []}` 格式或兼容旧的对象格式
- **新增参数**: `title` prop（可选），允许自定义图表标题
- **数据格式支持**:
  - 新格式: `{labels: string[], values: (string|number)[]}`
  - 旧格式: `{focus: 0, stability: 0, ...}` （兼容）

#### 3. 报告详情页面更新
更新了以下页面以使用新的数据格式：
- `src/pages/reports/PhysicalReportDetailPage.jsx`
- `src/pages/reports/MentalReportDetailPage.jsx`
- `src/pages/reports/SkillsReportDetailPage.jsx`

**数据流程**:
```javascript
// 1. 获取 diagnoses 数据
const diagnosesJson = await fetch(`/api/diagnoses/${id}`).json();

// 2. 转换为雷达图格式
const mapped = diagnosesToRadarGradeData(diagnosesJson, 'physical');
// 返回: { labels: ['柔韧性', '上肢力量', ...], values: ['L3', 'L2', ...], totalCount: 7 }

// 3. 传递给 RadarChart
if (mapped.totalCount > 0) {
    diagnosesGradeData = mapped;
}

// 4. 渲染
<RadarChart data={diagnosesGradeData} type="physical" />
```

## 使用方式

### 后端数据格式要求

```json
{
  "content": [
    { "title": "柔韧性", "grade": "L3" },
    { "title": "上肢力量", "grade": "L2" },
    { "title": "下肢力量", "grade": "L4" },
    { "title": "协调性", "grade": "L3" },
    { "title": "核心稳定性", "grade": "L2" }
  ]
}
```

### 前端使用示例

```jsx
import RadarChart from '../../components/reports/RadarChart';
import { diagnosesToRadarGradeData } from '../../utils/diagnosesToRadar';

// 获取数据
const diagnosesData = await fetch('/api/diagnoses/123').then(r => r.json());

// 转换数据
const radarData = diagnosesToRadarGradeData(diagnosesData, 'physical');

// 渲染雷达图
<RadarChart 
    data={radarData} 
    type="physical"
    title="自定义标题（可选）" 
/>
```

## 特性

### 1. 完全动态
- ✅ 后端返回多少项就显示多少项
- ✅ 不限制项目数量
- ✅ title 名称任意（中英文都支持）

### 2. 向后兼容
- ✅ 支持旧格式对象数据 `{focus: 0, stability: 0, ...}`
- ✅ fallback 到 AIReport.grade 如果 diagnoses 数据不可用

### 3. 自动转换
- ✅ 自动识别 L1-L4 或 L1-L9 格式
- ✅ 转换为 0-100 的数值用于显示
- ✅ tooltip 显示原始等级（如 "L3"）

## 等级转换规则

### Physical (L1-L4)
- L1 = 25 / 100
- L2 = 50 / 100
- L3 = 75 / 100
- L4 = 100 / 100

### Skills (L1-L9)
- L1 = 11.11 / 100
- L2 = 22.22 / 100
- ...
- L9 = 100 / 100

### Mental (0-100)
- 直接使用数值

## 测试建议

1. **测试不同数量的项目**
   - 1项、3项、5项、7项、10项等

2. **测试各种等级格式**
   - "L1", "L2", "L3"
   - 数字: 1, 2, 3
   - 数值: 25, 50, 75

3. **测试空数据**
   - 空数组
   - 全0值
   - null/undefined

4. **测试后端数据格式**
   - 标准格式: `{content: [{title, grade}, ...]}`
   - 数组格式: `[{title, grade}, ...]`

## 注意事项

1. 如果后端没有数据，会显示"教练未填写等级信息"的提示
2. 等级会自动转换为 0-100 的数值供图表显示
3. 支持自定义图表标题（通过 title prop）
4. type 参数仍然需要提供（用于等级转换逻辑）

## 迁移指南

如果你之前使用了固定的字段映射，现在可以：

1. **保持后端不变**: 只要后端返回 `{content: [{title, grade}]}` 格式即可
2. **前端自动适配**: 代码会自动处理新旧格式
3. **无需修改组件调用**: 原有的 `<RadarChart>` 调用方式保持不变
