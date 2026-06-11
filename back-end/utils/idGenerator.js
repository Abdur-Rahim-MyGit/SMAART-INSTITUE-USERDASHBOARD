const mongoose = require('mongoose');

/**
 * Atomically generate the next sequential code like `CCH00007`.
 *
 * Uses the Counter collection (findOneAndUpdate with $inc is atomic) so two
 * concurrent document creates can never read the same value — this replaces the
 * racy `countDocuments() + 1` pattern that produced duplicate-key (E11000) errors
 * under concurrency.
 *
 * On the very first increment it seeds the counter past the highest existing
 * numeric suffix already in the collection, so it never reuses an ID that
 * pre-existing records already hold.
 *
 * @param {string} counterKey  unique key for the Counter doc (e.g. 'coachId')
 * @param {string} prefix      ID prefix (e.g. 'CCH')
 * @param {string} modelName   mongoose model name to scan for the existing max (e.g. 'Coach')
 * @param {string} field       document field holding the code (e.g. 'coachId')
 * @param {number} pad         zero-pad width (default 5)
 * @returns {Promise<string>}  the next code, e.g. 'CCH00007'
 */
async function nextSequentialCode(counterKey, prefix, modelName, field, pad = 5) {
  const Counter = mongoose.model('Counter');

  let counter = await Counter.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  // First-ever use of this counter: make sure we start above any IDs that
  // already exist in the collection (e.g. records created before this counter
  // was introduced), otherwise we could regenerate an existing code.
  if (counter.seq === 1) {
    const Model = mongoose.model(modelName);
    const existing = await Model.find({ [field]: { $regex: `^${prefix}\\d+$` } })
      .select(field)
      .lean();

    let maxSeq = 0;
    for (const doc of existing) {
      const n = parseInt(String(doc[field]).slice(prefix.length), 10);
      if (!isNaN(n) && n > maxSeq) maxSeq = n;
    }

    if (maxSeq >= 1) {
      counter = await Counter.findByIdAndUpdate(
        counterKey,
        { $set: { seq: maxSeq + 1 } },
        { new: true }
      );
    }
  }

  return `${prefix}${String(counter.seq).padStart(pad, '0')}`;
}

module.exports = { nextSequentialCode };
