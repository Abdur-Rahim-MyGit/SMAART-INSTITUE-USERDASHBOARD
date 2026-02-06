import { motion } from "framer-motion";
import { Bell, Settings, Search, ChevronRight, Command } from "lucide-react";
import ProfileDropdown from "@/components/ProfileDropdown";
import { Link, useLocation, useNavigate } from "react-router-dom";

const DashboardHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Map routes to page titles
  const getPageTitle = () => {
    const path = location.pathname;
    const titleMap = {
      '/dashboard': 'Home',
      '/dashboard/home': 'Home',
      '/dashboard/courses': 'My Courses',
      '/dashboard/assessments': 'Assessments',
      '/dashboard/assessments/baseline': 'Base Line Test',
      '/dashboard/community': 'Community',
      '/dashboard/profile': 'Profile',
      '/dashboard/settings': 'Settings',
      '/dashboard/vision-boards': 'Vision Boards',
      '/dashboard/mindcare-sessions': 'MindCare Sessions',
      '/dashboard/library': 'Library',
      '/dashboard/dictionary': 'General Dictionary',
      '/dashboard/smaart-toolkit': 'SMAART Toolkit',
      '/dashboard/escalation': 'Escalation',
      '/dashboard/skills-passport': 'Skills Passport',
      '/dashboard/quotients-grid': 'Quotients Grid',
    };
    return titleMap[path] || 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-[#0B1120]/80 border-b border-slate-200 dark:border-white/5 transition-all duration-300">
      <div className="flex items-center justify-between px-4 lg:px-8 h-20">

        {/* Left: Page Title */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
            <Link to="/dashboard" className="hover:text-[#30919D] transition-colors">Dashboard</Link>
            <ChevronRight size={14} />
            <span className="text-slate-900 dark:text-white font-bold">{getPageTitle()}</span>
          </div>
          <h1 className="md:hidden text-xl font-black text-[#002147] dark:text-white">{getPageTitle()}</h1>
        </div>

        {/* Center: Search (Hidden on Mobile) */}
        <div className="hidden lg:flex items-center max-w-md w-full mx-8">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#30919D] transition-colors" />
            <input
              type="text"
              placeholder="Search courses, skills, or mentors..."
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium focus:outline-none focus:border-[#30919D] focus:ring-4 focus:ring-[#30919D]/10 transition-all placeholder:text-slate-400"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <span className="p-1 rounded bg-slate-200 dark:bg-white/10 text-[10px] font-bold text-slate-500"><Command size={10} /></span>
              <span className="p-1 rounded bg-slate-200 dark:bg-white/10 text-[10px] font-bold text-slate-500">K</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-4">

          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-[#30919D] hover:bg-[#30919D]/10 transition-all">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-[#0B1120]" />
          </button>

          {/* Settings */}
          <Link to="/dashboard/settings">
            <button className="hidden md:flex w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 items-center justify-center text-slate-500 hover:text-[#30919D] hover:bg-[#30919D]/10 transition-all">
              <Settings size={20} />
            </button>
          </Link>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-200 dark:bg-white/10 mx-1" />

          {/* Profile */}
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
