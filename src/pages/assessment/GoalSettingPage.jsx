/**
 * 目标制定页面
 * 功能：根据测评类型显示对应的目标制定组件
 * 路由：/add-record/:type/goal
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import GoalSetting from '../../components/add-record/GoalSetting';

const GoalSettingPage = ({ recordData, updateRecordData }) => {
    const { type } = useParams(); // type: physical, mental, skills

    const getGoalConfig = () => {
        switch (type) {
            case 'physical':
                return {
                    dataKey: 'physicalGoals',
                    title: '身体素质目标制定',
                    subtitle: '规划各阶段体能提升目标'
                };
            case 'mental':
                return {
                    dataKey: 'mentalGoals',
                    title: '心理素质目标制定',
                    subtitle: '规划各阶段心理素质提升目标'
                };
            case 'skills':
                return {
                    dataKey: 'skillsGoals',
                    title: '技能测评目标制定',
                    subtitle: '规划各阶段技术提升目标'
                };
            default:
                return {
                    dataKey: 'goals',
                    title: '目标制定',
                    subtitle: '规划各阶段提升目标'
                };
        }
    };

    const config = getGoalConfig();

    return (
        <GoalSetting
            data={recordData}
            update={updateRecordData}
            dataKey={config.dataKey}
            title={config.title}
            subtitle={config.subtitle}
        />
    );
};

export default GoalSettingPage;

