import React, { useState, useEffect } from 'react';
import { Plus, Eye, Trash2, PlusCircle, MinusCircle, Check, X } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

export const BillOfMaterials = () => {
  const { addToast } = useToast();
  const { isAdmin, isPurchase, isManufacturing, isInventory } = useAuth();
  const [boms, setBoms] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBom, setSelectedBom] = useState(null);
  const [bomToDelete, setBomToDelete] = useState(null);

  // Create form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [bomComponents, setBomComponents] = useState([{ component_product_id: '', quantity: 1 }]);
  const [bomOperations, setBomOperations] = useState([{ operation_name: '', duration_minutes: 10, work_center: 'Assembly Unit', sequence: 1 }]);

  const fetchBoms = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bom/', { params: { skip, limit } });
      setBoms(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      addToast('Failed to load Bill of Materials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBom = async (bomId) => {
    try {
      await api.post(`/bom/${bomId}/approve`);
      addToast('Bill of Materials approved successfully', 'success');
      fetchBoms();
    } catch (error) {
      addToast('Failed to approve BoM', 'error');
    }
  };

  const handleRejectBom = async (bomId) => {
    try {
      await api.post(`/bom/${bomId}/reject`);
      addToast('Bill of Materials rejected', 'success');
      fetchBoms();
    } catch (error) {
      addToast('Failed to reject BoM', 'error');
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

  useEffect(() => {
    fetchBoms();
  }, [skip]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setSelectedProductId('');
    setBomComponents([{ component_product_id: '', quantity: 1 }]);
    setBomOperations([{ operation_name: '', duration_minutes: 10, work_center: 'Assembly Unit', sequence: 1 }]);
    setIsCreateOpen(true);
  };

  const addComponentField = () => {
    setBomComponents([...bomComponents, { component_product_id: '', quantity: 1 }]);
  };

  const removeComponentField = (index) => {
    const newComps = [...bomComponents];
    newComps.splice(index, 1);
    setBomComponents(newComps);
  };

  const addOperationField = () => {
    const nextSeq = bomOperations.length + 1;
    setBomOperations([...bomOperations, { operation_name: '', duration_minutes: 10, work_center: 'Assembly Unit', sequence: nextSeq }]);
  };

  const removeOperationField = (index) => {
    const newOps = [...bomOperations];
    newOps.splice(index, 1);
    // Re-sequence
    newOps.forEach((op, idx) => {
      op.sequence = idx + 1;
    });
    setBomOperations(newOps);
  };

  const handleComponentChange = (index, field, value) => {
    const newComps = [...bomComponents];
    newComps[index][field] = value;
    setBomComponents(newComps);
  };

  const handleOperationChange = (index, field, value) => {
    const newOps = [...bomOperations];
    newOps[index][field] = value;
    setBomOperations(newOps);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId) {
      addToast('Please select the output product', 'warning');
      return;
    }

    const compsPayload = bomComponents
      .filter((c) => c.component_product_id && parseFloat(c.quantity) > 0)
      .map((c) => ({
        component_product_id: parseInt(c.component_product_id),
        quantity: parseFloat(c.quantity),
      }));

    const opsPayload = bomOperations
      .filter((o) => o.operation_name)
      .map((o) => ({
        operation_name: o.operation_name,
        duration_minutes: parseInt(o.duration_minutes) || 0,
        work_center: o.work_center || 'Assembly Unit',
        sequence: parseInt(o.sequence) || 1,
      }));

    if (compsPayload.length === 0) {
      addToast('Please add at least one component raw material', 'warning');
      return;
    }

    try {
      await api.post('/bom/', {
        product_id: parseInt(selectedProductId),
        components: compsPayload,
        operations: opsPayload,
      });
      addToast('Bill of Materials registered successfully', 'success');
      setIsCreateOpen(false);
      fetchBoms();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to create BoM';
      addToast(errorMsg, 'error');
    }
  };

  const handleViewDetails = async (bom) => {
    try {
      const response = await api.get(`/bom/${bom.id}`);
      setSelectedBom(response.data);
      setIsDetailOpen(true);
    } catch (error) {
      addToast('Failed to load BoM details', 'error');
    }
  };

  const handleDeleteClick = (bom) => {
    setBomToDelete(bom);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/bom/${bomToDelete.id}`);
      addToast('Bill of Materials deleted successfully', 'success');
      setIsDeleteOpen(false);
      fetchBoms();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to delete BoM';
      addToast(errorMsg, 'error');
    }
  };

  const columns = [
    { key: 'id', header: 'BoM ID', render: (row) => `#${row.id}` },
    { key: 'product_name', header: 'Finished Product' },
    {
      key: 'components_count',
      header: 'Components Count',
      render: (row) => `${row.components?.length || 0} items`,
    },
    {
      key: 'operations_count',
      header: 'Operations Steps',
      render: (row) => `${row.operations?.length || 0} steps`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status || 'pending'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewDetails(row)}
            className="p-2 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {(isAdmin || isPurchase) && (row.status === 'pending' || !row.status) && (
            <>
              <button
                onClick={() => handleApproveBom(row.id)}
                className="p-2 text-emerald-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
                title="Approve BoM"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleRejectBom(row.id)}
                className="p-2 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                title="Reject BoM"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={() => handleDeleteClick(row)}
            className="p-2 text-slate-500 hover:text-rose-655 dark:hover:text-rose-455 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Bill of Materials (BoM)</h1>
          <p className="text-sm text-slate-400 font-medium">Define product structures, specify raw materials, and layout industrial manufacturing workflows.</p>
        </div>
        {(isAdmin || isManufacturing || isInventory) && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 px-4 text-sm font-bold text-white shadow-md hover:bg-violet-750 transition-all cursor-pointer shadow-violet-500/20"
          >
            <Plus className="h-4.5 w-4.5" />
            Create BoM
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={boms}
        loading={loading}
        total={total}
        skip={skip}
        limit={limit}
        onPageChange={setSkip}
      />

      {/* Create BoM Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Bill of Materials" size="lg">
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          {/* Finished Product */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Output Finished Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
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
            <p className="mt-1 text-[10px] text-slate-400">Only showing products with Procurement Type set to "Manufacturing".</p>
          </div>

          {/* Components Sub-form */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-sm font-bold text-slate-850 dark:text-slate-200">Raw Material Components</span>
              <button
                type="button"
                onClick={addComponentField}
                className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-850 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                Add Component
              </button>
            </div>

            <div className="space-y-3">
              {bomComponents.map((item, index) => (
                <div key={index} className="flex items-end gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50">
                  {/* Component Product selection */}
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Component Product
                    </label>
                    <select
                      value={item.component_product_id}
                      onChange={(e) => handleComponentChange(index, 'component_product_id', e.target.value)}
                      required
                      className="block w-full rounded-lg border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">-- Select Product --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="w-32">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Quantity Required
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={item.quantity}
                      onChange={(e) => handleComponentChange(index, 'quantity', e.target.value)}
                      required
                      className="block w-full rounded-lg border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Remove component */}
                  <button
                    type="button"
                    onClick={() => removeComponentField(index)}
                    disabled={bomComponents.length === 1}
                    className="p-2 text-slate-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer mb-0.5"
                  >
                    <MinusCircle className="h-4.5 w-4.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Operations Sub-form */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-sm font-bold text-slate-850 dark:text-slate-200">Work Operations Flow</span>
              <button
                type="button"
                onClick={addOperationField}
                className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-850 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                Add Step
              </button>
            </div>

            <div className="space-y-3">
              {bomOperations.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50">
                  {/* Sequence */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Seq</label>
                    <input
                      type="number"
                      value={item.sequence}
                      readOnly
                      className="block w-full rounded-lg border border-slate-300 dark:border-slate-750 bg-slate-100 dark:bg-slate-850 px-3 py-2 text-xs text-slate-650"
                    />
                  </div>

                  {/* Operation Name */}
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Operation Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Cutting Wood, Polishing"
                      value={item.operation_name}
                      onChange={(e) => handleOperationChange(index, 'operation_name', e.target.value)}
                      required
                      className="block w-full rounded-lg border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Work Center */}
                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Work Center</label>
                    <input
                      type="text"
                      placeholder="e.g. Cutting Unit"
                      value={item.work_center}
                      onChange={(e) => handleOperationChange(index, 'work_center', e.target.value)}
                      className="block w-full rounded-lg border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Duration */}
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duration (Min)</label>
                    <input
                      type="number"
                      min="1"
                      value={item.duration_minutes}
                      onChange={(e) => handleOperationChange(index, 'duration_minutes', e.target.value)}
                      required
                      className="block w-full rounded-lg border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Remove operation */}
                  <div className="col-span-12 sm:col-span-1 flex justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => removeOperationField(index)}
                      disabled={bomOperations.length === 1}
                      className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                    >
                      <MinusCircle className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
              Save BoM
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Bill of Materials: ${selectedBom?.product_name}`} size="lg">
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Version: {selectedBom?.version}</span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              Status: <StatusBadge status={selectedBom?.status || 'pending'} />
            </span>
          </div>
          {/* Components Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200">Required Components (Raw Materials)</h4>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">Material Name</th>
                    <th className="p-3 text-right">Quantity Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/30">
                  {selectedBom?.components.map((comp) => (
                    <tr key={comp.id}>
                      <td className="p-3 font-semibold">{comp.component_sku}</td>
                      <td className="p-3">{comp.component_name}</td>
                      <td className="p-3 text-right font-bold text-violet-600 dark:text-violet-400">{comp.quantity} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operations Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200">Work Operations Flow</h4>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 text-center">Step</th>
                    <th className="p-3">Operation Description</th>
                    <th className="p-3">Work Center</th>
                    <th className="p-3 text-right">Standard Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/30">
                  {selectedBom?.operations.map((op) => (
                    <tr key={op.id}>
                      <td className="p-3 text-center font-bold text-slate-400">#{op.sequence}</td>
                      <td className="p-3 font-semibold">{op.operation_name}</td>
                      <td className="p-3">{op.work_center || '-'}</td>
                      <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">{op.duration_minutes} mins</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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

      {/* Delete BoM Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Bill of Materials"
        message={`Are you sure you want to delete the Bill of Materials for "${bomToDelete?.product_name}"? This will deactivate the manufacturing blueprint for this item.`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default BillOfMaterials;
