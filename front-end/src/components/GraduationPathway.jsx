import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  FileText,
  Lock,
  Check,
  Star,
  ChevronRight,
  Loader2,
  Calendar,
  Play,
} from "lucide-react";
import { coursesAPI } from "@/services/api";
import { useNavigate } from "react-router-dom";

const GraduationPathway = ({ onCourseClick }) => {
  const navigate = useNavigate();
  const [expandedUnits, setExpandedUnits] = useState([]);
  const [expandedModules, setExpandedModules] = useState([]); // Track expanded modules

  // Generate AI description based on course title
  const generateCourseDescription = (courseTitle) => {
    const descriptions = {
      'emotional intelligence': 'Master the art of understanding and managing emotions. This comprehensive course explores self-awareness, empathy, and social skills to help you build stronger relationships and make better decisions in both personal and professional settings.',
      'learn english': 'Embark on a transformative journey to master the English language. From fundamental grammar to advanced communication skills, this course provides interactive lessons, real-world practice, and cultural insights to help you become a confident English speaker.',
      'mathematics': 'Discover the beauty and power of mathematics. This course covers essential mathematical concepts, problem-solving strategies, and practical applications that will enhance your analytical thinking and prepare you for advanced studies.',
      'science': 'Explore the wonders of the natural world through hands-on experiments and engaging lessons. This course covers fundamental scientific principles, critical thinking skills, and the scientific method to foster curiosity and understanding.',
      'programming': 'Learn to code and bring your ideas to life. This comprehensive programming course covers fundamental concepts, best practices, and real-world applications to help you become a proficient developer.',
      'business': 'Develop essential business acumen and entrepreneurial skills. This course covers strategic planning, financial management, marketing, and leadership to prepare you for success in the business world.',
      'art': 'Unleash your creativity and explore various artistic techniques. This course covers fundamental art principles, different mediums, and creative expression to help you develop your unique artistic voice.',
      'history': 'Journey through time and discover the events that shaped our world. This course explores major historical periods, influential figures, and cultural movements to provide context for understanding our present.',
      'psychology': 'Delve into the fascinating world of human behavior and mental processes. This course covers psychological theories, research methods, and practical applications to help you understand yourself and others better.',
      'health': 'Learn essential principles for maintaining physical and mental well-being. This course covers nutrition, exercise, stress management, and healthy lifestyle choices to help you live your best life.'
    };

    // Find matching description (case-insensitive partial match)
    const titleLower = courseTitle.toLowerCase();
    for (const [key, description] of Object.entries(descriptions)) {
      if (titleLower.includes(key) || key.includes(titleLower)) {
        return description;
      }
    }

    // Default description if no match found
    return `Embark on an enriching learning journey with ${courseTitle}. This carefully designed course provides comprehensive knowledge, practical skills, and engaging content to help you achieve your educational goals and unlock new opportunities.`;
  };

  // NEW: Fill placeholder days to ensure 3 sessions are always shown
  const fillPlaceholderDays = (module, moduleNum) => {
    const existingDaysCount = module.days ? module.days.length : 0;
    if (existingDaysCount >= 3) return module.days || [];

    const days = module.days ? [...module.days] : [];
    for (let i = existingDaysCount + 1; i <= 3; i++) {
        days.push({
            id: i,
            dayNumber: i,
            title: `Session ${i} (Locked)`,
            description: "Additional learning content coming soon.",
            status: 'locked',
            tasks: [],
            isPlaceholder: true
        });
    }
    return days;
  };

  const [courses, setCourses] = useState([]);
  const [courseModules, setCourseModules] = useState({});
  const [enrollments, setEnrollments] = useState({}); // Track user enrollments
  const [loading, setLoading] = useState(true);
  const [loadingModules, setLoadingModules] = useState({});
  const [error, setError] = useState(null);

  // Fetch courses and enrollments from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        const userId = user?.id || user?._id;

        // Fetch courses
        const coursesResponse = await coursesAPI.getAll();
        const coursesData = coursesResponse.data || coursesResponse;
        
        // Fetch enrollments if user is logged in
        let enrollmentsData = [];
        if (userId && token) {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const enrollResponse = await fetch(
            `${API_BASE_URL}/course-enrollments/student/${userId}`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          if (enrollResponse.ok) {
            const resData = await enrollResponse.json();
            enrollmentsData = resData.data || [];
          }
        }

        const enrollMap = {};
        enrollmentsData.forEach(e => {
          const cid = e.course?._id || e.course;
          enrollMap[cid] = e;
        });
        setEnrollments(enrollMap);

        if (coursesData.length > 0) {
          const modulesMap = {};
          coursesData.forEach((course, cIdx) => {
            const courseId = course._id || course.id;
            if (course.modules && course.modules.length > 0) {
              // Apply placeholder days to all modules for consistent 3-session UI
              const formattedModules = course.modules.map((m, mIdx) => ({
                 ...m,
                 days: fillPlaceholderDays(m, mIdx + 1)
              }));
              modulesMap[courseId] = formattedModules;
            }
          });
          setCourseModules(modulesMap);
          
          const firstCourseId = coursesData[0]._id || coursesData[0].id;
          setExpandedUnits([firstCourseId]);
        }
        
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Simplified - modules are now loaded with courses
  const fetchModulesForCourse = async (courseId) => {
    // Modules are already loaded from the initial course fetch
    // This function is kept for compatibility but does nothing
    if (courseModules[courseId]) {
      console.log('✅ Modules already loaded for course:', courseId);
      return;
    }
    console.log('⚠️ No modules found for course:', courseId);
  };

  const toggleUnit = (unitId) => {
    const isCurrentlyExpanded = expandedUnits.includes(unitId);
    // Modules are already loaded, no need to fetch
    setExpandedUnits(prev => 
      isCurrentlyExpanded ? prev.filter(id => id !== unitId) : [...prev, unitId]
    );
  };

  const toggleModule = (moduleKey) => {
    setExpandedModules(prev => 
      prev.includes(moduleKey) ? prev.filter(k => k !== moduleKey) : [...prev, moduleKey]
    );
  };

  const handleDayClick = (courseIdx, moduleIdx, dayIdx) => {
    // Navigate using 1-based indices for course, module, and day
    const courseNum = courseIdx + 1;  // Convert to 1-based
    const moduleNum = moduleIdx + 1;  // Convert to 1-based  
    const dayNum = dayIdx + 1;        // Convert to 1-based
    console.log(`🔗 Navigating to: Course ${courseNum}, Module ${moduleNum}, Day ${dayNum}`);
    navigate(`/dashboard/courses/${courseNum}/modules/${moduleNum}/days/${dayNum}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#30919D] animate-spin" />
        <span className="ml-3 text-gray-500">Loading courses...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-[#30919D] text-white rounded-lg">Retry</button>
      </div>
    );
  }

  // Empty state
  if (courses.length === 0) {
    return (
      <div className="text-center py-20">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No courses available yet</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {courses.map((course, courseIdx) => {
        const courseId = course._id || course.id;
        const isExpanded = expandedUnits.includes(courseId);
        const modules = courseModules[courseId] || [];
        const enrollment = enrollments[courseId];

        // NEW: Calculate progress based on days completed across modules
        let totalDisplayDays = 0;
        let completedDisplayDays = 0;

        modules.forEach((mod, mIdx) => {
          // Use actual day count
          const modTotalDays = mod.days?.length || 0;
          totalDisplayDays += modTotalDays;

          const modProgress = enrollment?.moduleProgress?.find(mp => 
            mp.module === mod._id || mp.module?._id === mod._id
          );

          if (mod.days) {
            mod.days.forEach((day, dIdx) => {
              if (day.isPlaceholder) return; // Cannot complete placeholders
              const dId = day.dayNumber || dIdx + 1;
              const isVidDone = modProgress?.videoProgress?.some(vp => vp.dayId === dId && vp.isCompleted);
              const isTaskDone = modProgress?.completedTasks?.some(ct => ct.dayId === dId);
              
              const hasTasks = day.tasks?.length > 0;
              const taskCondition = hasTasks ? isTaskDone : true;
              
              if (isVidDone && taskCondition) {
                completedDisplayDays++;
              }
            });
          }
        });

        const progressPercent = totalDisplayDays > 0 ? Math.round((completedDisplayDays / totalDisplayDays) * 100) : 0;
        const isCompleted = progressPercent === 100 && totalDisplayDays > 0;
        const isInProgress = (enrollment?.progress || progressPercent) > 0 || courseIdx === 0;
        const completedModules = modules.filter((mod, mIdx) => {
            const modProgress = enrollment?.moduleProgress?.find(mp => 
                mp.module === mod._id || mp.module?._id === mod._id
            );
            return modProgress?.status === 'completed';
        }).length;
        const totalModules = modules.length;

        return (
          <motion.div 
            key={courseId} 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-gray-100"
          >
            {/* Flex container for side-by-side layout when expanded */}
            <motion.div 
              layout
              className={`flex flex-col ${isExpanded ? 'lg:flex-row' : ''} gap-0`}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {/* LEFT SIDE - Unit Card */}
              <motion.div 
                layout
                className={`${isExpanded ? 'lg:w-96 lg:flex-shrink-0 lg:border-r-2 lg:border-gradient' : 'w-full'} transition-all bg-gradient-to-b from-white to-gray-50/50`}
                transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                style={isExpanded ? { borderImage: 'linear-gradient(to bottom, #14b8a6, #0d9488) 1' } : {}}
              >
                <div 
                  className="p-4 sm:p-6 cursor-pointer hover:bg-gradient-to-br hover:from-gray-50 hover:to-white transition-all" 
                  onClick={() => toggleUnit(courseId)}
                >
                  <div className="flex flex-col items-center text-center">
                    <span className={`text-xs font-bold uppercase tracking-widest mb-1 px-3 py-1 rounded-full ${
                      isCompleted ? 'bg-[#30919D] text-white shadow-sm' : 
                      isInProgress ? 'bg-[#30919D] text-white shadow-sm' : 
                      'bg-gray-100 text-gray-400'
                    }`}>
                      Unit {courseIdx + 1}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#002147] mb-1">{course.title}</h2>
                    {course.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description.slice(0, 100)}...</p>}

                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-4">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke={isCompleted ? '#30919D' : isInProgress ? '#30919D' : '#9CA3AF'} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${progressPercent * 2.64} ${264 - progressPercent * 2.64}`} className="transition-all duration-1000" />
                      </svg>

                      {/* Progress Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <BookOpen className={`w-6 h-6 ${isCompleted ? 'text-[#30919D]' : isInProgress ? 'text-[#30919D]' : 'text-gray-400'}`} />
                        <span className={`text-xs font-bold mt-1 ${isCompleted ? 'text-[#30919D]' : isInProgress ? 'text-[#30919D]' : 'text-gray-400'}`}>{totalModules > 0 ? `${completedModules}/${totalModules}` : '—'}</span>
                      </div>
                    </div>

                    <div className="mt-4 text-gray-400 hover:text-[#30919D] transition-colors">
                      {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </div>
                  </div>
                </div>

                {/* Course Description - Only visible when expanded */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                      className="p-6 border-t border-gray-100 bg-gradient-to-br from-blue-50/30 to-purple-50/30"
                    >
                      <h3 className="text-sm font-bold text-[#002147] uppercase mb-2 flex items-center gap-2">
                        <span className="w-1 h-4 bg-[#30919D] rounded-full"></span>
                        About This Course
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {course.description || generateCourseDescription(course.title)}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* RIGHT SIDE - Modules Grid (only when expanded) */}
              <AnimatePresence mode="wait">
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, x: 50, scale: 0.98 }} 
                    animate={{ opacity: 1, x: 0, scale: 1 }} 
                    exit={{ opacity: 0, x: 50, scale: 0.98 }} 
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    className="flex-1 p-4 sm:p-6 bg-white min-w-0"
                  >
                    {loadingModules[courseId] && (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-[#30919D] animate-spin" />
                        <span className="ml-3 text-gray-500">Loading modules...</span>
                      </div>
                    )}

                    {!loadingModules[courseId] && modules.length === 0 && (
                      <div className="text-center py-12 text-gray-400">No modules available for this course</div>
                    )}

                    {!loadingModules[courseId] && modules.length > 0 && (
                      <div className="space-y-3">
                        {modules.map((module, moduleIdx) => {
                          const days = module.days || [];
                          
                          // Calculate completion locally for immediate UI feedback
                          let completedDays = 0;
                          days.forEach((day, dIdx) => {
                            const dId = day.dayNumber || dIdx + 1;
                            const isVidDone = modProgress?.videoProgress?.some(vp => vp.dayId === dId && vp.isCompleted);
                            const isTaskDone = modProgress?.completedTasks?.some(ct => ct.dayId === dId);
                            const hasTasks = day.tasks?.length > 0;
                            const taskCondition = hasTasks ? isTaskDone : true;
                            if (isVidDone && taskCondition) completedDays++;
                          });

                          const isModuleCompletedLocally = completedDays > 0 && completedDays >= days.length;
                          const isModuleCompleted = modProgress?.status === 'completed' || isModuleCompletedLocally;

                          // Check previous module completion
                          const prevModuleId = moduleIdx > 0 ? modules[moduleIdx - 1]._id : null;
                          const prevModProgress = prevModuleId ? enrollment?.moduleProgress?.find(mp => 
                            mp.module === prevModuleId || mp.module?._id === prevModuleId
                          ) : null;
                          
                          // Calculate previous module completion locally too
                          let prevCompletedDays = 0;
                          if (moduleIdx > 0) {
                             const prevModule = modules[moduleIdx - 1];
                             const prevDays = prevModule.days || [];
                             prevDays.forEach((day, dIdx) => {
                                const dId = day.dayNumber || dIdx + 1;
                                const isVidDone = prevModProgress?.videoProgress?.some(vp => vp.dayId === dId && vp.isCompleted);
                                const isTaskDone = prevModProgress?.completedTasks?.some(ct => ct.dayId === dId);
                                const hasTasks = day.tasks?.length > 0;
                                const taskCondition = hasTasks ? isTaskDone : true;
                                if (isVidDone && taskCondition) prevCompletedDays++;
                             });
                          }
                          const isPrevModuleCompleted = moduleIdx === 0 || (prevModProgress?.status === 'completed') || (prevCompletedDays > 0 && prevCompletedDays >= (modules[moduleIdx-1]?.days?.length || 3));

                          const isModuleInProgress = (modProgress?.status === 'in_progress' || modProgress?.status === 'not_started' || (enrollment?.progress > 0 && !modProgress)) && isPrevModuleCompleted;
                          const isModuleActive = isModuleCompleted || isModuleInProgress;
                          
                          const moduleKey = `${courseId}-${moduleIdx}`;
                          const isExpanded = expandedModules.includes(moduleKey);

                          return (
                            <motion.div
                              key={moduleIdx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: moduleIdx * 0.05 }}
                              className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                            >
                              {/* Module Header Row */}
                              <div 
                                onClick={() => toggleModule(moduleKey)}
                                className={`flex items-center justify-between p-4 cursor-pointer transition-all hover:bg-gray-50 ${
                                  isModuleInProgress ? 'border-l-4 border-l-[#30919D]' : 
                                  isModuleCompleted ? 'border-l-4 border-l-[#30919D]' : ''
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  {/* Module Number Badge */}
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                    isModuleCompleted ? 'bg-[#30919D] text-white' :
                                    isModuleInProgress ? 'bg-[#30919D] text-white' :
                                    'bg-gray-100 text-[#002147]'
                                  }`}>
                                    M{module.sequence || moduleIdx + 1}
                                  </div>
                                  
                                  {/* Module Info */}
                                  <div>
                                    <h4 className="font-bold text-[#002147]">
                                      {module.title || `Module ${moduleIdx + 1}`}
                                    </h4>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {days.length} Days
                                      </span>
                                      {completedDays > 0 && (
                                        <span className="flex items-center gap-1 text-[#30919D]">
                                          <Check className="w-3 h-3" />
                                          {completedDays}/{days.length} complete
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Right side - Progress & Expand */}
                                <div className="flex items-center gap-4">
                                  {/* Progress Ring */}
                                  <div className="relative w-10 h-10">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                      <circle cx="18" cy="18" r="14" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                                      <circle 
                                        cx="18" cy="18" r="14" fill="none" 
                                        stroke={isModuleInProgress || isModuleCompleted ? '#30919D' : '#9CA3AF'} 
                                        strokeWidth="3" 
                                        strokeLinecap="round" 
                                        strokeDasharray={`${(completedDays / (days.length || 1)) * 88} ${88 - (completedDays / (days.length || 1)) * 88}`}
                                      />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#002147]">
                                      {Math.round((completedDays / (days.length || 3)) * 100)}%
                                    </span>
                                  </div>

                                  {/* Expand Arrow */}
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                  </motion.div>
                                </div>
                              </div>

                              {/* Expanded Days Section */}
                              <AnimatePresence>
                                {isExpanded && days.length > 0 && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="border-t border-gray-100 bg-gray-50 overflow-hidden"
                                  >
                                    <div className="p-4">
                                      <div className="flex flex-wrap gap-2">
                                          {days.map((day, dayIdx) => {
                                            const dayNumber = day.dayNumber || dayIdx + 1;
                                            const isVidDone = modProgress?.videoProgress?.some(vp => vp.dayId === dayNumber && vp.isCompleted);
                                            const isTaskDone = modProgress?.completedTasks?.some(ct => ct.dayId === dayNumber);
                                            const hasTasks = day.tasks?.length > 0;
                                            const taskCondition = hasTasks ? isTaskDone : true;
                                            
                                            const isDayCompleted = isVidDone && taskCondition;
                                            const isDayActive = dayIdx === 0 || (prevDayStatus); // Minimal unlock logic for UI
                                            const isDayInProgress = !isDayCompleted && isDayActive;
                                            
                                            // Helper for next day's unlock
                                            var prevDayStatus = isDayCompleted; 

                                          return (
                                            <motion.button
                                              key={dayIdx}
                                              onClick={() => isDayActive && handleDayClick(courseIdx, moduleIdx, dayIdx)}
                                              whileHover={isDayActive ? { scale: 1.05 } : {}}
                                              whileTap={isDayActive ? { scale: 0.95 } : {}}
                                              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                                isDayCompleted ? 'bg-[#30919D] text-white shadow-sm' :
                                                isDayInProgress ? 'bg-[#30919D] text-white shadow-md hover:shadow-lg' :
                                                isDayActive ? 'bg-white text-[#002147] border border-gray-200 hover:border-[#30919D] hover:bg-[#30919D]/5' :
                                                'bg-gray-100 text-gray-400 cursor-not-allowed'
                                              }`}
                                              disabled={!isDayActive}
                                            >
                                              <div className="flex items-center gap-2">
                                                {isDayCompleted && <Check className="w-3.5 h-3.5" />}
                                                {isDayInProgress && <Play className="w-3 h-3 fill-current" />}
                                                Day {day.dayNumber || dayIdx + 1}
                                              </div>
                                            </motion.button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {/* Unit Label at Bottom */}
                    {!loadingModules[courseId] && modules.length > 0 && (
                      <div className="mt-6 text-center">
                        <span className="text-sm text-[#30919D] uppercase tracking-wider">
                          Unit {courseIdx + 1}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default GraduationPathway;
