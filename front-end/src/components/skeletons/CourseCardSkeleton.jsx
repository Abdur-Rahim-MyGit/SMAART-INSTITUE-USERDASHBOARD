import { motion } from 'framer-motion';

const CourseCardSkeleton = () => {
    return (
        <div className="lms-card p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Video Thumbnail Skeleton */}
            <div className="md:col-span-5 relative overflow-hidden rounded-2xl h-48 md:h-full min-h-[180px] bg-gray-200 dark:bg-gray-700 animate-pulse">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skeleton-shimmer" />
            </div>

            {/* Right: Details Skeleton */}
            <div className="md:col-span-7 space-y-4">
                {/* Title */}
                <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                </div>

                {/* Module Items */}
                <div className="space-y-3">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse"
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                </div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-[#002147] animate-pulse"
                            />
                        ))}
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
                </div>
            </div>
        </div>
    );
};

export default CourseCardSkeleton;
