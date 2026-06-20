import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Users,
  User,
  Truck,
  ShoppingCart,
  ClipboardList,
  Warehouse,
  Layers,
  Hammer,
  BarChart3,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout, isAdmin, isSales, isPurchase, isManufacturing, isInventory, isOwner } = useAuth();

  const menuItems = [
    { path: '/', label: 'Main Desk', icon: LayoutDashboard, show: true },
    { path: '/products', label: 'Item Blueprints', icon: Package, show: true },
    { path: '/customers', label: 'Customers', icon: Users, show: isSales },
    { path: '/vendors', label: 'Vendors', icon: Truck, show: isPurchase },
    { path: '/sales-orders', label: 'Sales Orders', icon: ShoppingCart, show: isSales },
    { path: '/purchase-orders', label: 'Purchase Orders', icon: ClipboardList, show: isPurchase },
    { path: '/inventory', label: 'Warehouse Stock', icon: Warehouse, show: isInventory },
    { path: '/bill-of-materials', label: 'Bill of Materials', icon: Layers, show: isManufacturing },
    { path: '/manufacturing', label: 'Manufacturing', icon: Hammer, show: isManufacturing },
    { path: '/reports', label: 'Reports', icon: BarChart3, show: isAdmin || isOwner },
    { path: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck, show: isAdmin },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Brand logo header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 font-bold text-white shadow-md shadow-violet-500/30">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-slate-950 dark:text-white leading-none">Shiv Furniture</span>
              <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-1">CORE ERP TERMINAL</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 font-bold text-white shadow-md shadow-violet-500/30">
            S
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
        {menuItems
          .filter((item) => item.show)
          .map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-violet-50 text-violet-600 dark:bg-violet-950/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-205'
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
      </nav>

      {/* Footer Profile or Logout */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        {!collapsed ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 p-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350 shrink-0">
                <User className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-950 dark:text-white truncate">{user?.name}</div>
                <div className="text-[10px] font-semibold text-slate-450 dark:text-slate-550 capitalize truncate">
                  {user?.role.replace('_', ' ')}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
            >
              <LogOut className="h-4 w-4 text-slate-500" />
              <span>Logout Secure Session</span>
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="flex w-full items-center justify-center p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-20 -right-3.5 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 shadow-sm cursor-pointer"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
};

export default Sidebar;
