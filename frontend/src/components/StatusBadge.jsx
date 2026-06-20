import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  // Clean status string
  const cleanStatus = status.toLowerCase().replace(/_/g, ' ');

  let colorClasses = 'bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200';

  if (['draft', 'planned', 'pending'].includes(cleanStatus)) {
    colorClasses = 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-800';
  } else if (['confirmed', 'in progress', 'started'].includes(cleanStatus)) {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50';
  } else if (['partially delivered', 'partially received'].includes(cleanStatus)) {
    colorClasses = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50';
  } else if (['fully delivered', 'fully received', 'completed', 'received', 'delivered'].includes(cleanStatus)) {
    colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50';
  } else if (['cancelled', 'deactivated', 'inactive'].includes(cleanStatus)) {
    colorClasses = 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50';
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${colorClasses}`}>
      {cleanStatus}
    </span>
  );
};

export default StatusBadge;
