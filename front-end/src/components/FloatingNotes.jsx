import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
// Material Symbols barrel -- the icon set the dashboard, courses list, profile
// and course player all use. This file imported from lucide-react, so its icons
// rendered at a different weight and optical size to the rest of the product.
import {
  FileText,
  Loader2,
  Plus,
  Save,
  StickyNote,
  X,
} from "@/components/icons";
import { useParams } from "react-router-dom";
import { notesAPI } from "@/services/api";
import { toast } from "sonner";

/**
 * FloatingNotes – a small floating widget for course notes.
 * ✅ Auto-loads notes for the current course
 * ✅ Auto-saves as the user types (debounced 1s)
 * ✅ Persistence across sessions via database
 */
const FloatingNotes = ({ courseId: propCourseId }) => {
    const { courseId: urlCourseId } = useParams();

    // Generate or retrieve a session ID for this specific course visit
    const [sessionId, setSessionId] = useState(() => {
        const sessionKey = `note_session_${urlCourseId || 'general'}`;
        let id = sessionStorage.getItem(sessionKey);
        if (!id) {
            id = Date.now().toString();
            sessionStorage.setItem(sessionKey, id);
        }
        return id;
    });

    const courseId = propCourseId || (urlCourseId ? `${urlCourseId}-session-${sessionId}` : `general-session-${sessionId}`);

    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);


    const textareaRef = useRef(null);
    const debounceRef = useRef(null);

    // Load notes on mount/course change
    useEffect(() => {
        const fetchNotes = async () => {
            try {
                setLoading(true);
                const response = await notesAPI.getByCourse(courseId);
                if (response.success && response.data) {
                    setNotes(response.data.content || "");
                    setLastSaved(response.data.updatedAt ? new Date(response.data.updatedAt) : null);
                }
            } catch (error) {
                console.error("Error fetching floating notes:", error);
                // Fallback to localStorage
                const localNotes = localStorage.getItem(`course-notes-${courseId}`);
                if (localNotes) setNotes(localNotes);
            } finally {
                setLoading(false);
            }
        };

        fetchNotes();
    }, [courseId]);

    // Focus textarea when opened
    useEffect(() => {
        if (open && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 300);
        }
    }, [open]);

    // Sync notes across components on same page
    useEffect(() => {
        const handleSync = (e) => {
            if (e.detail && e.detail.courseId === courseId && e.detail.content !== notes) {
                setNotes(e.detail.content);
            }
        };
        window.addEventListener('notes-updated', handleSync);
        return () => window.removeEventListener('notes-updated', handleSync);
    }, [courseId, notes]);

    // Save notes to database
    const saveNotes = useCallback(async (content) => {
        setSaving(true);
        try {
            const response = await notesAPI.upsert(courseId, content);
            if (response.success) {
                setLastSaved(new Date());
                // Backup to localStorage
                localStorage.setItem(`course-notes-${courseId}`, content);
                // Notify other components
                window.dispatchEvent(new CustomEvent('notes-updated', {
                    detail: { courseId, content }
                }));
            }
        } catch (error) {
            console.error("Error auto-saving notes:", error);
        } finally {
            setSaving(false);
        }
    }, [courseId]);

    const handleNewNote = () => {
        if (!notes.trim()) {
            toast.info("Notes are already empty.");
            return;
        }

        // Force a save of current notes before clearing
        saveNotes(notes);

        // Archive current session by generating a new one
        const newId = Date.now().toString();
        const sessionKey = `note_session_${urlCourseId || 'general'}`;
        sessionStorage.setItem(sessionKey, newId);

        // This triggers a re-render and re-fetch of a fresh note
        setSessionId(newId);
        setNotes("");
        setLastSaved(null);
        toast.success("Current session archived. Starting a fresh note!");
    };

    // Handle note change with auto-save
    const handleChange = (e) => {
        const value = e.target.value;
        setNotes(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            saveNotes(value);
        }, 1000); // 1s debounce for auto-save
    };

    // Manual save
    const handleManualSave = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        saveNotes(notes);
        toast.success("Notes saved successfully!");
    };

    return (
        <>
            {/* Floating Trigger */}
            <motion.div
                layout
                onClick={() => setOpen(!open)}
                className="fixed bottom-24 right-4 sm:right-8 z-50 h-14 rounded-2xl bg-white/80 dark:bg-[#0d3a5f]/80 backdrop-blur-xl text-[#045C9A] dark:text-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/20 dark:border-white/10 flex items-center gap-3 p-2.5 sm:px-5 cursor-pointer hover:shadow-[#045C9A]/20 transition-all duration-300 group overflow-hidden"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
            >
                <div className="w-9 h-9 rounded-xl bg-[#045C9A] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#045C9A]/20 group-hover:rotate-6 transition-transform">
                    <AnimatePresence mode="wait">
                        {open ? (
                            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                                <X className="w-4 h-4 text-white" />
                            </motion.div>
                        ) : (
                            <motion.div key="notes" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                                <StickyNote className="w-4 h-4 text-white" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {!open && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="hidden sm:flex flex-col pr-4"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-none mb-1">Quick Notes</span>
                        <span className="text-sm font-bold tracking-tight text-slate-500 dark:text-slate-400 whitespace-nowrap">Click to take notes...</span>
                    </motion.div>
                )}

                {saving && (
                    <div className="flex items-center gap-1.5 ml-auto hidden sm:flex">
                        <Loader2 className="w-3 h-3 animate-spin text-[#045C9A]" />
                    </div>
                )}
            </motion.div>

            {/* Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed bottom-[164px] right-6 z-[60] w-[340px] flex flex-col rounded-2xl bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/8 shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-[#d7ebf5] dark:border-white/8 flex items-center justify-between bg-[#F1F5F9]/80 dark:bg-[#072036]/80">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#045C9A] flex items-center justify-center">
                                    <FileText className="w-3.5 h-3.5 text-white" />
                                </div>
                                <h3 className="text-sm font-bold text-[#072036] dark:text-white">Quick Notes</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                {lastSaved && (
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                                <button
                                    onClick={handleNewNote}
                                    className="p-1.5 rounded-lg hover:bg-[#d7ebf5]/50 dark:hover:bg-[#0d3a5f] transition-colors text-slate-500 hover:text-[#045C9A] dark:text-slate-400"
                                    title="Start new note session (Archives current)"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleManualSave}
                                    className="p-1.5 rounded-lg hover:bg-[#d7ebf5]/50 dark:hover:bg-[#0d3a5f] transition-colors text-slate-500 hover:text-[#045C9A] dark:text-slate-400"
                                    title="Manual Save"
                                >
                                    <Save className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Editor */}
                        <div className="relative p-1">
                            <textarea
                                ref={textareaRef}
                                value={notes}
                                onChange={handleChange}
                                placeholder="Start typing your notes here..."
                                disabled={loading}
                                className="w-full h-64 p-4 rounded-xl bg-white dark:bg-[#0d3a5f] text-[#072036] dark:text-slate-200 text-sm focus:outline-none resize-none transition-opacity disabled:opacity-50 font-medium leading-relaxed"
                            />
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-[#0d3a5f]/50">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#045C9A]" />
                                </div>
                            )}
                        </div>

                        {/* Footer Tips */}
                        <div className="px-4 py-2 bg-[#F1F5F9] dark:bg-[#072036] border-t border-[#d7ebf5] dark:border-white/8 flex items-center justify-between">
                            <p className="text-[10px] text-slate-400">Notes are auto-saved to your profile</p>
                            <div className="flex items-center gap-1.5">
                                {saving ? (
                                    <span className="flex items-center gap-1 text-[9px] font-bold text-[#045C9A] uppercase tracking-widest">
                                        <Loader2 size={10} className="animate-spin" /> Saving
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Synced</span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingNotes;

// ── Inline version (used in the Notes tab — no floating trigger) ──────────────
export const InlineNotes = ({ courseId: propCourseId }) => {
    const { courseId: urlCourseId } = useParams();

    const [sessionId] = useState(() => {
        const sessionKey = `note_session_${urlCourseId || 'general'}`;
        let id = sessionStorage.getItem(sessionKey);
        if (!id) { id = Date.now().toString(); sessionStorage.setItem(sessionKey, id); }
        return id;
    });

    const courseId = propCourseId || (urlCourseId ? `${urlCourseId}-session-${sessionId}` : `general-session-${sessionId}`);

    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const textareaRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                setLoading(true);
                const response = await notesAPI.getByCourse(courseId);
                if (response.success && response.data) {
                    setNotes(response.data.content || "");
                    setLastSaved(response.data.updatedAt ? new Date(response.data.updatedAt) : null);
                }
            } catch {
                const local = localStorage.getItem(`course-notes-${courseId}`);
                if (local) setNotes(local);
            } finally { setLoading(false); }
        };
        fetchNotes();
    }, [courseId]);

    useEffect(() => {
        const handleSync = (e) => {
            if (e.detail?.courseId === courseId && e.detail.content !== notes) setNotes(e.detail.content);
        };
        window.addEventListener('notes-updated', handleSync);
        return () => window.removeEventListener('notes-updated', handleSync);
    }, [courseId, notes]);

    const saveNotes = useCallback(async (content) => {
        setSaving(true);
        try {
            const response = await notesAPI.upsert(courseId, content);
            if (response.success) {
                setLastSaved(new Date());
                localStorage.setItem(`course-notes-${courseId}`, content);
                window.dispatchEvent(new CustomEvent('notes-updated', { detail: { courseId, content } }));
            }
        } catch { /* silent */ } finally { setSaving(false); }
    }, [courseId]);

    const handleChange = (e) => {
        const value = e.target.value;
        setNotes(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => saveNotes(value), 1000);
    };

    const handleManualSave = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        saveNotes(notes);
        toast.success("Notes saved!");
    };

    const handleNewNote = () => {
        if (!notes.trim()) { toast.info("Notes are already empty."); return; }
        saveNotes(notes);
        const newId = Date.now().toString();
        sessionStorage.setItem(`note_session_${urlCourseId || 'general'}`, newId);
        setNotes("");
        setLastSaved(null);
        toast.success("New note session started!");
    };

    return (
        <div className="rounded-xl border border-[#d7ebf5] dark:border-white/8 overflow-hidden bg-white dark:bg-[#0d3a5f]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#F1F5F9] dark:bg-[#0d3a5f] border-b border-[#d7ebf5] dark:border-white/8">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#045C9A] flex items-center justify-center">
                        <FileText className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-bold text-[#072036] dark:text-white">Quick Notes</span>
                    {lastSaved && (
                        <span className="text-[10px] text-slate-400 font-medium ml-1">
                            · Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    {saving && <Loader2 className="w-3 h-3 animate-spin text-[#045C9A]" />}
                    <button
                        onClick={handleNewNote}
                        title="Archive current & start fresh"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#045C9A] hover:bg-[#EAF7FD] dark:hover:bg-[#0d3a5f] transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={handleManualSave}
                        title="Save now"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#045C9A] hover:bg-[#EAF7FD] dark:hover:bg-[#0d3a5f] transition-colors"
                    >
                        <Save className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Textarea */}
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={notes}
                    onChange={handleChange}
                    placeholder="Start typing your notes here... Notes are auto-saved to your profile."
                    disabled={loading}
                    className="w-full h-48 p-4 bg-white dark:bg-[#0d3a5f] text-[#072036] dark:text-slate-200
                               text-sm focus:outline-none resize-none disabled:opacity-50
                               font-medium leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-[#0d3a5f]/60">
                        <Loader2 className="w-5 h-5 animate-spin text-[#045C9A]" />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#F1F5F9] dark:bg-[#0d3a5f] border-t border-[#d7ebf5] dark:border-white/8">
                <p className="text-[10px] text-slate-400">Auto-saved to your profile</p>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${saving ? 'text-[#045C9A]' : 'text-emerald-500'}`}>
                    {saving ? 'Saving...' : 'Synced ✓'}
                </span>
            </div>
        </div>
    );
};

