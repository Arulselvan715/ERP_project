import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Get first letter of username for avatar
  const avatarLetter = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  // Format role name to match the pill text (e.g. INVENTORY MANAGER)
  const roleName = user?.role ? user.role.replace('_', ' ').toUpperCase() : 'USER';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--bg-alt)]/70 px-6 glass">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-slate-850 dark:text-white">Dashboard</h2>
      </div>

      {/* Action Items */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          title="Toggle Theme"
        >
          {theme === 'light' ? (
            <span className="text-xl">🌙</span>
          ) : (
            <span className="text-xl">☀️</span>
          )}
        </button>

        {/* User Info Badge */}
        <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/40 px-3.5 py-1.5 rounded-full border border-[var(--border)]">
          <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-sky-500 font-bold text-white text-xs shadow-sm">
            {avatarLetter}
          </div>
          <span className="text-xs font-bold text-slate-880 dark:text-slate-200">
            {user?.username || 'User'}
          </span>
          <span className="text-[9px] font-extrabold bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-lg border border-violet-200 dark:border-violet-900 ml-1.5 uppercase tracking-wider">
            {roleName}
          </span>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:text-amber-800 dark:text-slate-400 dark:hover:text-amber-400 font-bold text-xs transition-all cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5 text-amber-700 dark:text-amber-500" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
