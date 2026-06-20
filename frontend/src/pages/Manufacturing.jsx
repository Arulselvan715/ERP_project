import React, { useState, useEffect } from 'react';
import { Plus, Eye, Play, CheckCircle2, User, Clock, Check } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';

export const Manufacturing = () => {
  const { addToast } = useToast();
  const [mOs, setMOs] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMO, setSelectedMO] = useState(null);

  // Create form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [assignedTo, setAssignedTo] = useState('');

  const fetchMOs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/manufacturing/', {
        params: { skip, limit, status: statusFilter || undefined },
      });
      setMOs(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      addToast('Failed to load manufacturing orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/', { params: { limit: 100 } });
      setProducts(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/', { params: { limit: 100 } });
      setUsers(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMOs();
  }, [skip, statusFilter]);

  useEffect(() => {
    fetchProducts();
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setSelectedProductId('');
    setQuantity(1);
    setAssignedTo('');
    setIsCreateOpen(true);
  };

  const handleCreateMO = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      addToast('Please select product to manufacture', 'warning');
      return;
    }

    try {
      await api.post('/manufacturing/', {
        product_id: parseInt(selectedProductId),
        quantity: parseInt(quantity),
        assigned_to: assignedTo ? parseInt(assignedTo) : null,
      });
      addToast('Manufacturing Order planned successfully', 'success');
      setIsCreateOpen(false);
      fetchMOs();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to plan manufacturing order';
      addToast(errorMsg, 'error');
    }
  };

  const handleViewDetails = async (mo) => {
    try {
      const response = await api.get(`/manufacturing/${mo.id}`);
      setSelectedMO(response.data);
      setIsDetailOpen(true);
    } catch (error) {
      addToast('Failed to load MO details', 'error');
    }
  };

  const handleStartMO = async (orderId) => {
    try {
      const response = await api.post(`/manufacturing/${orderId}/start`);
      setSelectedMO(response.data);
      addToast('Manufacturing started! Raw materials reserved.', 'success');
      fetchMOs();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to start production';
      addToast(errorMsg, 'error');
    }
  };

  const handleUpdateWorkOrder = async (woId, newStatus, woAssignedTo) => {
    try {
      await api.put(`/manufacturing/work-orders/${woId}`, {
        status: newStatus,
        assigned_to: woAssignedTo ? parseInt(woAssignedTo) : null,
      });
      addToast(`Work order step updated to ${newStatus.replace('_', ' ')}`, 'success');
      // Refresh detailed view
      const response = await api.get(`/manufacturing/${selectedMO.id}`);
      setSelectedMO(response.data);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to update work order';
      addToast(errorMsg, 'error');
    }
  };

  const handleCompleteMO = async (orderId) => {
    try {
      await api.post(`/manufacturing/${orderId}/complete`);
      addToast('Manufacturing Order completed! Finished items stocked.', 'success');
      setIsDetailOpen(false);
      fetchMOs();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to complete production';
      addToast(errorMsg, 'error');
    }
  };

  const columns = [
    { key: 'id', header: 'MO ID', render: (row) => `#${row.id}` },
    { key: 'product_name', header: 'Product' },
    { key: 'quantity', header: 'Target Quantity' },
    {
      key: 'created_at',
      header: 'Planned Date',
      render: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => handleViewDetails(row)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-350 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" />
          Execution view
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Manufacturing Board</h1>
          <p className="text-sm text-slate-400 font-medium">Plan assembly lines, dispatch production work orders, and log completions.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 px-4 text-sm font-bold text-white shadow-md hover:bg-violet-750 transition-all cursor-pointer shadow-violet-500/20"
        >
          <Plus className="h-4.5 w-4.5" />
          Plan Production Order
        </button>
      </div>

      <DataTable
        columns={columns}
        data={mOs}
        loading={loading}
        total={total}
        skip={skip}
        limit={limit}
        onPageChange={setSkip}
      />

      {/* Create MO Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Plan Manufacturing Order" size="md">
        <form onSubmit={handleCreateMO} className="space-y-4">
          {/* Finished Product */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Select Product to Produce
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="">-- Choose Product --</option>
              {products
                .filter((p) => p.procurement_type === 'manufacturing')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
            </select>
          </div>

          {/* Target Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Quantity to Manufacture
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Assigned Operator */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Production Lead
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="">-- Select Operator (Optional) --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.replace('_', ' ')})
                </option>
              ))}
            </select>
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
              Schedule Production
            </button>
          </div>
        </form>
      </Modal>

      {/* Execution view / Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`MO Execution details: #${selectedMO?.id}`} size="lg">
        <div className="space-y-6">
          {/* Status and details block */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 dark:bg-slate-800/20 p-4 border border-slate-100 dark:border-slate-800/50 text-xs">
            <div>
              Output Finished Product: <span className="font-bold text-slate-900 dark:text-white">{selectedMO?.product_name}</span>
            </div>
            <div>
              Target Quantity: <span className="font-bold">{selectedMO?.quantity} units</span>
            </div>
            <div>
              Status: &nbsp; <StatusBadge status={selectedMO?.status} />
            </div>
            <div>
              Plan Date: <span className="font-bold">{selectedMO && new Date(selectedMO.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Workflow step 1: Start MO */}
          {selectedMO?.status === 'planned' && (
            <div className="flex flex-col gap-2 rounded-xl bg-violet-50/50 dark:bg-violet-950/10 p-4 border border-violet-100/50 dark:border-violet-900/20 text-xs">
              <span className="font-bold text-violet-750 dark:text-violet-400">Order is Planned</span>
              <p className="text-slate-500 dark:text-slate-400">Ready to begin production? Clicking start will allocate raw material components from inventory.</p>
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleStartMO(selectedMO.id)}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 cursor-pointer"
                >
                  <Play className="h-4 w-4" />
                  Start Production
                </button>
              </div>
            </div>
          )}

          {/* Workflow step 2: Work Orders steps */}
          {selectedMO && selectedMO.work_orders?.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200">Execution Work Orders (Operations)</h4>
              <div className="space-y-3">
                {selectedMO.work_orders
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((wo) => {
                    const isMOActive = selectedMO.status === 'in_progress';
                    return (
                      <div key={wo.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm glass">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">Step {wo.sequence}</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{wo.operation_name}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {wo.duration_minutes} Mins
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {users.find((u) => u.id === wo.assigned_to)?.name || 'Unassigned'}
                            </span>
                            {wo.work_center && <span>Work Center: {wo.work_center}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <StatusBadge status={wo.status} />

                          {/* Operator dropdown assignment */}
                          {isMOActive && wo.status !== 'completed' && (
                            <select
                              value={wo.assigned_to || ''}
                              onChange={(e) => handleUpdateWorkOrder(wo.id, wo.status, e.target.value)}
                              className="rounded-lg border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                            >
                              <option value="">Assign Operator</option>
                              {users.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Trigger Buttons */}
                          {isMOActive && wo.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateWorkOrder(wo.id, 'in_progress', wo.assigned_to)}
                              className="flex items-center justify-center p-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
                              title="Start Operation"
                            >
                              <Play className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {isMOActive && wo.status === 'in_progress' && (
                            <button
                              onClick={() => handleUpdateWorkOrder(wo.id, 'completed', wo.assigned_to)}
                              className="flex items-center justify-center p-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 cursor-pointer"
                              title="Complete Operation"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Workflow step 3: Complete MO */}
          {selectedMO?.status === 'in_progress' &&
            selectedMO.work_orders.length > 0 &&
            selectedMO.work_orders.every((w) => w.status === 'completed') && (
              <div className="flex flex-col gap-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 p-4 border border-emerald-100/50 dark:border-emerald-900/20 text-xs">
                <span className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                  All Operations Completed
                </span>
                <p className="text-slate-500 dark:text-slate-400">All manufacturing steps are done. Post completion to deduct raw components and stock the final product.</p>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => handleCompleteMO(selectedMO.id)}
                    className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-750 cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <Check className="h-4 w-4" />
                    Complete Production
                  </button>
                </div>
              </div>
            )}

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsDetailOpen(false)}
              className="rounded-xl border border-slate-350 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-750 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Manufacturing;
