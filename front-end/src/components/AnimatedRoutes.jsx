import { Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from 'react';

// Layout Components
import DashboardLayout from '@/components/DashboardLayout';

// Lazy load pages for better performance
const Landing = lazy(() => import('@/pages/LandingPage'));
const Institution = lazy(() => import('@/pages/Institution'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const ComprehensiveSignup = lazy(() => import('@/pages/ComprehensiveSignup'));

// Dashboard pages
const DashboardHome = lazy(() => import('@/pages/DashboardHome'));
const MyCourses = lazy(() => import('@/pages/MyCourses'));
const MyNotes = lazy(() => import('@/pages/MyNotes'));
const TodoTracker = lazy(() => import('@/pages/TodoTracker'));
const MyAssessments = lazy(() => import('@/pages/MyAssessments'));
const SkillsPassport = lazy(() => import('@/pages/SkillsPassport'));
const Profile = lazy(() => import('@/pages/Profile'));
const AddDetails = lazy(() => import('@/pages/AddDetails'));
const ModuleViewPage = lazy(() => import('@/pages/ModuleViewPage'));
const CoursePlayer = lazy(() => import('@/pages/CoursePlayer'));
const MicroAssessmentList = lazy(() => import('@/pages/MicroAssessmentList'));
const MicroAssessmentPlayer = lazy(() => import('@/pages/MicroAssessmentPlayer'));
const QuotientsGrid = lazy(() => import('@/pages/QuotientsGrid'));
const VisionBoardGalleryPro = lazy(() => import('@/features/visionBoard/pages/VisionBoardGalleryPro'));
const VisionBoardEditorPro = lazy(() => import('@/features/visionBoard/pages/VisionBoardEditorPro'));
const VisionBoardView = lazy(() => import('@/features/visionBoard/pages/VisionBoardView'));
const MindCareSessions = lazy(() => import('@/pages/MindCareSessions'));
const GeneralDictionary = lazy(() => import('@/pages/GeneralDictionary'));
const SMAArtToolkit = lazy(() => import('@/pages/SMAArtToolkit'));
const Community = lazy(() => import('@/pages/Community'));
const StudentGroups = lazy(() => import('@/pages/StudentGroups'));
const GroupChat = lazy(() => import('@/pages/GroupChat'));
const Library = lazy(() => import('@/pages/Library'));
const SignupInitial = lazy(() => import('@/pages/SignupInitial'));
const VerifyOTP = lazy(() => import('@/pages/VerifyOTP'));
const SignupSuccess = lazy(() => import('@/pages/SignupSuccess'));
const BaseLineTest = lazy(() => import('@/pages/BaseLineTest'));
const AssessmentsDashboard = lazy(() => import('@/pages/AssessmentsDashboard'));
const Analysis = lazy(() => import('@/pages/Analysis'));
const Motivational = lazy(() => import('@/pages/Motivational'));
const Settings = lazy(() => import('@/pages/Settings'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Help = lazy(() => import('@/pages/Help'));
const LockedOut = lazy(() => import('@/pages/LockedOut'));
const SupportTicketsPage = lazy(() => import('@/pages/SupportTicketsPage'));
const Certificate = lazy(() => import('@/pages/Certificate'));
const VerifyCertificate = lazy(() => import('@/pages/VerifyCertificate'));
const VerifyPassport = lazy(() => import('@/pages/VerifyPassport'));
const VerifyResume = lazy(() => import('@/pages/VerifyResume'));
const VerifyBadge = lazy(() => import('@/components/badges/VerifyBadge'));
const Badges = lazy(() => import('@/pages/Badges'));
const Performance = lazy(() => import('@/pages/Performance'));
const SkillsVault = lazy(() => import('@/pages/SkillsVault'));
const CareerDataFetcher = lazy(() => import('@/pages/CareerDataFetcher'));
const Legal = lazy(() => import('@/pages/Legal'));
const AdminCourses = lazy(() => import('@/pages/AdminCourses'));
const AdminCourseForm = lazy(() => import('@/pages/AdminCourseForm'));


// Career Agent (Integrated from Career-Agent standalone system)
const CareerAgentEntry = lazy(() => import('@/pages/CareerAgent/CareerAgentEntry'));
const CareerAgentOnboarding = lazy(() => import('@/pages/CareerAgent/CareerAgentOnboarding'));
const CareerAgentDashboard = lazy(() => import('@/pages/CareerAgent/CareerAgentDashboard'));


// AI Career Coach pages
const ProfileAnalysis = lazy(() => import('@/pages/AICareerCoach/ProfileAnalysis'));
const ResumeBuilder = lazy(() => import('@/pages/AICareerCoach/ResumeBuilder'));

// Auth guard component
import AssessmentFlowGuard from '@/components/AssessmentFlowGuard';

// Dashboard Layout Wrapper with Auth Guard
const ProtectedDashboardLayout = () => (
    <AssessmentFlowGuard>
        <DashboardLayout />
    </AssessmentFlowGuard>
);

// Loading fallback
const PageLoader = () => (
    <div className="min-h-screen bg-[#00152E] flex flex-col items-center justify-center">
        <div className="relative w-20 h-20 mb-4">
            <div className="absolute inset-0 border-4 border-[#1a3884]/20 rounded-2xl rotate-45" />
            <div className="absolute inset-0 border-4 border-t-[#1a3884] rounded-2xl rotate-45 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[#1a3884] font-bold text-2xl -rotate-45">S</span>
            </div>
        </div>
        <div className="flex gap-1">
            <div className="w-2 h-2 bg-[#1a3884] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-[#1a3884] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-[#1a3884] rounded-full animate-bounce" />
        </div>
    </div>
);

const AnimatedRoutes = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Suspense fallback={<PageLoader />}>
                <Routes location={location} key={location.pathname}>
                    {/* Public Routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/institution/:id" element={<Institution />} />
                    <Route path="/login" element={<Institution />} />
                    <Route path="/verify-certificate" element={<VerifyCertificate />} />
                    <Route path="/verify-certificate/:certificateId" element={<VerifyCertificate />} />
                    <Route path="/verify-passport" element={<VerifyPassport />} />
                    <Route path="/verify-passport/:passportId" element={<VerifyPassport />} />
                    <Route path="/verify-resume" element={<VerifyResume />} />
                    <Route path="/verify-resume/:resumeId" element={<VerifyResume />} />
                    <Route path="/verify-badge" element={<VerifyBadge />} />
                    <Route path="/verify-badge/:badgeId" element={<VerifyBadge />} />
                    <Route path="/legal" element={<Legal />} />

                    {/* Signup Flow */}
                    <Route path="/signup-initial" element={<SignupInitial />} />
                    <Route path="/verify-otp" element={<VerifyOTP />} />
                    <Route path="/signup" element={<ComprehensiveSignup />} />
                    <Route path="/complete-registration" element={<ComprehensiveSignup />} />
                    <Route path="/signup-success" element={<SignupSuccess />} />

                    {/* Protected Dashboard Routes - Using DashboardLayout */}
                    <Route element={<ProtectedDashboardLayout />}>
                        {/* Home */}
                        <Route path="/dashboard" element={<DashboardHome />} />

                        {/* Courses */}
                        <Route path="/my-courses" element={<MyCourses />} />
                        <Route path="/dashboard/courses" element={<MyCourses />} />
                        <Route path="/dashboard/courses/:courseId/player" element={<CoursePlayer />} />
                        <Route path="/module/:courseId/:moduleId" element={<ModuleViewPage />} />
                        <Route path="/dashboard/courses/:courseId/modules" element={<ModuleViewPage />} />
                        <Route path="/dashboard/courses/:courseId/modules/:moduleId/days/:dayId" element={<ModuleViewPage />} />

                        {/* Notes */}
                        <Route path="/dashboard/notes" element={<MyNotes />} />
                        <Route path="/dashboard/todos" element={<TodoTracker />} />

                        {/* Assessments */}
                        <Route path="/my-assessments" element={<Navigate to="/dashboard/assessment-centre" replace />} />
                        <Route path="/dashboard/assessments" element={<Navigate to="/dashboard/assessment-centre" replace />} />
                        <Route path="/dashboard/assessment-centre" element={<AssessmentsDashboard />} />
                        <Route path="/dashboard/assessments/baseline" element={<BaseLineTest />} />
                        <Route path="/dashboard/micro-assessments" element={<MicroAssessmentList />} />
                        <Route path="/dashboard/micro-assessments/:id" element={<MicroAssessmentPlayer />} />

                        {/* Skills */}
                        <Route path="/skills-passport" element={<SkillsPassport />} />
                        <Route path="/dashboard/skills-passport" element={<SkillsPassport />} />
                        <Route path="/dashboard/skills-vault" element={<SkillsVault />} />

                        {/* Vision Board */}
                        <Route path="/vision-board" element={<VisionBoardGalleryPro />} />
                        <Route path="/dashboard/vision-boards" element={<VisionBoardGalleryPro />} />
                        <Route path="/vision-board-pro/create" element={<VisionBoardEditorPro />} />
                        <Route path="/vision-board-pro/gallery" element={<VisionBoardGalleryPro />} />
                        <Route path="/vision-board/view/:id" element={<VisionBoardView />} />

                        {/* Toolkit */}
                        <Route path="/smaart-toolkit" element={<SMAArtToolkit />} />
                        <Route path="/dashboard/smaart-toolkit" element={<SMAArtToolkit />} />

                        {/* Skills Vault */}
                        <Route path="/skills-vault" element={<SkillsVault />} />
                        <Route path="/dashboard/skills-vault" element={<SkillsVault />} />

                        {/* Community */}
                        <Route path="/community" element={<Community />} />
                        <Route path="/dashboard/community" element={<Community />} />
                        <Route path="/dashboard/groups" element={<StudentGroups />} />
                        <Route path="/dashboard/groups/:id" element={<GroupChat />} />

                        {/* Library & Dictionary */}
                        <Route path="/library" element={<Library />} />
                        <Route path="/dashboard/library" element={<Library />} />
                        <Route path="/dictionary" element={<GeneralDictionary />} />
                        <Route path="/dashboard/dictionary" element={<GeneralDictionary />} />
                        <Route path="/mind-care" element={<MindCareSessions />} />
                        <Route path="/dashboard/mindcare-sessions" element={<MindCareSessions />} />

                        {/* Settings & Support */}
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/dashboard/settings" element={<Settings />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/dashboard/notifications" element={<Notifications />} />
                        <Route path="/help" element={<Help />} />
                        <Route path="/tickets" element={<SupportTicketsPage />} />
                        <Route path="/dashboard/support" element={<SupportTicketsPage />} />

                        {/* Admin — Course management */}
                        <Route path="/dashboard/admin/courses" element={<AdminCourses />} />
                        <Route path="/dashboard/admin/courses/create" element={<AdminCourseForm />} />
                        <Route path="/dashboard/admin/courses/edit/:id" element={<AdminCourseForm />} />

                        {/* Profile */}
                        <Route path="/onboarding" element={<AddDetails />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/dashboard/onboarding" element={<AddDetails />} />
                        <Route path="/dashboard/profile" element={<Profile />} />

                        {/* Other Features */}
                        <Route path="/quotients" element={<QuotientsGrid />} />
                        <Route path="/dashboard/quotients-grid" element={<QuotientsGrid />} />
                        <Route path="/certificate" element={<Certificate />} />
                        <Route path="/dashboard/certificate" element={<Certificate />} />
                        <Route path="/badges" element={<Badges />} />
                        <Route path="/dashboard/badges" element={<Badges />} />
                        <Route path="/dashboard/performance" element={<Performance />} />

                        {/* AI Career Coach Routes */}
                        <Route path="/dashboard/profile-analysis" element={<ProfileAnalysis />} />
                        <Route path="/dashboard/resume-builder" element={<ResumeBuilder />} />

                        {/* Career Data Fetcher */}
                        <Route path="/dashboard/career-data-fetcher" element={<CareerDataFetcher />} />

                        {/* Career Agent — Integrated from Career-Agent system */}
                        <Route path="/dashboard/career-agent" element={<CareerAgentEntry />} />
                        <Route path="/dashboard/career-agent/onboarding" element={<CareerAgentOnboarding />} />
                        <Route path="/dashboard/career-agent/dashboard" element={<CareerAgentDashboard />} />
                    </Route>
                    <Route path="/assessment/:stage" element={<BaseLineTest />} />
                    <Route path="/assessment/:stage/report" element={<AssessmentFlowGuard><BaseLineTest /></AssessmentFlowGuard>} />
                    <Route path="/analysis" element={<AssessmentFlowGuard><Analysis /></AssessmentFlowGuard>} />
                    <Route path="/motivational" element={<AssessmentFlowGuard><Motivational /></AssessmentFlowGuard>} />
                    <Route path="/locked-out" element={<LockedOut />} />

                    {/* Fallback */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </AnimatePresence>
    );
};

export default AnimatedRoutes;
