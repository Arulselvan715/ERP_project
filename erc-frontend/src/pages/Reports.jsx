import React, { useState, useEffect } from 'react';
import { BarChart3, Download, DollarSign, TrendingUp, ShoppingBag, Layers, ShieldAlert, FileSpreadsheet } from 'lucide-react';
import api from '../services/api';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import { useToast } from '../hooks/useToast';

export const Reports = ({ defaultTab }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState(defaultTab || 'revenue');

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);
  const [reportData, setReportData] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRevenueReport = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/revenue');
      setRevenueData(response.data);
    } catch (error) {
      addToast('Failed to load revenue report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTabReport = async (tabName) => {
    setLoading(true);
    try {
      const response = await api.get(`/reports/${tabName}`);
      setReportData(response.data || []);
    } catch (error) {
      addToast(`Failed to load ${tabName} report`, 'error');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'revenue') {
      fetchRevenueReport();
    } else {
      fetchTabReport(activeTab);
    }
  }, [activeTab]);

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header];
        // Handle values containing commas
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val !== null && val !== undefined ? val : '';
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  const downloadCSV = () => {
    if (activeTab === 'revenue') return;
    const csvContent = convertToCSV(reportData);
    if (!csvContent) {
      addToast('No data to export', 'warning');
      return;
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shiv_furniture_${activeTab}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Report exported successfully', 'success');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val || 0);
  };

  // Dynamic Column setup based on report type
  const getColumns = () => {
    if (activeTab === 'sales') {
      return [
        { key: 'id', header: 'Order ID', render: (row) => `#${row.id}` },
        { key: 'customer', header: 'Customer Name' },
        { key: 'date', header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
        { key: 'total', header: 'Total Value', render: (row) => formatCurrency(row.total) },
        { key: 'status', header: 'Status' },
      ];
    }
    if (activeTab === 'purchase') {
      return [
        { key: 'id', header: 'PO ID', render: (row) => `#${row.id}` },
        { key: 'vendor', header: 'Vendor Name' },
        { key: 'date', header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
        { key: 'total', header: 'Total Value', render: (row) => formatCurrency(row.total) },
        { key: 'status', header: 'Status' },
      ];
    }
    if (activeTab === 'inventory') {
      return [
        { key: 'sku', header: 'SKU' },
        { key: 'name', header: 'Material/Product Name' },
        { key: 'category', header: 'Category' },
        { key: 'on_hand', header: 'On Hand' },
        { key: 'reserved', header: 'Reserved' },
        { key: 'free', header: 'Free Stock' },
        { key: 'value', header: 'Valuation (Cost)', render: (row) => formatCurrency(row.value) },
      ];
    }
    if (activeTab === 'manufacturing') {
      return [
        { key: 'id', header: 'MO ID', render: (row) => `#${row.id}` },
        { key: 'product', header: 'Manufactured Product' },
        { key: 'quantity', header: 'Target Qty' },
        { key: 'date', header: 'Created Date', render: (row) => row.date ? new Date(row.date).toLocaleDateString() : '-' },
        { key: 'status', header: 'Status' },
      ];
    }
    if (activeTab === 'low-stock') {
      return [
        { key: 'sku', header: 'SKU' },
        { key: 'name', header: 'Product Name' },
        { key: 'on_hand', header: 'On Hand' },
        { key: 'reserved', header: 'Reserved' },
        { key: 'free', header: 'Available' },
      ];
    }
    return [];
  };

  const tabs = [
    { key: 'revenue', label: 'Financial Summary', icon: DollarSign },
    { key: 'sales', label: 'Sales Activity', icon: ShoppingBag },
    { key: 'purchase', label: 'Procurement Logs', icon: FileSpreadsheet },
    { key: 'inventory', label: 'Inventory Valuation', icon: Layers },
    { key: 'manufacturing', label: 'Production Activity', icon: BarChart3 },
    { key: 'low-stock', label: 'Low Stock Deficits', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Business Reports</h1>
          <p className="text-sm text-slate-400 font-medium">Analyze revenue statements, inventory values, and operational metrics.</p>
        </div>

        {activeTab !== 'revenue' && (
          <button
            onClick={downloadCSV}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-350 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
          >
            <Download className="h-4.5 w-4.5" />
            Export CSV
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer -mb-px ${
              activeTab === tab.key
                ? 'border-violet-650 text-violet-600 dark:border-violet-500 dark:text-violet-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="h-4.5 w-4.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'revenue' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Revenue statement cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <StatsCard
              title="Delivered Revenue"
              value={formatCurrency(revenueData?.total_revenue)}
              icon={DollarSign}
              description="Acrrued from shipped orders"
              trend="Cash Inflow"
              trendType="positive"
            />
            <StatsCard
              title="Procured Materials Cost"
              value={formatCurrency(revenueData?.total_cost)}
              icon={ShoppingBag}
              description="Accrued from received materials"
              trend="Cash Outflow"
              trendType="negative"
            />
            <StatsCard
              title="Operational Gross Profit"
              value={formatCurrency(revenueData?.gross_profit)}
              icon={TrendingUp}
              description="Revenue minus procurement costs"
              trend="Margin realized"
              trendType={(revenueData?.gross_profit || 0) >= 0 ? 'positive' : 'negative'}
            />
          </div>

          <div className="rounded-2xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 glass">
            <h3 className="text-base font-bold text-slate-850 dark:text-white mb-2">Financial Accounting Policy</h3>
            <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed">
              This report represents a simplified gross profit calculation for Shiv Furniture Works. Revenue is recorded once a Sales Order transitions to the <strong>Fully Delivered</strong> status, indicating goods have been successfully delivered to the customer. Cost of goods sold (COGS) is computed based on Purchase Orders that are in the <strong>Fully Received</strong> status, indicating the materials are fully stocked in inventory. Adjustments, wages, work center utilities, and depreciation of machinery are excluded.
            </p>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <DataTable
            columns={getColumns()}
            data={reportData}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default Reports;
