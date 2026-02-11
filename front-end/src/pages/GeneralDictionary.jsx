import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Volume2, Book, Star, Share2, ArrowRight, Loader2, Sparkles } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { toast } from "sonner";

const GeneralDictionary = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [definition, setDefinition] = useState(null);
  const [synonyms, setSynonyms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wordOfDay, setWordOfDay] = useState(null);

  // Fetch Word of the Day (Mock for now, random from list)
  useEffect(() => {
    const words = ["serendipity", "ephemeral", "resilience", "eloquent", "mellifluous", "pragmatic", "innovate"];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    fetchData(randomWord, true);
  }, []);

  const fetchData = async (word, isDaily = false) => {
    if (!word) return;
    setLoading(!isDaily);
    setError(null);
    setSynonyms([]);

    try {
      // 1. Fetch Definition
      const defRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (!defRes.ok) throw new Error("Word not found");
      const defData = await defRes.json();

      // 2. Fetch Synonyms (Datamuse API)
      const synRes = await fetch(`https://api.datamuse.com/words?rel_syn=${word}&max=10`);
      const synData = await synRes.json();

      if (isDaily) {
        setWordOfDay(defData[0]);
      } else {
        setDefinition(defData[0]);
        setSynonyms(synData.map(s => s.word));
      }
    } catch (err) {
      if (!isDaily) setError("Could not find definition. Try another word.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData(searchTerm);
  };

  const playAudio = (audioUrl) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => toast.error("Audio playback error"));
    } else {
      toast.error("Audio not available");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <DashboardSidebar />

      <div className="min-h-screen transition-all duration-300">
        <DashboardHeader />

        <main className="container mx-auto px-4 md:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-display font-bold text-slate-800 dark:text-white mb-2">
              General Dictionary
            </h1>
            <p className="text-slate-600 dark:text-slate-400">Master professional terminology with our interactive reference tool.</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Search Section */}
            <div className="lg:col-span-2 space-y-6">
              <motion.form
                onSubmit={handleSearch}
                className="relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for a word..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 shadow-sm text-lg"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                <button
                  type="submit"
                  disabled={loading || !searchTerm}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Searching..." : "Search"}
                </button>
              </motion.form>

              {/* Error State */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                >
                  {error}
                </motion.div>
              )}

              {/* Definition Result */}
              <AnimatePresence mode="wait">
                {definition && !loading && (
                  <motion.div
                    key={definition.word}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Main Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h2 className="text-4xl font-bold capitalize text-slate-900 dark:text-white mb-2">
                            {definition.word}
                          </h2>
                          <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400 font-mono text-lg">
                            <span>{definition.phonetic}</span>
                            {definition.phonetics.find(p => p.audio) && (
                              <button
                                onClick={() => playAudio(definition.phonetics.find(p => p.audio).audio)}
                                className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-full transition-colors"
                              >
                                <Volume2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <button className="p-2 text-slate-400 hover:text-yellow-500 transition-colors">
                          <Star className="w-6 h-6" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        {definition.meanings.map((meaning, index) => (
                          <div key={index} className="border-b border-slate-100 dark:border-slate-700 last:border-0 pb-6 last:pb-0">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-semibold rounded-full italic">
                                {meaning.partOfSpeech}
                              </span>
                              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-700" />
                            </div>

                            <ul className="space-y-3">
                              {meaning.definitions.slice(0, 3).map((def, idx) => (
                                <li key={idx} className="text-slate-700 dark:text-slate-300 flex gap-2">
                                  <span className="text-purple-400 mt-1.5 min-w-[6px]">•</span>
                                  <span>
                                    {def.definition}
                                    {def.example && (
                                      <span className="block text-slate-500 dark:text-slate-500 italic mt-1 text-sm border-l-2 border-slate-200 pl-3 py-1">
                                        "{def.example}"
                                      </span>
                                    )}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Synonyms Card */}
                    {synonyms.length > 0 && (
                      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-yellow-500" /> Synonyms & Related Words
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {synonyms.map(syn => (
                            <button
                              key={syn}
                              onClick={() => {
                                setSearchTerm(syn);
                                fetchData(syn);
                              }}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900/40 dark:hover:text-purple-300 rounded-lg text-sm text-slate-700 dark:text-slate-300 transition-colors capitalize"
                            >
                              {syn}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sidebar / Word of the Day */}
            <div className="space-y-6">
              {wordOfDay && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                  <div className="flex items-center gap-2 mb-4 text-purple-200 text-sm font-semibold tracking-wider uppercase">
                    <Star className="w-4 h-4" /> Word of the Day
                  </div>

                  <h3 className="text-3xl font-bold mb-2 capitalize">{wordOfDay.word}</h3>
                  <p className="text-purple-100 mb-6 italic font-serif">
                    {wordOfDay.phonetic}
                  </p>

                  <p className="text-white/90 mb-6 line-clamp-3">
                    {wordOfDay.meanings[0]?.definitions[0]?.definition}
                  </p>

                  <button
                    onClick={() => {
                      setSearchTerm(wordOfDay.word);
                      setDefinition(wordOfDay);
                      // Also fetch synonyms for it
                      fetch(`https://api.datamuse.com/words?rel_syn=${wordOfDay.word}&max=10`)
                        .then(r => r.json())
                        .then(d => setSynonyms(d.map(s => s.word)));
                    }}
                    className="flex items-center gap-2 text-sm font-medium hover:text-white/80 transition-colors"
                  >
                    Learn more <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Quick Links */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Book className="w-4 h-4" /> Trending Words
                </h3>
                <div className="space-y-2">
                  {["Resilience", "Empathy", "Agile", "Cognitive", "Paradigm"].map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setSearchTerm(item);
                        fetchData(item);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default GeneralDictionary;
