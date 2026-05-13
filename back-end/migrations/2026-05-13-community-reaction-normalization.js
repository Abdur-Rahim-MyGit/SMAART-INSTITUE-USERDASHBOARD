const mongoose = require("mongoose");
const CommunityPost = require("../models/CommunityPost");

/**
 * Creates a stable Mongo connection for one-off migration execution.
 *
 * @returns {Promise<void>} Resolves after MongoDB connects.
 */
async function connect() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Missing MONGO_URI or MONGODB_URI environment variable.");
  }

  await mongoose.connect(mongoUri);
}

/**
 * Removes duplicate post reactions and backfills missing reaction timestamps.
 *
 * @param {Array<{ user?: mongoose.Types.ObjectId|string, type?: string, createdAt?: Date }>} reactions - Raw embedded reactions.
 * @returns {Array<{ user: mongoose.Types.ObjectId|string, type: string, createdAt: Date }>} Sanitized reaction list.
 */
function sanitizeReactions(reactions) {
  const seen = new Set();

  return (reactions || []).filter(Boolean).reduce((normalized, reaction) => {
    const userId = reaction?.user?.toString?.();
    const type = reaction?.type;

    if (!userId || !type) {
      return normalized;
    }

    const key = `${userId}:${type}`;
    if (seen.has(key)) {
      return normalized;
    }

    seen.add(key);
    normalized.push({
      ...reaction,
      createdAt: reaction.createdAt || new Date(),
    });

    return normalized;
  }, []);
}

/**
 * Runs the embedded-reaction normalization migration.
 *
 * @returns {Promise<void>} Resolves after all posts are updated.
 */
async function run() {
  await connect();

  const posts = await CommunityPost.find({}).select("reactions").lean(false);
  let updatedCount = 0;

  for (const post of posts) {
    const normalizedReactions = sanitizeReactions(post.reactions);
    const needsUpdate =
      normalizedReactions.length !== (post.reactions || []).length ||
      (post.reactions || []).some((reaction) => !reaction?.createdAt);

    if (!needsUpdate) {
      continue;
    }

    post.reactions = normalizedReactions;
    await post.save();
    updatedCount += 1;
  }

  process.stdout.write(`Normalized reactions on ${updatedCount} community posts.\n`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  process.stderr.write(`${error.message}\n`);
  await mongoose.disconnect();
  process.exitCode = 1;
});
