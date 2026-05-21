import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, ChevronRight, BookOpen, Target, Crown, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STEPS = [
  {
    id: 1,
    label: "STEP 01",
    title: "Capacity",
    subtitle: "Level 1: Foundations",
    description: "Build the foundational skills and resources to perform at your best in any environment.",
    active: true,
    icon: BookOpen,
    progress: 0,
    totalModules: 12,
    completedModules: 0,
  },
  {
    id: 2,
    label: "STEP 02",
    title: "Capability",
    subtitle: "Level 2: Intermediate",
    description: "Develop core competencies and technical expertise to excel in your chosen field.",
    active: false,
    icon: Target,
    progress: 0,
    totalModules: 15,
    completedModules: 0,
  },
  {
    id: 3,
    label: "STEP 03",
    title: "Leadership",
    subtitle: "Level 3: Advanced",
    description: "Cultivate the mindset and vision to lead teams and drive meaningful change.",
    active: false,
    icon: Crown,
    progress: 0,
    totalModules: 18,
    completedModules: 0,
  },
];

const CoursePathway = ({ onCourseClick }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Header Section */}
      <div className="px-6 py-12 md:px-12 lg:px-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-[#1a3884] text-white border-indigo-500 px-4 py-1.5 text-sm font-medium">
            <Sparkles className="w-4 h-4 mr-1.5" />
            Learning Path
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Your Course Journey
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Master your skills through our structured learning pathway. Complete each level to unlock the next stage of your development.
          </p>
        </motion.div>

        {/* Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <ModernCourseCard step={step} index={i} onCourseClick={onCourseClick} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Modern Course Card Component ── */
import { coursesAPI } from "@/services/api";

const ModernCourseCard = ({ step, index, onCourseClick }) => {
  const [hovered, setHovered] = useState(false);
  const [courseList, setCourseList] = useState([]);
  const Icon = step.icon;

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesAPI.getAll();
        const courses = response.data || [];
        setCourseList(courses);
      } catch (e) {
        console.error("Failed to fetch courses setup", e);
      }
    };
    fetchCourses();
  }, []);

  const navigateToCourse = () => {
    if (!step.active) return;
    
    let courseId = step.id;
    if (courseList.length >= step.id) {
       courseId = courseList[step.id - 1]._id || courseList[step.id - 1].id; 
    }
    
    if (onCourseClick) {
        onCourseClick(courseId);
    } else {
        window.location.href = `/dashboard/courses/${courseId}/modules`;
    }
  };

  const getCardGradient = () => {
    if (step.active) {
      return "from-white to-blue-50 dark:from-slate-800 dark:to-slate-900";
    }
    return "from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900";
  };

  const getBorderColor = () => {
    if (step.active) {
      return "border-indigo-200 dark:border-indigo-800";
    }
    return "border-slate-200 dark:border-white/10";
  };

  return (
    <motion.div
      whileHover={{ y: step.active ? -8 : 0, scale: step.active ? 1.02 : 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={step.active ? "cursor-pointer" : "cursor-not-allowed"}
      onClick={step.active ? navigateToCourse : undefined}
    >
      <Card className={`
        h-full overflow-hidden transition-all duration-300
        bg-gradient-to-br ${getCardGradient()}
        border-2 ${getBorderColor()}
        ${step.active ? 'shadow-xl shadow-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/20' : 'shadow-md opacity-75'}
      `}>
        {/* Card Header with Icon */}
        <CardHeader className="relative pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className={`
              p-4 rounded-2xl transition-all duration-300
              ${step.active 
                ? 'bg-[#1a3884] text-white shadow-lg shadow-indigo-500/30' 
                : 'bg-slate-300 text-slate-500 dark:bg-[#003170] dark:text-slate-400'}
            `}>
              <Icon size={32} />
            </div>
            {step.active ? (
              <Badge className="bg-green-500 text-white border-green-400 px-3 py-1">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Unlocked
              </Badge>
            ) : (
              <Badge variant="outline" className="border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400 px-3 py-1">
                <Lock className="w-3 h-3 mr-1" />
                Locked
              </Badge>
            )}
          </div>
          
          <Badge className="mb-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 w-fit">
            {step.label}
          </Badge>
          
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
            {step.title}
          </CardTitle>
          <CardDescription className="text-base font-medium text-indigo-600 dark:text-indigo-400">
            {step.subtitle}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {step.description}
          </p>

          {/* Progress Section */}
          <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Progress</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {step.completedModules} / {step.totalModules} modules
              </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-[#003170] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${step.progress}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className={`
                  h-full rounded-full transition-all duration-500
                  ${step.active ? 'bg-[#1a3884]' : 'bg-slate-400'}
                `}
                style={{ width: `${step.progress}%` }}
              />
            </div>
          </div>

          {/* Action Button */}
          {step.active ? (
            <Button 
              className={`
                w-full group transition-all duration-300
                ${hovered 
                  ? 'bg-indigo-700 hover:bg-indigo-800 shadow-lg shadow-indigo-500/30' 
                  : 'bg-[#1a3884] hover:bg-indigo-700'}
              `}
              onClick={(e) => {
                e.stopPropagation();
                navigateToCourse();
              }}
            >
              Continue Learning
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <div className="text-center py-3 px-4 bg-slate-100 dark:bg-[#002A5C] rounded-xl">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Complete previous level to unlock
              </p>
            </div>
          )}
        </CardContent>

        {/* Decorative Elements */}
        {step.active && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
        )}
      </Card>
    </motion.div>
  );
};

export default CoursePathway;

