import { Skeleton } from "@/components/ui/skeleton";

export const CardSkeleton = () => (
  <div className="rounded-xl border border-slate-200 dark:border-white/8 p-6 space-y-4 bg-white dark:bg-[#002147] shadow-sm">
    <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <div className="space-y-2 pt-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
    <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/8">
      <Skeleton className="h-8 w-24 rounded-lg" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/8 last:border-0 animate-pulse">
    <div className="flex items-center gap-4 flex-1">
      <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4 opacity-60" />
      </div>
    </div>
    <div className="flex gap-3">
      <Skeleton className="h-8 w-20 rounded-md" />
      <Skeleton className="h-8 w-8 rounded-md" />
    </div>
  </div>
);

export const FormStepSkeleton = () => (
  <div className="space-y-8 animate-pulse p-6 bg-white dark:bg-[#002147] rounded-2xl border border-slate-200 dark:border-white/8 shadow-sm">
    <div className="space-y-3">
      <Skeleton className="h-6 w-1/4" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton className="h-5 w-1/4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
    <div className="flex justify-between pt-8 border-t border-slate-100 dark:border-white/8">
      <Skeleton className="h-10 w-24 rounded-xl" />
      <Skeleton className="h-10 w-32 rounded-xl" />
    </div>
  </div>
);

export const ReportSkeleton = () => (
  <div className="space-y-8 animate-pulse max-w-5xl mx-auto">
    {/* Header */}
    <div className="bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/8 rounded-2xl p-8 shadow-sm">
      <div className="flex items-center gap-6">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </div>
    
    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-[#002147] p-8 rounded-2xl border border-slate-200 dark:border-white/8 shadow-sm flex flex-col items-center gap-4">
        <Skeleton className="h-32 w-32 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-[#002147] p-6 rounded-2xl border border-slate-200 dark:border-white/8 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Section */}
    <div className="bg-white dark:bg-[#002147] rounded-2xl border border-slate-200 dark:border-white/8 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden">
      <Skeleton className="w-full h-full" />
    </div>
    <div className="px-8 -mt-16 relative z-10">
      <div className="flex flex-col md:flex-row items-end gap-6">
        <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-slate-50 dark:border-slate-950 shadow-xl" />
        <div className="flex-1 pb-4 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="pb-4 flex gap-3">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-6">
        <div className="bg-white dark:bg-[#002147] rounded-2xl p-6 border border-slate-200 dark:border-white/8 space-y-4">
          <Skeleton className="h-6 w-32 mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
      <div className="md:col-span-2 space-y-6">
        <div className="bg-white dark:bg-[#002147] rounded-2xl p-6 border border-slate-200 dark:border-white/8 space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse p-4 max-w-7xl mx-auto">
    {/* Hero Skeleton */}
    <div className="h-64 w-full rounded-3xl bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/8 p-8 flex flex-col justify-end gap-4 shadow-sm">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>

    {/* Banners Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>

    {/* Progress Grid */}
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>

    {/* Events/Tools Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-[#002147] rounded-2xl p-6 border border-slate-200 dark:border-white/8">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <TableRowSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white dark:bg-[#002147] rounded-2xl p-6 border border-slate-200 dark:border-white/8">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const AssessmentsSkeleton = () => (
  <div className="space-y-8 animate-pulse p-4 max-w-4xl mx-auto">
    {/* Banner Skeleton */}
    <div className="h-48 w-full rounded-3xl bg-slate-100 dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 p-8 flex flex-col justify-center items-center gap-4">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>

    {/* Buttons Skeleton */}
    <div className="flex gap-4">
      <Skeleton className="h-10 w-32 rounded-xl" />
      <Skeleton className="h-10 w-32 rounded-xl" />
    </div>

    {/* Timeline Skeleton */}
    <div className="relative pl-8 space-y-12 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative flex items-center gap-6">
          <div className="absolute -left-[30px] w-12 h-12 rounded-xl bg-white dark:bg-[#002147] border-2 border-slate-100 dark:border-white/8 flex items-center justify-center z-10">
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <div className="flex-1 bg-white dark:bg-[#002147] rounded-2xl border border-slate-200 dark:border-white/8 p-6 shadow-sm">
            <div className="flex gap-4 mb-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const NotificationsSkeleton = () => (
  <div className="space-y-6 animate-pulse max-w-6xl mx-auto">
    {/* Header Skeleton */}
    <div className="bg-white dark:bg-[#002147] rounded-xl border border-slate-200 dark:border-white/8 p-6 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>

    {/* Summary Card Skeleton */}
    <div className="h-48 w-full rounded-xl bg-slate-100 dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 p-6 space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>

    {/* List Skeleton */}
    <div className="space-y-4">
      <Skeleton className="h-4 w-24 mb-2 ml-2" />
      <div className="bg-white dark:bg-[#002147] rounded-xl border border-slate-200 dark:border-white/8 divide-y divide-slate-100 dark:divide-slate-800">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
