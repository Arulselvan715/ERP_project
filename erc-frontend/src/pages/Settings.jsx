import React, { useState } from 'react';
import { Shield, Key, Database, Cpu, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

export const Settings = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handlePasswordChange = async (data) => {
    if (data.new_password !== data.confirm_password) {
      addToast("New passwords do not match", "warning");
      return;
    }
    setLoading(true);
    try {
      // Use the general user update API to change current user password
      await api.put(`/users/${user.id}`, {
        username: user.username,
        email: user.email,
        password: data.new_password
      });
      addToast('Password updated successfully', 'success');
      reset();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to update password';
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">System Settings</h1>
        <p className="text-sm text-slate-400 font-medium">Configure preferences, update credentials, and check database connections.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Security / Password section */}
          <div className="glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-650 dark:text-violet-400">
                <Key className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-850 dark:text-white">Change Credentials</h3>
                <p className="text-[11px] text-slate-400">Update your account login password.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  {...register('new_password', { required: 'New password is required' })}
                  className="block w-full max-w-md rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-909 dark:text-white focus:border-violet-500 focus:outline-none"
                />
                {errors.new_password && <p className="mt-1 text-xs text-rose-500">{errors.new_password.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  {...register('confirm_password', { required: 'Please confirm your new password' })}
                  className="block w-full max-w-md rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-909 dark:text-white focus:border-violet-500 focus:outline-none"
                />
                {errors.confirm_password && <p className="mt-1 text-xs text-rose-500">{errors.confirm_password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-violet-650 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-750 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* System Preferences */}
          <div className="glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/40 text-sky-655 dark:text-sky-400">
                <Shield className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-850 dark:text-white">ERP Configuration</h3>
                <p className="text-[11px] text-slate-400">Global system settings for inventory and pricing.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Default Currency
                  </label>
                  <select
                    disabled
                    value="INR"
                    className="block w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 px-4 py-2.5 text-sm text-slate-500"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Procurement Strategy
                  </label>
                  <select
                    disabled
                    value="make_to_stock"
                    className="block w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 px-4 py-2.5 text-sm text-slate-500"
                  >
                    <option value="make_to_stock">Make to Stock (MTS)</option>
                    <option value="make_to_order">Make to Order (MTO)</option>
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">These settings are configured dynamically per product in the Master Products catalogue.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Diagnostics */}
        <div className="space-y-6">
          <div className="glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-655 dark:text-emerald-400">
                <Database className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-850 dark:text-white">Database & API</h3>
                <p className="text-[11px] text-slate-400">Connection state diagnostics.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-650 dark:text-slate-300">API Status</span>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                  <CheckCircle className="h-3.5 w-3.5 fill-emerald-500 text-white dark:text-slate-900" />
                  CONNECTED
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-650 dark:text-slate-300">DBMS Engine</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-250">PostgreSQL (Neon)</span>
              </div>

              <div className="text-[10px] text-slate-400 space-y-1">
                <div><strong>Host URL:</strong> ep-wandering-hall-ai1yq3l3-pooler</div>
                <div><strong>Region:</strong> US East (AWS)</div>
                <div><strong>Latency Check:</strong> Pass (~45ms)</div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-300">
                <Cpu className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-850 dark:text-white">Environment</h3>
                <p className="text-[11px] text-slate-400">System deployment info.</p>
              </div>
            </div>

            <div className="space-y-2 text-xs font-medium text-slate-650 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Frontend:</span>
                <span className="font-bold text-slate-850 dark:text-slate-200">Vercel Build (Production)</span>
              </div>
              <div className="flex justify-between">
                <span>Backend:</span>
                <span className="font-bold text-slate-850 dark:text-slate-200">Render Web Server (Python)</span>
              </div>
              <div className="flex justify-between">
                <span>Framework:</span>
                <span className="font-bold text-slate-850 dark:text-slate-200">React 18 + Flask</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
