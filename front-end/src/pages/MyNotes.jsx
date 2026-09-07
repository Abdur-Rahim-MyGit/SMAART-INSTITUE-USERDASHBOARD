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
    Check,
    Pin,
    Checklist,
    Copy,
    Download,
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
const EMPTY_NOTE = { id: null, title: "", content: "", colorId: DEFAULT_COLOR.id, pinned: false, tags: [], type: "text", checklistItems: [] };

const getColorById = (id) => COLORS.find(c => c.id === id) || DEFAULT_COLOR;

const buildNoteExportText = (note, untitledLabel) => {
    const lines = [note.title || untitledLabel, ""];
    if (note.type === "checklist") {
        (note.checklistItems || []).forEach((item) => lines.push(`${item.done ? "[x]" : "[ ]"} ${item.text}`));
    } else {
        lines.push(note.content || "");
    }
    return lines.join("\n");
};

const MyNotes = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [notes, setNotes] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("date");
    const [showModal, setShowModal] = useState(false);
    const [currentNote, setCurrentNote] = useState(EMPTY_NOTE);
    const [tagInput, setTagInput] = useState("");
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

                    // The backend now owns color; the localStorage read is a
                    // one-time fallback for notes saved before this synced.
                    let colorId = n.colorId || localStorage.getItem(`note_color_${n._id}`) || DEFAULT_COLOR.id;
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
                        pinned: !!n.pinned,
                        tags: n.tags || [],
                        type: n.type || "text",
                        checklistItems: n.checklistItems || [],
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
        const isChecklist = currentNote.type === "checklist";
        const cleanedChecklist = isChecklist ? (currentNote.checklistItems || []).filter(item => item.text.trim()) : [];
        const hasChecklistContent = isChecklist && cleanedChecklist.length > 0;

        if (!currentNote.title.trim() && !currentNote.content.trim() && !hasChecklistContent) {
            toast({ title: t("my_notes.toast.empty_title", "Empty Note"), description: t("my_notes.toast.empty_desc", "Please add a title or content."), variant: "destructive" });
            return;
        }
        const isNew = !currentNote.id;
        const noteCourseId = currentNote.courseId || `personal-${Date.now()}`;
        const noteTitle = currentNote.title || t("my_notes.note_types.untitled", "Untitled Note");
        const noteContent = isChecklist
            ? cleanedChecklist.map(item => `${item.done ? "[x]" : "[ ]"} ${item.text}`).join("\n")
            : currentNote.content;

        try {
            const response = await notesAPI.upsert(noteCourseId, noteContent, noteTitle, {
                type: currentNote.type || "text",
                checklistItems: cleanedChecklist,
                colorId: currentNote.colorId,
                pinned: !!currentNote.pinned,
                tags: currentNote.tags || [],
            });
            if (response.success && response.data) {
                toast({ title: isNew ? t("my_notes.toast.created_title", "Note Created") : t("my_notes.toast.updated_title", "Note Updated"), description: t("my_notes.toast.saved_cloud", "Your note has been saved to the cloud.") });
                loadNotes(user.id || user._id);
                setShowModal(false);
                setCurrentNote(EMPTY_NOTE);
                setTagInput("");
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

    // Optimistic pin toggle straight from the grid -- no need to open the
    // editor just to pin something. Reverts if the save fails.
    const handleTogglePin = async (e, note) => {
        e.stopPropagation();
        const nextPinned = !note.pinned;
        setNotes(prev => prev.map(n => n.id === note.id ? { ...n, pinned: nextPinned } : n));
        try {
            const response = await notesAPI.upsert(note.courseId, undefined, undefined, { pinned: nextPinned });
            if (!response.success) throw new Error("Pin update failed");
        } catch (err) {
            console.error("Failed to toggle pin:", err);
            setNotes(prev => prev.map(n => n.id === note.id ? { ...n, pinned: !nextPinned } : n));
            toast({ title: t("my_notes.toast.error_title", "Error"), description: t("my_notes.toast.failed_pin", "Could not update pin."), variant: "destructive" });
        }
    };

    const handleCopyNote = async (note) => {
        try {
            await navigator.clipboard.writeText(buildNoteExportText(note, t("my_notes.note_types.untitled", "Untitled Note")));
            toast({ title: t("my_notes.toast.copied_title", "Copied"), description: t("my_notes.toast.copied_desc", "Note copied to clipboard.") });
        } catch (err) {
            console.error("Failed to copy note:", err);
            toast({ title: t("my_notes.toast.error_title", "Error"), description: t("my_notes.toast.copy_failed", "Could not copy note."), variant: "destructive" });
        }
    };

    const handleDownloadNote = (note) => {
        const text = buildNoteExportText(note, t("my_notes.note_types.untitled", "Untitled Note"));
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(note.title || "note").replace(/[^a-z0-9-_ ]/gi, "").trim() || "note"}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const openNewNote = () => {
        setCurrentNote(EMPTY_NOTE);
        setTagInput("");
        setShowModal(true);
    };

    const openEditNote = (note) => {
        setCurrentNote({
            ...note,
            tags: note.tags || [],
            checklistItems: note.checklistItems || [],
            type: note.type || "text",
            pinned: !!note.pinned,
        });
        setTagInput("");
        setShowModal(true);
    };

    const addTagFromInput = () => {
        const value = tagInput.trim();
        if (!value) return;
        setCurrentNote(prev => {
            if ((prev.tags || []).some(existing => existing.toLowerCase() === value.toLowerCase())) return prev;
            return { ...prev, tags: [...(prev.tags || []), value] };
        });
        setTagInput("");
    };

    const removeTag = (tag) => {
        setCurrentNote(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
    };

    const handleTagKeyDown = (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTagFromInput();
        } else if (e.key === "Backspace" && !tagInput && (currentNote.tags || []).length > 0) {
            removeTag(currentNote.tags[currentNote.tags.length - 1]);
        }
    };

    const addChecklistItem = () => {
        setCurrentNote(prev => ({ ...prev, checklistItems: [...(prev.checklistItems || []), { text: "", done: false }] }));
    };
    const updateChecklistItem = (idx, text) => {
        setCurrentNote(prev => ({ ...prev, checklistItems: prev.checklistItems.map((it, i) => i === idx ? { ...it, text } : it) }));
    };
    const toggleChecklistItem = (idx) => {
        setCurrentNote(prev => ({ ...prev, checklistItems: prev.checklistItems.map((it, i) => i === idx ? { ...it, done: !it.done } : it) }));
    };
    const removeChecklistItem = (idx) => {
        setCurrentNote(prev => ({ ...prev, checklistItems: prev.checklistItems.filter((_, i) => i !== idx) }));
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const sortedNotes = [...filteredNotes].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (sortBy === "title") return a.title.localeCompare(b.title);
        if (sortBy === "color") return a.colorId.localeCompare(b.colorId);
        return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

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

                        {/* Sort + Search + New Note */}
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                title={t("my_notes.header.sort_label", "Sort by")}
                                className="rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] px-3 py-2 text-[12.5px] font-semibold text-[#072036] outline-none transition-all focus:border-[#045C9A] focus:ring-2 focus:ring-[#045C9A]/15 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            >
                                <option value="date">{t("my_notes.header.sort_date", "Newest First")}</option>
                                <option value="title">{t("my_notes.header.sort_title", "Title (A–Z)")}</option>
                                <option value="color">{t("my_notes.header.sort_color", "Color")}</option>
                            </select>
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

                            {sortedNotes.map((note) => {
                                const nc = getColorById(note.colorId);
                                return (
                                    <motion.div
                                        key={note.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={() => openEditNote(note)}
                                        className={`group relative flex min-h-[180px] cursor-pointer flex-col rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${nc.twClasses} ${note.pinned ? "ring-1 ring-amber-400/60" : ""}`}
                                    >
                                        <div className="mb-1.5 flex items-center gap-2">
                                            {note.isCourseNote && (
                                                <span className="inline-flex rounded-full bg-white/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-indigo-700 shadow-sm dark:bg-indigo-900/40 dark:text-indigo-300">
                                                    {t("my_notes.grid.course_note", "Course Note")}
                                                </span>
                                            )}
                                            {note.type === "checklist" && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#045C9A] shadow-sm dark:bg-white/10 dark:text-[#A6D7E8]">
                                                    <Checklist className="h-2.5 w-2.5" /> {t("my_notes.grid.checklist_badge", "Checklist")}
                                                </span>
                                            )}
                                            <button
                                                onClick={(e) => handleTogglePin(e, note)}
                                                title={note.pinned ? t("my_notes.grid.unpin_tooltip", "Unpin") : t("my_notes.grid.pin_tooltip", "Pin to top")}
                                                className={`ml-auto flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${note.pinned ? "text-amber-500" : "text-slate-300 hover:text-amber-500 dark:text-slate-500 dark:hover:text-amber-400"}`}
                                            >
                                                <Pin className="h-3.5 w-3.5" style={note.pinned ? { fill: "currentColor" } : undefined} />
                                            </button>
                                        </div>
                                        <h3 className="mb-1.5 line-clamp-1 text-[14px] font-bold text-[#072036] dark:text-white">
                                            {note.title}
                                        </h3>

                                        {note.tags.length > 0 && (
                                            <div className="mb-2 flex flex-wrap gap-1">
                                                {note.tags.slice(0, 3).map((tag) => (
                                                    <button
                                                        key={tag}
                                                        onClick={(e) => { e.stopPropagation(); setSearchQuery(tag); }}
                                                        className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold text-slate-600 transition-colors hover:bg-[#045C9A] hover:text-white dark:bg-white/10 dark:text-slate-300"
                                                    >
                                                        #{tag}
                                                    </button>
                                                ))}
                                                {note.tags.length > 3 && (
                                                    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-slate-400">+{note.tags.length - 3}</span>
                                                )}
                                            </div>
                                        )}

                                        {note.type === "checklist" ? (
                                            <div className="mb-3 flex-1 space-y-1">
                                                {note.checklistItems.slice(0, 4).map((item, i) => (
                                                    <div key={i} className="flex items-center gap-1.5 text-[12px]">
                                                        <span className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded border ${item.done ? "border-[#045C9A] bg-[#045C9A] text-white" : "border-slate-400 dark:border-slate-500"}`}>
                                                            {item.done && <Check className="h-2.5 w-2.5" />}
                                                        </span>
                                                        <span className={`truncate ${item.done ? "text-slate-400 line-through" : "text-slate-600 dark:text-slate-300"}`}>{item.text}</span>
                                                    </div>
                                                ))}
                                                {note.checklistItems.length > 4 && (
                                                    <p className="text-[10.5px] font-medium text-slate-400">
                                                        {t("my_notes.grid.checklist_more", "+{{count}} more", { count: note.checklistItems.length - 4 })}
                                                    </p>
                                                )}
                                                {note.checklistItems.length === 0 && (
                                                    <p className="text-[12px] italic text-slate-400">{t("my_notes.grid.checklist_empty", "No items yet")}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="mb-3 line-clamp-5 flex-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                                                {note.content}
                                            </p>
                                        )}

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

                {sortedNotes.length === 0 && !loading && searchQuery && (
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
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentNote(prev => ({ ...prev, pinned: !prev.pinned }))}
                                        title={currentNote.pinned ? t("my_notes.grid.unpin_tooltip", "Unpin") : t("my_notes.grid.pin_tooltip", "Pin to top")}
                                        className={`rounded-lg p-1.5 transition-colors ${currentNote.pinned ? "text-amber-500" : "text-slate-400 hover:bg-black/5 hover:text-amber-500 dark:hover:bg-white/10"}`}
                                    >
                                        <Pin className="h-4 w-4" style={currentNote.pinned ? { fill: "currentColor" } : undefined} />
                                    </button>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Type toggle + Tags */}
                            <div className="flex flex-wrap items-center gap-2 border-b border-black/10 px-5 py-3 dark:border-white/10">
                                <div className="flex gap-1 rounded-lg bg-black/5 p-0.5 dark:bg-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentNote(prev => ({ ...prev, type: "text" }))}
                                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${currentNote.type === "text" ? "bg-white text-[#045C9A] shadow-sm dark:bg-[#072036] dark:text-[#A6D7E8]" : "text-slate-500 dark:text-slate-400"}`}
                                    >
                                        <StickyNote className="h-3 w-3" /> {t("my_notes.editor.type_note", "Note")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentNote(prev => ({
                                            ...prev,
                                            type: "checklist",
                                            checklistItems: prev.checklistItems && prev.checklistItems.length > 0 ? prev.checklistItems : [{ text: "", done: false }],
                                        }))}
                                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${currentNote.type === "checklist" ? "bg-white text-[#045C9A] shadow-sm dark:bg-[#072036] dark:text-[#A6D7E8]" : "text-slate-500 dark:text-slate-400"}`}
                                    >
                                        <Checklist className="h-3 w-3" /> {t("my_notes.editor.type_checklist", "Checklist")}
                                    </button>
                                </div>

                                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                                    {(currentNote.tags || []).map((tag) => (
                                        <span key={tag} className="flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[10.5px] font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                                            #{tag}
                                            <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-rose-500">
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                        onBlur={addTagFromInput}
                                        placeholder={t("my_notes.editor.tags_placeholder", "Add tag…")}
                                        className="min-w-[80px] flex-1 bg-transparent text-[11.5px] font-medium text-slate-600 outline-none placeholder:text-slate-400 dark:text-slate-300 dark:placeholder:text-slate-500"
                                    />
                                </div>
                            </div>

                            {/* Note content */}
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ maxHeight: "55vh" }}>
                                <input
                                    className="w-full bg-transparent text-[18px] font-bold text-[#072036] placeholder:text-slate-400 outline-none dark:text-white dark:placeholder:text-slate-500"
                                    placeholder={t("my_notes.editor.placeholder_title", "Title")}
                                    value={currentNote.title}
                                    onChange={(e) => setCurrentNote(prev => ({ ...prev, title: e.target.value }))}
                                />

                                {currentNote.type === "checklist" ? (
                                    <div className="space-y-1.5">
                                        {(currentNote.checklistItems || []).map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleChecklistItem(idx)}
                                                    className={`flex h-[1.125rem] w-[1.125rem] flex-shrink-0 items-center justify-center rounded border transition-colors ${item.done ? "border-[#045C9A] bg-[#045C9A] text-white" : "border-slate-400 dark:border-slate-500"}`}
                                                >
                                                    {item.done && <Check className="h-3 w-3" />}
                                                </button>
                                                <input
                                                    value={item.text}
                                                    onChange={(e) => updateChecklistItem(idx, e.target.value)}
                                                    placeholder={t("my_notes.editor.checklist_placeholder", "List item…")}
                                                    className={`flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 ${item.done ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeChecklistItem(idx)}
                                                    className="flex-shrink-0 text-slate-300 transition-colors hover:text-rose-500 dark:text-slate-600"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addChecklistItem}
                                            className="flex items-center gap-1.5 text-xs font-bold text-[#045C9A] transition-opacity hover:opacity-75 dark:text-[#A6D7E8]"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> {t("my_notes.editor.add_item", "Add item")}
                                        </button>
                                    </div>
                                ) : (
                                    <textarea
                                        className="w-full resize-none bg-transparent text-[13.5px] leading-relaxed text-slate-700 placeholder:text-slate-400 outline-none dark:text-slate-200 dark:placeholder:text-slate-500"
                                        placeholder={t("my_notes.editor.placeholder_content", "Start typing...")}
                                        rows={10}
                                        value={currentNote.content}
                                        onChange={(e) => setCurrentNote(prev => ({ ...prev, content: e.target.value }))}
                                    />
                                )}
                            </div>

                            {/* Modal footer */}
                            <div className="flex items-center justify-between border-t border-black/10 dark:border-white/10 px-5 py-3">
                                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                    {currentNote.updatedAt && t("my_notes.editor.last_edited", "Last edited: {{date}}", { date: formatDate(currentNote.updatedAt) })}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleCopyNote(currentNote)}
                                        title={t("my_notes.editor.copy_tooltip", "Copy to clipboard")}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-slate-500 transition-colors hover:bg-black/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDownloadNote(currentNote)}
                                        title={t("my_notes.editor.download_tooltip", "Download as .txt")}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-slate-500 transition-colors hover:bg-black/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={handleSaveNote}
                                        className="flex items-center gap-1.5 rounded-xl bg-[#045C9A] px-4 py-2 text-[12.5px] font-bold text-white shadow-sm transition-all hover:bg-[#072036] active:scale-95"
                                    >
                                        <Save className="h-3.5 w-3.5" /> {t("my_notes.editor.save_note", "Save Note")}
                                    </button>
                                </div>
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
