import { Fragment, createElement } from "react";

export const COMMUNITY_CATEGORIES = [
  { value: "all", label: "All topics", emoji: "\u2728" },
  { value: "general", label: "General", emoji: "\ud83d\udcac" },
  { value: "career", label: "Career", emoji: "\ud83d\ude80" },
  { value: "study", label: "Study", emoji: "\ud83d\udcda" },
  { value: "skills", label: "Skills", emoji: "\ud83d\udee0\ufe0f" },
  { value: "motivation", label: "Motivation", emoji: "\ud83d\udd25" },
  { value: "exams", label: "Exams", emoji: "\ud83d\udcdd" },
  { value: "other", label: "Other", emoji: "\ud83c\udf1f" },
];

export const COMMUNITY_VIEWS = [
  { value: "all", label: "All posts" },
  { value: "mine", label: "My posts" },
  { value: "bookmarks", label: "Saved" },
];

export const COMMUNITY_SORTS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Popular" },
];

export const COMMUNITY_DATE_RANGES = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

/**
 * Returns a stable string id from a raw entity value.
 *
 * @param {unknown} value - Raw entity id or populated entity object.
 * @returns {string|null} A normalized string id or null when missing.
 */
export function getEntityId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value._id) {
    return value._id.toString();
  }

  if (typeof value === "object" && value.id) {
    return value.id.toString();
  }

  return value.toString?.() || null;
}

/**
 * Reads the current user id from the user context payload.
 *
 * @param {Record<string, unknown>|null|undefined} user - Logged-in user object.
 * @returns {string|null} The current user id or null.
 */
export function getCurrentUserId(user) {
  return getEntityId(user?._id || user?.id || null);
}

/**
 * Reads the current user's college id for community scoping.
 *
 * @param {Record<string, unknown>|null|undefined} user - Logged-in user object.
 * @returns {string|null} The user's college id or null.
 */
export function getCurrentCollegeId(user) {
  return getEntityId(user?.college);
}

/**
 * Resolves a human-readable author name from hydrated or raw author data.
 *
 * @param {Record<string, unknown>|string|null|undefined} author - Post author.
 * @returns {string} A best-effort display name.
 */
export function getAuthorName(author) {
  if (!author) {
    return "Community member";
  }

  if (typeof author === "string") {
    return "Community member";
  }

  return author.fullName || author.name || author.email || "Community member";
}

/**
 * Builds a two-letter avatar fallback from an author's display name.
 *
 * @param {Record<string, unknown>|string|null|undefined} author - Post author.
 * @returns {string} Uppercase initials for the avatar fallback.
 */
export function getInitials(author) {
  const displayName = getAuthorName(author);
  const words = displayName.split(" ").filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

/**
 * Escapes a raw string for safe regex usage.
 *
 * @param {string} value - Raw user-entered text.
 * @returns {string} Regex-safe text.
 */
export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolves the display metadata for a community category.
 *
 * @param {string|null|undefined} value - Raw saved category value.
 * @returns {{value: string, label: string, emoji: string}} Category display metadata.
 */
export function getCategoryMeta(value) {
  const normalizedValue = (value || "").toString().trim().toLowerCase();

  return (
    COMMUNITY_CATEGORIES.find((category) => category.value === normalizedValue) || {
      value: normalizedValue || "other",
      label: normalizedValue
        ? normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1)
        : "Other",
      emoji: "\ud83c\udf1f",
    }
  );
}

/**
 * Highlights matching search terms without injecting HTML.
 *
 * @param {string} text - Original text to render.
 * @param {string} query - Current search query.
 * @param {string} keyPrefix - Stable key prefix for fragments.
 * @returns {Array<import("react").ReactNode>} Safe highlighted React nodes.
 */
export function highlightText(text, query, keyPrefix = "highlight") {
  if (!query?.trim()) {
    return [text];
  }

  const safeQuery = escapeRegExp(query.trim());
  const matcher = new RegExp(`(${safeQuery})`, "gi");
  const parts = String(text || "").split(matcher);

  return parts.map((part, index) => {
    if (part.toLowerCase() === query.trim().toLowerCase()) {
      return createElement(
        "mark",
        {
          key: `${keyPrefix}-${index}`,
          className: "rounded-sm bg-amber-200 px-1 text-slate-900",
        },
        part,
      );
    }

    return createElement(Fragment, { key: `${keyPrefix}-${index}` }, part);
  });
}

/**
 * Counts reactions by type for a single post record.
 *
 * @param {Record<string, unknown>} post - Discussion record.
 * @returns {{like: number, heart: number, insightful: number, support: number}} Reaction counts.
 */
export function getReactionCounts(post) {
  const reactions = Array.isArray(post?.reactions) ? post.reactions : [];

  return reactions.reduce(
    (counts, reaction) => {
      if (reaction?.type && counts[reaction.type] !== undefined) {
        counts[reaction.type] += 1;
      }

      return counts;
    },
    { like: 0, heart: 0, insightful: 0, support: 0, smile: 0 },
  );
}

/**
 * Returns the current user's saved reaction type for a post.
 *
 * @param {Record<string, unknown>} post - Discussion record.
 * @param {string|null} userId - Logged-in user id.
 * @returns {string|null} Matching reaction type or null.
 */
export function getCurrentReaction(post, userId) {
  if (!userId) {
    return null;
  }

  const reactions = Array.isArray(post?.reactions) ? post.reactions : [];
  return (
    reactions.find((reaction) => getEntityId(reaction?.user) === userId)?.type ||
    null
  );
}

/**
 * Returns whether the current user has liked a post.
 *
 * @param {Record<string, unknown>} post - Discussion record.
 * @param {string|null} userId - Logged-in user id.
 * @returns {boolean} True when the post is liked by the current user.
 */
export function isLikedByCurrentUser(post, userId) {
  if (!userId) {
    return false;
  }

  const likes = Array.isArray(post?.likes) ? post.likes : [];
  return likes.some((like) => getEntityId(like) === userId);
}

/**
 * Returns whether the current user has bookmarked a post.
 *
 * @param {Record<string, unknown>} post - Discussion record.
 * @param {string|null} userId - Logged-in user id.
 * @returns {boolean} True when the post is bookmarked by the current user.
 */
export function isBookmarkedByCurrentUser(post, userId) {
  if (!userId) {
    return false;
  }

  const bookmarks = Array.isArray(post?.isBookmarkedBy) ? post.isBookmarkedBy : [];
  return bookmarks.some((bookmark) => getEntityId(bookmark) === userId);
}

/**
 * Applies an optimistic like toggle to a single post object.
 *
 * @param {Record<string, unknown>} post - Discussion record.
 * @param {string} userId - Logged-in user id.
 * @returns {Record<string, unknown>} Updated post object.
 */
export function applyOptimisticLike(post, userId) {
  const likes = Array.isArray(post?.likes) ? [...post.likes] : [];
  const likeIndex = likes.findIndex((like) => getEntityId(like) === userId);

  if (likeIndex === -1) {
    likes.push(userId);
  } else {
    likes.splice(likeIndex, 1);
  }

  return {
    ...post,
    likes,
  };
}

/**
 * Applies an optimistic reaction toggle to a single post object.
 *
 * @param {Record<string, unknown>} post - Discussion record.
 * @param {string} userId - Logged-in user id.
 * @param {string} type - Requested reaction type.
 * @returns {Record<string, unknown>} Updated post object.
 */
export function applyOptimisticReaction(post, userId, type) {
  const reactions = Array.isArray(post?.reactions) ? [...post.reactions] : [];
  const reactionIndex = reactions.findIndex(
    (reaction) => getEntityId(reaction?.user) === userId,
  );

  if (reactionIndex === -1) {
    reactions.push({ user: userId, type, createdAt: new Date().toISOString() });
  } else if (reactions[reactionIndex]?.type === type) {
    reactions.splice(reactionIndex, 1);
  } else {
    reactions[reactionIndex] = {
      ...reactions[reactionIndex],
      type,
      createdAt: new Date().toISOString(),
    };
  }

  return {
    ...post,
    reactions,
  };
}

/**
 * Applies an optimistic bookmark toggle to a single post object.
 *
 * @param {Record<string, unknown>} post - Discussion record.
 * @param {string} userId - Logged-in user id.
 * @returns {Record<string, unknown>} Updated post object.
 */
export function applyOptimisticBookmark(post, userId) {
  const bookmarks = Array.isArray(post?.isBookmarkedBy)
    ? [...post.isBookmarkedBy]
    : [];
  const bookmarkIndex = bookmarks.findIndex(
    (bookmark) => getEntityId(bookmark) === userId,
  );

  if (bookmarkIndex === -1) {
    bookmarks.push(userId);
  } else {
    bookmarks.splice(bookmarkIndex, 1);
  }

  return {
    ...post,
    isBookmarkedBy: bookmarks,
  };
}

/**
 * Replaces a single discussion inside a post list.
 *
 * @param {Array<Record<string, unknown>>} posts - Existing discussion list.
 * @param {Record<string, unknown>} updatedPost - Fresh post payload.
 * @returns {Array<Record<string, unknown>>} Updated discussion list.
 */
export function replaceDiscussion(posts, updatedPost) {
  return posts.map((post) =>
    getEntityId(post?._id || post?.id) === getEntityId(updatedPost?._id || updatedPost?.id)
      ? updatedPost
      : post,
  );
}

/**
 * Sorts discussions using the currently active sort mode.
 *
 * @param {Array<Record<string, unknown>>} posts - Discussion list to sort.
 * @param {string} sortBy - Active sort key.
 * @returns {Array<Record<string, unknown>>} Sorted discussions.
 */
export function sortDiscussions(posts, sortBy) {
  const sortedPosts = [...posts];

  if (sortBy === "popular") {
    sortedPosts.sort((left, right) => {
      const leftScore =
        (left?.replies?.length || 0) +
        (left?.reactions?.length || 0) +
        (left?.views || 0);
      const rightScore =
        (right?.replies?.length || 0) +
        (right?.reactions?.length || 0) +
        (right?.views || 0);

      return rightScore - leftScore;
    });

    return sortedPosts;
  }

  sortedPosts.sort(
    (left, right) =>
      new Date(right?.createdAt || 0).getTime() -
      new Date(left?.createdAt || 0).getTime(),
  );

  return sortedPosts;
}

/**
 * Returns a stable unique tag list from the current discussion set.
 *
 * @param {Array<Record<string, unknown>>} posts - Discussion list.
 * @returns {string[]} Unique sorted tags.
 */
export function collectAvailableTags(posts) {
  const tags = new Set();

  posts.forEach((post) => {
    (post?.tags || []).forEach((tag) => {
      if (tag) {
        tags.add(tag);
      }
    });
  });

  return [...tags].sort((left, right) => left.localeCompare(right));
}
