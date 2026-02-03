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
      '/dashboard/eq-test': 'EQ Test',
      '/dashboard/cq-test': 'CQ Test',
      '/dashboard/arq-test': 'ARQ Test',
      '/dashboard/vak-test': 'VAK Test',
      '/dashboard/big5-test': 'Big Five Test',
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
    <>
    </>
  );
};

export default DashboardHeader;
