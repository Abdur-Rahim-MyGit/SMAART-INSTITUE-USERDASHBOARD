import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from 'react';

// Lazy load pages for better performance
const Landing = lazy(() => import('@/pages/Landing'));
const Institution = lazy(() => import('@/pages/Institution'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const ComprehensiveSignup = lazy(() => import('@/pages/ComprehensiveSignup'));

// Dashboard pages
const DashboardHome = lazy(() => import('@/pages/DashboardHome'));
const MyCourses = lazy(() => import('@/pages/MyCourses'));
const MyNotes = lazy(() => import('@/pages/MyNotes'));
const MyAssessments = lazy(() => import('@/pages/MyAssessments'));
const SkillsPassport = lazy(() => import('@/pages/SkillsPassport'));
const Profile = lazy(() => import('@/pages/Profile'));
const ModuleViewPage = lazy(() => import('@/pages/ModuleViewPage'));
const QuotientsGrid = lazy(() => import('@/pages/QuotientsGrid'));
const VisionBoardGalleryPro = lazy(() => import('@/features/visionBoard/pages/VisionBoardGalleryPro'));
const VisionBoardEditorPro = lazy(() => import('@/features/visionBoard/pages/VisionBoardEditorPro'));
const MindCareSessions = lazy(() => import('@/pages/MindCareSessions'));
const GeneralDictionary = lazy(() => import('@/pages/GeneralDictionary'));
const SMAArtToolkit = lazy(() => import('@/pages/SMAArtToolkit'));
const Community = lazy(() => import('@/pages/Community'));
const StudentGroups = lazy(() => import('@/pages/StudentGroups'));
const GroupChat = lazy(() => import('@/pages/GroupChat'));
const Library = lazy(() => import('@/pages/Library'));
const TestPage = lazy(() => import('@/pages/TestPage'));
const SignupInitial = lazy(() => import('@/pages/SignupInitial'));
const VerifyOTP = lazy(() => import('@/pages/VerifyOTP'));
const SignupSuccess = lazy(() => import('@/pages/SignupSuccess'));
const BaseLineTest = lazy(() => import('@/pages/BaseLineTest'));
const Analysis = lazy(() => import('@/pages/Analysis'));
const Motivational = lazy(() => import('@/pages/Motivational'));
const Settings = lazy(() => import('@/pages/Settings'));
const Help = lazy(() => import('@/pages/Help'));
const AdminTickets = lazy(() => import('@/pages/AdminTickets'));
const SupportTicketsPage = lazy(() => import('@/pages/SupportTicketsPage'));
const Certificate = lazy(() => import('@/pages/Certificate'));
const VerifyCertificate = lazy(() => import('@/pages/VerifyCertificate'));
const VerifyBadge = lazy(() => import('@/components/badges/VerifyBadge'));

// Auth guard component
import AssessmentFlowGuard from '@/components/AssessmentFlowGuard';

// Loading fallback
const PageLoader = () => (
    <div className="min-h-screen bg-[#001229] flex flex-col items-center justify-center">
        <div className="relative w-20 h-20 mb-4">
            <div className="absolute inset-0 border-4 border-[#30919D]/20 rounded-2xl rotate-45" />
            <div className="absolute inset-0 border-4 border-t-[#30919D] rounded-2xl rotate-45 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[#30919D] font-bold text-2xl -rotate-45">S</span>
            </div>
        </div>
        <div className="flex gap-1">
            <div className="w-2 h-2 bg-[#30919D] rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-[#30919D] rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-[#30919D] rounded-full animate-bounce" />
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
                    <Route path="/test" element={<TestPage />} />
                    <Route path="/institution/:id" element={<Institution />} />
                    <Route path="/verify-certificate" element={<VerifyCertificate />} />
                    <Route path="/verify-certificate/:certificateId" element={<VerifyCertificate />} />
                    <Route path="/verify-badge" element={<VerifyBadge />} />
                    <Route path="/verify-badge/:badgeId" element={<VerifyBadge />} />

                    {/* Signup Flow */}
                    <Route path="/signup-initial" element={<SignupInitial />} />
                    <Route path="/verify-otp" element={<VerifyOTP />} />
                    <Route path="/signup" element={<ComprehensiveSignup />} />
                    <Route path="/complete-registration" element={<ComprehensiveSignup />} />
                    <Route path="/signup-success" element={<SignupSuccess />} />

                    {/* Protected Dashboard Routes */}
                    <Route path="/dashboard" element={<AssessmentFlowGuard><DashboardHome /></AssessmentFlowGuard>} />
                    <Route path="/my-courses" element={<AssessmentFlowGuard><MyCourses /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/courses" element={<AssessmentFlowGuard><MyCourses /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/notes" element={<AssessmentFlowGuard><MyNotes /></AssessmentFlowGuard>} />
                    <Route path="/my-assessments" element={<AssessmentFlowGuard><MyAssessments /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/assessments" element={<AssessmentFlowGuard><MyAssessments /></AssessmentFlowGuard>} />
                    <Route path="/skills-passport" element={<AssessmentFlowGuard><SkillsPassport /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/skills-passport" element={<AssessmentFlowGuard><SkillsPassport /></AssessmentFlowGuard>} />
                    <Route path="/profile" element={<AssessmentFlowGuard><Profile /></AssessmentFlowGuard>} />
                    <Route path="/module/:courseId/:moduleId" element={<AssessmentFlowGuard><ModuleViewPage /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/courses/:courseId/modules" element={<AssessmentFlowGuard><ModuleViewPage /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/courses/:courseId/modules/:moduleId/days" element={<AssessmentFlowGuard><ModuleViewPage /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/courses/:courseId/modules/:moduleId/days/:dayId" element={<AssessmentFlowGuard><ModuleViewPage /></AssessmentFlowGuard>} />
                    <Route path="/quotients" element={<AssessmentFlowGuard><QuotientsGrid /></AssessmentFlowGuard>} />
                    <Route path="/vision-board" element={<AssessmentFlowGuard><VisionBoardGalleryPro /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/vision-boards" element={<AssessmentFlowGuard><VisionBoardGalleryPro /></AssessmentFlowGuard>} />
                    <Route path="/vision-board-pro/create" element={<AssessmentFlowGuard><VisionBoardEditorPro /></AssessmentFlowGuard>} />
                    <Route path="/vision-board-pro/gallery" element={<AssessmentFlowGuard><VisionBoardGalleryPro /></AssessmentFlowGuard>} />
                    <Route path="/mind-care" element={<AssessmentFlowGuard><MindCareSessions /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/mindcare-sessions" element={<AssessmentFlowGuard><MindCareSessions /></AssessmentFlowGuard>} />
                    <Route path="/dictionary" element={<AssessmentFlowGuard><GeneralDictionary /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/dictionary" element={<AssessmentFlowGuard><GeneralDictionary /></AssessmentFlowGuard>} />
                    <Route path="/smaart-toolkit" element={<AssessmentFlowGuard><SMAArtToolkit /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/smaart-toolkit" element={<AssessmentFlowGuard><SMAArtToolkit /></AssessmentFlowGuard>} />
                    <Route path="/community" element={<AssessmentFlowGuard><Community /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/community" element={<AssessmentFlowGuard><Community /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/groups" element={<AssessmentFlowGuard><StudentGroups /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/groups/:id" element={<AssessmentFlowGuard><GroupChat /></AssessmentFlowGuard>} />
                    <Route path="/library" element={<AssessmentFlowGuard><Library /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/library" element={<AssessmentFlowGuard><Library /></AssessmentFlowGuard>} />
                    <Route path="/settings" element={<AssessmentFlowGuard><Settings /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/settings" element={<AssessmentFlowGuard><Settings /></AssessmentFlowGuard>} />
                    <Route path="/help" element={<AssessmentFlowGuard><Help /></AssessmentFlowGuard>} />
                    <Route path="/tickets" element={<AssessmentFlowGuard><SupportTicketsPage /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/support" element={<AssessmentFlowGuard><SupportTicketsPage /></AssessmentFlowGuard>} />
                    <Route path="/admin/tickets" element={<AssessmentFlowGuard><AdminTickets /></AssessmentFlowGuard>} />
                    <Route path="/certificate" element={<AssessmentFlowGuard><Certificate /></AssessmentFlowGuard>} />
                    <Route path="/dashboard/certificate" element={<AssessmentFlowGuard><Certificate /></AssessmentFlowGuard>} />

                    {/* Assessment Routes */}
                    <Route path="/dashboard/assessments/baseline" element={<AssessmentFlowGuard><BaseLineTest /></AssessmentFlowGuard>} />
                    <Route path="/analysis" element={<AssessmentFlowGuard><Analysis /></AssessmentFlowGuard>} />
                    <Route path="/motivational" element={<AssessmentFlowGuard><Motivational /></AssessmentFlowGuard>} />

                    {/* Fallback */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </AnimatePresence>
    );
};

export default AnimatedRoutes;
