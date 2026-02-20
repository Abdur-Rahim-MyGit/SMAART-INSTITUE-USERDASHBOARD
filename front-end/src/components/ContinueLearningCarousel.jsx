import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { coursesAPI } from "@/services/api";

const ContinueLearningCarousel = ({ onCourseClick }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("Learner");
    const carouselRef = useRef(null);

    useEffect(() => {
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (userData?.name) {
                setUserName(userData.name.split(' ')[0]);
            } else if (userData?.fullName) {
                setUserName(userData.fullName.split(' ')[0]);
            }
        } catch (e) {
            console.log('Error parsing user data');
        }
    }, []);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const response = await coursesAPI.getAll();
                const coursesData = response.data || response;
                setCourses(Array.isArray(coursesData) ? coursesData : []);
            } catch (err) {
                console.error('Error fetching courses:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const getCourseProgress = (course) => {
        if (!course.modules || course.modules.length === 0) return 0;
        const completed = course.modules.filter(m => m.status === 'completed').length;
        return Math.round((completed / course.modules.length) * 100);
    };

    const scrollCarousel = (direction) => {
        if (carouselRef.current) {
            const scrollAmount = 320;
            carouselRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-3 border-t-[#1a3884] border-r-transparent border-b-[#1a3884] border-l-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (courses.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lms-card p-6 relative overflow-hidden group"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-[#002147] dark:text-white">
                        Jump Back In <span className="text-[#1a3884] ml-2">Progress 🚀</span>
                    </h2>
                    <p className="text-xs text-gray-400 font-medium">Continue from where you left off</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => scrollCarousel('left')}
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-[#1a3884] hover:text-white flex items-center justify-center transition-all duration-300"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scrollCarousel('right')}
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-[#1a3884] hover:text-white flex items-center justify-center transition-all duration-300"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div
                ref={carouselRef}
                className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-hide px-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {courses.slice(0, 8).map((course, index) => {
                    const progress = getCourseProgress(course);
                    return (
                        <motion.div
                            key={course._id || index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => onCourseClick && onCourseClick(course._id || course.id)}
                            className="group relative min-w-[300px] h-[180px] rounded-3xl overflow-hidden cursor-pointer flex-shrink-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                        >
                            {/* Premium Thumbnail Background */}
                            <div className="absolute inset-0 bg-[#002147]">
                                <img
                                    src={`https://images.unsplash.com/photo-${1516000000000 + index}?auto=format&fit=crop&q=80&w=800`}
                                    alt={course.title}
                                    className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
                                />
                            </div>

                            {/* Dynamic Overlays */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#00152E] via-black/20 to-transparent" />
                            <div className="absolute inset-0 bg-[#1a3884]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Bottom Info Section */}
                            <div className="absolute inset-x-0 bottom-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                                <span className="inline-block px-2 py-0.5 rounded-lg bg-white/10 backdrop-blur-md text-[#1a3884] text-[9px] font-black uppercase tracking-widest mb-2 border border-white/10">
                                    COURSE
                                </span>
                                <h3 className="text-white font-black text-lg mb-2 line-clamp-1 group-hover:text-[#1a3884] transition-colors">
                                    {course.title || "Untitled Milestone"}
                                </h3>

                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-white/60 text-xs font-bold">
                                        {course.modules?.length || 0} Modules
                                    </p>
                                    <span className="text-white font-black text-xs">{progress || 45}%</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress || 45}%` }}
                                        transition={{ delay: 0.5, duration: 1, ease: "circOut" }}
                                        className="h-full rounded-full bg-gradient-to-r from-[#1a3884] to-[#2a4d9e]"
                                    />
                                </div>
                            </div>

                            {/* Floating Play Indicator */}
                            <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100">
                                <Play className="w-5 h-5 text-white fill-white" />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default ContinueLearningCarousel;


