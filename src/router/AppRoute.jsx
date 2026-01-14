import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// 导入页面组件
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import StudentsPage from '../pages/management/StudentsPage';
import HomePage from '../pages/home/HomePage';
import HomePageOld from '../pages/legacy/HomePageOld';
import BasicInfoPage from '../pages/management/BasicInfoPage';
import StykuScanPage from '../pages/hardware/StykuScanPage';
import TrackManPage from '../pages/hardware/TrackManPage';
import DiagnosisPage from '../pages/legacy/DiagnosisPage';
import PlanPage from '../pages/legacy/PlanPage';
import GoalsPage from '../pages/legacy/GoalsPage';
import ReportPage from '../pages/reports/ReportPage';
import ProfilePage from '../pages/management/ProfilePage';
import SettingsPage from '../pages/management/SettingsPage';
import ThreeDPage from '../pages/reports/ThreeDPage';
import SkillsReportPage from '../pages/reports/SkillsReportPage';
import PhysicalReportPage from '../pages/reports/PhysicalReportPage';
import MentalReportPage from '../pages/reports/MentalReportPage';
import AddRecordPage from '../pages/assessment/AddRecordPage';
import SkillsReportDetailPage from '../pages/reports/SkillsReportDetailPage';
import PhysicalReportDetailPage from '../pages/reports/PhysicalReportDetailPage';
import MentalReportDetailPage from '../pages/reports/MentalReportDetailPage';
import AssessmentTypeSelectionPage from '../pages/assessment/AssessmentTypeSelectionPage';
import SingleAssessmentSelectionPage from '../pages/assessment/SingleAssessmentSelectionPage';
import NewAssessmentPage from '../pages/assessment/NewAssessmentPage';
import AIReportPage from '../pages/reports/AIReportPage';
import VoiceChatDemo from '../pages/demo/VoiceChatDemo';

// 权限包装组件 - 移到外部避免重新渲染导致失去焦点
const PrivateRoute = ({ element, isLoggedIn, allProps, extraProps = {} }) => {
    return isLoggedIn ? React.cloneElement(element, { ...allProps, ...extraProps }) : <Navigate to="/login" replace />;
};

// 公开路由包装组件 - 移到外部避免重新渲染导致失去焦点
const PublicRoute = ({ element, allProps }) => {
    return React.cloneElement(element, allProps);
};

/**
 * AppRoutes 组件
 * 接收 App.jsx 传递的所有 props 并分发给各个页面
 */
const AppRoutes = (props) => {
    const { isLoggedIn, location } = props;

    return (
        <Routes location={location} key={location?.pathname}>
            {/* 基础路由 */}
            <Route path="/login" element={<PublicRoute element={<LoginPage />} allProps={props} />} />
            <Route path="/register" element={<PublicRoute element={<RegisterPage />} allProps={props} />} />

            {/* 需要登录的路由 */}
            <Route path="/students" element={<PrivateRoute element={<StudentsPage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/student/:id" element={<PrivateRoute element={<HomePage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ onAddRecord: props.handleStartNewAssessment, onStartCompleteAssessment: props.handleStartCompleteAssessment }} />} />

            {/* 学生专属报告路由 */}
            <Route path="/student/:id/skills-report" element={<PrivateRoute element={<SkillsReportPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ onAddRecord: props.handleStartSkillsAssessment }} />} />
            <Route path="/student/:id/physical-report" element={<PrivateRoute element={<PhysicalReportPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ onAddRecord: props.handleStartPhysicalAssessment }} />} />
            <Route path="/student/:id/mental-report" element={<PrivateRoute element={<MentalReportPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ onAddRecord: props.handleStartMentalAssessment }} />} />

            <Route path="/home" element={<PrivateRoute element={<HomePage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/home-old" element={<PrivateRoute element={<HomePageOld />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/basic-info" element={<PrivateRoute element={<BasicInfoPage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/styku-scan" element={<PrivateRoute element={<StykuScanPage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/trackman" element={<PrivateRoute element={<TrackManPage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/diagnosis" element={<PrivateRoute element={<DiagnosisPage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/plan" element={<PrivateRoute element={<PlanPage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/goals" element={<PrivateRoute element={<GoalsPage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/report" element={<PrivateRoute element={<ReportPage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/profile" element={<PrivateRoute element={<ProfilePage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/settings" element={<PrivateRoute element={<SettingsPage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/three-d" element={<PrivateRoute element={<ThreeDPage />} isLoggedIn={isLoggedIn} allProps={props} />} />

            <Route path="/skills-report" element={<PrivateRoute element={<SkillsReportPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ onAddRecord: props.handleStartSkillsAssessment }} />} />
            <Route path="/skills-report/:id" element={<PrivateRoute element={<SkillsReportDetailPage />} isLoggedIn={isLoggedIn} allProps={props} />} />

            <Route path="/physical-report" element={<PrivateRoute element={<PhysicalReportPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ onAddRecord: props.handleStartPhysicalAssessment }} />} />
            <Route path="/physical-report/:id" element={<PrivateRoute element={<PhysicalReportDetailPage />} isLoggedIn={isLoggedIn} allProps={props} />} />

            <Route path="/mental-report" element={<PrivateRoute element={<MentalReportPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ onAddRecord: props.handleStartMentalAssessment }} />} />
            <Route path="/mental-report/:id" element={<PrivateRoute element={<MentalReportDetailPage />} isLoggedIn={isLoggedIn} allProps={props} />} />

            <Route path="/assessment-type" element={<PrivateRoute element={<AssessmentTypeSelectionPage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/single-assessment" element={<PrivateRoute element={<SingleAssessmentSelectionPage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/new-assessment" element={<PrivateRoute element={<NewAssessmentPage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/ai-report" element={<PrivateRoute element={<AIReportPage />} isLoggedIn={isLoggedIn} allProps={props} />} />
            <Route path="/demo/voice-chat" element={<PublicRoute element={<VoiceChatDemo />} allProps={props} />} />

            {/* 历史记录重定向 */}
            <Route path="/mentalHistory" element={<Navigate to="/mental-report" replace />} />
            <Route path="/physicalHistory" element={<Navigate to="/physical-report" replace />} />
            <Route path="/skillsHistory" element={<Navigate to="/skills-report" replace />} />

            {/* 新增测评记录模块 (12个子路由) */}
            <Route path="/addRecord" element={<Navigate to="/add-record" replace />} />
            <Route path="/add-record" element={<Navigate to="/add-record/physical/data" replace />} />

            {/* 身体素质测评 */}
            <Route path="/add-record/physical/data" element={<PrivateRoute element={<AddRecordPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ initialPrimary: 0, initialSecondary: 0 }} />} />
            <Route path="/add-record/physical/diagnosis" element={<PrivateRoute element={<AddRecordPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ initialPrimary: 0, initialSecondary: 1 }} />} />
            <Route path="/add-record/physical/plan" element={<PrivateRoute element={<AddRecordPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ initialPrimary: 0, initialSecondary: 2 }} />} />
            <Route path="/add-record/physical/goal" element={<PrivateRoute element={<AddRecordPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ initialPrimary: 0, initialSecondary: 3 }} />} />

            {/* 心理测评 */}
            <Route path="/add-record/mental/data" element={<PrivateRoute element={<AddRecordPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ initialPrimary: 1, initialSecondary: 0 }} />} />
            <Route path="/add-record/mental/diagnosis" element={<PrivateRoute element={<AddRecordPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ initialPrimary: 1, initialSecondary: 1 }} />} />
            <Route path="/add-record/mental/plan" element={<PrivateRoute element={<AddRecordPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ initialPrimary: 1, initialSecondary: 2 }} />} />
            <Route path="/add-record/mental/goal" element={<PrivateRoute element={<AddRecordPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ initialPrimary: 1, initialSecondary: 3 }} />} />

            {/* 技能测评 */}
            <Route path="/add-record/technique/data" element={<PrivateRoute element={<AddRecordPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ initialPrimary: 2, initialSecondary: 0 }} />} />
            <Route path="/add-record/technique/diagnosis" element={<PrivateRoute element={<AddRecordPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ initialPrimary: 2, initialSecondary: 1 }} />} />
            <Route path="/add-record/technique/plan" element={<PrivateRoute element={<AddRecordPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ initialPrimary: 2, initialSecondary: 2 }} />} />
            <Route path="/add-record/technique/goal" element={<PrivateRoute element={<AddRecordPage />} isLoggedIn={isLoggedIn} allProps={props} extraProps={{ initialPrimary: 2, initialSecondary: 3 }} />} />

            {/* 兼容旧路由 */}
            <Route path="/add-record/skills/data" element={<Navigate to="/add-record/technique/data" replace />} />
            <Route path="/add-record/skills/diagnosis" element={<Navigate to="/add-record/technique/diagnosis" replace />} />
            <Route path="/add-record/skills/plan" element={<Navigate to="/add-record/technique/plan" replace />} />
            <Route path="/add-record/skills/goal" element={<Navigate to="/add-record/technique/goal" replace />} />

            {/* 默认路由 */}
            <Route path="/" element={<Navigate to="/students" replace />} />
        </Routes>
    );
};

export default AppRoutes;
