# 一.待优化的功能
| 日期 | 需要完善的功能 | 相关页面 | 是否已完成 |
| :--- | :--- | :--- | :--- |
| 2026.1.4 | 新增技能报告页面中技能诊断板块加入增加模块和删减模块功能 | `/components/add-record/SkillDiagnosis` | 否 |
| 2026.1.4 | 新增技能报告页面中训练方案板块加入增加模块和删减模块功能 | `/components/add-record/SkillPlan` | 否 |
| 2026.1.4 | 如果用户是单独对某项进行测试，那么在写报告的页面只展示现在在做身体/心理/技能其中一个测量，不需要三个导航都展示 | `/components/add-record/xxx` | **是** |
| 2026.1.4 | 新增一整条测评流程，就是从身体开始一直到技能 | `/components/add-record/xxx` | **是** |
| 2026.1.4 | 因为现在的trackman、styku还有心理测评的数据收集都是前端给的，能不能让前端给的数据是一个范围随机值。 | `/components/add-record/XxxData` | 否 |
| 2026.1.4 | 心理素质的详细报告好像前端好像未能接受到后端数据，应该是前端问题 | `/reports/MentalReportDetailPage` | 否(不管) |
| 2026.1.4 | 技能训练的详细报告好像前端好像未能接受到后端数据，应该是前端问题 | `/reports/SkillReportDetailPage` | 否（不管） |



# 二.BUG列表
| 日期 | BUG描述 | 相关页面 | 是否已完成 |
| :--- | :--- | :--- | :--- |
| 2026.1.4 | 比如在新增身体素质报告中，每点一个保存就会新建一个报告表 | `/components/add-record` | 否（后端bug） |
| 2026.1.4 | 每个测评的最后保存按钮（目标保存按钮）好像会卡主 | `/components/add-record/XxxGoals` | 是 |
| 2026.1.4 | 在心理详细报告页面中，一刷新数据就丢失 | `/report/MentalDetailReportPage` | 是 |
