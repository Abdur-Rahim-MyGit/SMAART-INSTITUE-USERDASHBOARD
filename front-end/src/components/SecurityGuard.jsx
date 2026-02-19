import { useEffect, useState, useRef } from "react";
import { ShieldAlert } from "lucide-react";
import { useLocation } from "react-router-dom";

/**
 * SecurityGuard component protects the application from:
 * 1. Context Menu (Right Click)
 * 2. Common Screenshot keyboard shortcuts
 * 3. Screen snipping tools (by hiding content on blur/mouseleave)
 * 
 * Uses direct DOM manipulation for zero-latency protection.
 * RESTRICTED: Only active for logged-in users.
 */
const SecurityGuard = () => {
  const [isBlurred, setIsBlurred] = useState(false);
  const overlayRef = useRef(null);
  const location = useLocation();

  // Check authentication status
  const checkAuth = () => {
    return !!sessionStorage.getItem("user");
  };

  useEffect(() => {
    const isAuthenticated = checkAuth();

    // Check if security should be active based on route
    // Only active for:
    // 1. Specific Assessment pages (sub-routes of /dashboard/assessments/)
    // 2. Specific Course Day Content (not the roadmap or module list)
    const isProtectedPath = 
      location.pathname.startsWith("/dashboard/assessments/") || 
      (location.pathname.startsWith("/dashboard/courses/") && location.pathname.includes("/days/"));

    // If NOT authenticated OR NOT on a protected path, ensure everything is clean and return
    if (!isAuthenticated || !isProtectedPath) {
      if (overlayRef.current) {
        overlayRef.current.style.display = "none";
      }
      setIsBlurred(false);
      // Ensure body selection is allowed for public users
      document.body.style.userSelect = "auto";
      document.body.style.webkitUserSelect = "auto";
      return; 
    }

    // IF authenticated, enforce protection
    // Re-apply select none
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    // Helper to show overlay instantly
    const showOverlay = () => {
      if (overlayRef.current) {
        overlayRef.current.style.display = "flex";
      }
      setIsBlurred(true);
      // Dispatch custom event to notify other components (like video player) to pause
      window.dispatchEvent(new CustomEvent("security-blur"));
    };

    // 1. Disable Right Click
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // 2. Disable Keyboard Shortcuts
    const handleKeyDown = (e) => {
      // Prevent PrintScreen (some browsers default this)
      if (e.key === "PrintScreen") {
        showOverlay();
      }

      // Check for Ctrl/Cmd + Shift + combinations (common for snipping)
      // or Ctrl + P (Print)
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "p" || e.key === "P" || e.key === "s" || e.key === "S")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Block Ctrl+Shift+I / J / C (DevTools)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "i" ||
          e.key === "I" ||
          e.key === "j" ||
          e.key === "J" ||
          e.key === "c" ||
          e.key === "C")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 3. Hide content on blur (Anti-Snipping Tool)
    const handleBlur = () => {
      showOverlay();
    };

    const handleFocus = () => {
      // STRICT MODE: Do NOT auto-unblur on focus.
    };

    // 4. Strict Mode: Hide content when mouse leaves the window
    const handleMouseLeave = () => {
      showOverlay();
    };

    const handleMouseEnter = () => {
      // STRICT MODE: Do NOT auto-unblur on enter.
    };

    // 5. Visibility Change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        showOverlay();
      }
    };
    
    // 6. Mobile Protection: Page Hide (App Switching)
    const handlePageHide = () => {
        showOverlay();
    };
    
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      
      // Cleanup DOM styles
      if (overlayRef.current) overlayRef.current.style.display = "none";
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    };
  }, [location.pathname]); // Re-run on route change to check session again

  // Unlock function
  const unlock = () => {
    if (overlayRef.current) {
      overlayRef.current.style.display = "none";
    }
    setIsBlurred(false);
  };

  return (
    <div
      ref={overlayRef}
      onClick={unlock}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 33, 71, 1)", // Opaque Navy
        zIndex: 2147483647, // Max integer value
        display: "none", // Hidden by default, toggled via ref for speed
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        textAlign: "center",
        cursor: "pointer",
      }}
    >
      <ShieldAlert className="w-16 h-16 mb-4 text-[#daa520]" />
      <h2 className="text-2xl font-bold mb-2 text-[#daa520]">Security Protected</h2>
      <p className="text-gray-300 mb-2">
        Content is hidden because the application lost focus or the mouse left the window.
      </p>
      <p className="text-[#daa520] font-semibold animate-pulse">
        Click anywhere to return
      </p>
    </div>
  );
};

export default SecurityGuard;
