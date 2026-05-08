import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Megaphone, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import NoticesFeed from "@/components/community/NoticesFeed";

const Community = () => {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState(null);

  // Initialize current user from session storage
  useEffect(() => {
    try {
      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        const parsedUser = JSON.parse(userStr);
        setCurrentUser(parsedUser);
      }
    } catch (err) {
      console.warn("Community - No user data found in sessionStorage");
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 selection:bg-[#002147]/20">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* ── Header Section ────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-14 h-14 bg-gradient-to-br from-[#002147] to-[#003580] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20"
            >
              <Megaphone className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-black text-[#002147] tracking-tight"
              >
                Community Announcements
              </motion.h1>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mt-1"
              >
                <p className="text-gray-500 font-medium text-sm">
                  Official notices and updates from your institution
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Main Noticeboard ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/40 backdrop-blur-3xl rounded-[2rem] p-2 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-white/60 relative overflow-hidden"
        >
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="relative z-10">
            <NoticesFeed currentUser={currentUser} />
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Community;
