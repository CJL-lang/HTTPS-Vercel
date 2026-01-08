/**
 * 技能诊断页面
 * 功能：根据测评类型显示对应的诊断组件
 * 路由：/add-record/:type/diagnosis
 * 大白话：诊断步骤页面，根据type参数显示身体/心理/技能诊断表单
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import PhysicalDiagnosis from '../../components/add-record/PhysicalDiagnosis';
import MentalDiagnosis from '../../components/add-record/MentalDiagnosis';
import SkillsDiagnosis from '../../components/add-record/SkillsDiagnosis';

const DiagnosisPage = ({ recordData, updateRecordData }) => {
    // 从URL获取测评类型（physical/mental/skills）
    const { type } = useParams(); // type: physical(身体), mental(心理), skills(技能)

    // 根据type渲染对应的诊断组件
    const renderContent = () => {
        switch (type) {
            case 'physical': // 身体诊断
                return <PhysicalDiagnosis data={recordData} update={updateRecordData} />;
            case 'mental':
                return <MentalDiagnosis data={recordData} update={updateRecordData} />;
            case 'skills':
                return <SkillsDiagnosis data={recordData} update={updateRecordData} />;
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

export default DiagnosisPage;

