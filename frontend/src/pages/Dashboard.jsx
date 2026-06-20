import React, { useState, useEffect } from 'react';
import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  Hammer,
  DollarSign,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../services/api';
import StatsCard from '../components/StatsCard';
import LoadingSkeleton from '../components/LoadingSkeleton';

export const Dashboard = () => {
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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
          <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const cards = data?.cards || {};
  const monthlySales = data?.monthly_sales || [];
  const mfgStatus = data?.manufacturing_status || { planned: 0, in_progress: 0, completed: 0 };
  const activities = data?.recent_activities || [];

  // Pie chart data
  const pieData = [
    { name: 'Planned', value: mfgStatus.planned, color: '#94a3b8' },
    { name: 'In Progress', value: mfgStatus.in_progress, color: '#3b82f6' },
    { name: 'Completed', value: mfgStatus.completed, color: '#10b981' },
  ].filter((item) => item.value > 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard Overview</h1>
        <div className="text-xs font-semibold bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-xl border border-violet-200/50 dark:border-violet-900/30">
          Live System Status
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Revenue (Delivered)"
          value={formatCurrency(cards.revenue || 0)}
          icon={DollarSign}
          description="Total cash revenue realized"
          trend="+12.5%"
          trendType="positive"
        />
        <StatsCard
          title="Sales Orders"
          value={cards.sales_orders || 0}
          icon={ShoppingCart}
          description={`${cards.pending_deliveries || 0} pending deliveries`}
          trend={`${cards.pending_deliveries || 0} to ship`}
          trendType="neutral"
        />
        <StatsCard
          title="Low Stock Alerts"
          value={cards.low_stock || 0}
          icon={AlertTriangle}
          description="Products below safety limit"
          trend={cards.low_stock > 0 ? 'Action Needed' : 'Normal'}
          trendType={cards.low_stock > 0 ? 'negative' : 'positive'}
        />
        <StatsCard
          title="Manufacturing Orders"
          value={cards.manufacturing_orders || 0}
          icon={Hammer}
          description="MOs registered"
          trend="Production active"
          trendType="neutral"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Performance Area Chart */}
        <div className="lg:col-span-2 glass rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Sales Performance (6 Months)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySales}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Manufacturing status pie chart */}
        <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Manufacturing Status</h3>
          <div className="h-72 flex flex-col justify-center">
            {pieData.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-20">No manufacturing orders yet</div>
            ) : (
              <div className="relative h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{cards.manufacturing_orders || 0}</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total MOs</span>
                </div>
              </div>
            )}

            {/* Custom Legends */}
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-semibold">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {entry.name}: <span className="text-slate-800 dark:text-slate-200">{entry.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section: Recent Activities & mini stats */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activities Timeline */}
        <div className="lg:col-span-2 glass rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-violet-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent System Activities</h3>
          </div>
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No actions logged yet</div>
              ) : (
                activities.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== activities.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-4 ring-white dark:ring-slate-900">
                            <span className="text-xs font-bold uppercase">{activity.module.slice(0, 2)}</span>
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-xs font-semibold text-slate-850 dark:text-slate-200">
                              {activity.details}{' '}
                              <span className="ml-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {activity.action}
                              </span>
                            </p>
                          </div>
                          <div className="whitespace-nowrap text-right text-[10px] text-slate-450 dark:text-slate-500 font-medium">
                            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Business summary items list */}
        <div className="glass rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Mini ERP Quick Summary</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Package className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Catalog Size</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{cards.products || 0} items</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Customers</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{cards.customers || 0} clients</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                    <ClipboardList className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Vendors Handled</span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{cards.vendors || 0} companies</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Shiv Furniture Works ERP v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
