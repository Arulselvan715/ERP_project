import React, { useState, useEffect } from 'react';
import { Plus, Check, Truck, X, Eye, Trash2, PlusCircle, MinusCircle } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';

export const SalesOrders = () => {
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeliverOpen, setIsDeliverOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Create form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1, price: 0 }]);

  // Delivery form state
  const [deliveryQuantities, setDeliveryQuantities] = useState({}); // { item_id: qty }

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/sales/', {
        params: { skip, limit, status: statusFilter || undefined },
      });
      setOrders(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      addToast('Failed to load sales orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers/', { params: { limit: 100 } });
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error(error);
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
    fetchOrders();
  }, [skip, statusFilter]);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setSelectedCustomerId('');
    setOrderItems([{ product_id: '', quantity: 1, price: 0 }]);
    setIsCreateOpen(true);
  };

  const addOrderItemField = () => {
    setOrderItems([...orderItems, { product_id: '', quantity: 1, price: 0 }]);
  };

  const removeOrderItemField = (index) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  const handleItemProductChange = (index, productId) => {
    const newItems = [...orderItems];
    newItems[index].product_id = productId;
    
    // Auto-set the sales price of the selected product
    const productObj = products.find((p) => p.id === parseInt(productId));
    if (productObj) {
      newItems[index].price = productObj.sales_price;
    }
    setOrderItems(newItems);
  };

  const handleItemQuantityChange = (index, qty) => {
    const newItems = [...orderItems];
    newItems[index].quantity = parseInt(qty) || 0;
    setOrderItems(newItems);
  };

  const handleItemPriceChange = (index, price) => {
    const newItems = [...orderItems];
    newItems[index].price = parseFloat(price) || 0;
    setOrderItems(newItems);
  };

  const calculateTotalOrderAmount = () => {
    return orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      addToast('Please select a customer', 'warning');
      return;
    }

    const itemsPayload = orderItems
      .filter((i) => i.product_id && i.quantity > 0)
      .map((i) => ({
        product_id: parseInt(i.product_id),
        quantity: parseInt(i.quantity),
        price: parseFloat(i.price),
      }));

    if (itemsPayload.length === 0) {
      addToast('Please add at least one valid product item', 'warning');
      return;
    }

    try {
      await api.post('/sales/', {
        customer_id: parseInt(selectedCustomerId),
        items: itemsPayload,
      });
      addToast('Sales Order created successfully', 'success');
      setIsCreateOpen(false);
      fetchOrders();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to create sales order';
      addToast(errorMsg, 'error');
    }
  };

  const handleViewDetails = async (order) => {
    try {
      const response = await api.get(`/sales/${order.id}`);
      setSelectedOrder(response.data);
      setIsDetailOpen(true);
    } catch (error) {
      addToast('Failed to load order details', 'error');
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await api.post(`/sales/${orderId}/confirm`);
      addToast('Sales Order confirmed! Inventory reserved.', 'success');
      setIsDetailOpen(false);
      fetchOrders();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to confirm order';
      addToast(errorMsg, 'error');
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await api.post(`/sales/${orderId}/cancel`);
      addToast('Sales Order cancelled', 'success');
      setIsDetailOpen(false);
      fetchOrders();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to cancel order';
      addToast(errorMsg, 'error');
    }
  };

  const openDeliverModal = () => {
    const initialQtys = {};
    selectedOrder.items.forEach((item) => {
      // Default to remaining undelivered qty
      initialQtys[item.id] = item.quantity - item.delivered_qty;
    });
    setDeliveryQuantities(initialQtys);
    setIsDeliverOpen(true);
  };

  const handleDeliveryQtyChange = (itemId, qty) => {
    setDeliveryQuantities({
      ...deliveryQuantities,
      [itemId]: parseInt(qty) || 0,
    });
  };

  const handleDeliverSubmit = async (e) => {
    e.preventDefault();
    const deliveriesPayload = Object.entries(deliveryQuantities)
      .map(([itemId, qty]) => ({
        item_id: parseInt(itemId),
        quantity: parseInt(qty),
      }))
      .filter((d) => d.quantity > 0);

    if (deliveriesPayload.length === 0) {
      addToast('Please input delivery quantities greater than zero', 'warning');
      return;
    }

    try {
      await api.post(`/sales/${selectedOrder.id}/deliver`, deliveriesPayload);
      addToast('Delivery posted successfully', 'success');
      setIsDeliverOpen(false);
      setIsDetailOpen(false);
      fetchOrders();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to post delivery';
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
    { key: 'id', header: 'Order ID', render: (row) => `#${row.id}` },
    { key: 'customer_name', header: 'Customer' },
    {
      key: 'order_date',
      header: 'Order Date',
      render: (row) => new Date(row.order_date).toLocaleDateString(),
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      render: (row) => formatCurrency(row.total_amount),
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
          View Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Sales Management</h1>
          <p className="text-sm text-slate-400 font-medium">Record client demand, confirm bookings, and manage dispatches.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 px-4 text-sm font-bold text-white shadow-md hover:bg-violet-750 transition-all cursor-pointer shadow-violet-500/20"
        >
          <Plus className="h-4.5 w-4.5" />
          New Sales Order
        </button>
      </div>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        total={total}
        skip={skip}
        limit={limit}
        onPageChange={setSkip}
      />

      {/* Create Sales Order Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Sales Order" size="lg">
        <form onSubmit={handleCreateOrder} className="space-y-6">
          {/* Customer selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Select Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
              className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email || c.phone || 'No contact'})
                </option>
              ))}
            </select>
          </div>

          {/* Items Sub-form */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-sm font-bold text-slate-850 dark:text-slate-200">Order Items</span>
              <button
                type="button"
                onClick={addOrderItemField}
                className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-850 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                Add Product
              </button>
            </div>

            <div className="space-y-3.5">
              {orderItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50">
                  {/* Product */}
                  <div className="col-span-12 sm:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Product
                    </label>
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemProductChange(index, e.target.value)}
                      required
                      className="block w-full rounded-lg border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    >
                      <option value="">-- Select --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku}) - Price: ₹{p.sales_price}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemQuantityChange(index, e.target.value)}
                      required
                      className="block w-full rounded-lg border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>

                  {/* Price */}
                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleItemPriceChange(index, e.target.value)}
                      required
                      className="block w-full rounded-lg border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </div>

                  {/* Remove action */}
                  <div className="col-span-12 sm:col-span-1 flex justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => removeOrderItemField(index)}
                      disabled={orderItems.length === 1}
                      className="p-1.5 text-slate-400 hover:text-rose-500 disabled:opacity-30 cursor-pointer"
                    >
                      <MinusCircle className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Order Cost preview */}
            <div className="flex justify-end p-2 text-sm font-bold text-slate-850 dark:text-slate-200">
              Total Order Amount: &nbsp; <span className="text-violet-600 dark:text-violet-400">{formatCurrency(calculateTotalOrderAmount())}</span>
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
              Save Order Draft
            </button>
          </div>
        </form>
      </Modal>

      {/* Order Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Sales Order Detail: #${selectedOrder?.id}`} size="lg">
        <div className="space-y-6">
          {/* Top details block */}
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 dark:bg-slate-800/20 p-4 border border-slate-100 dark:border-slate-800/50 text-xs">
            <div>
              Customer: <span className="font-bold text-slate-900 dark:text-white">{selectedOrder?.customer_name}</span>
            </div>
            <div>
              Status: &nbsp; <StatusBadge status={selectedOrder?.status} />
            </div>
            <div>
              Order Date: <span className="font-bold">{selectedOrder && new Date(selectedOrder.order_date).toLocaleDateString()}</span>
            </div>
            <div>
              Total Cost: <span className="font-bold text-violet-600 dark:text-violet-400">{selectedOrder && formatCurrency(selectedOrder.total_amount)}</span>
            </div>
          </div>

          {/* Items list table */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200">Line Items</h4>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-center">Qty Ordered</th>
                    <th className="p-3 text-center">Qty Delivered</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/30">
                  {selectedOrder?.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-semibold text-slate-905 dark:text-slate-105">{item.product_name}</td>
                      <td className="p-3 text-center font-semibold">{item.quantity}</td>
                      <td className="p-3 text-center">
                        <span className={`font-semibold ${item.delivered_qty === item.quantity ? 'text-emerald-500' : 'text-slate-500'}`}>
                          {item.delivered_qty}
                        </span>
                      </td>
                      <td className="p-3 text-right">{formatCurrency(item.price)}</td>
                      <td className="p-3 text-right font-bold">{formatCurrency(item.quantity * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workflow Buttons based on status */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {selectedOrder?.status === 'draft' && (
              <>
                <button
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-rose-600 rounded-xl border border-rose-200 hover:bg-rose-50 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  Cancel Order
                </button>
                <button
                  onClick={() => handleConfirmOrder(selectedOrder.id)}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  Confirm Order
                </button>
              </>
            )}

            {(selectedOrder?.status === 'confirmed' || selectedOrder?.status === 'partially_delivered') && (
              <>
                <button
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-rose-600 rounded-xl border border-rose-200 hover:bg-rose-50 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  Cancel Order
                </button>
                <button
                  onClick={openDeliverModal}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-750 cursor-pointer"
                >
                  <Truck className="h-4 w-4" />
                  Deliver Goods
                </button>
              </>
            )}

            <button
              onClick={() => setIsDetailOpen(false)}
              className="rounded-xl border border-slate-350 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Deliver Items Modal */}
      <Modal isOpen={isDeliverOpen} onClose={() => setIsDeliverOpen(false)} title="Deliver Order Items" size="md">
        <form onSubmit={handleDeliverSubmit} className="space-y-4">
          <p className="text-xs text-slate-450 dark:text-slate-400">Input dispatch quantity for each line item in Sales Order #{selectedOrder?.id}</p>

          <div className="space-y-3.5 max-h-80 overflow-y-auto">
            {selectedOrder?.items.map((item) => {
              const remaining = item.quantity - item.delivered_qty;
              if (remaining <= 0) return null; // Already fully delivered

              return (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{item.product_name}</span>
                    <span className="text-[10px] text-slate-400">Remaining to deliver: {remaining}</span>
                  </div>

                  <input
                    type="number"
                    min="0"
                    max={remaining}
                    value={deliveryQuantities[item.id] || 0}
                    onChange={(e) => handleDeliveryQtyChange(item.id, e.target.value)}
                    required
                    className="block w-24 rounded-lg border border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsDeliverOpen(false)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-750 transition-colors cursor-pointer"
            >
              Post Delivery
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SalesOrders;
