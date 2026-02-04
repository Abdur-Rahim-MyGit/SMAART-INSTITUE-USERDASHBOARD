import { useRef, useState, useEffect } from "react";
import { Search, Bell, User, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AvatarProfileCard from "@/components/AvatarProfileCard";
import InteractiveMenu from "@/components/InteractiveMenu";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getBackendUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return apiUrl.replace("/api", "");
};

const DashboardTopBar = ({ user }) => {
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (!user?.email) return;

      try {
        const response = await fetch(`${API_BASE_URL}/users/register-details/${user.email}`);
        if (response.ok) {
          const data = await response.json();
          if (data.otherDetails?.profilePhoto) {
            setProfilePhoto(`${getBackendUrl()}/${data.otherDetails.profilePhoto}`);
          }
        }
      } catch (error) {
        console.error("Error fetching profile photo:", error);
      }
    };

    fetchProfilePhoto();
  }, [user?.email]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setShowProfileCard(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowProfileCard(false);
    }, 300);
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* LEFT: Brand / Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-[#30919D] flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[17px] font-black tracking-tighter text-[#002147] leading-none">SMAART</span>
              <span className="text-[14px] font-bold tracking-tight text-[#30919D] -mt-0.5">Minds</span>
            </div>
          </Link>
        </div>

        {/* CENTER: Interactive Menu */}
        <div className="hidden lg:block flex-1 max-w-5xl mx-auto px-4">
          <InteractiveMenu />
        </div>

        {/* RIGHT: Actions & Profile */}
        <div className="flex items-center gap-6 shrink-0">

          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-[#002147] transition-colors rounded-full hover:bg-gray-50">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#30919D] rounded-full border-2 border-white"></span>
          </button>

          {/* User Profile */}
          <div
            className="relative flex items-center gap-4 pl-4 border-l border-gray-100"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black">ID: {user?.id || '50889'}</span>
              <span className="text-[13px] font-black text-[#002147] leading-none">{user?.fullName || "Fareedha"}</span>
            </div>

            <div className="w-11 h-11 rounded-xl shrink-0 overflow-hidden border-2 border-[#f1f5f9] bg-[#002147] flex items-center justify-center shadow-sm cursor-pointer group hover:border-[#30919D] transition-all">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full text-white flex items-center justify-center font-black text-lg uppercase">
                  {user?.fullName?.charAt(0) || "F"}
                </div>
              )}
            </div>

            <AnimatePresence>
              {showProfileCard && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-80 z-50 origin-top-right"
                >
                  <AvatarProfileCard user={user} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* More Menu (Mobile/Tablet) */}
          <button className="lg:hidden p-2 text-gray-400">
            <MoreHorizontal className="w-5 h-5" />
          </button>

        </div>
      </div>
    </div>
  );
};

export default DashboardTopBar;
