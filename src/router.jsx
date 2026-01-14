import React from 'react';
import { Navigate } from 'react-router-dom';

// 导入页面组件
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentsPage from './pages/management/StudentsPage';
import HomePage from './pages/home/HomePage';
import HomePageOld from './pages/legacy/HomePageOld';
import BasicInfoPage from './pages/management/BasicInfoPage';
import StykuScanPage from './pages/hardware/StykuScanPage';
import TrackManPage from './pages/hardware/TrackManPage';
import DiagnosisPage from './pages/legacy/DiagnosisPage';
import PlanPage from './pages/legacy/PlanPage';
import GoalsPage from './pages/legacy/GoalsPage';
import ReportPage from './pages/reports/ReportPage';
import ProfilePage from './pages/management/ProfilePage';
import SettingsPage from './pages/management/SettingsPage';
import ThreeDPage from './pages/reports/ThreeDPage';
import SkillsReportPage from './pages/reports/SkillsReportPage';
import PhysicalReportPage from './pages/reports/PhysicalReportPage';
import MentalReportPage from './pages/reports/MentalReportPage';
import AddRecordPage from './pages/assessment/AddRecordPage';
import SkillsReportDetailPage from './pages/reports/SkillsReportDetailPage';
import PhysicalReportDetailPage from './pages/reports/PhysicalReportDetailPage';
import MentalReportDetailPage from './pages/reports/MentalReportDetailPage';
import AssessmentTypeSelectionPage from './pages/assessment/AssessmentTypeSelectionPage';
import SingleAssessmentSelectionPage from './pages/assessment/SingleAssessmentSelectionPage';
import NewAssessmentPage from './pages/assessment/NewAssessmentPage';
import AIReportPage from './pages/reports/AIReportPage';
import VoiceChatDemo from './pages/demo/VoiceChatDemo';

export const routes = [
    // 公开路由（不需要登录）
    { path: '/login', element: <LoginPage />, auth: false },
    { path: '/register', element: <RegisterPage />, auth: false },

    // 需要登录的路由
    { path: '/students', element: <StudentsPage />, auth: true },
    { path: '/student/:id', element: <HomePage />, auth: true },

    // 学生专属报告路由
    { path: '/student/:id/skills-report', element: <SkillsReportPage />, auth: true },
    { path: '/student/:id/physical-report', element: <PhysicalReportPage />, auth: true },
    { path: '/student/:id/mental-report', element: <MentalReportPage />, auth: true },

    { path: '/home', element: <HomePage />, auth: true },
    { path: '/home-old', element: <HomePageOld />, auth: true },
    { path: '/basic-info', element: <BasicInfoPage />, auth: true },
    { path: '/styku-scan', element: <StykuScanPage />, auth: true },
    { path: '/trackman', element: <TrackManPage />, auth: true },
    { path: '/diagnosis', element: <DiagnosisPage />, auth: true },
    { path: '/plan', element: <PlanPage />, auth: true },
    { path: '/goals', element: <GoalsPage />, auth: true },
    { path: '/report', element: <ReportPage />, auth: true },
    { path: '/profile', element: <ProfilePage />, auth: true },
    { path: '/settings', element: <SettingsPage />, auth: true },
    { path: '/three-d', element: <ThreeDPage />, auth: true },

    { path: '/skills-report', element: <SkillsReportPage />, auth: true },
    { path: '/skills-report/:id', element: <SkillsReportDetailPage />, auth: true },

    { path: '/physical-report', element: <PhysicalReportPage />, auth: true },
    { path: '/physical-report/:id', element: <PhysicalReportDetailPage />, auth: true },

    { path: '/mental-report', element: <MentalReportPage />, auth: true },
    { path: '/mental-report/:id', element: <MentalReportDetailPage />, auth: true },

    { path: '/assessment-type', element: <AssessmentTypeSelectionPage />, auth: true },
    { path: '/single-assessment', element: <SingleAssessmentSelectionPage />, auth: true },
    { path: '/new-assessment', element: <NewAssessmentPage />, auth: true },
    { path: '/ai-report', element: <AIReportPage />, auth: true },
    { path: '/demo/voice-chat', element: <VoiceChatDemo />, auth: false },

    // 历史记录重定向
    { path: '/mentalHistory', element: <Navigate to="/mental-report" replace />, auth: false },
    { path: '/physicalHistory', element: <Navigate to="/physical-report" replace />, auth: false },
    { path: '/skillsHistory', element: <Navigate to="/skills-report" replace />, auth: false },

    // 新增测评记录模块
    { path: '/addRecord', element: <Navigate to="/add-record" replace />, auth: false },
    { path: '/add-record', element: <Navigate to="/add-record/physical/data" replace />, auth: false },

    // 身体素质测评
    { path: '/add-record/physical/data', element: <AddRecordPage />, auth: true },
    { path: '/add-record/physical/diagnosis', element: <AddRecordPage />, auth: true },
    { path: '/add-record/physical/plan', element: <AddRecordPage />, auth: true },
    { path: '/add-record/physical/goal', element: <AddRecordPage />, auth: true },

    // 心理测评
    { path: '/add-record/mental/data', element: <AddRecordPage />, auth: true },
    { path: '/add-record/mental/diagnosis', element: <AddRecordPage />, auth: true },
    { path: '/add-record/mental/plan', element: <AddRecordPage />, auth: true },
    { path: '/add-record/mental/goal', element: <AddRecordPage />, auth: true },

    // 技能测评
    { path: '/add-record/technique/data', element: <AddRecordPage />, auth: true },
    { path: '/add-record/technique/diagnosis', element: <AddRecordPage />, auth: true },
    { path: '/add-record/technique/plan', element: <AddRecordPage />, auth: true },
    { path: '/add-record/technique/goal', element: <AddRecordPage />, auth: true },

    // 兼容旧路由
    { path: '/add-record/skills/data', element: <Navigate to="/add-record/technique/data" replace />, auth: false },
    { path: '/add-record/skills/diagnosis', element: <Navigate to="/add-record/technique/diagnosis" replace />, auth: false },
    { path: '/add-record/skills/plan', element: <Navigate to="/add-record/technique/plan" replace />, auth: false },
    { path: '/add-record/skills/goal', element: <Navigate to="/add-record/technique/goal" replace />, auth: false },

    // 默认路由
    { path: '/', element: <Navigate to="/students" replace />, auth: false },
];

