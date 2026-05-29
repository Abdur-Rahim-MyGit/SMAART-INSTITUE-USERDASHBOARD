import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Volume2, Book, Star, Share2, ArrowRight, Loader2, Sparkles, ArrowLeft } from "lucide-react";
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
            return {
              definition: translatedDef,
              example: translatedEx
            };
          })
        );
        return {
          partOfSpeech: translatedPartOfSpeech,
          definitions: translatedDefs
        };
      })
    );

    return {
      ...definitionData,
      word: translatedWord,
      meanings: translatedMeanings,
      originalWord: definitionData.originalWord || definitionData.word
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

  // Fetch Word of the Day (Mock for now, random from list)
  useEffect(() => {
    const words = ["serendipity", "ephemeral", "resilience", "eloquent", "mellifluous", "pragmatic", "innovate"];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    fetchData(randomWord, true);
  }, []);

  // Sync translation when global i18n navbar dropdown changes language
  useEffect(() => {
    if (definition) {
      const queryWord = definition.originalWord || definition.word;
      fetchData(queryWord, false, selectedLang);
    }
    if (wordOfDay) {
      const dailyWord = wordOfDay.originalWord || wordOfDay.word;
      fetchData(dailyWord, true, selectedLang);
    }
  }, [selectedLang]);

  const fetchData = async (word, isDaily = false, lang = selectedLang) => {
    if (!word) return;
    setLoading(!isDaily);
    setError(null);
    if (!isDaily) setSynonyms([]);

    try {
      // 1. Fetch Definition in English
      const defRes = await fetch(`https://freedictionaryapi.com/api/v1/entries/en/${word.toLowerCase()}`);
      if (!defRes.ok) throw new Error("Word not found");
      const defData = await defRes.json();

      if (!defData.entries || defData.entries.length === 0) {
        throw new Error("No definitions found for this word.");
      }

      // Transform structure
      const transformedData = {
        word: defData.word,
        phonetic: defData.entries?.[0]?.pronunciations?.[0]?.text || "",
        phonetics: defData.entries?.[0]?.pronunciations?.map(p => ({
          text: p.text,
          audio: p.audio
        })) || [],
        meanings: defData.entries?.map(entry => {
          const allDefinitions = [];
          entry.senses?.forEach(sense => {
            if (sense.definition) {
              allDefinitions.push({
                definition: sense.definition,
                example: sense.examples?.[0]
              });
            }
            sense.subsenses?.forEach(sub => {
              if (sub.definition) {
                allDefinitions.push({
                  definition: sub.definition,
                  example: sub.examples?.[0]
                });
              }
            });
          });

          return {
            partOfSpeech: entry.partOfSpeech,
            definitions: allDefinitions
          };
        }) || []
      };

      // 2. Translate if needed
      let finalData = transformedData;
      if (lang !== "en") {
        finalData = await translateDefinition(transformedData, lang);
      }

      // 3. Fetch and translate Synonyms (Datamuse API)
      const synRes = await fetch(`https://api.datamuse.com/words?rel_syn=${word}&max=10`);
      const synData = await synRes.json();
      const rawSynonyms = synData.map(s => s.word);

      let finalSynonyms = rawSynonyms;
      if (lang !== "en" && rawSynonyms.length > 0) {
        finalSynonyms = await Promise.all(
          rawSynonyms.map(syn => translateText(syn, lang))
        );
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

    // Translate search term to English first if user entered query in localized language
    if (selectedLang !== "en") {
      try {
        const translateRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(searchTerm)}&langpair=${selectedLang}|en`);
        if (translateRes.ok) {
          const translateData = await translateRes.json();
          const translated = translateData.responseData?.translatedText;
          if (translated && translated !== searchTerm) {
            englishSearchWord = translated;
          }
        }
      } catch (err) {
        console.error("Search translation error:", err);
      }
    }

    fetchData(englishSearchWord);
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
    <div className="min-h-screen page-bg">
      <main className="container mx-auto px-4 md:px-6 py-8">
        {/* Premium Back Button */}
        <button
          onClick={() => navigate("/dashboard/smaart-toolkit")}
          className="group flex items-center gap-3 text-[#112b6b] dark:text-white text-[11px] font-bold uppercase tracking-[0.2em] mb-6 hover:text-[#1a3884] transition-all animate-fade-in"
        >
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:shadow-md group-hover:-translate-x-1 transition-all duration-300">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Toolkit
        </button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-sans font-bold mb-2">
            {t("toolkit.sections.dictionary.title", "General Dictionary")}
          </h1>
          <p className="text-slate-650 dark:text-slate-350 font-medium">
            {t("toolkit.sections.dictionary.description", "Master professional terminology with our interactive reference tool.")}
          </p>
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
                placeholder={t("general_dictionary.search_placeholder", "Search for a word...")}
                className="form-input !pl-16 pr-32 py-4 text-lg"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6 pointer-events-none" />
              <button
                type="submit"
                disabled={loading || !searchTerm}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#1a3884] hover:bg-[#112558] text-white px-6 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? t("general_dictionary.searching", "Searching...") : t("general_dictionary.search", "Search")}
              </button>
            </motion.form>

            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 dark-card text-center space-y-4 shadow-sm"
              >
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">{t("general_dictionary.error_title", "Definition Not Found")}</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                    {t("general_dictionary.error_desc", `We couldn't find a definition for "{{searchTerm}}". Please check the spelling or try a different word.`, { searchTerm })}
                  </p>
                </div>
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:underline"
                >
                  {t("general_dictionary.clear_search", "Clear Search")}
                </button>
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
                  <div className="dark-card p-6 sm:p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-4xl font-bold capitalize mb-2">
                          {definition.word}
                          {definition.originalWord && definition.originalWord.toLowerCase() !== definition.word.toLowerCase() && (
                            <span className="text-xl font-normal text-slate-500 dark:text-slate-400 ml-3 capitalize">
                              ({definition.originalWord})
                            </span>
                          )}
                        </h2>
                        <div className="flex items-center gap-3 text-[#1a3884] dark:text-blue-400 font-mono text-lg">
                          <span>{definition.phonetic}</span>
                          {definition.phonetics.find(p => p.audio) && (
                            <button
                              onClick={() => playAudio(definition.phonetics.find(p => p.audio).audio)}
                              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
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
                        <div key={index} className="border-b border-slate-100 dark:border-white/10 last:border-0 pb-6 last:pb-0">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full italic">
                              {meaning.partOfSpeech}
                            </span>
                            <div className="h-px flex-1 bg-slate-100 dark:bg-[#003170]" />
                          </div>

                          <ul className="space-y-3">
                            {meaning.definitions.slice(0, 3).map((def, idx) => (
                              <li key={idx} className="text-slate-700 dark:text-slate-300 flex gap-2">
                                <span className="text-blue-400 mt-1.5 min-w-[6px]">•</span>
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
                    <div className="dark-card p-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" /> {t("general_dictionary.synonyms", "Synonyms & Related Words")}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {synonyms.map(syn => (
                          <button
                            key={syn}
                            onClick={() => {
                              setSearchTerm(syn);
                              fetchData(syn);
                            }}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-[#003170] hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/40 dark:hover:text-blue-300 rounded-lg text-sm text-slate-700 dark:text-slate-300 transition-colors capitalize"
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
                className="dark-card p-6 relative overflow-hidden shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4 text-[#1a3884] dark:text-blue-400 text-sm font-bold tracking-wider uppercase">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" /> {t("general_dictionary.word_of_day", "Word of the Day")}
                </div>

                <h3 className="text-3xl font-bold mb-2 capitalize text-slate-800 dark:text-white">
                  {wordOfDay.word}
                  {wordOfDay.originalWord && wordOfDay.originalWord.toLowerCase() !== wordOfDay.word.toLowerCase() && (
                    <span className="text-lg font-normal text-slate-500 dark:text-slate-400 ml-2 capitalize">
                      ({wordOfDay.originalWord})
                    </span>
                  )}
                </h3>
                <p className="text-[#1a3884] dark:text-blue-400 mb-6 italic font-sans font-medium">
                  {wordOfDay.phonetic}
                </p>

                <p className="text-slate-600 dark:text-slate-350 mb-6 line-clamp-3 leading-relaxed">
                  {wordOfDay.meanings[0]?.definitions[0]?.definition}
                </p>

                <button
                  onClick={() => {
                    setSearchTerm(wordOfDay.originalWord || wordOfDay.word);
                    fetchData(wordOfDay.originalWord || wordOfDay.word);
                  }}
                  className="flex items-center gap-2 text-sm font-semibold text-[#1a3884] dark:text-blue-400 hover:underline transition-colors"
                >
                  {t("general_dictionary.learn_more", "Learn more")} <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* Quick Links */}
            <div className="dark-card p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Book className="w-4 h-4" /> {t("general_dictionary.trending_words", "Trending Words")}
              </h3>
              <div className="space-y-2">
                {["Resilience", "Empathy", "Agile", "Cognitive", "Paradigm"].map((item) => (
                  <button
                    key={item}
                    onClick={async () => {
                      let translatedItem = item;
                      if (selectedLang !== "en") {
                        try {
                          translatedItem = await translateText(item, selectedLang);
                        } catch (err) {
                          console.error(err);
                        }
                      }
                      setSearchTerm(translatedItem);
                      fetchData(item);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] text-slate-650 dark:text-slate-350 text-sm font-medium transition-colors"
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
  );
};

export default GeneralDictionary;
