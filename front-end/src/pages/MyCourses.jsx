import { motion, AnimatePresence } from "framer-motion";
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
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="w-full"
      >
        {/* Course Pathway */}
        <CoursePathway onCourseClick={handleCourseClick} />
      </motion.div>
      <FloatingDictionary />
    </div>
  );
};

export default MyCourses;
