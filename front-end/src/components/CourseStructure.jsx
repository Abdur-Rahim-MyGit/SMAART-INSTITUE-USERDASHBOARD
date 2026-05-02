import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Lock, 
  Unlock, 
  ChevronRight, 
  BookOpen, 
  Target, 
  Crown, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2,
  Brain,
  Bot,
  Leaf,
  GraduationCap,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  STAGES, 
  TRACKS, 
  ASSESSMENT_GATES,
  COURSE_LEARNING_FLOW 
} from "@/data/courseStructureData";

const CourseStructure = ({ onCourseClick, userProgress = {} }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [expandedStage, setExpandedStage] = useState(null);
  const [expandedTrack, setExpandedTrack] = useState(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Expand the stage containing the current course by default
  useEffect(() => {
    if (userProgress.currentCourse) {
      for (const stage of STAGES) {
        if (stage.courses.some(c => c.id === userProgress.currentCourse)) {
          setExpandedStage(stage.id);
          break;
        }
      }
    }
  }, [userProgress.currentCourse]);

  const isStageUnlocked = (stage) => {
    if (stage.id === 1) return true;
    const prevStage = STAGES[stage.id - 2];
    return userProgress.completedStages?.includes(prevStage.id) && 
           userProgress.assessmentsPassed?.includes(prevStage.assessmentGate);
  };

  const isTrackUnlocked = (track) => {
    return userProgress.completedCourses?.includes(track.unlockAfter);
  };

  const isCourseUnlocked = (courseId, stageId) => {
    const stage = STAGES.find(s => s.id === stageId);
    if (!stage || !isStageUnlocked(stage)) return false;
    
    const courseIndex = stage.courses.findIndex(c => c.id === courseId);
    if (courseIndex === 0) return true; // First course of stage is always unlocked if stage is unlocked
    
    const prevCourseId = stage.courses[courseIndex - 1].id;
    return userProgress.completedCourses?.includes(prevCourseId);
  };

  const handleLockedCourseClick = (course, stageId) => {
    const stage = STAGES.find(s => s.id === stageId);
    if (!isStageUnlocked(stage)) {
      const prevStage = STAGES[stage.id - 2];
      toast.error(`Unlock Stage ${stageId} by completing Stage ${prevStage.id} and passing ${prevStage.assessmentGate}!`, {
        description: `Requirement: Complete all ${prevStage.name} courses and pass the gate assessment.`
      });
      return;
    }

    const courseIndex = stage.courses.findIndex(c => c.id === course.id);
    if (courseIndex > 0) {
      const prevCourse = stage.courses[courseIndex - 1];
      toast.error(`Complete "${prevCourse.title}" first!`, {
        description: `This course is part of a sequential learning path.`
      });
    }
  };

  const handleLockedTrackClick = (track) => {
    let requirementText = "";
    let stageName = "";
    
    if (track.id === 'PIQ') {
      requirementText = "Course S05";
      stageName = "Capacity (Stage 1)";
    } else if (track.id === 'AIQ') {
      requirementText = "Course S15";
      stageName = "Capability (Stage 2)";
    } else if (track.id === 'SQ') {
      requirementText = "Course S21";
      stageName = "Leadership (Stage 3)";
    } else {
      requirementText = `Course ${track.unlockAfter}`;
      stageName = "the Core Programme";
    }

    toast.error(`Unlock ${track.shortName} Track!`, {
      description: `Requirement: First complete ${requirementText} in the ${stageName} section.`,
      duration: 5000,
    });
  };

  const getStageIcon = (stageId) => {
    switch(stageId) {
      case 1: return BookOpen;
      case 2: return Target;
      case 3: return Crown;
      default: return GraduationCap;
    }
  };

  const getTrackIcon = (trackId) => {
    switch(trackId) {
      case 'PIQ': return Brain;
      case 'AIQ': return Bot;
      case 'SQ': return Leaf;
      default: return Sparkles;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-[#001529] text-gray-900 dark:text-white selection:bg-[#1a3884] selection:text-white transition-colors duration-300">
      {/* Premium Header Section */}
      <div className="px-6 py-16 md:px-12 lg:px-24 bg-white dark:bg-[#002147] border-b border-gray-100 dark:border-white/5 relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#112b6b] dark:text-white mb-2 tracking-tight" style={{ letterSpacing: '-0.03em', fontFamily: "'Outfit', sans-serif" }}>
                My Learning Journey
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Track your progress through the programme
              </p>
            </div>

            {/* Slim Progress Card */}
            <Card className="w-full md:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded-xl px-5 py-3">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progress</span>
                  <span className="text-2xl font-bold text-[#1a3884] dark:text-blue-400">
                    {Math.round((Object.keys(userProgress.completedCourses || {}).length / 40) * 100)}%
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium">{Object.keys(userProgress.completedCourses || {}).length} completed</span>
                  <span className="font-medium">{40 - Object.keys(userProgress.completedCourses || {}).length} remaining</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <div className="px-6 py-12 md:px-12 lg:px-24 max-w-7xl mx-auto">


        {/* Core Programme Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="w-8 h-8 text-[#1a3884]" />
            <h2 className="text-2xl md:text-3xl font-bold text-[#112b6b] dark:text-white">
              Core Programme
            </h2>
            <Badge className="bg-[#1a3884]/10 text-[#1a3884] dark:bg-[#1a3884]/20 dark:text-[#1a3884]">
              25 Courses
            </Badge>
          </div>

          <div className="space-y-6">
            {STAGES.map((stage, index) => {
              const isUnlocked = isStageUnlocked(stage);
              const StageIcon = getStageIcon(stage.id);
              const isExpanded = expandedStage === stage.id;

              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
          <Card className={`
            overflow-hidden transition-all duration-500 bg-white dark:bg-white/5
            ${isUnlocked 
              ? 'border-none shadow-xl hover:shadow-2xl' 
              : 'border-gray-100 dark:border-white/5 opacity-80'}
          `}
          style={{
            borderRadius: '32px',
            boxShadow: isUnlocked ? '0 30px 60px -12px rgba(0,0,0,0.08), 0 18px 36px -18px rgba(0,0,0,0.05)' : 'none'
          }}>
                    <CardHeader 
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`
                            p-3 rounded-xl transition-all duration-300
                            ${isUnlocked 
                              ? 'bg-[#1a3884] text-white shadow-lg' 
                              : 'bg-gray-100 text-gray-400'}
                          `}>
                            <StageIcon size={24} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={isUnlocked ? 'bg-[#1a3884] text-white' : 'bg-gray-300 text-white'}>
                                {stage.subtitle}
                              </Badge>
                              {isUnlocked ? (
                                <Badge className="bg-green-500 text-white border-green-400">
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Unlocked
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-gray-300 text-gray-500">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Locked
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-xl md:text-2xl text-[#112b6b] dark:text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                              {stage.name}
                            </CardTitle>
                            <CardDescription className="text-base text-gray-500">
                              {stage.description}
                            </CardDescription>
                          </div>
                        </div>
                        <ChevronRight className={`w-6 h-6 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-500">
                            {stage.courses.filter(c => userProgress.completedCourses?.includes(c.id)).length} / {stage.totalCourses} courses
                          </span>
                          {stage.unlockAfter && (
                            <span className="text-xs text-gray-400">
                              Requires: {stage.unlockAfter} + {stage.assessmentGate}
                            </span>
                          )}
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ 
                              width: `${(stage.courses.filter(c => userProgress.completedCourses?.includes(c.id)).length / stage.totalCourses) * 100}%` 
                            }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className={`h-full rounded-full ${isUnlocked ? 'bg-[#1a3884]' : 'bg-gray-300'}`}
                          />
                        </div>
                      </div>
                    </CardHeader>

                    {/* Expanded Course List */}
                    {isExpanded && (
                      <CardContent className="border-t border-gray-100 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {stage.courses.map((course, courseIdx) => {
                            const isCompleted = userProgress.completedCourses?.includes(course.id);
                            const isCurrent = userProgress.currentCourse === course.id;
                            const courseUnlocked = isCourseUnlocked(course.id, stage.id);
                            
                            return (
                              <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: courseIdx * 0.05 }}
                              >
                                  <div
                                    onClick={() => courseUnlocked ? (onCourseClick && onCourseClick(course.id)) : handleLockedCourseClick(course, stage.id)}
                                  className={`
                                    p-4 rounded-xl border transition-all cursor-pointer bg-white
                                    ${isCompleted 
                                      ? 'border-green-200' 
                                      : isCurrent 
                                      ? 'border-[#1a3884] shadow-md ring-2 ring-[#1a3884]/10' 
                                      : courseUnlocked
                                      ? 'border-gray-100 hover:border-[#1a3884]/30'
                                      : 'border-gray-100 opacity-50 cursor-not-allowed grayscale'}
                                  `}
                                  style={{
                                    border: isCompleted ? '1px solid #bbf7d0' : isCurrent ? '1px solid #1a3884' : '1px solid rgba(0,0,0,0.05)',
                                    boxShadow: isCurrent ? '0 4px 12px rgba(26,56,132,0.15)' : 'none',
                                  }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`
                                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                      ${isCompleted 
                                        ? 'bg-green-500 text-white' 
                                        : isCurrent 
                                        ? 'bg-[#1a3884] text-white' 
                                        : 'bg-gray-100 text-gray-400'}
                                    `}>
                                      {isCompleted ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                      ) : !courseUnlocked ? (
                                        <Lock className="w-4 h-4" />
                                      ) : (
                                        <span className="text-xs font-bold">{courseIdx + 1}</span>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-gray-400">
                                          {course.id}
                                        </span>
                                        {isCurrent && (
                                          <Badge className="bg-[#1a3884] text-white text-xs px-2 py-0">
                                            Current
                                          </Badge>
                                        )}
                                      </div>
                                      <h4 className="font-semibold text-sm text-[#112b6b] dark:text-white mb-1">
                                        {course.title}
                                      </h4>
                                      <p className="text-xs text-gray-500 line-clamp-2">
                                        {course.subtitle}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                        
                        {/* Assessment Gate */}
                        {stage.assessmentGate && (
                          <div className="mt-6 p-4 bg-[#1a3884]/5 border border-[#1a3884]/20 rounded-xl">
                            <div className="flex items-center gap-3">
                              <TrendingUp className="w-5 h-5 text-[#1a3884]" />
                              <div className="flex-1">
                                <h4 className="font-semibold text-[#112b6b] dark:text-white">
                                  Assessment Gate: {stage.assessmentGate}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Pass this assessment (70%+) to unlock the next stage
                                </p>
                              </div>
                              {userProgress.assessmentsPassed?.includes(stage.assessmentGate) ? (
                                <Badge className="bg-green-500 text-white">
                                  Passed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-[#1a3884]/30 text-[#1a3884]">
                                  Pending
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Parallel Tracks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-8 h-8 text-[#1a3884]" />
            <h2 className="text-2xl md:text-3xl font-bold text-[#112b6b] dark:text-white">
              Readiness Tracks
            </h2>
            <Badge className="bg-[#1a3884]/10 text-[#1a3884]">
              15 Courses
            </Badge>
          </div>
          <p className="text-gray-500 mb-6 max-w-2xl">
            Specialized tracks that run parallel to the core programme. Each track unlocks after completing specific core courses.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TRACKS.map((track, index) => {
              const isUnlocked = isTrackUnlocked(track);
              const TrackIcon = getTrackIcon(track.id);
              const isExpanded = expandedTrack === track.id;

              return (
                <motion.div
                  key={track.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                >
                  <Card className={`
                    h-full overflow-hidden transition-all duration-300 bg-white
                    ${isUnlocked 
                      ? 'border-[#1a3884] shadow-lg' 
                      : 'border-gray-100 opacity-75'}
                  `}
                  style={{
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    boxShadow: isUnlocked ? '0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03)' : '0 10px 30px rgba(0,0,0,0.04)',
                    borderRadius: '24px',
                  }}>
                    <CardHeader 
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      onClick={() => isUnlocked ? setExpandedTrack(isExpanded ? null : track.id) : handleLockedTrackClick(track)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`
                          p-3 rounded-xl transition-all duration-300
                          ${isUnlocked 
                            ? 'bg-[#1a3884] text-white shadow-lg' 
                            : 'bg-gray-100 text-gray-400'}
                        `}>
                          <TrackIcon size={24} />
                        </div>
                        {isUnlocked ? (
                          <Badge className="bg-green-500 text-white border-green-400">
                            <Unlock className="w-3 h-3 mr-1" />
                            Unlocked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-gray-300 text-gray-500">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                      </div>
                      
                      <CardTitle className="text-xl text-[#112b6b] dark:text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                        {track.shortName}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-500">
                        {track.name}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <p className="text-sm text-gray-500 mb-4">
                        {track.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500">
                          {track.courses.filter(c => userProgress.completedCourses?.includes(c.id)).length} / {track.totalCourses} courses
                        </span>
                        <span className="text-xs text-gray-400">
                          Unlocks after: {track.unlockAfter}
                        </span>
                      </div>
                      
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${(track.courses.filter(c => userProgress.completedCourses?.includes(c.id)).length / track.totalCourses) * 100}%` 
                          }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-full rounded-full ${isUnlocked ? 'bg-[#1a3884]' : 'bg-gray-300'}`}
                        />
                      </div>

                      {isUnlocked && (
                        <Button 
                          className="w-full bg-[#1a3884] hover:bg-[#002147] text-white font-bold"
                          style={{
                            background: 'linear-gradient(135deg, #112b6b 0%, #1a3884 100%)',
                            boxShadow: '0 10px 24px rgba(17,43,107,0.25)',
                          }}
                          onClick={() => isUnlocked ? setExpandedTrack(isExpanded ? null : track.id) : handleLockedTrackClick(track)}
                        >
                          {isExpanded ? 'Hide Courses' : 'View Courses'}
                          <ChevronRight className={`w-4 h-4 ml-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </Button>
                      )}
                    </CardContent>

                    {/* Expanded Track Courses */}
                    {isExpanded && isUnlocked && (
                      <div className="border-t border-gray-100 p-4 space-y-3">
                        {track.courses.map((course, courseIdx) => {
                          const isCompleted = userProgress.completedCourses?.includes(course.id);
                          
                          return (
                            <div
                              key={course.id}
                              onClick={() => onCourseClick && onCourseClick(course.id)}
                              className={`
                                p-3 rounded-lg border transition-all cursor-pointer bg-white
                                ${isCompleted 
                                  ? 'border-green-200' 
                                  : 'border-gray-100 hover:border-[#1a3884]/30'}
                              `}
                              style={{
                                border: isCompleted ? '1px solid #bbf7d0' : '1px solid rgba(0,0,0,0.05)',
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`
                                  w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                                  ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}
                                `}>
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-3 h-3" />
                                  ) : (
                                    <span className="text-xs font-bold">{courseIdx + 1}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono text-gray-400">
                                      {course.id}
                                    </span>
                                  </div>
                                  <h4 className="font-semibold text-xs text-[#112b6b] dark:text-white">
                                    {course.title}
                                  </h4>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CourseStructure;
