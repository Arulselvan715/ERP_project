import React from 'react';

export const LoadingSkeleton = ({ type = 'table', rows = 5, cols = 4 }) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
            </div>
            <div className="mt-4 h-8 w-16 rounded bg-slate-200 dark:bg-slate-800"></div>
            <div className="mt-2 h-3 w-32 rounded bg-slate-200 dark:bg-slate-800"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className="animate-pulse space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-10 w-full rounded bg-slate-200 dark:bg-slate-800"></div>
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-4">
          <div className="h-10 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
          <div className="h-10 w-24 rounded bg-slate-200 dark:bg-slate-800"></div>
        </div>
      </div>
    );
  }

  // Default: table skeleton
  return (
    <div className="animate-pulse space-y-4">
      {/* Header skeleton */}
      <div className="flex justify-between items-center py-2">
        <div className="h-8 w-64 rounded bg-slate-200 dark:bg-slate-800"></div>
        <div className="h-8 w-32 rounded bg-slate-200 dark:bg-slate-800"></div>
      </div>
      
      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4">
          <div className="grid grid-cols-12 gap-4">
            {[...Array(cols)].map((_, i) => (
              <div key={i} className="col-span-3 h-4 rounded bg-slate-200 dark:bg-slate-800"></div>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {[...Array(rows)].map((_, rowIndex) => (
            <div key={rowIndex} className="p-4">
              <div className="grid grid-cols-12 gap-4">
                {[...Array(cols)].map((_, colIndex) => (
                  <div key={colIndex} className="col-span-3 h-4 rounded bg-slate-200 dark:bg-slate-800"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
