/**
 * 数据采集页面
 * 功能：根据测评类型显示对应的数据采集组件
 * 路由：/add-record/:type/data
 * 大白话：这是一个路由分发页面，根据URL中的type参数（身体、心理、技能）来显示不同的数据输入表单
 */
import React from 'react'; // React核心库
import { useParams } from 'react-router-dom'; // 用来获取URL中的参数
import PhysicalData from '../../components/add-record/PhysicalData'; // 身体数据输入组件
import MentalData from '../../components/add-record/MentalData'; // 心理数据输入组件
import SkillsData from '../../components/add-record/SkillsData'; // 技能数据输入组件

const DataCollectionPage = ({ recordData, updateRecordData }) => {
    // 从URL中获取type参数，比如 /add-record/physical/data 中的 physical
    const { type } = useParams(); // type可能是: physical(身体), mental(心理), skills(技能)

    // 根据type类型返回对应的组件
    const renderContent = () => {
        // 用switch语句判断是哪种测评类型，然后显示对应的数据输入表单
        switch (type) {
            case 'physical': // 如果是身体测评
                return <PhysicalData data={recordData} update={updateRecordData} />;
            case 'mental': // 如果是心理测评
                return <MentalData data={recordData} update={updateRecordData} />;
            case 'skills': // 如果是技能测评
                return <SkillsData data={recordData} update={updateRecordData} />;
            default: // 如果类型不匹配，显示错误信息
                return (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[32px] surface-weak px-2 mx-2">
                        <p className="text-[16px] text-white font-bold uppercase tracking-widest">
                            未知的测评类型 {/* 错误标题：未知的类型 */}
                        </p>
                        <p className="text-[12px] text-[#A1A1AA] mt-2 uppercase tracking-widest">
                            {type} {/* 显示收到的是什么类型 */}
                        </p>
                    </div>
                );
        }
    };

    // 返回对应的内容组件
    return <>{renderContent()}</>;
};

export default DataCollectionPage;
