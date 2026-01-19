/**
 * 体能报告页面
 * 功能：显示体能测评历史记录，查看过往的Styku 3D扫描数据记录
 * 路由：/physical-report
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';

const PhysicalReportPage = ({ onBack, onAddRecord }) => {
    const { studentId } = useParams();
    const { t } = useLanguage();

    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!studentId) {
            setLoading(false);
            return;
        }

        const fetchStykuData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const response = await fetch(`/api/students/${studentId}/styku`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': user.token ? `Bearer ${user.token}` : '',
                    },
                    body: JSON.stringify({}),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();

                // 假设 data 是数组，映射到 records 格式
                const mappedRecords = data.map((item, index) => ({
                    id: item.id || index + 1,
                    date: item.date || 'N/A',
                    title: item.title || t('physicalAssessment'),
                    status: item.status === 'completed' ? t('statusCompleted') : t('statusPending'),
                    statusColor: item.status === 'completed' ? 'text-green-400' : 'text-yellow-400',
                    action: t('next')
                }));

                setRecords(mappedRecords);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStykuData();
    }, [studentId, t]);

    return (
        <div className="min-h-screen text-white p-6 pb-20 relative overflow-hidden bg-transparent">
            {/* Header - Back button left, Text right */}
            <div className="relative z-10 mb-10 mt-4 flex justify-between items-start">
                <button
                    onClick={onBack}
                    className="btn-back"
                >
                    <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                </button>

                <div className="flex flex-col items-end text-right">
                    <p className="text-[11px] font-bold text-[#d4af37] uppercase tracking-[0.2em] mb-1">{t('assessmentRecordsLabel')}</p>
                    <h1 className="text-3xl font-bold text-white tracking-tighter mb-1">{t('physicalHistory')}</h1>
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Styku 3D</p>
                </div>
            </div>

            {/* Records List */}
            <div className="space-y-4 relative z-10 max-w-md mx-auto">
                {loading && (
                    <div className="text-center py-8">
                        <p className="text-white/60">{t('loading') || 'Loading...'}</p>
                    </div>
                )}
                {error && (
                    <div className="text-center py-8">
                        <p className="text-red-400">Error: {error.message || error.toString() || 'Unknown error'}</p>
                    </div>
                )}
                {!loading && !error && records.map((record) => (
                    <div
                        key={record.id}
                        className="glass-card p-6 border-[#d4af37]/30 surface-strong rounded-2xl sm:rounded-[32px] relative overflow-hidden group transition-all duration-300 hover:border-[#d4af37]/60 shadow-lg shadow-black/20"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="px-3 py-1 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20">
                                <span className="text-[11px] font-bold text-[#d4af37] tracking-wider">{record.date}</span>
                            </div>
                            <span className={`text-[11px] font-bold uppercase tracking-widest ${record.statusColor}`}>
                                {record.status}
                            </span>
                        </div>

                        <div className="flex items-end justify-between">
                            <h3 className="text-lg font-bold text-white/90 max-w-[60%] leading-tight uppercase tracking-tight">
                                {record.title}
                            </h3>
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full surface-weak border border-white/10 hover:bg-[#d4af37]/20 hover:border-[#d4af37]/40 transition-all group">
                                <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">{record.action}</span>
                                <ChevronRight className="w-4 h-4 text-[#d4af37] opacity-40 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Bottom Action - Centered and following the list */}
                <div className="pt-4 flex justify-center">
                    <button
                        onClick={onAddRecord}
                        className="w-full py-5 rounded-2xl sm:rounded-[32px] bg-gradient-to-r from-[#d4af37] via-[#f9e29c] to-[#b8860b] text-black font-bold text-base shadow-[0_10px_30px_rgba(212,175,55,0.3)] active:scale-[0.98] transition-all"
                    >
                        {t('addRecord')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PhysicalReportPage;
