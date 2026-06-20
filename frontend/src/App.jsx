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
                  <ProtectedRoute allowedRoles={['sales_user', 'admin', 'business_owner']}>
                    <Customers />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="vendors"
                element={
                  <ProtectedRoute allowedRoles={['purchase_user', 'admin', 'business_owner']}>
                    <Vendors />
                  </ProtectedRoute>
                }
              />

              <Route
                path="sales-orders"
                element={
                  <ProtectedRoute allowedRoles={['sales_user', 'admin', 'business_owner']}>
                    <SalesOrders />
                  </ProtectedRoute>
                }
              />

              <Route
                path="purchase-orders"
                element={
                  <ProtectedRoute allowedRoles={['purchase_user', 'admin', 'business_owner']}>
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
                  <ProtectedRoute allowedRoles={['manufacturing_user', 'admin', 'business_owner']}>
                    <BillOfMaterials />
                  </ProtectedRoute>
                }
              />

              <Route
                path="manufacturing"
                element={
                  <ProtectedRoute allowedRoles={['manufacturing_user', 'admin', 'business_owner']}>
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
