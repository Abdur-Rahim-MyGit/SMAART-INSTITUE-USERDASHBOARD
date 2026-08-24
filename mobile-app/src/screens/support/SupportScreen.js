/**
 * SupportScreen — help requests and formal grievances (SRS Phase 7, FR-SUP-01/02).
 *
 * Ports `front-end/src/pages/SupportTicketsPage.jsx` and `GrievancesPage.jsx`
 * into one screen with two tabs. Replaces the ComingSoon stub.
 *
 * They share a screen but not a system, and the distinction is deliberate:
 *
 *   Support ticket — "something is broken / I need help". Auto-assigned to IT
 *                    support, bridged to the ITSM platform, has a priority.
 *   Grievance      — a formal complaint. Student-only, can be submitted
 *                    anonymously, carries its own audit trail, no priority.
 *
 * Submitting the wrong one wastes everybody's time, so the tab switch carries
 * a one-line explanation of which is which rather than leaving it to be guessed.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import SkeletonBox from '../../components/SkeletonBox';
import {
  getTickets,
  getGrievances,
  createTicket,
  createGrievance,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  GRIEVANCE_CATEGORIES,
  STATUS_META,
  LIMITS,
  labelFor,
} from '../../api/support';

const TABS = [
  {
    key: 'ticket',
    label: 'Support',
    blurb: 'Something broken, or you need help using the platform.',
    empty: 'No support tickets yet.',
    cta: 'New ticket',
  },
  {
    key: 'grievance',
    label: 'Grievances',
    blurb: 'A formal complaint. Handled separately, and can be anonymous.',
    empty: 'No grievances raised.',
    cta: 'Raise a grievance',
  },
];

function toneColor(tone, c) {
  return (
    { good: c.success, warn: c.warning, info: c.primaryBright, muted: c.iconMuted }[tone] ||
    c.iconMuted
  );
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** A status chip, shared by both systems (their vocabularies overlap). */
function StatusChip({ status, colors }) {
  const meta = STATUS_META[status] || { label: status || 'Unknown', tone: 'muted' };
  const tint = toneColor(meta.tone, colors);
  return (
    <View style={[styles.statusChip, { backgroundColor: `${tint}1A`, borderColor: `${tint}55` }]}>
      <Text style={[styles.statusText, { color: tint }]}>{meta.label}</Text>
    </View>
  );
}

export default function SupportScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [tab, setTab] = useState('ticket');
  const [tickets, setTickets] = useState([]);
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Composer
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(null);
  const [priority, setPriority] = useState('medium');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    // One failing system must not blank the other — a grievance 403 for a
    // non-student account is expected, and should not hide their tickets.
    const [t, g] = await Promise.allSettled([getTickets(), getGrievances()]);
    setTickets(t.status === 'fulfilled' ? t.value : []);
    setGrievances(g.status === 'fulfilled' ? g.value : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => navigation.addListener('focus', load), [navigation, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const isTicketTab = tab === 'ticket';
  const items = isTicketTab ? tickets : grievances;
  const activeTab = TABS.find((t) => t.key === tab);
  const categories = isTicketTab ? TICKET_CATEGORIES : GRIEVANCE_CATEGORIES;
  const limits = isTicketTab ? LIMITS.ticket : LIMITS.grievance;

  const openCount = useMemo(
    () => items.filter((i) => i.status !== 'closed' && i.status !== 'resolved').length,
    [items]
  );

  const resetComposer = () => {
    setTitle('');
    setDescription('');
    setCategory(null);
    setPriority('medium');
    setAnonymous(false);
  };

  const validation = useMemo(() => {
    const t = title.trim();
    const d = description.trim();
    if (!t) return 'Add a short title.';
    if (t.length < limits.title[0]) return `Title needs at least ${limits.title[0]} characters.`;
    if (t.length > limits.title[1]) return `Title cannot exceed ${limits.title[1]} characters.`;
    if (!d) return 'Describe what happened.';
    if (d.length < limits.description[0])
      return `Description needs at least ${limits.description[0]} characters.`;
    if (d.length > limits.description[1])
      return `Description cannot exceed ${limits.description[1]} characters.`;
    if (!category) return 'Pick a category.';
    return null;
  }, [title, description, category, limits]);

  const submit = async () => {
    if (validation || submitting) return;
    setSubmitting(true);
    try {
      if (isTicketTab) {
        const created = await createTicket({
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
        });
        setTickets((prev) => [created, ...prev]);
      } else {
        const created = await createGrievance({
          title: title.trim(),
          description: description.trim(),
          category,
          isAnonymous: anonymous,
        });
        setGrievances((prev) => [created, ...prev]);
      }
      setComposing(false);
      resetComposer();
    } catch (err) {
      // Both systems answer with `error`; express-validator adds `errors[]`.
      const payload = err?.response?.data;
      const message =
        payload?.errors?.[0]?.msg || payload?.error || payload?.message || 'Please try again.';
      Alert.alert("Couldn't submit", message);
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (item) =>
    navigation.navigate('SupportDetail', {
      kind: tab,
      id: item._id,
      reference: item.ticketId || item.grievanceId || null,
    });

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
      <RNStatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.bg}
      />

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
          <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>
            {openCount > 0 ? `${openCount} still open` : 'Nothing outstanding'}
          </Text>
          <Text style={[styles.title, { color: themeColors.text }]}>Help & Grievances</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <View style={[styles.tabs, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          {TABS.map((t) => {
            const active = tab === t.key;
            const count = t.key === 'ticket' ? tickets.length : grievances.length;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[
                  styles.tab,
                  active && { backgroundColor: themeColors.primaryBright },
                ]}
              >
                <Text
                  style={[styles.tabText, { color: active ? '#FFFFFF' : themeColors.textMuted }]}
                >
                  {t.label}
                  {count > 0 ? ` · ${count}` : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.tabBlurb, { color: themeColors.textMuted }]}>{activeTab.blurb}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primaryBright}
            colors={[themeColors.primaryBright]}
          />
        }
      >
        <Pressable
          onPress={() => setComposing(true)}
          style={({ pressed }) => [
            styles.newBtn,
            { backgroundColor: themeColors.primaryBright, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name="plus" size={17} color="#FFFFFF" />
          <Text style={styles.newBtnText}>{activeTab.cta}</Text>
        </Pressable>

        {loading ? (
          <View style={{ gap: 12, marginTop: 16 }}>
            {[0, 1, 2].map((i) => (
              <SkeletonBox key={i} width="100%" height={96} borderRadius={16} />
            ))}
          </View>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Feather
              name={isTicketTab ? 'life-buoy' : 'shield'}
              size={30}
              color={themeColors.iconMuted}
            />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>{activeTab.empty}</Text>
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
              {activeTab.blurb}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12, marginTop: 16 }}>
            {items.map((item) => (
              <Pressable
                key={item._id}
                onPress={() => openDetail(item)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.cardTitle, { color: themeColors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <StatusChip status={item.status} colors={themeColors} />
                </View>

                <Text style={[styles.cardBody, { color: themeColors.textMuted }]} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.cardFoot}>
                  <Text style={[styles.metaText, { color: themeColors.iconMuted }]}>
                    {labelFor(categories, item.category)}
                  </Text>
                  <Text style={[styles.metaDot, { color: themeColors.iconMuted }]}>·</Text>
                  <Text style={[styles.metaText, { color: themeColors.iconMuted }]}>
                    {formatDate(item.createdAt)}
                  </Text>
                  {!!item.isAnonymous && (
                    <>
                      <Text style={[styles.metaDot, { color: themeColors.iconMuted }]}>·</Text>
                      <Feather name="eye-off" size={11} color={themeColors.iconMuted} />
                      <Text style={[styles.metaText, { color: themeColors.iconMuted }]}>
                        Anonymous
                      </Text>
                    </>
                  )}
                  {(item.responses?.length ?? 0) > 0 && (
                    <>
                      <Text style={[styles.metaDot, { color: themeColors.iconMuted }]}>·</Text>
                      <Feather name="message-circle" size={11} color={themeColors.primaryBright} />
                      <Text style={[styles.metaText, { color: themeColors.primaryBright }]}>
                        {item.responses.length}
                      </Text>
                    </>
                  )}
                </View>

                {!!(item.ticketId || item.grievanceId) && (
                  <Text style={[styles.reference, { color: themeColors.iconMuted }]}>
                    {item.ticketId || item.grievanceId}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Composer ───────────────────────────────────────────────────── */}
      <Modal
        visible={composing}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setComposing(false)}
      >
        <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top']}>
          <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
            <Pressable
              onPress={() => setComposing(false)}
              hitSlop={10}
              style={[
                styles.backBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Feather name="x" size={19} color={themeColors.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>
                {isTicketTab ? 'Goes to IT support' : 'Goes to the grievance officer'}
              </Text>
              <Text style={[styles.title, { color: themeColors.text }]}>{activeTab.cta}</Text>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="A one-line summary"
              placeholderTextColor={themeColors.iconMuted}
              maxLength={limits.title[1]}
              style={[
                styles.input,
                { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text },
              ]}
            />

            <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>Category</Text>
            <View style={styles.optionWrap}>
              {categories.map((c) => {
                const active = category === c.value;
                return (
                  <Pressable
                    key={c.value}
                    onPress={() => setCategory(c.value)}
                    style={[
                      styles.option,
                      {
                        backgroundColor: active ? themeColors.primaryBright : themeColors.card,
                        borderColor: active ? themeColors.primaryBright : themeColors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: active ? '#FFFFFF' : themeColors.textMuted },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {isTicketTab && (
              <>
                <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>Priority</Text>
                <View style={styles.optionWrap}>
                  {TICKET_PRIORITIES.map((pri) => {
                    const active = priority === pri.value;
                    return (
                      <Pressable
                        key={pri.value}
                        onPress={() => setPriority(pri.value)}
                        style={[
                          styles.option,
                          {
                            backgroundColor: active ? themeColors.primaryBright : themeColors.card,
                            borderColor: active ? themeColors.primaryBright : themeColors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            { color: active ? '#FFFFFF' : themeColors.textMuted },
                          ]}
                        >
                          {pri.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={[styles.fieldLabel, { color: themeColors.textMuted }]}>
              What happened?
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Include what you were doing, what you expected, and what happened instead."
              placeholderTextColor={themeColors.iconMuted}
              multiline
              maxLength={limits.description[1]}
              style={[
                styles.textarea,
                { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text },
              ]}
            />
            <Text style={[styles.counter, { color: themeColors.iconMuted }]}>
              {description.trim().length} / {limits.description[1]}
            </Text>

            {!isTicketTab && (
              <View
                style={[
                  styles.anonRow,
                  { backgroundColor: themeColors.card, borderColor: themeColors.border },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.anonTitle, { color: themeColors.text }]}>
                    Submit anonymously
                  </Text>
                  <Text style={[styles.anonText, { color: themeColors.textMuted }]}>
                    Your name is hidden from the administrator reviewing this. You can still see it
                    and reply here.
                  </Text>
                </View>
                <Switch
                  value={anonymous}
                  onValueChange={setAnonymous}
                  trackColor={{ false: themeColors.border, true: themeColors.primaryBright }}
                />
              </View>
            )}

            {!!validation && title.length + description.length > 0 && (
              <Text style={[styles.validation, { color: themeColors.warning }]}>{validation}</Text>
            )}

            <Pressable
              onPress={submit}
              disabled={!!validation || submitting}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: themeColors.primaryBright,
                  opacity: validation || submitting ? 0.5 : 1,
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>
                  {isTicketTab ? 'Submit ticket' : 'Submit grievance'}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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

  tabsWrap: { paddingHorizontal: 20, paddingTop: 14, gap: 8 },
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, padding: 4, gap: 4 },
  tab: { flex: 1, borderRadius: 999, paddingVertical: 9, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '800' },
  tabBlurb: { fontSize: 12, lineHeight: 17, paddingHorizontal: 4 },

  scroll: { padding: 20, paddingBottom: 40 },

  newBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 13,
  },
  newBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 60, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

  card: { borderWidth: 1, borderRadius: 16, padding: 15 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { flex: 1, fontSize: 14.5, fontWeight: '800', lineHeight: 20 },
  cardBody: { fontSize: 12.5, fontWeight: '500', lineHeight: 18, marginTop: 6 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, flexWrap: 'wrap' },
  metaText: { fontSize: 11, fontWeight: '600' },
  metaDot: { fontSize: 11 },
  reference: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 6 },

  statusChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 10.5, fontWeight: '800' },

  fieldLabel: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8, marginTop: 18 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  textarea: {
    borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14,
    minHeight: 140, textAlignVertical: 'top',
  },
  counter: { fontSize: 11, fontWeight: '600', marginTop: 6, textAlign: 'right' },

  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  optionText: { fontSize: 12.5, fontWeight: '700' },

  anonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 18,
  },
  anonTitle: { fontSize: 13.5, fontWeight: '800' },
  anonText: { fontSize: 11.5, lineHeight: 16, marginTop: 3 },

  validation: { fontSize: 12.5, fontWeight: '700', marginTop: 16 },
  submitBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  submitText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '800' },
});
