import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../hooks/useToast';

export const StockLedger = () => {
  const { addToast } = useToast();
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(false);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory/ledger', {
        params: { page: Math.floor(skip / limit) + 1, per_page: limit },
      });
      setLedgerEntries(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      addToast('Failed to load stock ledger logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [skip]);

  const columns = [
    {
      key: 'timestamp',
      header: 'Date & Time',
      render: (row) => (
        <span className="text-slate-500 dark:text-slate-405 text-xs font-semibold">
          {row.timestamp ? new Date(row.timestamp).toLocaleString() : '-'}
        </span>
      ),
    },
    { key: 'product_sku', header: 'SKU', render: (row) => <span className="font-semibold">{row.product_sku || '-'}</span> },
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
        <span className={`font-bold ${row.quantity > 0 ? 'text-emerald-555' : 'text-rose-500'}`}>
          {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
        </span>
      ),
    },
    { key: 'reference_type', header: 'Source Doc', render: (row) => <span className="capitalize">{row.reference_type || '-'}</span> },
    {
      key: 'reference_id',
      header: 'Doc ID',
      render: (row) => (row.reference_id ? `#${row.reference_id}` : '-'),
    },
    { key: 'description', header: 'Audit Detail', render: (row) => <span className="text-slate-400 text-xs truncate max-w-xs block">{row.description || '-'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Stock Ledger</h1>
        <p className="text-sm text-slate-400 font-medium">Verify the complete chronological audit trail of all warehouse stock movements.</p>
      </div>

      <DataTable
        columns={columns}
        data={ledgerEntries}
        loading={loading}
        total={total}
        skip={skip}
        limit={limit}
        onPageChange={setSkip}
      />
    </div>
  );
};

export default StockLedger;
