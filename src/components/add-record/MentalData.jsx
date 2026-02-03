/**
 * MentalData - 心理测评数据采集组件
 * 功能：用于采集学员的心理素质数据，包括专注能力、心理韧性和自信与动机
 * 特性：
 *   - 支持数据接收（模拟）
 *   - 三个核心指标：专注能力、心理韧性、自信与动机
 *   - 数值输入框支持增减按钮操作
 *   - 卡片式布局，每个指标独立卡片
 * 使用场景：新增测评记录页面的心理测评-数据采集步骤
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, Zap, ShieldCheck, Plus, Minus, Download } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';

const MentalData = ({ data, update }) => {
    const { t } = useLanguage();
    const [isReceiving, setIsReceiving] = useState(false);

    const updateField = (field, val) => {
        update(`mentalData.${field}`, val);
    };

    const handleReceiveData = () => {
        setIsReceiving(true);
        // 模拟接收数据逻辑
        const mockData = {
            focus: '85',
            stability: '79',
            confidence: '90'
        };

        setTimeout(() => {
            Object.entries(mockData).forEach(([key, value]) => {
                updateField(key, value);
            });
            setIsReceiving(false);
        }, 1000);
    };

    const metrics = [
        { id: 'focus', label: t('focusAbility'), icon: <Target size={16} />, unit: t('Point') },
        { id: 'stability', label: t('mentalResilience'), icon: <ShieldCheck size={16} />, unit: t('Point') },
        { id: 'confidence', label: t('confidenceAndMotivation'), icon: <Zap size={16} />, unit: t('Point') }
    ];

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="page-title-group">
                    <h2 className="title-main">{t('mentalAssessment')}</h2>
                    <p className="title-subtitle">{t('mentalAssessmentSubtitle')}</p>
                </div>
                <motion.button
                    onClick={handleReceiveData}
                    disabled={isReceiving}
                    className={cn("btn-receive-data", isReceiving && "disabled")}
                >
                    <Download size={14} className={isReceiving ? "animate-bounce" : ""} strokeWidth={3} />
                    {isReceiving ? t('receivingData') : t('receiveData')}
                </motion.button>
            </div>

            <div className="grid-container">
                {metrics.map((metric) => (
                    <div key={metric.id} className="data-card group">
                        <div className="metric-content">
                            <div className="metric-icon-container">
                                {metric.icon}
                            </div>
                            <div className="metric-label-container">
                                <h4 className="metric-label">
                                    {metric.label}
                                </h4>
                            </div>
                        </div>

                        <div className="metric-controls">
                            <div className="number-input-container">
                                <button
                                    onClick={() => {
                                        const current = parseFloat(data.mentalData?.[metric.id]) || 0;
                                        updateField(metric.id, Math.max(0, Math.round(current - 1)).toString());
                                    }}
                                    className="number-input-btn"
                                    disabled={isReceiving}
                                >
                                    <Minus size={12} className={cn("text-[#d4af37]", isReceiving && "opacity-50")} />
                                </button>
                                <input
                                    type="number"
                                    step="0.1"
                                    className="number-input"
                                    value={data.mentalData?.[metric.id] || ""}
                                    onChange={e => {
                                        const value = e.target.value;
                                        if (value === "") {
                                            updateField(metric.id, "");
                                        } else {
                                            const numValue = parseFloat(value);
                                            if (!isNaN(numValue)) {
                                                updateField(metric.id, Math.round(numValue).toString());
                                            }
                                        }
                                    }}
                                    placeholder="0"
                                    disabled={isReceiving}
                                />
                                <button
                                    onClick={() => {
                                        const current = parseFloat(data.mentalData?.[metric.id]) || 0;
                                        updateField(metric.id, Math.min(100, Math.round(current + 1)).toString());
                                    }}
                                    className="number-input-btn"
                                    disabled={isReceiving}
                                >
                                    <Plus size={12} className={cn("text-[#d4af37]", isReceiving && "opacity-50")} />
                                </button>
                            </div>
                            <span className="unit-label">{metric.unit}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MentalData;
