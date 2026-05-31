import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    Search,
    Save,
    X,
    Clock,
    Sparkles,
    ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardSkeleton } from "@/components/SkeletonPatterns";
import { notesAPI } from "@/services/api";

const MyNotes = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [notes, setNotes] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [currentNote, setCurrentNote] = useState({ id: null, title: "", content: "", color: "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50" });
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const colors = [
        { name: "Yellow", value: "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50" },
        { name: "Blue", value: "bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50" },
        { name: "Green", value: "bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-700/50" },
        { name: "Purple", value: "bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/50" },
        { name: "Rose", value: "bg-rose-100 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700/50" },
    ];

    useEffect(() => {
        // Load User
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
                        if (n.courseId.startsWith('personal-')) {
                            displayTitle = "Untitled Note";
                        } else if (n.courseId === 'general') {
                            displayTitle = "General Course Notes";
                        } else {
                            displayTitle = `Course: ${n.courseId}`;
                        }
                    }

                    let noteColor = colors[0].value;
                    if (n.courseId.startsWith('personal-')) {
                        const savedColor = localStorage.getItem(`note_color_${n._id}`);
                        if (savedColor) noteColor = savedColor;
                    } else {
                        noteColor = "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-700/50";
                    }

                    return {
                        id: n._id,
                        title: displayTitle,
                        content: n.content,
                        color: noteColor,
                        isCourseNote: !n.courseId.startsWith('personal-'),
                        courseId: n.courseId,
                        createdAt: n.createdAt,
                        updatedAt: n.updatedAt || n.lastUpdated
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
                localStorage.setItem(`note_color_${savedId}`, currentNote.color);

                toast({
                    title: isNew ? "Note Created" : "Note Updated",
                    description: "Your note has been saved to the cloud."
                });

                loadNotes(user.id || user._id);
                setShowModal(false);
                setCurrentNote({ id: null, title: "", content: "", color: colors[0].value });
            }
        } catch (err) {
            console.error("Failed to save note:", err);
            toast({ title: "Error", description: "Failed to save note to database.", variant: "destructive" });
        }
    };

    const handleDeleteNote = async (id, courseId) => {
        try {
            const response = await notesAPI.delete(courseId);
            if (response.success) {
                setNotes(notes.filter(n => n.id !== id));
                localStorage.removeItem(`note_color_${id}`);
                toast({ title: "Note Deleted", description: "The note has been removed from your account." });
            }
        } catch (err) {
            console.error("Failed to delete note:", err);
            toast({ title: "Error", description: "Could not delete the note.", variant: "destructive" });
        }
    };

    const openNewNote = () => {
        setCurrentNote({ id: null, title: "", content: "", color: colors[0].value });
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

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] transition-colors duration-300">
            <main className="w-full relative py-8 px-4 md:px-6">
                <div className="max-w-7xl mx-auto pb-12">

                    {/* Back to Toolkit */}
                    <button
                        onClick={() => navigate("/dashboard/smaart-toolkit")}
                        className="group flex items-center gap-3 text-[#112b6b] dark:text-white text-[11px] font-bold uppercase tracking-[0.2em] mb-6 hover:text-[#1a3884] transition-all animate-fade-in"
                    >
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:shadow-md group-hover:-translate-x-1 transition-all duration-300">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Back to Toolkit
                    </button>

                    {/* Hero Section */}
                    <div className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.3)] dark:border-slate-700/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 mb-8">
                        <div className="absolute inset-px rounded-[31px] border border-white/60 dark:border-white/5 pointer-events-none" />
                        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 shadow-sm dark:border-blue-500/20 dark:bg-slate-900/50 dark:text-blue-400">
                                    <Sparkles className="h-3 w-3" />
                                    Personal Study Notes
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                                    My <span className="text-[#1a3884] dark:text-blue-500">Notes</span>
                                </h1>
                                <p className="max-w-xl text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                                    Organize your thoughts, course insights, and personal breakthroughs in one secure, cloud-synced workspace.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative w-full sm:w-64 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search your library..."
                                        className="pl-12 h-12 bg-white/80 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-700/50 rounded-2xl focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                                    />
                                </div>
                                <Button
                                    onClick={openNewNote}
                                    className="h-12 px-6 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-2xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span className="font-bold">New Note</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Notes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <CardSkeleton key={i} />
                            ))
                        ) : (
                            <AnimatePresence>
                                {/* Create New Card */}
                                <motion.div
                                    layout
                                    onClick={openNewNote}
                                    className="min-h-[250px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-white/10 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#002A5C] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <p className="text-slate-500 font-medium group-hover:text-blue-600">Create New Note</p>
                                </motion.div>

                                {filteredNotes.map(note => (
                                    <motion.div
                                        key={note.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={() => openEditNote(note)}
                                        className={`relative p-6 rounded-2xl border shadow-sm hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1 ${note.color} flex flex-col`}
                                    >
                                        {note.isCourseNote && (
                                            <span className="absolute top-4 right-4 bg-indigo-500/10 dark:bg-indigo-400/20 text-indigo-700 dark:text-indigo-300 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                                                Course Note
                                            </span>
                                        )}
                                        <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-200 line-clamp-1 pr-16">{note.title}</h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-wrap line-clamp-6 flex-1 mb-4 leading-relaxed font-medium">
                                            {note.content}
                                        </p>
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5 dark:border-white/5">
                                            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {formatDate(note.updatedAt)}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id, note.courseId); }}
                                                className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
                                                title="Delete note"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>

                    {filteredNotes.length === 0 && !loading && (
                        <div className="text-center py-20">
                            <p className="text-slate-500">No notes found matching "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Editor Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                        <div className="bg-white dark:bg-[#002147] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
                                <h2 className="font-bold text-lg text-slate-800 dark:text-white">
                                    {currentNote.id ? "Edit Note" : "New Note"}
                                </h2>
                                <div className="flex gap-2">
                                    {/* Color Picker */}
                                    <div className="flex gap-1 mr-4">
                                        {colors.map(c => (
                                            <button
                                                key={c.name}
                                                onClick={() => setCurrentNote({ ...currentNote, color: c.value })}
                                                className={`w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110 ${c.value.split(" ")[0]} ${currentNote.color === c.value ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                                                title={c.name}
                                            />
                                        ))}
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 flex-1 overflow-y-auto space-y-4">
                                <input
                                    className="w-full text-2xl font-bold bg-transparent border-none placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none text-slate-800 dark:text-white"
                                    placeholder="Title"
                                    value={currentNote.title}
                                    onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                                />
                                <textarea
                                    className="w-full h-64 bg-transparent border-none resize-none focus:outline-none text-slate-600 dark:text-slate-300 text-lg leading-relaxed placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                    placeholder="Start typing..."
                                    value={currentNote.content}
                                    onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center bg-[#F8FAFC] dark:bg-black/20">
                                <div className="flex items-center gap-4">
                                    <div className="text-xs text-slate-400">
                                        {currentNote.updatedAt && `Last edited: ${formatDate(currentNote.updatedAt)}`}
                                    </div>
                                </div>
                                <Button onClick={handleSaveNote} className="bg-[#1a3884] hover:bg-[#132c6b] text-white shadow-md">
                                    <Save className="w-4 h-4 mr-2" /> Save Note
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyNotes;
