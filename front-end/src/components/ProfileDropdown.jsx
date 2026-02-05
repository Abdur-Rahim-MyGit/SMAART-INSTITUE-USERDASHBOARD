import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AvatarProfileCard from "./AvatarProfileCard";
import useUser from "@/hooks/useUser";

import { API_BASE_URL, getBackendUrl } from "../services/api";

const ProfileDropdown = () => {
  const [showProfileCard, setShowProfileCard] = useState(false);
  const { user, refreshUser } = useUser();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const dropdownRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Fetch profile photo from Registration API
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
          // Note: UserContext handles overall user data syncing
        }
      } catch (error) {
        console.error("Error fetching profile photo:", error);
      }
    };

    fetchProfilePhoto();
  }, [user?.email]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileCard(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Show default user if no session data
  const displayUser = user || {
    fullName: "User",
    name: "User",
    email: "user@example.com",
    role: "student",
    avatar: null
  };

  // Use profilePhoto if available
  const avatarUrl = profilePhoto || displayUser.avatar;

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer"
      >
        {/* Name Only */}
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-[#002147] dark:text-white">{displayUser.name}</p>
        </div>

        {/* Profile Avatar */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#002147] overflow-hidden">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayUser.name}
              className="w-10 h-10 rounded-xl object-cover"
            />
          ) : (
            <span className="text-base font-bold text-white">
              {getInitials(displayUser.name)}
            </span>
          )}
        </div>
      </div>

      {/* Dropdown Profile Card */}
      <AnimatePresence>
        {showProfileCard && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 z-50"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <AvatarProfileCard user={displayUser} className="w-72 shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
