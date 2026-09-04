import { memo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  Plus,
  Trash2,
  X,
} from "@/components/icons";
import { todosAPI, apiCall } from "@/services/api";
import { useTranslation } from "react-i18next";

const LearningProgress = memo(() => {
  const { t, i18n } = useTranslation();
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
      const [todosRes, eventsRes] = await Promise.all([
        todosAPI.getAll().catch(() => ({ success: false, data: [] })),
        apiCall('/analytics/calendar-events').catch(() => ({ success: false, data: [] }))
      ]);

      let combined = [];
      if (todosRes?.success) {
        combined = [...(todosRes.data || [])];
      }

      if (eventsRes?.success) {
        const globalEvents = (eventsRes.data || []).map(ev => ({
          _id: ev.id,
          title: ev.title,
          dueDate: ev.date + "T12:00:00.000Z", // add time to ensure ISO string split works
          priority: ev.priority || "medium",
          completed: ev.status === 'completed',
          isGlobalEvent: true,
          type: ev.type,
          description: ev.description,
          creatorRole: ev.creatorRole
        }));
        combined = [...combined, ...globalEvents];
      }

      setTodos(combined);
    } catch (err) {
      console.error("Failed to fetch todos and events:", err);
    } finally {
      setLoadingTodos(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // â”€â”€ calendar helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString(i18n.language || "en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const formatDateLocal = (dateObj) => {
    if (!dateObj) return "";
    const d = new Date(dateObj);
    if (isNaN(d)) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isoOf = (d) => formatDateLocal(new Date(year, month, d));
  const selectedIso = formatDateLocal(selectedDate);

  const getTasksForDay = (d) => {
    const dayIso = isoOf(d);
    return todos.filter(t => formatDateLocal(t.dueDate) === dayIso);
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

  const selectedTodos = todos.filter(t => formatDateLocal(t.dueDate) === selectedIso);

  const isToday = (d) => {
    const n = new Date();
    return d === n.getDate() && month === n.getMonth() && year === n.getFullYear();
  };

  const isSelected = (d) =>
    d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

  // â”€â”€ todo actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  const DAY_NAMES = [
    t('calendar.su', 'Su'),
    t('calendar.mo', 'Mo'),
    t('calendar.tu', 'Tu'),
    t('calendar.we', 'We'),
    t('calendar.th', 'Th'),
    t('calendar.fr', 'Fr'),
    t('calendar.sa', 'Sa')
  ];
  const doneCount = selectedTodos.filter(t => t.completed).length;

  return (
    <div className="font-sans bg-white dark:bg-[#0d3a5f] rounded-2xl border border-[#d7ebf5]/60 dark:border-white/[0.07] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] overflow-hidden">

      {/* ── Calendar Section ────────────────────────── */}
      <div className="px-4 pt-4 pb-3">

        {/* Month Header */}
        <div className="flex items-center justify-between mb-3.5">
          <span className="text-[15px] font-bold text-[#072036] dark:text-white tracking-tight">
            {monthLabel}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/8 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-150 active:scale-90"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/8 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-150 active:scale-90"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Unified Grid: Day Headers + Day Cells */}
        <div className="grid grid-cols-7">
          {/* Day Name Headers */}
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-[#045C9A] dark:text-[#A6D7E8] uppercase tracking-[0.05em] pb-2 select-none">
              {d}
            </div>
          ))}

          {/* Empty offset cells */}
          {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}

          {/* Day cells */}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const d = i + 1;
            const sel = isSelected(d);
            const tod = isToday(d);
            const dotColor = getPriorityColorForDay(d);
            return (
              <div key={d} className="flex items-center justify-center py-[2px]">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setSelectedDate(new Date(year, month, d))}
                  className={`relative w-7 h-7 rounded-full text-xs transition-all duration-150 flex items-center justify-center select-none
                    ${sel
                      ? "bg-[#072036] dark:bg-[#045C9A] text-white font-bold shadow-sm"
                      : tod
                        ? "text-[#072036] dark:text-[#A6D7E8] font-bold ring-2 ring-[#072036] dark:ring-[#A6D7E8] bg-[#EAF7FD] dark:bg-[#045C9A]/10"
                        : "text-[#072036] dark:text-slate-300 font-medium hover:bg-[#EAF7FD] dark:hover:bg-white/10 hover:text-[#072036] dark:hover:text-white"
                    }`}
                >
                  {d}
                  {dotColor && !sel && (
                    <span className={`absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full ${dotColor}`} />
                  )}
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────── */}
      <div className="h-px bg-slate-100 dark:bg-white/[0.05] mx-4" />

      {/* ── Tasks Section ────────────────────────── */}
      <div className="px-4 py-3">

        {/* Task Row Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#045C9A]/8 dark:bg-[#045C9A]/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-[14px] h-[14px] text-[#045C9A] dark:text-[#A6D7E8]" />
            </div>
            <div>
              {/* text-sm = 14px, font-semibold matches section-label hierarchy */}
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                {selectedDate.toLocaleDateString(i18n.language || "en-US", {
                  weekday: "short", month: "short", day: "numeric"
                })}
              </p>
              {/* text-xs secondary muted label */}
              <p className="text-xs font-normal text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                {selectedTodos.length === 0
                  ? t('calendar.no_tasks', 'No tasks scheduled')
                  : `${doneCount} of ${selectedTodos.length} completed`}
              </p>
            </div>
          </div>
          {/* + Add: text-xs (12px) font-semibold — standard button label size */}
          <button
            onClick={() => {
              // Closing also discards what was typed, so reopening always
              // starts clean rather than resurrecting a half-written task.
              if (showInput) {
                setNewTask("");
                setNewPriority("medium");
              }
              setShowInput(v => !v);
            }}
            aria-label={showInput
              ? t('calendar.cancel_add', 'Cancel adding task')
              : t('dashboard.add', 'Add')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95
              ${showInput
                ? "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-200 border border-transparent dark:border-white/15 hover:bg-slate-200 dark:hover:bg-white/[0.16]"
                : "bg-[#072036] dark:bg-[#045C9A] text-white shadow-sm hover:bg-[#0d3a5f] dark:hover:bg-[#0673B8]"
              }`}
          >
            {showInput
              ? <X className="w-3.5 h-3.5" />
              : <Plus className="w-3.5 h-3.5" />}
            {showInput
              ? t('common.cancel', 'Cancel')
              : t('dashboard.add', 'Add')}
          </button>
        </div>

        {/* Add-task Input Drawer */}
        <AnimatePresence>
          {showInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mb-2.5 space-y-2 bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl border border-[#d7ebf5]/60 dark:border-white/[0.06]">
                {/* text-sm input for readable typing */}
                <input
                  autoFocus
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTodo()}
                  placeholder={t('calendar.task_name_placeholder', 'Task name…')}
                  className="w-full text-sm px-3 py-2 rounded-lg bg-white dark:bg-white/[0.04] border border-[#d7ebf5] dark:border-white/15 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#045C9A]/20 dark:focus:ring-blue-500/20 transition-all"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {["low", "medium", "high"].map((p) => {
                      const active = newPriority === p;
                      const colors = {
                        low: active ? "bg-emerald-500 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600",
                        medium: active ? "bg-amber-500 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600",
                        high: active ? "bg-rose-500 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600",
                      };
                      return (
                        <button
                          key={p}
                          onClick={() => setNewPriority(p)}
                          className={`text-[11px] capitalize font-semibold px-2 py-1 rounded-md transition-all ${colors[p]}`}
                        >
                          {t(`calendar.priority_${p}`, p)}
                        </button>
                      );
                    })}
                  </div>
                  {/* Save button: text-xs font-semibold */}
                  <button
                    onClick={addTodo}
                    disabled={adding || !newTask.trim()}
                    className="px-3 py-1.5 bg-[#072036] dark:bg-[#045C9A] hover:bg-[#0d3a5f] dark:hover:bg-[#0673B8] text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors"
                  >
                    {adding ? "…" : t('calendar.save', 'Save')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task List */}
        {loadingTodos ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-10 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : selectedTodos.length === 0 ? (
          <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-[#d7ebf5]/50 dark:border-white/[0.05]">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 border border-[#d7ebf5]/60 dark:border-white/[0.06] flex items-center justify-center shrink-0">
              <Calendar className="w-[14px] h-[14px] text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              {/* text-xs (12px) font-medium — clear primary empty state label */}
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{t('calendar.no_tasks_day', 'No tasks for this day')}</p>
              {/* text-[11px] — softer hint */}
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Free day — tap Add to create one</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-0.5 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {selectedTodos.map(todo => {
                const priorityDot = {
                  high: "bg-rose-500",
                  medium: "bg-amber-500",
                  low: "bg-emerald-500"
                };
                return (
                  <motion.div
                    key={todo._id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12, scale: 0.96 }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-[#d7ebf5]/50 dark:border-white/[0.06] group hover:border-slate-300 dark:hover:border-white/[0.12] transition-all duration-200"
                  >
                    <button
                      onClick={() => !todo.isGlobalEvent && toggleTodo(todo._id, todo.completed)}
                      className={`shrink-0 ${!todo.isGlobalEvent ? 'hover:scale-110' : 'cursor-default'} transition-transform`}
                    >
                      {todo.completed
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        : <Circle className={`w-4 h-4 ${todo.isGlobalEvent ? 'text-[#045C9A] dark:text-[#A6D7E8]' : 'text-slate-300 dark:text-slate-600'}`} />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      {/* text-xs (12px) font-medium — task title, clear and readable */}
                      <span className={`block text-xs font-medium leading-snug truncate ${todo.completed ? "line-through text-slate-400 dark:text-slate-600" : "text-slate-700 dark:text-slate-200"}`}>
                        {todo.title}
                      </span>
                      {todo.isGlobalEvent && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${priorityDot[todo.priority || 'medium']}`} />
                          {/* text-[10px] badge label */}
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                            {todo.type === 'assessment' ? t('calendar.type_assessment', 'Assessment') : todo.type === 'session' ? t('calendar.type_session', 'Session') : t('calendar.type_event', 'Event')}
                          </span>
                        </div>
                      )}
                    </div>
                    {!todo.isGlobalEvent && (
                      <button
                        onClick={() => deleteTodo(todo._id)}
                        className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded-md text-slate-300 dark:text-slate-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-150"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
});

LearningProgress.displayName = "LearningProgress";
export default LearningProgress;

