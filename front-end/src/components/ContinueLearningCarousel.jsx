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
            className="relative"
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                        Continue Learning
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Pick up where you left off</p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => scrollCarousel('left')}
                        className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scrollCarousel('right')}
                        className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
                        aria-label="Next"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div
                ref={carouselRef}
                className="flex gap-6 overflow-x-auto pb-4 pt-1 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {courses.slice(0, 8).map((course, index) => {
                    const progress = getCourseProgress(course);
                    return (
                        <motion.div
                            key={course._id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onCourseClick && onCourseClick(course._id || course.id)}
                            className="group relative min-w-[280px] h-[200px] rounded-2xl overflow-hidden cursor-pointer flex-shrink-0 bg-white dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300"
                        >
                            {/* Image Background */}
                            <div className="absolute inset-0">
                                <img
                                    src={`https://images.unsplash.com/photo-${1516000000000 + index}?auto=format&fit=crop&q=80&w=800`}
                                    alt={course.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                            </div>

                            {/* Content */}
                            <div className="absolute inset-x-0 bottom-0 p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-medium text-slate-300 dark:text-slate-400">
                                        {course.modules?.length || 0} modules
                                    </span>
                                    <span className="text-slate-500 dark:text-slate-600">•</span>
                                    <span className="text-xs font-medium text-white">
                                        {progress || 0}% complete
                                    </span>
                                </div>
                                <h3 className="text-white font-semibold text-base mb-3 line-clamp-2 leading-snug">
                                    {course.title || "Untitled Course"}
                                </h3>
                                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress || 0}%` }}
                                        transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                                        className="h-full bg-white"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default ContinueLearningCarousel;


