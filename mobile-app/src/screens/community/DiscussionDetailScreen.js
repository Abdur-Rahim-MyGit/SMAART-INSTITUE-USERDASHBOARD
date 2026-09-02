/**
 * DiscussionDetailScreen — full thread view for a single community post.
 *
 * Talks to back-end/routes/community.js via api/communityFeed.js. Scope cut
 * to match every other new-screen pass in this app: no poll voting UI (the
 * server-side vote route is double-registered and broken even on web — see
 * communityFeed.js's own comment), no best-answer marking, no threaded
 * replies, no attachment upload on the reply/create side, no report-reason
 * prompt (Android has no Alert.prompt, so it sends a fixed reason). All of
 * those are live on the server and can be wired up later without a schema
 * change.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { communityFeedAPI } from '../../api/communityFeed';

const REACTIONS = [
  { type: 'like', icon: 'thumbs-up' },
  { type: 'heart', icon: 'heart' },
  { type: 'insightful', icon: 'zap' },
  { type: 'support', icon: 'life-buoy' },
  { type: 'smile', icon: 'smile' },
];

function AnimatedSection({ children, delay = 0, style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, delay, useNativeDriver: true }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return (
    <Animated.View style={[{ opacity: anim, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function DiscussionDetailScreen({ navigation, route }) {
  const { discussionId } = route?.params || {};
  const { user } = useAuth();
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = user?._id || user?.id;

  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [reacting, setReacting] = useState(false);

  const loadDiscussion = useCallback(async () => {
    try {
      const res = await communityFeedAPI.getDiscussion(discussionId);
      if (res?.success) {
        setDiscussion(res.data);
        setBookmarked((res.data.isBookmarkedBy || []).some((id) => id?.toString() === userId));
      }
    } catch (err) {
      console.warn('Failed to load discussion:', err);
    } finally {
      setLoading(false);
    }
  }, [discussionId, userId]);

  useEffect(() => {
    loadDiscussion();
  }, [loadDiscussion]);

  const handleReact = async (type) => {
    if (reacting) return;
    setReacting(true);
    try {
      const res = await communityFeedAPI.reactToDiscussion(discussionId, userId, type);
      if (res?.success) {
        setDiscussion((prev) => (prev ? { ...prev, reactions: res.data.reactions } : prev));
      }
    } catch (err) {
      Alert.alert('Failed', err.message || 'Could not react to this post.');
    } finally {
      setReacting(false);
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await communityFeedAPI.toggleBookmark(discussionId, userId);
      if (res?.success) setBookmarked(res.data.isBookmarked);
    } catch (err) {
      Alert.alert('Failed', err.message || 'Could not update bookmark.');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await communityFeedAPI.addReply(discussionId, replyText.trim());
      if (res?.success) {
        setDiscussion(res.data);
        setReplyText('');
      }
    } catch (err) {
      Alert.alert('Failed to reply', err.message || 'Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleReport = () => {
    Alert.alert('Report this discussion?', 'A moderator will review it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: async () => {
          try {
            await communityFeedAPI.reportDiscussion(discussionId, userId, 'Inappropriate content');
            Alert.alert('Reported', 'Thanks — a moderator will take a look.');
          } catch (err) {
            Alert.alert('Failed', err.message || 'Could not report this post.');
          }
        },
      },
    ]);
  };

  const reactionCounts = REACTIONS.reduce((acc, r) => {
    acc[r.type] = (discussion?.reactions || []).filter((rx) => rx.type === r.type).length;
    return acc;
  }, {});
  const myReaction = (discussion?.reactions || []).find((rx) => rx.user?.toString() === userId)?.type;

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, styles.center, { backgroundColor: themeColors.bg }]}>
        <ActivityIndicator size="large" color={themeColors.primaryBright} />
      </SafeAreaView>
    );
  }

  if (!discussion) {
    return (
      <SafeAreaView style={[styles.screen, styles.center, { backgroundColor: themeColors.bg }]}>
        <Feather name="alert-circle" size={28} color={themeColors.textMuted} />
        <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>Discussion not found.</Text>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 14 }}>
          <Text style={{ color: themeColors.primaryBright, fontWeight: '700' }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const authorName = discussion.author?.fullName || discussion.author?.email || 'Student';

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top', 'bottom']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: themeColors.border }]}
        >
          <Feather name="arrow-left" size={19} color={themeColors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: themeColors.text }]} numberOfLines={1}>Discussion</Text>
        <Pressable onPress={handleReport} hitSlop={10} style={styles.iconBtnSm}>
          <Feather name="flag" size={16} color={themeColors.textMuted} />
        </Pressable>
        <Pressable
          onPress={handleBookmark}
          hitSlop={10}
          style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: themeColors.border }]}
        >
          <Feather name="bookmark" size={17} color={bookmarked ? '#F59E0B' : themeColors.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <AnimatedSection delay={0} style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.authorRow}>
              <View style={[styles.avatar, { backgroundColor: themeColors.primaryBright + '20' }]}>
                <Text style={[styles.avatarLetter, { color: themeColors.primaryBright }]}>
                  {authorName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.authorName, { color: themeColors.text }]}>{authorName}</Text>
                <Text style={[styles.metaText, { color: themeColors.textMuted }]}>
                  {timeAgo(discussion.createdAt)} • {discussion.views || 0} views
                </Text>
              </View>
            </View>

            <Text style={[styles.title, { color: themeColors.text }]}>{discussion.title}</Text>
            <Text style={[styles.content, { color: themeColors.textMuted }]}>{discussion.content}</Text>

            <View style={styles.reactionsRow}>
              {REACTIONS.map((r) => (
                <Pressable
                  key={r.type}
                  onPress={() => handleReact(r.type)}
                  disabled={reacting}
                  style={[
                    styles.reactionPill,
                    { borderColor: themeColors.border },
                    myReaction === r.type && { backgroundColor: themeColors.primaryBright + '20', borderColor: themeColors.primaryBright },
                  ]}
                >
                  <Feather name={r.icon} size={13} color={myReaction === r.type ? themeColors.primaryBright : themeColors.textMuted} />
                  {reactionCounts[r.type] > 0 && (
                    <Text style={[styles.reactionCount, { color: myReaction === r.type ? themeColors.primaryBright : themeColors.textMuted }]}>
                      {reactionCounts[r.type]}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          </AnimatedSection>

          <AnimatedSection delay={80} style={{ marginTop: 18 }}>
            <Text style={[styles.repliesHeading, { color: themeColors.text }]}>
              {discussion.replies?.length || 0} {discussion.replies?.length === 1 ? 'Reply' : 'Replies'}
            </Text>

            {(discussion.replies || []).length === 0 ? (
              <Text style={[styles.emptyText, { color: themeColors.textMuted, marginTop: 8 }]}>
                No replies yet. Be the first to respond.
              </Text>
            ) : (
              discussion.replies.map((reply) => {
                const replyAuthor = reply.author?.fullName || reply.author?.email || 'Student';
                return (
                  <View key={reply._id} style={[styles.replyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                    <View style={styles.authorRow}>
                      <View style={[styles.avatar, styles.avatarSm, { backgroundColor: themeColors.border }]}>
                        <Text style={[styles.avatarLetter, { color: themeColors.text, fontSize: 11 }]}>
                          {replyAuthor.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.replyAuthor, { color: themeColors.text }]}>{replyAuthor}</Text>
                        <Text style={[styles.metaText, { color: themeColors.textMuted }]}>{timeAgo(reply.createdAt)}</Text>
                      </View>
                    </View>
                    <Text style={[styles.replyContent, { color: themeColors.textMuted }]}>{reply.content}</Text>
                  </View>
                );
              })
            )}
          </AnimatedSection>
        </ScrollView>

        <View style={[styles.replyInputRow, { borderTopColor: themeColors.border, backgroundColor: themeColors.bg }]}>
          <TextInput
            style={[styles.replyInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
            placeholder="Write a reply..."
            placeholderTextColor={themeColors.textMuted}
            value={replyText}
            onChangeText={setReplyText}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, { backgroundColor: themeColors.primaryBright }, sendingReply && { opacity: 0.6 }]}
            disabled={sendingReply}
            onPress={handleReply}
          >
            {sendingReply ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Feather name="send" size={16} color="#FFFFFF" />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnSm: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 24 },
  card: { borderRadius: 20, borderWidth: 1.5, padding: 16 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarSm: { width: 28, height: 28, borderRadius: 14 },
  avatarLetter: { fontWeight: '800', fontSize: 14 },
  authorName: { fontSize: 13.5, fontWeight: '800' },
  metaText: { fontSize: 10.5, fontWeight: '600', marginTop: 1 },
  title: { fontSize: 18, fontWeight: '800', lineHeight: 24, marginBottom: 8 },
  content: { fontSize: 13.5, lineHeight: 20, fontWeight: '500' },
  reactionsRow: { flexDirection: 'row', gap: 8, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(120,120,120,0.15)' },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  reactionCount: { fontSize: 11, fontWeight: '800' },
  repliesHeading: { fontSize: 14, fontWeight: '800', marginBottom: 10 },
  replyCard: { borderRadius: 16, borderWidth: 1.5, padding: 13, marginBottom: 10 },
  replyAuthor: { fontSize: 12.5, fontWeight: '800' },
  replyContent: { fontSize: 12.5, lineHeight: 18, fontWeight: '500', marginTop: 8 },
  emptyText: { fontSize: 12.5, fontWeight: '600', textAlign: 'center' },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    borderTopWidth: 1.5,
  },
  replyInput: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12.5,
    fontWeight: '600',
    maxHeight: 100,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
