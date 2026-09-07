import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
// Material Symbols barrel -- the icon set the dashboard, courses,
// assessments and dictionary pages use, so this page's glyphs sit at
// the same weight instead of the heavier Tabler set it used before.
import {
    Plus,
    Trash2,
    Search,
    Save,
    X,
    Clock,
    IconArrowLeft as ArrowLeft,
    StickyNote,
} from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { CardSkeleton } from "@/components/SkeletonPatterns";
import { notesAPI } from "@/services/api";
import NeuralBackground from "@/components/ui/NeuralBackground";
import PageTransition from "@/components/PageTransition";

// Color palette -- these are the student's own sticky-note tags, not
// brand color, so the hues stay; only the text on top of them needs a
// dark-mode pairing so a dark tint doesn't swallow dark navy text.
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

    // The constellation canvas paints from a prop, not CSS, so it has to be
    // told when the dark class flips -- same observer the dashboard uses.
    const [isDarkTheme, setIsDarkTheme] = useState(
        typeof document !== "undefined" && document.documentElement.classList.contains("dark")
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkTheme(document.documentElement.classList.contains("dark"));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

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
                        if (n.courseId.startsWith("personal-")) displayTitle = t("my_notes.note_types.untitled", "Untitled Note");
                        else if (n.courseId === "general") displayTitle = t("my_notes.note_types.general_course", "General Course Notes");
                        else displayTitle = t("my_notes.note_types.course_prefix", "Course: {{courseId}}", { courseId: n.courseId });
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
            toast({ title: t("my_notes.toast.empty_title", "Empty Note"), description: t("my_notes.toast.empty_desc", "Please add a title or content."), variant: "destructive" });
            return;
        }
        const isNew = !currentNote.id;
        const noteCourseId = currentNote.courseId || `personal-${Date.now()}`;
        const noteTitle = currentNote.title || t("my_notes.note_types.untitled", "Untitled Note");

        try {
            const response = await notesAPI.upsert(noteCourseId, currentNote.content, noteTitle);
            if (response.success && response.data) {
                const savedId = response.data._id;
                localStorage.setItem(`note_color_${savedId}`, currentNote.colorId);
                toast({ title: isNew ? t("my_notes.toast.created_title", "Note Created") : t("my_notes.toast.updated_title", "Note Updated"), description: t("my_notes.toast.saved_cloud", "Your note has been saved to the cloud.") });
                loadNotes(user.id || user._id);
                setShowModal(false);
                setCurrentNote({ id: null, title: "", content: "", colorId: DEFAULT_COLOR.id });
            }
        } catch (err) {
            console.error("Failed to save note:", err);
            toast({ title: t("my_notes.toast.error_title", "Error"), description: t("my_notes.toast.failed_save", "Failed to save note to database."), variant: "destructive" });
        }
    };

    const handleDeleteNote = async (id, courseId) => {
        try {
            const response = await notesAPI.delete(courseId);
            if (response.success) {
                setNotes(notes.filter(n => n.id !== id));
                localStorage.removeItem(`note_color_${id}`);
                toast({ title: t("my_notes.toast.deleted_title", "Note Deleted"), description: t("my_notes.toast.deleted_desc", "The note has been removed from your account.") });
            }
        } catch {
            toast({ title: t("my_notes.toast.error_title", "Error"), description: t("my_notes.toast.failed_delete", "Could not delete the note."), variant: "destructive" });
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
        <PageTransition>
        <div className="relative min-h-screen overflow-hidden bg-transparent pb-12 transition-colors duration-300">
            {/* Same ambient layer as the dashboard, courses, assessments and
                dictionary pages */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
                <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
            </div>
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
                <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 pt-4 sm:px-5 sm:pt-5 lg:px-6 lg:pt-6">

                {/* Back button */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate("/dashboard/smaart-toolkit")}
                    className="group mb-5 flex items-center gap-3 w-fit selection:bg-transparent"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7ebf5] bg-white shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-white/10 dark:bg-white/5">
                        <ArrowLeft className="h-4 w-4 text-[#034a7d] transition-transform group-hover:-translate-x-0.5 dark:text-slate-300" />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-widest text-[#034a7d] transition-colors group-hover:text-[#045C9A] dark:text-[#A6D7E8] dark:group-hover:text-white">
                        {t("my_notes.back_to_toolkit", "Back to Toolkit")}
                    </span>
                </motion.button>

                {/* Hero -- same structure, padding and type scale as the
                    courses/assessments/dictionary hero, so they all read as
                    one product. */}
                <motion.section
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                    className="relative mb-6 w-full overflow-hidden rounded-2xl border border-[#d7ebf5]/80 bg-white shadow-sm dark:border-[#045C9A]/20 dark:bg-[#0d3a5f]"
                >
                    <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />

                    <div className="relative z-10 flex flex-col gap-4 px-6 py-5 sm:px-8 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[#d7ebf5] bg-[#EAF7FD] text-[#045C9A] shadow-sm dark:border-[#045C9A]/30 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]">
                                <StickyNote className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <h1
                                    className="text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl"
                                    style={{ letterSpacing: "-0.02em" }}
                                >
                                    {t("my_notes.header.title_my", "My")}{" "}
                                    <span className="text-[#045C9A] dark:text-[#A6D7E8]">{t("my_notes.header.title_notes", "Notes")}</span>
                                </h1>
                                <p className="mt-0.5 text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">
                                    {t("my_notes.header.description", "Organize your thoughts, course insights, and personal breakthroughs in one secure, cloud-synced workspace.")}
                                </p>
                            </div>
                        </div>

                        {/* Search + New Note */}
                        <div className="flex shrink-0 items-center gap-2">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t("my_notes.header.search_placeholder", "Search your library...")}
                                    className="w-44 rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] py-2 pl-9 pr-3 text-[12.5px] font-medium text-[#072036] outline-none transition-all focus:w-56 focus:border-[#045C9A] focus:ring-2 focus:ring-[#045C9A]/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                                />
                            </div>
                            <button
                                onClick={openNewNote}
                                className="flex items-center gap-1.5 rounded-xl bg-[#045C9A] px-4 py-2 text-[12.5px] font-bold text-white shadow-sm transition-all hover:bg-[#072036] active:scale-95"
                            >
                                <Plus className="h-4 w-4" /> {t("my_notes.header.new_note", "New Note")}
                            </button>
                        </div>
                    </div>
                </motion.section>

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
                                className="group flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d7ebf5] transition-all hover:border-[#045C9A]/50 hover:bg-[#EAF7FD] dark:border-white/10 dark:hover:bg-[#045C9A]/10"
                            >
                                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF7FD] transition-transform group-hover:scale-110 dark:bg-[#045C9A]/20">
                                    <Plus className="h-5 w-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                                </div>
                                <p className="text-[12.5px] font-semibold text-slate-400 group-hover:text-[#045C9A] dark:text-slate-500 dark:group-hover:text-[#A6D7E8]">{t("my_notes.grid.create_new", "Create New Note")}</p>
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
                                                    {t("my_notes.grid.course_note", "Course Note")}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="mb-1.5 line-clamp-1 text-[14px] font-bold text-[#072036] dark:text-white">
                                            {note.title}
                                        </h3>
                                        <p className="mb-3 line-clamp-5 flex-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                                            {note.content}
                                        </p>
                                        <div className="mt-auto flex items-center justify-between border-t border-black/5 pt-3 dark:border-white/10">
                                            <span className="flex items-center gap-1 text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
                                                <Clock className="h-3 w-3" /> {formatDate(note.updatedAt)}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id, note.courseId); }}
                                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/15 dark:hover:text-rose-300"
                                                title={t("my_notes.grid.delete_tooltip", "Delete note")}
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
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d7ebf5] bg-[#EAF7FD] dark:border-[#045C9A]/30 dark:bg-[#045C9A]/20">
                            <StickyNote className="h-6 w-6 text-[#045C9A] dark:text-[#A6D7E8]" />
                        </div>
                        <p className="text-[13px] font-semibold text-[#35566b] dark:text-slate-400">
                            {t("my_notes.grid.no_notes_matching", "No notes found matching \"{{query}}\"", { query: searchQuery })}
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
                                    <span className="text-[13px] font-bold text-[#072036] dark:text-white">
                                        {currentNote.id ? t("my_notes.editor.edit_title", "Edit Note") : t("my_notes.editor.new_title", "New Note")}
                                    </span>
                                    {/* Color picker swatches */}
                                    <div className="flex items-center gap-1.5">
                                        {COLORS.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => setCurrentNote(prev => ({ ...prev, colorId: c.id }))}
                                                title={t(`my_notes.colors.${c.id}`, c.label)}
                                                className="relative h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
                                                style={{
                                                    backgroundColor: c.hex,
                                                    borderColor: currentNote.colorId === c.id ? "#045C9A" : "transparent",
                                                    boxShadow: currentNote.colorId === c.id ? "0 0 0 1.5px #045C9A" : "0 0 0 1px rgba(0,0,0,0.1)",
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Note content */}
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ maxHeight: "60vh" }}>
                                <input
                                    className="w-full bg-transparent text-[18px] font-bold text-[#072036] placeholder:text-slate-400 outline-none dark:text-white dark:placeholder:text-slate-500"
                                    placeholder={t("my_notes.editor.placeholder_title", "Title")}
                                    value={currentNote.title}
                                    onChange={(e) => setCurrentNote(prev => ({ ...prev, title: e.target.value }))}
                                />
                                <textarea
                                    className="w-full resize-none bg-transparent text-[13.5px] leading-relaxed text-slate-700 placeholder:text-slate-400 outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
                                    placeholder={t("my_notes.editor.placeholder_content", "Start typing...")}
                                    rows={10}
                                    value={currentNote.content}
                                    onChange={(e) => setCurrentNote(prev => ({ ...prev, content: e.target.value }))}
                                />
                            </div>

                            {/* Modal footer */}
                            <div className="flex items-center justify-between border-t border-black/10 dark:border-white/10 px-5 py-3">
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    {currentNote.updatedAt && t("my_notes.editor.last_edited", "Last edited: {{date}}", { date: formatDate(currentNote.updatedAt) })}
                                </span>
                                <button
                                    onClick={handleSaveNote}
                                    className="flex items-center gap-1.5 rounded-xl bg-[#045C9A] px-4 py-2 text-[12.5px] font-bold text-white shadow-sm transition-all hover:bg-[#072036] active:scale-95"
                                >
                                    <Save className="h-3.5 w-3.5" /> {t("my_notes.editor.save_note", "Save Note")}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        </PageTransition>
    );
};

export default MyNotes;
