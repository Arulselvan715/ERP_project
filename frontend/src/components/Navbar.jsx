import React, { useState, useEffect } from 'react';
import { Sun, Moon, Bell, User as UserIcon, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export const Navbar = () => {
  const { user } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [alerts, setAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load low stock alerts for the notifications bell
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await api.get('/inventory/');
        // Filter low stock products
        const lowStock = response.data?.filter(
          (p) => p.free_qty <= (p.low_stock_threshold || 10)
        ) || [];
        setAlerts(lowStock);
      } catch (error) {
        console.error('Failed to fetch low stock alerts', error);
      }
    };
    if (user) {
      fetchAlerts();
      // Poll every 60 seconds
      const interval = setInterval(fetchAlerts, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-6 glass">
      {/* Search placeholder or page context title */}
      <div>
        <h2 className="text-lg font-bold text-slate-850 dark:text-white">Shiv ERP</h2>
      </div>

      {/* Action Items */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl glass z-50">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Alerts & Notifications</span>
                <span className="text-[10px] font-semibold text-rose-500 uppercase">{alerts.length} Low Stock</span>
              </div>
              <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                {alerts.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">No alerts active</div>
                ) : (
                  alerts.map((item) => (
                    <div key={item.id} className="flex gap-2.5 p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-950/20">
                      <AlertTriangle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">
                          {item.name} ({item.sku})
                        </div>
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                          Low Stock: On hand {item.on_hand_qty} (Threshold: {item.low_stock_threshold || 10})
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <UserIcon className="h-4.5 w-4.5" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-slate-900 dark:text-white leading-none">{user?.name}</span>
            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
              {user?.role.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
