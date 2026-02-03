const StatsCardSkeleton = () => {
    return (
        <div className="lms-card p-4 animate-pulse">
            <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
    );
};

export default StatsCardSkeleton;
