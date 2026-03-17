import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import GraduationPathway from "@/components/GraduationPathway";
import CoursePathway from "@/components/CoursePathway";
import FloatingDictionary from "@/components/FloatingDictionary";
import { useNavigate } from "react-router-dom";

const MyCourses = () => {
  const navigate = useNavigate();

  const handleCourseClick = (courseIdOrObject) => {
    const id = typeof courseIdOrObject === 'object' ? courseIdOrObject.id : courseIdOrObject;
    navigate(`/dashboard/courses/${id}/modules`);
  };

  return (
    <div className="h-screen flex flex-col bg-[#e8ecef] dark:bg-[#001229] transition-colors duration-300 overflow-hidden">
      <DashboardSidebar />

      <div className="flex-1 overflow-y-auto transition-all duration-300">
        <DashboardHeader />

        <main className="w-full relative px-0 md:px-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            {/* Course Pathway */}
            <CoursePathway onCourseClick={handleCourseClick} />
          </motion.div>
        </main>
      </div>
      <FloatingDictionary />
    </div>
  );
};

export default MyCourses;
