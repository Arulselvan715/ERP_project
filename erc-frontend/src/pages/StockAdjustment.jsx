import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, Sliders, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

export const StockAdjustment = () => {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      product_id: '',
      quantity: 0,
      reason: 'Manual stock audit adjustment',
    }
  });

  const selectedProductId = watch('product_id');
  const qtyChange = parseFloat(watch('quantity') || 0);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/', { params: { limit: 100 } });
      setProducts(response.data.data || []);
    } catch (error) {
      addToast('Failed to load products list', 'error');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onSubmit = async (data) => {
    if (data.quantity === 0) {
      addToast('Quantity change cannot be zero', 'warning');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/inventory/adjust', {
        product_id: parseInt(data.product_id),
        quantity: parseFloat(data.quantity),
        reason: data.reason
      });
      addToast(response.data.message || 'Stock adjusted successfully', 'success');
      reset({
        product_id: '',
        quantity: 0,
        reason: 'Manual stock audit adjustment'
      });
      fetchProducts();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to apply stock adjustment';
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === parseInt(selectedProductId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Stock Adjustment</h1>
        <p className="text-sm text-slate-400 font-medium">Manually increase or decrease product stock levels for cycle counts or damaged goods.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Adjustment Form */}
        <div className="lg:col-span-2">
          <div className="glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-650 dark:text-violet-400">
                <Sliders className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-850 dark:text-white">Create Stock Adjustment</h3>
                <p className="text-[11px] text-slate-400">Modify quantity on hand for a specific item.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Select Product / Material
                </label>
                <select
                  {...register('product_id', { required: 'Please select a product' })}
                  className="block w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-909 dark:text-white focus:border-violet-500 focus:outline-none"
                >
                  <option value="">-- Choose Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - Current Stock: {p.on_hand_qty}
                    </option>
                  ))}
                </select>
                {errors.product_id && <p className="mt-1 text-xs text-rose-500">{errors.product_id.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Quantity Adjustment Delta
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('quantity', {
                      required: 'Adjustment quantity is required',
                      validate: (v) => parseFloat(v) !== 0 || 'Quantity cannot be zero'
                    })}
                    className="block w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-909 dark:text-white focus:border-violet-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Use positive values to add stock (e.g. <code>10</code>) and negative values to remove stock (e.g. <code>-5</code>).
                  </span>
                  {errors.quantity && <p className="mt-1 text-xs text-rose-500">{errors.quantity.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Reason for Adjustment
                  </label>
                  <input
                    type="text"
                    {...register('reason', { required: 'Please provide a reason' })}
                    className="block w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-909 dark:text-white focus:border-violet-500 focus:outline-none"
                  />
                  {errors.reason && <p className="mt-1 text-xs text-rose-500">{errors.reason.message}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-violet-650 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-750 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Processing...' : 'Apply Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Current State Summary Card */}
        <div>
          <div className="glass rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-6 shadow-sm h-full">
            <h3 className="text-sm font-bold text-slate-850 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              Adjustment Preview
            </h3>

            {selectedProduct ? (
              <div className="space-y-5 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Item SKU</div>
                  <div className="font-bold text-sm text-slate-850 dark:text-slate-200">{selectedProduct.sku}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Item Name</div>
                  <div className="font-semibold text-slate-850 dark:text-slate-350">{selectedProduct.name}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-850">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Current Stock</div>
                    <div className="font-bold text-lg text-slate-700 dark:text-slate-300">
                      {selectedProduct.on_hand_qty} units
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">New Stock</div>
                    <div className={`font-bold text-lg ${selectedProduct.on_hand_qty + qtyChange < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {selectedProduct.on_hand_qty + qtyChange} units
                    </div>
                  </div>
                </div>

                {selectedProduct.on_hand_qty + qtyChange < 0 && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="text-[10px] font-semibold leading-relaxed">
                      Warning: Adjustment will cause negative stock. The backend will prevent this operation.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <AlertCircle className="h-8 w-8 mb-2 opacity-30" />
                <span className="text-xs text-center font-medium">Select a product to view the preview metrics.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustment;
