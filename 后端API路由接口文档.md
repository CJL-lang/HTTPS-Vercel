# Post

## /register

对应的路由：r.POST("/register", api.HandleRegister)

### Request

```json
{
    "role": "student",
    "username": "测试用户2",
    "email": "test1@example.com",
    "password": "123456",
    "phone": "13800000000",
    "bio": "测试注册"
}
```

### Response

```json
{
  "message": "User registered successfully",
  "user_id": "bd0eb324-dd2c-4f42-a955-9080f8920245"
}
```

## /login

对应的路由：r.POST("/login", api.HandleLogin)

### Request

```json
{
  "account": "coach@example.com",
  "password": "password",
  "role": "coach"
}
```

### Response

```json
{
    "message": "登录成功",
    "token": "  ",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "John",
        "email": "coach@example.com",
        "phone": "+1234567890",
        "role": "coach"
    }
}
```

## /diagnosis

对应的路由：r.POST("/diagnosis", app.AuthMiddleware(db), api.HandleDiagnosisCreate)
功能：保存诊断页面传回来的数据

### Request

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "content": [{"title": "力量提升", "grade": "L3","content": "point1_1"}, {"title": "核心训练", "grade": "L3", "content": "point2_1"}],
  "language": "cn"
}
```

### Response

```json
{
    "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
    "id": "9b46bbab-d3ab-4d07-8fb6-f86293b138c1",
    "message": "Diagnosis created successfully"
}
```

## /plans

对应的路由：r.POST("/plans", app.AuthMiddleware(db), api.HandlePlansCreate)
功能：保存训练方案页面传回来的数据

### Request

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "content": [{"title": "力量提升", "content": "point1_1"}, {"title": "核心训练", "content": "point2_1"}],
  "language": "cn"
}
```

### Response

```json
{
    "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
    "id": "9b46bbab-d3ab-4d07-8fb6-f86293b138c1",
    "message": "Plans created successfully"
}
```

## /goals

对应的路由：r.POST("/goals", app.AuthMiddleware(db), api.HandleGoalsCreate)
功能：保存目标页面传回来的数据

### Request

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "type": "physical",
  "content": [{"title": "力量提升", "content": "point1_1"}, {"title": "核心训练", "content": "point2_1"}],
  "language": "cn"
}
```

### Response

```json
{
    "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
    "id": "9b46bbab-d3ab-4d07-8fb6-f86293b138c1",
    "message": "Goals created successfully"
}
```

## /trackman

对应的路由：r.POST("/trackman", app.AuthMiddleware(db), api.HandleTrackmanDataCreate)

注意：assessment_id需要在assessment表中有记录，同时trackman_data中没有记录

### Request

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "ball_speed": 156.2,
  "launch_angle": 12.4,
  "launch_direction": "R 1.2",
  "spin_rate": 2450,
  "spin_axis": "L 2.1",
  "carry": 264,
  "landing_angle": 45.2,
  "offline": "R 12",
  "club_speed": 105.4,
  "attack_angle": -3.2,
  "club_path": 2.1,
  "face_angle": -1.2,
  "face_to_path": -3.3,
  "dynamic_loft": 15.4,
  "smash_factor": 1.48,
  "spin_loft": 18.6,
  "low_point": "4.2 / -1.2",
  "impact_offset": "H 2.1 / V 1.5",
  "indexing": "Smash: 102 / Spin: 98"
}
```

### Response

```json
{
    "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
    "id": "9b46bbab-d3ab-4d07-8fb6-f86293b138c1",
    "message": "TrackmanData created successfully"
}
```

## /styku

对应的路由：r.POST("/styku", app.AuthMiddleware(db), api.HandleStykuDataCreate)

### Request

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "height": 175.50,
  "weight": 70.20,
  "sitting_height": 90.30,
  "bmi": 22.9,
  "chest": 95.40,
  "waist": 78.20,
  "hip": 96.10,
  "upper_arm": 31.50,
  "forearm": 26.30,
  "thigh": 55.80,
  "calf": 37.20
}
```

### Response

```json
{
    "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
    "id": "9b46bbab-d3ab-4d07-8fb6-f86293b138c1",
    "message": "StykuData created successfully"
}
```

## /mental

对应的路由：r.POST("/mentalData", app.AuthMiddleware(db), api.HandleMentalDataCreate)

### Request

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "focus": 7,
  "stress": 3,
  "stability": 6
}
```

### Response

```json
{
    "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
    "id": "9b46bbab-d3ab-4d07-8fb6-f86293b138c1",
    "message": "Mentaldata created successfully"
}
```

## /users/avatar

注释：上传用户头像，需要用户登录认证
请求的路由：r.POST("/users/avatar", app.AuthMiddleware(db), api.HandleUploadAvatar)

功能：上传用户头像文件，支持JPG、PNG、GIF格式，最大5MB

### Request

**Content-Type**: `multipart/form-data`

**Form Data**:

- `avatar`: 头像文件 (必填)

### Response

```json
{
  "message": "Avatar uploaded successfully",
  "avatar_url": "/uploads/avatars/uuid_timestamp.jpg"
}
```

**错误响应**:

- `400 Bad Request`: 文件格式不支持或文件过大
- `401 Unauthorized`: 用户未登录
- `500 Internal Server Error`: 服务器错误

## /user-avatars/:user_id

注释：获取用户头像URL
请求的路由：r.GET("/user-avatars/:user_id", api.HandleGetAvatar)

功能：根据用户ID获取头像URL

### Request

**URL参数**:

- `user_id`: 用户ID (必填)

### Response

```json
{
  "avatar_url": "/uploads/avatars/uuid_timestamp.jpg"
}
```

**错误响应**:

- `400 Bad Request`: user_id参数缺失
- `404 Not Found`: 用户不存在或未设置头像

## /avatars/:filename

注释：直接访问头像文件
请求的路由：r.GET("/avatars/:filename", api.HandleServeAvatar)

功能：直接返回头像文件内容

### Request

**URL参数**:

- `filename`: 文件名 (必填)

### Response

返回头像文件的二进制内容，Content-Type根据文件类型自动设置

**错误响应**:

- `400 Bad Request`: 文件名无效
- `404 Not Found`: 文件不存在

## /assessment

请求的路由：r.POST("/assessment", app.AuthMiddleware(db), api.HandleAssessmentCreate)

### Request

```json
{
  "student_user_id": "075e9b4d-bf39-4f9d-85a8-56a7d1721ca6",
  "type": "physical"
}
```

### Response

```json
{
  "assessment_id": "0ee82198-af01-446b-a9b9-8a0572e1c9ab",
  "message": "Assessment create successfully"
}
```

## /AIReport

请求的路由：r.POST("/AIReport", app.AuthMiddleware(db), api.HandleAIReportCreate)

说明：该接口已改为异步生成模式，避免长时间阻塞。调用后立即返回“正在生成”，生成完成后通过 WebSocket 推送通知。

### Request

```json
{
  "assessment_id": "371b1c6e-362a-40d8-a2bf-b4786c2ef179"
}
```

### Immediate Response (202 Accepted)

```json
{
  "assessment_id": "371b1c6e-362a-40d8-a2bf-b4786c2ef179",
  "job_id": "<uuid>",
  "status": "processing",
  "ws_endpoint": "/ws/ai-report/371b1c6e-362a-40d8-a2bf-b4786c2ef179",
  "message": "Report is being generated"
}
```

### WebSocket 推送

- 路径：GET /ws/ai-report/:ass_id（需携带认证，与其他接口一致）
- 消息格式：

完成示例（首次创建）：

```json
{
  "type": "completed",
  "assessment_id": "371b1c6e-362a-40d8-a2bf-b4786c2ef179",
  "job_id": "<uuid>",
  "report_id": "ccbad023-ac79-4fb6-9863-bb08bdc38035",
  "report": { },
  "message": "AI report created and saved successfully"
}
```

对比示例（已存在报告时）：

```json
{
  "type": "completed_compare",
  "assessment_id": "371b1c6e-362a-40d8-a2bf-b4786c2ef179",
  "job_id": "<uuid>",
  "old_report_id": "existing-report-id",
  "new_report": { },
  "message": "AI report already exists, new version generated for comparison."
}
```

失败示例：

```json
{
  "type": "error",
  "assessment_id": "371b1c6e-362a-40d8-a2bf-b4786c2ef179",
  "job_id": "<uuid>",
  "error": "failed to save AI report"
}
```

## /AIDialog

对应的路由：r.POST("/AIDialog", app.AuthMiddleware(db), api.HandleAIDialogGenerate)
功能：AI 驱动的对话式信息收集接口，用于引导用户提供基本信息（姓名、年龄、性别、邮箱、高尔夫历史、伤病、目的）。

### Request

```json
{
  "current_info": {
    "name": "小明",
    "age": 8
  },
  "last_user_message": "我是男生",
  "last_ai_prompt": "你好小明，请问你是男生还是女生呢？"
}
```

### Response

```json
{
  "reply": "太棒了，小明！那你的邮箱是多少呢？",
  "is_valid": true,
  "updated_info": {
    "name": "小明",
    "age": 8,
    "gender": "男"
  },
  "next_field": "email",
  "error_code": 0
}
```

- **is_valid**: 表示用户最后一次回答是否有效（布尔值）。
- **next_field**: 字符串，提示下一个应询问的字段。提问顺序为：`name` -> `age` -> `gender` -> `email` -> `years_of_golf` -> `history` -> `medical_history` -> `purpose` -> `done`。
- **error_code**: `0` 表示正常；`1` 表示用户回答无效，此时 `reply` 为纠错引导。对话内容中绝对不会出现括号。
- **话术适配**: AI 会根据获取到的年龄自动切换交流语气（儿童/青少年/成人）。

# GET

## /singleAssess/:ass_id

对应的路由：r.GET("/singleAssess/:ass_id", app.AuthMiddleware(db), api.HandleSingleAssessmentGet)
功能：获取单个测评的所有详细数据，包括具体测评属性（Styku/Trackman/Mental）、诊断、训练计划和目标。

### Response

```json
{
  "assessment_data": {
    "id": "550e8400-e29b-41d4-a716-4466554400cc",
    "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
    "height": 175.5,
    "weight": 70.2,
    "sitting_height": 90.3,
    "bmi": 22.9,
    "chest": 95.4,
    "waist": 78.2,
    "hip": 96.1,
    "upper_arm": 31.5,
    "forearm": 26.3,
    "thigh": 55.8,
    "calf": 37.2
  },
  "diagnosis": {
    "id": "9b46bbab-d3ab-4d07-8fb6-f86293b138c1",
    "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
    "type": "physical",
    "content": [
      {"title": "力量提升", "grade": "L3", "content": "point1_1"},
      {"title": "核心训练", "grade": "L3", "content": "point2_1"}
    ]
  },
  "plan": {
    "id": "...",
    "assessment_id": "...",
    "type": "physical",
    "content": [...]
  },
  "goals": {
    "id": "...",
    "assessment_id": "...",
    "type": "physical",
    "content": [...]
  }
}
```

- **assessment_data**: 根据测评类型（physical/technique/mental）返回不同的数据结构（StykuData/TrackmanData/MentalData）。
- **diagnosis/plan/goals**: 统一返回各自的 `content` 数组。

## /courses/:stu_id/:coach_id/:ass_id*

暂时还没有用到

对应的路由：r.GET("/courses/:stu_id/:coach_id/:ass_id", app.AuthMiddleware(db), api.HandleCoursesGet)

### Response

200 [{"id": "course-uuid", "name": "课程名称", "description": "课程描述"}]

## /users/:by

对应的路由：r.GET("/users/:by", app.AuthMiddleware(db), api.HandleGetUserByAny)
功能：通过:by来查Users表里面的信息，如：username、name、email、phone

例子：http://localhost:8080/users/Zhang San，查询用户表里name叫Zhang San的学生

### Response

```json
[
  {
    "id": "b266e8dd-0c3d-4ea7-8e6a-b06a828dc000",
    "role": "student",
    "name": "Zhang San",
    "email": "zhangsan@example.com",
    "gender": 1,
    "age": 23,
    "years_of_golf": 2,
    "created_at": "2026-01-06T15:50:30.747847+08:00",
    "updated_at": "2026-01-06T15:50:30.747847+08:00"
  },
  {
    "id": "8e6e8343-b12c-4e52-9d4d-2a895726f7a7",
    "role": "student",
    "name": "Zhang San",
    "email": "zhangs2an@example.com",
    "gender": 1,
    "age": 23,
    "years_of_golf": 2,
    "created_at": "2026-01-06T15:53:42.378431+08:00",
    "updated_at": "2026-01-06T15:53:42.378431+08:00"
  }
]
```

## /student/:by

对应的路由：r.GET("/students/:by", app.AuthMiddleware(db), api.HandleGetStudentByAny)

功能：功能：通过:by来查students表里面的信息，如：username、name、email、phone

例子：http://localhost:8080/students/David，查询学生表里name叫David的学生

### Response

```json
{
  "history": "中年转行，企业主",
  "height": 178,
  "weight": 80,
  "body_fat": "20.0%",
  "medical_history": "血压偏高",
  "purpose": "健康养生",
  "introduction": "零基础学员",
  "why_goal": "改善体质",
  "goal_benefits": "健康生活方式",
  "training_risks": "年龄较大需循序渐进"
}
```

## /diagnoses/:ass_id

对应的路由：r.GET("/diagnoses/:ass_id", app.AuthMiddleware(db), api.HandleDiagnosesGet)

实际测试的时候需要把:ass_id替换成assessment表里有的id。

### Response

```json
{
  "content": [
    {
    "title": "推杆",
    "content": "力度不稳 - 节奏练习"
    },
    {
    "title": "站位",
    "content": "瞄准偏差"
    }
  ],

  "content_en": [
    {
    "title": "推杆",
    "content": "Unstable force - Rhythm exercises"
    },
    {
    "title": "站位",
    "content": "Alignment deviation"
    }
  ]
}
```

## /plans/:ass_id

对应的路由：r.GET("/plans/:ass_id", app.AuthMiddleware(db), api.HandlePlansGet)

### Response

{

  "content": [

    {

    "title": "推杆",

    "content": "短推 20次"

    },

    {

    "title": "长推",

    "content": "距离控制练习"

    }

  ],

  "content_en": [

    {

    "title": "推杆",

    "content": "Short putts 20 times"

    },

    {

    "title": "长推",

    "content": "Distance control practice"

    }

  ]

}

## /goals/:ass_id

对应的路由：r.GET("/goals/:ass_id", app.AuthMiddleware(db), api.HandleGoalsGet)

### Response

{

  "content": [

    {

    "title": "短期目标",

    "content": "推杆精准"

    },

    {

    "title": "中期目标",

    "content": "切杆落点控制"

    }

  ],

  "content_en": [

    {

    "title": "短期目标",

    "content": "Improve putting precision"

    },

    {

    "title": "中期目标",

    "content": "Chipping landing control"

    }

  ]

}

## /trackman/latest/: stu_id *

对应的路由：r.GET("/trackman/latest/: stu_id", app.AuthMiddleware(db), api.HandleLatestTrackmanDataGet)

### Response

```json
{
    "ball_speed": 156.2,
    "launch_angle": 12.4,
    "launch_direction": "R 1.2",
    "spin_rate": 2450,
    "spin_axis": "L 2.1",
    "carry": 264,
    "landing_angle": 45.2,
    "offline": "R 12",
    "club_speed": 105.4,
    "attack_angle": -3.2,
    "club_path": 2.1,
    "face_angle": -1.2,
    "face_to_path": -3.3,
    "dynamic_loft": 15.4,
    "smash_factor": 1.48,
    "spin_loft": 18.6,
    "low_point": "4.2 / -1.2",
    "impact_offset": "H 2.1 / V 1.5",
    "indexing": "Smash: 102 / Spin: 98",
    "created_at": "2026-01-02T14:55:13.725347+08:00"
}
```

## /styku/latest/:stu_id *

r.GET("/styku/latest/:stu_id", app.AuthMiddleware(db), api.HandleLatestStykuDataGet)

功能：获取Styku测评数据

### Response

```json
{
  "height": 175.50,
  "weight": 70.20,
  "sitting_height": 90.30,
  "bmi": 22.9,
  "chest": 95.40,
  "waist": 78.20,
  "hip": 96.10,
  "upper_arm": 31.50,
  "forearm": 26.30,
  "thigh": 55.80,
  "calf": 37.20,
  "created_at": "2026-01-04T10:32:15+00:00"
}
```

## /mentalData/latest/:stu_id *

r.GET("/mentalData/latest/:stu_id", app.AuthMiddleware(db), api.HandleLatestMentalDataGet)

功能：获取Mental测评数据

### Response

{
  "focus": 7,
  "stress": 3,
  "confidence": 8,
  "stability": 6,
  "notes": "训练状态良好，挥杆节奏稳定，但在长杆时略有紧张。"
}

## /students(已修改为/relatedstudents,目前兼容两种接口，日后删除)

请求的路由：r.GET("/students", app.AuthMiddleware(db), api.HandleGetStudents)

功能：获取教练所带的学生及其历史和目标信息

注意：只有教练才能查看。

### Response

[

  {

    "id": "550e8400-e29b-41d4-a716-446655440002",

    "name": "Alice",

    "email": "alice@example.com",

    "role": "student",

    "gender": 0,

    "age": 25,

    "history": "曾接受一年系统高尔夫训练",

    "history_en": "Has received one year of systematic golf training",

    "purpose": "提升挥杆稳定性并降低差点",

    "purpose_en": "Improve swing stability and reduce handicap",

    "years_of_golf": 3

  },

  {

    "id": "550e8400-e29b-41d4-a716-446655440003",

    "name": "Bob",

    "email": "bob@example.com",

    "role": "student",

    "gender": 1,

    "age": 30,

    "history": "工作后开始学习高尔夫",

    "history_en": "Started learning golf after work",

    "purpose": "改善体质，放松身心",

    "purpose_en": "Improve physical fitness and relax mind and body",

    "years_of_golf": 2

  }

]

## /assessments/:stu_id?type=0

请求的路由：r.GET("/assessments/:stu_id?type=0", app.AuthMiddleware(db), api.HandleAssessmentsGet)

### Response

```json
[
  {
    "assessment_id": "c5b6aa62-539f-4aa0-9f93-022b97cec4d7",
    "title": "physical Assessment on 2026-01-06",
    "timestamp": "2026-01-06T11:45:04.792214+08:00",
    "status": "待处理"
  }
]
```

## /AIReport/:ass_id

请求的路由：r.GET("/AIReport/:ass_id", app.AuthMiddleware(db), api.HandleAIReportGet)

例如：http://localhost:8080/AIReport/770e8400-e29b-41d4-a716-446655440003

### Response

```json
{
  "report_intro": "青少年正处于身体发育的黄金期，科学的高尔夫体能训练不仅能优化专项技术动作模式、提升挥杆效率与击球稳定性，更能有效预防因肌肉失衡或核心控制不足引发的腰部、肩部及膝关节劳损。本报告基于多维数据评估，为学员量身定制兼具安全性、功能性和进阶性的训练路径。",
  "goal": {
    "long_term": "提高击球距离——通过优化下杆发力时序与全身动能链整合，释放更大球速与更优起飞角，实现可持续的距离增长。",
    "short_term": "修正挥杆平面——解决上杆过度导致的重心偏移问题，重建稳定、重复性强的上杆轨迹与肩髋分离模式，为下杆蓄能奠定基础。"
  },
  "fitness_diagnosis": "本次评估聚焦技术执行层面：上杆阶段存在明显过度旋转与重心横向偏移，反映核心稳定性与髋-肩协调性有待加强；下杆发力过早暴露神经肌肉控制延迟与下肢蹬转启动时机不准，易诱发厚击与动态平衡丧失。当前未采集柔软度、力量、爆发力等基础体能指标，建议后续补充Styku三维体态扫描与功能性动作筛查（FMS）以完善体能画像。",
  "training_plan": "【潜在风险警示】若持续忽视上杆稳定性与下杆时序训练，将加剧重心晃动与脊柱剪切力，显著增加腰背肌代偿风险，并固化厚击习惯，限制球速与倒旋控制能力提升；【核心训练内容】全挥杆训练强调‘空挥50次’建立神经肌肉记忆——重点感受上杆至顶点时重心居中、左膝稳定、右臀微收；‘击球100颗’需在Trackman实时反馈下聚焦球速与倒旋比，强化下杆由下而上的启动顺序；短杆‘切杆练习30分钟’通过小幅度动作强化手腕与前臂协同及触球瞬间的重心前倾控制；【训练回报与激励】坚持4周后，预计上杆重心偏移减少40%以上，厚击率下降50%，平均球速提升3–5 mph，为长期距离突破与击球一致性打下坚实基础。",
  "report_intro_en": "Adolescence represents a critical window for physical development; scientifically designed golf-specific conditioning not only enhances technical execution, swing efficiency, and shot consistency but also significantly reduces injury risk—particularly to the lower back, shoulders, and knees—caused by muscular imbalances or inadequate core control. This report delivers a safe, functional, and progressive training pathway, precisely tailored based on multi-dimensional assessment data.",
  "goal_en": {
    "long_term": "Increase carry distance—by optimizing downswing sequencing and full-body kinetic chain integration to generate higher ball speed and more efficient launch conditions for sustainable distance gains.",
    "short_term": "Correct swing plane—addressing excessive backswing rotation and lateral weight shift to re-establish a stable, repeatable top-of-backswing position and proper shoulder-hip separation, laying the biomechanical foundation for effective downswing loading."
  },
  "diagnosis_en": "",
  "plan_en": "",
  "trackman_data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "assessment_id": "770e8400-e29b-41d4-a716-446655440003",
    "ball_speed": 162,
    "launch_angle": 13.1,
    "launch_direction":**null**,
    "spin_rate": 8700,
    "spin_axis":**null**,
    "carry": 185,
    "landing_angle":**null**,
    "offline":**null**,
    "club_speed":**null**,
    "attack_angle": 5.5,
    "club_path": 3.3,
    "face_angle": 1.8,
    "face_to_path": 3,
    "dynamic_loft": 15.5,
    "smash_factor": 1.48,
    "spin_loft": 13,
    "low_point": "center",
    "impact_offset": "slight_right",
    "indexing": "excellent",
    "created_at": "2025-01-03T18:00:00+08:00"
  }

}
```

# PATCH

## /diagnoses

对应的路由：r.PATCH("/diagnoses", app.AuthMiddleware(db), api.HandleDiagnosesUpdate)
功能：更新诊断页面传回来的数据

**翻译功能**：支持自动翻译。根据 `language` 字段判断输入语言：

- `language: "cn"` 或 `language: "zh"`：输入内容为中文，系统自动翻译为英文并存储到 `content_en`
- `language: "en"`：输入内容为英文，系统自动翻译为中文并存储到 `content`

### Request

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "content": [{"title": "力量提升", "grade": "L2", "content": "point1_1"}, {"title": "核心训练", "grade": "L2", "content": "point2_1"}],
  "language": "cn"
}
```

### Response

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "id": "ab0e8400-e29b-41d4-a716-4466554400c2",
  "message": "Diagnosis updated successfully"
}
```

## /plans

对应的路由：r.PATCH("/plans", app.AuthMiddleware(db), api.HandlePlansUpdate)
功能：更新计划页面传回来的数据

**翻译功能**：支持自动翻译。根据 `language` 字段判断输入语言：

- `language: "cn"` 或 `language: "zh"`：输入内容为中文，系统自动翻译为英文并存储到 `content_en`
- `language: "en"`：输入内容为英文，系统自动翻译为中文并存储到 `content`

### Request

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "content": [{"title": "力量提升", "content": "point1_1"}, {"title": "核心训练", "content": "point2_1"}],
  "language": "cn"
}
```

### Response

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "id": "020e8400-e29b-41d4-a716-4466554400b2",
  "message": "Plans updated successfully"
}
```

## /goals

对应的路由：r.PATCH("/goals", app.AuthMiddleware(db), api.HandleGoalsUpdate)
功能：更新目标页面传回来的数据

**翻译功能**：支持自动翻译。根据 `language` 字段判断输入语言：

- `language: "cn"` 或 `language: "zh"`：输入内容为中文，系统自动翻译为英文并存储到 `content_en`
- `language: "en"`：输入内容为英文，系统自动翻译为中文并存储到 `content`

### Request

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "content": [{"title": "力量提升", "content": "point1_1"}, {"title": "核心训练", "content": "point2_1"}],
  "language": "cn"
}
```

### Response

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "id": "020e8400-e29b-41d4-a716-4466554400a2",
  "message": "Goals updated successfully"
}
```

## /trackman

对应的路由：r.PATCH("/trackman", app.AuthMiddleware(db), api.HandleTrackmanDataUpdate)

## Request

```json
{
"assessment_id": ”770e8400-e29b-41d4-a716-446655440002“,
 "ball_speed": 156.2,
    "launch_angle": 12.4,
    "launch_direction": "R 1.2",
    "spin_rate": 2450,
    "spin_axis": "L 2.1",
    "carry": 264,
    "landing_angle": 45.2,
    "offline": "R 12",
    "club_speed": 105.4,
    "attack_angle": -3.2,
    "club_path": 2.1,
    "face_angle": -1.2,
    "face_to_path": -3.3,
    "dynamic_loft": 15.4,
    "smash_factor": 1.48,
    "spin_loft": 18.6,
    "low_point": "4.2 / -1.2",
    "impact_offset": "H 2.1 / V 1.5",
    "indexing": "Smash: 102 / Spin: 98"
}
```

### Response

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "message": "TrackmanData updated successfully"
}
```

## /styku

对应的路由：r.PATCH("/styku", app.AuthMiddleware(db), api.HandleStykuDataUpdate)

### Request

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "height": 175.50,
  "weight": 70.20,
  "sitting_height": 90.30,
  "bmi": 22.9,
  "chest": 95.40,
  "waist": 78.20,
  "hip": 96.10,
  "upper_arm": 31.50,
  "forearm": 26.30,
  "thigh": 55.80,
  "calf": 37.20
}
```

### Response

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "message": "StykuData updated successfully"
}
```

## /mental

对应的路由：r.PATCH("/mentalData", app.AuthMiddleware(db), api.HandleMentalDataUpdate)

### Request

```json
{
  "assessment_id": "770e8400-e29b-41d4-a716-446655440002",
  "focus": 7,
  "stress": 3,
  "stability": 6
}
```

### Response

```json
{
  "assessment_id": "a1a97f6a-35b1-4937-9458-c4dd8ff3eff9",
  "message": "MentalData updated successfully"
}
```

## /AIReport

对应的路由：r.PATCH("/AIReport", app.AuthMiddleware(db), api.HandleAIReportUpdate)

说明：支持更新报告的各字段。`fitness_diagnosis` 和 `training_plan` 为 JSON 对象，可包含任意结构的内容。

### Request

```json
{
  "report_id": "ccbad023-ac79-4fb6-9863-bb08bdc38035",
  "report_intro": "更新后的中文报告引言",
  "goal": {
    "long_term": "提高核心稳定性",
    "short_term": "体脂率降低"
  },
  "fitness_diagnosis": {
    "content": "核心力量偏弱，下肢稳定性有提升空间。"
  },
  "training_plan": {
    "content": "每周2次核心训练、2次下肢训练，结合专项练习。"
  },
  "report_intro_en": "Updated English report introduction",
  "goal_en": {
    "long_term": "Improve core stability",
    "short_term": "Reduce body fat"
  },
  "diagnosis_en": {
    "content": "Weak core strength and limited lower-body stability."
  },
  "plan_en": {
    "content": "2 core sessions and 2 lower-body sessions per week."
  }
}
```

### Response

{

  "message": "AI report updated successfully",

  "report": {

    "id": "ccbad023-ac79-4fb6-9863-bb08bdc38035",

    "assessment_id": "770e8400-e29b-41d4-a716-446655440003",

    "report_intro": "更新后的中文报告引言",

    "goal": {

    "短期目标": "体脂率降低",

    "长期目标": "提高核心稳定性"

    },

    "fitness_diagnosis": "核心力量偏弱，下肢稳定性有提升空间。",

    "training_plan": "每周2次核心训练、2次下肢训练，结合专项练习。",

    "report_intro_en": "Updated English report introduction",

    "goal_en": {

    "long_term": "Improve core stability",

    "short_term": "Reduce body fat"

    },

    "fitness_diagnosis_en": "Weak core strength and limited lower-body stability.",

    "training_plan_en": "2 core sessions and 2 lower-body sessions per week.",

    "raw_payload": {

    "generated":**true**

    },

    "created_at": "2026-01-07T09:43:50.182134+08:00",

    "updated_at": "2026-01-07T09:55:40.267174+08:00"

  }

}

# DELETE

## /assessment

请求的路由：r.DELETE(“/assessment”, app.AuthMiddleware(db), api.HandleAssessmentDelete)

### Request

```json
{
  "assessment_id": "371b1c6e-362a-40d8-a2bf-b4786c2ef179"
}
```

### Response

```json
{
  "message": "Delete successfully."
}
```

## /AIReport/:report_id

对应的接口：r.DELETE("/AIReport/:report_id", app.AuthMiddleware(db), api.HandleAIReportDelete)

例如：http://localhost:8080/AIReport/ccbad023-ac79-4fb6-9863-bb08bdc38035

### Response

```json
{
  "deleted_id": "ccbad023-ac79-4fb6-9863-bb08bdc38035",
  "message": "AI report deleted successfully"
}
```
