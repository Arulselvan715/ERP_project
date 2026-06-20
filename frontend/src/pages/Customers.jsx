import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';

export const Customers = () => {
  const { addToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Load customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/customers/', {
        params: { skip, limit, search: search || undefined },
      });
      setCustomers(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      addToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [skip, search]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    reset({
      name: '',
      phone: '',
      email: '',
      address: '',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, data);
        addToast('Customer updated successfully', 'success');
      } else {
        await api.post('/customers/', data);
        addToast('Customer registered successfully', 'success');
      }
      setIsFormOpen(false);
      fetchCustomers();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to save customer';
      addToast(errorMsg, 'error');
    }
  };

  const handleDeleteClick = (customer) => {
    setCustomerToDelete(customer);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/customers/${customerToDelete.id}`);
      addToast('Customer deleted successfully', 'success');
      setIsDeleteOpen(false);
      fetchCustomers();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to delete customer';
      addToast(errorMsg, 'error');
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'address', header: 'Address' },
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Customer Directory</h1>
          <p className="text-sm text-slate-400 font-medium">Manage buyer profiles, contact information, and billing/delivery addresses.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 px-4 text-sm font-bold text-white shadow-md hover:bg-violet-750 transition-all cursor-pointer shadow-violet-500/20"
        >
          <Plus className="h-4.5 w-4.5" />
          Register Customer
        </button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        total={total}
        skip={skip}
        limit={limit}
        onPageChange={setSkip}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customers by name, phone or email..."
      />

      {/* Create/Edit Customer Modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingCustomer ? 'Edit Customer Info' : 'Register New Customer'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Customer Name
            </label>
            <input
              type="text"
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Ram Kumar"
              {...register('name', { required: 'Customer name is required' })}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="ram.kumar@gmail.com"
              {...register('email')}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <input
              type="text"
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="+91 98765 43210"
              {...register('phone')}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Delivery Address
            </label>
            <textarea
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[80px]"
              placeholder="123, Sector 5, Panchkula, Haryana"
              {...register('address')}
            />
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
              {editingCustomer ? 'Update Info' : 'Register Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Customer Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Customer"
        message={`Are you sure you want to delete customer "${customerToDelete?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Customers;
