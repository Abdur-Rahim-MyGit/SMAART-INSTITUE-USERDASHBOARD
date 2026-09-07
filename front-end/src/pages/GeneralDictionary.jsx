import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
// Material Symbols barrel -- the icon set the dashboard, courses and
// assessments pages use, so this page's glyphs sit at the same weight
// instead of the heavier Tabler set it used before.
import {
  Search,
  Volume2,
  BookOpen,
  Star,
  ArrowRight,
  Loader2,
  Sparkles,
  Shield,
  IconArrowLeft as ArrowLeft,
} from "@/components/icons";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import NeuralBackground from "@/components/ui/NeuralBackground";
import PageTransition from "@/components/PageTransition";
import { isBlockedWord } from "@/constants/dictionaryBlocklist";

const translateText = async (text, targetLang) => {
  if (!text || targetLang === "en") return text;
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
    if (!res.ok) return text;
    const data = await res.json();
    return data.responseData?.translatedText || text;
  } catch (e) {
    console.error("Translation error:", e);
    return text;
  }
};

const translateDefinition = async (definitionData, targetLang) => {
  if (!definitionData || targetLang === "en") return definitionData;
  try {
    const translatedWord = await translateText(definitionData.word, targetLang);
    const translatedMeanings = await Promise.all(
      definitionData.meanings.map(async (meaning) => {
        const translatedPartOfSpeech = await translateText(meaning.partOfSpeech, targetLang);
        const translatedDefs = await Promise.all(
          meaning.definitions.map(async (def) => {
            const translatedDef = await translateText(def.definition, targetLang);
            const translatedEx = def.example ? await translateText(def.example, targetLang) : "";
            return { definition: translatedDef, example: translatedEx };
          })
        );
        return { partOfSpeech: translatedPartOfSpeech, definitions: translatedDefs };
      })
    );
    return {
      ...definitionData,
      word: translatedWord,
      meanings: translatedMeanings,
      originalWord: definitionData.originalWord || definitionData.word,
    };
  } catch (err) {
    console.error("Error translating definition:", err);
    return definitionData;
  }
};

// A month-long pool so the daily pick barely repeats. Seeded off the
// calendar date (not Math.random) so it's the same word all day for
// everyone, and only rolls over at midnight -- an actual "day".
const WORD_OF_DAY_POOL = [
  "serendipity", "ephemeral", "resilience", "eloquent", "mellifluous",
  "pragmatic", "innovate", "empathy", "diligent", "candid", "meticulous",
  "tenacity", "versatile", "articulate", "cognizant", "collaborate",
  "initiative", "integrity", "leverage", "proactive", "synergy",
  "adaptability", "credible", "efficient", "insight", "rapport",
  "aptitude", "benchmark", "cohesive", "discern", "facilitate",
];

const getWordOfTheDay = () => {
  const now = new Date();
  const dayNumber = Math.floor(now.getTime() / 86400000);
  return WORD_OF_DAY_POOL[dayNumber % WORD_OF_DAY_POOL.length];
};

// Quick-start chips shown before anyone has searched anything, so the
// results panel never opens on a blank card with nothing to click.
const QUICK_SEARCH_SUGGESTIONS = ["Empathy", "Agile", "Resilience", "Cognitive", "Integrity", "Synergy"];

const GeneralDictionary = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [definition, setDefinition] = useState(null);
  const [synonyms, setSynonyms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [wordOfDay, setWordOfDay] = useState(null);
  const selectedLang = i18n.language || "en";

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
    fetchData(getWordOfTheDay(), true);
  }, []);

  useEffect(() => {
    if (definition) fetchData(definition.originalWord || definition.word, false, selectedLang);
    if (wordOfDay) fetchData(wordOfDay.originalWord || wordOfDay.word, true, selectedLang);
  }, [selectedLang]);

  const fetchData = async (word, isDaily = false, lang = selectedLang) => {
    if (!word) return;
    // Never sends profanity/slurs to the definition API or shows them --
    // this is a student product, so those words are refused outright.
    if (!isDaily && isBlockedWord(word)) {
      setLoading(false);
      setError(null);
      setDefinition(null);
      setSynonyms([]);
      setBlocked(true);
      return;
    }
    setLoading(!isDaily);
    setError(null);
    if (!isDaily) {
      setSynonyms([]);
      setBlocked(false);
    }
    try {
      const defRes = await fetch(`https://freedictionaryapi.com/api/v1/entries/en/${word.toLowerCase()}`);
      if (!defRes.ok) throw new Error("Word not found");
      const defData = await defRes.json();
      if (!defData.entries || defData.entries.length === 0) throw new Error("No definitions found.");

      const transformedData = {
        word: defData.word,
        phonetic: defData.entries?.[0]?.pronunciations?.[0]?.text || "",
        phonetics: defData.entries?.[0]?.pronunciations?.map(p => ({ text: p.text, audio: p.audio })) || [],
        meanings: defData.entries?.map(entry => {
          const allDefinitions = [];
          entry.senses?.forEach(sense => {
            if (sense.definition) allDefinitions.push({ definition: sense.definition, example: sense.examples?.[0] });
            sense.subsenses?.forEach(sub => {
              if (sub.definition) allDefinitions.push({ definition: sub.definition, example: sub.examples?.[0] });
            });
          });
          return { partOfSpeech: entry.partOfSpeech, definitions: allDefinitions };
        }) || [],
      };

      let finalData = transformedData;
      if (lang !== "en") finalData = await translateDefinition(transformedData, lang);

      const synRes = await fetch(`https://api.datamuse.com/words?rel_syn=${word}&max=10`);
      const synData = await synRes.json();
      const rawSynonyms = synData.map(s => s.word);
      let finalSynonyms = rawSynonyms;
      if (lang !== "en" && rawSynonyms.length > 0) {
        finalSynonyms = await Promise.all(rawSynonyms.map(syn => translateText(syn, lang)));
      }

      if (isDaily) {
        setWordOfDay(finalData);
      } else {
        setDefinition(finalData);
        setSynonyms(finalSynonyms);
      }
    } catch (err) {
      if (!isDaily) setError("Could not find definition. Try another word.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    setLoading(true);
    let englishSearchWord = searchTerm;
    if (selectedLang !== "en") {
      try {
        const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(searchTerm)}&langpair=${selectedLang}|en`);
        if (r.ok) {
          const d = await r.json();
          const t = d.responseData?.translatedText;
          if (t && t !== searchTerm) englishSearchWord = t;
        }
      } catch (err) { console.error(err); }
    }
    fetchData(englishSearchWord);
  };

  // Not every entry from the dictionary API ships a recorded clip, so a
  // word without one falls back to the browser's built-in speech engine --
  // every word gets a pronunciation, not just the ones the API recorded.
  const speakWord = (word) => {
    if (!word) return;
    if (!("speechSynthesis" in window)) {
      toast.error(t("general_dictionary.audio_unavailable", "Audio not available"));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const playAudio = (audioUrl, fallbackWord) => {
    if (audioUrl) {
      new Audio(audioUrl).play().catch(() => speakWord(fallbackWord));
    } else {
      speakWord(fallbackWord);
    }
  };

  return (
    <PageTransition>
    <div className="relative min-h-screen overflow-hidden bg-transparent pb-12 transition-colors duration-300">
      {/* Same ambient layer as the dashboard, courses and assessments pages */}
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
          transition={{ duration: 0.3 }}
          onClick={() => navigate("/dashboard/smaart-toolkit")}
          className="group mb-5 flex items-center gap-3 w-fit selection:bg-transparent"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7ebf5] bg-white shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-white/10 dark:bg-white/5">
            <ArrowLeft className="h-4 w-4 text-[#034a7d] transition-transform group-hover:-translate-x-0.5 dark:text-slate-300" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#034a7d] transition-colors group-hover:text-[#045C9A] dark:text-[#A6D7E8] dark:group-hover:text-white">
            {t("general_dictionary.back_to_toolkit", "Back to Toolkit")}
          </span>
        </motion.button>

        {/* Hero -- same structure, padding and type scale as the courses
            and assessments hero, so all three read as one product. */}
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
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1
                  className="text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {t("general_dictionary.title_1", "General")}{" "}
                  <span className="text-[#045C9A] dark:text-[#A6D7E8]">{t("general_dictionary.title_2", "Dictionary")}</span>
                </h1>
                <p className="mt-0.5 text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">
                  {t("general_dictionary.subtitle", "Definitions, phonetics & synonyms — all in one place.")}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Search Bar */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex items-center gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("general_dictionary.search_placeholder", "Search for a word…")}
              className="w-full rounded-xl border border-[#d7ebf5] bg-white py-3 pl-11 pr-4 text-sm font-medium text-[#072036] shadow-sm outline-none transition-all focus:border-[#045C9A] focus:ring-2 focus:ring-[#045C9A]/15 dark:border-white/10 dark:bg-[#0d3a5f] dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchTerm}
            className="flex items-center gap-2 rounded-xl bg-[#045C9A] px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#072036] active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {loading ? t("general_dictionary.searching", "Searching…") : t("general_dictionary.search", "Search")}
            </span>
          </button>
        </motion.form>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* LEFT: Results */}
          <div className="space-y-4 lg:col-span-2">

            {/* Blocked word */}
            {blocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-[#d7ebf5] bg-white p-6 text-center dark:border-white/10 dark:bg-[#0d3a5f]"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EAF7FD] dark:bg-[#045C9A]/20">
                  <Shield className="h-5 w-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                </div>
                <h3 className="text-sm font-bold text-[#072036] dark:text-white">{t("general_dictionary.blocked_title", "Word Not Available")}</h3>
                <p className="mt-1 text-xs text-[#35566b] dark:text-slate-400">
                  {t("general_dictionary.blocked_desc", "We keep this dictionary appropriate for everyone, so this word can't be looked up here. Try another word.")}
                </p>
                <button
                  onClick={() => { setBlocked(false); setSearchTerm(""); }}
                  className="mt-3 text-xs font-bold text-[#045C9A] hover:underline dark:text-[#A6D7E8]"
                >
                  {t("general_dictionary.clear_search", "Clear Search")}
                </button>
              </motion.div>
            )}

            {/* Error */}
            {error && !blocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-[#d7ebf5] bg-white p-6 text-center dark:border-white/10 dark:bg-[#0d3a5f]"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10">
                  <Search className="h-5 w-5 text-rose-400" />
                </div>
                <h3 className="text-sm font-bold text-[#072036] dark:text-white">{t("general_dictionary.word_not_found", "Word Not Found")}</h3>
                <p className="mt-1 text-xs text-[#35566b] dark:text-slate-400">
                  {t("general_dictionary.not_found_desc", "Couldn't find “{{word}}”. Check spelling or try another word.", { word: searchTerm })}
                </p>
                <button
                  onClick={() => { setError(null); setSearchTerm(""); }}
                  className="mt-3 text-xs font-bold text-[#045C9A] hover:underline dark:text-[#A6D7E8]"
                >
                  {t("general_dictionary.clear_search", "Clear Search")}
                </button>
              </motion.div>
            )}

            {/* Empty state -- a quick-start row instead of a bare card, so
                the panel never opens on nothing to click. */}
            {!definition && !loading && !error && !blocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-[#d7ebf5] bg-white/60 p-8 text-center dark:border-white/10 dark:bg-[#0d3a5f]/60 sm:p-10"
              >
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d7ebf5] bg-[#EAF7FD] dark:border-[#045C9A]/30 dark:bg-[#045C9A]/20">
                  <BookOpen className="h-6 w-6 text-[#045C9A] dark:text-[#A6D7E8]" />
                </div>
                <p className="text-sm font-semibold text-[#35566b] dark:text-slate-400">
                  {t("general_dictionary.empty_before", "Type a word above and press")}{" "}
                  <span className="text-[#045C9A] dark:text-[#A6D7E8]">{t("general_dictionary.search", "Search")}</span>{" "}
                  {t("general_dictionary.empty_after", "to see its definition")}
                </p>

                <div className="mx-auto mt-6 max-w-md border-t border-[#EAF7FD] pt-5 dark:border-white/10">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#045C9A]/70 dark:text-[#A6D7E8]/70">
                    {t("general_dictionary.try_one", "Or try one of these")}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {QUICK_SEARCH_SUGGESTIONS.map((word) => (
                      <button
                        key={word}
                        onClick={() => { setSearchTerm(word); fetchData(word); }}
                        className="rounded-lg border border-[#d7ebf5] bg-white px-3 py-1.5 text-xs font-semibold text-[#072036] transition-all hover:border-transparent hover:bg-[#045C9A] hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-[#045C9A] dark:hover:text-white"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="animate-pulse space-y-4 rounded-2xl border border-[#d7ebf5] bg-white p-6 dark:border-white/10 dark:bg-[#0d3a5f]">
                <div className="h-7 w-1/3 rounded-lg bg-[#F1F5F9] dark:bg-white/5" />
                <div className="h-4 w-1/4 rounded-lg bg-[#F1F5F9] dark:bg-white/5" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full rounded bg-[#F1F5F9] dark:bg-white/5" />
                  <div className="h-3.5 w-5/6 rounded bg-[#F1F5F9] dark:bg-white/5" />
                  <div className="h-3.5 w-4/6 rounded bg-[#F1F5F9] dark:bg-white/5" />
                </div>
              </div>
            )}

            {/* Definition Result */}
            <AnimatePresence mode="wait">
              {definition && !loading && (
                <motion.div
                  key={definition.word}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="space-y-4"
                >
                  {/* Word Card */}
                  <div className="overflow-hidden rounded-2xl border border-[#d7ebf5] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0d3a5f] sm:p-6">
                    {/* Word + phonetics row */}
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-extrabold capitalize leading-tight tracking-tight text-[#072036] dark:text-white">
                          {definition.word}
                          {definition.originalWord && definition.originalWord.toLowerCase() !== definition.word.toLowerCase() && (
                            <span className="ml-2 text-sm font-normal capitalize text-slate-400">
                              ({definition.originalWord})
                            </span>
                          )}
                        </h2>
                        <div className="mt-1.5 flex items-center gap-2">
                          {definition.phonetic && (
                            <span className="font-mono text-[13px] text-[#045C9A] dark:text-[#A6D7E8]">{definition.phonetic}</span>
                          )}
                          <button
                            onClick={() => playAudio(definition.phonetics.find(p => p.audio)?.audio, definition.originalWord || definition.word)}
                            title={t("general_dictionary.play_pronunciation", "Play pronunciation")}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d7ebf5] bg-[#EAF7FD] text-[#045C9A] transition-all hover:border-transparent hover:bg-[#045C9A] hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-[#A6D7E8] dark:hover:bg-[#A6D7E8] dark:hover:text-[#072036]"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <button className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] text-slate-400 transition-all hover:border-amber-300 hover:text-amber-500 dark:border-white/10 dark:bg-white/5">
                        <Star className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Meanings */}
                    <div className="space-y-5">
                      {definition.meanings.map((meaning, index) => (
                        <div key={index} className="border-t border-[#EAF7FD] pt-4 first:border-0 first:pt-0 dark:border-white/10">
                          <div className="mb-3 flex items-center gap-2">
                            <span className="rounded-full border border-[#045C9A]/20 bg-[#EAF7FD] px-2.5 py-0.5 text-[10.5px] font-bold italic tracking-wide text-[#045C9A] dark:border-[#A6D7E8]/20 dark:bg-white/5 dark:text-[#A6D7E8]">
                              {meaning.partOfSpeech}
                            </span>
                            <div className="h-px flex-1 bg-[#EAF7FD] dark:bg-white/10" />
                          </div>
                          <ul className="space-y-2.5">
                            {meaning.definitions.slice(0, 3).map((def, idx) => (
                              <li key={idx} className="flex gap-2.5 text-[13px] leading-relaxed text-[#35566b] dark:text-slate-300">
                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#045C9A] dark:bg-[#A6D7E8]" />
                                <span>
                                  {def.definition}
                                  {def.example && (
                                    <span className="mt-1.5 block border-l-2 border-[#d7ebf5] pl-3 text-xs italic text-slate-400 dark:border-white/10 dark:text-slate-500">
                                      &ldquo;{def.example}&rdquo;
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

                  {/* Synonyms */}
                  {synonyms.length > 0 && (
                    <div className="rounded-2xl border border-[#d7ebf5] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0d3a5f]">
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#045C9A] dark:text-[#A6D7E8]" />
                        <h3 className="text-sm font-bold text-[#072036] dark:text-white">{t("general_dictionary.synonyms_title", "Synonyms & Related Words")}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {synonyms.map(syn => (
                          <button
                            key={syn}
                            onClick={() => { setSearchTerm(syn); fetchData(syn); }}
                            className="rounded-lg border border-[#d7ebf5] bg-[#F1F5F9] px-3 py-1.5 text-xs font-semibold capitalize text-[#072036] transition-all hover:border-transparent hover:bg-[#045C9A] hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-[#045C9A] dark:hover:text-white"
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

          {/* RIGHT: Sidebar */}
          <div className="space-y-4">

            {/* Word of the Day */}
            {wordOfDay && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="overflow-hidden rounded-2xl border border-[#d7ebf5] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0d3a5f]"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 text-amber-400" style={{ fill: "currentColor" }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#045C9A] dark:text-[#A6D7E8]">{t("general_dictionary.word_of_day", "Word of the Day")}</span>
                </div>
                <h3 className="text-lg font-extrabold capitalize leading-tight text-[#072036] dark:text-white">
                  {wordOfDay.word}
                </h3>
                <div className="mt-0.5 flex items-center gap-2">
                  {wordOfDay.phonetic && (
                    <p className="font-mono text-xs text-[#045C9A] dark:text-[#A6D7E8]">{wordOfDay.phonetic}</p>
                  )}
                  <button
                    onClick={() => playAudio(wordOfDay.phonetics.find(p => p.audio)?.audio, wordOfDay.originalWord || wordOfDay.word)}
                    title={t("general_dictionary.play_pronunciation", "Play pronunciation")}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-[#d7ebf5] bg-[#EAF7FD] text-[#045C9A] transition-all hover:border-transparent hover:bg-[#045C9A] hover:text-white dark:border-white/10 dark:bg-white/5 dark:text-[#A6D7E8] dark:hover:bg-[#A6D7E8] dark:hover:text-[#072036]"
                  >
                    <Volume2 className="h-3 w-3" />
                  </button>
                </div>
                <p className="mt-3 line-clamp-3 text-[12.5px] leading-relaxed text-[#35566b] dark:text-slate-400">
                  {wordOfDay.meanings[0]?.definitions[0]?.definition}
                </p>
                <button
                  onClick={() => { setSearchTerm(wordOfDay.originalWord || wordOfDay.word); fetchData(wordOfDay.originalWord || wordOfDay.word); }}
                  className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#045C9A] transition-all hover:gap-2.5 dark:text-[#A6D7E8]"
                >
                  {t("general_dictionary.learn_more", "Learn more")} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}

            {/* Trending Words */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-[#d7ebf5] bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0d3a5f]"
            >
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#045C9A] dark:text-[#A6D7E8]" />
                <h3 className="text-sm font-bold text-[#072036] dark:text-white">{t("general_dictionary.trending_words", "Trending Words")}</h3>
              </div>
              <div className="space-y-1">
                {["Resilience", "Empathy", "Agile", "Cognitive", "Paradigm"].map((item) => (
                  <button
                    key={item}
                    onClick={async () => {
                      let translatedItem = item;
                      if (selectedLang !== "en") {
                        try { translatedItem = await translateText(item, selectedLang); } catch (err) { console.error(err); }
                      }
                      setSearchTerm(translatedItem);
                      fetchData(item);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[12.5px] font-semibold text-[#35566b] transition-all hover:bg-[#EAF7FD] hover:text-[#045C9A] dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-[#A6D7E8]"
                  >
                    <span>{item}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                  </button>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default GeneralDictionary;
