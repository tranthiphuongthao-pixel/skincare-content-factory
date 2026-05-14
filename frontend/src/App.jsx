import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Create from "./pages/Create";
import MyVideos from "./pages/MyVideos";
import MyProducts from "./pages/MyProducts";
import ContentCalendar from "./pages/ContentCalendar";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminContent from "./pages/admin/AdminContent";
import AdminProducts from "./pages/admin/AdminProducts";
import Sidebar from "./components/Sidebar";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen bg-bg-primary">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PrivateLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" replace />;
  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/products/brands/:slug" element={<Navigate to="/products" replace />} />

        {/* Auth routes */}
        <Route path="/dashboard" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
        <Route path="/create" element={<PrivateLayout><Create /></PrivateLayout>} />
        <Route path="/my/videos" element={<PrivateLayout><MyVideos /></PrivateLayout>} />
        <Route path="/my/products" element={<PrivateLayout><MyProducts /></PrivateLayout>} />
        <Route path="/calendar" element={<PrivateLayout><ContentCalendar /></PrivateLayout>} />
        <Route path="/analytics" element={<PrivateLayout><Analytics /></PrivateLayout>} />
        <Route path="/settings" element={<PrivateLayout><Settings /></PrivateLayout>} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
        <Route path="/admin/content" element={<AdminLayout><AdminContent /></AdminLayout>} />
        <Route path="/admin/products" element={<AdminLayout><AdminProducts /></AdminLayout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
