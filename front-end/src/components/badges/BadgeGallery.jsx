import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaStar, FaFire, FaMedal, FaCrown, FaChartLine, FaFilter } from 'react-icons/fa';
import BadgeCard from './BadgeCard';
import BadgeModal from './BadgeModal';

// Sample badge data - In production, this would come from your API
const sampleBadges = [
    {
        id: 'BADGE-CRQ-2026-001',
        title: 'Cognitive Champion',
        description: 'Mastered cognitive reasoning assessments with exceptional performance',
        tier: 'gold',
        xp: 500,
        percentile: 5,
        category: 'assessment',
        earnedDate: '2026-01-15',
        isEarned: true,
    },
    {
        id: 'BADGE-EQ-2026-002',
        title: 'Emotional Intelligence Master',
        description: 'Demonstrated outstanding emotional quotient skills',
        tier: 'silver',
        xp: 350,
        percentile: 15,
        category: 'assessment',
        earnedDate: '2026-01-20',
        isEarned: true,
    },
    {
        id: 'BADGE-LRN-2026-003',
        title: 'Quick Learner',
        description: 'Completed 5 courses in record time',
        tier: 'bronze',
        xp: 200,
        percentile: 25,
        category: 'learning',
        earnedDate: '2026-01-10',
        isEarned: true,
    },
    {
        id: 'BADGE-SOC-2026-004',
        title: 'Community Leader',
        description: 'Actively contributed to community discussions',
        tier: 'silver',
        xp: 300,
        percentile: 20,
        category: 'community',
        earnedDate: '2026-01-25',
        isEarned: true,
    },
    {
        id: 'BADGE-STREAK-2026-005',
        title: '30-Day Streak',
        description: 'Maintained a 30-day learning streak',
        tier: 'gold',
        xp: 450,
        percentile: 10,
        category: 'streak',
        earnedDate: '2026-02-01',
        isEarned: true,
    },
    {
        id: 'BADGE-PRO-2026-006',
        title: 'Professional Ready',
        description: 'Completed all professional readiness assessments',
        tier: 'gold',
        xp: 600,
        percentile: 3,
        category: 'certification',
        isEarned: false,
    },
    {
        id: 'BADGE-AI-2026-007',
        title: 'AI Literacy Pioneer',
        description: 'Demonstrated advanced AI & Digital literacy',
        tier: 'bronze',
        xp: 250,
        percentile: 30,
        category: 'assessment',
        earnedDate: '2026-01-28',
        isEarned: true,
    },
    {
        id: 'BADGE-ETHICS-2026-008',
        title: 'Ethics Guardian',
        description: 'Mastered ethical and sustainability judgement assessments',
        tier: 'silver',
        xp: 350,
        percentile: 15,
        category: 'assessment',
        isEarned: false,
    },
];

const categories = [
    { id: 'all', label: 'All Badges', icon: FaTrophy },
    { id: 'assessment', label: 'Assessments', icon: FaStar },
    { id: 'learning', label: 'Learning', icon: FaChartLine },
    { id: 'streak', label: 'Streaks', icon: FaFire },
    { id: 'community', label: 'Community', icon: FaMedal },
    { id: 'certification', label: 'Certification', icon: FaCrown },
];

const BadgeGallery = ({ badges = sampleBadges, userName = 'Student' }) => {
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [showEarnedOnly, setShowEarnedOnly] = useState(false);

    // Calculate stats
    const earnedBadges = badges.filter((b) => b.isEarned);
    const totalXP = earnedBadges.reduce((acc, b) => acc + (b.xp || 0), 0);
    const goldCount = earnedBadges.filter((b) => b.tier === 'gold').length;
    const silverCount = earnedBadges.filter((b) => b.tier === 'silver').length;
    const bronzeCount = earnedBadges.filter((b) => b.tier === 'bronze').length;

    // Filter badges
    const filteredBadges = badges.filter((badge) => {
        const categoryMatch = activeCategory === 'all' || badge.category === activeCategory;
        const earnedMatch = !showEarnedOnly || badge.isEarned;
        return categoryMatch && earnedMatch;
    });

    const handleBadgeClick = (badge) => {
        if (badge.isEarned) {
            setSelectedBadge(badge);
            setIsModalOpen(true);
        }
    };

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="col-span-2 md:col-span-1 bg-gradient-to-br from-[#002147] to-[#003366] rounded-2xl p-5 text-center text-white shadow-lg"
                >
                    <FaTrophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                    <p className="text-3xl font-bold">{earnedBadges.length}</p>
                    <p className="text-xs text-blue-200 font-medium">Badges Earned</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-5 text-center text-white shadow-lg"
                >
                    <FaCrown className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{goldCount}</p>
                    <p className="text-xs font-medium opacity-90">Gold</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-slate-400 to-gray-500 rounded-2xl p-5 text-center text-white shadow-lg"
                >
                    <FaMedal className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{silverCount}</p>
                    <p className="text-xs font-medium opacity-90">Silver</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl p-5 text-center text-white shadow-lg"
                >
                    <FaStar className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{bronzeCount}</p>
                    <p className="text-xs font-medium opacity-90">Bronze</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-[#30919D] to-[#287a84] rounded-2xl p-5 text-center text-white shadow-lg"
                >
                    <FaFire className="w-6 h-6 mx-auto mb-2 text-orange-300" />
                    <p className="text-2xl font-bold">{totalXP.toLocaleString()}</p>
                    <p className="text-xs font-medium opacity-90">Total XP</p>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <FaFilter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filter:</span>
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
                                    transition-all duration-200
                                    ${
                                        activeCategory === category.id
                                            ? 'bg-[#002147] text-white shadow-md'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }
                                `}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {category.label}
                            </button>
                        );
                    })}
                </div>

                {/* Earned Only Toggle */}
                <label className="flex items-center gap-2 cursor-pointer ml-auto">
                    <input
                        type="checkbox"
                        checked={showEarnedOnly}
                        onChange={(e) => setShowEarnedOnly(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="relative w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-[#30919D] transition-colors">
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${showEarnedOnly ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Earned Only</span>
                </label>
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredBadges.map((badge, index) => (
                    <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <BadgeCard
                            badge={badge}
                            isLocked={!badge.isEarned}
                            onClick={handleBadgeClick}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Empty State */}
            {filteredBadges.length === 0 && (
                <div className="text-center py-12">
                    <FaTrophy className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
                        No badges found
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Try adjusting your filters or complete more activities to earn badges!
                    </p>
                </div>
            )}

            {/* Badge Modal */}
            <BadgeModal
                badge={selectedBadge}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userName={userName}
            />
        </div>
    );
};

export default BadgeGallery;
