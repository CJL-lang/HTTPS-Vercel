import React, { useEffect, useMemo } from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    defaults
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { useLanguage } from '../../utils/LanguageContext';

// ---- Gold gradient + glow helpers (Chart.js scriptable options) ----
const goldAreaGradientCache = new WeakMap();
const goldStrokeGradientCache = new WeakMap();

const fallbackGoldFill = 'rgba(212, 175, 55, 0.22)';
const fallbackGoldStroke = 'rgba(212, 175, 55, 0.85)';

function getChartAreaKey(area) {
    return `${area.left},${area.top},${area.right},${area.bottom}`;
}

function getGoldAreaGradient(chart) {
    const area = chart?.chartArea;
    const ctx = chart?.ctx;
    if (!area || !ctx) return fallbackGoldFill;

    const key = getChartAreaKey(area);
    const cached = goldAreaGradientCache.get(chart);
    if (cached?.key === key) return cached.gradient;

    // Bottom -> top linear gold gradient (stronger at bottom, lighter towards top).
    const g = ctx.createLinearGradient(0, area.bottom, 0, area.top);
    g.addColorStop(0.00, 'rgba(212, 175, 55, 0.50)'); // bottom rich gold
    g.addColorStop(0.35, 'rgba(255, 214, 120, 0.38)'); // warm gold
    g.addColorStop(0.70, 'rgba(255, 250, 220, 0.22)'); // highlight
    g.addColorStop(1.00, 'rgba(212, 175, 55, 0.08)'); // top fade

    goldAreaGradientCache.set(chart, { key, gradient: g });
    return g;
}

function getGoldStrokeGradient(chart) {
    const area = chart?.chartArea;
    const ctx = chart?.ctx;
    if (!area || !ctx) return fallbackGoldStroke;

    const key = getChartAreaKey(area);
    const cached = goldStrokeGradientCache.get(chart);
    if (cached?.key === key) return cached.gradient;

    // Match fill: bottom -> top stroke gradient.
    const g = ctx.createLinearGradient(0, area.bottom, 0, area.top);
    g.addColorStop(0.00, 'rgba(255, 208, 105, 0.98)'); // bottom bright
    g.addColorStop(0.55, 'rgba(255, 235, 170, 0.92)'); // mid highlight
    g.addColorStop(1.00, 'rgba(212, 175, 55, 0.78)'); // top classic gold

    goldStrokeGradientCache.set(chart, { key, gradient: g });
    return g;
}

const goldGlowPlugin = {
    id: 'goldGlow',
    beforeDatasetDraw(chart, args, pluginOptions) {
        if (!pluginOptions?.enabled) return;
        const dataset = chart.data?.datasets?.[args.index];
        if (!dataset?._goldGlow) return;
        const ctx = chart.ctx;
        ctx.save();
        ctx.shadowColor = 'rgba(212, 175, 55, 0.55)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    },
    afterDatasetDraw(chart, args, pluginOptions) {
        if (!pluginOptions?.enabled) return;
        const dataset = chart.data?.datasets?.[args.index];
        if (!dataset?._goldGlow) return;
        chart.ctx.restore();
    }
};

function parseMaybeJson(value) {
    if (typeof value !== 'string') return value;
    const s = value.trim();
    if (!s) return value;
    const looksLikeJson =
        (s.startsWith('{') && s.endsWith('}')) ||
        (s.startsWith('[') && s.endsWith(']'));
    if (!looksLikeJson) return value;
    try {
        return JSON.parse(s);
    } catch (e) {
        return value;
    }
}

function toSnakeCase(str) {
    return String(str).replace(/([A-Z])/g, '_$1').toLowerCase();
}

function getFieldValue(obj, field) {
    if (!obj || typeof obj !== 'object') return undefined;
    if (Object.prototype.hasOwnProperty.call(obj, field)) return obj[field];
    const snake = toSnakeCase(field);
    if (Object.prototype.hasOwnProperty.call(obj, snake)) return obj[snake];
    return undefined;
}

// 注册 Chart.js 组件
ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    goldGlowPlugin
);

/**
 * 将L1-L4等级转换为0-100的数值
 * L1 = 25, L2 = 50, L3 = 75, L4 = 100
 */
const convertLevelToScore = (value, type) => {
    if (typeof value === 'number') {
        // 如果已经是数字，根据类型判断
        if (type === 'physical') {
            // 如果是1-4的数值，转换为0-100
            if (value >= 1 && value <= 4) {
                return (value / 4) * 100;
            }
            return value;
        } else if (type === 'skills') {
            // 如果是1-9的数值，转换为0-100
            if (value >= 1 && value <= 9) {
                return (value / 9) * 100;
            }
            return value;
        } else if (type === 'mental') {
            // Some backends may still return 1-4 levels for mental; map to 0-100.
            if (value >= 1 && value <= 4) {
                return (value / 4) * 100;
            }
        }
        // 心理维度直接使用0-100的数值
        return Math.min(100, Math.max(0, value));
    }

    if (typeof value === 'string') {
        // 处理字符串格式的等级，如 "L1", "L2" 等
        const levelMatch = value.match(/L(\d+)/i);
        if (levelMatch) {
            const level = parseInt(levelMatch[1], 10);
            if (type === 'physical') {
                // L1-L4: L1=25, L2=50, L3=75, L4=100
                if (level >= 1 && level <= 4) {
                    return (level / 4) * 100;
                }
            } else if (type === 'skills') {
                // L1-L9: L1≈11, L2≈22, ..., L9=100
                if (level >= 1 && level <= 9) {
                    return (level / 9) * 100;
                }
            } else if (type === 'mental') {
                // Allow L1-L4 for mental as well (map to 0-100)
                if (level >= 1 && level <= 4) {
                    return (level / 4) * 100;
                }
            }
        }

        // 尝试直接解析为数字
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            if (type === 'physical' && numValue >= 1 && numValue <= 4) {
                return (numValue / 4) * 100;
            } else if (type === 'skills' && numValue >= 1 && numValue <= 9) {
                return (numValue / 9) * 100;
            } else if (type === 'mental' && numValue >= 1 && numValue <= 4) {
                return (numValue / 4) * 100;
            }
            return Math.min(100, Math.max(0, numValue));
        }
    }

    return 0;
};

/**
 * 通用雷达图组件 - 支持动态项目数量
 * @param {Object} props
 * @param {Object|Array} props.data - 评分数据
 *   - 如果是对象: {labels: string[], values: (string|number)[]}
 *   - 兼容旧格式对象
 * @param {'mental'|'physical'|'skills'} props.type - 报告类型
 * @param {string} props.className - 可选的自定义样式类
 * @param {string} props.title - 可选的图表标题，如果不提供则使用默认标题
 */
const RadarChart = ({ data, type, className = '', title }) => {
    const { language, t } = useLanguage();

    // Keep chart fonts consistent with app fonts (CSS :lang controls --font-sans).
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim();
        defaults.font.family = cssVar || "'Inter', system-ui, -apple-system, sans-serif";
    }, [language]);

    // 获取默认标题
    const defaultTitle = useMemo(() => {
        if (type === 'mental') return t('mentalQualityEvaluation');
        if (type === 'physical') return t('physicalQualityAssessment');
        if (type === 'skills') return t('skillsLevelAssessment');
        return '';
    }, [type, t]);

    const chartTitle = title || defaultTitle;

    // 提取并验证数据
    const chartData = useMemo(() => {
        // 如果完全没有数据，标记为空
        if (!data) return { isEmpty: true };

        // 解析数据格式
        let labels = [];
        let rawValues = [];

        if (Array.isArray(data)) {
            // 如果传入的是数组，暂时不支持（需要labels）
            console.warn('RadarChart: data should be an object with labels and values');
            return { isEmpty: true };
        } else if (typeof data === 'object') {
            // 新格式: {labels: [], values: []}
            if (data.labels && data.values) {
                labels = data.labels;
                rawValues = data.values;
            } else {
                // 旧格式兼容：尝试解析为对象格式
                const normalized = parseMaybeJson(data);
                if (!normalized || typeof normalized !== 'object') {
                    return { isEmpty: true };
                }

                // 如果是旧的对象格式，提取所有键值对
                labels = Object.keys(normalized);
                rawValues = Object.values(normalized);
            }
        }

        // 验证数据
        if (!labels.length || !rawValues.length || labels.length !== rawValues.length) {
            return { isEmpty: true };
        }

        // 转换值
        const values = rawValues.map(value => convertLevelToScore(value, type));

        // 如果所有值都是0，标记为未填写
        if (values.every(v => v === 0)) {
            return { isEmpty: true };
        }

        return {
            labels,
            datasets: [
                {
                    label: chartTitle,
                    data: values,
                    // Gold gradient fill (scriptable) + glow via plugin
                    backgroundColor: (ctx) => getGoldAreaGradient(ctx.chart),
                    borderColor: (ctx) => getGoldStrokeGradient(ctx.chart),
                    borderWidth: 2,
                    pointBackgroundColor: '#d4af37',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#d4af37',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    _goldGlow: true
                }
            ]
        };
    }, [data, chartTitle, type]);

    // 如果数据为空（完全没有数据或都是0），显示提示信息
    if (chartData?.isEmpty) {
        return (
            <div className={`mb-10 ${className}`}>
                <div className="mb-4 sm:mb-8 flex flex-col gap-1">
                    <h2 className="text-[16px] sm:text-[20px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#d4af37]">
                        {chartTitle}
                    </h2>
                    <div className="h-[2px] w-12 sm:w-20 bg-gradient-to-r from-[#d4af37] to-transparent"></div>
                </div>

                <div className="glass-card border border-white/10 surface-strong rounded-2xl sm:rounded-[32px] p-6 sm:p-8 shadow-xl">
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                        <div className="w-16 h-16 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-[#d4af37]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-white/60 text-sm sm:text-base font-medium text-center">
                            {t('coachNotFilledGrades') || '教练未填写等级信息'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // 图表配置选项
    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.2,
        scales: {
            r: {
                min: 0,
                max: 100,
                beginAtZero: true,
                angleLines: {
                    color: 'rgba(255, 255, 255, 0.1)',
                    lineWidth: 1
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                    circular: true
                },
                pointLabels: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: {
                        size: window.innerWidth < 640 ? 10 : 12,
                        weight: 'bold'
                    },
                    padding: 10
                },
                ticks: {
                    color: 'rgba(212, 175, 55, 0.5)',
                    backdropColor: 'transparent',
                    font: {
                        size: 10,
                        weight: 'bold'
                    },
                    stepSize: type === 'physical' ? 25 : type === 'skills' ? (100 / 8) : 20,
                    showLabelBackdrop: false,
                    callback: function (value, index) {
                        if (type === 'physical') {
                            // L1-L4: 将0-100映射到L1-L4
                            // 刻度点: 0, 33.33, 66.67, 100 -> 不显示0，显示L1, L2, L3, L4
                            // 每个等级占25%: 0-25(L1), 25-50(L2), 50-75(L3), 75-100(L4)
                            // L1不应该是0，所以0刻度点不显示标签
                            if (value === 0) return '';
                            if (value <= 25) return 'L1';
                            if (value <= 50) return 'L2'; // 25-50显示L2，包括33.33
                            if (value <= 75) return 'L3'; // 50-75显示L3，包括66.67
                            return 'L4'; // 75-100显示L4，包括100
                        } else if (type === 'skills') {
                            // L1-L9: 将0-100映射到L1-L9
                            // 刻度点: 0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100 -> 不显示0，显示L1-L9
                            // 每个等级占 100/9 ≈ 11.11
                            // L1不应该是0，所以0刻度点不显示标签
                            if (value === 0) return '';
                            // 使用精确的区间判断
                            const level = Math.ceil((value / 100) * 9);
                            const displayLevel = Math.max(1, Math.min(9, level));
                            return `L${displayLevel}`;
                        } else {
                            // mental: 显示数值 0-100
                            return Math.round(value);
                        }
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            goldGlow: {
                enabled: true
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#d4af37',
                bodyColor: '#fff',
                borderColor: '#d4af37',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        const value = context.parsed.r;
                        if (type === 'physical') {
                            // 将0-100转换回L1-L4显示
                            const level = Math.round((value / 100) * 4);
                            const displayLevel = Math.max(1, Math.min(4, level));
                            return `${context.label}: L${displayLevel}`;
                        } else if (type === 'skills') {
                            // 将0-100转换回L1-L9显示
                            const level = Math.round((value / 100) * 9);
                            const displayLevel = Math.max(1, Math.min(9, level));
                            return `${context.label}: L${displayLevel}`;
                        } else {
                            // 心理维度显示0-100分
                            return `${context.label}: ${Math.round(value)}/100`;
                        }
                    }
                }
            }
        },
        interaction: {
            mode: 'nearest',
            intersect: false
        }
    }), [type]);

    return (
        <div className={`mb-10 ${className}`}>
            <div className="mb-4 sm:mb-8 flex flex-col gap-1">
                <h2 className="text-[16px] sm:text-[20px] font-semibold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-[#d4af37]">
                    {chartTitle}
                </h2>
                <div className="h-[2px] w-12 sm:w-20 bg-gradient-to-r from-[#d4af37] to-transparent"></div>
            </div>

            <div className="glass-card border border-white/10 surface-strong rounded-2xl sm:rounded-[32px] p-6 sm:p-8 shadow-xl">
                <div className="w-full" style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <Radar data={chartData} options={options} />
                </div>
            </div>
        </div>
    );
};

// 使用 React.memo 优化性能
export default React.memo(RadarChart);

