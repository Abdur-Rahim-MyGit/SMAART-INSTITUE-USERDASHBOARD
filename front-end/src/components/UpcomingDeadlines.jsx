import { useState } from 'react';
import { Plus, CheckCircle2, Clock, Calendar, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UpcomingDeadlines = ({ tasks, onAddTask, onToggleTask, onDeleteTask }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");

    const handleAdd = () => {
        if (!newTaskTitle.trim()) return;
        onAddTask(newTaskTitle);
        setNewTaskTitle("");
        setIsAdding(false);
    };

    const pendingTasks = tasks.filter(t => t.status !== "Completed");
    const completedTasks = tasks.filter(t => t.status === "Completed");

    // Sort: Overdue first, then today, then future
    const sortedTasks = [...pendingTasks].sort((a, b) => {
        // rudimentary sort, assuming date/time strings or dates
        const dateA = a.date ? new Date(a.date) : new Date();
        const dateB = b.date ? new Date(b.date) : new Date();
        return dateA - dateB;
    });

    return (
        <div className="lms-card p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#002147] dark:text-white">Upcoming Deadlines</h3>
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-bold">
                        {pendingTasks.length} Pending
                    </span>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="p-1 text-gray-400 hover:text-[#1a3884] transition-colors"
                >
                    <Plus className={`w-4 h-4 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
                </button>
            </div>

            {/* Add Task Form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="New task..."
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                className="flex-1 px-3 py-2 rounded-xl bg-[#F8FAFC] dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:border-[#1a3884] dark:text-white"
                                autoFocus
                            />
                            <button
                                onClick={handleAdd}
                                className="px-3 py-2 bg-[#1a3884] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#1a3884]/20 hover:bg-[#287a84]"
                            >
                                Add
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar max-h-[300px]">
                {sortedTasks.length === 0 && completedTasks.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-[#F8FAFC] dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-xs text-gray-400">No upcoming deadlines.</p>
                        <button onClick={() => setIsAdding(true)} className="text-xs text-[#1a3884] font-bold mt-2 hover:underline">Add a task</button>
                    </div>
                ) : (
                    <>
                        {sortedTasks.map(task => (
                            <div key={task._id || task.id} className="group flex gap-3 items-start p-3 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/5 transition-all">

                                {/* Checkbox */}
                                <button
                                    onClick={() => onToggleTask(task)}
                                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        task.status === "Completed" 
                                        ? 'bg-[#1a3884] border-[#1a3884] text-white' 
                                        : 'border-gray-300 dark:border-gray-600 hover:border-[#1a3884] hover:bg-[#1a3884]/10'
                                    }`}
                                >
                                    {task.status === "Completed" && <CheckCircle2 className="w-3 h-3" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-sm font-semibold text-[#002147] dark:text-white leading-tight mb-1 truncate">{task.title}</h4>
                                    </div>

                                    <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-slate-300">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {task.time || 'All Day'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {task.date ? new Date(task.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onDeleteTask(task._id || task.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        {/* Completed Tasks Accordion or List (Simplified) */}
                        {completedTasks.length > 0 && (
                            <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Completed</p>
                                <div className="space-y-2 opacity-60">
                                    {completedTasks.map(task => (
                                        <div key={task._id || task.id} className="flex gap-3 items-center p-2">
                                            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 className="w-3 h-3" />
                                            </div>
                                            <span className="text-xs text-gray-500 line-through decoration-gray-400 flex-1">{task.title}</span>
                                            <button onClick={() => onToggleTask(task)} className="text-[10px] text-gray-400 hover:text-[#1a3884] hover:underline">Undo</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default UpcomingDeadlines;

