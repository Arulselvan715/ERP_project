import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Clock } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

export const WorkOrders = () => {
  const { addToast } = useToast();
  const { isAdmin, isManufacturing } = useAuth();
  
  const [workOrders, setWorkOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(15);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/manufacturing/work-orders', {
        params: { status: statusFilter || undefined }
      });
      setWorkOrders(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      addToast('Failed to load work orders queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/manufacturing/work-orders/${id}`, { status });
      addToast(`Work order status updated to ${status.replace('_', ' ')}`, 'success');
      fetchWorkOrders();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to update work order';
      addToast(errorMsg, 'error');
    }
  };

  const columns = [
    { key: 'order_number', header: 'MO Number', render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.order_number}</span> },
    { key: 'product_name', header: 'Finished Product' },
    { key: 'sequence', header: 'Step', render: (row) => <span className="font-bold text-slate-400">#{row.sequence}</span> },
    { key: 'operation_name', header: 'Operation' },
    { key: 'work_center', header: 'Work Center', render: (row) => <span>{row.work_center || '-'}</span> },
    { key: 'planned_duration_min', header: 'Est Duration', render: (row) => <span>{row.planned_duration_min} mins</span> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
            row.status === 'pending'
              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400'
              : row.status === 'in_progress'
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
              : row.status === 'done'
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450'
          }`}
        >
          {row.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        const canAction = isAdmin || isManufacturing;
        if (row.status === 'pending') {
          return (
            <button
              onClick={() => handleUpdateStatus(row.id, 'in_progress')}
              disabled={!canAction}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 cursor-pointer disabled:opacity-30"
              title="Start operation"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              Start
            </button>
          );
        }
        if (row.status === 'in_progress') {
          return (
            <button
              onClick={() => handleUpdateStatus(row.id, 'done')}
              disabled={!canAction}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer disabled:opacity-30"
              title="Complete operation"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </button>
          );
        }
        return <span className="text-slate-400 text-xs font-medium italic">Completed</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Work Orders Queue</h1>
        <p className="text-sm text-slate-400 font-medium">View manufacturing operations flow and track production tasks on the shop floor.</p>
      </div>

      {/* Filters and Table */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              statusFilter === ''
                ? 'bg-violet-50 border-violet-200 text-violet-650'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            All Work
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-slate-100 border-slate-200 text-slate-600'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              statusFilter === 'in_progress'
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setStatusFilter('done')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              statusFilter === 'done'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-655'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            Completed
          </button>
        </div>

        <DataTable
          columns={columns}
          data={workOrders}
          loading={loading}
          total={total}
          skip={skip}
          limit={limit}
          onPageChange={setSkip}
        />
      </div>
    </div>
  );
};

export default WorkOrders;
