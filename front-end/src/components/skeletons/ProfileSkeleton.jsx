import React from 'react';

const ProfileSkeleton = () => {
    return (
        <div className="container mx-auto px-3 py-4 max-w-6xl animate-pulse">
            {/* Main Grid Layout - Compact */}
            <div className="grid lg:grid-cols-[260px_1fr] gap-4">

                {/* Left Sidebar Skeleton */}
                <div className="space-y-3">
                    {/* Main Profile Card */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm h-[400px]">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 mb-4" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                        </div>
                        <div className="space-y-4">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                            <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content Skeleton */}
                <div className="space-y-4">
                    {/* Details Section */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-[200px] p-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6" />
                        <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                            ))}
                        </div>
                    </div>

                    {/* Academic Section */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-[150px] p-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6" />
                        <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                            ))}
                        </div>
                    </div>

                    {/* Courses Section */}
                    <div className="bg-white dark:bg-[#1e293b] rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm h-[150px] p-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-6" />
                        <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSkeleton;
