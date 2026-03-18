import { motion } from "framer-motion";
import { Lock, Check, Star, ChevronRight, BookOpen, PenTool, HelpCircle, Play } from "lucide-react";

// Color scheme: Navy #002147, Teal #1a3884, Gold #FFD700/#C0C0C0, White
const CoursePath = ({ completedCourses, onCourseClick }) => {
  const safeCompleted = Number.isFinite(completedCourses) ? completedCourses : 0;

  // Course/lesson data - keeping existing structure but adding categories
  const lessons = [
    { id: 1, title: "Course 1", subtitle: "Introduction to Learning", category: "Expression", status: safeCompleted >= 1 ? "completed" : safeCompleted === 0 ? "in-progress" : "locked", day: 1 },
    { id: 2, title: "Course 2", subtitle: "Core Fundamentals", category: "Vocabulary", status: safeCompleted >= 2 ? "completed" : safeCompleted === 1 ? "in-progress" : "locked", day: 2 },
    { id: 3, title: "Course 3", subtitle: "Building Blocks", category: "Expression", status: safeCompleted >= 3 ? "completed" : safeCompleted === 2 ? "in-progress" : "locked", day: 3 },
    { id: 4, title: "Practice Day 1", subtitle: "", category: "Practice", status: safeCompleted >= 4 ? "completed" : safeCompleted === 3 ? "in-progress" : "locked", day: 4 },
    { id: 5, title: "Course 4", subtitle: "Advanced Concepts", category: "Grammar", status: safeCompleted >= 5 ? "completed" : safeCompleted === 4 ? "in-progress" : "locked", day: 5 },
    { id: 6, title: "Course 5", subtitle: "Practical Applications", category: "Expression", status: safeCompleted >= 6 ? "completed" : safeCompleted === 5 ? "in-progress" : "locked", day: 6 },
    { id: 7, title: "Review Quiz Day 1", subtitle: "", category: "Quiz", status: safeCompleted >= 7 ? "completed" : safeCompleted === 6 ? "in-progress" : "locked", day: 7 },
    { id: 8, title: "Course 6", subtitle: "Expert Skills", category: "Vocabulary", status: safeCompleted >= 8 ? "completed" : safeCompleted === 7 ? "in-progress" : "locked", day: 8 },
    { id: 9, title: "Course 7", subtitle: "Mastery Level", category: "Grammar", status: safeCompleted >= 9 ? "completed" : safeCompleted === 8 ? "in-progress" : "locked", day: 9 },
    { id: 10, title: "Final Assessment", subtitle: "Complete your journey", category: "Quiz", status: safeCompleted >= 10 ? "completed" : safeCompleted === 9 ? "in-progress" : "locked", day: 10 },
  ];

  // Section groupings
  const sections = [
    { title: "Getting Started", lessons: lessons.slice(0, 4) },
    { title: "Building Skills", lessons: lessons.slice(4, 7) },
    { title: "Mastery", lessons: lessons.slice(7, 10) },
  ];

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Expression': return <BookOpen className="w-4 h-4" />;
      case 'Vocabulary': return <PenTool className="w-4 h-4" />;
      case 'Grammar': return <BookOpen className="w-4 h-4" />;
      case 'Practice': return <Play className="w-4 h-4" />;
      case 'Quiz': return <HelpCircle className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'Expression': return 'text-[#1a3884]';
      case 'Vocabulary': return 'text-[#C0C0C0]';
      case 'Grammar': return 'text-purple-500';
      case 'Practice': return 'text-orange-500';
      case 'Quiz': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="w-full bg-white rounded-xl p-4 sm:p-6 shadow-sm">
      {/* Sections with Timeline */}
      {sections.map((section, sectionIdx) => (
        <div key={section.title} className={sectionIdx > 0 ? "mt-8" : ""}>
          {/* Section Header */}
          <h3 className="text-lg font-bold text-[#002147] mb-4 pl-10">{section.title}</h3>
          
          {/* Lessons Timeline */}
          <div className="relative">
            {section.lessons.map((lesson, idx) => {
              const isActive = lesson.status !== "locked";
              const isCompleted = lesson.status === "completed";
              const isInProgress = lesson.status === "in-progress";
              const isLast = idx === section.lessons.length - 1;

              return (
                <div key={lesson.id} className="relative flex items-start">
                  {/* Timeline Left Side - Day Marker & Line */}
                  <div className="flex flex-col items-center mr-4 flex-shrink-0">
                    {/* Day Badge */}
                    <div className={`w-8 text-center text-[10px] font-medium mb-1 ${
                      isCompleted ? 'text-[#1a3884]' : isInProgress ? 'text-[#C0C0C0]' : 'text-gray-400'
                    }`}>
                      {lesson.category === 'Practice' || lesson.category === 'Quiz' ? '' : `Day`}
                      <br />
                      {lesson.category === 'Practice' || lesson.category === 'Quiz' ? '' : lesson.day}
                    </div>
                    
                    {/* Timeline Marker */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 ${
                        isCompleted 
                          ? 'bg-[#1a3884] text-white' 
                          : isInProgress 
                          ? 'bg-[#C0C0C0] text-white shadow-lg shadow-[#C0C0C0]/30' 
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" strokeWidth={3} />
                      ) : isInProgress ? (
                        <Star className="w-4 h-4" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                    </motion.div>
                    
                    {/* Connecting Line */}
                    {!isLast && (
                      <div className={`w-0.5 flex-1 min-h-[40px] ${
                        isCompleted ? 'bg-[#1a3884]' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>

                  {/* Lesson Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => isActive && onCourseClick(lesson.id)}
                    className={`flex-1 mb-3 p-4 rounded-xl border transition-all cursor-pointer ${
                      isCompleted 
                        ? 'bg-white border-gray-100 hover:border-[#1a3884]/30 hover:shadow-md' 
                        : isInProgress 
                        ? 'bg-white border-[#C0C0C0]/30 shadow-md hover:shadow-lg' 
                        : 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar/Icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-[#1a3884]/10' 
                          : isInProgress 
                          ? 'bg-[#C0C0C0]/10' 
                          : 'bg-gray-100'
                      }`}>
                        <span className={isCompleted ? 'text-[#1a3884]' : isInProgress ? 'text-[#C0C0C0]' : 'text-gray-400'}>
                          {getCategoryIcon(lesson.category)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Category Label */}
                        <span className={`text-[10px] font-medium uppercase tracking-wider ${getCategoryColor(lesson.category)} ${!isActive && 'opacity-50'}`}>
                          {lesson.category}
                        </span>
                        
                        {/* Title */}
                        <h4 className={`font-bold text-sm ${isActive ? 'text-[#002147]' : 'text-gray-400'}`}>
                          {lesson.title}
                        </h4>
                        
                        {/* Subtitle */}
                        {lesson.subtitle && (
                          <p className={`text-xs ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                            {lesson.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      {isActive && (
                        <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                          isInProgress ? 'text-[#C0C0C0]' : 'text-gray-300'
                        }`} />
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CoursePath;


