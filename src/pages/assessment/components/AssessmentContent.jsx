/**
 * 测评内容渲染器
 * 根据当前一级和二级导航渲染对应的内容组件
 */
import React from 'react';
import PhysicalData from '../../../components/add-record/PhysicalData';
import PhysicalDiagnosis from '../../../components/add-record/PhysicalDiagnosis';
import PhysicalPlan from '../../../components/add-record/PhysicalPlan';
import GoalSetting from '../../../components/add-record/GoalSetting';
import SkillsData from '../../../components/add-record/SkillsData';
import MentalData from '../../../components/add-record/MentalData';
import MentalDiagnosis from '../../../components/add-record/MentalDiagnosis';
import MentalPlan from '../../../components/add-record/MentalPlan';
import SkillsDiagnosis from '../../../components/add-record/SkillsDiagnosis';
import SkillsPlan from '../../../components/add-record/SkillsPlan';

const AssessmentContent = ({ 
    activePrimary, 
    activeSecondary, 
    recordData, 
    updateRecordData,
    primaryTabs,
    secondaryTabs,
    t 
}) => {
    // 体能测评
    if (activePrimary === 0) {
        if (activeSecondary === 0) return <PhysicalData data={recordData} update={updateRecordData} />;
        if (activeSecondary === 1) return <PhysicalDiagnosis data={recordData} update={updateRecordData} />;
        if (activeSecondary === 2) return <PhysicalPlan data={recordData} update={updateRecordData} />;
        if (activeSecondary === 3) return (
            <GoalSetting
                data={recordData}
                update={updateRecordData}
                dataKey="physicalGoals"
                title={t('physicalGoal')}
                subtitle={t('physicalGoalSubtitle')}
            />
        );
    }

    // 心理测评
    if (activePrimary === 1) {
        if (activeSecondary === 0) return <MentalData data={recordData} update={updateRecordData} />;
        if (activeSecondary === 1) return <MentalDiagnosis data={recordData} update={updateRecordData} />;
        if (activeSecondary === 2) return <MentalPlan data={recordData} update={updateRecordData} />;
        if (activeSecondary === 3) return (
            <GoalSetting
                data={recordData}
                update={updateRecordData}
                dataKey="mentalGoals"
                title={t('mentalGoal')}
                subtitle={t('mentalGoalSubtitle')}
            />
        );
    }

    // 技能测评
    if (activePrimary === 2) {
        if (activeSecondary === 0) return <SkillsData data={recordData} update={updateRecordData} />;
        if (activeSecondary === 1) return <SkillsDiagnosis data={recordData} update={updateRecordData} />;
        if (activeSecondary === 2) return <SkillsPlan data={recordData} update={updateRecordData} />;
        if (activeSecondary === 3) return (
            <GoalSetting
                data={recordData}
                update={updateRecordData}
                dataKey="skillsGoals"
                title={t('skillsGoal')}
                subtitle={t('skillsGoalSubtitle')}
            />
        );
    }

    // 默认占位
    return (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[32px] surface-weak">
            <p className="text-white/20 font-bold text-lg uppercase tracking-widest">
                {primaryTabs[activePrimary]?.label || t('unknown')}
            </p>
            <p className="text-white/40 font-bold text-2xl mt-2 uppercase">
                {secondaryTabs[activeSecondary]?.label || t('unknown')}
            </p>
            <p className="text-white/10 text-xs mt-4">内容开发中...</p>
        </div>
    );
};

export default AssessmentContent;
