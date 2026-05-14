import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Video, Package, AlertTriangle, TrendingUp, Shield } from "lucide-react";
import api from "../../api/client";
import MetricCard from "../../components/MetricCard";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/stats")
      .then(res => setStats(res.data))
      .catch(() => setError("Không thể tải stats"))
      .finally(() => setLoading(false));
  }, []);

  const quickNav = [
    { to: "/admin/users", icon: Users, label: "Quản lý Users", desc: "Xem, kích hoạt/vô hiệu hóa tài khoản" },
    { to: "/admin/content", icon: Video, label: "Quản lý Content", desc: "Videos và policy warnings" },
    { to: "/admin/products", icon: Package, label: "Quản lý Sản phẩm", desc: "Brands và sản phẩm trong hệ thống" },
  ];

  return (
    <div className="min-h-screen p-6 md:p-8 bg-bg-primary">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={20} className="text-accent" />
            <p className="text-sm uppercase tracking-[0.24em] text-text-muted font-medium">Admin Panel</p>
          </div>
          <h1 className="text-3xl font-display font-semibold text-text-primary">Tổng quan hệ thống</h1>
          <p className="text-text-muted text-sm mt-1">Quản lý toàn bộ nội dung và người dùng</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">{error}</div>
        )}

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-28 bg-white border border-border rounded-[16px] animate-pulse" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
            <MetricCard
              label="Tổng users"
              value={stats.total_users?.toLocaleString() ?? "—"}
              subtitle={`+${stats.new_users_this_week || 0} tuần này`}
              icon={Users}
            />
            <MetricCard
              label="Tổng videos"
              value={stats.total_videos?.toLocaleString() ?? "—"}
              subtitle={`+${stats.new_videos_this_week || 0} tuần này`}
              icon={Video}
            />
            <MetricCard
              label="Videos public"
              value={stats.total_public_videos?.toLocaleString() ?? "—"}
              icon={TrendingUp}
            />
            <MetricCard
              label="Sản phẩm"
              value={stats.total_products?.toLocaleString() ?? "—"}
              icon={Package}
            />
            <MetricCard
              label="Policy warnings"
              value={stats.videos_with_warnings?.toLocaleString() ?? "—"}
              subtitle="Videos có vấn đề"
              icon={AlertTriangle}
            />
            <MetricCard
              label="Users mới tuần này"
              value={stats.new_users_this_week?.toLocaleString() ?? "—"}
              icon={TrendingUp}
            />
          </div>
        )}

        {/* Quick nav */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {quickNav.map(({ to, icon: Icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="group bg-white border border-border rounded-[20px] p-6 hover:border-accent hover:shadow-[0_8px_24px_rgba(212,160,192,0.12)] transition-all"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-surface-2 text-accent-dark group-hover:bg-accent/10 transition-colors mb-4">
                <Icon size={22} />
              </div>
              <h3 className="font-semibold text-text-primary">{label}</h3>
              <p className="text-sm text-text-muted mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
