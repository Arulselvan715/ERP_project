import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';

export const Products = () => {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const watchedType = watch('procurement_type', 'purchase');

  // Load products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products/', {
        params: { skip, limit, search: search || undefined },
      });
      setProducts(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      addToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load vendors for dropdown
  const fetchVendors = async () => {
    try {
      const response = await api.get('/vendors/', { params: { limit: 100 } });
      setVendors(response.data.data || []);
    } catch (error) {
      console.error('Failed to load vendors', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [skip, search]);

  useEffect(() => {
    fetchVendors();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    reset({
      sku: '',
      name: '',
      description: '',
      category: '',
      sales_price: 0,
      cost_price: 0,
      procurement_strategy: 'make_to_stock',
      procurement_type: 'purchase',
      vendor_id: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    reset({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      sales_price: product.sales_price,
      cost_price: product.cost_price,
      procurement_strategy: product.procurement_strategy,
      procurement_type: product.procurement_type,
      vendor_id: product.vendor_id || '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      sales_price: parseFloat(data.sales_price),
      cost_price: parseFloat(data.cost_price),
      vendor_id: data.vendor_id ? parseInt(data.vendor_id) : null,
    };

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        addToast('Product updated successfully', 'success');
      } else {
        await api.post('/products/', payload);
        addToast('Product created successfully', 'success');
      }
      setIsFormOpen(false);
      fetchProducts();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to save product';
      addToast(errorMsg, 'error');
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/products/${productToDelete.id}`);
      addToast('Product deleted successfully', 'success');
      setIsDeleteOpen(false);
      fetchProducts();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to delete product';
      addToast(errorMsg, 'error');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val);
  };

  const columns = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category' },
    {
      key: 'sales_price',
      header: 'Sales Price',
      render: (row) => formatCurrency(row.sales_price),
    },
    {
      key: 'cost_price',
      header: 'Cost Price',
      render: (row) => formatCurrency(row.cost_price),
    },
    {
      key: 'stock',
      header: 'Stock Status',
      render: (row) => (
        <div className="flex flex-col gap-0.5 text-xs">
          <div>
            On Hand: <span className="font-bold">{row.on_hand_qty}</span>
          </div>
          <div className="text-slate-400">
            Reserved: <span className="font-semibold">{row.reserved_qty}</span>
          </div>
          <div>
            Free:{' '}
            <span
              className={`font-bold ${row.free_qty <= 10 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-350'}`}
            >
              {row.free_qty}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'procurement',
      header: 'Procurement',
      render: (row) => (
        <div className="flex flex-col gap-0.5 text-[11px] font-semibold tracking-wide uppercase">
          <span className="text-violet-500">{row.procurement_strategy.replace(/_/g, ' ')}</span>
          <span className="text-slate-400">{row.procurement_type}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="p-2 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(row)}
            className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-450 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Product Catalog</h1>
          <p className="text-sm text-slate-400 font-medium">Manage product SKUs, prices, stock requirements and policies.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 px-4 text-sm font-bold text-white shadow-md hover:bg-violet-750 transition-all cursor-pointer shadow-violet-500/20"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Product
        </button>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        total={total}
        skip={skip}
        limit={limit}
        onPageChange={setSkip}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products by SKU or Name..."
      />

      {/* Create/Edit Product Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingProduct ? 'Edit Product' : 'Add New Product'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                SKU (Stock Keeping Unit)
              </label>
              <input
                type="text"
                disabled={!!editingProduct}
                className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
                placeholder="FUR-CHAIR-001"
                {...register('sku', { required: 'SKU is required' })}
              />
              {errors.sku && <p className="mt-1 text-xs text-rose-500">{errors.sku.message}</p>}
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Product Name
              </label>
              <input
                type="text"
                className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Wooden Dining Chair"
                {...register('name', { required: 'Product Name is required' })}
              />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Category
              </label>
              <input
                type="text"
                className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Chairs, Tables, Beds, etc."
                {...register('category')}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Description
              </label>
              <input
                type="text"
                className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Premium Teak Wood with Cushioning"
                {...register('description')}
              />
            </div>

            {/* Sales Price */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Sales Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="0.00"
                {...register('sales_price', { required: 'Sales price is required', min: 0 })}
              />
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Cost Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="0.00"
                {...register('cost_price', { required: 'Cost price is required', min: 0 })}
              />
            </div>

            {/* Procurement Strategy */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Procurement Strategy
              </label>
              <select
                className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                {...register('procurement_strategy')}
              >
                <option value="make_to_stock">Make to Stock (MTS)</option>
                <option value="make_to_order">Make to Order (MTO)</option>
              </select>
            </div>

            {/* Procurement Type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Procurement Type
              </label>
              <select
                className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                {...register('procurement_type')}
              >
                <option value="purchase">Purchase</option>
                <option value="manufacturing">Manufacturing</option>
              </select>
            </div>

            {/* Vendor (only if type is purchase) */}
            {watchedType === 'purchase' && (
              <div className="md:col-span-2 animate-fade-in">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Preferred Vendor
                </label>
                <select
                  className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  {...register('vendor_id')}
                >
                  <option value="">-- Select Vendor --</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-750 transition-colors cursor-pointer"
            >
              {editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Product Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Product"
        message={`Are you sure you want to delete product "${productToDelete?.name}" (${productToDelete?.sku})? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Products;
