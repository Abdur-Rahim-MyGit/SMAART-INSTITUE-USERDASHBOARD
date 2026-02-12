import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import GraduationPathway from "@/components/GraduationPathway";
import CoursePathway from "@/components/CoursePathway";
import { useNavigate } from "react-router-dom";

const MyCourses = () => {
  const navigate = useNavigate();

  const handleCourseClick = (courseIdOrObject) => {
    const id = typeof courseIdOrObject === 'object' ? courseIdOrObject.id : courseIdOrObject;
    navigate(`/dashboard/courses/${id}/modules`);
  };

  return (
    <div className="min-h-screen bg-[#e8ecef] dark:bg-[#001229] transition-colors duration-300">
      <DashboardSidebar />

      <div className="min-h-screen transition-all duration-300">
        <DashboardHeader />

        <main className="w-full relative py-8 px-0 md:px-0">
          <div className="max-w-7xl mx-auto pb-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              {/* Course Pathway */}
              <CoursePathway onCourseClick={handleCourseClick} />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyCourses;
