import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const menuItems = [
  { label: "Home", path: "/dashboard" },
  { label: "My Courses", path: "/dashboard/courses" },
  { label: "Vision Boards", path: "/dashboard/vision-boards" },
  { label: "Toolkit", path: "/dashboard/smaart-toolkit" },
  { label: "Certificates", path: "/dashboard/certificate" },
  { label: "Verify", path: "/verify-certificate" },
];

const InteractiveMenu = () => {
  const location = useLocation();

  return (
    <nav className="flex items-center gap-8">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path || (item.label === "Home" && location.pathname === "/dashboard");
        return (
          <Link
            key={item.label}
            to={item.path}
            className={`text-sm font-semibold transition-all relative py-2 ${
              isActive ? "text-[#002147] dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {item.label}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1a3884] rounded-full"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default InteractiveMenu;

