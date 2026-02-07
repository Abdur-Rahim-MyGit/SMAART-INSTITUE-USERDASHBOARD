import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Bell, Users, MessageCircle, Heart, Share2, Search, TrendingUp, Star, BookOpen, Award, ChevronRight, ChevronLeft, Plus, Loader2, Bookmark, Send, MoreVertical, Image as ImageIcon, X, CheckCircle, Play, Video, Trophy, ThumbsUp, Lightbulb, Handshake } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { communityAPI } from "@/services/communityApi";
import { groupsAPI } from "@/services/groupsApi";
import { moderateText } from "@/utils/contentModeration";

// Icon mapping for groups
const iconMap = {
  TrendingUp,
  BookOpen,
  Award,
  Users,
  Star,
  Target: TrendingUp,
  Wrench: Award
};

const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'Like', color: 'text-blue-500', icon: ThumbsUp },
  { type: 'heart', emoji: '❤️', label: 'Love', color: 'text-red-500', icon: Heart },
  { type: 'insightful', emoji: '💡', label: 'Insightful', color: 'text-yellow-500', icon: Lightbulb },
  { type: 'support', emoji: '🤝', label: 'Support', color: 'text-green-500', icon: Handshake }
];

const BestAnswerBadge = () => (
  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-lg border border-green-200">
    <CheckCircle className="w-3 h-3 text-green-600" />
    BEST ANSWER
  </div>
);

const AdminBadge = () => (
  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-[#002147] text-white text-[9px] font-black rounded flex-shrink-0">
    <Star className="w-2.5 h-2.5 fill-current text-yellow-500" />
    OFFICIAL
  </div>
);

// Helper to format time ago
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const Community = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("discussions");
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({ totalMembers: 0, totalDiscussions: 0, totalGroups: 0, activeToday: 0 });
  const [discussions, setDiscussions] = useState([]);
  const [featuredGroups, setFeaturedGroups] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState("createdAt");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [reportingId, setReportingId] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "general" });
  const [submitting, setSubmitting] = useState(false);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [expandedDiscussionId, setExpandedDiscussionId] = useState(null);
  const [replyMenuOpenId, setReplyMenuOpenId] = useState(null);
  const [moderationWarning, setModerationWarning] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [activeReactionPickerId, setActiveReactionPickerId] = useState(null);
  const [showPollEditor, setShowPollEditor] = useState(false);
  const [pollData, setPollData] = useState({ options: ["", ""] });
  const [votingId, setVotingId] = useState(null);
  const [viewerImage, setViewerImage] = useState(null);
  const fileInputRef = useRef(null);

  // Share to Group State
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingDiscussionId, setSharingDiscussionId] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [sharingToGroups, setSharingToGroups] = useState(false);

  // Image Viewer Navigation
  const feedImages = discussions
    .map(d => d.media?.url)
    .filter(url => url && !url.match(/\.(mp4|mov|webm)$|video\/upload/i));

  const handlePrevImage = (e) => {
    e?.stopPropagation();
    const currentIndex = feedImages.indexOf(viewerImage);
    if (currentIndex > 0) {
      setViewerImage(feedImages[currentIndex - 1]);
    }
  };

  const handleNextImage = (e) => {
    e?.stopPropagation();
    const currentIndex = feedImages.indexOf(viewerImage);
    if (currentIndex < feedImages.length - 1) {
      setViewerImage(feedImages[currentIndex + 1]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!viewerImage) return;
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'Escape') setViewerImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerImage, feedImages]);

  const handleMediaChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      setSelectedMedia(file);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      setSelectedMedia(file);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const userCollegeId = currentUser?.college?._id || currentUser?.college || null;
  const currentUserId = currentUser ? String(currentUser._id || currentUser.id || currentUser.userId || "") : "";

  const getAuthorName = (author) => {
    if (!author) return 'Anonymous';
    return author.fullName || author.name || author.email || 'Anonymous';
  };

  const getAuthorId = (author) => {
    if (!author) return "";
    return String(author._id || author.id || author.userId || author);
  };

  // Get current user
  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Community - Loaded user from session:', {
          id: parsedUser.id,
          _id: parsedUser._id,
          userId: parsedUser.userId,
          email: parsedUser.email
        });
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error('Community - Failed to parse user data:', e);
      }
    } else {
      console.warn('Community - No user data found in sessionStorage');
    }
  }, []);

  // Fetch community data (Stats, Groups, Contributors)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats, groups, and contributors in parallel
        const [statsRes, groupsRes, contributorsRes] = await Promise.all([
          communityAPI.getStats().catch(() => ({ success: false })),
          groupsAPI.getMyGroups().catch(() => ({ success: false })),
          communityAPI.getTopContributors(4).catch(() => ({ success: false }))
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (groupsRes.success) setFeaturedGroups(groupsRes.data);
        if (contributorsRes.success) setTopContributors(contributorsRes.data);
      } catch (error) {
        console.error('Error fetching community meta data:', error);
      }
    };
    fetchData();
  }, [currentUser]);

  // Unified discussion fetcher
  const fetchDiscussions = async (pageNum = 1, append = false) => {
    // Ensure we have user data. If not in state, try to get from storage one last time.
    let userId = currentUserId;
    if (!userId) {
      try {
        const stored = JSON.parse(sessionStorage.getItem("user") || "{}");
        userId = stored._id || stored.id || stored.userId;
        if (userId && !currentUser) setCurrentUser(stored);
      } catch (e) { /* ignore */ }
    }

    if (!userId && activeTab !== 'discussions') {
      console.warn("No user ID found, cannot fetch private discussions");
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      let result;
      const params = {
        page: pageNum,
        limit: 10,
        sortBy,
        collegeId: userCollegeId || undefined,
        search: searchQuery || undefined
      };

      switch (activeTab) {
        case "my posts":
          result = await communityAPI.getUserDiscussions(userId, params);
          break;
        case "bookmarks":
          result = await communityAPI.getBookmarkedDiscussions(userId, params);
          break;
        default:
          result = await communityAPI.getDiscussions(params);
      }

      if (result.success) {
        if (append) {
          setDiscussions(prev => [...prev, ...result.data]);
        } else {
          setDiscussions(result.data);
        }
        // If we got fewer results than limit, there are no more pages
        setHasMore(result.data.length === 10);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Unified fetch effect - triggers on tab, sort, search, or user change
  useEffect(() => {
    setPage(1);
    fetchDiscussions(1, false);
  }, [activeTab, sortBy, debouncedSearch, currentUser]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDiscussions(nextPage, true);
  };

  // Handle search
  const handleSearch = () => {
    setDebouncedSearch(searchQuery);
  };

  // Handle reaction
  const handleReact = async (discussionId, type) => {
    if (!currentUser || !currentUserId) return;

    try {
      const result = await communityAPI.reactToDiscussion(discussionId, currentUserId, type);
      if (result.success) {
        setDiscussions(prev => prev.map(d =>
          d._id === discussionId
            ? { ...d, reactions: result.data.reactions }
            : d
        ));
        setActiveReactionPickerId(null);
      }
    } catch (error) {
      console.error('Error reacting:', error);
    }
  };

  // Handle like
  const handleLike = async (discussionId) => {
    if (!currentUser || !currentUserId) return;

    try {
      const result = await communityAPI.toggleLike(discussionId, currentUserId);
      if (result.success) {
        setDiscussions(prev => prev.map(d =>
          d._id === discussionId
            ? { ...d, likes: result.data.isLiked ? [...d.likes, currentUserId] : d.likes.filter(id => id !== currentUserId) }
            : d
        ));
      }
    } catch (error) {
      console.error('Error liking:', error);
    }
  };

  // Handle bookmark
  const handleBookmark = async (discussionId) => {
    if (!currentUser || !currentUserId) return;

    try {
      const result = await communityAPI.toggleBookmark(discussionId, currentUserId);
      if (result.success) {
        setDiscussions(prev => prev.map(d =>
          d._id === discussionId
            ? { ...d, isBookmarkedBy: result.data.isBookmarked ? [...(d.isBookmarkedBy || []), currentUserId] : (d.isBookmarkedBy || []).filter(id => id !== currentUserId) }
            : d
        ));
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
    }
  };

  // Handle poll voting
  const handleVote = async (discussionId, optionIndex) => {
    if (!currentUser || !currentUserId || votingId) return;

    try {
      setVotingId(discussionId);
      const result = await communityAPI.voteInPoll(discussionId, currentUserId, optionIndex);
      if (result.success) {
        setDiscussions(prev => prev.map(d =>
          d._id === discussionId ? result.data : d
        ));
      } else {
        alert(result.error || "Failed to vote");
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert("An error occurred while voting");
    } finally {
      setVotingId(null);
    }
  };

  // Handle reply (comment)
  const handleReplySubmit = async (discussion) => {
    if (!currentUser || !replyText.trim()) return;

    if (userCollegeId && discussion.college && discussion.college !== userCollegeId) {
      console.warn('Replies restricted to your institution');
      return;
    }

    try {
      setReplySubmitting(true);
      const result = await communityAPI.addReply(discussion._id, replyText.trim(), currentUserId);
      if (result.success) {
        const updated = result.data;
        setDiscussions((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));
        setReplyText("");
        setReplyingId(null);
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleReplyEdit = async (discussionId, reply) => {
    if (!currentUser || !editText.trim()) return;
    try {
      setEditSubmitting(true);
      const result = await communityAPI.editReply(discussionId, reply._id, editText.trim(), currentUserId);
      if (result.success) {
        const updated = result.data;
        setDiscussions((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));
        setEditingReplyId(null);
        setEditText("");
      }
    } catch (error) {
      console.error('Error editing reply:', error);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleReplyDelete = async (discussionId, replyId) => {
    if (!currentUser) return;
    try {
      const result = await communityAPI.deleteReply(discussionId, replyId, currentUserId);
      if (result.success) {
        setDiscussions((prev) => prev.map((d) => (d._id === result.data._id ? result.data : d)));
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
  };

  const handleMarkBestAnswer = async (discussionId, replyId) => {
    if (!currentUser) return;
    try {
      const result = await communityAPI.markBestAnswer(discussionId, replyId, currentUserId);
      if (result.success) {
        setDiscussions((prev) => prev.map((d) => (d._id === discussionId ? result.data : d)));
      }
    } catch (error) {
      console.error('Error marking best answer:', error);
    }
  };

  // Handle create post
  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('Please enter a title and content for your post.');
      return;
    }

    // Check for inappropriate content
    const titleCheck = moderateText(newPost.title);
    const contentCheck = moderateText(newPost.content);

    if (!titleCheck.isClean) {
      setModerationWarning('Your title contains inappropriate language. Please revise before posting.');
      return;
    }

    if (!contentCheck.isClean) {
      setModerationWarning('Your content contains inappropriate language. Please revise before posting.');
      return;
    }

    setModerationWarning('');

    // Try multiple sources for the author ID
    // 1. From currentUser state (already parsed from storage on mount)
    // 2. Re-read from storage for latest data
    let storedUser = {};
    try {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        storedUser = JSON.parse(userStr);
      }
    } catch (e) {
      console.error('Failed to parse stored user:', e);
    }

    // Try all possible ID fields from both sources
    const authorId = currentUser?._id || currentUser?.id || currentUser?.userId ||
      storedUser?._id || storedUser?.id || storedUser?.userId ||
      currentUser?.user?._id || currentUser?.user?.id ||
      storedUser?.user?._id || storedUser?.user?.id ||
      currentUserId;

    // Get email as fallback for author lookup
    const authorEmail = currentUser?.email || storedUser?.email;

    console.log('Creating post - Author ID:', authorId);
    console.log('Creating post - Author Email:', authorEmail);

    if (!authorId && !authorEmail) {
      console.error('Missing Author ID and Email. Session might be invalid.');
      alert('Your session seems to be invalid. Please log out and log in again.');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('title', newPost.title);
      formData.append('content', newPost.content);
      formData.append('category', newPost.category);
      if (authorId) formData.append('authorId', authorId);
      if (authorEmail) formData.append('authorEmail', authorEmail);
      if (selectedMedia) formData.append('image', selectedMedia); // Field name remains 'image' for backend compat, but can be video

      if (showPollEditor && pollData.question?.trim() && pollData.options.filter(o => o.trim()).length >= 2) {
        const formattedPoll = {
          question: pollData.question,
          options: pollData.options.filter(o => o.trim()).map(o => ({ text: o, voters: [] })),
          expiresAt: pollData.expiresAt
        };
        formData.append('poll', JSON.stringify(formattedPoll));
      }

      const result = await communityAPI.createDiscussion(formData);

      if (result.success) {
        setDiscussions(prev => [result.data, ...prev]);
        setNewPost({ title: "", content: "", category: "general" });
        setSelectedMedia(null);
        setMediaPreview(null);
        setMediaType(null);
        setShowPollEditor(false);
        setPollData({ options: ["", ""] });
        setShowNewPostModal(false);
      } else {
        console.error('Failed to create post:', result.error);
        alert(result.error || 'Failed to create post. Please try again.');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('An error occurred while creating your post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportSubmit = async (discussionId) => {
    if (!currentUser || !currentUserId || !reportReason.trim()) return;

    try {
      setReportSubmitting(true);
      const result = await communityAPI.reportDiscussion(discussionId, currentUserId, reportReason);
      if (result.success) {
        alert("Thank you for your report. Our moderator team will review this content.");
        setReportingId(null);
        setReportReason("");
      } else {
        alert(result.error || "Failed to submit report");
      }
    } catch (error) {
      console.error("Error reporting:", error);
      alert("An error occurred");
    } finally {
      setReportSubmitting(false);
    }
  };

  // Handle share to groups
  const handleShareToGroups = async () => {
    if (!currentUser || !sharingDiscussionId || selectedGroups.length === 0) return;

    const discussion = discussions.find(d => d._id === sharingDiscussionId);
    if (!discussion) return;

    try {
      setSharingToGroups(true);

      // Prepare post data
      const postData = {
        discussionId: discussion._id,
        title: discussion.title,
        content: discussion.content,
        author: {
          name: getAuthorName(discussion.author),
          id: getAuthorId(discussion.author)
        },
        category: discussion.category,
        media: discussion.media ? {
          url: discussion.media.url,
          type: discussion.media.resourceType || (discussion.media.url.match(/\.(mp4|mov|webm)$|video\/upload/i) ? 'video' : 'image')
        } : null,
        poll: discussion.poll ? {
          question: discussion.poll.question,
          options: discussion.poll.options,
          expiresAt: discussion.poll.expiresAt
        } : null,
        createdAt: discussion.createdAt
      };

      // Share to all selected groups
      const sharePromises = selectedGroups.map(groupId =>
        groupsAPI.sharePostToGroup(groupId, postData)
      );

      const results = await Promise.all(sharePromises);

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        alert(`Successfully shared to ${successCount} group${successCount > 1 ? 's' : ''}!${failCount > 0 ? ` (${failCount} failed)` : ''}`);
      } else {
        const firstError = results.find(r => !r.success)?.error;
        alert(`Failed to share: ${firstError || "Unknown error"}`);
      }

      // Reset state
      setShowShareModal(false);
      setSharingDiscussionId(null);
      setSelectedGroups([]);
    } catch (error) {
      console.error("Error sharing to groups:", error);
      alert(`Error sharing: ${error.message}`);
    } finally {
      setSharingToGroups(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F5F7FA] dark:bg-[#0B1120] text-gray-900 dark:text-gray-100">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#002147]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        <DashboardSidebar />

        <div className="min-h-screen transition-all duration-300">
          <DashboardHeader />

          <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Page Banner */}
            <div className="mb-6 relative overflow-hidden rounded-3xl bg-[#002147] py-8 px-6 shadow-lg">
              {/* Background Decorative Elements */}
              <div className="absolute inset-0 opacity-10 pointer-events-none select-none overflow-hidden">
                <span className="absolute top-4 left-4 text-[10px] tracking-widest text-[#002147] font-bold border border-[#002147] rounded-full px-2 py-0.5">STARTUP</span>
                <span className="absolute top-12 left-20 text-[9px] text-white/50">GROWTH</span>
                <span className="absolute bottom-4 left-10 text-[9px] text-white/50">PROMOTION</span>
                <span className="absolute top-1/2 left-1/4 text-[9px] text-white/30 hidden sm:block">IDEA</span>
                <span className="absolute top-6 right-1/4 text-[10px] text-white/40">TECHNOLOGY</span>
                <span className="absolute bottom-8 right-20 text-[9px] text-white/50">MOTIVATION</span>
                <span className="absolute top-6 right-10 text-[10px] font-bold text-[#daa520] tracking-widest">MISSION</span>
                <span className="absolute top-16 right-4 text-[9px] text-white/50">GLOBAL</span>
                <span className="absolute bottom-6 right-8 text-[9px] text-white/50 border border-white/20 px-1">SUCCESS</span>
                <div className="absolute top-[-50%] left-[30%] w-56 h-56 bg-[#002147]/20 blur-[60px] rounded-full mix-blend-overlay"></div>
              </div>

              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2">
                  <span className="text-[#FFA500]">SMAART</span> <span className="text-white">Community</span>
                </h1>
                <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-[#FFA500] to-transparent mb-3 opacity-50"></div>
                <p className="text-blue-100/80 text-xs sm:text-sm max-w-lg font-light tracking-wide">
                  Connect, learn, and grow together in our global startup ecosystem
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative max-w-2xl mx-auto">
                <div className="absolute inset-0 bg-[#002147]/5 blur-xl rounded-full transform -rotate-1"></div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search discussions, categories, or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-12 pr-12 py-4 bg-white dark:bg-[#1E293B] border-0 ring-1 ring-gray-100 dark:ring-gray-700 rounded-full text-[#002147] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#002147]/20 dark:focus:ring-blue-500/40 shadow-lg shadow-gray-200/50 dark:shadow-none transition-all hover:shadow-xl hover:shadow-gray-200/50"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-12">
              {[
                { label: "Members", value: stats.totalMembers?.toLocaleString() || "0", icon: Users, color: "text-[#002147]", bg: "bg-[#002147]/10" },
                { label: "Discussions", value: stats.totalDiscussions?.toLocaleString() || "0", icon: MessageCircle, color: "text-[#daa520]", bg: "bg-[#daa520]/10" },
                { label: "Groups", value: stats.totalGroups?.toLocaleString() || "0", icon: Star, color: "text-purple-500", bg: "bg-purple-500/10" },
                { label: "Active Today", value: stats.activeToday?.toLocaleString() || "0", icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2, boxShadow: "0 10px 20px -5px rgba(0,0,0,0.05)" }}
                  className="bg-white/60 dark:bg-[#1E293B]/60 backdrop-blur-xl rounded-xl p-3 shadow-sm border border-white/40 dark:border-white/10 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[#002147] dark:text-white leading-none mb-0.5 tracking-tight">{stat.value}</p>
                      <p className="text-[11px] text-gray-500 font-medium leading-none">{stat.label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Discussions */}
              <div className="lg:col-span-2 space-y-6">
                {/* Start Discussion Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNewPostModal(true)}
                  className="w-full py-4 bg-gradient-to-r from-[#002147] to-[#002147]/90 text-white font-semibold rounded-2xl shadow-lg shadow-[#002147]/20 transition-all flex items-center justify-center gap-2 mb-2"
                >
                  <Plus className="w-5 h-5" />
                  Start a Discussion
                </motion.button>

                {/* Tabs & Sort */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                  <div className="flex gap-2 p-1 bg-white/50 backdrop-blur-sm rounded-xl w-fit">
                    {["discussions", "my posts", "bookmarks"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 rounded-lg text-sm font-medium capitalize transition-all duration-300 ${activeTab === tab
                          ? "bg-white dark:bg-[#1E293B] text-[#002147] dark:text-white shadow-sm ring-1 ring-gray-100 dark:ring-gray-700"
                          : "text-gray-500 dark:text-gray-400 hover:text-[#002147] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10"
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm p-1 rounded-xl border border-white/40">
                    <button
                      onClick={() => setSortBy('createdAt')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'createdAt' ? 'bg-[#002147] text-white shadow-md' : 'text-gray-500 hover:bg-white/50'}`}
                    >
                      NEWEST
                    </button>
                    <button
                      onClick={() => setSortBy('popularity')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${sortBy === 'popularity' ? 'bg-[#002147] text-white shadow-md' : 'text-gray-500 hover:bg-white/50'}`}
                    >
                      POPULAR
                    </button>
                  </div>
                </div>

                {/* Loading State */}
                {loading && page === 1 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#002147] animate-spin" />
                  </div>
                ) : discussions.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 mb-1 font-bold">
                      {debouncedSearch ? `No results for "${debouncedSearch}"` : "No discussions yet"}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {debouncedSearch ? "Try adjusting your search or category filters" : "Be the first to start a conversation!"}
                    </p>
                    {debouncedSearch && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="mt-4 px-6 py-2 text-[#002147] text-sm font-bold bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
                      >
                        Clear Search
                      </button>
                    )}
                    {/* Seed Data Button for Development Only */}
                    {import.meta.env.DEV && !debouncedSearch && (
                      <button
                        onClick={async () => {
                          try {
                            setLoading(true);
                            const result = await communityAPI.seedData();
                            if (result.success) {
                              alert('Data seeded successfully! Refreshing...');
                              window.location.reload();
                            } else {
                              alert('Failed to seed data: ' + (result.error || 'Unknown error'));
                            }
                          } catch (err) {
                            console.error(err);
                            alert('Error seeding data. Make sure backend is running.');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="mt-4 block mx-auto px-6 py-2 text-white text-sm font-bold bg-green-600 hover:bg-green-700 rounded-xl transition-all"
                      >
                        Seed Sample Data
                      </button>
                    )}
                  </div>
                ) : (
                  /* Discussions List */
                  <div className="space-y-4">
                    {discussions.map((discussion, index) => {
                      const isExpanded = expandedDiscussionId === discussion._id;
                      const isLikedByMe = discussion.likes?.includes(currentUser?._id || currentUser?.id || currentUserId);
                      const isBookmarkedByMe = discussion.isBookmarkedBy?.includes(currentUser?._id || currentUser?.id || currentUserId);
                      const isAuthor = currentUserId && getAuthorId(discussion.author) === currentUserId;

                      return (
                        <motion.div
                          key={discussion._id}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/40 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {discussion.category && (
                                  <span className="px-2.5 py-1 bg-[#002147]/10 text-[#002147] text-[10px] font-bold rounded-full uppercase tracking-wider">
                                    {discussion.category}
                                  </span>
                                )}
                                {discussion.isPinned && (
                                  <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                    PINNED
                                  </span>
                                )}
                                {discussion.author?.role === 'admin' && <AdminBadge />}
                              </div>
                              <h3 className="text-[#002147] text-lg font-bold mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {discussion.title}
                              </h3>
                              <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[#002147] font-bold uppercase overflow-hidden border border-white">
                                  {discussion.author?.profileImage ? (
                                    <img src={discussion.author.profileImage} alt="" className="w-full h-full object-cover" />
                                  ) : getAuthorName(discussion.author).charAt(0)}
                                </div>
                                <span>{getAuthorName(discussion.author)}</span>
                                <span>•</span>
                                <span>{formatTimeAgo(discussion.createdAt)}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => setExpandedDiscussionId(isExpanded ? null : discussion._id)}
                                className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-[#002147] text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 group-hover:text-[#002147]'}`}
                              >
                                <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>
                            </div>
                          </div>

                          {/* Summary content when collapsed */}
                          {!isExpanded && (
                            <p className="mt-3 text-gray-600 text-sm line-clamp-2 leading-relaxed">
                              {discussion.content}
                            </p>
                          )}

                          {/* Full content when expanded */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <p className="mt-4 text-[#002147] text-sm leading-relaxed whitespace-pre-line">
                                  {discussion.content}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Poll Display */}
                          {discussion.poll && discussion.poll.options && (
                            <div className="mt-6 p-6 bg-gradient-to-br from-blue-50/50 to-white rounded-3xl border border-blue-100/50 shadow-sm">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                                  <TrendingUp className="w-4 h-4 text-white" />
                                </div>
                                <h4 className="text-sm font-black text-[#002147] uppercase tracking-wider">
                                  {discussion.poll.question || "Poll"}
                                </h4>
                              </div>

                              <div className="space-y-3">
                                {discussion.poll.options.map((option, idx) => {
                                  const totalVotes = discussion.poll.options.reduce((acc, opt) => acc + (opt.voters?.length || 0), 0);
                                  const optionVotes = option.voters?.length || 0;
                                  const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                                  const hasVoted = discussion.poll.options.some(opt => opt.voters?.some(vId => String(vId) === currentUserId));
                                  const myVote = option.voters?.some(vId => String(vId) === currentUserId);
                                  const isExpired = discussion.poll.expiresAt && new Date() > new Date(discussion.poll.expiresAt);

                                  return (
                                    <div key={idx} className="relative">
                                      <button
                                        disabled={isExpired || votingId === discussion._id}
                                        onClick={(e) => { e.stopPropagation(); handleVote(discussion._id, idx); }}
                                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all relative overflow-hidden group/opt ${myVote
                                          ? 'border-blue-500 bg-blue-50/30'
                                          : hasVoted || isExpired
                                            ? 'border-gray-100 bg-gray-50/50 cursor-default'
                                            : 'border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/20'
                                          }`}
                                      >
                                        {/* Progress Bar Background */}
                                        {(hasVoted || isExpired) && (
                                          <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            className={`absolute inset-0 opacity-10 ${myVote ? 'bg-blue-500' : 'bg-[#002147]'}`}
                                          />
                                        )}

                                        <div className="relative z-10 flex items-center justify-between gap-4">
                                          <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${myVote ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                              }`}>
                                              {myVote && <div className="w-2 h-2 bg-white rounded-full" />}
                                            </div>
                                            <span className={`text-sm font-bold ${myVote ? 'text-blue-700' : 'text-[#002147]'}`}>
                                              {option.text}
                                            </span>
                                          </div>
                                          {(hasVoted || isExpired) && (
                                            <span className="text-xs font-black text-[#002147] opacity-60">
                                              {percentage}%
                                            </span>
                                          )}
                                        </div>
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="mt-4 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                <span>{discussion.poll.options.reduce((acc, opt) => acc + (opt.voters?.length || 0), 0)} TOTAL VOTES</span>
                                {discussion.poll.expiresAt && (
                                  <span className={new Date() > new Date(discussion.poll.expiresAt) ? 'text-red-500' : ''}>
                                    {new Date() > new Date(discussion.poll.expiresAt) ? 'POLL CLOSED' : `ENDS ${new Date(discussion.poll.expiresAt).toLocaleDateString()}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Media Display */}
                          {discussion.media?.url && (
                            <div className="mt-4 rounded-2xl overflow-hidden border border-white/40 shadow-xl group/media relative">
                              {discussion.media.resourceType === 'video' || (discussion.media.url.match(/\.(mp4|mov|webm)$|video\/upload/i)) ? (
                                <div className="relative aspect-video bg-black flex items-center justify-center">
                                  <video
                                    src={discussion.media.url}
                                    controls
                                    className="w-full h-full object-contain"
                                    poster={discussion.media.url.replace(/\.[^.]+$/, '.jpg')}
                                  />
                                  <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/20">
                                    <Video className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="cursor-pointer overflow-hidden"
                                  onClick={(e) => { e.stopPropagation(); setViewerImage(discussion.media.url); }}
                                >
                                  <img
                                    src={discussion.media.url}
                                    alt="Post media"
                                    className="w-full object-cover max-h-[500px] hover:scale-[1.02] transition-transform duration-700"
                                    loading="lazy"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100/50">
                            <div className="relative">
                              <button
                                onMouseEnter={() => setActiveReactionPickerId(discussion._id)}
                                onClick={(e) => { e.stopPropagation(); handleLike(discussion._id); }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${isLikedByMe
                                  ? 'bg-red-50 text-red-500 shadow-sm border border-red-100'
                                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
                                  }`}
                              >
                                <Heart className={`w-4 h-4 ${isLikedByMe ? 'fill-current' : ''}`} />
                                <span className="font-bold text-xs">{discussion.likes?.length || 0}</span>
                              </button>

                              {/* Reaction Picker Redesigned */}
                              {activeReactionPickerId === discussion._id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  onMouseLeave={() => setActiveReactionPickerId(null)}
                                  className="absolute bottom-full left-0 mb-3 px-2 py-1.5 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 flex items-center gap-1 z-50"
                                >
                                  {REACTION_TYPES.map((react) => (
                                    <motion.button
                                      key={react.type}
                                      whileHover={{ scale: 1.4, y: -5 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReact(discussion._id, react.type);
                                      }}
                                      className="w-9 h-9 flex items-center justify-center transition-transform text-xl hover:bg-gray-100 rounded-xl"
                                      title={react.label}
                                    >
                                      {react.emoji}
                                    </motion.button>
                                  ))}
                                </motion.div>
                              )}
                            </div>

                            {/* Display reaction counts if any */}
                            {(discussion.reactions?.length > 0) && (
                              <div className="flex items-center -space-x-1">
                                {REACTION_TYPES.map(rt => {
                                  const reactionsOfType = (discussion.reactions || []).filter(r => r.type === rt.type);
                                  if (reactionsOfType.length === 0) return null;
                                  return (
                                    <div key={rt.type} className="w-6 h-6 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-xs z-10" title={`${rt.label}: ${reactionsOfType.length}`}>
                                      {rt.emoji}
                                    </div>
                                  );
                                })}
                                {discussion.reactions.length > 0 && (
                                  <span className="ml-2 text-[10px] font-bold text-gray-400">
                                    {discussion.reactions.length}
                                  </span>
                                )}
                              </div>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingId(discussion._id);
                                setExpandedDiscussionId(discussion._id);
                              }}
                              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-[#002147] rounded-xl transition-all border border-transparent"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span className="font-bold text-xs">{discussion.replies?.length || 0}</span>
                            </button>

                            <div className="flex-1" />

                            <button
                              onClick={(e) => { e.stopPropagation(); handleBookmark(discussion._id); }}
                              className={`p-1.5 rounded-lg transition-all ${isBookmarkedByMe
                                ? 'bg-yellow-50 text-yellow-600'
                                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                                }`}
                            >
                              <Bookmark className={`w-4 h-4 ${isBookmarkedByMe ? 'fill-current' : ''}`} />
                            </button>


                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSharingDiscussionId(discussion._id);
                                setShowShareModal(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                              title="Share to Group"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); setReportingId(discussion._id); }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Report Discussion"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Replies Section */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 space-y-4 border-t border-gray-100 pt-6"
                              >
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                  <MessageCircle className="w-3 h-3" />
                                  Comments ({discussion.replies?.length || 0})
                                </h4>

                                {discussion.replies?.map((reply) => {
                                  const isOwner = currentUserId && getAuthorId(reply.author) === currentUserId;
                                  const isBest = discussion.bestAnswer === reply._id;
                                  const isEditable = isOwner && (Date.now() - new Date(reply.createdAt).getTime() < 15 * 60 * 1000);

                                  return (
                                    <div
                                      key={reply._id || reply.createdAt}
                                      className={`group/reply relative rounded-2xl p-4 transition-all ${isBest
                                        ? 'bg-green-50/50 border-2 border-green-200'
                                        : 'bg-gray-50/50 border border-gray-100'
                                        }`}
                                    >
                                      {isBest && (
                                        <div className="absolute -top-3 left-4">
                                          <BestAnswerBadge />
                                        </div>
                                      )}

                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-[#002147] border border-white">
                                            {getAuthorName(reply.author).charAt(0)}
                                          </div>
                                          <div className="flex flex-col">
                                            <span className="text-xs font-bold text-[#002147]">{getAuthorName(reply.author)}</span>
                                            <span className="text-[10px] text-gray-400">{formatTimeAgo(reply.createdAt)}</span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          {isAuthor && (
                                            <button
                                              onClick={() => handleMarkBestAnswer(discussion._id, reply._id)}
                                              className={`p-1.5 rounded-lg transition-all ${isBest
                                                ? 'text-green-600 bg-green-100'
                                                : 'text-gray-300 hover:text-green-600 hover:bg-green-50'
                                                }`}
                                              title={isBest ? "Unmark as Best Answer" : "Mark as Best Answer"}
                                            >
                                              <CheckCircle className="w-4 h-4" />
                                            </button>
                                          )}

                                          {isOwner && (
                                            <div className="relative">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setReplyMenuOpenId(replyMenuOpenId === reply._id ? null : reply._id);
                                                }}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-[#002147] hover:bg-white transition-all"
                                              >
                                                <MoreVertical className="w-4 h-4" />
                                              </button>
                                              {replyMenuOpenId === reply._id && (
                                                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-xl shadow-xl z-10 overflow-hidden">
                                                  {isEditable && (
                                                    <button
                                                      className="w-full text-left px-4 py-2 text-xs text-[#002147] hover:bg-gray-50 transition-colors"
                                                      onClick={() => {
                                                        setEditingReplyId(reply._id);
                                                        setEditText(reply.content);
                                                        setReplyMenuOpenId(null);
                                                      }}
                                                    >
                                                      Edit
                                                    </button>
                                                  )}
                                                  <button
                                                    className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                                                    onClick={() => {
                                                      handleReplyDelete(discussion._id, reply._id);
                                                      setReplyMenuOpenId(null);
                                                    }}
                                                  >
                                                    Delete
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {editingReplyId === reply._id ? (
                                        <div className="space-y-3">
                                          <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                                          />
                                          <div className="flex gap-2 justify-end">
                                            <button
                                              onClick={() => { setEditingReplyId(null); setEditText(""); }}
                                              className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700"
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              onClick={() => handleReplyEdit(discussion._id, reply)}
                                              disabled={editSubmitting || !editText.trim()}
                                              className="px-4 py-1.5 bg-[#002147] text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                                            >
                                              {editSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-gray-700 text-sm leading-relaxed">{reply.content}</p>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Reply Input */}
                                <div className="mt-4 flex gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                                    {currentUser?.fullName?.charAt(0) || 'U'}
                                  </div>
                                  <div className="flex-1 relative">
                                    <textarea
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder="Add a constructive comment..."
                                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all resize-none min-h-[100px]"
                                    />
                                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                      <button
                                        onClick={() => handleReplySubmit(discussion)}
                                        disabled={replySubmitting || !replyText.trim()}
                                        className="p-2 bg-[#002147] text-white rounded-xl shadow-lg shadow-blue-900/20 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                                      >
                                        {replySubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Load More */}
                {hasMore && discussions.length >= 10 && (
                  <div className="flex justify-center mt-8">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="px-8 py-3 bg-white text-[#002147] font-bold text-sm rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          View More Discussions
                          <ChevronRight className="w-4 h-4 rotate-90" />
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-8">
                {/* Featured Groups */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 hover:bg-white/80 transition-all duration-300">
                  <h3 className="text-[#002147] font-bold mb-6 flex items-center gap-3 text-lg">
                    <div className="p-2 bg-yellow-100 rounded-xl">
                      <Star className="w-5 h-5 text-yellow-600" />
                    </div>
                    My Groups
                  </h3>
                  {featuredGroups.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No groups available</p>
                  ) : (
                    <div className="space-y-4">
                      {featuredGroups.map((group) => {
                        const IconComponent = iconMap[group.icon] || Users;
                        return (
                          <div
                            key={group._id}
                            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/60 hover:shadow-sm transition-all cursor-pointer group/item"
                          >
                            <div className={`w-12 h-12 ${group.color || 'bg-[#002147]'} rounded-2xl flex items-center justify-center shadow-sm group-hover/item:scale-105 transition-transform duration-300`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[#002147] text-sm font-bold truncate mb-0.5">{group.name}</p>
                              <p className="text-gray-500 text-xs flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {(group.memberCount || 0).toLocaleString()} members
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => navigate('/dashboard/groups')}
                      className="flex-1 py-3 text-sm font-semibold text-[#002147] bg-[#002147]/5 hover:bg-[#002147]/10 rounded-2xl transition-all"
                    >
                      View My Groups
                    </button>
                    <button
                      onClick={() => navigate('/dashboard/groups', { state: { create: true } })}
                      className="flex-1 py-3 text-sm font-semibold text-white bg-[#002147] hover:bg-[#002147]/90 rounded-2xl transition-all shadow-lg shadow-blue-900/20"
                    >
                      Create Group
                    </button>
                  </div>
                </div>

                {/* Top Contributors */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 hover:bg-white/80 transition-all duration-300">
                  <h3 className="text-[#002147] font-bold mb-6 flex items-center gap-3 text-lg">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <Trophy className="w-5 h-5 text-yellow-600" />
                    </div>
                    Top Contributors
                  </h3>
                  {topContributors.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No contributors yet</p>
                  ) : (
                    <div className="space-y-4">
                      {topContributors.map((user, index) => (
                        <motion.div
                          key={user._id || index}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/60 hover:shadow-sm transition-all group/item border border-transparent hover:border-white/40"
                        >
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#002147] to-blue-900 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white overflow-hidden">
                              {user.author?.profileImage ? (
                                <img src={user.author.profileImage} alt="" className="w-full h-full object-cover" />
                              ) : (user.author?.fullName || user.author?.name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div className={`absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border border-white ${index === 0 ? "bg-yellow-400 text-yellow-900" :
                              index === 1 ? "bg-slate-300 text-slate-700" :
                                index === 2 ? "bg-orange-400 text-orange-900" :
                                  "bg-blue-100 text-blue-700"
                              }`}>
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[#002147] text-sm font-bold truncate">{user.author?.fullName || user.author?.name || 'Anonymous'}</p>
                            <p className="text-gray-500 text-[10px] font-medium uppercase tracking-wider">{user.postCount} posts • {user.replyCount} replies</p>
                          </div>
                          <div className="text-right">
                            <div className="text-[#002147] text-xs font-black">{(user.points || ((user.postCount * 10) + (user.replyCount * 5))).toLocaleString()}</div>
                            <div className="text-[8px] text-gray-400 font-bold uppercase">Points</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Tips */}
                <div className="bg-gradient-to-br from-[#002147]/10 to-blue/10 rounded-3xl p-8 relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#002147]/20 blur-[50px] rounded-full transform translate-x-1/3 -translate-y-1/3"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full transform -translate-x-1/3 translate-y-1/3"></div>
                  <h3 className="text-[#002147] font-bold mb-4 relative z-10 flex items-center gap-3 text-lg">
                    <span className="text-2xl">💡</span> Community Tip
                  </h3>
                  <p className="text-gray-700 text-sm leading-7 relative z-10 font-medium">
                    Engage with discussions and help others to earn points and badges. Top contributors get featured on the leaderboard!
                  </p>
                </div>
              </div>
            </div>

          </main >

          {/* New Post Modal */}
          {showNewPostModal && (
            <div className="fixed inset-0 bg-[#002147]/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/50"
              >
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
                  <h2 className="text-2xl font-black text-[#002147] flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                      <Plus className="w-6 h-6 text-blue-600" />
                    </div>
                    New Discussion
                  </h2>
                  <button
                    onClick={() => setShowNewPostModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Post Title</label>
                        <input
                          type="text"
                          value={newPost.title}
                          onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="What's on your mind?"
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[#002147] font-bold placeholder:text-gray-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Category</label>
                        <div className="relative">
                          <select
                            value={newPost.category}
                            onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[#002147] font-bold appearance-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all"
                          >
                            <option value="general">🌍 General Discussion</option>
                            <option value="career">💼 Career Growth</option>
                            <option value="study">📚 Study Resources</option>
                            <option value="exams">🎯 Exam Prep</option>
                            <option value="skills">🛠️ Skill Building</option>
                            <option value="motivation">🔥 Motivation</option>
                            <option value="other">✨ Other</option>
                          </select>
                          <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none rotate-90" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Rich Content</label>
                        <button
                          onClick={() => setShowPollEditor(!showPollEditor)}
                          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-all ${showPollEditor ? 'bg-[#002147] text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                          {showPollEditor ? 'Remove Poll' : 'Add Poll'}
                        </button>
                      </div>
                      <textarea
                        value={newPost.content}
                        onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Go ahead, share your story or ask a question..."
                        rows={showPollEditor ? 3 : 6}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-[#002147] font-medium leading-relaxed placeholder:text-gray-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all resize-none"
                      />
                    </div>

                    {showPollEditor && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                          </div>
                          <h4 className="text-sm font-black text-[#002147] uppercase tracking-wider">Create a Poll</h4>
                        </div>

                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Poll Question (e.g., Which framework do you prefer?)"
                            value={pollData.question || ""}
                            onChange={(e) => setPollData(prev => ({ ...prev, question: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-sm font-bold text-[#002147] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                          />

                          <div className="space-y-2">
                            {pollData.options.map((option, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder={`Option ${idx + 1}`}
                                  value={option}
                                  onChange={(e) => {
                                    const newOptions = [...pollData.options];
                                    newOptions[idx] = e.target.value;
                                    setPollData(prev => ({ ...prev, options: newOptions }));
                                  }}
                                  className="flex-1 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold text-[#002147] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                />
                                {pollData.options.length > 2 && (
                                  <button
                                    onClick={() => setPollData(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== idx) }))}
                                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}

                            {pollData.options.length < 5 && (
                              <button
                                onClick={() => setPollData(prev => ({ ...prev, options: [...prev.options, ""] }))}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-2 py-1 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                Add another option
                              </button>
                            )}
                          </div>

                          <div className="pt-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Ending Date (Optional)</label>
                            <input
                              type="datetime-local"
                              value={pollData.expiresAt || ""}
                              onChange={(e) => setPollData(prev => ({ ...prev, expiresAt: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold text-[#002147] focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Media Attachment</label>
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`relative group/upload flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] transition-all cursor-pointer ${mediaPreview ? 'border-blue-500 bg-blue-50/10' : 'hover:border-blue-400 hover:bg-gray-100'}`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {mediaPreview ? (
                          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg">
                            {mediaType === 'video' ? (
                              <video src={mediaPreview} className="w-full h-full object-cover" controls />
                            ) : (
                              <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                            )}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedMedia(null);
                                setMediaPreview(null);
                                setMediaType(null);
                              }}
                              className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-xl shadow-xl hover:scale-110 transition-transform"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white text-[10px] font-bold uppercase tracking-widest">
                              {mediaType} PREVIEW
                            </div>
                          </div>
                        ) : (
                          <div className="text-center group-hover:scale-105 transition-transform duration-500">
                            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100 group-hover:shadow-md transition-shadow">
                              <ImageIcon className="w-8 h-8 text-blue-500" />
                            </div>
                            <p className="text-[#002147] font-black text-sm mb-1 uppercase tracking-wider">Drag & Drop Media</p>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Support Images & Videos up to 5MB</p>
                          </div>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*,video/*"
                          onChange={handleMediaChange}
                        />
                      </div>
                    </div>
                  </div>

                  {moderationWarning && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                        <X className="w-4 h-4 text-red-600" />
                      </div>
                      <p className="text-xs text-red-800 font-bold leading-relaxed">{moderationWarning}</p>
                    </motion.div>
                  )}
                </div>

                <div className="p-8 border-t border-gray-100 flex gap-4">
                  <button
                    onClick={() => setShowNewPostModal(false)}
                    className="flex-1 py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={submitting || !newPost.title.trim() || !newPost.content.trim()}
                    className="flex-[2] py-4 bg-[#002147] text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:shadow-blue-900/40 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Publish Discussion
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
          {/* Report Modal */}
          <AnimatePresence>
            {reportingId && (
              <div className="fixed inset-0 bg-[#002147]/40 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/40"
                >
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#002147] flex items-center gap-2">
                      <Bell className="w-5 h-5 text-red-500" />
                      Report Content
                    </h3>
                    <button onClick={() => setReportingId(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500">
                      Please provide a reason for reporting this discussion. Our moderators will review it shortly.
                    </p>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 outline-none hover:bg-white transition-all shadow-sm"
                    >
                      <option value="">Select a reason...</option>
                      <option value="Inappropriate language">Inappropriate language</option>
                      <option value="Hate speech or harassment">Hate speech or harassment</option>
                      <option value="Spam or misleading">Spam or misleading</option>
                      <option value="Inappropriate media">Inappropriate media</option>
                      <option value="Other">Other</option>
                    </select>
                    {reportReason === 'Other' && (
                      <textarea
                        placeholder="Describe the issue..."
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm h-24 resize-none focus:ring-2 focus:ring-red-500/20 outline-none hover:bg-white transition-all shadow-sm"
                        onChange={(e) => setReportReason(e.target.value)}
                      />
                    )}
                  </div>
                  <div className="p-6 bg-gray-50/50 flex gap-3">
                    <button
                      onClick={() => { setReportingId(null); setReportReason(""); }}
                      className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReportSubmit(reportingId)}
                      disabled={reportSubmitting || !reportReason.trim()}
                      className="flex-1 py-3 bg-red-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                      {reportSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit Report"}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Share to Groups Modal */}
          <AnimatePresence>
            {showShareModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-[#002147]">Share to Groups</h3>
                    <button
                      onClick={() => {
                        setShowShareModal(false);
                        setSharingDiscussionId(null);
                        setSelectedGroups([]);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <div className="p-6 max-h-[50vh] overflow-y-auto">
                    {featuredGroups.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium mb-1">No groups yet</p>
                        <p className="text-gray-400 text-sm">Join or create a group to share posts</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {featuredGroups.map((group) => (
                          <label
                            key={group._id}
                            className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl cursor-pointer transition-all group"
                          >
                            <input
                              type="checkbox"
                              checked={selectedGroups.includes(group._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGroups([...selectedGroups, group._id]);
                                } else {
                                  setSelectedGroups(selectedGroups.filter(id => id !== group._id));
                                }
                              }}
                              className="w-5 h-5 rounded-lg border-2 border-gray-300 text-[#002147] focus:ring-2 focus:ring-[#002147]/20"
                            />
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${group.type === 'student' ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-blue-500 to-blue-700'}`}>
                              {group.name?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#002147] text-sm truncate">{group.name}</p>
                              <p className="text-xs text-gray-500">{group.memberDetails?.length || 0} members</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                    <button
                      onClick={() => {
                        setShowShareModal(false);
                        setSharingDiscussionId(null);
                        setSelectedGroups([]);
                      }}
                      className="flex-1 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleShareToGroups}
                      disabled={sharingToGroups || selectedGroups.length === 0}
                      className="flex-1 py-3 bg-[#002147] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#002147]/20 hover:bg-[#003366] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {sharingToGroups ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sharing...
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          Share ({selectedGroups.length})
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Full Image Viewer Overlay */}
          <AnimatePresence>
            {viewerImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10"
                onClick={() => setViewerImage(null)}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-colors z-[210]"
                  onClick={() => setViewerImage(null)}
                >
                  <X className="w-6 h-6" />
                </motion.button>

                {/* Navigation Arrows */}
                {feedImages.length > 1 && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={feedImages.indexOf(viewerImage) === 0}
                      className="absolute left-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed z-[210]"
                      onClick={handlePrevImage}
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={feedImages.indexOf(viewerImage) === feedImages.length - 1}
                      className="absolute right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-colors disabled:opacity-20 disabled:cursor-not-allowed z-[210]"
                      onClick={handleNextImage}
                    >
                      <ChevronRight className="w-8 h-8" />
                    </motion.button>

                    {/* Counter */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-black tracking-widest uppercase">
                      {feedImages.indexOf(viewerImage) + 1} / {feedImages.length}
                    </div>
                  </>
                )}

                <motion.img
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  key={viewerImage}
                  src={viewerImage}
                  alt="Full size"
                  className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain select-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div >
      </div>
    </div>
  );
};

export default Community;
