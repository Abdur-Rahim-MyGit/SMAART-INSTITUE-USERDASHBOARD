import CourseStructure from "@/components/CourseStructure";
import FloatingDictionary from "@/components/FloatingDictionary";
import FloatingNotes from "@/components/FloatingNotes";
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
    </>
  );
};

export default MyCourses;
