import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Trash2,
    Edit3,
    Search,
    Save,
    X,
    Calendar,
    StickyNote,
    Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardSkeleton } from "@/components/SkeletonPatterns";

const MyNotes = () => {
    const { toast } = useToast();
    const [notes, setNotes] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [currentNote, setCurrentNote] = useState({ id: null, title: "", content: "", color: "bg-yellow-100" });
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

    const loadNotes = (userId) => {
        setLoading(true);
        const savedNotes = localStorage.getItem(`my_notes_${userId}`);
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        }
        // Simulate a small delay for better UX feel with skeleton
        setTimeout(() => setLoading(false), 600);
    };

    const saveNotes = (updatedNotes) => {
        const userId = user.id || user._id;
        localStorage.setItem(`my_notes_${userId}`, JSON.stringify(updatedNotes));
        setNotes(updatedNotes);
    };

    const handleSaveNote = () => {
        if (!currentNote.title.trim() && !currentNote.content.trim()) {
            toast({ title: "Empty Note", description: "Please add a title or content.", variant: "destructive" });
            return;
        }

        const newNote = {
            id: currentNote.id || Date.now().toString(),
            title: currentNote.title || "Untitled Note",
            content: currentNote.content,
            color: currentNote.color,
            createdAt: currentNote.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        let updatedNotes;
        if (currentNote.id) {
            // Edit
            updatedNotes = notes.map(n => n.id === currentNote.id ? newNote : n);
            toast({ title: "Note Updated", description: "Your note has been saved." });
        } else {
            // Create
            updatedNotes = [newNote, ...notes];
            toast({ title: "Note Created", description: "New note added successfully." });
        }

        saveNotes(updatedNotes);
        setShowModal(false);
        setCurrentNote({ id: null, title: "", content: "", color: colors[0].value });
    };

    const handleDeleteNote = (id) => {
        const updatedNotes = notes.filter(n => n.id !== id);
        saveNotes(updatedNotes);
        toast({ title: "Note Deleted", description: "The note has been removed." });
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
        return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-[#e8ecef] dark:bg-[#001229] transition-colors duration-300">
            <main className="w-full relative py-8 px-4 md:px-6">
                    <div className="max-w-7xl mx-auto pb-12">

                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
                                    <StickyNote className="w-8 h-8 text-blue-600" /> My Notes
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400">Capture your thoughts, ideas, and reminders.</p>
                            </div>

                            <div className="flex gap-4 w-full md:w-auto">
                                <div className="relative group w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search notes..."
                                        className="pl-10 bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>
                                <Button onClick={openNewNote} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                                    <Plus className="w-5 h-5 mr-2" /> New Note
                                </Button>
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
                                    {/* Create New Card (Visual shortcut) */}
                                    <motion.div
                                        layout
                                        onClick={openNewNote}
                                        className="min-h-[250px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
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
                                            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-slate-200 line-clamp-1">{note.title}</h3>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-wrap line-clamp-6 flex-1 mb-4 leading-relaxed font-medium">
                                                {note.content}
                                            </p>
                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/5 dark:border-white/5">
                                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {formatDate(note.updatedAt)}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
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

                        {filteredNotes.length === 0 && searchQuery && (
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
                            <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
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
                                        class="w-full text-2xl font-bold bg-transparent border-none placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none text-slate-800 dark:text-white"
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
                                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-black/20">
                                    <div className="flex items-center gap-4">
                                        <div className="text-xs text-slate-400">
                                            {currentNote.updatedAt && `Last edited: ${formatDate(currentNote.updatedAt)}`}
                                        </div>
                                        {currentNote.id && (
                                            <Button
                                                onClick={() => {
                                                    handleDeleteNote(currentNote.id);
                                                    setShowModal(false);
                                                }}
                                                variant="outline"
                                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete Note
                                            </Button>
                                        )}
                                    </div>
                                    <Button onClick={handleSaveNote} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
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
