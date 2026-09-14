import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { announcementsAPI } from '../../api/announcements';
import { groupsAPI } from '../../api/groups';
import { communityFeedAPI } from '../../api/communityFeed';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Matches the server's own default for `GET /community/discussions`. */
const DISCUSSIONS_PER_PAGE = 10;

const GROUP_ICONS = ['users', 'book-open', 'coffee', 'award', 'zap', 'hash'];
const GROUP_COLORS = ['#1478B8', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6'];

function AnimatedSection({ children, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
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

export default function CommunityScreen({ navigation }) {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const { colors: themeColors, theme } = useTheme();

  const [activeTab, setActiveTab] = useState('notices'); // 'notices' | 'groups' | 'discussions'
  const [loading, setLoading] = useState(true);

  // Data States
  const [announcements, setAnnouncements] = useState([]);
  const [groups, setGroups] = useState([]);

  // Discussions feed state
  const [discussions, setDiscussions] = useState([]);
  const [discussionsPage, setDiscussionsPage] = useState(1);
  const [discussionsPages, setDiscussionsPages] = useState(1);
  const [discussionsTotal, setDiscussionsTotal] = useState(0);
  const [discussionsLoadingMore, setDiscussionsLoadingMore] = useState(false);
  const [discussionSearch, setDiscussionSearch] = useState('');
  const [createPostModalVisible, setCreatePostModalVisible] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);

  // Notices Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week'
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'admin', 'college_admin'

  // Chat Modal States
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Create Group Modal States
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('users');
  const [newGroupColor, setNewGroupColor] = useState('#1478B8');
  const [creatingGroup, setCreatingGroup] = useState(false);

  const fetchNotices = async () => {
    try {
      const params = dateFilter !== 'all' ? { dateFilter } : {};
      const res = await announcementsAPI.getAnnouncements(params);
      if (res?.success) {
        // Pinned first, then sorted by date
        const sorted = [...res.data].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setAnnouncements(sorted);
      }
    } catch (err) {
      console.warn('Failed to load notices:', err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await groupsAPI.getMyGroups();
      if (res?.success) {
        setGroups(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to load study groups:', err);
    }
  };

  /**
   * Counts one emoji on an announcement.
   *
   * `Announcement.reactions` is an ARRAY of `{ userId, emoji }` (see
   * `back-end/models/Announcement.js`), not a map of emoji to a list of people.
   * Reading it as `reactions[emoji].length` always produced `undefined` and the
   * count always rendered zero, no matter how many people had reacted — and the
   * "did I react" check compared against an email against a list of ObjectIds,
   * so a student's own reaction never highlighted either.
   */
  const summariseReaction = (reactions, emoji, currentUserId) => {
    if (!Array.isArray(reactions)) return { count: 0, mine: false };
    let count = 0;
    let mine = false;
    reactions.forEach((r) => {
      if (r?.emoji !== emoji) return;
      count += 1;
      if (currentUserId && String(r.userId?._id || r.userId) === String(currentUserId)) mine = true;
    });
    return { count, mine };
  };

  /**
   * Loads one page of discussions, appending when paging forward.
   *
   * This used to ask for a flat 30 with no way to reach anything older, so an
   * active community silently truncated. The server reports
   * `pagination.pages`, which is what drives the load-more row.
   */
  const fetchDiscussions = async (page = 1) => {
    if (page > 1) setDiscussionsLoadingMore(true);
    try {
      const res = await communityFeedAPI.getDiscussions({ page, limit: DISCUSSIONS_PER_PAGE });
      if (res?.success) {
        const rows = res.data || [];
        setDiscussions((prev) => (page === 1 ? rows : [...prev, ...rows]));
        setDiscussionsPage(res.pagination?.page || page);
        setDiscussionsPages(res.pagination?.pages || 1);
        setDiscussionsTotal(res.pagination?.total ?? rows.length);
      }
    } catch (err) {
      console.warn('Failed to load discussions:', err);
    } finally {
      setDiscussionsLoadingMore(false);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    if (activeTab === 'notices') {
      await fetchNotices();
    } else if (activeTab === 'groups') {
      await fetchGroups();
    } else {
      await fetchDiscussions();
    }
    setLoading(false);
  }, [activeTab, dateFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Notice reactions toggle
  const handleReact = async (id, emoji) => {
    try {
      const res = await announcementsAPI.react(id, emoji);
      if (res?.success) {
        setAnnouncements((prev) =>
          prev.map((ann) =>
            ann._id === id ? { ...ann, reactions: res.data.reactions } : ann
          )
        );
      }
    } catch (err) {
      console.warn('React error:', err);
    }
  };

  // Create Group submission
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Required', 'Please enter a group name.');
      return;
    }

    setCreatingGroup(true);
    try {
      const res = await groupsAPI.createGroup({
        name: newGroupName,
        description: newGroupDesc,
        icon: newGroupIcon,
        color: newGroupColor,
      });

      if (res?.success) {
        Alert.alert('Success', 'Study group created successfully!');
        setCreateGroupModalVisible(false);
        setNewGroupName('');
        setNewGroupDesc('');
        fetchGroups();
      }
    } catch (err) {
      Alert.alert('Failed', err.message || 'Please try again.');
    } finally {
      setCreatingGroup(false);
    }
  };

  // Open chat message overlay
  const handleOpenGroupChat = async (group) => {
    setSelectedGroup(group);
    setChatModalVisible(true);
    setChatMessages([]);
    try {
      const res = await groupsAPI.getGroup(group._id);
      if (res?.success) {
        // Reverse messages so they stack from bottom up
        setChatMessages(res.data?.messages || []);
      }
    } catch (err) {
      console.warn('Failed to load messages:', err);
    }
  };

  // Send message in group chat
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedGroup) return;

    setSendingMessage(true);
    try {
      const res = await groupsAPI.sendMessage(selectedGroup._id, chatInput);
      if (res?.success) {
        setChatMessages([...chatMessages, res.data]);
        setChatInput('');
      }
    } catch (err) {
      console.warn('Failed to send:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Group chat has no realtime layer (web doesn't either — see IMPLEMENTATION_MAP.md,
  // it polls every 3s rather than standing up Socket.io for this one feature).
  // Mirrors that exact approach: refetch while the chat overlay is open.
  useEffect(() => {
    if (!chatModalVisible || !selectedGroup) return undefined;
    const id = setInterval(async () => {
      try {
        const res = await groupsAPI.getGroup(selectedGroup._id);
        if (res?.success) setChatMessages(res.data?.messages || []);
      } catch {
        // A missed poll just means the next tick catches up.
      }
    }, 3000);
    return () => clearInterval(id);
  }, [chatModalVisible, selectedGroup]);

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert('Required', 'Please enter both a title and some content.');
      return;
    }

    setCreatingPost(true);
    try {
      const formData = new FormData();
      formData.append('title', newPostTitle.trim());
      formData.append('content', newPostContent.trim());
      formData.append('channelType', 'discussion');
      const res = await communityFeedAPI.createDiscussion(formData);
      if (res?.success) {
        setCreatePostModalVisible(false);
        setNewPostTitle('');
        setNewPostContent('');
        fetchDiscussions();
      }
    } catch (err) {
      Alert.alert('Failed', err.message || 'Please try again.');
    } finally {
      setCreatingPost(false);
    }
  };

  // Filter Notices
  const filteredNotices = useMemo(() => {
    return announcements.filter((ann) => {
      const matchRole =
        roleFilter === 'all' || ann.createdByRole === roleFilter;

      const title = (ann.title || '').toLowerCase();
      const desc = (ann.description || '').toLowerCase();
      const matchSearch =
        !searchQuery.trim() ||
        title.includes(searchQuery.toLowerCase()) ||
        desc.includes(searchQuery.toLowerCase());

      return matchRole && matchSearch;
    });
  }, [announcements, roleFilter, searchQuery]);

  const filteredDiscussions = useMemo(() => {
    const query = discussionSearch.trim().toLowerCase();
    if (!query) return discussions;
    return discussions.filter((d) => {
      const title = (d.title || '').toLowerCase();
      const content = (d.content || '').toLowerCase();
      return title.includes(query) || content.includes(query);
    });
  }, [discussions, discussionSearch]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]} edges={['top']}>
      {/* Aurora mesh background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.auroraBlob, { backgroundColor: '#8B5CF6', top: -100, left: -60, width: 280, height: 280, borderRadius: 140, opacity: theme === 'dark' ? 0.12 : 0.05 }]} />
        <View style={[styles.auroraBlob, { backgroundColor: '#EC4899', top: 320, right: -120, width: 340, height: 340, borderRadius: 170, opacity: theme === 'dark' ? 0.08 : 0.04 }]} />
      </View>

      <AnimatedSection delay={0}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>University Hub</Text>
            <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>
              Stay updated with college bulletins and participate in student groups.
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('VisionBoard')}
            style={[styles.visionBoardBtn, { backgroundColor: theme === 'dark' ? 'rgba(139,92,246,0.16)' : 'rgba(139,92,246,0.1)' }]}
          >
            <Feather name="eye" size={14} color="#8B5CF6" />
            <Text style={styles.visionBoardBtnText}>Vision Board</Text>
          </Pressable>
        </View>
      </AnimatedSection>

      {/* Segment Tab Selector */}
      <AnimatedSection delay={60}>
        <View style={[styles.selectorBar, { backgroundColor: theme === 'dark' ? '#0E3555' : '#EAF7FD' }]}>
          <TouchableOpacity
            style={[styles.selectorBtn, activeTab === 'notices' && [styles.selectorBtnActive, { backgroundColor: themeColors.primaryBright }]]}
            onPress={() => setActiveTab('notices')}
          >
            <Text style={[styles.selectorText, { color: activeTab === 'notices' ? '#FFFFFF' : themeColors.textMuted }]}>Notice Board</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectorBtn, activeTab === 'groups' && [styles.selectorBtnActive, { backgroundColor: themeColors.primaryBright }]]}
            onPress={() => setActiveTab('groups')}
          >
            <Text style={[styles.selectorText, { color: activeTab === 'groups' ? '#FFFFFF' : themeColors.textMuted }]}>Study Groups</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.selectorBtn, activeTab === 'discussions' && [styles.selectorBtnActive, { backgroundColor: themeColors.primaryBright }]]}
            onPress={() => setActiveTab('discussions')}
          >
            <Text style={[styles.selectorText, { color: activeTab === 'discussions' ? '#FFFFFF' : themeColors.textMuted }]}>Discussions</Text>
          </TouchableOpacity>
        </View>
      </AnimatedSection>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.primaryBright} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* NOTICE BOARD TAB */}
          {activeTab === 'notices' && (
            <AnimatedSection delay={80}>
            <View style={styles.tabContent}>
              {/* Search notices */}
              <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Feather name="search" size={16} color={themeColors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, { color: themeColors.text }]}
                  placeholder="Search announcements..."
                  placeholderTextColor={themeColors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Filters */}
              <View style={styles.pillsRow}>
                {/* Date Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                  {[
                    { id: 'all', label: 'All Dates' },
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'This Week' },
                  ].map((df) => (
                    <TouchableOpacity
                      key={df.id}
                      style={[
                        styles.filterPill,
                        { backgroundColor: themeColors.card, borderColor: themeColors.border },
                        dateFilter === df.id && { backgroundColor: themeColors.primaryBright, borderColor: themeColors.primaryBright },
                      ]}
                      onPress={() => setDateFilter(df.id)}
                    >
                      <Text style={[styles.filterPillText, { color: dateFilter === df.id ? '#FFFFFF' : themeColors.text }]}>
                        {df.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Announcements Feed */}
              {filteredNotices.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="bell" size={32} color={themeColors.textMuted} />
                  <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>No announcements found.</Text>
                </View>
              ) : (
                filteredNotices.map((ann) => {
                  const roleLabel =
                    ann.createdByRole === 'admin' ? 'SMAART Admin' : 'College Admin';
                  
                  return (
                    <View key={ann._id} style={[styles.noticeCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                      <View style={styles.noticeHeader}>
                        <View style={[styles.noticeIconWrap, { backgroundColor: ann.isPinned ? '#FEF3C7' : 'rgba(4, 92, 154, 0.08)' }]}>
                          <Feather name={ann.isPinned ? 'pin' : 'volume-2'} size={15} color={ann.isPinned ? '#D97706' : themeColors.primaryBright} />
                        </View>
                        <View style={styles.noticeMeta}>
                          <Text style={[styles.noticeTitle, { color: themeColors.text }]}>{ann.title}</Text>
                          <Text style={[styles.noticeIssuer, { color: themeColors.textMuted }]}>
                            {roleLabel} • {new Date(ann.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.noticeDesc, { color: themeColors.textMuted }]}>{ann.description}</Text>

                      {/* Reactions Row */}
                      <View style={styles.reactionRow}>
                        {[
                          { emoji: '👍', label: 'Like' },
                          { emoji: '❤️', label: 'Love' },
                          { emoji: '🎉', label: 'Celebrate' },
                        ].map((rx) => {
                          const { count, mine: hasReacted } = summariseReaction(ann.reactions, rx.emoji, userId);

                          return (
                            <TouchableOpacity
                              key={rx.emoji}
                              style={[
                                styles.reactBtn,
                                { backgroundColor: themeColors.border },
                                hasReacted && { backgroundColor: themeColors.primaryBright + '20', borderColor: themeColors.primaryBright },
                              ]}
                              onPress={() => handleReact(ann._id, rx.emoji)}
                            >
                              <Text style={{ fontSize: 11 }}>{rx.emoji}</Text>
                              <Text style={[styles.reactCount, { color: themeColors.text }]}>{count}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
            </AnimatedSection>
          )}

          {/* STUDY GROUPS TAB */}
          {activeTab === 'groups' && (
            <AnimatedSection delay={80}>
            <View style={styles.tabContent}>
              <View style={styles.groupsHeaderRow}>
                <Text style={[styles.sectionHeading, { color: themeColors.text }]}>Collaborate with Peers</Text>
                <TouchableOpacity
                  style={[styles.createGroupBtn, { backgroundColor: themeColors.primaryBright }]}
                  onPress={() => setCreateGroupModalVisible(true)}
                >
                  <Feather name="plus" size={14} color="#FFFFFF" />
                  <Text style={styles.createGroupText}>Create Group</Text>
                </TouchableOpacity>
              </View>

              {groups.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="users" size={32} color={themeColors.textMuted} />
                  <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                    No study groups yet. Create one to begin.
                  </Text>
                </View>
              ) : (
                groups.map((group) => {
                  const grpColor = group.color || '#1478B8';
                  const grpIcon = group.icon && GROUP_ICONS.includes(group.icon) ? group.icon : 'users';

                  return (
                    <PressCard
                      key={group._id}
                      style={[styles.noticeCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                      onPress={() => handleOpenGroupChat(group)}
                    >
                      <View style={styles.noticeHeader}>
                        <View style={[styles.noticeIconWrap, { backgroundColor: grpColor + '15' }]}>
                          <Feather name={grpIcon} size={16} color={grpColor} />
                        </View>
                        <View style={styles.noticeMeta}>
                          <Text style={[styles.noticeTitle, { color: themeColors.text }]}>{group.name}</Text>
                          <Text style={[styles.noticeIssuer, { color: themeColors.textMuted }]}>
                            {group.memberCount || 1} members
                          </Text>
                        </View>
                        <Feather name="chevron-right" size={16} color={themeColors.textMuted} style={{ marginLeft: 'auto' }} />
                      </View>
                      <Text style={[styles.noticeDesc, { color: themeColors.textMuted }]} numberOfLines={2}>
                        {group.description || 'No description provided.'}
                      </Text>
                    </PressCard>
                  );
                })
              )}
            </View>
            </AnimatedSection>
          )}

          {/* DISCUSSIONS TAB */}
          {activeTab === 'discussions' && (
            <AnimatedSection delay={80}>
            <View style={styles.tabContent}>
              <View style={styles.groupsHeaderRow}>
                <Text style={[styles.sectionHeading, { color: themeColors.text }]}>Ask, share, discuss</Text>
                <TouchableOpacity
                  style={[styles.createGroupBtn, { backgroundColor: themeColors.primaryBright }]}
                  onPress={() => setCreatePostModalVisible(true)}
                >
                  <Feather name="plus" size={14} color="#FFFFFF" />
                  <Text style={styles.createGroupText}>New Post</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <Feather name="search" size={16} color={themeColors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.searchInput, { color: themeColors.text }]}
                  placeholder="Search discussions..."
                  placeholderTextColor={themeColors.textMuted}
                  value={discussionSearch}
                  onChangeText={setDiscussionSearch}
                />
              </View>

              {filteredDiscussions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="message-circle" size={32} color={themeColors.textMuted} />
                  <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
                    No discussions yet. Start the conversation.
                  </Text>
                </View>
              ) : (
                filteredDiscussions.map((post) => {
                  const authorName = post.author?.fullName || post.author?.email || 'Student';
                  const replyCount = post.replies?.length || 0;
                  const reactionCount = (post.reactions?.length || 0) + (post.likes?.length || 0);

                  return (
                    <PressCard
                      key={post._id}
                      style={[styles.noticeCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                      onPress={() => navigation.navigate('DiscussionDetail', { discussionId: post._id })}
                    >
                      <View style={styles.noticeHeader}>
                        <View style={[styles.noticeIconWrap, { backgroundColor: 'rgba(20,120,184,0.12)' }]}>
                          <Feather name="message-circle" size={15} color="#1478B8" />
                        </View>
                        <View style={styles.noticeMeta}>
                          <Text style={[styles.noticeTitle, { color: themeColors.text }]} numberOfLines={1}>{post.title}</Text>
                          <Text style={[styles.noticeIssuer, { color: themeColors.textMuted }]}>
                            {authorName} • {new Date(post.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.noticeDesc, { color: themeColors.textMuted }]} numberOfLines={2}>
                        {post.content}
                      </Text>

                      <View style={styles.reactionRow}>
                        <View style={styles.discussionStat}>
                          <Feather name="heart" size={12} color={themeColors.textMuted} />
                          <Text style={[styles.reactCount, { color: themeColors.textMuted }]}>{reactionCount}</Text>
                        </View>
                        <View style={styles.discussionStat}>
                          <Feather name="message-square" size={12} color={themeColors.textMuted} />
                          <Text style={[styles.reactCount, { color: themeColors.textMuted }]}>{replyCount}</Text>
                        </View>
                        <View style={styles.discussionStat}>
                          <Feather name="eye" size={12} color={themeColors.textMuted} />
                          <Text style={[styles.reactCount, { color: themeColors.textMuted }]}>{post.views || 0}</Text>
                        </View>
                      </View>
                    </PressCard>
                  );
                })
              )}

              {/* Load-more. Hidden while a search filter is active, since the
                  filter only sees what has already been fetched. */}
              {!discussionSearch.trim() && discussionsPage < discussionsPages && (
                <TouchableOpacity
                  onPress={() => fetchDiscussions(discussionsPage + 1)}
                  disabled={discussionsLoadingMore}
                  style={[styles.loadMoreBtn, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}
                >
                  {discussionsLoadingMore ? (
                    <ActivityIndicator size="small" color={themeColors.primaryBright} />
                  ) : (
                    <Text style={[styles.loadMoreText, { color: themeColors.primaryBright }]}>
                      Load older discussions ({discussions.length} of {discussionsTotal})
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
            </AnimatedSection>
          )}
        </ScrollView>
      )}

      {/* CREATE DISCUSSION POST MODAL */}
      <Modal visible={createPostModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.bg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalHeaderTitle, { color: themeColors.text }]}>New Discussion</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setCreatePostModalVisible(false)}>
                <Feather name="x" size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Title</Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="What's your question or topic?"
                placeholderTextColor={themeColors.textMuted}
                value={newPostTitle}
                onChangeText={setNewPostTitle}
              />

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Content</Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text, height: 110, textAlignVertical: 'top' }]}
                placeholder="Share the details..."
                placeholderTextColor={themeColors.textMuted}
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
                numberOfLines={5}
              />

              <TouchableOpacity
                style={[styles.submitGroupBtn, { backgroundColor: themeColors.primaryBright }, creatingPost && { opacity: 0.6 }]}
                disabled={creatingPost}
                onPress={handleCreatePost}
              >
                {creatingPost ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitGroupText}>Post Discussion</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CREATE STUDY GROUP MODAL */}
      <Modal visible={createGroupModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.bg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalHeaderTitle, { color: themeColors.text }]}>Create Study Group</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setCreateGroupModalVisible(false)}>
                <Feather name="x" size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Group Name</Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="e.g. CS Assignment Study Room"
                placeholderTextColor={themeColors.textMuted}
                value={newGroupName}
                onChangeText={setNewGroupName}
              />

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Description</Text>
              <TextInput
                style={[styles.modalTextInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, color: themeColors.text }]}
                placeholder="What is this group about?"
                placeholderTextColor={themeColors.textMuted}
                value={newGroupDesc}
                onChangeText={setNewGroupDesc}
                multiline
                numberOfLines={2}
              />

              <Text style={[styles.inputLabel, { color: themeColors.text }]}>Select Icon</Text>
              <View style={styles.choicesRow}>
                {GROUP_ICONS.map((ic) => (
                  <TouchableOpacity
                    key={ic}
                    style={[
                      styles.choicePill,
                      { borderColor: themeColors.border },
                      newGroupIcon === ic && { backgroundColor: themeColors.primaryBright, borderColor: themeColors.primaryBright },
                    ]}
                    onPress={() => setNewGroupIcon(ic)}
                  >
                    <Feather name={ic} size={14} color={newGroupIcon === ic ? '#FFFFFF' : themeColors.text} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: themeColors.text, marginTop: 14 }]}>Select Color Accent</Text>
              <View style={styles.choicesRow}>
                {GROUP_COLORS.map((col) => (
                  <TouchableOpacity
                    key={col}
                    style={[
                      styles.colorBall,
                      { backgroundColor: col },
                      newGroupColor === col && { borderWidth: 2.5, borderColor: themeColors.text },
                    ]}
                    onPress={() => setNewGroupColor(col)}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitGroupBtn, { backgroundColor: themeColors.primaryBright }, creatingGroup && { opacity: 0.6 }]}
                disabled={creatingGroup}
                onPress={handleCreateGroup}
              >
                {creatingGroup ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitGroupText}>Create Group</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* GROUP MESSAGE overlay MODAL */}
      <Modal visible={chatModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.bg, height: '90%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.modalHeaderTitle, { color: themeColors.text }]} numberOfLines={1}>
                {selectedGroup?.name}
              </Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setChatModalVisible(false)}>
                <Feather name="x" size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>

            {/* Messages feed */}
            <ScrollView contentContainerStyle={styles.chatScroll} showsVerticalScrollIndicator={false}>
              {chatMessages.length === 0 ? (
                <Text style={[styles.noChatText, { color: themeColors.textMuted }]}>
                  No messages yet. Send a message to start the study group conversation!
                </Text>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMine = msg.senderEmail === user?.email;
                  return (
                    <View
                      key={msg._id || idx}
                      style={[
                        styles.chatBubbleContainer,
                        isMine ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' },
                      ]}
                    >
                      {!isMine && (
                        <Text style={[styles.chatSenderName, { color: themeColors.textMuted }]}>
                          {msg.senderName || 'Peer Student'}
                        </Text>
                      )}
                      <View
                        style={[
                          styles.chatBubble,
                          isMine
                            ? { backgroundColor: themeColors.primaryBright }
                            : { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 },
                        ]}
                      >
                        <Text style={[styles.chatText, isMine ? { color: '#FFFFFF' } : { color: themeColors.text }]}>
                          {msg.content}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Input wrap */}
            <View style={[styles.chatInputRow, { borderTopColor: themeColors.border }]}>
              <TextInput
                style={[styles.chatTextInput, { backgroundColor: themeColors.card, color: themeColors.text, borderColor: themeColors.border }]}
                placeholder="Type your study message..."
                placeholderTextColor={themeColors.textMuted}
                value={chatInput}
                onChangeText={setChatInput}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: themeColors.primaryBright }]}
                disabled={sendingMessage}
                onPress={handleSendMessage}
              >
                <Feather name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  auroraBlob: {
    position: 'absolute',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  visionBoardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
  },
  visionBoardBtnText: { fontSize: 11.5, fontWeight: '800', color: '#8B5CF6' },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  selectorBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  selectorBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  selectorBtnActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  selectorText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  tabContent: {
    gap: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  pillsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  filterPill: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '850',
  },
  loadMoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  loadMoreText: { fontSize: 13, fontWeight: '800' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  noticeCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#0F1E42',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 16,
    elevation: 1,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeMeta: {
    marginLeft: 10,
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13.5,
    fontWeight: '850',
  },
  noticeIssuer: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  noticeDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 12,
    fontWeight: '500',
  },
  reactionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  reactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  reactCount: {
    fontSize: 10,
    fontWeight: '800',
  },
  discussionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '850',
  },
  createGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 4,
  },
  createGroupText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  /* MODAL OVERLAY STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1.5,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalTextInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  choicesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  choicePill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorBall: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  submitGroupBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  submitGroupText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* GROUP CHAT LAYOUT */
  chatScroll: {
    padding: 16,
    gap: 12,
  },
  noChatText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 12,
    lineHeight: 18,
  },
  chatBubbleContainer: {
    maxWidth: '75%',
  },
  chatSenderName: {
    fontSize: 9.5,
    fontWeight: '700',
    marginBottom: 2,
    marginLeft: 4,
  },
  chatBubble: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  chatText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  chatInputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1.5,
    alignItems: 'center',
    gap: 10,
  },
  chatTextInput: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 12.5,
    fontWeight: '600',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
