import { motion } from "framer-motion";
import { HelpCircle, Bell } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import AssessmentBanner from "@/components/AssessmentBanner";
import ProfileDropdown from "@/components/ProfileDropdown";
import ComingSoon from "@/components/ComingSoon";
import { Link } from "react-router-dom";

const GeneralDictionary = () => {
  return (
    <div className="min-h-screen">
      <DashboardSidebar />
      
      <div className="min-h-screen transition-all duration-300">
        <header className="sticky top-0 z-30 glass-effect border-b border-sidebar-border">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <Link to="/">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-accent text-2xl font-display font-bold lg:hidden"
              >
                Mindz
              </motion.div>
            </Link>
            
            <div className="flex items-center gap-4 ml-auto">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-2 rounded-full glass-effect hover:bg-accent/10 transition-colors"
                title="Support"
              >
                <HelpCircle className="w-6 h-6 text-accent" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-2 rounded-full glass-effect hover:bg-accent/10 transition-colors"
              >
                <Bell className="w-6 h-6 text-accent" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </motion.button>
              
              <ProfileDropdown />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-12">
          <AssessmentBanner title="GENERAL DICTIONARY" />
          <ComingSoon title="General Dictionary" subtitle="Knowledge Hub" />
        </main>
      </div>
    </div>
  );
};

export default GeneralDictionary;
