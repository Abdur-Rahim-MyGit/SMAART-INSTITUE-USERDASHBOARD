const TaskListSkeleton = () => {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-start">
                    {/* Time */}
                    <div className="min-w-[44px] flex flex-col items-center pt-1 space-y-1">
                        <div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>

                    {/* Task Card */}
                    <div className="flex-1 p-3 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse">
                        <div className="space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                            <div className="flex items-center justify-between mt-3">
                                <div className="flex -space-x-1.5">
                                    {[1, 2].map((j) => (
                                        <div
                                            key={j}
                                            className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 border border-white dark:border-[#002147]"
                                        />
                                    ))}
                                </div>
                                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TaskListSkeleton;
