import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  ClipboardList,
  Hammer,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Factory,
} from 'lucide-react';
import api from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/');
        setData(response.data);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
        <LoadingSkeleton type="card" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
          <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const soStats = data?.so_stats || {};
  const poStats = data?.po_stats || {};
  const moStats = data?.mo_stats || {};
  const totalProducts = data?.total_products || 0;
  const pendingDeliveries = data?.pending_deliveries || 0;
  const lowStockProducts = data?.low_stock_products || [];
  const recentLedger = data?.recent_ledger || [];

  // Calculations
  const totalSalesOrders = Object.values(soStats).reduce((a, b) => a + b, 0);
  const activeMfgOrders = (moStats.confirmed || 0) + (moStats.in_progress || 0);
  const openPurchaseOrders = (poStats.draft || 0) + (poStats.confirmed || 0);
  const lowStockAlerts = lowStockProducts.length;

  const formatMovementType = (type) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Summary Cards Grid */}
      <div className="space-y-6">
        {/* Row 1: 4 Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Sales Orders */}
          <div className="glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm flex flex-col justify-between h-40">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100/70 text-violet-650 dark:bg-violet-950/50 dark:text-violet-400">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{totalSalesOrders}</div>
              <div className="text-xs font-semibold text-slate-400 mt-1">Total Sales Orders</div>
            </div>
          </div>

          {/* Pending Deliveries */}
          <div className="glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm flex flex-col justify-between h-40">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100/70 text-sky-655 dark:bg-sky-950/50 dark:text-sky-400">
              <Package className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{pendingDeliveries}</div>
              <div className="text-xs font-semibold text-slate-400 mt-1">Pending Deliveries</div>
            </div>
          </div>

          {/* Active Manufacturing Orders */}
          <div className="glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm flex flex-col justify-between h-40">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-655 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Factory className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{activeMfgOrders}</div>
              <div className="text-xs font-semibold text-slate-400 mt-1">Active Manufacturing Orders</div>
            </div>
          </div>

          {/* Open Purchase Orders */}
          <div className="glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm flex flex-col justify-between h-40">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100/70 text-amber-655 dark:bg-amber-950/50 dark:text-amber-400">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{openPurchaseOrders}</div>
              <div className="text-xs font-semibold text-slate-400 mt-1">Open Purchase Orders</div>
            </div>
          </div>
        </div>

        {/* Row 2: 2 Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Low Stock Alerts */}
          <div className="glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm flex flex-col justify-between h-40">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100/70 text-rose-655 dark:bg-rose-950/50 dark:text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{lowStockAlerts}</div>
              <div className="text-xs font-semibold text-slate-400 mt-1">Low Stock Alerts</div>
            </div>
          </div>

          {/* Total Products */}
          <div className="glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm flex flex-col justify-between h-40">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100/70 text-sky-655 dark:bg-sky-950/50 dark:text-sky-400">
              <Package className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">{totalProducts}</div>
              <div className="text-xs font-semibold text-slate-400 mt-1">Total Products</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-850 dark:text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate('/sales-orders')}
            className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs px-5 py-3 shadow-md shadow-violet-500/20 transition-all cursor-pointer"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            <span>New Sales Order</span>
          </button>
          <button
            onClick={() => navigate('/purchase-orders')}
            className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-5 py-3 transition-all cursor-pointer border border-slate-200/40 dark:border-slate-750"
          >
            <ClipboardList className="h-4.5 w-4.5" />
            <span>New Purchase Order</span>
          </button>
          <button
            onClick={() => navigate('/manufacturing')}
            className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-5 py-3 transition-all cursor-pointer border border-slate-200/40 dark:border-slate-750"
          >
            <Hammer className="h-4.5 w-4.5" />
            <span>New Manufacturing Order</span>
          </button>
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-5 py-3 transition-all cursor-pointer border border-slate-200/40 dark:border-slate-750"
          >
            <Package className="h-4.5 w-4.5" />
            <span>Manage Products</span>
          </button>
        </div>
      </div>

      {/* Bottom Lists Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stock Movements */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-base font-bold text-slate-850 dark:text-white">Recent Stock Movements</h3>
            <Link to="/inventory" className="text-xs font-bold text-violet-650 dark:text-violet-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex-1 glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm min-h-[300px]">
            {recentLedger.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400 font-medium py-16">
                No stock movements recorded yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentLedger.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                        <Package className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">
                          {item.product_sku || `Product #${item.product_id}`}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 truncate">
                          {item.product_name || 'Generic Item'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-550 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200/30 dark:border-slate-700/30">
                          {formatMovementType(item.movement_type)}
                        </span>
                        <div className="text-[9px] text-slate-400 mt-1 font-semibold">
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`text-xs font-extrabold ${parseFloat(item.quantity) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {parseFloat(item.quantity) >= 0 ? '+' : ''}
                        {parseFloat(item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-base font-bold text-slate-850 dark:text-white">Low Stock Alerts</h3>
            <Link to="/inventory" className="text-xs font-bold text-violet-650 dark:text-violet-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex-1 glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm min-h-[300px]">
            {lowStockProducts.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400 font-medium py-16">
                No low stock alerts active
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {lowStockProducts.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400 shrink-0">
                        <AlertTriangle className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 truncate">
                          SKU: {item.sku}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-rose-600 dark:text-rose-455">
                        Stock: {parseFloat(item.on_hand_qty)}
                      </div>
                      <div className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold mt-0.5">
                        Limit: {parseFloat(item.reorder_level || 5)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
