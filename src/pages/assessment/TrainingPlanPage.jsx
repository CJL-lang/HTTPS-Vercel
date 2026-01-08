/**
 * 训练方案页面
 * 功能：根据测评类型显示对应的训练方案组件
 * 路由：/add-record/:type/plan
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import PhysicalPlan from '../../components/add-record/PhysicalPlan';
import MentalPlan from '../../components/add-record/MentalPlan';
import SkillsPlan from '../../components/add-record/SkillsPlan';

const TrainingPlanPage = ({ recordData, updateRecordData }) => {
    const { type } = useParams(); // type: physical, mental, skills

    const renderContent = () => {
        switch (type) {
            case 'physical':
                return <PhysicalPlan data={recordData} update={updateRecordData} />;
            case 'mental':
                return <MentalPlan data={recordData} update={updateRecordData} />;
            case 'skills':
                return <SkillsPlan data={recordData} update={updateRecordData} />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[32px] surface-weak px-2 mx-2">
                        <p className="text-[16px] text-white font-bold uppercase tracking-widest">
                            未知的测评类型
                        </p>
                        <p className="text-[12px] text-[#A1A1AA] mt-2 uppercase tracking-widest">
                            {type}
                        </p>
                    </div>
                );
        }
    };

    return <>{renderContent()}</>;
};

export default TrainingPlanPage;

