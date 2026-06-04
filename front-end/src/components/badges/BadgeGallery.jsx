import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ChevronDown, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BadgeCard from './BadgeCard';
import BadgeModal from './BadgeModal';
import { STAGES, TRACKS } from "@/data/courseStructureData";
import useUser from "@/hooks/useUser";
import apiCall from "@/services/api";

const BadgeGallery = ({ completedCourses = [], userName = 'Student' }) => {
    const { t } = useTranslation();
    const { user } = useUser();
    const [badges, setBadges] = useState([]);
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    // Dynamically derive categories from loaded badges to ensure filter always works
    const uniqueCategories = ['all', ...new Set(badges.map(b => b.category?.toLowerCase() || 'learning'))];
    const filterOptions = uniqueCategories.map(cat => ({
        id: cat,
        label: cat === 'all' ? 'All Categories' : cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }));

    useEffect(() => {
        const fetchAndAwardBadges = async () => {
            if (!user) return;
            const userId = user.id || user._id;

            try {
                setIsLoading(true);

                // 1. Fetch user's earned badges from backend
                const response = await apiCall(`/badges/user/${userId}/earned`);
                const existingBadges = response?.data || [];

                // Keep track of new badges to auto-award
                const newlyAwarded = [];

                // 2. Identify all badges the user *should* have based on completedCourses
                [...STAGES, ...TRACKS].forEach(module => {
                    const moduleName = module.name || module.shortName;
                    const categoryName = moduleName.toLowerCase().replace(/\s+/g, '-');
                    
                    module.courses.forEach(async (course) => {
                        const targetBadgeId = `${course.id}-MASTER`;
                        // If course is completed...
                        if (completedCourses && completedCourses.includes(course.id)) {
                            // Check if they already have the badge in the DB
                            const hasBadge = existingBadges.some(b => b.badgeId === targetBadgeId || b.id === targetBadgeId);
                            
                            if (!hasBadge) {
                                // Auto-award missing badge silently via API
                                try {
                                    const awardRes = await apiCall('/badges/award', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            userId,
                                            badgeId: targetBadgeId,
                                            metadata: { autoAwarded: true, courseId: course.id }
                                        })
                                    });
                                    if (awardRes?.success && awardRes?.data?.badge) {
                                        newlyAwarded.push({
                                            ...awardRes.data.badge,
                                            id: awardRes.data.badge._id || awardRes.data.badge.id, // Mongoose ObjectId
                                            _id: awardRes.data.badge._id || awardRes.data.badge.id,
                                            earnedDate: new Date(),
                                            isEarned: true
                                        });
                                    }
                                } catch (awardErr) {
                                    console.error(`Failed to auto-award ${targetBadgeId}`, awardErr);
                                }
                            }
                        }
                    });
                });

                // Re-fetch final badge list if any were newly awarded, otherwise use existing
                let finalBadges = [...existingBadges, ...newlyAwarded];
                
                if (newlyAwarded.length > 0) {
                     // Wait a moment for DB persistence then re-fetch
                     await new Promise(r => setTimeout(r, 500));
                     const finalRes = await apiCall(`/badges/user/${userId}/earned`);
                     if (finalRes?.data) finalBadges = finalRes.data;
                }

                // Format badges for gallery display
                const displayBadges = finalBadges.map(b => ({
                    ...b,
                    id: b._id || b.id,      // Ensure Mongo ID is used for QR
                    _id: b._id || b.id,     // Duplicate for safety
                    badgeId: b.badgeId,
                    title: b.title || `${b.badgeId} Master`,
                    description: b.description || `Awarded for successfully completing the track.`,
                    category: b.category || 'learning',
                    tier: b.tier || 'standard',
                    xp: b.xp || 200,
                    earnedDate: b.earnedDate || b.earnedAt || new Date(),
                    isEarned: true,
                    progress: 100,
                    icon: b.icon || 'Award',
                    color: b.color || '#1a3884' // Deep Navy theme
                }));
                
                setBadges(displayBadges);
            } catch (error) {
                console.error('Error loading/awarding badges:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndAwardBadges();
    }, [completedCourses, t, user?.id, user?._id]);

    // Filter by category
    const filteredBadges = badges.filter((badge) => {
        return activeCategory === 'all' || (badge.category?.toLowerCase() || 'learning') === activeCategory;
    });

    const handleBadgeClick = (badge) => {
        setSelectedBadge(badge);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600 dark:text-teal-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Filters */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 w-full sm:w-auto">
                    <Trophy className="w-4.5 h-4.5 text-[#1a3884]" />
                    <span className="text-[13.5px] font-extrabold uppercase tracking-wider text-[#002147] dark:text-white">
                        {t('badge_gallery.achievements_cabinet')}
                    </span>
                </div>

                <div className="flex w-full items-center gap-3 sm:w-auto">
                    <div className="relative w-full sm:w-auto">
                        <select
                            value={activeCategory}
                            onChange={(e) => setActiveCategory(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-[#d8e6f7] bg-white px-4 py-2.5 pr-10 text-[12.5px] font-bold text-[#0d1f4e] shadow-sm outline-none transition-all hover:border-[#1a3884]/30 focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/20 sm:w-auto dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white"
                        >
                            {filterOptions.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Badge Grid */}
            {filteredBadges.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {filteredBadges.map((badge, index) => (
                        <motion.div
                            key={badge.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.02 }}
                        >
                            <BadgeCard
                                badge={badge}
                                isLocked={false} // Force unlocked representation
                                onClick={handleBadgeClick}
                            />
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
                    <Trophy className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
                        {t('badge_gallery.no_achievements')}
                    </h3>
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
