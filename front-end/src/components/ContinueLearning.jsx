import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    Flame,
    BookOpen,
    Target,
    CheckCircle2,
    Circle,
    AlertCircle
} from "lucide-react";
import { coursesAPI } from "@/services/api";

const ContinueLearning = ({ onCourseClick }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeFilter, setActiveFilter] = useState("all");
    const [userName, setUserName] = useState("Learner");
    const carouselRef = useRef(null);

    // Get user data from localStorage
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

    // Generate week dates
    const getWeekDates = () => {
        const today = new Date();
        const dates = [];
        for (let i = -2; i <= 5; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const weekDates = getWeekDates();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

    // Calculate course progress
    const getCourseProgress = (course) => {
        if (!course.modules || course.modules.length === 0) return 0;
        const completed = course.modules.filter(m => m.status === 'completed').length;
        return Math.round((completed / course.modules.length) * 100);
    };

    // Get in-progress courses
    const inProgressCourses = courses.filter(course => {
        const progress = getCourseProgress(course);
        return progress > 0 && progress < 100;
    });

    // Mock tasks data (would come from API in production)
    const tasks = [
        { id: 1, time: "11", period: "AM", title: "Add New Tasks", type: "add", status: null },
        { id: 2, time: "10", period: "PM", title: "Complete Marketing Presentation", status: "completed", progress: 80 },
        { id: 3, time: "2", period: "PM", title: "Finance Discussions", status: "submitted", progress: 40 },
        { id: 4, time: "3:30", period: "PM", title: "ERP in Businesses", status: "incomplete", progress: 20 },
    ];

    const filters = [
        { id: "all", label: "All tasks" },
        { id: "todo", label: "To Do" },
        { id: "completed", label: "Completed" },
        { id: "progress", label: "In Progress" },
    ];

    const scrollCarousel = (direction) => {
        if (carouselRef.current) {
            const scrollAmount = 320;
            carouselRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'completed':
                return { bg: 'bg-emerald-500', text: 'COMPLETED', icon: CheckCircle2 };
            case 'submitted':
                return { bg: 'bg-amber-500', text: 'SUBMITTED', icon: Circle };
            case 'incomplete':
                return { bg: 'bg-orange-500', text: 'INCOMPLETE', icon: AlertCircle };
            default:
                return null;
        }
    };

    // Quick stats
    const stats = [
        { icon: Flame, value: "7", label: "Day Streak", color: "#FF6B6B" },
        { icon: Clock, value: "12.5", label: "Hours This Week", color: "#30919D" },
        { icon: BookOpen, value: inProgressCourses.length || 3, label: "In Progress", color: "#daa520" },
        { icon: Target, value: "85%", label: "Completion Rate", color: "#002147" },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-t-[#30919D] border-r-transparent border-b-[#30919D] border-l-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 mb-8">
            {/* Quick Stats Bar */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all"
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${stat.color}15` }}
                        >
                            <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#002147]">{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tasks Panel - 2 columns */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                >
                    <div className="flex items-start justify-between mb-6">
                        <h2 className="text-xl font-bold text-[#002147]">Tasks</h2>
                        <div className="flex items-center gap-2">
                            <button className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                                <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    {/* Calendar Week View */}
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                        {weekDates.map((date, index) => {
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isSelected = date.toDateString() === selectedDate.toDateString();
                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedDate(date)}
                                    className={`
                    flex flex-col items-center min-w-[50px] px-3 py-2 rounded-xl transition-all
                    ${isSelected
                                            ? 'bg-[#30919D] text-white shadow-lg shadow-[#30919D]/30'
                                            : isToday
                                                ? 'bg-[#30919D]/10 text-[#30919D]'
                                                : 'hover:bg-gray-50 text-gray-600'
                                        }
                  `}
                                >
                                    <span className="text-[10px] font-medium uppercase">{dayNames[date.getDay()]}</span>
                                    <span className="text-lg font-bold">{date.getDate()}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto">
                        {filters.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`
                  px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap
                  ${activeFilter === filter.id
                                        ? 'bg-[#002147] text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }
                `}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* Tasks List */}
                    <div className="space-y-3">
                        {tasks.map((task, index) => {
                            const statusConfig = getStatusConfig(task.status);
                            return (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                    className={`
                    flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed transition-all
                    ${task.type === 'add'
                                            ? 'border-[#30919D]/30 hover:border-[#30919D] cursor-pointer hover:bg-[#30919D]/5'
                                            : 'border-gray-100 bg-white hover:shadow-md'
                                        }
                  `}
                                >
                                    {/* Time */}
                                    <div className="text-center min-w-[40px]">
                                        <p className="text-[10px] text-gray-400">{task.period}</p>
                                        <p className="text-lg font-bold text-gray-700">{task.time}</p>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-[#002147]">{task.title}</h4>
                                        {statusConfig && (
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className={`${statusConfig.bg} text-white text-[10px] font-bold px-2 py-1 rounded`}>
                                                    {statusConfig.text}
                                                </span>
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[150px]">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${task.progress}%`,
                                                            backgroundColor: '#30919D'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action/Avatars */}
                                    {task.type === 'add' ? (
                                        <Plus className="w-5 h-5 text-[#30919D]" />
                                    ) : (
                                        <div className="flex -space-x-2">
                                            {['A', 'B', 'C'].map((letter, i) => (
                                                <div
                                                    key={i}
                                                    className="w-8 h-8 rounded-full bg-[#002147] text-white text-xs font-bold flex items-center justify-center border-2 border-white"
                                                >
                                                    {letter}
                                                </div>
                                            ))}
                                            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-[10px] font-medium flex items-center justify-center border-2 border-white">
                                                +2
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Assessments Widget */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center"
                >
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-4 border-dashed border-[#30919D]/30 flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#30919D] to-[#002147] flex items-center justify-center shadow-xl">
                                <div className="text-center text-white">
                                    <CheckCircle2 className="w-8 h-8 mx-auto mb-1" />
                                    <p className="text-[10px] font-medium">Assessments</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#daa520] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            3
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-600 text-center">Pending assessments</p>
                    <button className="mt-4 px-6 py-2 bg-[#002147] text-white rounded-full text-sm font-medium hover:bg-[#002147]/90 transition-all">
                        View All
                    </button>
                </motion.div>
            </div>

            {/* Continue Learning Carousel */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#0B1120] rounded-3xl p-6 relative overflow-hidden"
            >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120] via-transparent to-[#0B1120] pointer-events-none z-10" />

                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">
                        Continue Learning for <span className="text-[#30919D]">{userName}</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => scrollCarousel('left')}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                        >
                            <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <button
                            onClick={() => scrollCarousel('right')}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                        >
                            <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Courses Carousel */}
                <div
                    ref={carouselRef}
                    className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {(inProgressCourses.length > 0 ? inProgressCourses : courses.slice(0, 5)).map((course, index) => {
                        const progress = getCourseProgress(course);
                        return (
                            <motion.div
                                key={course._id || index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                onClick={() => onCourseClick && onCourseClick(course._id || course.id)}
                                className="group relative min-w-[280px] h-[160px] rounded-xl overflow-hidden cursor-pointer flex-shrink-0"
                            >
                                {/* Thumbnail Background */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-br from-[#002147] via-[#30919D] to-[#daa520] transition-transform duration-500 group-hover:scale-110"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                                {/* Play Button */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                        <Play className="w-6 h-6 text-[#002147] ml-1" fill="#002147" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="text-white font-bold text-sm mb-1 line-clamp-2">
                                        {course.title || "Course Title"}
                                    </h3>
                                    <p className="text-white/60 text-xs mb-3">
                                        {course.modules?.length || 0} modules • {progress}% complete
                                    </p>

                                    {/* Progress Bar */}
                                    <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress || 30}%` }}
                                            transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
                                            className="h-full rounded-full"
                                            style={{
                                                background: 'linear-gradient(90deg, #30919D, #daa520)'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Progress Badge */}
                                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                                    <span className="text-white text-[10px] font-bold">{progress || 30}%</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
};

export default ContinueLearning;
