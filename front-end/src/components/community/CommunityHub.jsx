import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Layers3,
  MessageSquareText,
  SearchX,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import useUser from "@/hooks/useUser";
import CommunityComposer from "@/components/community/CommunityComposer";
import CommunitySidebar from "@/components/community/CommunitySidebar";
import FilterPanel from "@/components/community/FilterPanel";
import PostCard from "@/components/community/PostCard";
import SearchBar from "@/components/community/SearchBar";
import { announcementsAPI } from "@/services/announcementsApi";
import { communityAPI } from "@/services/communityApi";
import {
  applyOptimisticBookmark,
  applyOptimisticReaction,
  getCurrentCollegeId,
  getCurrentUserId,
  replaceDiscussion,
  sortDiscussions,
} from "@/components/community/community-utils";

const INITIAL_COMPOSER = {
  title: "",
  content: "",
  category: "general",
};

/**
 * Debounces a fast-changing input value for server-backed search.
 *
 * @template T
 * @param {T} value - Raw state value that changes frequently.
 * @param {number} delay - Debounce delay in milliseconds.
 * @returns {T} Debounced value.
 */
function useDebouncedValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
}

/**
 * Renders discussion feed loading placeholders.
 *
 * @returns {import("react").JSX.Element} Feed skeleton cards.
 */
function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`feed-skeleton-${index}`} className="lms-card p-5">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-100" />
              <div className="space-y-2">
                <div className="h-3 w-36 rounded-full bg-slate-100" />
                <div className="h-3 w-28 rounded-full bg-slate-100" />
              </div>
            </div>
            <div className="h-5 w-3/5 rounded-full bg-slate-100" />
            <div className="space-y-2">
              <div className="h-4 rounded-full bg-slate-100" />
              <div className="h-4 rounded-full bg-slate-100" />
              <div className="h-4 w-4/5 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Rebuilds the Community page with real data, server-backed filtering, and polished UI.
 *
 * @returns {import("react").JSX.Element} Community page.
 */
const CommunityHub = () => {
  const { user, loading: userLoading } = useUser();
  const currentUserId = getCurrentUserId(user);
  const collegeId = getCurrentCollegeId(user);
  const canPinPosts = ["admin", "moderator"].includes(
    (user?.role || user?.userType || "").toLowerCase(),
  );

  const [stats, setStats] = useState({
    totalMembers: 0,
    totalDiscussions: 0,
    totalGroups: 0,
    activeToday: 0,
  });
  const [composer, setComposer] = useState(INITIAL_COMPOSER);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [userMatches, setUserMatches] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [peopleSearchInput, setPeopleSearchInput] = useState("");
  const [view, setView] = useState("all");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [dateRange, setDateRange] = useState("all");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [expandedPosts, setExpandedPosts] = useState({});
  const [openReplies, setOpenReplies] = useState({});
  const [viewedPostIds, setViewedPostIds] = useState({});
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isNoticesDialogOpen, setIsNoticesDialogOpen] = useState(false);
  const [isLoadingDiscussions, setIsLoadingDiscussions] = useState(true);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [isLoadingUserMatches, setIsLoadingUserMatches] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [pendingPostIds, setPendingPostIds] = useState({});
  const [now, setNow] = useState(Date.now());
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const debouncedPeopleSearch = useDebouncedValue(peopleSearchInput, 300);

  const visibleDiscussions = useMemo(
    () => sortDiscussions(discussions, sortBy),
    [discussions, sortBy],
  );

  /**
   * Loads community stats for the hero overview cards.
   *
   * @returns {Promise<void>} Resolves after stats finish loading.
   */
  async function loadStats() {
    try {
      const response = await communityAPI.getStats();
      if (response?.success) {
        setStats(response.data);
      }
    } catch (error) {
      toast.error(error.message || "Unable to load community stats.");
    }
  }

  /**
   * Loads official announcements for the community sidebar.
   *
   * @returns {Promise<void>} Resolves after announcements finish loading.
   */
  async function loadAnnouncements() {
    setIsLoadingAnnouncements(true);

    try {
      const response = await announcementsAPI.getAnnouncements();
      if (response?.success) {
        const sortedAnnouncements = [...(response.data || [])].sort((left, right) => {
          if (left.isPinned && !right.isPinned) {
            return -1;
          }

          if (!left.isPinned && right.isPinned) {
            return 1;
          }

          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        });

        setAnnouncements(sortedAnnouncements);
      }
    } catch (error) {
      toast.error(error.message || "Unable to load official notices.");
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }

  /**
   * Loads discussions using the active server-backed query state.
   *
   * @returns {Promise<void>} Resolves after discussions finish loading.
   */
  async function loadDiscussions() {
    if (userLoading) {
      return;
    }

    if ((view === "mine" || view === "bookmarks") && !currentUserId) {
      setDiscussions([]);
      return;
    }

    setIsLoadingDiscussions(true);

    try {
      const params = {
        limit: 100,
        category,
        dateRange,
        search: debouncedSearch || undefined,
        collegeId: collegeId || undefined,
      };

      const response =
        view === "mine"
          ? await communityAPI.getUserDiscussions(currentUserId, params)
          : view === "bookmarks"
            ? await communityAPI.getBookmarkedDiscussions(currentUserId, params)
            : await communityAPI.getDiscussions(params);

      if (response?.success) {
        setDiscussions(response.data || []);
      }
    } catch (error) {
      toast.error(error.message || "Unable to load community posts.");
    } finally {
      setIsLoadingDiscussions(false);
    }
  }

  /**
   * Loads people matches for the debounced global search term.
   *
   * @returns {Promise<void>} Resolves after the people search finishes.
   */
  async function loadUserMatches() {
    if (debouncedPeopleSearch.trim().length < 2) {
      setUserMatches([]);
      return;
    }

    setIsLoadingUserMatches(true);

    try {
      const response = await communityAPI.searchUsers(debouncedPeopleSearch.trim());
      if (response?.success) {
        setUserMatches(response.data || []);
      }
    } catch (error) {
      toast.error(error.message || "Unable to search community members.");
    } finally {
      setIsLoadingUserMatches(false);
    }
  }

  useEffect(() => {
    loadStats();
    loadAnnouncements();
  }, []);

  useEffect(() => {
    loadDiscussions();
  }, [userLoading, currentUserId, collegeId, view, category, dateRange, debouncedSearch]);

  useEffect(() => {
    loadUserMatches();
  }, [debouncedPeopleSearch]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  /**
   * Tracks composer title changes and updates the new-post draft state.
   *
   * @param {string} nextTitle - Next post title value.
   * @returns {void} Updates the composer state.
   */
  function handleComposerTitleChange(nextTitle) {
    setComposer((currentComposer) => ({
      ...currentComposer,
      title: nextTitle,
    }));
  }

  /**
   * Tracks composer body changes and updates the new-post draft state.
   *
   * @param {string} nextContent - Next post body value.
   * @returns {void} Updates the composer state.
   */
  function handleComposerContentChange(nextContent) {
    setComposer((currentComposer) => ({
      ...currentComposer,
      content: nextContent,
    }));
  }

  /**
   * Tracks composer category changes and updates the new-post draft state.
   *
   * @param {string} nextCategory - Next selected category.
   * @returns {void} Updates the composer state.
   */
  function handleComposerCategoryChange(nextCategory) {
    setComposer((currentComposer) => ({
      ...currentComposer,
      category: nextCategory,
    }));
  }

  /**
   * Tracks attachment changes for the discussion composer.
   *
   * @param {File|null} nextFile - Selected attachment file.
   * @returns {void} Updates the composer attachment state.
   */
  function handleAttachmentChange(nextFile) {
    setAttachmentFile(nextFile);
  }

  /**
   * Clears the current discussion attachment.
   *
   * @returns {void} Resets the composer attachment state.
   */
  function handleAttachmentClear() {
    setAttachmentFile(null);
  }

  /**
   * Publishes a new community discussion and prepends the fresh post to the feed.
   *
   * @returns {Promise<void>} Resolves after the post is created.
   */
  async function handleCreateDiscussion() {
    if (!currentUserId) {
      toast.error("You need an active session to publish a post.");
      return;
    }

    if (!composer.title.trim() || !composer.content.trim()) {
      toast.error("Please add both a title and a message before publishing.");
      return;
    }

    setIsCreatingPost(true);

    try {
      const payload = new FormData();
      payload.append("title", composer.title.trim());
      payload.append("content", composer.content.trim());
      payload.append("category", composer.category);
      payload.append("authorId", currentUserId);

      if (attachmentFile) {
        payload.append("attachment", attachmentFile);
      }

      const response = await communityAPI.createDiscussion(payload);

      if (response?.success) {
        setComposer(INITIAL_COMPOSER);
        setAttachmentFile(null);
        setDiscussions((currentPosts) => [response.data, ...currentPosts]);
        setStats((currentStats) => ({
          ...currentStats,
          totalDiscussions: currentStats.totalDiscussions + 1,
        }));
        toast.success("Your post has been published");
      }
    } catch (error) {
      toast.error(error.message || "Unable to publish your discussion.");
    } finally {
      setIsCreatingPost(false);
    }
  }

  /**
   * Tracks the live search input and updates the debounced search state source.
   *
   * @param {string} nextSearch - Latest user-entered search query.
   * @returns {void} Updates search state.
   */
  function handleSearchChange(nextSearch) {
    setSearchInput(nextSearch);
  }

  /**
   * Tracks the People matches query state for the sidebar search panel.
   *
   * @param {string} nextSearch - Latest people-search text.
   * @returns {void} Updates the sidebar search state.
   */
  function handlePeopleSearchChange(nextSearch) {
    setPeopleSearchInput(nextSearch);
  }

  /**
   * Clears the active community search and restores the unfiltered feed query.
   *
   * @returns {void} Resets the search state.
   */
  function handleClearSearch() {
    setSearchInput("");
  }

  /**
   * Filter handler: accepts a new view key and reloads the feed endpoint so the rendered list narrows to that source.
   *
   * @param {string} nextView - Next feed source value.
   * @returns {void} Updates the view filter state.
   */
  function handleViewChange(nextView) {
    setView(nextView);
  }

  /**
   * Filter handler: accepts a category value and refreshes the discussion query so the rendered list narrows to that topic.
   *
   * @param {string} nextCategory - Next category filter value.
   * @returns {void} Updates the category filter state.
   */
  function handleCategoryChange(nextCategory) {
    setCategory(nextCategory);
  }

  /**
   * Filter handler: accepts a client-side sort key and reorders the rendered post list without dropping active filters.
   *
   * @param {string} nextSort - Next sort value.
   * @returns {void} Updates the sort state.
   */
  function handleSortChange(nextSort) {
    setSortBy(nextSort);
  }

  /**
   * Filter handler: accepts a date range key and refreshes the server query so the rendered list narrows to that time window.
   *
   * @param {string} nextDateRange - Next date range value.
   * @returns {void} Updates the date-range filter state.
   */
  function handleDateRangeChange(nextDateRange) {
    setDateRange(nextDateRange);
  }

  /**
   * Filter handler: clears every active filter and search state so the rendered list returns to the full community feed.
   *
   * @returns {void} Resets search and filter state.
   */
  function handleClearFilters() {
    setView("all");
    setCategory("all");
    setSortBy("newest");
    setDateRange("all");
    setSearchInput("");
  }

  /**
   * Marks a single post as pending or idle for optimistic UI flows.
   *
   * @param {string} postId - Target discussion id.
   * @param {boolean} isPending - Pending status to apply.
   * @returns {void} Updates pending state.
   */
  function setPostPending(postId, isPending) {
    setPendingPostIds((currentState) => ({
      ...currentState,
      [postId]: isPending,
    }));
  }

  /**
   * Optimistically toggles a reaction and reverts on API failure.
   *
   * @param {string} postId - Target discussion id.
   * @param {string} type - Requested reaction type.
   * @returns {Promise<void>} Resolves after the reaction request finishes.
   */
  async function handleReactionToggle(postId, type) {
    if (!currentUserId) {
      toast.error("You need an active session to react to a post.");
      return;
    }

    const previousPosts = discussions;
    setDiscussions((currentPosts) =>
      currentPosts.map((post) =>
        (post._id?.toString?.() || post.id?.toString?.()) === postId
          ? applyOptimisticReaction(post, currentUserId, type)
          : post,
      ),
    );
    setPostPending(postId, true);

    try {
      await communityAPI.reactToDiscussion(postId, currentUserId, type);
    } catch (error) {
      setDiscussions(previousPosts);
      toast.error(error.message || "Unable to update the reaction right now.");
    } finally {
      setPostPending(postId, false);
    }
  }

  /**
   * Optimistically toggles a bookmark and reverts on API failure.
   *
   * @param {string} postId - Target discussion id.
   * @returns {Promise<void>} Resolves after the bookmark request finishes.
   */
  async function handleBookmarkToggle(postId) {
    if (!currentUserId) {
      toast.error("You need an active session to save a post.");
      return;
    }

    const previousPosts = discussions;
    setDiscussions((currentPosts) =>
      currentPosts.map((post) =>
        (post._id?.toString?.() || post.id?.toString?.()) === postId
          ? applyOptimisticBookmark(post, currentUserId)
          : post,
      ),
    );
    setPostPending(postId, true);

    try {
      await communityAPI.toggleBookmark(postId, currentUserId);
    } catch (error) {
      setDiscussions(previousPosts);
      toast.error(error.message || "Unable to update the saved state right now.");
    } finally {
      setPostPending(postId, false);
    }
  }

  /**
   * Optimistically toggles a pinned state and reverts on API failure.
   *
   * @param {string} postId - Target discussion id.
   * @returns {Promise<void>} Resolves after the pin request finishes.
   */
  async function handlePinToggle(postId) {
    if (!canPinPosts) {
      toast.error("You do not have permission to pin posts.");
      return;
    }

    const previousPosts = discussions;
    setDiscussions((currentPosts) =>
      currentPosts.map((post) =>
        (post._id?.toString?.() || post.id?.toString?.()) === postId
          ? { ...post, isPinned: !post.isPinned }
          : post,
      ),
    );
    setPostPending(postId, true);

    try {
      await communityAPI.togglePin(postId);
    } catch (error) {
      setDiscussions(previousPosts);
      toast.error(error.message || "Unable to update the pinned state right now.");
    } finally {
      setPostPending(postId, false);
    }
  }

  /**
   * Records a post view the first time a card becomes visible in the viewport.
   *
   * @param {string} postId - Target discussion id.
   * @returns {Promise<void>} Resolves after the view is recorded.
   */
  async function handlePostVisible(postId) {
    if (viewedPostIds[postId]) {
      return;
    }

    setViewedPostIds((currentState) => ({
      ...currentState,
      [postId]: true,
    }));

    setDiscussions((currentPosts) =>
      currentPosts.map((post) =>
        (post._id?.toString?.() || post.id?.toString?.()) === postId
          ? { ...post, views: (post.views || 0) + 1 }
          : post,
      ),
    );

    try {
      await communityAPI.recordDiscussionView(postId);
    } catch (_error) {
      setViewedPostIds((currentState) => ({
        ...currentState,
        [postId]: false,
      }));
      setDiscussions((currentPosts) =>
        currentPosts.map((post) =>
          (post._id?.toString?.() || post.id?.toString?.()) === postId
            ? { ...post, views: Math.max(0, (post.views || 1) - 1) }
            : post,
        ),
      );
    }
  }

  /**
   * Updates a single reply draft for the matching discussion id.
   *
   * @param {string} postId - Target discussion id.
   * @param {string} nextValue - Latest reply draft content.
   * @returns {void} Updates reply draft state.
   */
  function handleReplyDraftChange(postId, nextValue) {
    setReplyDrafts((currentDrafts) => ({
      ...currentDrafts,
      [postId]: nextValue,
    }));
  }

  /**
   * Toggles a single post body between collapsed and expanded modes.
   *
   * @param {string} postId - Target discussion id.
   * @returns {void} Updates expansion state.
   */
  function handleToggleExpandedPost(postId) {
    setExpandedPosts((currentState) => ({
      ...currentState,
      [postId]: !currentState[postId],
    }));
  }

  /**
   * Toggles the reply panel for a specific post card.
   *
   * @param {string} postId - Target discussion id.
   * @returns {void} Updates thread panel state.
   */
  function handleRepliesToggle(postId) {
    setOpenReplies((currentState) => ({
      ...currentState,
      [postId]: !currentState[postId],
    }));
  }

  /**
   * Submits a new reply and replaces the updated discussion in the feed.
   *
   * @param {string} postId - Target discussion id.
   * @returns {Promise<void>} Resolves after the reply request finishes.
   */
  async function handleReplySubmit(postId) {
    if (!currentUserId) {
      toast.error("You need an active session to reply.");
      return;
    }

    const draft = replyDrafts[postId]?.trim();
    if (!draft) {
      toast.error("Write a reply before sending it.");
      return;
    }

    setPostPending(postId, true);

    try {
      const response = await communityAPI.addReply(postId, draft, currentUserId);
      if (response?.success) {
        setDiscussions((currentPosts) => replaceDiscussion(currentPosts, response.data));
        setReplyDrafts((currentDrafts) => ({
          ...currentDrafts,
          [postId]: "",
        }));
        setOpenReplies((currentState) => ({
          ...currentState,
          [postId]: true,
        }));
        toast.success("Reply posted successfully.");
      }
    } catch (error) {
      toast.error(error.message || "Unable to send your reply.");
    } finally {
      setPostPending(postId, false);
    }
  }

  return (
    <TooltipProvider>
      <div className="community-shell min-h-screen rounded-[28px] p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <div className="flex justify-end md:hidden">
            <button
              type="button"
              onClick={() => setIsNoticesDialogOpen(true)}
              className="tap-target inline-flex min-h-[44px] items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-[hsl(var(--lms-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <Bell className="h-4 w-4" />
              Notices
            </button>
          </div>

          <section className="community-hero overflow-hidden rounded-[28px] p-5 text-white sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_336px] lg:items-start">
              <div className="space-y-3.5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[12px] font-medium tracking-[0.04em] text-white/85 backdrop-blur-sm">
                  <MessageSquareText className="h-3.5 w-3.5" />
                  Community hub
                </div>
                <div className="max-w-3xl space-y-2.5">
                    <h1 className="max-w-2xl text-[28px] font-bold leading-[1.18] tracking-tight text-white sm:text-[30px]">
                      Professional community conversations with clearer structure and cleaner discovery.
                    </h1>
                  <p className="max-w-2xl text-[14px] leading-7 text-white/82 sm:text-[15px]">
                    Search posts, people, and discussions in one place with cleaner cards, stronger structure, and calmer visual hierarchy.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {[
                  {
                    label: "Members",
                    value: stats.totalMembers,
                    Icon: Users,
                  },
                  {
                    label: "Discussions",
                    value: stats.totalDiscussions,
                    Icon: MessageSquareText,
                  },
                  {
                    label: "Groups",
                    value: stats.totalGroups,
                    Icon: Layers3,
                  },
                  {
                    label: "Active today",
                    value: stats.activeToday,
                    Icon: Activity,
                  },
                ].map(({ label, value, Icon }) => (
                  <div
                    key={label}
                    className="community-stat-card rounded-[16px] p-3.5 backdrop-blur-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/70">
                        {label}
                      </span>
                      <Icon className="h-4.5 w-4.5 text-white/50" />
                    </div>
                    <div className="text-[28px] font-bold leading-none text-white sm:text-[30px]">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-12">
            <div className="space-y-6 md:col-span-8">
              <CommunityComposer
                title={composer.title}
                content={composer.content}
                category={composer.category}
                isSubmitting={isCreatingPost}
                attachmentFile={attachmentFile}
                onTitleChange={handleComposerTitleChange}
                onContentChange={handleComposerContentChange}
                onCategoryChange={handleComposerCategoryChange}
                onAttachmentChange={handleAttachmentChange}
                onAttachmentClear={handleAttachmentClear}
                onSubmit={handleCreateDiscussion}
              />

              <section className="community-surface rounded-[24px] p-5">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <SearchBar
                      value={searchInput}
                      onChange={handleSearchChange}
                      onClear={handleClearSearch}
                      loading={isLoadingDiscussions}
                    />

                    <button
                      type="button"
                      onClick={() => setIsFilterDialogOpen(true)}
                      className="tap-target mt-7 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--lms-border))] bg-white px-4 py-2 text-sm font-semibold text-[hsl(var(--lms-primary))] transition-all hover:border-primary/20 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 lg:hidden"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                    </button>
                  </div>

                  <div className="hidden lg:block">
                    <FilterPanel
                      view={view}
                      category={category}
                      sortBy={sortBy}
                      dateRange={dateRange}
                      onViewChange={handleViewChange}
                      onCategoryChange={handleCategoryChange}
                      onSortChange={handleSortChange}
                      onDateRangeChange={handleDateRangeChange}
                      onClearFilters={handleClearFilters}
                    />
                  </div>
                </div>
                {debouncedSearch.trim() ? (
                  <p className="mt-3 text-[13px] text-[hsl(var(--lms-text-muted))]">
                    Showing {visibleDiscussions.length} results for "{debouncedSearch}"
                  </p>
                ) : null}
              </section>

              <section className="space-y-4">
                {isLoadingDiscussions ? (
                  <FeedSkeleton />
                ) : visibleDiscussions.length === 0 ? (
                  <div className="community-surface rounded-[24px] p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 text-primary">
                      <SearchX className="h-7 w-7" />
                    </div>
                    <h2 className="text-lg font-semibold text-[hsl(var(--lms-primary))]">
                      {debouncedSearch
                        ? `No posts found for "${debouncedSearch}"`
                        : "No community posts match the current filters"}
                    </h2>
                    <p className="mt-2 text-sm text-[hsl(var(--lms-text-muted))]">
                      Clear the active search or filters to restore the full post list.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="tap-target mt-5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      Clear search and filters
                    </button>
                  </div>
                ) : (
                  visibleDiscussions.map((post) => {
                    const postId = post._id?.toString?.() || post.id?.toString?.() || "";

                    return (
                      <PostCard
                        key={postId}
                        post={post}
                        now={now}
                        currentUserId={currentUserId}
                        canPin={canPinPosts}
                        searchQuery={debouncedSearch}
                        replyDraft={replyDrafts[postId] || ""}
                        isExpanded={Boolean(expandedPosts[postId])}
                        areRepliesOpen={Boolean(openReplies[postId])}
                        isPending={Boolean(pendingPostIds[postId])}
                        onToggleExpand={handleToggleExpandedPost}
                        onReactionToggle={handleReactionToggle}
                        onBookmarkToggle={handleBookmarkToggle}
                        onPinToggle={handlePinToggle}
                        onPostVisible={handlePostVisible}
                        onRepliesToggle={handleRepliesToggle}
                        onReplyDraftChange={handleReplyDraftChange}
                        onReplySubmit={handleReplySubmit}
                      />
                    );
                  })
                )}
              </section>
            </div>

            <div className="hidden md:block md:col-span-4">
              <CommunitySidebar
                now={now}
                peopleQuery={peopleSearchInput}
                userMatches={userMatches}
                userMatchesLoading={isLoadingUserMatches}
                announcements={announcements}
                announcementsLoading={isLoadingAnnouncements}
                onPeopleQueryChange={handlePeopleSearchChange}
              />
            </div>
          </div>
        </div>

        <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
          <DialogContent className="max-w-[92vw] rounded-[28px] border-[hsl(var(--lms-border))] bg-white text-[hsl(var(--lms-primary))]">
            <DialogHeader>
              <DialogTitle>Community filters</DialogTitle>
            </DialogHeader>
            <FilterPanel
              view={view}
              category={category}
              sortBy={sortBy}
              dateRange={dateRange}
              onViewChange={handleViewChange}
              onCategoryChange={handleCategoryChange}
              onSortChange={handleSortChange}
              onDateRangeChange={handleDateRangeChange}
              onClearFilters={() => {
                handleClearFilters();
                setIsFilterDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={isNoticesDialogOpen} onOpenChange={setIsNoticesDialogOpen}>
          <DialogContent className="max-w-[92vw] rounded-[16px] border-[#E5E7EB] bg-white text-[hsl(var(--lms-primary))]">
            <DialogHeader>
              <DialogTitle>Notices</DialogTitle>
            </DialogHeader>
            <CommunitySidebar
              now={now}
              peopleQuery={peopleSearchInput}
              userMatches={userMatches}
              userMatchesLoading={isLoadingUserMatches}
              announcements={announcements}
              announcementsLoading={isLoadingAnnouncements}
              onPeopleQueryChange={handlePeopleSearchChange}
            />
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default CommunityHub;
