import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    Edit3,
    Save,
    X,
    Calendar as CalendarIcon,
    Clock,
    Sparkles,
    ArrowLeft,
    ListTodo,
    CheckSquare,
    Square,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notesAPI, todosAPI } from "@/services/api";

const TodoTracker = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Notes States (for Calendar Sync indicators)
    const [notes, setNotes] = useState([]);

    // Todos States
    const [todos, setTodos] = useState([]);
    const [todoTitle, setTodoTitle] = useState("");
    const [todoDueDate, setTodoDueDate] = useState("");
    const [todoFilter, setTodoFilter] = useState("all"); // 'all' | 'active' | 'completed'
    const [todosLoading, setTodosLoading] = useState(true);
    const [editingTodoId, setEditingTodoId] = useState(null);
    const [editTodoTitle, setEditTodoTitle] = useState("");
    const [editTodoDueDate, setEditTodoDueDate] = useState("");

    // Calendar States
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [user, setUser] = useState(null);

    useEffect(() => {
        const userData = sessionStorage.getItem("user");
        if (userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            loadTodos();
            loadNotes();
        }
    }, []);

    // Load Notes for Calendar Dot Indicators
    const loadNotes = async () => {
        try {
            const response = await notesAPI.getAll();
            if (response.success && response.data) {
                setNotes(response.data);
            }
        } catch (error) {
            console.error("Error loading notes for calendar:", error);
        }
    };

    // ==========================================
    // TODOS (TASK TRACKER) LOGIC
    // ==========================================
    const loadTodos = async () => {
        setTodosLoading(true);
        try {
            const res = await todosAPI.getAll();
            if (res.success && res.data) {
                setTodos(res.data);
            }
        } catch (err) {
            console.error("Error loading todos:", err);
        } finally {
            setTodosLoading(false);
        }
    };

    const handleCreateTodo = async (e) => {
        e.preventDefault();
        if (!todoTitle.trim()) {
            toast({ title: "Empty Task", description: "Please enter a task title.", variant: "destructive" });
            return;
        }
        if (!todoDueDate) {
            toast({ title: "No Due Date", description: "Please select a due date for the task.", variant: "destructive" });
            return;
        }

        try {
            const res = await todosAPI.create(todoTitle, todoDueDate);
            if (res.success) {
                toast({ title: "Task Added", description: `"${todoTitle}" has been scheduled successfully.` });
                setTodoTitle("");
                setTodoDueDate("");
                loadTodos();
            }
        } catch (err) {
            console.error("Failed to create todo:", err);
            toast({ title: "Error", description: "Could not schedule task.", variant: "destructive" });
        }
    };

    const handleToggleTodo = async (id, completed) => {
        try {
            const res = await todosAPI.update(id, { completed: !completed });
            if (res.success) {
                setTodos(todos.map(t => t._id === id ? { ...t, completed: !completed } : t));
                toast({ 
                    title: completed ? "Task Reactivated" : "Task Completed 🎉", 
                    description: completed ? "Task marked as active." : "Congratulations on finishing your task!" 
                });
            }
        } catch (err) {
            console.error("Failed to toggle todo:", err);
        }
    };

    const handleEditTodoSave = async (id) => {
        if (!editTodoTitle.trim()) return;
        try {
            const res = await todosAPI.update(id, { title: editTodoTitle, dueDate: editTodoDueDate });
            if (res.success) {
                toast({ title: "Task Updated", description: "Task details saved successfully." });
                setEditingTodoId(null);
                loadTodos();
            }
        } catch (err) {
            console.error("Failed to update todo:", err);
        }
    };

    const handleDeleteTodo = async (id) => {
        try {
            const res = await todosAPI.delete(id);
            if (res.success) {
                setTodos(todos.filter(t => t._id !== id));
                toast({ title: "Task Deleted", description: "Task has been removed." });
            }
        } catch (err) {
            console.error("Failed to delete todo:", err);
        }
    };

    const startEditingTodo = (todo) => {
        setEditingTodoId(todo._id);
        setEditTodoTitle(todo.title);
        const d = new Date(todo.dueDate);
        const pad = (num) => String(num).padStart(2, '0');
        const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setEditTodoDueDate(formattedDate);
    };

    const getOverdueStatus = (todo) => {
        if (todo.completed) return "completed";
        return new Date(todo.dueDate) < new Date() ? "overdue" : "pending";
    };

    const filteredTodos = todos.filter(todo => {
        if (todoFilter === "active") return !todo.completed;
        if (todoFilter === "completed") return todo.completed;
        return true;
    });

    // ==========================================
    // PRODUCTIVITY CALENDAR UTILITIES
    // ==========================================
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = [];
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const offset = firstDay.getDay();
        for (let i = offset - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month, -i),
                isCurrentMonth: false
            });
        }
        
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }
        
        return days;
    };

    const calendarDays = getDaysInMonth(currentDate);

    const changeMonth = (direction) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    };

    const getNotesForDate = (date) => {
        return notes.filter(note => {
            const noteDate = new Date(note.updatedAt || note.createdAt);
            return noteDate.getFullYear() === date.getFullYear() &&
                   noteDate.getMonth() === date.getMonth() &&
                   noteDate.getDate() === date.getDate();
        });
    };

    const getTodosForDate = (date) => {
        return todos.filter(todo => {
            const todoDate = new Date(todo.dueDate);
            return todoDate.getFullYear() === date.getFullYear() &&
                   todoDate.getMonth() === date.getMonth() &&
                   todoDate.getDate() === date.getDate();
        });
    };

    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] transition-colors duration-300">
            <main className="w-full relative py-8 px-4 md:px-6">
                <div className="max-w-7xl mx-auto pb-12">

                    {/* Back button */}
                    <button
                        onClick={() => navigate("/dashboard/smaart-toolkit")}
                        className="group flex items-center gap-3 text-[#112b6b] dark:text-white text-[11px] font-bold uppercase tracking-[0.2em] mb-6 hover:text-[#1a3884] transition-all animate-fade-in"
                    >
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:shadow-md group-hover:-translate-x-1 transition-all duration-300">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Back to Toolkit
                    </button>

                    {/* Hero Banner */}
                    <div className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.3)] dark:border-slate-700/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 mb-8">
                        <div className="absolute inset-px rounded-[31px] border border-white/60 dark:border-white/5 pointer-events-none" />
                        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 shadow-sm dark:border-blue-500/20 dark:bg-slate-900/50 dark:text-blue-400">
                                    <Sparkles className="h-3 w-3" />
                                    Task and Calendar Tracker
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                                    To-Do & <span className="text-[#1a3884] dark:text-blue-500">Calendar</span>
                                </h1>
                                <p className="max-w-xl text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                                    Schedule daily tasks, set due date reminders, and inspect your study calendar deadlines dynamically.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* To-Do Form and Lists */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Task Schedule Form */}
                        <div className="bg-white dark:bg-[#002147] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm h-fit">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                Schedule Productivity Task
                            </h2>
                            <form onSubmit={handleCreateTodo} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Task Title
                                    </label>
                                    <Input
                                        value={todoTitle}
                                        onChange={(e) => setTodoTitle(e.target.value)}
                                        placeholder="What needs to be done?"
                                        className="h-11 bg-[#F8FAFC] dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-700/50 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Due Date & Time
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={todoDueDate}
                                        onChange={(e) => setTodoDueDate(e.target.value)}
                                        className="h-11 bg-[#F8FAFC] dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-700/50 rounded-xl text-xs dark:text-slate-300"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-11 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-xl shadow-md font-bold transition-all active:scale-[0.98]"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add Task
                                </Button>
                            </form>
                        </div>

                        {/* Task List container */}
                        <div className="lg:col-span-2 bg-white dark:bg-[#002147] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Tasks</h2>
                                    <p className="text-xs text-slate-400 font-medium">
                                        {todos.filter(t => !t.completed).length} pending task(s) remaining
                                    </p>
                                </div>

                                <div className="flex bg-slate-100 dark:bg-slate-900/60 rounded-xl p-1 w-fit">
                                    {['all', 'active', 'completed'].map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setTodoFilter(filter)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                todoFilter === filter
                                                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                                                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                            }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {todosLoading ? (
                                <div className="space-y-3 py-6">
                                    <div className="h-14 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
                                    <div className="h-14 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                    {filteredTodos.map((todo) => {
                                        const status = getOverdueStatus(todo);
                                        const isEditing = editingTodoId === todo._id;

                                        return (
                                            <motion.div
                                                key={todo._id}
                                                layout
                                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                                                    todo.completed 
                                                        ? "bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/40 opacity-70"
                                                        : status === "overdue"
                                                            ? "bg-rose-500/5 border-rose-200/50 dark:border-rose-950/20"
                                                            : "bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/40"
                                                }`}
                                            >
                                                {isEditing ? (
                                                    <div className="flex-1 space-y-3 pr-4">
                                                        <Input 
                                                            value={editTodoTitle}
                                                            onChange={(e) => setEditTodoTitle(e.target.value)}
                                                            className="h-9"
                                                        />
                                                        <Input 
                                                            type="datetime-local"
                                                            value={editTodoDueDate}
                                                            onChange={(e) => setEditTodoDueDate(e.target.value)}
                                                            className="h-9 text-xs"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                                                        <button 
                                                            onClick={() => handleToggleTodo(todo._id, todo.completed)}
                                                            className="mt-0.5 text-slate-400 hover:text-[#1a3884] dark:hover:text-blue-400 transition-colors"
                                                        >
                                                            {todo.completed ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                            ) : (
                                                                <Square className="w-5 h-5" />
                                                            )}
                                                        </button>

                                                        <div className="min-w-0">
                                                            <p className={`text-sm font-semibold text-slate-800 dark:text-slate-100 truncate ${
                                                                todo.completed ? "line-through text-slate-400 dark:text-slate-500" : ""
                                                            }`}>
                                                                {todo.title}
                                                            </p>
                                                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                                <Clock className="w-3 h-3" /> Due: {formatDate(todo.dueDate)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-end gap-3 mt-4 sm:mt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5 pt-3 sm:pt-0">
                                                    {!todo.completed && !isEditing && (
                                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                                                            status === "overdue"
                                                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 flex items-center gap-1"
                                                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                                        }`}>
                                                            {status === "overdue" && <AlertTriangle className="w-2.5 h-2.5" />}
                                                            {status}
                                                        </span>
                                                    )}

                                                    <div className="flex items-center gap-1">
                                                        {isEditing ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEditTodoSave(todo._id)}
                                                                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 transition-all"
                                                                >
                                                                    <Save className="w-3.5 h-3.5" /> Save
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingTodoId(null)}
                                                                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => startEditingTodo(todo)}
                                                                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                                                    title="Edit Task"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteTodo(todo._id)}
                                                                    className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
                                                                    title="Delete Task"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}

                                    {filteredTodos.length === 0 && (
                                        <div className="text-center py-12">
                                            <p className="text-slate-400 text-sm font-medium">No tasks found inside this filter.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sync Monthly Calendar & Day Inspect Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Calendar Board */}
                        <div className="lg:col-span-2 bg-white dark:bg-[#002147] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                    {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </h2>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                                    <button 
                                        onClick={() => changeMonth(-1)}
                                        className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setCurrentDate(new Date())}
                                        className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
                                    >
                                        Today
                                    </button>
                                    <button 
                                        onClick={() => changeMonth(1)}
                                        className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                    <span key={day} className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        {day}
                                    </span>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {calendarDays.map((cell, index) => {
                                    const dateNotes = getNotesForDate(cell.date);
                                    const dateTodos = getTodosForDate(cell.date);
                                    const isSelected = isSameDay(cell.date, selectedDate);
                                    const isToday = isSameDay(cell.date, new Date());

                                    return (
                                        <div
                                            key={index}
                                            onClick={() => setSelectedDate(cell.date)}
                                            className={`min-h-[70px] p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                                                !cell.isCurrentMonth 
                                                    ? "bg-slate-50/30 dark:bg-[#002147]/10 border-slate-100 dark:border-slate-800/10 text-slate-300 dark:text-slate-700" 
                                                    : isSelected
                                                        ? "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/10"
                                                        : isToday
                                                            ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-[#1a3884] dark:text-blue-400 font-black"
                                                            : "bg-white dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                            }`}
                                        >
                                            <span className="text-xs font-bold">{cell.date.getDate()}</span>

                                            <div className="flex items-center gap-1 justify-center mt-1">
                                                {dateNotes.length > 0 && (
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-blue-500 animate-pulse"}`} title="Edited notes" />
                                                )}
                                                {dateTodos.length > 0 && (
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        isSelected ? "bg-white" : dateTodos.some(t => !t.completed && new Date(t.dueDate) < new Date()) ? "bg-rose-500 animate-bounce" : "bg-amber-500"
                                                    }`} title="Due tasks" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Calendar Sidebar Inspect */}
                        <div className="bg-white dark:bg-[#002147] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col h-full min-h-[400px]">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-3">
                                Deadlines on {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </h3>

                            <div className="flex-1 overflow-y-auto py-4 space-y-5">
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                        Tasks due ({getTodosForDate(selectedDate).length})
                                    </h4>
                                    {getTodosForDate(selectedDate).length === 0 ? (
                                        <p className="text-xs text-slate-400 font-medium italic">No scheduled tasks due on this day.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {getTodosForDate(selectedDate).map(todo => (
                                                <div 
                                                    key={todo._id}
                                                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                                        todo.completed
                                                            ? "bg-slate-50/50 dark:bg-slate-900/10 border-slate-100/50 dark:border-slate-800/10 opacity-70"
                                                            : "bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/40"
                                                    }`}
                                                >
                                                    <span className={`font-semibold truncate pr-2 ${todo.completed ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"}`}>
                                                        {todo.title}
                                                    </span>
                                                    <button 
                                                        onClick={() => handleToggleTodo(todo._id, todo.completed)}
                                                        className="shrink-0 text-slate-400 hover:text-[#1a3884] dark:hover:text-blue-400 transition-colors"
                                                    >
                                                        {todo.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                        Notes written ({getNotesForDate(selectedDate).length})
                                    </h4>
                                    {getNotesForDate(selectedDate).length === 0 ? (
                                        <p className="text-xs text-slate-400 font-medium italic">No notes created or edited on this day.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {getNotesForDate(selectedDate).map(note => (
                                                <div 
                                                    key={note._id}
                                                    onClick={() => navigate('/dashboard/notes')}
                                                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-900/40 hover:bg-blue-50/40 dark:hover:bg-slate-800/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                                                >
                                                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate pr-2">
                                                        {note.title || "Untitled Note"}
                                                    </span>
                                                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default TodoTracker;
