import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const menuItems = [
  { id: 'home', label: 'Home', path: '/dashboard' },
  { id: 'courses', label: 'My Courses', path: '/dashboard/courses' },
  { id: 'vision', label: 'Vision Boards', path: '/dashboard/vision-boards' },
  { id: 'toolkit', label: 'SMAART Toolkit', path: '/dashboard/smaart-toolkit' },
  { id: 'certificate', label: 'Certificate', path: '/dashboard/certificate' },];

const InteractiveMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeItem = menuItems.find(item =>
    item.path === location.pathname ||
    (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
  ) || menuItems[0];

  const handleItemClick = (item) => {
    navigate(item.path);
  };

  return (
    <nav className="flex items-center">
      <div className="flex items-center gap-1 lg:gap-2">
        {menuItems.map((item) => {
          const isActive = item.id === activeItem.id;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 500 }}
              className={`
                group relative px-2 lg:px-3 py-6 text-xs xl:text-sm uppercase tracking-[0.05em] transition-all duration-300
                ${isActive
                  ? 'text-[#002147] dark:text-white font-bold'
                  : 'text-[#64748b] dark:text-slate-400 hover:text-[#002147] dark:hover:text-white'
                }
              `}
            >
              <span className="relative z-10">{item.label}</span>
              {/* Hover Indicator */}
              <motion.div
                className="absolute bottom-4 left-2 right-2 h-0.5 bg-[#30919D]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                initial={false}
              />

              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#30919D] rounded-full shadow-[0_0_10px_rgba(48,145,157,0.5)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default InteractiveMenu;
