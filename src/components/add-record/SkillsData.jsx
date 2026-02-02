/**
 * SkillsData - 技能测评数据采集组件
 * 功能：用于采集TrackMan挥杆数据，包括球路数据、杆头数据和击球效率数据
 * 特性：
 *   - 支持TrackMan数据同步（模拟）
 *   - 三层数据分类：球路核心数据（Layer A）、杆头数据（Layer B）、击球效率数据（Layer C）
 *   - 支持问题描述语音输入
 *   - 数值输入框支持增减按钮操作v
 * 使用场景：新增测评记录页面的技能测评-数据采集步骤
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Info, Plus, Minus, Mic } from 'lucide-react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../utils/LanguageContext';

const SkillsData = ({ data, update }) => {
    const { t } = useLanguage();
    const [isTesting, setIsTesting] = useState(false);
    const { isListening, startListening } = useVoiceInput();
    const [isListeningProblems, setIsListeningProblems] = useState(false);

    useEffect(() => {
        if (!isListening) {
            setIsListeningProblems(false);
        }
    }, [isListening]);

    // 生成随机数（在min和max之间，保留小数位）
    const randomFloat = (min, max, decimals = 1) => {
        const value = Math.random() * (max - min) + min;
        return parseFloat(value.toFixed(decimals));
    };

    // 生成随机整数
    const randomInt = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // 生成带方向的值（如 "R 1.2" 或 "L 2.1"）
    const randomDirection = (maxValue, decimals = 1) => {
        const value = randomFloat(0, maxValue, decimals);
        const direction = Math.random() > 0.5 ? 'R' : 'L';
        return `${direction} ${value.toFixed(decimals)}`;
    };

    // 生成带符号的值（如 "+2.1" 或 "-3.2"）
    const randomSigned = (maxValue, decimals = 1) => {
        const value = randomFloat(-maxValue, maxValue, decimals);
        return value >= 0 ? `+${value.toFixed(decimals)}` : value.toFixed(decimals);
    };

    // 生成TRACKMAN随机数据（包含青少年到顶尖高尔夫选手范围）
    const generateTrackmanData = () => {
        // Layer A - 球路核心数据
        const ballSpeed = randomFloat(100, 180, 1).toFixed(1);        // 球速：100-180 MPH（青少年到顶尖选手）
        const launchAngle = randomFloat(8, 18, 1).toFixed(1);         // 发射角：8-18 DEG（青少年到顶尖选手）
        const launchDirection = randomDirection(5.0, 1);               // 发射方向：L/R 0-5.0（青少年偏差可能更大）
        const spinRate = randomInt(1500, 3500).toString();             // 转速：1500-3500 RPM（青少年到顶尖选手）
        const spinAxis = randomDirection(6.0, 1);                      // 旋转轴：L/R 0-6.0（青少年偏差可能更大）
        const carry = randomInt(150, 320).toString();                  // 落点距离：150-320 YDS（青少年到顶尖选手）
        const landingAngle = randomFloat(35, 55, 1).toFixed(1);        // 着陆角：35-55 DEG（青少年到顶尖选手）
        const offline = randomDirection(40, 0);                       // 偏离距离：L/R 0-40 YDS（青少年偏差可能更大）

        // Layer B - 杆头数据
        const clubSpeed = randomFloat(70, 125, 1).toFixed(1);         // 杆头速度：70-125 MPH（青少年到顶尖选手）
        const attackAngle = randomSigned(6.0, 1);                     // 攻角：-6.0 到 +6.0 DEG（青少年范围可能更大）
        const clubPath = randomSigned(6.0, 1);                         // 挥杆轨迹：-6.0 到 +6.0 DEG（青少年范围可能更大）
        const faceAngle = randomSigned(6.0, 1);                        // 杆面角：-6.0 到 +6.0 DEG（青少年范围可能更大）
        const faceToPath = randomSigned(8.0, 1);                      // 杆面与路径：-8.0 到 +8.0 DEG（青少年范围可能更大）
        const dynamicLoft = randomFloat(10, 22, 1).toFixed(1);        // 动态杆面角：10-22 DEG（青少年到顶尖选手）
        const smashFactor = randomFloat(1.35, 1.50, 1).toFixed(1);    // 击球效率：1.35-1.50（青少年到顶尖选手）
        const spinLoft = randomFloat(14, 24, 1).toFixed(1);           // 旋转杆面角：14-24 DEG（青少年到顶尖选手）

        // Layer C - 击球效率数据（生成合理的组合值）
        const lowPointX = randomFloat(2.0, 6.0, 1);
        const lowPointY = randomSigned(2.0, 1);
        const lowPoint = `${lowPointX.toFixed(1)} / ${lowPointY}`;

        const impactOffsetH = randomDirection(3.0, 1);
        const impactOffsetV = randomFloat(0.5, 2.5, 1);
        const impactOffset = `${impactOffsetH} / V ${impactOffsetV.toFixed(1)}`;

        const smashIndex = randomInt(95, 105);
        const spinIndex = randomInt(92, 102);
        const indexing = `Smash: ${smashIndex} / Spin: ${spinIndex}`;

        // 随机生成问题描述
        const problems = [
            "球路略微偏右，触球瞬间杆面稍开。",
            "发射角略低，建议调整挥杆角度。",
            "旋转率偏高，需要优化击球位置。",
            "杆头速度稳定，但击球效率可进一步提升。",
            "挥杆轨迹良好，杆面角需要微调。"
        ];
        const randomProblem = problems[randomInt(0, problems.length - 1)];

        return {
            problems: randomProblem,
            layerA: {
                ballSpeed,
                launchAngle,
                launchDirection,
                spinRate,
                spinAxis,
                carry,
                landingAngle,
                offline
            },
            layerB: {
                clubSpeed,
                attackAngle,
                clubPath,
                faceAngle,
                faceToPath,
                dynamicLoft,
                smashFactor,
                spinLoft
            },
            layerC: {
                lowPoint,
                impactOffset,
                indexing
            }
        };
    };

    const startTest = () => {
        setIsTesting(true);
        setTimeout(() => {
            setIsTesting(false);
            const randomData = generateTrackmanData();
            update('trackmanData', randomData);
        }, 2000);
    };

    const updateProblems = (val) => {
        update('trackmanData.problems', val);
    };

    const updateLayer = (layer, key, val) => {
        update(`trackmanData.${layer}.${key}`, val);
    };

    return (
        <div className="page-container">
            <div className="page-header mb-4">
                <div className="page-title-group">
                    <h2 className="title-main">{t('trackmanTitle')}</h2>
                    <p className="title-subtitle">{t('trackmanSubtitle')}</p>
                </div>
                <motion.button
                    onClick={startTest}
                    disabled={isTesting}
                    className={cn("btn-scan", isTesting && "disabled")}
                >
                    <Activity size={14} className={isTesting ? "animate-pulse" : ""} strokeWidth={3} />
                    {isTesting ? t('syncingData') : t('syncData')}
                </motion.button>
            </div>

            {isTesting ? (
                <div className="scan-status-container">
                    <motion.div
                        className="scan-status-animation-line"
                        animate={{ top: ['0%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="scan-status-gradient"></div>
                    <Activity size={48} className="text-[#d4af37] mb-4 opacity-80" strokeWidth={1} />
                    <p className="processing-text">{t('processingSwing')}</p>
                </div>
            ) : ([data.trackmanData?.layerA, data.trackmanData?.layerB, data.trackmanData?.layerC].some(layer => layer && Object.values(layer).some(val => val && val.toString().trim() !== ''))) ? (
                <div className="scan-complete-container group">
                    <div className="absolute top-4 left-6">
                        <span className="system-encrypted-label">{t('systemEncrypted')}</span>
                    </div>
                    <div className="centered-content-container">
                        <Activity size={80} strokeWidth={0.5} className="text-[#d4af37]/10" />
                        <p className="data-sync-text">{t('dataSynchronized')}</p>
                    </div>
                </div>
            ) : (
                <div className="no-data-container">
                    <Activity size={40} className="text-white mb-3" strokeWidth={1} />
                    <p className="no-data-text">{t('noTrackmanData')}</p>
                </div>
            )
            }

            {
                !isTesting && (
                    <div className="space-y-8 px-2">
                        <section className="space-y-6">
                            <div className="section-header">
                                <div className="section-header-line"></div>
                                <h4 className="section-header-title">{t('ballFlightData')}</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <TrackmanInput label={t('ballSpeed')} unit="MPH" value={data.trackmanData?.layerA?.ballSpeed} onChange={v => updateLayer('layerA', 'ballSpeed', v)} />
                                <TrackmanInput label={t('launchAngle')} unit="DEG" value={data.trackmanData?.layerA?.launchAngle} onChange={v => updateLayer('layerA', 'launchAngle', v)} />
                                <TrackmanInput label={t('launchDirection')} unit="" value={data.trackmanData?.layerA?.launchDirection} onChange={v => updateLayer('layerA', 'launchDirection', v)} allowText={true} />
                                <TrackmanInput label={t('spinRate')} unit="RPM" value={data.trackmanData?.layerA?.spinRate} onChange={v => updateLayer('layerA', 'spinRate', v)} />
                                <TrackmanInput label={t('spinAxis')} unit="" value={data.trackmanData?.layerA?.spinAxis} onChange={v => updateLayer('layerA', 'spinAxis', v)} allowText={true} />
                                <TrackmanInput label={t('carry')} unit="YDS" value={data.trackmanData?.layerA?.carry} onChange={v => updateLayer('layerA', 'carry', v)} />
                                <TrackmanInput label={t('landingAngle')} unit="DEG" value={data.trackmanData?.layerA?.landingAngle} onChange={v => updateLayer('layerA', 'landingAngle', v)} />
                                <TrackmanInput label={t('offline')} unit="YDS" value={data.trackmanData?.layerA?.offline} onChange={v => updateLayer('layerA', 'offline', v)} allowText={true} />
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="section-decorative-line"></div>
                                <h4 className="section-title-text">{t('clubData')}</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <TrackmanInput label={t('clubSpeed')} unit="MPH" value={data.trackmanData?.layerB?.clubSpeed} onChange={v => updateLayer('layerB', 'clubSpeed', v)} />
                                <TrackmanInput label={t('attackAngle')} unit="DEG" value={data.trackmanData?.layerB?.attackAngle} onChange={v => updateLayer('layerB', 'attackAngle', v)} />
                                <TrackmanInput label={t('clubPath')} unit="DEG" value={data.trackmanData?.layerB?.clubPath} onChange={v => updateLayer('layerB', 'clubPath', v)} />
                                <TrackmanInput label={t('faceAngle')} unit="DEG" value={data.trackmanData?.layerB?.faceAngle} onChange={v => updateLayer('layerB', 'faceAngle', v)} />
                                <TrackmanInput label={t('faceToPath')} unit="DEG" value={data.trackmanData?.layerB?.faceToPath} onChange={v => updateLayer('layerB', 'faceToPath', v)} />
                                <TrackmanInput label={t('dynamicLoft')} unit="DEG" value={data.trackmanData?.layerB?.dynamicLoft} onChange={v => updateLayer('layerB', 'dynamicLoft', v)} />
                                <TrackmanInput label={t('smashFactor')} unit="" value={data.trackmanData?.layerB?.smashFactor} onChange={v => updateLayer('layerB', 'smashFactor', v)} />
                                <TrackmanInput label={t('spinLoft')} unit="DEG" value={data.trackmanData?.layerB?.spinLoft} onChange={v => updateLayer('layerB', 'spinLoft', v)} />
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="section-decorative-line"></div>
                                <h4 className="section-title-text">{t('deepAnalysis')}</h4>
                            </div>
                            <div className="space-y-4">
                                <TrackmanInputWide label={t('lowPoint')} value={data.trackmanData?.layerC?.lowPoint} onChange={v => updateLayer('layerC', 'lowPoint', v)} />
                                <TrackmanInputWide label={t('impactOffset')} value={data.trackmanData?.layerC?.impactOffset} onChange={v => updateLayer('layerC', 'impactOffset', v)} />
                                <TrackmanInputWide label={t('indexing')} value={data.trackmanData?.layerC?.indexing} onChange={v => updateLayer('layerC', 'indexing', v)} />
                            </div>
                        </section>
                    </div>
                )
            }
        </div >
    );
};

const TrackmanInputWide = ({ label, value, onChange }) => (
    <div className="styku-input-card group">
        <div className="styku-input-content">
            <p className="styku-input-label">
                {label}
            </p>
            <input
                type="text"
                className="styku-input-field"
                value={value || ""}
                onChange={e => onChange(e.target.value)}
                placeholder="--"
            />
        </div>
    </div>
);

const TrackmanInput = ({ label, unit, value, onChange, allowText = false }) => {
    const adjustValue = (delta) => {
        const valStr = (value || '').toString().trim();

        // 1. 处理带方向的值 (L/R)
        // 匹配: "R 5.2", "L 2.1", "R5.2"
        const dirMatch = valStr.match(/^([LR])\s*([\d\.]+)/i);
        if (dirMatch) {
            const dir = dirMatch[1].toUpperCase();
            const num = parseFloat(dirMatch[2]);
            if (isNaN(num)) return;

            let newNum = num + delta;
            // 方向值的数值部分不能为负
            if (newNum < 0) newNum = 0;

            onChange(`${dir} ${newNum.toFixed(1)}`);
            return;
        }

        // 2. 处理普通数字或带符号数字 (+/-)
        // 检查是否有显式加号
        const hasPlus = valStr.startsWith('+');
        const hasMinus = valStr.startsWith('-');
        const isSignedField = hasPlus || hasMinus;

        let num = parseFloat(valStr);
        if (isNaN(num)) num = 0;

        let newNum = num + delta;

        const content = newNum.toFixed(1);

        // 如果原来有正号且结果仍非负，保持正号
        if (isSignedField && newNum >= 0) {
            onChange(`+${content}`);
        } else {
            onChange(content);
        }
    };

    const handleInputChange = (e) => {
        let val = e.target.value;

        if (!allowText) {
            // 只允许数字、小数点、正负号
            // 移除非法字符
            val = val.replace(/[^\d.+\-]/g, '');

            // 只能有一个小数点
            const parts = val.split('.');
            if (parts.length > 2) {
                val = parts[0] + '.' + parts.slice(1).join('');
            }

            // 小数点后只能有一位
            if (parts.length === 2 && parts[1].length > 1) {
                val = parts[0] + '.' + parts[1].substring(0, 1);
            }

            // 暂时不做太严格的格式校验，允许用户输入过程中出现 "." 或 "-"
        }

        onChange(val);
    };

    return (
        <div className="styku-input-card group">
            <div className="styku-input-content">
                <p className="styku-input-label">
                    {label}
                </p>
                <p className="styku-input-unit">
                    {unit || 'UNIT'}
                </p>
                <input
                    type="text"
                    className="styku-input-field"
                    value={value || ""}
                    onChange={handleInputChange}
                    placeholder="--"
                />
            </div>

            <div className="styku-buttons-container">
                <button
                    type="button"
                    onClick={() => adjustValue(0.1)}
                    className="styku-button"
                    aria-label="increase"
                >
                    <Plus className="icon-plus-minus" />
                </button>
                <button
                    type="button"
                    onClick={() => adjustValue(-0.1)}
                    className="styku-button"
                    aria-label="decrease"
                >
                    <Minus className="icon-plus-minus" />
                </button>
            </div>
        </div>
    );
};

export default SkillsData;
