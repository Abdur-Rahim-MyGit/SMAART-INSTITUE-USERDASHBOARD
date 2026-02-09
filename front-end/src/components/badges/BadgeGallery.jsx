import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaChevronDown } from 'react-icons/fa';
import BadgeCard from './BadgeCard';
import BadgeModal from './BadgeModal';
import { Loader2 } from 'lucide-react';
import { apiCall } from '@/services/api';

const categories = [
    { id: 'all', label: 'All' },
    { id: 'capability', label: 'CAPABILITY' },
    { id: 'capacity', label: 'CAPACITY' },
    { id: 'leadership', label: 'LEADERSHIP' },
];

const BadgeGallery = ({ badges: userEarnedBadges = [], userName = 'Student' }) => {
    const [badges, setBadges] = useState([]);
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [showEarnedOnly, setShowEarnedOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const userStr = sessionStorage.getItem('user');
                if (!userStr) {
                    setIsLoading(false);
                    return;
                }
                const user = JSON.parse(userStr);
                const data = await apiCall(`/badges/user/${user.id || user._id}`);

                if (data.success && Array.isArray(data.data)) {
                    const formattedBadges = data.data.map(userBadge => ({
                        id: userBadge.badge?._id || userBadge._id,
                        badgeId: userBadge.badge?.badgeId || userBadge.badgeId,
                        title: userBadge.badge?.title || userBadge.title || 'Badge',
                        description: userBadge.badge?.description || userBadge.description || '',
                        tier: userBadge.badge?.tier || userBadge.tier || 'bronze',
                        xp: userBadge.badge?.xp || userBadge.xp || 0,
                        category: userBadge.badge?.category || userBadge.category || 'learning',
                        earnedDate: userBadge.earnedDate,
                        isEarned: userBadge.isEarned !== undefined ? userBadge.isEarned : true,
                        progress: userBadge.progress || 100,
                        icon: userBadge.badge?.icon || userBadge.icon
                    }));
                    setBadges(formattedBadges);
                } else {
                    // Fallback: use badges passed via props
                    if (userEarnedBadges.length > 0) {
                        setBadges(userEarnedBadges.map(b => ({
                            ...b,
                            isEarned: true,
                        })));
                    }
                }
            } catch (error) {
                console.error('Error fetching badges:', error);
                // Fallback to prop badges on error
                if (userEarnedBadges.length > 0) {
                    setBadges(userEarnedBadges.map(b => ({
                        ...b,
                        isEarned: true,
                    })));
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchBadges();
    }, []);

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
        <div className="space-y-6">
            {/* Header with Dropdown Filter */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <FaTrophy className="w-5 h-5 text-[#30919D]" />
                    <span className="text-lg font-bold uppercase tracking-wider text-[#002147] dark:text-white">Your Achievements</span>
                </div>
                
                {/* Category Dropdown */}
                <div className="relative">
                    <select
                        value={activeCategory}
                        onChange={(e) => setActiveCategory(e.target.value)}
                        className="appearance-none bg-white dark:bg-slate-800 border-2 border-[#30919D] text-[#002147] dark:text-white rounded-xl px-4 py-2 pr-10 font-semibold text-sm cursor-pointer shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-[#30919D] focus:ring-offset-2"
                    >
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                    <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#30919D] pointer-events-none" />
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
