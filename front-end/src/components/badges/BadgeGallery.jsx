import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ChevronDown, Loader2 } from 'lucide-react';
import BadgeCard from './BadgeCard';
import BadgeModal from './BadgeModal';
import apiCall from '@/services/api';

const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'capability', label: 'Capability' },
    { id: 'capacity', label: 'Capacity' },
    { id: 'leadership', label: 'Leadership' },
];

const fallbackBadges = [
    {
        id: 'MOD-COMPLETE',
        badgeId: 'MOD-COMPLETE',
        title: 'Module Master',
        description: 'Awarded for completing a course module successfully.',
        category: 'capability',
        tier: 'silver',
        xp: 300,
        icon: 'Award',
        color: '#C0C0C0'
    },
    {
        id: 'CRS-COMPLETE',
        badgeId: 'CRS-COMPLETE',
        title: 'Course Conqueror',
        description: 'Awarded for completing an entire course successfully.',
        category: 'capacity',
        tier: 'gold',
        xp: 500,
        icon: 'Trophy',
        color: '#FFD700'
    }
];

const BadgeGallery = ({ userName = 'Student' }) => {
    const [badges, setBadges] = useState([]);
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                // Fetch all course and system badges templates
                const allBadgesRes = await apiCall('/badges').catch(() => null);

                let templates = [];
                if (allBadgesRes?.success && Array.isArray(allBadgesRes.data)) {
                    templates = allBadgesRes.data;
                }

                if (templates.length === 0) {
                    templates = fallbackBadges;
                }

                // Force all templates into an unlocked state!
                const unlockedList = templates.map(b => ({
                    id: b.badgeId || b.id || b._id,
                    _id: b._id || b.id || b.badgeId,
                    title: b.title || 'Badge',
                    description: b.description || '',
                    tier: b.tier || 'standard',
                    xp: b.xp || 0,
                    category: b.category || 'learning',
                    earnedDate: b.createdAt ? new Date(b.createdAt) : new Date(),
                    isEarned: true, // Force unlock
                    progress: 100,  // Full progress meter
                    icon: b.icon || 'Award',
                    color: b.color || '#FFD700'
                }));

                setBadges(unlockedList);
            } catch (error) {
                console.error('Error loading badges:', error);
                setBadges(fallbackBadges.map(b => ({
                    ...b,
                    isEarned: true,
                    progress: 100,
                    earnedDate: new Date()
                })));
            } finally {
                setIsLoading(false);
            }
        };

        fetchBadges();
    }, []);

    // Filter by category
    const filteredBadges = badges.filter((badge) => {
        return activeCategory === 'all' || badge.category === activeCategory;
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
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Trophy className="w-5 h-5 text-[#1a3884]" />
                    <span className="text-lg font-bold uppercase tracking-wider text-[#002147] dark:text-white">Achievements Cabinet</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={activeCategory}
                            onChange={(e) => setActiveCategory(e.target.value)}
                            className="appearance-none bg-white dark:bg-[#002A5C] border-2 border-[#1a3884] text-[#002147] dark:text-white rounded-none px-4 py-2 pr-10 font-semibold text-sm cursor-pointer shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-[#1a3884] focus:ring-offset-2"
                        >
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#1a3884] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Badge Grid */}
            {filteredBadges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
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
                        No achievements available
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
