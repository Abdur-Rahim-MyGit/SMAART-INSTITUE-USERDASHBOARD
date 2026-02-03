import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, User, HelpCircle, Award } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import VisionBoardWidget from "@/components/VisionBoardWidget";
import { Link, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [registration, setRegistration] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from sessionStorage
    const userData = sessionStorage.getItem("user");
    const registrationData = sessionStorage.getItem("registration");

    if (!userData) {
      // Redirect to login if no user data
      navigate("/");
      return;
    }

    setUser(JSON.parse(userData));
    if (registrationData) {
      setRegistration(JSON.parse(registrationData));
    }
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-800/70">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardSidebar />
      
      <div className="min-h-screen transition-all duration-300">
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6 md:space-y-8"
          >
            <div className="pt-12 sm:pt-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gray-800 mb-1 sm:mb-2">
                Welcome Back, {user.fullName}!
              </h1>
              <p className="text-gray-800/80 text-sm sm:text-base md:text-lg">
                Continue your learning journey with Mindz
              </p>
            </div>

            {/* Active Vision Board Widget */}
            <VisionBoardWidget />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {[
                { title: "My Assessments", value: "12", color: "from-accent/20 to-accent/5" },
                { title: "Courses in Progress", value: "5", color: "from-secondary/20 to-secondary/5" },
                { title: "Skills Acquired", value: "28", color: "from-accent/20 to-accent/5" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass-effect rounded-xl p-4 sm:p-5 md:p-6 bg-gradient-to-br ${stat.color} hover-lift cursor-pointer`}
                >
                  <h3 className="text-gray-800/70 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    {stat.title}
                  </h3>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-accent">
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-effect rounded-xl p-4 sm:p-6 md:p-8"
            >
              <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4">
                Your Learning Path
              </h2>
              <p className="text-gray-800/80 text-sm sm:text-base">
                Select a section from the sidebar to continue your journey
              </p>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
