import CourseStructure from "@/components/CourseStructure";
import FloatingDictionary from "@/components/FloatingDictionary";
import { useNavigate } from "react-router-dom";

const MyCourses = () => {
  const navigate = useNavigate();

  const handleCourseClick = (courseId) => {
    navigate(`/dashboard/courses/${courseId}/player`);
  };

  // Mock user progress - this should come from your API/state management
  const userProgress = {
    completedCourses: [],
    completedStages: [],
    tracksCompleted: [],
    assessmentsPassed: [],
    currentCourse: null,
  };

  return (
    <>
      <CourseStructure onCourseClick={handleCourseClick} userProgress={userProgress} />
      <FloatingDictionary />
    </>
  );
};

export default MyCourses;
