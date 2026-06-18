import { memo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, CheckCircle2, Plus, Trash2, Circle,
  ChevronLeft, ChevronRight, ClipboardList
} from "lucide-react";
import { todosAPI } from "@/services/api";

const LearningProgress = memo(() => {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [todos, setTodos] = useState([]);
  const [loadingTodos, setLoadingTodos] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState("medium"); // high, medium, low
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const fetchTodos = useCallback(async () => {
    try {
      const res = await todosAPI.getAll();
      if (res?.success) {
        setTodos(res.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch todos:", err);
    } finally {
      setLoadingTodos(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // ── calendar helpers ──────────────────────────────
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const isoOf = (d) => new Date(year, month, d).toISOString().split("T")[0];
  const selectedIso = selectedDate.toISOString().split("T")[0];

  const getTasksForDay = (d) => {
    const dayIso = isoOf(d);
    return todos.filter(t => t.dueDate?.split("T")[0] === dayIso);
  };

  const getPriorityColorForDay = (d) => {
    const dayTasks = getTasksForDay(d);
    if (dayTasks.length === 0) return null;
    const hasHigh = dayTasks.some(t => t.priority === "high");
    const hasMedium = dayTasks.some(t => t.priority === "medium");
    if (hasHigh) return "bg-rose-500 shadow-rose-500/50";
    if (hasMedium) return "bg-amber-500 shadow-amber-500/50";
    return "bg-emerald-500 shadow-emerald-500/50";
  };

  const selectedTodos = todos.filter(t => t.dueDate?.split("T")[0] === selectedIso);

  const isToday = (d) => {
    const n = new Date();
    return d === n.getDate() && month === n.getMonth() && year === n.getFullYear();
  };

  const isSelected = (d) =>
    d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

  // ── todo actions ──────────────────────────────────
  const addTodo = async () => {
    if (!newTask.trim()) return;
    setAdding(true);
    try {
      const res = await todosAPI.create(newTask.trim(), selectedDate.toISOString(), newPriority);
      if (res?.success) {
        setTodos(p => [...p, res.data]);
        setNewTask("");
        setNewPriority("medium");
        setShowInput(false);
      }
    } catch (err) {
      console.error("Failed to add todo:", err);
    } finally {
      setAdding(false);
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const res = await todosAPI.update(id, { completed: !completed });
      if (res?.success) {
        setTodos(p => p.map(t => t._id === id ? res.data : t));
      }
    } catch (err) {
      console.error("Failed to toggle todo:", err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await todosAPI.delete(id);
      setTodos(p => p.filter(t => t._id !== id));
    } catch (err) {
      console.error("Failed to delete todo:", err);
    }
  };

  const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const doneCount = selectedTodos.filter(t => t.completed).length;

  return (
    <div className="bg-white dark:bg-[#002147] rounded-2xl border border-slate-200/80 dark:border-[#1a3884]/25 shadow-sm overflow-hidden">

      {/* ── Calendar Header ──────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-[#1a3884]/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-800 dark:text-white tracking-tight">{monthLabel}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-[#002A5C] hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-[#002A5C] hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-[9px] font-bold text-slate-400 dark:text-slate-500 py-0.5 select-none">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const d = i + 1;
            const sel = isSelected(d);
            const tod = isToday(d);
            const dotColor = getPriorityColorForDay(d);
            return (
              <motion.button
                key={d}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedDate(new Date(year, month, d))}
                className={`relative mx-auto w-7 h-7 rounded-lg text-[11px] font-semibold transition-all duration-150 flex items-center justify-center select-none
                  ${sel
                    ? "bg-[#1a3884] text-white font-bold shadow-sm"
                    : tod
                      ? "bg-blue-50 dark:bg-[#1a3884]/25 text-[#1a3884] dark:text-blue-300 font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#002A5C]"
                  }`}
              >
                {d}
                {dotColor && !sel && (
                  <motion.span 
                    layoutId={`dot-${d}`}
                    className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${dotColor}`} 
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        {/* <div className="flex items-center justify-center gap-4 mt-3 pt-2 border-t border-slate-50 dark:border-[#1a3884]/10 text-[9px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase select-none">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            High
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Medium
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Low
          </div>
        </div> */}
      </div>

      {/* ── Tasks Section ─────────────────────────── */}
      <div className="px-4 py-3">
        {/* Task header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-none">
                {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                {selectedTodos.length === 0
                  ? "No tasks"
                  : `${doneCount} of ${selectedTodos.length} completed`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowInput(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a3884] hover:bg-[#132c6b] text-white text-[11px] font-bold transition-colors shadow-sm"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>

        {/* Add-task input */}
        <AnimatePresence>
          {showInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-2.5 space-y-2 bg-slate-50/55 dark:bg-[#002A5C]/40 p-2.5 rounded-xl border border-slate-100 dark:border-white/5"
            >
              <input
                autoFocus
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTodo()}
                placeholder="Task name…"
                className="w-full text-xs px-2.5 py-2 rounded-lg bg-white dark:bg-[#002147] border border-slate-200 dark:border-[#1a3884]/30 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a3884]/25 transition-all"
              />
              <div className="flex items-center justify-between gap-2">
                {/* Priority Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Priority:</span>
                  <div className="flex bg-white dark:bg-[#002147] border border-slate-200 dark:border-[#1a3884]/20 rounded-md p-0.5">
                    {["low", "medium", "high"].map((p) => {
                      const active = newPriority === p;
                      const activeColors = {
                        low: "bg-emerald-500 text-white",
                        medium: "bg-amber-500 text-white",
                        high: "bg-rose-500 text-white",
                      };
                      return (
                        <button
                          key={p}
                          onClick={() => setNewPriority(p)}
                          className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded transition-all ${active ? activeColors[p] : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  onClick={addTodo}
                  disabled={adding || !newTask.trim()}
                  className="px-3 py-1.5 bg-[#1a3884] hover:bg-[#132c6b] text-white rounded-lg text-[10px] font-bold disabled:opacity-40 transition-colors"
                >
                  {adding ? "…" : "Save"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task list */}
        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5 custom-scrollbar">
          {loadingTodos ? (
            <>
              {[1, 2].map(i => (
                <div key={i} className="h-9 rounded-xl bg-slate-100 dark:bg-[#002A5C] animate-pulse" />
              ))}
            </>
          ) : selectedTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-5 text-center">
              <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-[#002A5C] border border-slate-100 dark:border-[#1a3884]/20 flex items-center justify-center mb-2">
                <Calendar className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">No tasks for this day</p>
              {/* <button
                onClick={() => setShowInput(true)}
                className="text-[11px] text-[#1a3884] dark:text-blue-400 font-bold mt-1 hover:underline"
              >
                + Add a task
              </button> */}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
            {selectedTodos.map(todo => {
              const priorityColors = {
                high: "border-l-rose-500 bg-rose-500/5 dark:bg-rose-500/10",
                medium: "border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10",
                low: "border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10"
              };
              return (
                <motion.div
                  key={todo._id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -15, scale: 0.95 }}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#002A5C]/60 border border-slate-100 dark:border-[#1a3884]/15 border-l-3 ${priorityColors[todo.priority || "medium"]
                    } group hover:border-[#1a3884]/25 transition-all`}
                >
                  <button
                    onClick={() => toggleTodo(todo._id, todo.completed)}
                    className="shrink-0 transition-transform hover:scale-110"
                  >
                    {todo.completed
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      : <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 hover:text-[#1a3884] transition-colors" />
                    }
                  </button>
                  <span className={`flex-1 text-xs leading-snug font-medium ${todo.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-200"}`}>
                    {todo.title}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo._id)}
                    className="opacity-0 group-hover:opacity-100 shrink-0 text-slate-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
});

LearningProgress.displayName = "LearningProgress";
export default LearningProgress;
