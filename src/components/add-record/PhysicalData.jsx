/**
 * PhysicalData - 身体素质测评数据采集组件
 * 功能：用于采集学员的身体素质数据，包括身高、体重、坐高、BMI以及各部位围度数据
 * 特性：
 *   - 支持STYKU 3D扫描数据接收（模拟）
 *   - 手动输入各项身体指标
 *   - 包含躯干、上肢、下肢围度数据采集
 *   - 支持数值增减按钮操作
 * 使用场景：新增测评记录页面的身体素质测评-数据采集步骤
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Scan, Activity, User, Plus, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';

const PhysicalData = ({ data, update }) => {
    const { t } = useLanguage();
    const [isScanning, setIsScanning] = useState(false);

    // 生成随机数（在min和max之间，保留小数位）
    const randomFloat = (min, max, decimals = 1) => {
        const value = Math.random() * (max - min) + min;
        return parseFloat(value.toFixed(decimals));
    };

    // 生成随机整数
    const randomInt = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // 生成STYKU随机数据（包含青少年到顶尖运动员范围）
    const generateStykuData = () => {
        // 身高：140-195 cm（青少年到顶尖运动员范围）
        const height = randomInt(140, 195);

        // 体重：35-90 kg（青少年到顶尖运动员范围）
        const weight = randomFloat(35, 90, 1);

        // 坐高：约为身高的50-55%
        const sittingHeight = Math.round(height * randomFloat(0.50, 0.55, 1));

        // BMI：根据身高体重自动计算（青少年到成年运动员范围）
        const bmi = parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1));

        // 躯干围度（根据身高体重比例调整）
        const baseChest = Math.round(height * 0.55); // 基础胸围约为身高的55%
        const chest = randomInt(Math.max(70, baseChest - 20), Math.min(115, baseChest + 15));
        const baseWaist = Math.round(height * 0.45); // 基础腰围约为身高的45%
        const waist = randomInt(Math.max(55, baseWaist - 15), Math.min(88, baseWaist + 10));
        const baseHip = Math.round(height * 0.50); // 基础臀围约为身高的50%
        const hip = randomInt(Math.max(70, baseHip - 18), Math.min(105, baseHip + 15));

        // 上肢围度（根据身高比例调整）
        const baseUpperArm = Math.round(height * 0.18); // 基础上臂围约为身高的18%
        const upperArm = randomInt(Math.max(20, baseUpperArm - 8), Math.min(38, baseUpperArm + 10));
        const baseForearm = Math.round(height * 0.15); // 基础前臂围约为身高的15%
        const forearm = randomInt(Math.max(18, baseForearm - 5), Math.min(30, baseForearm + 7));

        // 下肢围度（根据身高比例调整）
        const baseThigh = Math.round(height * 0.30); // 基础大腿围约为身高的30%
        const thigh = randomInt(Math.max(40, baseThigh - 10), Math.min(62, baseThigh + 12));
        const baseCalf = Math.round(height * 0.22); // 基础小腿围约为身高的22%
        const calf = randomInt(Math.max(25, baseCalf - 8), Math.min(42, baseCalf + 10));

        return {
            height,
            weight,
            sittingHeight,
            bmi,
            torso: { chest, waist, hip },
            upperLimbs: { upperArm, forearm },
            lowerLimbs: { thigh, calf }
        };
    };

    const startScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            setIsScanning(false);
            const randomData = generateStykuData();
            update('stykuData', randomData);
        }, 2000);
    };

    const updateField = (path, val) => {
        update(`stykuData.${path}`, val);
    };

    return (
        <div className="page-container">
            <div className="page-header mb-4">
                <div className="page-title-group">
                    <h2 className="title-main">{t('stykuTitle')}</h2>
                    <p className="title-subtitle">{t('stykuSubtitle')}</p>
                </div>
                <motion.button
                    onClick={startScan}
                    disabled={isScanning}
                    className={cn("btn-scan", isScanning && "disabled")}
                >
                    <Scan size={14} className={isScanning ? "animate-spin" : ""} strokeWidth={3} />
                    {isScanning ? t('receivingData') : t('receiveData')}
                </motion.button>
            </div>

            {isScanning ? (
                <div className="scan-status-container">
                    <motion.div
                        className="scan-status-animation-line"
                        animate={{ top: ['0%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <Scan size={48} className="text-[#d4af37] mb-4 opacity-80" strokeWidth={1} />
                    <p className="processing-text">{t('analyzingModel')}</p>
                </div>
            ) : data.stykuData?.height ? (
                <div className="scan-complete-container group">
                    <div className="absolute top-4 left-6">
                        <span className="system-encrypted-label">{t('systemEncrypted')}</span>
                    </div>
                    <div className="centered-content-container">
                        <User size={80} strokeWidth={0.5} className="text-[#d4af37]/10" />
                        <p className="data-sync-text">{t('modelGenerated')}</p>
                    </div>
                </div>
            ) : (
                <div className="no-data-container">
                    <Scan size={40} className="text-white mb-3" strokeWidth={1} />
                    <p className="no-data-text">{t('noScanData')}</p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 px-2">
                <StykuInput label={t('height')} unit="CM" value={data.stykuData?.height} onChange={v => updateField('height', v)} />
                <StykuInput label={t('weight')} unit="KG" value={data.stykuData?.weight} onChange={v => updateField('weight', v)} />
                <StykuInput label={t('sittingHeight')} unit="CM" value={data.stykuData?.sittingHeight} onChange={v => updateField('sittingHeight', v)} />
                <StykuInput label={t('bmi')} unit="" value={data.stykuData?.bmi} onChange={v => updateField('bmi', v)} />
            </div>

            <section className="space-y-6 px-2">
                <div className="section-header">
                    <div className="section-header-line"></div>
                    <h4 className="section-header-title">{t('torsoCircumference')}</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <StykuInput label={t('chest')} unit="CM" value={data.stykuData?.torso?.chest} onChange={v => updateField('torso.chest', v)} />
                    <StykuInput label={t('waist')} unit="CM" value={data.stykuData?.torso?.waist} onChange={v => updateField('torso.waist', v)} />
                    <StykuInput className="col-span-2" label={t('hip')} unit="CM" value={data.stykuData?.torso?.hip} onChange={v => updateField('torso.hip', v)} />
                </div>
            </section>

            <section className="space-y-6 px-2">
                <div className="section-header">
                    <div className="section-header-line"></div>
                    <h4 className="section-header-title">{t('upperLimbCircumference')}</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <StykuInput label={t('upperArm')} unit="CM" value={data.stykuData?.upperLimbs?.upperArm} onChange={v => updateField('upperLimbs.upperArm', v)} />
                    <StykuInput label={t('forearm')} unit="CM" value={data.stykuData?.upperLimbs?.forearm} onChange={v => updateField('upperLimbs.forearm', v)} />
                </div>
            </section>

            <section className="space-y-6 px-2">
                <div className="section-header">
                    <div className="section-header-line"></div>
                    <h4 className="section-header-title">{t('lowerLimbCircumference')}</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <StykuInput label={t('thigh')} unit="CM" value={data.stykuData?.lowerLimbs?.thigh} onChange={v => updateField('lowerLimbs.thigh', v)} />
                    <StykuInput label={t('calf')} unit="CM" value={data.stykuData?.lowerLimbs?.calf} onChange={v => updateField('lowerLimbs.calf', v)} />
                </div>
            </section>
        </div>
    );
};

const StykuInput = ({ label, unit, value, onChange, className }) => {
    const numeric = value === 0 || value ? parseFloat(value) : NaN;
    const isKgOrBmi = unit === 'KG' || !unit;
    const step = isKgOrBmi ? 0.1 : 1;

    const applyDelta = (delta) => {
        const current = Number.isFinite(numeric) ? numeric : 0;
        const next = Math.max(0, current + delta);
        const fixed = isKgOrBmi ? parseFloat(next.toFixed(1)) : Math.round(next);
        onChange(fixed);
    };

    return (
        <div className={cn("styku-input-card group", className)}>
            <div className="styku-input-content">
                <p className="styku-input-label">
                    {label}
                </p>
                <p className="styku-input-unit">
                    {unit || 'UNIT'}
                </p>
                <input
                    type="number"
                    step={step}
                    className="styku-input-field"
                    value={value ?? ""}
                    onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") onChange("");
                        else onChange(parseFloat(v));
                    }}
                    placeholder="--"
                />
            </div>

            <div className="styku-buttons-container">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        applyDelta(step);
                    }}
                    className="styku-button"
                    aria-label="increase"
                >
                    <Plus className="icon-plus-minus" />
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        applyDelta(-step);
                    }}
                    className="styku-button"
                    aria-label="decrease"
                >
                    <Minus className="icon-plus-minus" />
                </button>
            </div>
        </div>
    );
};

export default PhysicalData;
