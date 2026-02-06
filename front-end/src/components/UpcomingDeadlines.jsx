import { useState } from 'react';
import { Plus, CheckCircle2, Clock, Calendar, Trash2, AlertCircle, ListTodo } from 'lucide-react';import { motion, AnimatePresence } from 'framer-motion';

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

    const sortedTasks = [...pendingTasks].sort((a, b) => {        const dateA = a.date ? new Date(a.date) : new Date();
        const dateB = b.date ? new Date(b.date) : new Date();
        return dateA - dateB;
    });

    return (
        <div className="glass-card p-8 h-full flex flex-col rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#30919D]/10 flex items-center justify-center text-[#30919D]">
                        <ListTodo size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-[#002147] dark:text-white leading-none">Goals & Tasks</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {pendingTasks.length} PENDING
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="w-10 h-10 rounded-xl bg-[#30919D] text-white flex items-center justify-center shadow-lg shadow-[#30919D]/30 transition-all hover:scale-110 active:scale-95"
                >
                    <Plus className={`w-5 h-5 transition-transform duration-300 ${isAdding ? 'rotate-45' : ''}`} />                </button>
            </div>

            {/* Add Task Form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, height: 0 }}
                        animate={{ opacity: 1, scale: 1, height: 'auto' }}
                        exit={{ opacity: 0, scale: 0.95, height: 0 }}
                        className="mb-6 relative z-10"
                    >
                        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[#30919D]/5 border border-[#30919D]/10">
                            <input
                                type="text"
                                placeholder="What needs to be done?"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                className="w-full bg-transparent text-sm font-bold text-[#002147] dark:text-white placeholder:text-slate-400 focus:outline-none"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                                <button
                                    onClick={handleAdd}
                                    className="px-4 py-1.5 bg-[#30919D] text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-[#287a84] transition-all"
                                >
                                    Add Task
                                </button>
                            </div>                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar relative z-10">
                {sortedTasks.length === 0 && completedTasks.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-white/5">
                            <CheckCircle2 className="w-10 h-10 text-slate-200" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-500">All clear for today!</h4>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Enjoy your productive day</p>
                    </div>
                ) : (
                    <>
                        {sortedTasks.map((task, idx) => (
                            <motion.div
                                key={task._id || task.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="group flex gap-4 items-center p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-[#30919D]/30 transition-all shadow-sm hover:shadow-xl"
                            >
                                <button
                                    onClick={() => onToggleTask(task)}
                                    className="w-6 h-6 rounded-lg border-2 border-slate-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 transition-all hover:border-[#30919D] group-hover:bg-[#30919D]/5"
                                >
                                    <div className="w-2 h-2 rounded-sm bg-transparent group-hover:bg-[#30919D]/20 transition-all" />
                                </button>

                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-[#002147] dark:text-white leading-tight truncate">{task.title}</h4>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            <Clock size={12} className="text-[#30919D]" />
                                            {task.time || 'Schedule'}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            <Calendar size={12} className="text-[#30919D]" />
                                            {task.date ? new Date(task.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Today'}
                                        </div>                                    </div>
                                </div>

                                <button
                                    onClick={() => onDeleteTask(task._id || task.id)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </motion.div>
                        ))}

                        {completedTasks.length > 0 && (
                            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Completed</p>
                                <div className="space-y-3">
                                    {completedTasks.slice(0, 3).map(task => (
                                        <div key={task._id || task.id} className="flex gap-4 items-center p-3 opacity-60 grayscale hover:grayscale-0 transition-all">
                                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle2 size={14} />
                                            </div>
                                            <span className="text-sm font-bold text-slate-500 line-through decoration-slate-400 flex-1 truncate">{task.title}</span>
                                            <button
                                                onClick={() => onToggleTask(task)}
                                                className="text-[10px] font-black uppercase text-[#30919D] hover:underline"
                                            >
                                                Relist
                                            </button>                                        </div>
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
