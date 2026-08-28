/**
 * DictionaryScreen — port of `front-end/src/pages/GeneralDictionary.jsx`.
 *
 * No SMAART backend involved: definitions come straight from
 * freedictionaryapi.com and synonyms from api.datamuse.com, called directly
 * via fetch() exactly like the web page does. React Native isn't subject to
 * browser CORS, so this is actually simpler here than on web.
 *
 * The web page's optional MyMemory translate-on-language-switch is dropped —
 * mobile i18n language switching isn't wired up yet, and English-only
 * search/definitions/synonyms is already a complete, working feature.
 * Audio pronunciation playback is also dropped: it needs a native audio
 * module (expo-av / expo-audio) that isn't installed, and adding one is out
 * of scope for this pass — the phonetic spelling still renders as text.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import SkeletonBox from '../../components/SkeletonBox';

function AnimatedSection({ children, delay = 0, style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View style={[{ opacity: anim, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

function PressCard({ onPress, style, children, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} disabled={disabled}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

const DAILY_WORDS = ['serendipity', 'ephemeral', 'resilience', 'eloquent', 'mellifluous', 'pragmatic', 'innovate'];
const TRENDING_WORDS = ['Resilience', 'Empathy', 'Agile', 'Cognitive', 'Paradigm'];

async function fetchWord(word) {
  const defRes = await fetch(`https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(word.toLowerCase())}`);
  if (!defRes.ok) throw new Error('Word not found');
  const defData = await defRes.json();
  if (!defData.entries || defData.entries.length === 0) throw new Error('No definitions found.');

  const transformed = {
    word: defData.word,
    phonetic: defData.entries?.[0]?.pronunciations?.[0]?.text || '',
    meanings:
      defData.entries?.map((entry) => {
        const allDefinitions = [];
        entry.senses?.forEach((sense) => {
          if (sense.definition) allDefinitions.push({ definition: sense.definition, example: sense.examples?.[0] });
          sense.subsenses?.forEach((sub) => {
            if (sub.definition) allDefinitions.push({ definition: sub.definition, example: sub.examples?.[0] });
          });
        });
        return { partOfSpeech: entry.partOfSpeech, definitions: allDefinitions };
      }) || [],
  };

  let synonyms = [];
  try {
    const synRes = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=10`);
    const synData = await synRes.json();
    synonyms = Array.isArray(synData) ? synData.map((s) => s.word) : [];
  } catch {
    synonyms = [];
  }

  return { ...transformed, synonyms };
}

export default function DictionaryScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [definition, setDefinition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [wordOfDay, setWordOfDay] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(true);

  useEffect(() => {
    const word = DAILY_WORDS[Math.floor(Math.random() * DAILY_WORDS.length)];
    fetchWord(word)
      .then(setWordOfDay)
      .catch(() => setWordOfDay(null))
      .finally(() => setDailyLoading(false));
  }, []);

  const search = useCallback(async (word) => {
    if (!word || !word.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWord(word.trim());
      setDefinition(result);
    } catch (err) {
      setDefinition(null);
      setError(err?.message === 'Word not found' ? 'Word not found' : 'Could not find definition. Try another word.');
    } finally {
      setLoading(false);
    }
  }, []);

  const onSubmit = () => search(searchTerm);

  const onWordTap = (word) => {
    setSearchTerm(word);
    search(word);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              borderColor: themeColors.border,
            },
          ]}
        >
          <Feather name="arrow-left" size={19} color={themeColors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>Reference</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>General Dictionary</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatedSection delay={0}>
          <View style={[styles.search, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Feather name="search" size={16} color={themeColors.iconMuted} />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              onSubmitEditing={onSubmit}
              placeholder="Search for a word…"
              placeholderTextColor={themeColors.textMuted}
              style={[styles.searchInput, { color: themeColors.text }]}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchTerm.length > 0 && (
              <Pressable onPress={() => setSearchTerm('')} hitSlop={10}>
                <Feather name="x-circle" size={16} color={themeColors.iconMuted} />
              </Pressable>
            )}
          </View>

          <PressCard
            onPress={onSubmit}
            disabled={loading || !searchTerm.trim()}
            style={[
              styles.searchBtn,
              { backgroundColor: themeColors.primaryBright, opacity: loading || !searchTerm.trim() ? 0.5 : 1 },
            ]}
          >
            <Feather name="search" size={15} color="#FFFFFF" />
            <Text style={styles.searchBtnText}>{loading ? 'Searching…' : 'Search'}</Text>
          </PressCard>
        </AnimatedSection>

        {loading ? (
          <View style={{ marginTop: 16, gap: 10 }}>
            <SkeletonBox width="60%" height={26} borderRadius={8} />
            <SkeletonBox width="30%" height={14} borderRadius={6} />
            <SkeletonBox width="100%" height={14} borderRadius={6} />
            <SkeletonBox width="85%" height={14} borderRadius={6} />
            <SkeletonBox width="70%" height={14} borderRadius={6} />
          </View>
        ) : error ? (
          <AnimatedSection delay={0} style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, alignItems: 'center', marginTop: 16 }]}>
            <Feather name="alert-triangle" size={26} color={themeColors.danger} />
            <Text style={[styles.emptyTitle, { color: themeColors.text, marginTop: 10 }]}>{error}</Text>
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
              Couldn't find "{searchTerm}". Check spelling or try another word.
            </Text>
          </AnimatedSection>
        ) : definition ? (
          <AnimatedSection delay={0} style={{ marginTop: 16, gap: 14 }}>
            <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Text style={[styles.word, { color: themeColors.text }]}>{definition.word}</Text>
              {!!definition.phonetic && (
                <Text style={[styles.phonetic, { color: themeColors.primaryBright }]}>{definition.phonetic}</Text>
              )}

              {definition.meanings.map((meaning, idx) => (
                <View
                  key={idx}
                  style={[styles.meaning, idx > 0 && { borderTopWidth: 1, borderTopColor: themeColors.border }]}
                >
                  {!!meaning.partOfSpeech && (
                    <View style={[styles.posPill, { backgroundColor: themeColors.pillBg }]}>
                      <Text style={[styles.posText, { color: themeColors.primaryBright }]}>{meaning.partOfSpeech}</Text>
                    </View>
                  )}
                  {meaning.definitions.slice(0, 3).map((def, dIdx) => (
                    <View key={dIdx} style={styles.defRow}>
                      <View style={[styles.bullet, { backgroundColor: themeColors.primaryBright }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.defText, { color: themeColors.textMuted }]}>{def.definition}</Text>
                        {!!def.example && (
                          <Text style={[styles.exampleText, { color: themeColors.iconMuted, borderLeftColor: themeColors.border }]}>
                            "{def.example}"
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            {definition.synonyms.length > 0 && (
              <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <View style={styles.sectionHeadRow}>
                  <Feather name="zap" size={14} color={themeColors.warning} />
                  <Text style={[styles.sectionHead, { color: themeColors.text }]}>Synonyms &amp; Related Words</Text>
                </View>
                <View style={styles.chipWrap}>
                  {definition.synonyms.map((syn) => (
                    <PressCard
                      key={syn}
                      onPress={() => onWordTap(syn)}
                      style={[styles.chip, { borderColor: themeColors.border, backgroundColor: themeColors.pillBg }]}
                    >
                      <Text style={[styles.chipText, { color: themeColors.text }]}>{syn}</Text>
                    </PressCard>
                  ))}
                </View>
              </View>
            )}
          </AnimatedSection>
        ) : (
          <AnimatedSection delay={0} style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderStyle: 'dashed', alignItems: 'center', marginTop: 16 }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: themeColors.pillBg }]}>
              <Feather name="book" size={22} color={themeColors.primaryBright} />
            </View>
            <Text style={[styles.emptyText, { color: themeColors.textMuted, textAlign: 'center', marginTop: 10 }]}>
              Type a word above and tap Search to see its definition.
            </Text>
          </AnimatedSection>
        )}

        <AnimatedSection delay={60} style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, marginTop: 14 }]}>
          <View style={styles.sectionHeadRow}>
            <Feather name="star" size={14} color={themeColors.warning} />
            <Text style={[styles.sectionHead, { color: themeColors.text }]}>Word of the Day</Text>
          </View>
          {dailyLoading ? (
            <SkeletonBox width="50%" height={22} borderRadius={6} style={{ marginTop: 8 }} />
          ) : wordOfDay ? (
            <View>
              <Text style={[styles.wordOfDay, { color: themeColors.text }]}>{wordOfDay.word}</Text>
              {!!wordOfDay.phonetic && (
                <Text style={[styles.phonetic, { color: themeColors.primaryBright, marginTop: 2 }]}>{wordOfDay.phonetic}</Text>
              )}
              <Text style={[styles.defText, { color: themeColors.textMuted, marginTop: 8 }]} numberOfLines={3}>
                {wordOfDay.meanings?.[0]?.definitions?.[0]?.definition}
              </Text>
              <Pressable onPress={() => onWordTap(wordOfDay.word)} style={styles.learnMoreRow}>
                <Text style={[styles.learnMoreText, { color: themeColors.primaryBright }]}>Learn more</Text>
                <Feather name="arrow-right" size={13} color={themeColors.primaryBright} />
              </Pressable>
            </View>
          ) : null}
        </AnimatedSection>

        <AnimatedSection delay={120} style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, marginTop: 14 }]}>
          <View style={styles.sectionHeadRow}>
            <Feather name="book" size={14} color={themeColors.primaryBright} />
            <Text style={[styles.sectionHead, { color: themeColors.text }]}>Trending Words</Text>
          </View>
          {TRENDING_WORDS.map((item) => (
            <Pressable key={item} onPress={() => onWordTap(item)} style={styles.trendingRow}>
              <Text style={[styles.trendingText, { color: themeColors.textMuted }]}>{item}</Text>
              <Feather name="arrow-right" size={14} color={themeColors.iconMuted} />
            </Pressable>
          ))}
        </AnimatedSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { fontSize: 11.5, fontWeight: '600' },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4 },

  scroll: { padding: 20, paddingBottom: 40 },

  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 46, borderRadius: 23, borderWidth: 1, paddingHorizontal: 15,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },
  searchBtn: {
    marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 13,
  },
  searchBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  card: { borderWidth: 1, borderRadius: 18, padding: 18 },

  emptyIconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '800' },
  emptyText: { fontSize: 12.5, lineHeight: 18, marginTop: 4, textAlign: 'center' },

  word: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, textTransform: 'capitalize' },
  phonetic: { fontSize: 13, fontWeight: '600', marginTop: 2 },

  meaning: { marginTop: 16, paddingTop: 16 },
  posPill: {
    alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 10,
  },
  posText: { fontSize: 10.5, fontWeight: '800', fontStyle: 'italic', textTransform: 'lowercase' },

  defRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  defText: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
  exampleText: {
    fontSize: 12, fontStyle: 'italic', marginTop: 6, paddingLeft: 10, borderLeftWidth: 2, lineHeight: 17,
  },

  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionHead: { fontSize: 13.5, fontWeight: '800' },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontSize: 12.5, fontWeight: '700', textTransform: 'capitalize' },

  wordOfDay: { fontSize: 19, fontWeight: '800', textTransform: 'capitalize', marginTop: 2 },
  learnMoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  learnMoreText: { fontSize: 12.5, fontWeight: '800' },

  trendingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 11,
  },
  trendingText: { fontSize: 13, fontWeight: '600' },
});
