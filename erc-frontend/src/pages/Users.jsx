import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

export const Users = () => {
  const { addToast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      addToast('Failed to load users list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    reset({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'Sales User',
      is_active: true,
    });
    setIsFormOpen(true);
  };

  const openEditModal = (userData) => {
    setEditingUser(userData);
    reset({
      username: userData.username,
      email: userData.email,
      password: '', // Leave blank to keep existing password
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      role: userData.role,
      is_active: userData.is_active,
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingUser) {
        // Update user
        const payload = {
          username: data.username,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role,
          is_active: data.is_active,
        };
        if (data.password) {
          payload.password = data.password;
        }
        await api.put(`/users/${editingUser.id}`, payload);
        addToast(`User '${data.username}' updated successfully`, 'success');
      } else {
        // Create user
        await api.post('/users', data);
        addToast(`User '${data.username}' created successfully`, 'success');
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to save user';
      addToast(errorMsg, 'error');
    }
  };

  const handleDeleteClick = (userData) => {
    if (userData.id === currentUser?.id) {
      addToast('You cannot delete your own account', 'warning');
      return;
    }
    setUserToDelete(userData);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/users/${userToDelete.id}`);
      addToast(`User '${userToDelete.username}' deleted successfully`, 'success');
      setIsDeleteOpen(false);
      fetchUsers();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete user';
      addToast(errorMsg, 'error');
    }
  };

  const columns = [
    { key: 'username', header: 'Username', render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.username}</span> },
    { key: 'email', header: 'Email Address' },
    { key: 'first_name', header: 'First Name' },
    { key: 'last_name', header: 'Last Name' },
    {
      key: 'role',
      header: 'System Role',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-605 dark:bg-violet-950/30 dark:text-violet-400">
          {row.role}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
            row.is_active
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450'
          }`}
        >
          {row.is_active ? 'Active' : 'Suspended'}
        </span>
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
            title="Edit details"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(row)}
            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Delete user"
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">User Management</h1>
          <p className="text-sm text-slate-400 font-medium">Create ERP accounts, configure roles, and manage system access permissions.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 px-4 text-sm font-bold text-white shadow-md hover:bg-violet-750 transition-all cursor-pointer shadow-violet-500/20"
        >
          <Plus className="h-4.5 w-4.5" />
          Create User
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        total={total}
      />

      {/* User Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.username}` : 'Register New User'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                {...register('username', { required: 'Username is required' })}
                className="block w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-905 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {errors.username && <p className="mt-1 text-xs text-rose-500">{errors.username.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className="block w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-905 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                First Name
              </label>
              <input
                type="text"
                {...register('first_name')}
                className="block w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-905 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Last Name
              </label>
              <input
                type="text"
                {...register('last_name')}
                className="block w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-905 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Password {editingUser && <span className="text-[10px] text-slate-400 font-medium">(Leave blank to keep current)</span>}
            </label>
            <input
              type="password"
              {...register('password', { required: editingUser ? false : 'Password is required' })}
              className="block w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-905 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                User Role
              </label>
              <select
                {...register('role')}
                className="block w-full rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-905 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="Admin">Admin</option>
                <option value="Sales User">Sales User</option>
                <option value="Purchase User">Purchase User</option>
                <option value="Manufacturing User">Manufacturing User</option>
                <option value="Inventory Manager">Inventory Manager</option>
                <option value="Business Owner">Business Owner</option>
              </select>
            </div>
            <div className="flex items-center pt-8 pl-4">
              <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-650 dark:text-slate-350 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="h-4.5 w-4.5 rounded border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 text-violet-600 focus:ring-violet-500"
                />
                Account Active
              </label>
            </div>
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
              Save User
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirm Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete User Account"
        message={`Are you sure you want to delete user "${userToDelete?.username}"? This action cannot be undone and will permanently remove their access to Shiv Furniture ERP.`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
        confirmText="Delete Account"
        type="danger"
      />
    </div>
  );
};

export default Users;
