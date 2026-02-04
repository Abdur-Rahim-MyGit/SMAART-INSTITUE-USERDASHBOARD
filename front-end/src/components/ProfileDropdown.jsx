import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AvatarProfileCard from "./AvatarProfileCard";

import { API_BASE_URL, getBackendUrl } from "../services/api";

const ProfileDropdown = () => {
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [user, setUser] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const dropdownRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Get user data from sessionStorage
  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser({
        // Preserve the user ID - check all possible ID fields
        id: parsedUser.id || parsedUser._id || parsedUser.userId,
        _id: parsedUser._id || parsedUser.id || parsedUser.userId,
        userId: parsedUser.userId || parsedUser.id || parsedUser._id,
        fullName: parsedUser.fullName || "User",
        name: parsedUser.fullName || "User",
        email: parsedUser.email || "user@example.com",
        role: parsedUser.role || "student",
        userType: parsedUser.userType,
        gender: parsedUser.gender, // Remove default "male" to allow fallback logic in AvatarProfileCard
        avatar: null, // Will be fetched from Registration API
        college: parsedUser.college,
        studentId: parsedUser.studentId,
        hasRegistration: parsedUser.hasRegistration
      });
    }
  }, []);

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
          // Update user data from registration if available (name, gender)
          if (data.fullName || data.gender) {
            setUser(prev => {
              const updated = {
                ...prev,
                gender: data.gender || prev?.gender,
                fullName: data.fullName || prev?.fullName,
                name: data.fullName || prev?.name
              };
              sessionStorage.setItem("user", JSON.stringify(updated));
              return updated;
            });
          }
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
