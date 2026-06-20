import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, Filter } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';

export const AuditLogs = () => {
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(15);
  const [moduleFilter, setModuleFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/audit/', {
        params: { skip, limit, module: moduleFilter || undefined },
      });
      setLogs(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      addToast('Failed to load system audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [skip, moduleFilter]);

  const modules = [
    { value: '', label: 'All Modules' },
    { value: 'auth', label: 'Auth & Accounts' },
    { value: 'products', label: 'Products' },
    { value: 'customers', label: 'Customers' },
    { value: 'vendors', label: 'Vendors' },
    { value: 'sales', label: 'Sales Orders' },
    { value: 'purchase', label: 'Purchase Orders' },
    { value: 'bom', label: 'Bill of Materials' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'inventory', label: 'Inventory' },
  ];

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {new Date(row.timestamp).toLocaleString()}
        </span>
      ),
    },
    { key: 'user_name', header: 'Operator' },
    {
      key: 'module',
      header: 'Module',
      render: (row) => (
        <span className="text-[11px] font-bold uppercase tracking-wider text-violet-500">
          {row.module}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action Type',
      render: (row) => <StatusBadge status={row.action} />,
    },
    { key: 'details', header: 'Details Description' },
    {
      key: 'entity_id',
      header: 'Doc IDRef',
      render: (row) => (row.entity_id ? `#${row.entity_id}` : '-'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Audit Logging</h1>
          <p className="text-sm text-slate-400 font-medium">Verify system trace history, user events, and master-data changes.</p>
        </div>

        {/* Filter Selection */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-405 shrink-0" />
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setSkip(0);
            }}
            className="rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-205 focus:border-violet-500 focus:outline-none"
          >
            {modules.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        loading={loading}
        total={total}
        skip={skip}
        limit={limit}
        onPageChange={setSkip}
      />
    </div>
  );
};

export default AuditLogs;
