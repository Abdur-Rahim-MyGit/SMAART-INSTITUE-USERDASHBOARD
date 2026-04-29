import React from 'react';

const ProfileSkeleton = () => {
    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl animate-pulse">
            {/* Header section with page title placeholder */}
            <div className="mb-8 flex justify-between items-center">
                <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded-lg w-48" />
            </div>

            {/* Profile Overview Card Skeleton */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-6">
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-gray-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 w-full space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
                        <div className="h-8 bg-gray-200 dark:bg-slate-800 rounded-lg w-64" />
                    </div>
                    <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded-lg w-24" />
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-lg w-32" />
                        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded-lg w-48" />
                    </div>
                </div>
                {/* Status Badge Placeholder */}
                <div className="hidden lg:block h-10 bg-gray-100 dark:bg-slate-800 rounded-2xl w-32" />
            </div>

            {/* Personal Information Card Skeleton */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800 mb-6">
                <div className="flex justify-between items-center mb-8">
                    <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded-lg w-48" />
                    <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded-xl w-24" />
                </div>
                <hr className="my-6 border-gray-100 dark:border-slate-800" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-3 bg-gray-100 dark:bg-slate-800/50 rounded w-20" />
                            <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-full" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Address Card Skeleton */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800 mb-6">
                <div className="flex justify-between items-center mb-8">
                    <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded-lg w-32" />
                    <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded-xl w-24" />
                </div>
                <hr className="my-6 border-gray-100 dark:border-slate-800" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 gap-x-12">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-3 bg-gray-100 dark:bg-slate-800/50 rounded w-16" />
                            <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded w-full" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Experience & Projects Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-gray-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-xl" />
                                <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded-lg w-32" />
                            </div>
                            <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-lg" />
                        </div>
                        <div className="space-y-4">
                            {[1, 2].map((j) => (
                                <div key={j} className="p-4 bg-gray-50/50 dark:bg-slate-800/30 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-3">
                                    <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded-lg w-3/4" />
                                    <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-lg w-1/2" />
                                    <div className="h-3 bg-gray-100/50 dark:bg-slate-800/20 rounded-lg w-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfileSkeleton;
