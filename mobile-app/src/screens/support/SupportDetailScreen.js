/**
 * SupportDetailScreen — one ticket or one grievance, with its reply thread.
 *
 * Deliberately serves both systems from one screen. They differ in the fields
 * they carry (a ticket has a priority and an assignee; a grievance has an
 * anonymity flag) but the shape a student cares about is identical: the
 * original message, what staff said back, and a box to reply. Two near-copies
 * of this file would drift within a month.
 *
 * The route decides which API to call:
 *   navigation.navigate('SupportDetail', { kind: 'ticket' | 'grievance', id })
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import {
  getTicket,
  getGrievance,
  replyToTicket,
  replyToGrievance,
  TICKET_CATEGORIES,
  GRIEVANCE_CATEGORIES,
  STATUS_META,
  isConversationClosed,
  labelFor,
} from '../../api/support';

const REPLY_MAX = 1000;

function toneColor(tone, c) {
  return (
    { good: c.success, warn: c.warning, info: c.primaryBright, muted: c.iconMuted }[tone] ||
    c.iconMuted
  );
}

function formatWhen(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SupportDetailScreen({ route, navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  const { kind = 'ticket', id, reference } = route.params || {};
  const isTicket = kind === 'ticket';

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = isTicket ? await getTicket(id) : await getGrievance(id);
      setItem(data);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [id, isTicket]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const categories = isTicket ? TICKET_CATEGORIES : GRIEVANCE_CATEGORIES;
  const statusMeta = STATUS_META[item?.status] || { label: item?.status || '—', tone: 'muted' };
  const statusTint = toneColor(statusMeta.tone, themeColors);
  const closed = isConversationClosed(item?.status);

  const responses = useMemo(
    () => (Array.isArray(item?.responses) ? item.responses : []),
    [item]
  );

  const send = async () => {
    const message = reply.trim();
    if (!message || sending) return;
    setSending(true);
    try {
      const updated = isTicket
        ? await replyToTicket(id, message)
        : await replyToGrievance(id, message);
      // Both endpoints return the updated record; fall back to a refetch if
      // the shape is ever not what we expect rather than showing a stale thread.
      if (updated && Array.isArray(updated.responses)) setItem(updated);
      else await load();
      setReply('');
    } catch (err) {
      const payload = err?.response?.data;
      Alert.alert(
        "Couldn't send",
        payload?.error || payload?.message || 'Your reply was not saved. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

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
            {isTicket ? 'Support ticket' : 'Grievance'}
            {reference ? ` · ${reference}` : ''}
          </Text>
          <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
            {item?.title || (loading ? 'Loading…' : 'Not found')}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
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
              <SkeletonBox width="100%" height={130} borderRadius={16} />
              <SkeletonBox width="100%" height={80} borderRadius={16} />
            </View>
          ) : failed || !item ? (
            <View style={styles.empty}>
              <Feather name="alert-circle" size={30} color={themeColors.iconMuted} />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                Couldn't load this
              </Text>
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                Pull down to try again, or go back and reopen it.
              </Text>
            </View>
          ) : (
            <>
              {/* Summary */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: themeColors.card, borderColor: themeColors.border },
                ]}
              >
                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.statusChip,
                      { backgroundColor: `${statusTint}1A`, borderColor: `${statusTint}55` },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: statusTint }]}>
                      {statusMeta.label}
                    </Text>
                  </View>
                  <Text style={[styles.metaText, { color: themeColors.iconMuted }]}>
                    {labelFor(categories, item.category)}
                  </Text>
                  {isTicket && !!item.priority && (
                    <>
                      <Text style={[styles.metaText, { color: themeColors.iconMuted }]}>·</Text>
                      <Text style={[styles.metaText, { color: themeColors.iconMuted }]}>
                        {item.priority} priority
                      </Text>
                    </>
                  )}
                  {!isTicket && !!item.isAnonymous && (
                    <>
                      <Text style={[styles.metaText, { color: themeColors.iconMuted }]}>·</Text>
                      <Feather name="eye-off" size={11} color={themeColors.iconMuted} />
                      <Text style={[styles.metaText, { color: themeColors.iconMuted }]}>
                        Anonymous
                      </Text>
                    </>
                  )}
                </View>

                <Text style={[styles.description, { color: themeColors.text }]}>
                  {item.description}
                </Text>

                <Text style={[styles.raised, { color: themeColors.iconMuted }]}>
                  Raised {formatWhen(item.createdAt)}
                  {isTicket && item.assignedTo?.fullName
                    ? ` · assigned to ${item.assignedTo.fullName}`
                    : ''}
                </Text>
              </View>

              {/* Thread */}
              <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>
                {responses.length > 0
                  ? `${responses.length} ${responses.length === 1 ? 'reply' : 'replies'}`
                  : 'No replies yet'}
              </Text>

              {responses.length === 0 ? (
                <View
                  style={[
                    styles.noReplies,
                    { backgroundColor: themeColors.card, borderColor: themeColors.border },
                  ]}
                >
                  <Feather name="clock" size={16} color={themeColors.iconMuted} />
                  <Text style={[styles.noRepliesText, { color: themeColors.textMuted }]}>
                    {closed
                      ? 'This was closed without a reply on the thread.'
                      : 'Nobody has replied yet. You will get a notification when they do.'}
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {responses.map((r, i) => {
                    // A response with no `respondedBy` populated, or one whose
                    // role is not staff, is the student's own message.
                    const role = r.respondedBy?.role;
                    const mine = !role || role === 'student';
                    const who = mine ? 'You' : r.respondedBy?.fullName || 'Support';
                    return (
                      <View
                        key={r._id || i}
                        style={[
                          styles.bubble,
                          {
                            backgroundColor: mine ? `${themeColors.primaryBright}14` : themeColors.card,
                            borderColor: mine ? `${themeColors.primaryBright}44` : themeColors.border,
                            alignSelf: mine ? 'flex-end' : 'flex-start',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.bubbleWho,
                            { color: mine ? themeColors.primaryBright : themeColors.text },
                          ]}
                        >
                          {who}
                        </Text>
                        <Text style={[styles.bubbleText, { color: themeColors.text }]}>
                          {r.message}
                        </Text>
                        <Text style={[styles.bubbleWhen, { color: themeColors.iconMuted }]}>
                          {formatWhen(r.respondedAt || r.createdAt)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Composer — hidden entirely once closed, because the server rejects it */}
        {!loading && !failed && !!item && (
          closed ? (
            <View style={[styles.closedBar, { borderTopColor: themeColors.border }]}>
              <Feather name="lock" size={14} color={themeColors.iconMuted} />
              <Text style={[styles.closedText, { color: themeColors.textMuted }]}>
                This {isTicket ? 'ticket' : 'grievance'} is {statusMeta.label.toLowerCase()} — replies
                are closed. Raise a new one if you need more help.
              </Text>
            </View>
          ) : (
            <View style={[styles.composer, { borderTopColor: themeColors.border, backgroundColor: themeColors.bg }]}>
              <TextInput
                value={reply}
                onChangeText={setReply}
                placeholder="Write a reply…"
                placeholderTextColor={themeColors.iconMuted}
                multiline
                maxLength={REPLY_MAX}
                style={[
                  styles.replyInput,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  },
                ]}
              />
              <Pressable
                onPress={send}
                disabled={!reply.trim() || sending}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: themeColors.primaryBright,
                    opacity: !reply.trim() || sending ? 0.45 : 1,
                  },
                ]}
                accessibilityLabel="Send reply"
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Feather name="send" size={17} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          )
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { fontSize: 11.5, fontWeight: '600' },
  title: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },

  scroll: { padding: 20, paddingBottom: 24 },

  empty: { alignItems: 'center', gap: 10, paddingVertical: 70, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  statusChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 10.5, fontWeight: '800' },
  metaText: { fontSize: 11.5, fontWeight: '600' },
  description: { fontSize: 14, lineHeight: 21, fontWeight: '500', marginTop: 12 },
  raised: { fontSize: 11, fontWeight: '600', marginTop: 12 },

  sectionLabel: {
    fontSize: 11.5, fontWeight: '800', letterSpacing: 0.5,
    marginTop: 24, marginBottom: 10,
  },
  noReplies: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 14,
  },
  noRepliesText: { flex: 1, fontSize: 12.5, lineHeight: 18 },

  bubble: { maxWidth: '88%', borderWidth: 1, borderRadius: 16, padding: 13 },
  bubbleWho: { fontSize: 11.5, fontWeight: '800', marginBottom: 4 },
  bubbleText: { fontSize: 13.5, lineHeight: 19.5, fontWeight: '500' },
  bubbleWhen: { fontSize: 10.5, fontWeight: '600', marginTop: 6 },

  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, borderTopWidth: 1,
  },
  replyInput: {
    flex: 1, borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 15, paddingTop: 11, paddingBottom: 11,
    fontSize: 14, maxHeight: 120,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },

  closedBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 18, paddingVertical: 14, borderTopWidth: 1,
  },
  closedText: { flex: 1, fontSize: 12, lineHeight: 17 },
});
