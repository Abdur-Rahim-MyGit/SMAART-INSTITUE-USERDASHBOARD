import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Search, X, Volume2, Loader2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * FloatingDictionary – a small chatbot-style floating widget
 * that appears on course/learning pages. Lets users quickly
 * look up words without leaving the page.
 *
 * ✅ Auto-searches as user types (debounced 400ms)
 * ✅ Shows instant definitions
 */
const FloatingDictionary = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);
    const abortRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (open && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [open]);

    /* ── Core search function ── */
    const searchWord = useCallback(async (word) => {
        if (!word || word.length < 2) {
            setResult(null);
            setError(null);
            return;
        }

        // Abort any in-flight request
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
                { signal: abortRef.current.signal }
            );
            if (!res.ok) throw new Error("not found");
            const data = await res.json();
            setResult(data[0]);
            setError(null);
        } catch (err) {
            if (err.name === "AbortError") return; // Ignore aborted fetches
            setResult(null);
            setError("Word not found. Try another word.");
        } finally {
            setLoading(false);
        }
    }, []);

    /* ── Auto-search as user types (debounced 400ms) ── */
    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        // Clear previous debounce timer
        if (debounceRef.current) clearTimeout(debounceRef.current);

        const word = value.trim();
        if (!word || word.length < 2) {
            setResult(null);
            setError(null);
            setLoading(false);
            return;
        }

        // Show loading indicator immediately for feedback
        setLoading(true);

        // Debounce the actual API call
        debounceRef.current = setTimeout(() => {
            searchWord(word);
        }, 400);
    };

    /* ── Manual submit (Enter key) – instant, no debounce ── */
    const handleSubmit = (e) => {
        e?.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const word = query.trim();
        if (word.length >= 2) searchWord(word);
    };

    /* ── Cleanup on unmount ── */
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (abortRef.current) abortRef.current.abort();
        };
    }, []);

    const playAudio = (url) => {
        if (url) new Audio(url).play().catch(() => { });
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => setOpen(!open)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#1a3884] to-[#2d5dc7] text-white shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 flex items-center justify-center transition-all duration-300 group"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                title="Quick Dictionary"
            >
                <AnimatePresence mode="wait">
                    {open ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <X className="w-5 h-5" />
                        </motion.div>
                    ) : (
                        <motion.div key="book" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <Book className="w-5 h-5" />
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Pulse ring when closed */}
                {!open && (
                    <span className="absolute inset-0 rounded-full border-2 border-blue-400/40 animate-ping pointer-events-none" />
                )}
            </motion.button>

            {/* Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed bottom-24 right-6 z-50 w-[340px] max-h-[480px] flex flex-col rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/50 shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#1a3884] to-[#2d5dc7] flex items-center justify-center">
                                    <Book className="w-3.5 h-3.5 text-white" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Quick Dictionary</h3>
                            </div>
                            <button
                                onClick={() => navigate("/dashboard/dictionary")}
                                className="text-[10px] font-semibold text-[#1a3884] dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                                Full view <ExternalLink className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Search */}
                        <form onSubmit={handleSubmit} className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={handleInputChange}
                                    placeholder="Type a word to look up…"
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600/60 bg-white dark:bg-slate-700/50 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                                />
                                {loading && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5 pl-1">Results appear instantly as you type</p>
                        </form>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[120px]">

                            {error && !loading && (
                                <div className="text-center py-6">
                                    <p className="text-sm text-slate-400 dark:text-slate-500">{error}</p>
                                </div>
                            )}

                            {!loading && !error && !result && (
                                <div className="text-center py-6">
                                    <Book className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Start typing to see definitions instantly</p>
                                </div>
                            )}

                            {result && !loading && (
                                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                    {/* Word header */}
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white capitalize">{result.word}</h4>
                                        {result.phonetic && (
                                            <span className="text-xs text-slate-400 font-mono">{result.phonetic}</span>
                                        )}
                                        {result.phonetics?.find(p => p.audio) && (
                                            <button
                                                onClick={() => playAudio(result.phonetics.find(p => p.audio).audio)}
                                                className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-[#1a3884] dark:hover:text-blue-400 transition-colors"
                                            >
                                                <Volume2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Meanings */}
                                    {result.meanings?.slice(0, 3).map((meaning, i) => (
                                        <div key={i}>
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1a3884] dark:text-blue-400 italic">
                                                {meaning.partOfSpeech}
                                            </span>
                                            <ul className="mt-1 space-y-1.5">
                                                {meaning.definitions.slice(0, 2).map((def, j) => (
                                                    <li key={j} className="flex gap-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                        <span className="text-slate-300 dark:text-slate-600 mt-0.5 flex-shrink-0">•</span>
                                                        <div>
                                                            <span>{def.definition}</span>
                                                            {def.example && (
                                                                <p className="mt-0.5 text-[11px] italic text-slate-400 dark:text-slate-500">
                                                                    "{def.example}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}

                                    {/* Synonyms quick view */}
                                    {result.meanings?.[0]?.synonyms?.length > 0 && (
                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Synonyms</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {result.meanings[0].synonyms.slice(0, 5).map((syn, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => { setQuery(syn); searchWord(syn); }}
                                                        className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-[#1a3884] dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer"
                                                    >
                                                        {syn}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingDictionary;
