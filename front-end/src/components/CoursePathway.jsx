import { useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
import { toast } from "sonner";
import {
  Lock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle2,
  PlayCircle
} from "lucide-react";
import { coursesAPI } from "@/services/api";

const CoursePathway = ({ onCourseClick }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const scrollContainerRef = useRef(null);

  // --- Configuration ---
  const STEPS_CONFIG = [
    { color: "#3B82F6", label: "01" }, // Blue
    { color: "#06B6D4", label: "02" }, // Cyan
    { color: "#14B8A6", label: "03" }, // Teal
    { color: "#8B5CF6", label: "04" }, // Violet
    { color: "#F59E0B", label: "05" }, // Amber
    { color: "#EC4899", label: "06" }, // Pink
    { color: "#10B981", label: "07" }, // Emerald
  ];

  const getStepConfig = (index) => STEPS_CONFIG[index % STEPS_CONFIG.length];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        // Fallback demo data if API fails or is empty for design purposes
        const demoData = [
          { id: 1, title: "Introduction to User Experience", modules: [1, 2, 3, 4], description: "Learn the fundamentals of UX design and user-centric thinking." },
          { id: 2, title: "Wireframing & Prototyping", modules: [1, 2, 3], description: "Master the art of creating low and high-fidelity prototypes." },
          { id: 3, title: "Visual Design Principles", modules: [1, 2, 3, 4, 5], description: "Explore color theory, typography, and layout hierarchies." },
          { id: 4, title: "Design Systems & Components", modules: [1, 2], description: "Build scalable and consistent design systems for large teams." },
          { id: 5, title: "Usability Testing Methods", modules: [1, 2, 3], description: "Validate your decisions with real user testing sessions." },
          { id: 6, title: "Accessibility & Inclusion", modules: [1, 2, 3, 4], description: "Ensure your designs are usable by everyone, everywhere." },
          { id: 7, title: "Final Capstone Project", modules: [], description: "Apply all your skills in a comprehensive final portfolio project." },
        ];

        const response = await coursesAPI.getAll();
        const coursesData = response.data || response;
        const finalData = (Array.isArray(coursesData) && coursesData.length > 0) ? coursesData : demoData;
        setCourses(finalData);
      } catch (err) {
        console.error('Error fetching courses:', err);
        // Fallback to demo data on error for robust UI
        const demoData = [
          { id: 1, title: "Introduction to User Experience", modules: [1, 2, 3, 4], description: "Learn the fundamentals of UX design and user-centric thinking." },
          { id: 2, title: "Wireframing & Prototyping", modules: [1, 2, 3], description: "Master the art of creating low and high-fidelity prototypes." },
          { id: 3, title: "Visual Design Principles", modules: [1, 2, 3, 4, 5], description: "Explore color theory, typography, and layout hierarchies." },
          { id: 4, title: "Design Systems & Components", modules: [1, 2], description: "Build scalable and consistent design systems for large teams." },
        ];
        setCourses(demoData);
        // setError('Failed to load courses'); // Suppress error for demo
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
      container.addEventListener('scroll', checkScroll);
      checkScroll();
    }
    return () => container?.removeEventListener('scroll', checkScroll);
  }, [courses]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = 400;
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  // --- Road Layout Calculation ---
  // We want a sine-wave road.
  // We define "Nodes" on the road.
  const CARD_WIDTH = 300; // Wider cards for better content fit
  const GAP_X = 50; // Tighter spacing
  const NODE_X_SPACING = CARD_WIDTH + GAP_X;

  // Vertical oscillation
  const AMPLITUDE = 90; // Much flatter wave to keep cards visible
  const BASELINE_Y = 300; // Lifted baseline

  const getRoadPoint = (index) => {
    // Start x at 250 to prevent overlap with start marker
    const x = 250 + (index * NODE_X_SPACING);
    const y = index % 2 === 0 ? BASELINE_Y - AMPLITUDE : BASELINE_Y + AMPLITUDE;

    if (isMobile) {
      return {
        x: window.innerWidth / 2,
        y: 150 + (index * 380) // More vertical space on mobile
      };
    }

    return { x, y };
  };

  // Generate SVG Path for the Road
  const generateRoadPath = () => {
    if (courses.length === 0) return "";

    let path = `M ${getRoadPoint(0).x - 200} ${getRoadPoint(0).y}`;

    if (isMobile) {
      for (let i = 0; i < courses.length - 1; i++) {
        const p1 = getRoadPoint(i);
        const p2 = getRoadPoint(i + 1);
        const midY = (p1.y + p2.y) / 2;
        const cp1x = i % 2 === 0 ? p1.x + 80 : p1.x - 80;
        const cp2x = i % 2 === 0 ? p2.x + 80 : p2.x - 80;
        path += ` C ${cp1x + 20} ${midY}, ${cp2x} ${midY}, ${p2.x} ${p2.y}`;
      }
    } else {
      // Connect initial point
      const p0 = getRoadPoint(0);
      path += ` L ${p0.x} ${p0.y}`;

      for (let i = 0; i < courses.length - 1; i++) {
        const p1 = getRoadPoint(i);
        const p2 = getRoadPoint(i + 1);
        const midX = (p1.x + p2.x) / 2;
        path += ` C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
      }
    }

    if (!isMobile) {
      const lastP = getRoadPoint(courses.length - 1);
      path += ` L ${lastP.x + 250} ${lastP.y}`;
    }

    return path;
  };

  const roadPath = generateRoadPath();

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium animate-pulse">Mapping your journey...</p>
    </div>
  );

  return (
    <div className="w-full relative select-none">

      {/* Header Section - Now Relative to avoid overlap */}
      <div className="w-full text-center mb-12 px-4 relative z-10">
        <div className="inline-block p-2 px-6 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-bold tracking-wide uppercase mb-3">
          Career Roadmap
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-4">
          Your Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Journey</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
          Follow this curated path to master your skills. Complete each module to unlock the next step in your career.
        </p>
      </div>

      {/* Navigation Buttons */}
      {!isMobile && (
        <>
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`absolute left-4 top-[55%] z-40 w-14 h-14 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-700 transition-all duration-300 ${!canScrollLeft ? 'opacity-0 scale-90 cursor-default' : 'hover:scale-110 hover:shadow-blue-500/20 text-slate-700 dark:text-slate-200'}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`absolute right-4 top-[55%] z-40 w-14 h-14 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-700 transition-all duration-300 ${!canScrollRight ? 'opacity-0 scale-90 cursor-default' : 'hover:scale-110 hover:shadow-blue-500/20 text-slate-700 dark:text-slate-200'}`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-x-auto overflow-y-hidden py-10 relative scrollbar-hide perspective-1000"
        style={{ height: isMobile ? 'auto' : '900px' }} // Increased height for desktop
      >
        <div
          className="relative mx-auto"
          style={{
            width: isMobile ? '100%' : `${courses.length * NODE_X_SPACING + 600}px`, // More width padding
            height: isMobile ? `${courses.length * 380 + 500}px` : '100%'
          }}
        >
          {/* THE ROAD SVG */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
            <defs>
              <filter id="road-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="15" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>

            {/* Road Wrapper for Glow */}
            <path
              d={roadPath}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth={isMobile ? "50" : "70"} // Thinner road
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-20 dark:opacity-10"
            />

            {/* Main Road Surface */}
            <path
              d={roadPath}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={isMobile ? "38" : "56"}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dark:stroke-slate-700"
            />

            {/* Road Borders */}
            <path
              d={roadPath}
              fill="none"
              stroke="url(#roadGradient)"
              strokeWidth={isMobile ? "42" : "60"}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-10"
              strokeDasharray="10 10"
            />

            {/* Center Dashed Line */}
            <path
              d={roadPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="20 30"
              className="opacity-50"
            />
          </svg>

          {/* START MARKER */}
          {/* START MARKER REMOVED */}

          {/* END MARKER */}
          <div
            className="absolute z-10 font-bold text-slate-700 dark:text-white flex flex-col items-center text-center pointer-events-none"
            style={{
              left: isMobile ? '50%' : `${getRoadPoint(courses.length - 1).x + 120}px`,
              top: isMobile ? '100%' : `${getRoadPoint(courses.length - 1).y - 20}px`,
              transform: isMobile ? 'translateX(-50%)' : 'translateY(-50%)',
              width: '160px'
            }}
          >
            <div className="bg-gradient-to-r from-emerald-400 to-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-2 shadow-lg animate-pulse tracking-wide ring-2 ring-white/50">GOAL REACHED</div>
            <h3 className="text-sm font-extrabold leading-tight drop-shadow-sm bg-white/50 dark:bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">Ready to<br />Explore Jobs!</h3>
          </div>

          {/* CARDS */}
          {courses.map((course, index) => {
            const point = getRoadPoint(index);
            const config = getStepConfig(index);
            const isEven = index % 2 === 0;
            const isActive = true;

            // Adjusted Offsets for better clearance
            const cardYOffset = isEven ? -200 : 120;
            const cardXOffset = -CARD_WIDTH / 2;
            const finalCardX = isMobile ? (window.innerWidth / 2 - CARD_WIDTH / 2) : point.x + cardXOffset;
            const finalCardY = isMobile ? point.y + cardYOffset : point.y + cardYOffset;

            // eslint-disable-next-line no-unused-vars
            const mobileCardX = isEven ? 20 : window.innerWidth - CARD_WIDTH - 20;
            const mobileY = isMobile ? point.y - 60 : finalCardY;

            return (
              <motion.div
                key={course.id || index}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="absolute"
                style={{
                  left: finalCardX,
                  top: mobileY,
                  width: CARD_WIDTH,
                  zIndex: 20
                }}
              >
                <div
                  onClick={() => onCourseClick(course._id || course.id)}
                  className={`relative group perspective-1000 cursor-pointer`}
                >
                  {/* REDESIGNED CARD */}
                  <div className={`
                    relative overflow-hidden rounded-2xl
                    bg-white dark:bg-[#1e293b]
                    border-2 border-slate-200 dark:border-slate-700 shadow-xl shadow-blue-500/5 hover:border-blue-500/30
                    transition-all duration-300
                    group-hover:-translate-y-1
                  `}>

                    {/* Header Color Strip with Status */}
                    <div className="h-24 bg-gradient-to-br"
                      style={{
                        backgroundImage: isActive
                          ? `linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%)`
                          : 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'
                      }}
                    >
                      <div className="p-4 flex justify-between items-start">
                        <div className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-white text-[10px] font-bold uppercase tracking-wider">
                          Course {config.label}
                        </div>
                        <div className="bg-white/90 p-1.5 rounded-full text-slate-700 shadow-sm">
                          {isActive ? <PlayCircle size={16} className="text-blue-600" fill="currentColor" fillOpacity={0.2} /> : <Lock size={16} />}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Floating Icon/Badge - overlapping header */}
                      <div className="absolute top-16 right-5 w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <div className="font-black text-lg" style={{ color: isActive ? config.color : '#94a3b8' }}>
                          {index + 1}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight mb-2 pr-12 line-clamp-2 min-h-[3rem]">
                        {course.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4 line-clamp-2 h-8">
                        {course.description}
                      </p>

                      {/* Action Footer */}
                      {isActive ? (
                        <button className="w-full py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wide border border-blue-100 dark:border-blue-900 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center gap-2">
                          Start Learning <ChevronRight size={12} />
                        </button>
                      ) : (
                        <div className="w-full py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-wide border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2">
                          <Lock size={12} /> Locked
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Connecting Pole */}
                  <div className="absolute w-[2px] bg-gradient-to-b from-slate-300 to-transparent dark:from-slate-600 z-[-1]"
                    style={{
                      height: '100px',
                      left: '50%',
                      top: isEven ? '100%' : 'auto',
                      bottom: isEven ? 'auto' : '100%',
                      opacity: 0.6
                    }}
                  />
                  {/* Pole Base Dot */}
                  <div className="absolute w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 z-[-1]"
                    style={{
                      left: 'calc(50% - 5px)',
                      top: isEven ? 'calc(100% + 98px)' : 'auto',
                      bottom: isEven ? 'auto' : 'calc(100% + 98px)',
                    }}
                  />
                </div>
              </motion.div>
            );
          })}

          {/* Road Markers (The Dots on the road) */}
          {courses.map((_, index) => {
            const point = getRoadPoint(index);
            const config = getStepConfig(index);
            return (
              <motion.div
                key={`marker-${index}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + (index * 0.1) }}
                className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-white dark:bg-[#1e293b] border-4 shadow-lg z-20 flex items-center justify-center"
                style={{ left: point.x, top: point.y, borderColor: config.color }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
              </motion.div>
            )
          })}

        </div>
      </div>
    </div>
  );
};

export default CoursePathway;
