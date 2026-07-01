import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    IconPlus as Plus, 
    IconTrash as Trash2, 
    IconSearch as Search, 
    IconDeviceFloppy as Save, 
    IconX as X, 
    IconClock as Clock, 
    IconSparkles as Sparkles, 
    IconArrowLeft as ArrowLeft, 
    IconNote as StickyNote 
} from "@tabler/icons-react";
import { useToast } from "@/hooks/use-toast";
import { CardSkeleton } from "@/components/SkeletonPatterns";
import { notesAPI } from "@/services/api";

// Color palette — using responsive Tailwind classes for proper dark mode support
const COLORS = [
  { id: "yellow",  label: "Yellow",  twClasses: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700/50", hex: "#fde047" },
  { id: "blue",    label: "Blue",    twClasses: "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700/50", hex: "#93c5fd" },
  { id: "green",   label: "Green",   twClasses: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700/50", hex: "#86efac" },
  { id: "purple",  label: "Purple",  twClasses: "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700/50", hex: "#d8b4fe" },
  { id: "rose",    label: "Rose",    twClasses: "bg-rose-100 dark:bg-rose-900/30 border-rose-300 dark:border-rose-700/50", hex: "#fda4af" },
  { id: "indigo",  label: "Indigo",  twClasses: "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700/50", hex: "#a5b4fc" },
];

const DEFAULT_COLOR = COLORS[0];

const getColorById = (id) => COLORS.find(c => c.id === id) || DEFAULT_COLOR;

const MyNotes = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [notes, setNotes] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [currentNote, setCurrentNote] = useState({ id: null, title: "", content: "", colorId: DEFAULT_COLOR.id });
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = sessionStorage.getItem("user");
        if (userData) {
            const parsed = JSON.parse(userData);
            setUser(parsed);
            loadNotes(parsed.id || parsed._id);
        }
    }, []);

    const loadNotes = async (userId) => {
        setLoading(true);
        try {
            const response = await notesAPI.getAll();
            let dbNotes = [];
            if (response.success && response.data) {
                dbNotes = response.data.map(n => {
                    let displayTitle = n.title;
                    if (!displayTitle) {
                        if (n.courseId.startsWith("personal-")) displayTitle = "Untitled Note";
                        else if (n.courseId === "general") displayTitle = "General Course Notes";
                        else displayTitle = `Course: ${n.courseId}`;
                    }

                    let colorId = localStorage.getItem(`note_color_${n._id}`) || DEFAULT_COLOR.id;
                    const isCourseNote = !n.courseId.startsWith("personal-");
                    if (isCourseNote) colorId = "indigo";

                    return {
                        id: n._id,
                        title: displayTitle,
                        content: n.content,
                        colorId,
                        isCourseNote,
                        courseId: n.courseId,
                        createdAt: n.createdAt,
                        updatedAt: n.updatedAt || n.lastUpdated,
                    };
                }).filter(n => (n.content && n.content.trim() !== "") || n.title);
            }
            setNotes(dbNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
        } catch (error) {
            console.error("Error loading notes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNote = async () => {
        if (!currentNote.title.trim() && !currentNote.content.trim()) {
            toast({ title: "Empty Note", description: "Please add a title or content.", variant: "destructive" });
            return;
        }
        const isNew = !currentNote.id;
        const noteCourseId = currentNote.courseId || `personal-${Date.now()}`;
        const noteTitle = currentNote.title || "Untitled Note";

        try {
            const response = await notesAPI.upsert(noteCourseId, currentNote.content, noteTitle);
            if (response.success && response.data) {
                const savedId = response.data._id;
                localStorage.setItem(`note_color_${savedId}`, currentNote.colorId);
                toast({ title: isNew ? "Note Created" : "Note Updated", description: "Saved to the cloud." });
                loadNotes(user.id || user._id);
                setShowModal(false);
                setCurrentNote({ id: null, title: "", content: "", colorId: DEFAULT_COLOR.id });
            }
        } catch (err) {
            console.error("Failed to save note:", err);
            toast({ title: "Error", description: "Failed to save note.", variant: "destructive" });
        }
    };

    const handleDeleteNote = async (id, courseId) => {
        try {
            const response = await notesAPI.delete(courseId);
            if (response.success) {
                setNotes(notes.filter(n => n.id !== id));
                localStorage.removeItem(`note_color_${id}`);
                toast({ title: "Note Deleted" });
            }
        } catch {
            toast({ title: "Error", description: "Could not delete the note.", variant: "destructive" });
        }
    };

    const openNewNote = () => {
        setCurrentNote({ id: null, title: "", content: "", colorId: DEFAULT_COLOR.id });
        setShowModal(true);
    };

    const openEditNote = (note) => {
        setCurrentNote(note);
        setShowModal(true);
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (isoString) =>
        new Date(isoString).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

    const activeColor = getColorById(currentNote.colorId);

    return (
        <div className="min-h-screen bg-transparent pb-12 pt-0 transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* Back button */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate("/dashboard/smaart-toolkit")}
                    className="group mt-4 mb-5 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#1a3884]/70 transition-all hover:text-[#1a3884] dark:text-slate-400 dark:hover:text-slate-200"
                >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8e6f7] bg-white shadow-sm transition-all duration-200 group-hover:-translate-x-0.5 group-hover:shadow-md dark:border-[#1a3884]/30 dark:bg-[#001a3d]">
                        <ArrowLeft stroke={1.5} className="h-4 w-4" />
                    </div>
                    Back to Toolkit
                </motion.button>

                {/* Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="mb-6 overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630]"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
                                My <span className="text-[#1a3884] dark:text-blue-300">Notes</span>
                            </h1>
                            <p className="mt-1 text-[12.5px] font-medium text-slate-500 dark:text-slate-400">
                                Organize your thoughts and course insights in one cloud-synced workspace.
                            </p>
                        </div>

                        {/* Search + New Note */}
                        <div className="flex shrink-0 items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 pointer-events-none text-slate-400" />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search notes…"
                                    className="w-44 rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] py-2 pl-9 pr-3 text-[12.5px] font-medium text-[#0d1f4e] outline-none transition-all focus:border-[#1a3884] focus:w-56 focus:ring-2 focus:ring-[#1a3884]/15 dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white dark:placeholder:text-slate-500"
                                />
                            </div>
                            <button
                                onClick={openNewNote}
                                className="flex items-center gap-1.5 rounded-xl bg-[#1a3884] px-4 py-2 text-[12.5px] font-bold text-white shadow-md transition-all hover:bg-[#132c6b] active:scale-95"
                            >
                                <Plus className="h-4 w-4" /> New Note
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Notes Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
                    ) : (
                        <AnimatePresence>
                            {/* Create New tile */}
                            <motion.div
                                layout
                                onClick={openNewNote}
                                className="group flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d8e6f7] transition-all hover:border-[#1a3884]/50 hover:bg-[#eef4ff] dark:border-[#1a3884]/20 dark:hover:bg-[#1a3884]/10"
                            >
                                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] transition-transform group-hover:scale-110 dark:bg-[#1a3884]/15">
                                    <Plus className="h-5 w-5 text-[#1a3884] dark:text-blue-400" />
                                </div>
                                <p className="text-[12.5px] font-semibold text-slate-400 group-hover:text-[#1a3884] dark:text-slate-600 dark:group-hover:text-blue-400">New Note</p>
                            </motion.div>

                            {filteredNotes.map((note) => {
                                const nc = getColorById(note.colorId);
                                return (
                                    <motion.div
                                        key={note.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={() => openEditNote(note)}
                                        className={`group relative flex min-h-[180px] cursor-pointer flex-col rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${nc.twClasses}`}
                                    >
                                        <div className="mb-1.5 flex items-center gap-2">
                                            {note.isCourseNote && (
                                                <span className="inline-flex rounded-full bg-white/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-indigo-700 shadow-sm dark:bg-indigo-900/40 dark:text-indigo-300">
                                                    Course Note
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="mb-1.5 line-clamp-1 text-[14px] font-bold text-[#0d1f4e] dark:text-white">
                                            {note.title}
                                        </h3>
                                        <p className="mb-3 line-clamp-5 flex-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-600">
                                            {note.content}
                                        </p>
                                        <div className="mt-auto flex items-center justify-between border-t border-black/5 pt-3">
                                            <span className="flex items-center gap-1 text-[10.5px] font-medium text-slate-400">
                                                <Clock className="h-3 w-3" /> {formatDate(note.updatedAt)}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id, note.courseId); }}
                                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-500"
                                                title="Delete note"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>

                {filteredNotes.length === 0 && !loading && searchQuery && (
                    <div className="py-16 text-center">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef4ff] dark:bg-[#1a3884]/15">
                            <StickyNote className="h-6 w-6 text-[#1a3884] dark:text-blue-400" />
                        </div>
                        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                            No notes found for &ldquo;{searchQuery}&rdquo;
                        </p>
                    </div>
                )}
            </div>

            {/* Editor Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ duration: 0.2 }}
                            className={`flex w-full max-w-xl flex-col overflow-hidden rounded-2xl shadow-2xl border-[1.5px] ${activeColor.twClasses}`}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal top bar */}
                            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                    <span className="text-[13px] font-bold text-[#0d1f4e] dark:text-white">
                                        {currentNote.id ? "Edit Note" : "New Note"}
                                    </span>
                                    {/* Color picker swatches */}
                                    <div className="flex items-center gap-1.5">
                                        {COLORS.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => setCurrentNote(prev => ({ ...prev, colorId: c.id }))}
                                                title={c.label}
                                                className="relative h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
                                                style={{
                                                    backgroundColor: c.hex,
                                                    borderColor: currentNote.colorId === c.id ? "#1a3884" : "transparent",
                                                    boxShadow: currentNote.colorId === c.id ? "0 0 0 1.5px #1a3884" : "0 0 0 1px rgba(0,0,0,0.1)",
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Note content */}
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ maxHeight: "60vh" }}>
                                <input
                                    className="w-full bg-transparent text-[18px] font-bold text-[#0d1f4e] placeholder:text-slate-300 outline-none"
                                    placeholder="Note title…"
                                    value={currentNote.title}
                                    onChange={(e) => setCurrentNote(prev => ({ ...prev, title: e.target.value }))}
                                />
                                <textarea
                                    className="w-full resize-none bg-transparent text-[13.5px] leading-relaxed text-slate-700 placeholder:text-slate-300 outline-none"
                                    placeholder="Start writing…"
                                    rows={10}
                                    value={currentNote.content}
                                    onChange={(e) => setCurrentNote(prev => ({ ...prev, content: e.target.value }))}
                                />
                            </div>

                            {/* Modal footer */}
                            <div className="flex items-center justify-between border-t border-black/10 dark:border-white/10 px-5 py-3">
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    {currentNote.updatedAt && `Last edited: ${formatDate(currentNote.updatedAt)}`}
                                </span>
                                <button
                                    onClick={handleSaveNote}
                                    className="flex items-center gap-1.5 rounded-xl bg-[#1a3884] px-4 py-2 text-[12.5px] font-bold text-white shadow-md transition-all hover:bg-[#132c6b] active:scale-95"
                                >
                                    <Save className="h-3.5 w-3.5" /> Save Note
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyNotes;
