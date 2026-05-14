import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Create from "./pages/Create";
import MyVideos from "./pages/MyVideos";
import MyProducts from "./pages/MyProducts";
import MyScripts from "./pages/MyScripts";
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
      <ErrorBoundary>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/products/brands/:slug" element={<Navigate to="/products" replace />} />

          {/* Auth routes */}
          <Route path="/dashboard" element={<PrivateLayout><ErrorBoundary><Dashboard /></ErrorBoundary></PrivateLayout>} />
          <Route path="/create" element={<PrivateLayout><ErrorBoundary><Create /></ErrorBoundary></PrivateLayout>} />
          <Route path="/my/videos" element={<PrivateLayout><ErrorBoundary><MyVideos /></ErrorBoundary></PrivateLayout>} />
          <Route path="/my/products" element={<PrivateLayout><ErrorBoundary><MyProducts /></ErrorBoundary></PrivateLayout>} />
          <Route path="/my/scripts" element={<PrivateLayout><ErrorBoundary><MyScripts /></ErrorBoundary></PrivateLayout>} />
          <Route path="/calendar" element={<PrivateLayout><ErrorBoundary><ContentCalendar /></ErrorBoundary></PrivateLayout>} />
          <Route path="/analytics" element={<PrivateLayout><ErrorBoundary><Analytics /></ErrorBoundary></PrivateLayout>} />
          <Route path="/settings" element={<PrivateLayout><ErrorBoundary><Settings /></ErrorBoundary></PrivateLayout>} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout><ErrorBoundary><AdminDashboard /></ErrorBoundary></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><ErrorBoundary><AdminUsers /></ErrorBoundary></AdminLayout>} />
          <Route path="/admin/content" element={<AdminLayout><ErrorBoundary><AdminContent /></ErrorBoundary></AdminLayout>} />
          <Route path="/admin/products" element={<AdminLayout><ErrorBoundary><AdminProducts /></ErrorBoundary></AdminLayout>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </AuthProvider>
  );
}
