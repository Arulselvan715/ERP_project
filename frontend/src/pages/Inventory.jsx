import React, { useState, useEffect } from 'react';
import { Layers, List, Edit, AlertCircle, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';

export const Inventory = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [totalMovements, setTotalMovements] = useState(0);
  const [movementSkip, setMovementSkip] = useState(0);
  const [movementLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  // Adjustment Modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Fetch Inventory Overview
  const fetchOverview = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory/', {
        params: { search: search || undefined, low_stock_only: lowStockOnly },
      });
      setInventory(response.data || []);
    } catch (error) {
      addToast('Failed to load inventory overview', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Stock Movements
  const fetchMovements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory/movements', {
        params: { skip: movementSkip, limit: movementLimit },
      });
      setMovements(response.data.data || []);
      setTotalMovements(response.data.total || 0);
    } catch (error) {
      addToast('Failed to load stock movements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverview();
    } else {
      fetchMovements();
    }
  }, [activeTab, search, lowStockOnly, movementSkip]);

  const openAdjustModal = (product) => {
    setSelectedProduct(product);
    reset({
      quantity: 0,
      reason: 'Cycle Count Adjustment',
    });
    setIsAdjustOpen(true);
  };

  const onSubmitAdjustment = async (data) => {
    try {
      await api.post('/inventory/adjust', {
        product_id: selectedProduct.id,
        quantity: parseInt(data.quantity),
        reason: data.reason,
      });
      addToast(`Adjusted stock for ${selectedProduct.name} successfully`, 'success');
      setIsAdjustOpen(false);
      fetchOverview();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to adjust stock';
      addToast(errorMsg, 'error');
    }
  };

  const overviewColumns = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'Product Name' },
    {
      key: 'on_hand_qty',
      header: 'On Hand',
      render: (row) => <span className="font-bold text-slate-800 dark:text-slate-100">{row.on_hand_qty}</span>,
    },
    { key: 'reserved_qty', header: 'Reserved Qty' },
    {
      key: 'free_qty',
      header: 'Free Qty (Available)',
      render: (row) => {
        const threshold = row.low_stock_threshold || 10;
        const isLow = row.free_qty <= threshold;
        return (
          <span className={`font-bold ${isLow ? 'text-rose-500 flex items-center gap-1.5' : 'text-emerald-500'}`}>
            {isLow && <AlertCircle className="h-4 w-4 shrink-0" />}
            {row.free_qty}
            {isLow && <span className="text-[10px] uppercase font-semibold">Low</span>}
          </span>
        );
      },
    },
    {
      key: 'procurement_type',
      header: 'Type',
      render: (row) => <span className="uppercase text-[11px] font-semibold text-slate-400">{row.procurement_type}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => openAdjustModal(row)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-350 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
        >
          <Edit className="h-3.5 w-3.5" />
          Adjust Stock
        </button>
      ),
    },
  ];

  const movementColumns = [
    {
      key: 'timestamp',
      header: 'Date & Time',
      render: (row) => (
        <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
          {new Date(row.timestamp).toLocaleString()}
        </span>
      ),
    },
    { key: 'product_name', header: 'Product Name' },
    {
      key: 'movement_type',
      header: 'Movement Type',
      render: (row) => <StatusBadge status={row.movement_type} />,
    },
    {
      key: 'quantity',
      header: 'Quantity Delta',
      render: (row) => (
        <span className={`font-bold ${row.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
          {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
        </span>
      ),
    },
    { key: 'reference_type', header: 'Source Doc' },
    {
      key: 'reference_id',
      header: 'Doc ID',
      render: (row) => (row.reference_id ? `#${row.reference_id}` : '-'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory Control</h1>
          <p className="text-sm text-slate-400 font-medium">Verify live stock counts, check reservations, and audit stock ledger entries.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1 border border-slate-200/50 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-850 dark:text-slate-405'
            }`}
          >
            <Layers className="h-4 w-4" />
            Stock Overview
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'movements'
                ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-850 dark:text-slate-405'
            }`}
          >
            <List className="h-4 w-4" />
            Stock Ledger
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Low stock check */}
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-650 dark:text-slate-350 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-violet-600 focus:ring-violet-500"
              />
              Show Low Stock Only
            </label>
          </div>

          <DataTable
            columns={overviewColumns}
            data={inventory}
            loading={loading}
            searchQuery={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search inventory by SKU or product name..."
          />
        </div>
      ) : (
        <DataTable
          columns={movementColumns}
          data={movements}
          loading={loading}
          total={totalMovements}
          skip={movementSkip}
          limit={movementLimit}
          onPageChange={setMovementSkip}
        />
      )}

      {/* Stock Adjustment Modal */}
      <Modal isOpen={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} title={`Stock Adjustment: ${selectedProduct?.name}`} size="md">
        <form onSubmit={handleSubmit(onSubmitAdjustment)} className="space-y-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/30 p-4 border border-slate-100 dark:border-slate-800/50 text-xs space-y-1.5">
            <div>
              SKU: <span className="font-bold">{selectedProduct?.sku}</span>
            </div>
            <div>
              Current On Hand Stock: <span className="font-bold">{selectedProduct?.on_hand_qty} units</span>
            </div>
          </div>

          {/* Quantity delta */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Adjustment Quantity Delta
            </label>
            <input
              type="number"
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="e.g. +10 (restock) or -5 (damaged/shrinkage)"
              {...register('quantity', {
                required: 'Delta quantity is required',
                validate: (v) => parseInt(v) !== 0 || 'Quantity cannot be zero',
              })}
            />
            <p className="mt-1 text-[10px] text-slate-400">Use a positive number to add stock, and a negative number to reduce it.</p>
            {errors.quantity && <p className="mt-1 text-xs text-rose-500">{errors.quantity.message}</p>}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Reason / Reference
            </label>
            <input
              type="text"
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="e.g. Cycle count discrepancy, Damaged wood scrapped"
              {...register('reason', { required: 'Adjustment reason is required' })}
            />
            {errors.reason && <p className="mt-1 text-xs text-rose-500">{errors.reason.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAdjustOpen(false)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-750 transition-colors cursor-pointer"
            >
              Adjust Count
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
