import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconSearch as Search,
  IconVolume as Volume2,
  IconBook as Book,
  IconStar as Star,
  IconArrowRight as ArrowRight,
  IconLoader2 as Loader2,
  IconSparkles as Sparkles,
  IconArrowLeft as ArrowLeft
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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

const GeneralDictionary = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [definition, setDefinition] = useState(null);
  const [synonyms, setSynonyms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wordOfDay, setWordOfDay] = useState(null);
  const selectedLang = i18n.language || "en";

  useEffect(() => {
    const words = ["serendipity", "ephemeral", "resilience", "eloquent", "mellifluous", "pragmatic", "innovate"];
    fetchData(words[Math.floor(Math.random() * words.length)], true);
  }, []);

  useEffect(() => {
    if (definition) fetchData(definition.originalWord || definition.word, false, selectedLang);
    if (wordOfDay) fetchData(wordOfDay.originalWord || wordOfDay.word, true, selectedLang);
  }, [selectedLang]);

  const fetchData = async (word, isDaily = false, lang = selectedLang) => {
    if (!word) return;
    setLoading(!isDaily);
    setError(null);
    if (!isDaily) setSynonyms([]);
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

  const playAudio = (audioUrl) => {
    if (audioUrl) {
      new Audio(audioUrl).play().catch(() => toast.error(t("general_dictionary.audio_error", "Audio playback error")));
    } else {
      toast.error(t("general_dictionary.audio_unavailable", "Audio not available"));
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-12 pt-0 transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => navigate("/dashboard/smaart-toolkit")}
          className="group mt-4 mb-5 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#1a3884]/70 transition-all hover:text-[#1a3884] dark:text-slate-400 dark:hover:text-slate-200"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8e6f7] bg-white shadow-sm transition-all duration-200 group-hover:-translate-x-0.5 group-hover:shadow-md dark:border-[#1a3884]/30 dark:bg-[#001a3d]">
            <ArrowLeft stroke={1.5} className="h-4 w-4" />
          </div>
          {t("general_dictionary.back_to_toolkit", "Back to Toolkit")}
        </motion.button>

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative mb-6 overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)]"
        >
          <div className="relative z-10">
            <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
              {t("general_dictionary.title_1", "General")} <span className="text-[#1a3884] dark:text-blue-300">{t("general_dictionary.title_2", "Dictionary")}</span>
            </h1>
            <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              {t("general_dictionary.subtitle", "Definitions, phonetics & synonyms — all in one place.")}
            </p>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.form
          onSubmit={handleSearch}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("general_dictionary.search_placeholder", "Search for a word…")}
              className="w-full rounded-xl border border-[#d8e6f7] bg-white py-3 pl-11 pr-4 text-[14px] font-medium text-[#0d1f4e] shadow-[0_2px_8px_rgba(26,56,132,0.06)] outline-none transition-all focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/15 dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchTerm}
            className="flex items-center gap-2 rounded-xl bg-[#1a3884] px-5 py-3 text-[13px] font-bold text-white shadow-md transition-all hover:bg-[#132c6b] active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? t("general_dictionary.searching", "Searching…") : t("general_dictionary.search", "Search")}
          </button>
        </motion.form>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* LEFT: Results */}
          <div className="space-y-4 lg:col-span-2">

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-red-100 bg-white p-6 text-center dark:border-red-500/20 dark:bg-[#001a3d]"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
                  <Search className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-[14px] font-bold text-[#0d1f4e] dark:text-white">{t("general_dictionary.word_not_found", "Word Not Found")}</h3>
                <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
                  {t("general_dictionary.not_found_desc", "Couldn't find “{{word}}”. Check spelling or try another word.", { word: searchTerm })}
                </p>
                <button
                  onClick={() => { setError(null); setSearchTerm(""); }}
                  className="mt-3 text-[12px] font-semibold text-[#1a3884] hover:underline dark:text-blue-400"
                >
                  {t("general_dictionary.clear_search", "Clear Search")}
                </button>
              </motion.div>
            )}

            {/* Empty state */}
            {!definition && !loading && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-[#d8e6f7] bg-white/60 p-10 text-center dark:border-[#1a3884]/20 dark:bg-[#001a3d]/60"
              >
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef4ff] dark:bg-[#1a3884]/15">
                  <Book className="h-6 w-6 text-[#1a3884] dark:text-blue-400" />
                </div>
                <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                  {t("general_dictionary.empty_before", "Type a word above and press")}{" "}
                  <span className="text-[#1a3884] dark:text-blue-300">{t("general_dictionary.search", "Search")}</span>{" "}
                  {t("general_dictionary.empty_after", "to see its definition")}
                </p>
              </motion.div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="animate-pulse space-y-4 rounded-2xl border border-[#d8e6f7] bg-white p-6 dark:border-[#1a3884]/20 dark:bg-[#001a3d]">
                <div className="h-7 w-1/3 rounded-lg bg-slate-100 dark:bg-slate-700" />
                <div className="h-4 w-1/4 rounded-lg bg-slate-100 dark:bg-slate-700" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full rounded bg-slate-100 dark:bg-slate-700" />
                  <div className="h-3.5 w-5/6 rounded bg-slate-100 dark:bg-slate-700" />
                  <div className="h-3.5 w-4/6 rounded bg-slate-100 dark:bg-slate-700" />
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
                  <div className="overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001a3d]">
                    <div className="h-[3px] w-full bg-gradient-to-r from-[#1a3884] via-[#2656c8] to-[#1a3884]" />
                    <div className="p-5 sm:p-6">
                      {/* Word + phonetics row */}
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                          <h2 className="text-[22px] font-extrabold capitalize leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
                            {definition.word}
                            {definition.originalWord && definition.originalWord.toLowerCase() !== definition.word.toLowerCase() && (
                              <span className="ml-2 text-[14px] font-normal capitalize text-slate-400">
                                ({definition.originalWord})
                              </span>
                            )}
                          </h2>
                          <div className="mt-1 flex items-center gap-2">
                            {definition.phonetic && (
                              <span className="font-mono text-[13px] text-[#1a3884] dark:text-blue-400">{definition.phonetic}</span>
                            )}
                            {definition.phonetics.find(p => p.audio) && (
                              <button
                                onClick={() => playAudio(definition.phonetics.find(p => p.audio).audio)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef4ff] text-[#1a3884] transition-all hover:bg-[#1a3884] hover:text-white dark:bg-[#1a3884]/15 dark:text-blue-400 dark:hover:bg-[#1a3884] dark:hover:text-white"
                              >
                                <Volume2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <button className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#d8e6f7] bg-[#f5f8ff] text-slate-400 transition-all hover:border-yellow-300 hover:text-yellow-500 dark:border-[#1a3884]/20 dark:bg-[#001630]">
                          <Star className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Meanings */}
                      <div className="space-y-5">
                        {definition.meanings.map((meaning, index) => (
                          <div key={index} className="border-t border-[#e8f0fb] pt-4 first:border-0 first:pt-0 dark:border-[#1a3884]/15">
                            <div className="mb-3 flex items-center gap-2">
                              <span className="rounded-full border border-[#1a3884]/20 bg-[#eef4ff] px-2.5 py-0.5 text-[10.5px] font-bold italic tracking-wide text-[#1a3884] dark:border-blue-400/20 dark:bg-[#1a3884]/15 dark:text-blue-400">
                                {meaning.partOfSpeech}
                              </span>
                              <div className="h-px flex-1 bg-[#e8f0fb] dark:bg-[#1a3884]/15" />
                            </div>
                            <ul className="space-y-2.5">
                              {meaning.definitions.slice(0, 3).map((def, idx) => (
                                <li key={idx} className="flex gap-2.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1a3884] dark:bg-blue-400" />
                                  <span>
                                    {def.definition}
                                    {def.example && (
                                      <span className="mt-1.5 block border-l-2 border-[#d8e6f7] pl-3 text-[12px] italic text-slate-400 dark:border-[#1a3884]/30 dark:text-slate-500">
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
                  </div>

                  {/* Synonyms */}
                  {synonyms.length > 0 && (
                    <div className="rounded-2xl border border-[#d8e6f7] bg-white p-5 shadow-[0_2px_8px_rgba(26,56,132,0.05)] dark:border-[#1a3884]/20 dark:bg-[#001a3d]">
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <h3 className="text-[13px] font-bold text-[#0d1f4e] dark:text-white">{t("general_dictionary.synonyms_title", "Synonyms & Related Words")}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {synonyms.map(syn => (
                          <button
                            key={syn}
                            onClick={() => { setSearchTerm(syn); fetchData(syn); }}
                            className="rounded-lg border border-[#d8e6f7] bg-[#f5f8ff] px-3 py-1.5 text-[12px] font-semibold capitalize text-[#0d1f4e] transition-all hover:border-[#1a3884] hover:bg-[#1a3884] hover:text-white dark:border-[#1a3884]/20 dark:bg-[#001630] dark:text-slate-300 dark:hover:bg-[#1a3884] dark:hover:text-white"
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
                className="overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001a3d]"
              >
                <div className="h-[3px] w-full bg-gradient-to-r from-[#1a3884] via-[#2656c8] to-[#1a3884]" />
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a3884] dark:text-blue-400">{t("general_dictionary.word_of_day", "Word of the Day")}</span>
                  </div>
                  <h3 className="text-[20px] font-extrabold capitalize leading-tight text-[#0d1f4e] dark:text-white">
                    {wordOfDay.word}
                  </h3>
                  {wordOfDay.phonetic && (
                    <p className="mt-0.5 font-mono text-[12px] text-[#1a3884] dark:text-blue-400">{wordOfDay.phonetic}</p>
                  )}
                  <p className="mt-3 line-clamp-3 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {wordOfDay.meanings[0]?.definitions[0]?.definition}
                  </p>
                  <button
                    onClick={() => { setSearchTerm(wordOfDay.originalWord || wordOfDay.word); fetchData(wordOfDay.originalWord || wordOfDay.word); }}
                    className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-[#1a3884] transition-all hover:gap-2.5 dark:text-blue-400"
                  >
                    {t("general_dictionary.learn_more", "Learn more")} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Trending Words */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-[#d8e6f7] bg-white p-5 shadow-[0_2px_8px_rgba(26,56,132,0.05)] dark:border-[#1a3884]/20 dark:bg-[#001a3d]"
            >
              <div className="mb-3 flex items-center gap-2">
                <Book className="h-4 w-4 text-[#1a3884] dark:text-blue-400" />
                <h3 className="text-[13px] font-bold text-[#0d1f4e] dark:text-white">{t("general_dictionary.trending_words", "Trending Words")}</h3>
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
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[12.5px] font-semibold text-slate-600 transition-all hover:bg-[#eef4ff] hover:text-[#1a3884] dark:text-slate-300 dark:hover:bg-[#1a3884]/15 dark:hover:text-blue-300"
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
  );
};

export default GeneralDictionary;
