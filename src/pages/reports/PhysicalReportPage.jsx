/**
 * 体能报告页面
 * 功能：显示体能测评历史记录，查看过往的Styku 3D扫描数据记录
 * 路由：/physical-report
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Brain, ArrowUpDown } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../utils/LanguageContext';
import { createAssessment, deleteAIReport, deleteAssessment } from '../assessment/utils/assessmentApi';
import { loadAssessmentStep, clearAssessmentStep } from '../assessment/utils/assessmentProgress';
import { useToast } from '../../components/toast/ToastProvider';
import { clearAIReportGenerating, hasAIReportReadyHint, isAIReportGenerating, onAIReportWsEvent } from '../../services/aiReportWsClient';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../utils/api';

const PhysicalReportPage = ({ onBack, onAddRecord, navigate, user, student }) => {
    const { id } = useParams();
    const { t, language } = useLanguage();
    const { addToast } = useToast();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = 从新到旧, 'asc' = 从旧到新
    const [refreshKey, setRefreshKey] = useState(0); // 用于触发列表刷新
    // 用于防止重复加载的 Ref
    const lastFetchedRef = useRef(null);
    // 存储原始数据，用于排序
    const rawRecordsRef = useRef([]);

    const backendLang = language === 'en' ? 'en' : 'cn';

    const applyReportCompletion = (assessmentId, reason = 'ws-complete') => {
        if (!assessmentId) return;
        clearAIReportGenerating(assessmentId, reason);
        const updater = (list) => (list || []).map((record) => {
            if (!record || String(record.id) !== String(assessmentId)) return record;
            return {
                ...record,
                status: 'completed',
                has_ai_report: 1
            };
        });
        rawRecordsRef.current = updater(rawRecordsRef.current);
        setRecords((prev) => updater(prev));
    };

    const performDeleteRecord = async (record) => {
        const assessmentId = record?.id;
        if (!assessmentId) return;

        if (deleting) return;
        setDeleting(true);

        const hasAIReport =
            record?.has_ai_report === 1 ||
            record?.has_ai_report === true ||
            record?.ai_report_id ||
            record?.aiReportId;

        if (hasAIReport) {
            await deleteAIReport(assessmentId, user);
        }

        const ok = await deleteAssessment(assessmentId, user);
        if (ok) {
            clearAssessmentStep({ userId: user?.id || 'guest', assessmentId });
            clearAIReportGenerating(assessmentId, 'deleted');
            setRecords(prev => (prev || []).filter(r => r?.id !== assessmentId));
        } else {
            addToast({
                kind: 'error',
                title: t('delete'),
                description: t('deleteFailed'),
                durationMs: 4000
            });
        }
        setDeleting(false);
    };

    const requestDeleteRecord = (record) => {
        setDeleteTarget(record);
        setShowDeleteConfirm(true);
    };

    // 加载草稿和已完成的记录 - 优先从后端获取已完成记录，草稿保留在本地
    useEffect(() => {
        const fetchRecords = async () => {
            // 优先使用 URL 中的 id，如果没有则使用 student.id
            const targetId = id || student?.id;

            if (!targetId || !user?.token) return;

            // 如果已经加载过这个目标的记录，不再重复加载
            // 注意：当 refreshKey 变化（强制刷新）时，我们应该跳过这个缓存检查
            const fetchKey = `${targetId}_${user.token}_${refreshKey}`;
            const isFirstLoad = lastFetchedRef.current !== fetchKey;

            // 只有当不是强制刷新(refreshKey===0)且已有数据时，才进行简单的排序优化
            // 如果 refreshKey > 0，说明是WS失败触发的验证，必须走网络请求
            if (!isFirstLoad && rawRecordsRef.current.length > 0 && refreshKey === 0) {
                const sortedRecords = [...rawRecordsRef.current].sort((a, b) => {
                    const dateA = new Date(a.completedAt || a.timestamp || 0);
                    const dateB = new Date(b.completedAt || b.timestamp || 0);
                    return sortOrder === 'desc'
                        ? dateB - dateA  // 从新到旧
                        : dateA - dateB; // 从旧到新
                });
                setRecords(sortedRecords);
                return;
            }

            lastFetchedRef.current = fetchKey;
            setLoading(true);

            // 1. 从后端获取记录
            let completed = [];
            try {
                // 使用统一的测评获取接口 type=0 表示身体素质
                const res = await api.get(`/api/assessments/${targetId}?type=0`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.data) {
                    const data = res.data;
                    // 映射后端字段到前端格式
                    completed = (data || []).map(c => ({
                        has_ai_report: c.has_ai_report,
                        id: c.assessment_id, // 后端返回的是 assessment_id
                        title: c.title,
                        status:
                            (c.has_ai_report === 1 || c.has_ai_report === true || c.ai_report_id || c.aiReportId)
                                ? 'completed'
                                : (c.status === '已完成' ? 'completed' : 'draft'),
                        date: new Date(c.timestamp).toLocaleDateString(),
                        completedAt: c.timestamp,
                        timestamp: c.timestamp, // 保留原始时间戳字段
                        currentStep: c.status === '已完成' ? 3 : 0
                    }));

                    // 后端已显示完成时，兜底清理本地“正在生成”标记，避免列表长期卡住
                    completed.forEach((item) => {
                        const backendCompleted =
                            item?.status === 'completed' ||
                            item?.has_ai_report === 1 ||
                            item?.has_ai_report === true;
                        if (backendCompleted && isAIReportGenerating(item?.id)) {
                            clearAIReportGenerating(item.id, 'backend-completed');
                        }
                    });
                }
            } catch (error) {
                console.error("Fetch physical assessments error:", error);
            } finally {
                setLoading(false);
            }

            // 保存原始数据
            rawRecordsRef.current = completed || [];

            const allRecords = [...rawRecordsRef.current]
                .sort((a, b) => {
                    const dateA = new Date(a.completedAt || a.timestamp || 0);
                    const dateB = new Date(b.completedAt || b.timestamp || 0);
                    return sortOrder === 'desc'
                        ? dateB - dateA  // 从新到旧
                        : dateA - dateB; // 从旧到新
                });

            setRecords(allRecords);
        };

        fetchRecords();
    }, [user?.token, student?.id, sortOrder, refreshKey]);

    useEffect(() => {
        const unsubscribe = onAIReportWsEvent((event) => {
            if (!event?.assessmentId) return;

            if (event.terminal) {
                if (event.status === 'success') {
                    // 成功：立即变更为已完成
                    applyReportCompletion(event.assessmentId, 'ws-success');
                } else if (event.status === 'failure' || event.status === 'timeout' || event.status === 'error') {
                    // 失败/超时：先清除本地生成标记
                    clearAIReportGenerating(event.assessmentId, event.status);
                    // 关键：不要直接设为draft，而是触发一次后端刷新来验证真实状态
                    // 防止因为WS连接断开导致的误报
                    setRefreshKey(prev => prev + 1);
                }
            }
        });
        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!records || records.length === 0) return;
        const pending = records.filter((record) => {
            if (!record?.id) return false;
            const backendCompleted =
                record?.status === 'completed' ||
                record?.has_ai_report === 1 ||
                record?.has_ai_report === true;
            return !backendCompleted && hasAIReportReadyHint(record.id);
        });
        if (pending.length === 0) return;
        pending.forEach((record) => applyReportCompletion(record.id, 'ready-hint'));
    }, [records]);

    const handleRecordClick = (record) => {
        const backendCompleted =
            record?.status === 'completed' ||
            record?.has_ai_report === 1 ||
            record?.has_ai_report === true;

        if (backendCompleted && record?.id) {
            clearAIReportGenerating(record.id, 'backend-completed');
        }

        if (isAIReportGenerating(record?.id) && !backendCompleted) {
            addToast({
                kind: 'info',
                title: t('reportGenerating'),
                description: t('reportGenerated'),
                durationMs: 6000
            });
            return;
        }

        if (record?.id && hasAIReportReadyHint(record.id) && navigate) {
            navigate(`/physical-report/${record.id}`, { state: { title: record.title } });
            return;
        }

        if (record.status === 'draft') {
            const stepMap = ['data', 'diagnosis', 'plan', 'goal'];
            const savedStep = loadAssessmentStep({ userId: user?.id || 'guest', assessmentId: record.id });
            const targetStep = savedStep ?? (record.currentStep ?? 0);
            if (navigate) {
                navigate(`/add-record/physical/${stepMap[targetStep]}`,
                    {
                        state: {
                            student,
                            assessmentData: {
                                id: record.id,
                                assessment_id: record.id,
                                title: record.title,
                                mode: 'single',
                                type: 'physical'
                            }
                        }
                    });
            }
        } else if (navigate) {
            // 跳转到已完成报告的详情页
            navigate(`/physical-report/${record.id}`, { state: { title: record.title } });
        }
    };

    const handleAddRecord = () => {
        confirmCreateNewRecord();
    };

    const confirmCreateNewRecord = async () => {
        if (creating) return;

        const studentId = student?.id || id;
        if (!studentId) {
            alert("未找到学员信息");
            return;
        }

        setCreating(true);
        try {
            // 使用默认标题，不再使用日期
            const defaultTitle = t('physicalAssessment');
            const assessmentId = await createAssessment(studentId, 'physical', user, defaultTitle, backendLang);

            if (assessmentId) {
                // 清除旧草稿（保持本地存储清洁）
                const userId = user?.id || 'guest';
                localStorage.removeItem(`draft_${userId}_${studentId}_physical`);

                if (navigate) {
                    navigate('/add-record/physical/data', {
                        state: {
                            student,
                            assessmentData: {
                                assessment_id: assessmentId,
                                id: assessmentId,
                                title: defaultTitle,
                                mode: 'single',
                                type: 'physical',
                                date: new Date().toISOString().split('T')[0]
                            }
                        }
                    });
                }
            } else {
                alert("创建测评失败，请重试");
            }
        } catch (error) {
            console.error("Create assessment error:", error);
            alert("创建测评发生错误");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-h-screen text-white p-4 sm:p-6 pb-56 relative overflow-hidden bg-transparent">
            <ConfirmDialog
                show={showDeleteConfirm}
                title={t('deleteConfirmTitle')}
                message={t('deleteConfirmMessage')}
                confirmText={t('confirmDelete')}
                cancelText={t('cancel')}
                confirmVariant="danger"
                onCancel={() => {
                    if (deleting) return;
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                }}
                onConfirm={async () => {
                    if (!deleteTarget) {
                        setShowDeleteConfirm(false);
                        return;
                    }
                    await performDeleteRecord(deleteTarget);
                    setShowDeleteConfirm(false);
                    setDeleteTarget(null);
                }}
            />
            {/* Header */}
            <div className="relative z-10 mb-8 sm:mb-10 flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="btn-back shrink-0"
                >
                    <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                </button>
                <h1 className="title-workbench flex-1 min-w-0">{t('physicalHistory')}</h1>
                <button
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl surface-weak border border-white/10 hover:bg-[#d4af37]/20 hover:border-[#d4af37]/40 transition-all group"
                    title={sortOrder === 'desc' ? t('sortDescending') : t('sortAscending')}
                >
                    <ArrowUpDown size={18} className={`text-[#d4af37] transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                    <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors hidden sm:inline">
                        {sortOrder === 'desc' ? t('sortDescending') : t('sortAscending')}
                    </span>
                </button>
            </div>

            {/* Records List - 可滚动区域 */}
            <div className="space-y-4 relative z-10 max-w-md mx-auto ">
                {records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/40">
                        <p className="text-sm sm:text-base">{t('noRecord')}</p>
                    </div>
                ) : (
                    records.map((record) => (
                        (() => {
                            const backendCompleted =
                                record?.status === 'completed' ||
                                record?.has_ai_report === 1 ||
                                record?.has_ai_report === true;
                            const generating = isAIReportGenerating(record?.id) && !backendCompleted;
                            return (
                                <div
                                    key={record.id}
                                    onClick={() => handleRecordClick(record)}
                                    className={`relative group overflow-hidden rounded-2xl sm:rounded-[32px] p-4 sm:p-6 text-left transition-all duration-500 border border-[#d4af37]/30 surface-strong hover:border-[#d4af37]/60 shadow-2xl shadow-black/50 cursor-pointer ${record.status === 'draft'
                                        ? ''
                                        : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="px-2 sm:px-3 py-1 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20">
                                            <span className="text-[11px] sm:text-xs font-bold text-[#d4af37] tracking-wider">
                                                {new Date(record.lastModified || record.completedAt).toLocaleDateString('zh-CN')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {generating ? (
                                                <>
                                                    <Clock className="w-4 h-4 text-yellow-400" />
                                                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-yellow-400">
                                                        {t('generatingReport')}
                                                    </span>
                                                </>
                                            ) : record.status === 'draft' ? (
                                                <>
                                                    <Clock className="w-4 h-4 text-yellow-400" />
                                                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-yellow-400">
                                                        {t('statusPending')}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-green-400">
                                                        {t('statusCompleted')}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-end gap-3">
                                        <h3 className="flex-1 min-w-0 text-base sm:text-lg font-bold text-white/90 leading-tight uppercase tracking-tight">
                                            {record.title || t('physicalAssessment')}
                                        </h3>
                                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                            <button
                                                type="button"
                                                disabled={generating || deleting}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    requestDeleteRecord(record);
                                                }}
                                                className="flex shrink-0 items-center gap-2 px-3 sm:px-4 py-2 rounded-full surface-weak border border-red-500/30 hover:bg-red-500/10 transition-all disabled:opacity-50"
                                            >
                                                <span className="text-xs sm:text-sm font-bold text-red-400 whitespace-nowrap">
                                                    {t('delete')}
                                                </span>
                                            </button>
                                            <button className="flex shrink-0 items-center gap-2 px-3 sm:px-4 py-2 rounded-full surface-weak border border-white/10 hover:bg-[#d4af37]/20 hover:border-[#d4af37]/40 transition-all group">
                                                <span className="text-xs sm:text-sm font-bold text-white/60 group-hover:text-white transition-colors whitespace-nowrap">
                                                    {record.status === 'draft' ? t('continue') : t('view')}
                                                </span>
                                                <ChevronRight className="w-4 h-4 text-[#d4af37] opacity-40 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    ))
                )}
            </div>

            {/* Bottom Action - 固定在底部菜单栏上方 */}
            <div className="fixed bottom-24 left-0 right-0 px-4 sm:px-6 z-20">
                <div className="max-w-md mx-auto">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddRecord}
                        className="w-full h-[54px] rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-base sm:text-lg shadow-[0_20px_40px_rgba(212,175,55,0.3)] flex items-center justify-center gap-3 group"
                    >
                        {t('addRecord')}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default PhysicalReportPage;
