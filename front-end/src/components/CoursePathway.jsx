import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  ChevronRight,
  PlayCircle
} from "lucide-react";
import { coursesAPI } from "@/services/api";

const CoursePathway = ({ onCourseClick }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  // --- Configuration ---
  const STEPS_CONFIG = [
    { color: "#3B82F6", label: "01" }, // Blue
    { color: "#14B8A6", label: "02" }, // Teal
    { color: "#06B6D4", label: "03" }, // Cyan
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
        // Fallback demo data
        const demoData = [
          { id: 1, title: "Capacity", modules: [1, 2, 3], description: "Build your fundamental capacity to learn and grow." },
          { id: 2, title: "Capability", modules: [1, 2, 3], description: "Develop specific capabilities required for your role." },
          { id: 3, title: "Leadership", modules: [1, 2, 3], description: "Step into leadership with confidence and vision." },
          { id: 4, title: "Innovation", modules: [1, 2], description: "Master the art of creative problem solving." },
          { id: 5, title: "Strategy", modules: [1, 2, 3], description: "Learn to think strategically and plan for the long term." },
        ];

        const response = await coursesAPI.getAll();
        const coursesData = response.data || response;
        const finalData = (Array.isArray(coursesData) && coursesData.length > 0) ? coursesData : demoData;

        // Ensure we have enough vertical space mapping
        setCourses(finalData);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // --- Vertical Road Layout Calculation ---
  const CARD_HEIGHT = 200;
  const VERTICAL_SPACING = 450; // Distance between nodes vertically
  const AMPLITUDE = 160; // Increased curve width for more dynamic look
  const CENTER_X = "50%"; // Center of the container

  // Generate the winding vertical path
  const generateVerticalPath = () => {
    if (courses.length === 0) return "";
    const baseX = 400; // Conceptual center width for path calc

    let path = `M ${baseX} 0`; // Start Point (Top of container)
    path += ` L ${baseX} 100`; // Initial straight drop

    for (let i = 0; i < courses.length; i++) {
      const isLeft = i % 2 === 0;
      const startY = 100 + (i * VERTICAL_SPACING);
      const nextY = startY + VERTICAL_SPACING;

      // Control points for a smoother, wider S-wave
      // We pull the curve out more to the side (AMPLITUDE)
      const cpY1 = startY + (VERTICAL_SPACING * 0.5);
      const cpY2 = nextY - (VERTICAL_SPACING * 0.5);

      // Alternating sway
      const sway = isLeft ? -AMPLITUDE : AMPLITUDE;

      // Curve: Start -> Control1 -> Control2 -> End
      // We actually want the road to pass through the specific node points if possible, 
      // OR we just wiggle the road and hang the cards off it. 
      // Let's stick to the road WIGGLING and cards being attached.

      // To make the road look like it swings left/right:
      // C cp1x cp1y, cp2x cp2y, x y

      path += ` C ${baseX + sway} ${cpY1}, ${baseX + sway} ${cpY2}, ${baseX} ${nextY}`;
    }

    // Final drop
    path += ` L ${baseX} ${100 + (courses.length * VERTICAL_SPACING) + 200}`;

    return path;
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium animate-pulse text-lg">Charting your course...</p>
    </div>
  );

  const totalHeight = (courses.length * VERTICAL_SPACING) + 500;

  return (
    <div className="w-full relative px-4 md:px-0 overflow-hidden perspective-1000" ref={containerRef}>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[20%] left-[15%] w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <div className="w-full text-center mb-24 pt-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-white/10 border border-blue-100 dark:border-white/10 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm backdrop-blur-sm">
            Exploration Map
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-4 drop-shadow-sm">
            Your Learning <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 animate-gradient">Odyssey</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Follow the path to unlock your full potential. Each step brings you closer to mastery.
          </p>
        </motion.div>
      </div>

      <div className="relative mx-auto max-w-5xl" style={{ height: `${totalHeight}px` }}>

        {/* THE ROAD SVG */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-full pointer-events-none z-0">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="roadGradientVertical" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* The Outer Path Glow */}
            <path
              d={generateVerticalPath()}
              fill="none"
              stroke="#60A5FA" // Light Blue Glow
              strokeWidth="60"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-20 blur-xl"
            />

            {/* The Main Path Base */}
            <path
              d={generateVerticalPath()}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="50"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="dark:stroke-slate-800"
            />

            {/* Path Borders */}
            <path
              d={generateVerticalPath()}
              fill="none"
              stroke="#94a3b8" // Border color
              strokeWidth="52"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-20"
            />

            {/* Animated Dashed Center Line */}
            <path
              d={generateVerticalPath()}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="15 25"
              className="opacity-60 animate-dash-flow" // Custom class for animation needed or inline styling
              style={{
                strokeDashoffset: 0,
                animation: "dashFlow 3s linear infinite"
              }}
            />
          </svg>

          {/* Define keyframes locally if needed or assume global CSS */}
          <style>{`
            @keyframes dashFlow {
                to { stroke-dashoffset: -40; }
            }
         `}</style>
        </div>

        {/* Course Cards */}
        {courses.map((course, index) => {
          const config = getStepConfig(index);
          const isLeft = index % 2 === 0; // Alternate Left/Right
          const topPos = 100 + (index * VERTICAL_SPACING);

          return (
            <motion.div
              key={course.id || index}
              initial={{ opacity: 0, x: isLeft ? -80 : 80, scale: 0.9, rotateY: isLeft ? 10 : -10 }}
              whileInView={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 50, damping: 20, delay: 0.1 }}
              className="absolute w-full flex justify-center"
              style={{ top: `${topPos}px` }}
            >
              <div className={`relative w-full flex ${isLeft ? 'justify-start md:justify-end' : 'justify-end md:justify-start'} md:px-32`}>

                {/* Center Node on Road */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 group">
                  <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 z-10 relative transition-transform duration-500 group-hover:scale-150" style={{ borderColor: config.color }}></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 opacity-50 animate-ping" style={{ borderColor: config.color }}></div>
                  {/* Pulse effect background */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/50 dark:bg-white/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                {/* Connector Line - Animated Gradient */}
                <div className={`absolute top-1/2 h-[2px] z-0 hidden md:block
                        ${isLeft ? 'right-1/2 mr-3' : 'left-1/2 ml-3'}
                   `}
                  style={{
                    width: '140px',
                    background: `linear-gradient(${isLeft ? 'to left' : 'to right'}, ${config.color}, transparent)`
                  }}>
                </div>

                {/* THE CARD */}
                <div
                  onClick={() => onCourseClick(course._id || course.id)}
                  className={`
                       relative w-[340px] z-30 cursor-pointer group perspective-1000
                       ${isLeft ? 'md:mr-44' : 'md:ml-44'}
                       mx-auto md:mx-0
                     `}
                >
                  {/* Glow behind card */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 -z-10 transform translate-y-4"></div>

                  {/* Main Card */}
                  <div className="bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/50 dark:border-white/10 overflow-hidden transform transition-all duration-300 group-hover:-translate-y-3 group-hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)]">

                    {/* Header Image/Color Area */}
                    <div className="h-24 relative overflow-hidden">
                      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`, opacity: 0.9 }}>
                      </div>

                      {/* Texture Overlay */}
                      <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)', backgroundSize: '12px 12px' }}>
                      </div>

                      <div className="absolute top-0 right-0 p-4">
                        <div className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white shadow-sm border border-white/20">
                          <PlayCircle size={20} fill="currentColor" fillOpacity={0.4} />
                        </div>
                      </div>

                      <div className="absolute bottom-3 left-6">
                        <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest border border-white/10">
                          Module {String(index + 1).padStart(2, '0')}
                        </div>
                      </div>
                    </div>

                    {/* Body content */}
                    <div className="px-7 pb-7 pt-10 relative">

                      {/* Floating Number Badge */}
                      <div className="absolute -top-8 right-8 w-14 h-14 bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl flex items-center justify-center text-2xl font-black border-4 border-slate-50 dark:border-slate-800 z-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 transform"
                        style={{ color: config.color }}>
                        {index + 1}
                      </div>

                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-violet-600 transition-all duration-300">{course.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-8 h-[2.5em] leading-relaxed">{course.description}</p>

                      {/* Enhanced Button */}
                      <div className="relative group/btn overflow-hidden rounded-xl">
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-violet-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        <button className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider relative z-10 group-hover/btn:text-white group-hover/btn:border-transparent transition-colors flex items-center justify-center gap-2">
                          Start Learning <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          );
        })}

        {/* Final Goal Node - Enhanced */}
        <div className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center text-center w-64"
          style={{ top: `${(courses.length * VERTICAL_SPACING) + 250}px` }}>
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring' }}
          >
            <div className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 shadow-lg shadow-emerald-500/30 animate-pulse tracking-wide uppercase">
              Certification Milestone
            </div>
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
              <div className="relative w-full h-full rounded-full bg-white dark:bg-[#001229] border-[6px] border-emerald-500 shadow-2xl flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent"></div>
                <div className="w-8 h-8 rounded-full bg-emerald-500 animate-bounce shadow-inner"></div>
              </div>
            </div>
            <div className="mt-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
              <h4 className="font-black text-lg text-slate-800 dark:text-white mb-1">Career Ready!</h4>
              <p className="text-xs text-slate-500 font-medium">Unlock Job portal & Certifications</p>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default CoursePathway;
