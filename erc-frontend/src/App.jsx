import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers';
import Vendors from './pages/Vendors';
import SalesOrders from './pages/SalesOrders';
import PurchaseOrders from './pages/PurchaseOrders';
import Inventory from './pages/Inventory';
import BillOfMaterials from './pages/BillOfMaterials';
import Manufacturing from './pages/Manufacturing';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import Users from './pages/Users';
import Settings from './pages/Settings';
import ProcurementRequests from './pages/ProcurementRequests';
import StockLedger from './pages/StockLedger';
import StockAdjustment from './pages/StockAdjustment';
import WorkOrders from './pages/WorkOrders';

export const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Private routing layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Nested Sub-routes */}
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              
              <Route
                path="customers"
                element={
                  <ProtectedRoute allowedRoles={['sales_user', 'admin', 'business_owner', 'inventory_manager']}>
                    <Customers />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="vendors"
                element={
                  <ProtectedRoute allowedRoles={['purchase_user', 'admin', 'business_owner', 'inventory_manager']}>
                    <Vendors />
                  </ProtectedRoute>
                }
              />

              <Route
                path="sales-orders"
                element={
                  <ProtectedRoute allowedRoles={['sales_user', 'admin', 'business_owner', 'inventory_manager']}>
                    <SalesOrders />
                  </ProtectedRoute>
                }
              />

              <Route
                path="purchase-orders"
                element={
                  <ProtectedRoute allowedRoles={['purchase_user', 'admin', 'business_owner', 'inventory_manager']}>
                    <PurchaseOrders />
                  </ProtectedRoute>
                }
              />

              <Route
                path="inventory"
                element={
                  <ProtectedRoute allowedRoles={['inventory_manager', 'admin', 'business_owner']}>
                    <Inventory />
                  </ProtectedRoute>
                }
              />

              <Route
                path="bill-of-materials"
                element={
                  <ProtectedRoute allowedRoles={['manufacturing_user', 'admin', 'inventory_manager', 'purchase_user']}>
                    <BillOfMaterials />
                  </ProtectedRoute>
                }
              />

              <Route
                path="manufacturing"
                element={
                  <ProtectedRoute allowedRoles={['manufacturing_user', 'admin', 'business_owner', 'inventory_manager']}>
                    <Manufacturing />
                  </ProtectedRoute>
                }
              />

              <Route
                path="reports"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'business_owner']}>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />

              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Users />
                  </ProtectedRoute>
                }
              />

              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              <Route
                path="procurement-requests"
                element={
                  <ProtectedRoute allowedRoles={['purchase_user', 'admin', 'business_owner', 'inventory_manager']}>
                    <ProcurementRequests />
                  </ProtectedRoute>
                }
              />

              <Route
                path="stock-ledger"
                element={
                  <ProtectedRoute allowedRoles={['inventory_manager', 'admin', 'business_owner']}>
                    <StockLedger />
                  </ProtectedRoute>
                }
              />

              <Route
                path="stock-adjustment"
                element={
                  <ProtectedRoute allowedRoles={['inventory_manager', 'admin', 'business_owner']}>
                    <StockAdjustment />
                  </ProtectedRoute>
                }
              />

              <Route
                path="work-orders"
                element={
                  <ProtectedRoute allowedRoles={['manufacturing_user', 'admin', 'business_owner', 'inventory_manager']}>
                    <WorkOrders />
                  </ProtectedRoute>
                }
              />

              <Route
                path="sales-overview"
                element={
                  <ProtectedRoute allowedRoles={['business_owner']}>
                    <Reports defaultTab="sales" />
                  </ProtectedRoute>
                }
              />

              <Route
                path="purchase-overview"
                element={
                  <ProtectedRoute allowedRoles={['business_owner']}>
                    <Reports defaultTab="purchase" />
                  </ProtectedRoute>
                }
              />

              <Route
                path="manufacturing-overview"
                element={
                  <ProtectedRoute allowedRoles={['business_owner']}>
                    <Reports defaultTab="manufacturing" />
                  </ProtectedRoute>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
