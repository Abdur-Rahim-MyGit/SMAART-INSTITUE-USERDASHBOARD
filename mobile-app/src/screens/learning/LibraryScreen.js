/**
 * LibraryScreen — reading suggestions (FR-LRN, Could priority).
 *
 * Port of `front-end/src/pages/Library.jsx`. Worth noting for anyone extending
 * this: the web Library talks to the **Google Books API directly**, not to our
 * backend — there is no `/library` route to call. Mobile does the same, so both
 * clients show the same catalogue, and the same category seeds are used.
 *
 * Because it is a third-party call it is the one screen here that can fail
 * without the backend being down, so it degrades to a stated error rather than
 * an empty list.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
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

const CATEGORIES = [
  { id: 'career development', label: 'Career' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'emotional intelligence', label: 'Mindset' },
  { id: 'artificial intelligence', label: 'AI' },
  { id: 'communication skills', label: 'Communication' },
  { id: 'sustainability', label: 'Sustainability' },
];

const GOOGLE_BOOKS = 'https://www.googleapis.com/books/v1/volumes';

export default function LibraryScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);

  const fetchBooks = useCallback(async (search) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${GOOGLE_BOOKS}?q=${encodeURIComponent(search)}&maxResults=20`);
      if (!res.ok) throw new Error(`Book search failed (${res.status})`);
      const json = await res.json();
      setBooks(json.items || []);
    } catch (err) {
      setError(err?.message || 'Could not reach the book service.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks(category);
  }, [category, fetchBooks]);

  const submitSearch = () => {
    if (query.trim()) fetchBooks(query.trim());
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
          <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>Recommended reading</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>Library</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <View style={[styles.search, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Feather name="search" size={16} color={themeColors.iconMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
            placeholder="Search books…"
            placeholderTextColor={themeColors.textMuted}
            style={[styles.searchInput, { color: themeColors.text }]}
            autoCorrect={false}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CATEGORIES.map((c) => {
            const on = category === c.id && !query.trim();
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  setQuery('');
                  setCategory(c.id);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? themeColors.primaryBright : themeColors.card,
                    borderColor: on ? themeColors.primaryBright : themeColors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: on ? '#FFFFFF' : themeColors.textMuted }]}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={themeColors.primaryBright} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Feather name="wifi-off" size={26} color={themeColors.textMuted} />
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>{error}</Text>
            <Pressable
              onPress={() => fetchBooks(query.trim() || category)}
              style={[styles.retry, { backgroundColor: themeColors.primaryBright }]}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : books.length === 0 ? (
          <View style={styles.centered}>
            <Feather name="book-open" size={28} color={themeColors.iconMuted} />
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>No books found.</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {books.map((b) => {
              const info = b.volumeInfo || {};
              const thumb = info.imageLinks?.thumbnail?.replace('http://', 'https://');
              return (
                <Pressable
                  key={b.id}
                  onPress={() => info.infoLink && Linking.openURL(info.infoLink).catch(() => {})}
                  style={({ pressed }) => [
                    styles.book,
                    {
                      backgroundColor: themeColors.card,
                      borderColor: themeColors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={styles.cover} resizeMode="cover" />
                  ) : (
                    <View style={[styles.cover, styles.coverFallback, { backgroundColor: themeColors.pillBg }]}>
                      <Feather name="book" size={18} color={themeColors.primaryBright} />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bookTitle, { color: themeColors.text }]} numberOfLines={2}>
                      {info.title}
                    </Text>
                    <Text style={[styles.bookAuthor, { color: themeColors.textMuted }]} numberOfLines={1}>
                      {(info.authors || ['Unknown author']).join(', ')}
                    </Text>
                    <View style={styles.bookMeta}>
                      {!!info.publishedDate && (
                        <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                          {String(info.publishedDate).slice(0, 4)}
                        </Text>
                      )}
                      {typeof info.averageRating === 'number' && (
                        <View style={styles.rating}>
                          <Feather name="star" size={10} color="#F59E0B" />
                          <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                            {info.averageRating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Feather name="external-link" size={15} color={themeColors.iconMuted} />
                </Pressable>
              );
            })}
          </View>
        )}
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

  controls: { paddingTop: 14, gap: 12 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 46, borderRadius: 23, borderWidth: 1,
    paddingHorizontal: 15, marginHorizontal: 20,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },
  chips: { paddingHorizontal: 20, gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontSize: 12, fontWeight: '700' },

  scroll: { padding: 20, paddingBottom: 40 },
  centered: { alignItems: 'center', gap: 12, paddingVertical: 70 },
  emptyText: { fontSize: 13, textAlign: 'center' },
  retry: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9 },
  retryText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },

  book: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    borderWidth: 1, borderRadius: 16, padding: 12,
  },
  cover: { width: 48, height: 68, borderRadius: 6 },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  bookTitle: { fontSize: 14, fontWeight: '800', lineHeight: 19 },
  bookAuthor: { fontSize: 11.5, fontWeight: '600', marginTop: 3 },
  bookMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, fontWeight: '600' },
});
