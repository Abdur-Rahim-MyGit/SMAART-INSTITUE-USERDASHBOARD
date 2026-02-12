import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  ChevronLeft,
  ChevronRight,
  PlayCircle
} from "lucide-react";
import { coursesAPI } from "@/services/api";

const CoursePathway = ({ onCourseClick }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // --- Configuration ---
  const CARD_WIDTH = isMobile ? 280 : 320;
  const GAP_X = isMobile ? 120 : 280; 
  const NODE_X_SPACING = CARD_WIDTH + GAP_X; 
  const ROAD_Y = isMobile ? 240 : 280; 

  const STEPS_CONFIG = [
    { color: "#3B82F6", label: "01" },
    { color: "#06B6D4", label: "02" },
    { color: "#14B8A6", label: "03" },
    { color: "#8B5CF6", label: "04" },
    { color: "#F59E0B", label: "05" },
    { color: "#EC4899", label: "06" },
    { color: "#10B981", label: "07" },
  ];

  const getStepConfig = (index) => STEPS_CONFIG[index % STEPS_CONFIG.length];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const demoData = [
          { id: 1, title: "Introduction to User Experience", description: "Learn the fundamentals of UX design and user-centric thinking." },
          { id: 2, title: "Wireframing & Prototyping", description: "Master the art of creating low and high-fidelity prototypes." },
          { id: 3, title: "Visual Design Principles", description: "Explore color theory, typography, and layout hierarchies." },
          { id: 4, title: "Design Systems & Components", description: "Build scalable and consistent design systems for large teams." },
          { id: 5, title: "Usability Testing Methods", description: "Validate your decisions with real user testing sessions." },
          { id: 6, title: "Accessibility & Inclusion", description: "Ensure your designs are usable by everyone, everywhere." },
          { id: 7, title: "Final Capstone Project", description: "Apply all your skills in a comprehensive final portfolio project." },
        ];

        const response = await coursesAPI.getAll();
        const coursesData = response.data || response;
        const finalData = (Array.isArray(coursesData) && coursesData.length > 0) ? coursesData : demoData;
        setCourses(finalData);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll, { passive: true });
      checkScroll();
    }
    return () => container?.removeEventListener('scroll', checkScroll);
  }, [courses]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = NODE_X_SPACING; 
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const getPosition = (index) => ({
    x: (isMobile ? 180 : 400) + index * NODE_X_SPACING, 
    y: ROAD_Y
  });

  const generateRoadPath = () => {
    if (courses.length === 0) return "";
    const startX = getPosition(0).x - (isMobile ? 150 : 300);
    const endX = getPosition(courses.length - 1).x + (isMobile ? 250 : 500);
    return `M ${startX} ${ROAD_Y} L ${endX} ${ROAD_Y}`;
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium animate-pulse">Mapping your journey...</p>
    </div>
  );

  return (
    <div className="w-full relative select-none">
      {/* Header Section - Moved up with reduced margins */}
      <div className="w-full text-center mb-6 px-4 relative z-10">
        <div className="inline-block p-1.5 px-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide uppercase mb-2 text-center">
          Career Roadmap
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-3 text-center">
          Your Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Journey</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-base leading-relaxed text-center">
          Follow this curated path to master your skills. Complete each module to unlock the next step in your career.
        </p>
      </div>

      {/* Navigation Buttons - Adjusted to match new vertical position */}
      {!isMobile && (
        <>
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`fixed left-8 top-[55%] z-50 w-16 h-16 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700 transition-all duration-300 ${!canScrollLeft ? 'opacity-0 scale-90 cursor-default' : 'hover:scale-110 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700'}`}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`fixed right-8 top-[55%] z-50 w-16 h-16 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-slate-700 transition-all duration-300 ${!canScrollRight ? 'opacity-0 scale-90 cursor-default' : 'hover:scale-110 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700'}`}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Mobile Navigation Buttons */}
      {isMobile && (
        <div className="fixed bottom-6 left-0 right-0 z-[60] flex justify-center gap-6 px-4">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 ${!canScrollLeft ? 'opacity-30' : 'text-blue-600 dark:text-blue-400'}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-xl border border-slate-200 dark:border-slate-700 transition-all active:scale-95 text-blue-600 dark:text-blue-400"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Scrollable Container - Reduced height and padding */}
      <div
        ref={scrollContainerRef}
        className={`w-full ${isMobile ? 'h-[480px]' : 'h-[550px]'} overflow-x-auto overflow-y-hidden py-4 relative scrollbar-hide snap-x snap-mandatory perspective-1000`}
      >
        <div
          className="relative h-full"
          style={{ width: `${getPosition(courses.length - 1).x + 800}px` }}
        >
          {/* THE ROAD SVG */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            <defs>
              <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>

            {/* Main Road Surface */}
            <path
              d={generateRoadPath()}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="48"
              strokeLinecap="round"
              className="dark:stroke-slate-700 opacity-60"
            />
            
            {/* Center Dashed Line */}
            <path
              d={generateRoadPath()}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="20 30"
              className="opacity-40"
            />
          </svg>

          {/* Goal Marker */}
          <div
            className="absolute z-10 font-bold text-slate-700 dark:text-white flex flex-col items-center text-center pointer-events-none"
            style={{
              left: `${getPosition(courses.length - 1).x + (isMobile ? 180 : 350)}px`,
              top: `${ROAD_Y}px`,
              transform: 'translateY(-50%)',
              width: isMobile ? '140px' : '200px'
            }}
          >
            <div className="bg-gradient-to-r from-emerald-400 to-green-600 text-white text-[11px] font-bold px-5 py-2 rounded-full mb-3 shadow-lg animate-pulse tracking-widest ring-4 ring-white/50 uppercase">GOAL REACHED</div>
            <h3 className="text-base font-black leading-tight drop-shadow-sm bg-white/80 dark:bg-black/60 backdrop-blur-md px-4 py-3 rounded-2xl text-center border border-white/20">Ready to<br />Explore Jobs!</h3>
          </div>

          {/* CARDS */}
          {courses.map((course, index) => {
            const pos = getPosition(index);
            const config = getStepConfig(index);
            const isActive = index === 0;

            return (
              <div key={course.id || index} className="snap-center">
                {/* Visual Connector Dot on the Road */}
                <div 
                  className="absolute w-10 h-10 rounded-full bg-white dark:bg-slate-900 border-4 z-20 shadow-2xl flex items-center justify-center"
                  style={{ 
                    left: `${pos.x}px`, 
                    top: `${pos.y}px`, 
                    transform: 'translate(-50%, -50%)',
                    borderColor: config.color 
                  }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                </div>

                {/* Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="absolute"
                  style={{
                    left: `${pos.x - (CARD_WIDTH / 2)}px`,
                    top: `${pos.y - 240}px`, // Shifted higher to clear the dot
                    width: CARD_WIDTH,
                    zIndex: 50 // Increased z-index to stay on top
                  }}
                >
                    <div
                      onClick={() => {
                        if (isActive) {
                          onCourseClick(course._id || course.id);
                        }
                      }}
                      className={`relative group ${isActive ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                    >
                      <div className={`relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-800 border-2 ${isActive ? 'border-slate-100 dark:border-slate-700 hover:border-blue-500/40' : 'border-slate-200 dark:border-slate-800'} shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all duration-500 ${isActive ? 'group-hover:-translate-y-4' : ''}`}>
                        
                        {/* Header Color Strip */}
                        <div className="h-20 bg-gradient-to-br"
                          style={{
                            backgroundImage: isActive 
                              ? `linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%)`
                              : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                          }}
                        >
                          <div className="p-5 flex justify-between items-start">
                            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest opacity-90">
                              Module {config.label}
                            </div>
                            <div className="bg-white/95 p-2 rounded-full text-slate-700 shadow-md">
                              {isActive ? (
                                <PlayCircle size={16} className="text-blue-600" fill="currentColor" fillOpacity={0.2} />
                              ) : (
                                <Lock size={16} className="text-slate-400" />
                              )}
                            </div>
                          </div>
                        </div>

                      {/* Content */}
                      <div className="p-6">
                        {/* Number Badge */}
                        <div className="absolute top-12 right-6 w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-lg flex items-center justify-center border border-slate-50 dark:border-slate-800 transition-transform duration-500 group-hover:rotate-12">
                          <div className="font-black text-lg" style={{ color: config.color }}>
                            {index + 1}
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight mb-2 pr-14 line-clamp-2 min-h-[3rem]">
                          {course.title}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6 line-clamp-2 h-10">
                          {course.description}
                        </p>

                        <button className="w-full py-3 rounded-2xl bg-slate-50 dark:bg-slate-700/50 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-[0.2em] border border-blue-50/50 dark:border-blue-900/30 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm">
                          {isActive ? 'Start Course' : 'Locked'} <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CoursePathway;
