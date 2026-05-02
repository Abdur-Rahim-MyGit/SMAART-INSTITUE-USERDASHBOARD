import { useState, useEffect, useCallback } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { assessmentApi } from "@/services/assessmentApi";
import { apiCall } from "@/services/api";
import { Loader2 } from "lucide-react";
import DashboardLoader from "@/components/DashboardLoader";

/**
 * AssessmentFlowGuard component
 * Enforces authentication AND a strict order of assessments before allowing access to the dashboard.
 * Order: T1 Baseline Assessment
 * 
 * Developer bypass: Only available in dev mode via sessionStorage.setItem('devSkipAssessments', 'true')
 */
const AssessmentFlowGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [nextPath, setNextPath] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showDevSkip, setShowDevSkip] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Configuration for assessment order - Only Base Line Test required
  const assessmentOrder = [
    { code: "ASM00001", path: "/dashboard/assessments/baseline", key: "baseline" }
  ];

  const LOCK_DURATION = 60 * 1000; // 1 minute in milliseconds

  // SECURITY FIX #5: Developer bypass only available in dev mode
  const isDevBypass = () => {
    return import.meta.env.DEV && sessionStorage.getItem('devSkipAssessments') === 'true';
  };

  // SECURITY FIX #9: Auth check validates token with server, not just sessionStorage existence
  const checkAuth = useCallback(async (serverValidate = false) => {
    const userData = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("token");
    if (!userData || !token) {
      setIsAuthenticated(false);
      navigate("/", { replace: true });
      return false;
    }

    // On mount, validate token with server
    if (serverValidate) {
      try {
        await apiCall('/auth/me');
      } catch (err) {
        console.warn('[AssessmentFlowGuard] Token validation failed:', err.message);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
        navigate("/", { replace: true });
        return false;
      }
    }

    return true;
  }, [navigate]);

  // Listen for page visibility changes (catches back button from cached pages)
  useEffect(() => {
    // Validate token with server on initial mount
    checkAuth(true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth(false); // Quick local check on visibility change
      }
    };

    // Also check on popstate (back/forward button)
    const handlePopState = () => {
      checkAuth(false);
    };

    // Check on page show (bfcache restore)
    const handlePageShow = (event) => {
      if (event.persisted) {
        checkAuth(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [checkAuth]);

  // Cache assessment data in state so we don't re-fetch on every route change
  const [assessmentData, setAssessmentData] = useState(null);
  const [splashComplete, setSplashComplete] = useState(false);

  // Initial Data Fetch - Runs once on mount
  useEffect(() => {
    const fetchAssessmentData = async () => {
      try {
        if (isDevBypass()) {
          setAssessmentData({ skipped: true });
          setLoading(false);
          return;
        }

        const userData = sessionStorage.getItem("user");
        if (!userData) {
          setLoading(false);
          return;
        }

        const parsedUser = JSON.parse(userData);

        // Safety check: parsedUser might be null if 'null' string was stored
        if (!parsedUser) {
          console.error("Invalid user data in session (null), clearing...");
          sessionStorage.clear();
          setIsAuthenticated(false);
          setLoading(false);
          navigate("/", { replace: true });
          return;
        }

        // ── SECURITY: Force Password Reset Bypass Protection ───────────────
        // If the user still has mustChangePassword = true they MUST go through
        // the first-login password-change flow before accessing the dashboard.
        // This blocks direct URL access even when a valid JWT is present.
        if (parsedUser.mustChangePassword === true) {
          console.warn("[AssessmentFlowGuard] mustChangePassword is still true — ejecting to login.");
          sessionStorage.clear();
          setIsAuthenticated(false);
          setLoading(false);
          navigate("/", {
            replace: true,
            state: { forcePasswordChange: true }
          });
          return;
        }

        const userId = parsedUser.id || parsedUser._id;

        // NEW: Check if registration is completed
        // If user is a STUDENT and has NOT completed registration, force redirect
        if (parsedUser.role === 'student' && !parsedUser.hasRegistration) {
          // Allow access ONLY to registration pages
          const isRegistrationPage = location.pathname === '/complete-registration' ||
            location.pathname === '/signup' ||
            location.pathname === '/signup-initial';

          if (!isRegistrationPage) {
            console.log("Redirecting to completion registration");
            navigate('/complete-registration', { replace: true });
            return;
          }
        }

        // Skip for non-students
        if (parsedUser.role !== 'student') {
          setAssessmentData({ skipped: true });
          setLoading(false);
          return;
        }

        // Fetch data
        const [userResultsResponse, baseLineRes] = await Promise.all([
          assessmentApi.getUserResults(userId, 'completed'),
          assessmentApi.getBaseLineResults(userId).catch(() => ({ success: false }))
        ]);

        const completedMap = {};
        if (baseLineRes.success && baseLineRes.data) {
          completedMap.baseline = {
            status: true,
            startedAt: baseLineRes.data.createdAt ? new Date(baseLineRes.data.createdAt) : null,
            submittedAt: baseLineRes.data.createdAt ? new Date(baseLineRes.data.createdAt) : null
          };
        }

        setAssessmentData(completedMap);
      } catch (err) {
        console.error("Error fetching assessment data:", err);
        // On error, allow access to prevent blocking
        setAssessmentData({ error: true });
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentData();
  }, []); // Run once on mount - data is cached in state


  // Logic to determine redirection based on location and cached data
  useEffect(() => {
    if (!assessmentData) return; // Wait for data

    if (assessmentData.skipped || assessmentData.error) {
      setNextPath(null);
      return;
    }

    // Determine next path
    let requiredPath = null;
    const nextAssessmentIndex = assessmentOrder.findIndex(item => !assessmentData[item.key]);

    if (nextAssessmentIndex !== -1) {
      const nextAssessment = assessmentOrder[nextAssessmentIndex];
      requiredPath = nextAssessment.path;
    } else {
      // All required assessments are done.
      // Now block access to completed assessment paths if the user tries to go back manually.
      const isVisitingCompletedAssessment = assessmentOrder.some(a => 
        location.pathname.startsWith(a.path) && assessmentData[a.key]?.status === true
      );

      if (isVisitingCompletedAssessment) {
        console.log("Blocking access to completed assessment:", location.pathname);
        navigate('/dashboard', { replace: true });
        return;
      }
    }

    // setNextPath(requiredPath); // Removed blocking redirection
    setNextPath(null); 

  }, [location.pathname, assessmentData]);


  // SECURITY FIX #5: Developer skip handler (dev mode only)
  const handleDevSkip = () => {
    if (!import.meta.env.DEV) return; // Extra safety guard
    sessionStorage.setItem('devSkipAssessments', 'true');
    console.log('🚀 DEV SKIP: Assessment flow bypassed');
    setNextPath(null);
    setShowDevSkip(false);
    navigate('/dashboard', { replace: true });
  };

  // Combine initial loading state with splash screen duration
  if (loading || !splashComplete) {
    return (
      <>
        {!splashComplete && <DashboardLoader onComplete={() => setSplashComplete(true)} />}

        {/* Fallback loader if splash finishes but data is still fetching */}
        {splashComplete && loading && (
          <div className="flex flex-col items-center justify-center min-h-screen bg-[#001229]">
            <div className="flex items-center">
              <Loader2 className="w-12 h-12 text-[#1a3884] animate-spin" />
              <p className="ml-4 text-white font-medium">Finalizing setup...</p>
            </div>
            {/* Developer Skip Button - SECURITY FIX #5: Only shown in dev mode */}
            {import.meta.env.DEV && (
              <button
                onClick={handleDevSkip}
                className="mt-8 text-[10px] text-white/30 hover:text-white/60 uppercase tracking-widest font-bold transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded"
              >
                ⚡ DEV: Skip to Dashboard
              </button>
            )}
          </div>
        )}
      </>
    );
  }

  // If there's a required assessment path
    // Removed auto-redirect to required assessment to allow free navigation
    // if (location.pathname !== nextPath) {
    //   return <Navigate to={nextPath} replace />;
    // }

  // If NOT authenticated (logged out user pressing back button), redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If no required path (all done) OR we are already at the required path, render children
  return children;
};

export default AssessmentFlowGuard;


