/**
 * NotesScreen — every course note in one place.
 *
 * Port of `front-end/src/pages/MyNotes.jsx`, which uses the same three
 * operations (`getAll` / `upsert` / `delete`) against `back-end/routes/notes.js`.
 * The player already writes per-course notes; this is the cross-course view
 * that was missing, so notes are findable without reopening each course.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
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
import { getNotes, saveCourseNote, deleteCourseNote } from '../../api/notes';

export default function NotesScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getNotes();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setNotes(list);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) =>
      `${n.title || ''} ${n.courseId || ''} ${n.content || ''}`.toLowerCase().includes(q)
    );
  }, [notes, query]);

  const saveEdit = async (note) => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await saveCourseNote({
        courseId: note.courseId,
        title: note.title || note.courseId,
        content: draft.trim(),
      });
      setNotes((prev) =>
        prev.map((n) => (n.courseId === note.courseId ? { ...n, content: draft.trim() } : n))
      );
      setEditingId(null);
    } catch (err) {
      Alert.alert("Couldn't save", err?.data?.error || err?.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (note) => {
    Alert.alert('Delete note?', `Your note for ${note.title || note.courseId} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          // Optimistic: drop it locally, restore if the server rejects.
          const previous = notes;
          setNotes((prev) => prev.filter((n) => n.courseId !== note.courseId));
          try {
            await deleteCourseNote(note.courseId);
          } catch {
            setNotes(previous);
            Alert.alert("Couldn't delete", 'The note is still there. Please try again.');
          }
        },
      },
    ]);
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
          <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>Across all courses</Text>
          <Text style={[styles.title, { color: themeColors.text }]}>My Notes</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.search, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Feather name="search" size={16} color={themeColors.iconMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search your notes…"
            placeholderTextColor={themeColors.textMuted}
            style={[styles.searchInput, { color: themeColors.text }]}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <Feather name="x-circle" size={16} color={themeColors.iconMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primaryBright}
            colors={[themeColors.primaryBright]}
          />
        }
      >
        {loading ? (
          <View style={{ gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <SkeletonBox key={i} width="100%" height={110} borderRadius={16} />
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="edit-3" size={30} color={themeColors.iconMuted} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              {query ? 'No matching notes' : 'No notes yet'}
            </Text>
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
              {query
                ? 'Try a different search.'
                : 'Open a course and write your takeaways — they show up here.'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filtered.map((note) => {
              const editing = editingId === note.courseId;
              return (
                <View
                  key={note.courseId}
                  style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                >
                  <View style={styles.cardTop}>
                    <Text style={[styles.noteTitle, { color: themeColors.text }]} numberOfLines={1}>
                      {note.title || note.courseId}
                    </Text>
                    <View style={styles.actions}>
                      <Pressable
                        hitSlop={8}
                        onPress={() => {
                          setEditingId(editing ? null : note.courseId);
                          setDraft(note.content || '');
                        }}
                      >
                        <Feather
                          name={editing ? 'x' : 'edit-2'}
                          size={15}
                          color={themeColors.iconMuted}
                        />
                      </Pressable>
                      <Pressable hitSlop={8} onPress={() => remove(note)}>
                        <Feather name="trash-2" size={15} color={themeColors.danger} />
                      </Pressable>
                    </View>
                  </View>

                  <Text style={[styles.courseTag, { color: themeColors.primaryBright }]}>{note.courseId}</Text>

                  {editing ? (
                    <>
                      <TextInput
                        value={draft}
                        onChangeText={setDraft}
                        multiline
                        style={[
                          styles.editor,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                            borderColor: themeColors.border,
                            color: themeColors.text,
                          },
                        ]}
                      />
                      <Pressable
                        disabled={saving || !draft.trim()}
                        onPress={() => saveEdit(note)}
                        style={[
                          styles.saveBtn,
                          { backgroundColor: themeColors.primaryBright, opacity: saving || !draft.trim() ? 0.5 : 1 },
                        ]}
                      >
                        <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Text style={[styles.noteBody, { color: themeColors.textMuted }]} numberOfLines={5}>
                      {note.content}
                    </Text>
                  )}
                </View>
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

  searchWrap: { paddingHorizontal: 20, paddingTop: 14 },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 46, borderRadius: 23, borderWidth: 1, paddingHorizontal: 15,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },

  scroll: { padding: 20, paddingBottom: 40 },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 70, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

  card: { borderWidth: 1, borderRadius: 16, padding: 15 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noteTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  courseTag: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, marginTop: 2, marginBottom: 8 },
  noteBody: { fontSize: 13, fontWeight: '500', lineHeight: 19 },

  editor: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    fontSize: 13, minHeight: 110, textAlignVertical: 'top',
  },
  saveBtn: { marginTop: 10, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
