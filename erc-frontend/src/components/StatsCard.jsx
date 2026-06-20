import React from 'react';

export const StatsCard = ({ title, value, icon: Icon, description, trend, trendType = 'neutral', onClick }) => {
  let trendColor = 'text-slate-500';
  if (trendType === 'positive') trendColor = 'text-emerald-500';
  if (trendType === 'negative') trendColor = 'text-rose-500';

  return (
    <div
      onClick={onClick}
      className={`glass rounded-2xl border border-slate-200 dark:border-slate-800 bg-white p-6 shadow-sm dark:bg-slate-900/50 hover:shadow-md transition-all duration-300 ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="mt-4">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</span>
        {(description || trend) && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {trend && <span className={`font-semibold ${trendColor}`}>{trend}</span>}
            {description && <span className="text-slate-400 dark:text-slate-500">{description}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
