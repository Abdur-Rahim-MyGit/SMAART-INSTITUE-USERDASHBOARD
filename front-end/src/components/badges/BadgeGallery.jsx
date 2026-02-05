import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaStar, FaFire, FaMedal, FaCrown, FaChartLine, FaFilter } from 'react-icons/fa';
import BadgeCard from './BadgeCard';
import BadgeModal from './BadgeModal';

// Sample badge data - In production, this would come from your API
// Sample badge data removed to show only real achievements
const sampleBadges = [];

const categories = [
    { id: 'all', label: 'All Badges', icon: FaTrophy },
    { id: 'assessment', label: 'Assessments', icon: FaStar },
    { id: 'learning', label: 'Learning', icon: FaChartLine },
    { id: 'streak', label: 'Streaks', icon: FaFire },
    { id: 'community', label: 'Community', icon: FaMedal },
    { id: 'certification', label: 'Certification', icon: FaCrown },
];

const BadgeGallery = ({ badges: userEarnedBadges = [], userName = 'Student' }) => {
    // Define all possible badges in the system
    const allPossibleBadges = [
        {
            id: 'EARLY-ACHIEVER',
            title: 'Early Achiever',
            description: 'Completed the first three sessions of your first course!',
            tier: 'bronze',
            xp: 150,
            category: 'learning',
            isEarned: userEarnedBadges.some(ub => ub.badgeId === 'EARLY-ACHIEVER')
        }
    ];

    const badges = allPossibleBadges;

    const [selectedBadge, setSelectedBadge] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [showEarnedOnly, setShowEarnedOnly] = useState(false);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const userStr = sessionStorage.getItem('user');
                if (!userStr) {
                    setIsLoading(false);
                    return;
                }
                const user = JSON.parse(userStr);
                const response = await fetch(`${API_BASE_URL}/badges/user/${user.id || user._id}`);
                const data = await response.json();

                if (data.success) {
                    // Transform API data to match component expectations
                    const formattedBadges = data.data.map(userBadge => ({
                        id: userBadge.badge._id,
                        badgeId: userBadge.badge.badgeId,
                        title: userBadge.badge.title,
                        description: userBadge.badge.description,
                        tier: userBadge.badge.tier,
                        xp: userBadge.badge.xp,
                        category: userBadge.badge.category,
                        earnedDate: userBadge.earnedDate,
                        isEarned: userBadge.isEarned,
                        progress: userBadge.progress,
                        icon: userBadge.badge.icon
                    }));
                    setBadges(formattedBadges);
                }
            } catch (error) {
                console.error('Error fetching badges:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBadges();
    }, []);

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
            // Find the specific earned badge to get its unique _id
            const earnedBadge = userEarnedBadges.find(ub => ub.badgeId === badge.id);
            setSelectedBadge(earnedBadge || badge);
            setIsModalOpen(true);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-teal" />
            </div>
        );
    }

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

            {/* Filters removed for single badge display */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <FaTrophy className="w-4 h-4 text-[#30919D]" />
                    <span className="text-sm font-bold uppercase tracking-wider text-[#002147] dark:text-white">Your Achievements</span>
                </div>
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
