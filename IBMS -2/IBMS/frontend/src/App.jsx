import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Main Application Pages
import Dashboard from './pages/dashboard/Dashboard';
import CustomerList from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import ProductList from './pages/products/ProductList';
import InvoiceList from './pages/invoices/InvoiceList';
import CreateInvoice from './pages/invoices/CreateInvoice';
import EditInvoice from './pages/invoices/EditInvoice';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import PaymentList from './pages/payments/PaymentList';
import Reports from './pages/reports/Reports';
import BusinessSettings from './pages/settings/BusinessSettings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Business Workspace Routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />

            {/* Invoices */}
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/new" element={<CreateInvoice />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/invoices/:id/edit" element={<EditInvoice />} />

            {/* Customers */}
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />

            {/* Products & Services */}
            <Route path="/products" element={<ProductList />} />

            {/* Payments */}
            <Route path="/payments" element={<PaymentList />} />

            {/* Reports & Analytics */}
            <Route path="/reports" element={<Reports />} />

            {/* Company Settings */}
            <Route path="/settings" element={<BusinessSettings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
