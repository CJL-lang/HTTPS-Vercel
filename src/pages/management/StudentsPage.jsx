/**
 * 学员列表页面
 * 功能：显示所有学员列表，选择学员进入评估，添加新学员
 * 路由：/students
 * 大白话：显示所有学员的列表，可以选择某个学员进入评估工作台，或添加新学员
 */
import React from 'react';
import { ChevronRight, User, Users } from 'lucide-react'; // 图标库
import PageWrapper from '../../components/PageWrapper'; // 页面容器组件
import Card from '../../components/Card'; // 卡片组件
import SectionTitle from '../../components/SectionTitle'; // 标题组件
import { useLanguage } from '../../utils/LanguageContext'; // 多语言支持

const StudentsPage = ({ students, onSelectStudent, onAddStudent }) => {
    const { t } = useLanguage(); // 翻译函数
    // 格式化学员ID，只显示最后6位数字
    const fmtId = (id) => {
        if (!id) return '';
        const s = String(id);
        return s.length > 6 ? s.slice(-6) : s; // 如果ID超过6位，截取最后6位
    };

    return (
        <PageWrapper title={t('studentManagement')} onAdd={onAddStudent}>
            <SectionTitle>{t('studentList')}</SectionTitle>
            <div className="space-y-6">
                {students.length > 0 ? (
                    students.map((student, index) => (
                        <Card
                            key={index}
                            onClick={() => onSelectStudent(index)}
                            className="flex items-center justify-between gap-4 group"
                        >
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[32px] surface border border-white/10 flex items-center justify-center group-hover:border-[#d4af37]/30 transition-all duration-300">
                                    <User size={20} className="sm:w-[28px] sm:h-[28px] text-[#d4af37]" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 sm:gap-3 mb-1 min-w-0">
                                        <h3 className="font-bold text-white text-base sm:text-xl tracking-tighter truncate">
                                            {student.name}
                                        </h3>
                                        <span className="shrink-0 text-[11px] sm:text-[12px] bg-[#d4af37]/10 text-[#d4af37] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#d4af37]/20 font-bold tracking-widest uppercase">
                                            ID: {fmtId(student.id)}
                                        </span>
                                    </div>
                                    <p className="text-[11px] sm:text-[12px] font-bold text-white uppercase tracking-widest truncate">
                                        {((g) => {
                                            if (!g) return '';
                                            const lower = g.toString().toLowerCase().trim();
                                            if (lower === 'male' || lower === '男') return t('male');
                                            if (lower === 'female' || lower === '女') return t('female');
                                            return g;
                                        })(student.gender)} · {student.age}{t('years')} · {student.history ? t('hasHistory') : t('newStudent')}
                                    </p>
                                </div>
                            </div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full surface flex items-center justify-center border border-white/5 text-white/60 group-hover:text-[#d4af37] group-hover:border-[#d4af37]/20 transition-all">
                                <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center surface-strong rounded-[32px] border border-white/5 shadow-2xl shadow-black/50">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[32px] surface border border-white/10 flex items-center justify-center mb-4 sm:mb-6 text-white/50">
                            <Users size={40} className="sm:w-12 sm:h-12" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-white font-bold uppercase tracking-tighter text-lg sm:text-xl mb-2">{t('noStudentFound')}</h3>
                        <p className="text-white/70 text-[11px] sm:text-[12px] uppercase tracking-[0.2em] font-bold">{t('addFirstStudent')}</p>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
};

export default StudentsPage;


