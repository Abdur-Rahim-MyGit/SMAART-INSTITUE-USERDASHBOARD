import CourseStructure from "@/components/CourseStructure";
import FloatingDictionary from "@/components/FloatingDictionary";
import { useNavigate } from "react-router-dom";
import useUser from "@/hooks/useUser";

const MyCourses = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const handleCourseClick = (courseId) => {
    navigate(`/dashboard/courses/${courseId}/player`);
  };

  const userProgress = {
    completedCourses: [],
    completedStages: [],
    tracksCompleted: [],
    assessmentsPassed: [],
    currentCourse: null,
  };

  return (
    <>
      <CourseStructure
        onCourseClick={handleCourseClick}
        userProgress={userProgress}
        user={user}
      />
      <FloatingDictionary />
    </>
  );
};

export default MyCourses;
