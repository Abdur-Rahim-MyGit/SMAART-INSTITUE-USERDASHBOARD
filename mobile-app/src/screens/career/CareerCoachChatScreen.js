/**
 * CareerCoachChatScreen — FR-CAR-01 (Must).
 *
 * Port of `front-end/src/pages/AICareerCoach/AIChat.jsx` against the same
 * endpoints via `api/careerCoach.js`.
 *
 * Contract notes that shape this screen:
 *
 *  · `POST /chat` returns `{ success, response, sessionId }`. Omitting
 *    `sessionId` starts a new conversation and the server mints one — so the
 *    id must be captured from the FIRST reply and sent on every turn after,
 *    or each message starts a fresh context and the coach forgets everything.
 *
 *  · `GET /chat/:sessionId` returns `{ success, messages: [{ role, content }] }`
 *    with roles 'user' | 'assistant'.
 *
 *  · The endpoint sits behind `aiLimiter` — 30 requests / 15 min per user, and
 *    every call costs a paid LLM request. There is deliberately **no automatic
 *    retry** here: a failed send stays on screen as a retryable bubble the
 *    student taps, rather than a loop that silently burns their quota.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
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
import { sendChatMessage, getChatHistory, getChatSessions } from '../../api/careerCoach';

/** Shown when a conversation is empty, so the student has somewhere to start. */
const STARTERS = [
  'What career paths suit my profile?',
  'Which skills should I build next?',
  'How do I prepare for a product role?',
  'Review my strengths and gaps',
];

/**
 * Fades a message bubble in once, the moment it first mounts. Because React
 * keeps the same component instance for a stable `key` (the message's id),
 * this only fires for genuinely new messages — re-renders of the thread
 * (e.g. a sibling message's status flipping from 'sending' to 'sent') never
 * replay it for bubbles that are already on screen.
 */
function FadeInMessage({ children, style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [6, 0] });

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

export default function CareerCoachChatScreen({ navigation }) {
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const scrollRef = useRef(null);

  // Resume the most recent conversation if there is one.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getChatSessions();
        const sessions = res?.sessions || res?.data || [];
        const latest = Array.isArray(sessions) && sessions.length ? sessions[0] : null;
        const id = latest?.sessionId || latest?._id || latest;
        if (!id || cancelled) return;

        const history = await getChatHistory(id);
        if (cancelled) return;
        const list = (history?.messages || []).map((m, i) => ({
          id: m._id || `h${i}`,
          role: m.role,
          content: m.content,
          status: 'sent',
        }));
        if (list.length) {
          setSessionId(id);
          setMessages(list);
        }
      } catch {
        // No history is a normal first-run state, not an error worth showing.
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const send = useCallback(
    async (text) => {
      const body = (text ?? draft).trim();
      if (!body || sending) return;

      const localId = `l${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: localId, role: 'user', content: body, status: 'sending' },
      ]);
      setDraft('');
      setSending(true);
      scrollToEnd();

      try {
        const res = await sendChatMessage(body, sessionId);
        if (!res?.success) throw new Error(res?.message || 'The coach could not respond.');

        // Capture the server's session id on the first turn — without it every
        // subsequent message would start a new, context-free conversation.
        if (res.sessionId && res.sessionId !== sessionId) setSessionId(res.sessionId);

        setMessages((prev) => [
          ...prev.map((m) => (m.id === localId ? { ...m, status: 'sent' } : m)),
          { id: `a${Date.now()}`, role: 'assistant', content: res.response, status: 'sent' },
        ]);
      } catch (err) {
        const rateLimited = err?.status === 429;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === localId
              ? {
                  ...m,
                  status: 'failed',
                  error: rateLimited
                    ? 'Coach limit reached — wait a few minutes.'
                    : err?.data?.message || 'Message not sent.',
                }
              : m
          )
        );
      } finally {
        setSending(false);
        scrollToEnd();
      }
    },
    [draft, sending, sessionId, scrollToEnd]
  );

  const retry = (msg) => {
    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    send(msg.content);
  };

  const startNew = () => {
    setSessionId(null);
    setMessages([]);
    setDraft('');
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top', 'bottom']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={[
            styles.iconBtn,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              borderColor: themeColors.border,
            },
          ]}
        >
          <Feather name="arrow-left" size={19} color={themeColors.text} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: themeColors.text }]}>AI Career Coach</Text>
          <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
            {sending ? 'Thinking…' : sessionId ? 'Conversation active' : 'Ask anything about your path'}
          </Text>
        </View>

        {messages.length > 0 && (
          <Pressable
            onPress={startNew}
            hitSlop={10}
            style={[
              styles.iconBtn,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                borderColor: themeColors.border,
              },
            ]}
          >
            <Feather name="edit" size={16} color={themeColors.text} />
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.thread}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loadingHistory ? (
            <View style={styles.centered}>
              <ActivityIndicator color={themeColors.primaryBright} />
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.intro}>
              <View style={[styles.introIcon, { backgroundColor: themeColors.pillBg }]}>
                <Feather name="compass" size={26} color={themeColors.primaryBright} />
              </View>
              <Text style={[styles.introTitle, { color: themeColors.text }]}>
                Your career coach is ready
              </Text>
              <Text style={[styles.introText, { color: themeColors.textMuted }]}>
                Ask about roles, skills or the next step in your plan. It knows your profile.
              </Text>

              <View style={styles.starters}>
                {STARTERS.map((s) => (
                  <PressCard
                    key={s}
                    onPress={() => send(s)}
                    style={[
                      styles.starter,
                      {
                        backgroundColor: themeColors.card,
                        borderColor: themeColors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.starterText, { color: themeColors.text }]}>{s}</Text>
                    <Feather name="arrow-up-right" size={13} color={themeColors.iconMuted} />
                  </PressCard>
                ))}
              </View>
            </View>
          ) : (
            messages.map((m) => {
              const mine = m.role === 'user';
              return (
                <FadeInMessage key={m.id} style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
                  {!mine && (
                    <View style={[styles.avatar, { backgroundColor: themeColors.pillBg }]}>
                      <Feather name="compass" size={13} color={themeColors.primaryBright} />
                    </View>
                  )}

                  <View style={{ maxWidth: '82%' }}>
                    <View
                      style={[
                        styles.bubble,
                        mine
                          ? { backgroundColor: themeColors.primaryBright, borderBottomRightRadius: 4 }
                          : {
                              backgroundColor: themeColors.card,
                              borderColor: themeColors.border,
                              borderWidth: 1,
                              borderBottomLeftRadius: 4,
                            },
                        m.status === 'sending' && { opacity: 0.6 },
                        m.status === 'failed' && { borderColor: themeColors.danger, borderWidth: 1 },
                      ]}
                    >
                      <Text style={[styles.bubbleText, { color: mine ? '#FFFFFF' : themeColors.text }]}>
                        {m.content}
                      </Text>
                    </View>

                    {m.status === 'failed' && (
                      <Pressable onPress={() => retry(m)} style={styles.failRow}>
                        <Feather name="refresh-cw" size={11} color={themeColors.danger} />
                        <Text style={[styles.failText, { color: themeColors.danger }]}>
                          {m.error} Tap to retry.
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </FadeInMessage>
              );
            })
          )}

          {sending && (
            <FadeInMessage style={[styles.row, styles.rowTheirs]}>
              <View style={[styles.avatar, { backgroundColor: themeColors.pillBg }]}>
                <Feather name="compass" size={13} color={themeColors.primaryBright} />
              </View>
              <View
                style={[
                  styles.bubble,
                  { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 },
                ]}
              >
                <ActivityIndicator size="small" color={themeColors.primaryBright} />
              </View>
            </FadeInMessage>
          )}
        </ScrollView>

        <View style={[styles.composer, { borderTopColor: themeColors.border, backgroundColor: themeColors.bg }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask your coach…"
            placeholderTextColor={themeColors.textMuted}
            multiline
            style={[
              styles.input,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
                color: themeColors.text,
              },
            ]}
          />
          <PressCard
            disabled={!draft.trim() || sending}
            onPress={() => send()}
            style={[
              styles.sendBtn,
              {
                backgroundColor: themeColors.primaryBright,
                opacity: !draft.trim() || sending ? 0.45 : 1,
              },
            ]}
          >
            <Feather name="send" size={17} color="#FFFFFF" />
          </PressCard>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 16.5, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 11.5, fontWeight: '600', marginTop: 1 },

  thread: { padding: 16, paddingBottom: 8, gap: 12, flexGrow: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },

  intro: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 12 },
  introIcon: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  introTitle: { fontSize: 18, fontWeight: '800', marginTop: 16 },
  introText: { fontSize: 13.5, textAlign: 'center', lineHeight: 20, marginTop: 6, maxWidth: 300 },
  starters: { width: '100%', gap: 9, marginTop: 26 },
  starter: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 13,
  },
  starterText: { flex: 1, fontSize: 13.5, fontWeight: '600' },

  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11 },
  bubbleText: { fontSize: 14.5, lineHeight: 21, fontWeight: '500' },
  failRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5, paddingHorizontal: 4 },
  failText: { fontSize: 11, fontWeight: '600', flex: 1 },

  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 22,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    fontSize: 14.5, maxHeight: 120,
  },
  sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
