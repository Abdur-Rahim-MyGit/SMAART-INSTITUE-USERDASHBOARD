/**
 * backfill-auth-logs.js
 * ─────────────────────
 * ONE-TIME MIGRATION SCRIPT
 *
 * Reads `lastLogin` from Student, Teacher, User, and Registration collections
 * and writes a single "Login" entry into the shared Log collection for each
 * user who has ever logged in.
 *
 * This script is SAFE to run multiple times — it checks for existing log entries
 * before inserting to avoid duplicates.
 *
 * Usage (from the back-end directory):
 *   node scripts/backfill-auth-logs.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not set in .env');
    process.exit(1);
}

// ─── Inline Log Schema (mirrors admin backend) ───────────────────────────────
const logSchema = new mongoose.Schema({
    action: { type: String, required: true },
    module: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userEmail: String,
    userRole: String,
    targetEmail: String,
    details: String,
    ipAddress: String,
    userAgent: String,
    deviceInfo: String,
    success: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now, index: true }
});
const Log = mongoose.model('Log', logSchema);

// ─── User Models (lightweight select) ────────────────────────────────────────
const studentSchema = new mongoose.Schema({
    fullName: String, email: String, role: String, lastLogin: Date, lastLoginIp: String, status: String
});
const teacherSchema = new mongoose.Schema({
    fullName: String, email: String, role: { type: String, default: 'teacher' }, lastLogin: Date
});
const userSchema = new mongoose.Schema({
    fullName: String, email: String, role: String, lastLogin: Date
});
const registrationSchema = new mongoose.Schema({
    fullName: String, email: String, lastLogin: Date
});

const Student     = mongoose.model('Student',     studentSchema);
const Teacher     = mongoose.model('Teacher',     teacherSchema);
const UserModel   = mongoose.model('UserModel',   userSchema,   'users');
const Registration = mongoose.model('Registration', registrationSchema);

// ─── Backfill Helper ─────────────────────────────────────────────────────────
async function backfillCollection(Model, roleLabel) {
    const docs = await Model.find({ lastLogin: { $exists: true, $ne: null } })
        .select('_id fullName email role lastLogin lastLoginIp')
        .lean();

    let inserted = 0, skipped = 0;

    for (const doc of docs) {
        const existing = await Log.findOne({
            user: doc._id,
            action: 'Login',
            module: 'Auth'
        });

        if (existing) {
            skipped++;
            continue;
        }

        await Log.create({
            action: 'Login',
            module: 'Auth',
            user: doc._id,
            userName: doc.fullName || 'Unknown',
            userEmail: doc.email || '',
            userRole: doc.role || roleLabel,
            details: `[Backfilled] Last recorded login from ${roleLabel} portal`,
            ipAddress: doc.lastLoginIp || 'Unknown',
            deviceInfo: 'Historical Record',
            success: true,
            createdAt: doc.lastLogin
        });
        inserted++;
    }

    console.log(`  ✅ ${Model.modelName}: ${inserted} inserted, ${skipped} skipped (already had log)`);
    return inserted;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    console.log('📝 Backfilling auth logs from login history...\n');

    let total = 0;
    total += await backfillCollection(Student,      'student');
    total += await backfillCollection(Teacher,      'teacher');
    total += await backfillCollection(UserModel,    'user');
    total += await backfillCollection(Registration, 'student');

    console.log(`\n🎉 Done! Total new log entries created: ${total}`);
    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Error during backfill:', err.message);
    mongoose.disconnect();
    process.exit(1);
});
