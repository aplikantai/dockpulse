import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './shared/auth/AuthContext';
import { RequireAuth } from './shared/auth/guards/RequireAuth';
import { RequireMembership } from './shared/auth/guards/RequireMembership';

// Panel (Staff)
import { PanelLayout } from './apps/panel/layouts/PanelLayout';
import { Dashboard } from './apps/panel/pages/Dashboard';
import { LoginPage } from './apps/panel/pages/LoginPage';

// Portal (Client)
import { PortalLayout } from './apps/portal/layouts/PortalLayout';
import { MyOrders } from './apps/portal/pages/MyOrders';
import { NewOrder } from './apps/portal/pages/NewOrder';

// Placeholder components
const OrdersList = () => <div className="text-2xl">Orders List (TODO)</div>;
const OrderDetail = () => <div className="text-2xl">Order Detail (TODO)</div>;
const CustomersList = () => <div className="text-2xl">Customers List (TODO)</div>;
const ProductsList = () => <div className="text-2xl">Products List (TODO)</div>;
const Settings = () => <div className="text-2xl">Settings (TODO)</div>;
const NoAccess = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
      <p className="text-gray-500 mt-2">You don't have permission to access this page.</p>
    </div>
  </div>
);
const PortalOrderDetail = () => <div className="text-2xl">Portal Order Detail (TODO)</div>;
const PortalLogin = () => <div className="text-2xl">Portal Login (TODO)</div>;

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/no-access" element={<NoAccess />} />

          {/* Panel (Staff) - requires auth + membership */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <RequireMembership roles={['OWNER', 'ADMIN', 'MANAGER', 'MEMBER']}>
                  <PanelLayout />
                </RequireMembership>
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<OrdersList />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="customers" element={<CustomersList />} />
            <Route path="products" element={<ProductsList />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Portal (Client) - separate auth flow */}
          <Route path="/portal/login" element={<PortalLogin />} />
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<MyOrders />} />
            <Route path="new" element={<NewOrder />} />
            <Route path="orders/:id" element={<PortalOrderDetail />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
