import { useState, useEffect } from 'react';
import { coursesAPI, courseEnrollmentAPI } from '@/services/api';

export const useLearningPaths = (userId) => {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLearningPaths = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from API
        if (userId) {
          try {
            const enrollments = await courseEnrollmentAPI.getByStudentAndCourse(userId, '');
            
            if (enrollments && enrollments.length > 0) {
              const pathsData = await Promise.all(
                enrollments.map(async (enrollment) => {
                  try {
                    const course = await coursesAPI.getById(enrollment.course);
                    return {
                      id: course._id,
                      title: course.title,
                      subtitle: course.description || 'No description',
                      progress: enrollment.progress || 0,
                      btnText: 'Continue Path',
                      icon: getIconForCourse(course.category),
                      color: getColorForCourse(course.category),
                      enrollmentId: enrollment._id
                    };
                  } catch (err) {
                    console.error('Error fetching course details:', err);
                    return null;
                  }
                })
              );

              const validPaths = pathsData
                .filter(path => path !== null)
                .sort((a, b) => b.progress - a.progress);

              if (validPaths.length > 0) {
                setPaths(validPaths);
                setLoading(false);
                return;
              }
            }
          } catch (apiErr) {
            console.log('API fetch failed, using fallback data:', apiErr.message);
          }
        }

        // Use fallback data if API fails or no data
        setPaths(getFallbackPaths());
      } catch (err) {
        console.error('Error in fetchLearningPaths:', err);
        setPaths(getFallbackPaths());
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPaths();
  }, [userId]);

  return { paths, loading, error };
};

// Helper function to get icon based on course category
const getIconForCourse = (category) => {
  const iconMap = {
    'software': 'Code',
    'data': 'Database',
    'cloud': 'Cloud',
    'default': 'BookOpen'
  };
  return iconMap[category?.toLowerCase()] || iconMap.default;
};

// Helper function to get color based on course category
const getColorForCourse = (category) => {
  const colorMap = {
    'software': 'blue',
    'data': 'indigo',
    'cloud': 'amber',
    'default': 'blue'
  };
  return colorMap[category?.toLowerCase()] || colorMap.default;
};

// Fallback data when API fails
const getFallbackPaths = () => [
  {
    id: 1,
    title: 'Software Developer',
    subtitle: 'Certification: Python, Java',
    progress: 60,
    btnText: 'Continue Path',
    icon: 'Code',
    color: 'blue'
  },
  {
    id: 2,
    title: 'AI & ML',
    subtitle: 'Certification: Machine Learning, Deep Learning',
    progress: 40,
    btnText: 'Continue Path',
    icon: 'Database',
    color: 'indigo'
  },
  {
    id: 3,
    title: 'Cloud and DevOps',
    subtitle: 'Session 1: Hosting Development Sprints',
    progress: 20,
    btnText: 'Continue Path',
    icon: 'Cloud',
    color: 'amber'
  }
];
