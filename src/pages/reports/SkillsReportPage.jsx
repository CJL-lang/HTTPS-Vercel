/**
 * 技能报告页面
 * 功能：显示技能测评历史记录，查看过往的TrackMan数据记录
 * 路由：/skills-report
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Brain } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../utils/LanguageContext';
import { createAssessment } from '../assessment/utils/assessmentApi';

const SkillsReportPage = ({ onBack, onAddRecord, navigate, user, student }) => {
    const { id } = useParams();
    const { t, language } = useLanguage();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    // 用于防止重复加载的 Ref
    const lastFetchedRef = useRef(null);

    const backendLang = language === 'en' ? 'en' : 'cn';

    // 加载草稿和已完成的记录 - 优先从后端获取已完成记录，草稿保留在本地
    useEffect(() => {
        const fetchRecords = async () => {
            // 优先使用 URL 中的 id，如果没有则使用 student.id
            const targetId = id || student?.id;

            if (!targetId || !user?.token) return;
            
            // 如果已经加载过这个目标的记录，不再重复加载
            const fetchKey = `${targetId}_${user.token}`;
            if (lastFetchedRef.current === fetchKey) return;
            lastFetchedRef.current = fetchKey;

            setLoading(true);
            
            // 1. 从后端获取记录
            let completed = [];
            try {
                // 使用统一的测评获取接口 type=2 表示技能测评
                const res = await fetch(`/api/assessments/${targetId}?type=2`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    // 映射后端字段到前端格式
                    completed = (data || []).map(c => ({
                        id: c.assessment_id, // 后端返回的是 assessment_id
                        title: c.title,
                        status: c.status === '已完成' ? 'completed' : 'draft', // 后端返回中文状态
                        date: new Date(c.timestamp).toLocaleDateString(),
                        completedAt: c.timestamp,
                        currentStep: 3
                    }));
                }
            } catch (error) {
                console.error("Fetch skills assessments error:", error);
            } finally {
                setLoading(false);
            }
            
            const allRecords = (completed || [])
                .sort((a, b) => new Date(b.sortTime || b.lastModified || b.completedAt) - new Date(a.sortTime || a.lastModified || a.completedAt));
            
            setRecords(allRecords);
        };

        fetchRecords();
    }, [user?.token, student?.id]);
    
    const handleRecordClick = (record) => {
        if (record.status === 'draft') {
            const stepMap = ['data', 'diagnosis', 'plan', 'goal'];
            if (navigate) {
                navigate(`/add-record/technique/${stepMap[record.currentStep || 0]}`, { 
                    state: { 
                        student,
                        assessmentData: {
                            id: record.id,
                            assessment_id: record.id,
                            title: record.title,
                            mode: 'single',
                            type: 'skills'
                        }
                    } 
                });
            }
        } else if (navigate) {
            // 跳转到已完成报告的详情页
            navigate(`/skills-report/${record.id}`);
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
            const defaultTitle = t('skillsAssessment');
            const assessmentId = await createAssessment(studentId, 'skills', user, defaultTitle, backendLang);
            
            if (assessmentId) {
                // 清除旧草稿（保持本地存储清洁）
                const userId = user?.id || 'guest';
                localStorage.removeItem(`draft_${userId}_${studentId}_skills`);
                localStorage.removeItem(`draft_${userId}_${studentId}_technique`);
                
                if (navigate) {
                    navigate('/add-record/technique/data', { 
                        state: { 
                            student,
                            assessmentData: {
                                assessment_id: assessmentId,
                                id: assessmentId,
                                title: defaultTitle,
                                mode: 'single',
                                type: 'skills',
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
        <div className="min-h-screen text-white p-4 sm:p-6 pb-32 relative overflow-hidden bg-transparent">
            {/* Header */}
            <div className="relative z-10 mb-8 sm:mb-10 flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="btn-back shrink-0"
                >
                    <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
                </button>
                <h1 className="title-workbench flex-1 min-w-0">{t('skillsHistory')}</h1>
            </div>

            {/* Records List - 可滚动区域 */}
            <div className="space-y-4 relative z-10 max-w-md mx-auto records-scroll-container">
                {records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/40">
                        <p className="text-sm sm:text-base">{t('noRecord')}</p>
                    </div>
                ) : (
                    records.map((record) => (
                        <div
                            key={record.id}
                            onClick={() => handleRecordClick(record)}
                            className={`relative group overflow-hidden rounded-2xl sm:rounded-[32px] p-4 sm:p-6 text-left transition-all duration-500 border border-[#d4af37]/30 surface-strong hover:border-[#d4af37]/60 shadow-2xl shadow-black/50 cursor-pointer ${
                                record.status === 'draft' 
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
                                    {record.status === 'draft' ? (
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

                            <div className="flex items-end justify-between">
                                <h3 className="text-base sm:text-lg font-bold text-white/90 max-w-[60%] leading-tight uppercase tracking-tight">
                                    {record.title || t('skillsAssessment')}
                                </h3>
                                <div className="flex items-center gap-3">
                                    {record.has_ai_report === 1 && (
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/20 border border-purple-500/30">
                                            <Brain className="w-3 h-3 text-purple-400" />
                                            <span className="text-[11px] font-bold text-purple-400 uppercase">AI</span>
                                        </div>
                                    )}
                                    <button className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full surface-weak border border-white/10 hover:bg-[#d4af37]/20 hover:border-[#d4af37]/40 transition-all group">
                                        <span className="text-xs sm:text-sm font-bold text-white/60 group-hover:text-white transition-colors">
                                            {record.status === 'draft' ? t('continue') : t('view')}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-[#d4af37] opacity-40 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                        </div>
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

export default SkillsReportPage;
