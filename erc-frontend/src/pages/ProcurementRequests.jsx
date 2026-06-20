import React, { useState, useEffect } from 'react';
import { Plus, Check, X, FilePlus, AlertCircle } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

export const ProcurementRequests = () => {
  const { addToast } = useToast();
  const { isAdmin, isPurchase } = useAuth();
  
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/purchase/procurement-requests', {
        params: { status: statusFilter || undefined }
      });
      // Response comes as { data: [...], total: ... }
      setRequests(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      addToast('Failed to load procurement requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/', { params: { limit: 100 } });
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load products', error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) {
      addToast('Please select a product and enter a valid quantity', 'warning');
      return;
    }

    try {
      await api.post('/purchase/procurement-requests', {
        product_id: parseInt(selectedProductId),
        quantity: parseFloat(quantity),
        notes: notes
      });
      addToast('Procurement request submitted successfully', 'success');
      setIsCreateOpen(false);
      setSelectedProductId('');
      setQuantity(1);
      setNotes('');
      fetchRequests();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to submit request';
      addToast(errorMsg, 'error');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/purchase/procurement-requests/${id}`, { status: 'approved' });
      addToast('Request approved', 'success');
      fetchRequests();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to approve request';
      addToast(errorMsg, 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/purchase/procurement-requests/${id}`, { status: 'rejected' });
      addToast('Request rejected', 'info');
      fetchRequests();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to reject request';
      addToast(errorMsg, 'error');
    }
  };

  const handleGeneratePO = async (id) => {
    try {
      const response = await api.post(`/purchase/procurement-requests/${id}/create-po`);
      addToast(response.data.message || 'Purchase Order generated', 'success');
      fetchRequests();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create Purchase Order';
      addToast(errorMsg, 'error');
    }
  };

  const columns = [
    { key: 'id', header: 'Req ID', render: (row) => `#${row.id}` },
    { key: 'product_sku', header: 'SKU', render: (row) => <span className="font-semibold">{row.product_sku}</span> },
    { key: 'product_name', header: 'Product / Material' },
    { key: 'quantity', header: 'Quantity Needed', render: (row) => <span className="font-bold text-violet-650 dark:text-violet-400">{row.quantity} units</span> },
    { key: 'requester_username', header: 'Requester', render: (row) => <span className="text-slate-550 dark:text-slate-400 font-medium">@{row.requester_username}</span> },
    { key: 'notes', header: 'Notes/Justification', render: (row) => <span className="text-xs text-slate-400 truncate max-w-xs block">{row.notes || '-'}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
            row.status === 'pending'
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
              : row.status === 'approved'
              ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400'
              : row.status === 'po_created'
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
        const canAction = isAdmin || isPurchase;
        if (row.status === 'pending') {
          return (
            <div className="flex gap-1.5">
              <button
                onClick={() => handleApprove(row.id)}
                disabled={!canAction}
                className="p-1 text-emerald-650 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded cursor-pointer disabled:opacity-30"
                title="Approve request"
              >
                <Check className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={() => handleReject(row.id)}
                disabled={!canAction}
                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded cursor-pointer disabled:opacity-30"
                title="Reject request"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          );
        }
        if (row.status === 'approved') {
          return (
            <button
              onClick={() => handleGeneratePO(row.id)}
              disabled={!canAction}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-violet-600 text-white rounded-lg hover:bg-violet-750 cursor-pointer disabled:opacity-30"
              title="Generate Purchase Order"
            >
              <FilePlus className="h-3.5 w-3.5" />
              Create PO
            </button>
          );
        }
        return <span className="text-slate-400 text-xs font-medium italic">PO Generated</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Procurement Requests</h1>
          <p className="text-sm text-slate-400 font-medium">Request materials, approve requests, and automatically spawn draft Purchase Orders.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 px-4 text-sm font-bold text-white shadow-md hover:bg-violet-750 transition-all cursor-pointer shadow-violet-500/20"
        >
          <Plus className="h-4.5 w-4.5" />
          New Request
        </button>
      </div>

      {/* Filter and Table */}
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
            All Requests
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-sky-50 border-sky-200 text-sky-655'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('po_created')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              statusFilter === 'po_created'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-655'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            PO Generated
          </button>
        </div>

        <DataTable
          columns={columns}
          data={requests}
          loading={loading}
          total={total}
          skip={skip}
          limit={limit}
          onPageChange={setSkip}
        />
      </div>

      {/* New Request Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Procurement Request" size="md">
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Select Product / Material
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
              className="block w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-909 dark:text-white"
            >
              <option value="">-- Select Material --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) - Stock: {p.on_hand_qty} units
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Quantity Required
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="block w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-909 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Notes / Justification
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Critical stock deficit for Smart Controller Box production"
              className="block w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-909 dark:text-white h-24"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-750 transition-colors cursor-pointer"
            >
              Submit Request
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProcurementRequests;
