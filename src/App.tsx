import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import Header from './components/Header';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import FloatingCart from './components/FloatingCart';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import OrderSuccess from './pages/OrderSuccess';
import TrackOrder from './pages/TrackOrder';
import About from './pages/About';
import AuthPage from './pages/AuthPage';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminMenu from './pages/admin/AdminMenu';
import AdminZones from './pages/admin/AdminZones';
import AdminOffers from './pages/admin/AdminOffers';
import AdminMessages from './pages/admin/AdminMessages';
import ChefLogin from './pages/chef/ChefLogin';
import ChefDashboard from './pages/chef/ChefDashboard';
import ComingSoon from './components/ComingSoon';
import type { ReactNode } from 'react';

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user || !profile || profile.role !== 'admin') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function ChefRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user || !profile || (profile.role !== 'chef' && profile.role !== 'admin')) return <Navigate to="/chef/login" replace />;
  return <>{children}</>;
}

function CustomerLayout({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();

  if (!loading && profile) {
    if (profile.role === 'chef') return <Navigate to="/chef" replace />;
    if (profile.role === 'admin') return <Navigate to="/admin" replace />;
  }

  return (
    <>
      <Header />
      <main className="pb-16">{children}</main>
      <FloatingCart />
      <Footer />
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              <Route path="/chef/login" element={<ChefLogin />} />
              <Route path="/chef" element={<ChefRoute><ChefDashboard /></ChefRoute>} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="menu" element={<AdminMenu />} />
                <Route path="zones" element={<AdminZones />} />
                <Route path="offers" element={<AdminOffers />} />
                <Route path="messages" element={<AdminMessages />} />
              </Route>

              <Route path="/" element={<ComingSoon />} />
              <Route path="*" element={<ComingSoon />} />
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
