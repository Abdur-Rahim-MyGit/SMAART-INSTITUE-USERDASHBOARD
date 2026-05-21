import React from 'react';

const SkillsPassportSkeleton = () => {
    return (
        <div className="max-w-5xl mx-auto animate-pulse">
            <div className="mb-8">
                <div className="h-8 w-64 bg-slate-200 dark:bg-[#003170] rounded mb-2" />
                <div className="h-4 w-96 bg-slate-200 dark:bg-[#003170] rounded" />
            </div>

            {/* Tabs Skeleton */}
            <div className="flex gap-2 mb-8 bg-[#F8FAFC] dark:bg-slate-800/50 p-1.5 rounded-xl shadow-sm border border-slate-100 dark:border-white/8 w-fit">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-9 w-24 bg-slate-200 dark:bg-[#003170] rounded-lg" />
                ))}
            </div>

            {/* Content Card Skeleton */}
            <div className="bg-white dark:bg-[#002147] rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div>
                        <div className="h-6 w-40 bg-slate-200 dark:bg-[#003170] rounded mb-2" />
                        <div className="h-4 w-56 bg-slate-200 dark:bg-[#003170] rounded" />
                    </div>
                    <div className="text-right">
                        <div className="h-8 w-16 bg-slate-200 dark:bg-[#003170] rounded mb-1 ml-auto" />
                        <div className="h-3 w-12 bg-slate-200 dark:bg-[#003170] rounded ml-auto" />
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 bg-white dark:bg-[#002147]">
                    {/* Left: Radar Chart Skeleton */}
                    <div className="lg:col-span-2 p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-white/10 flex flex-col items-center justify-center bg-slate-50/30 dark:bg-slate-800/20">
                        <div className="w-64 h-64 rounded-full bg-slate-200 dark:bg-[#003170]" />
                        <div className="mt-6 h-4 w-32 bg-slate-200 dark:bg-[#003170] rounded" />
                    </div>

                    {/* Right: List of Quotients Skeleton */}
                    <div className="lg:col-span-3 p-6 md:p-8 space-y-6">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i}>
                                <div className="flex items-end justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-slate-200 dark:bg-[#003170]" />
                                        <div className="space-y-1.5">
                                            <div className="h-3 w-10 bg-slate-200 dark:bg-[#003170] rounded" />
                                            <div className="h-4 w-32 bg-slate-200 dark:bg-[#003170] rounded" />
                                        </div>
                                    </div>
                                    <div className="h-6 w-10 bg-slate-200 dark:bg-[#003170] rounded" />
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-[#002A5C] rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillsPassportSkeleton;
