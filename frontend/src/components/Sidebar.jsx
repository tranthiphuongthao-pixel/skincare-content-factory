import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, Wand2, Calendar, Settings, LogOut,
  Sparkles, Video, ShieldCheck, Users
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard",   icon: LayoutDashboard, label: "Dashboard" },
  { to: "/create",      icon: Wand2,           label: "Tạo content" },
  { to: "/my/videos",   icon: Video,           label: "Videos" },
  { to: "/my/products", icon: Package,         label: "Sản phẩm" },
  { to: "/calendar",    icon: Calendar,        label: "Lịch" },
  { to: "/settings",    icon: Settings,        label: "Cài đặt" },
];

const adminItems = [
  { to: "/admin", icon: ShieldCheck, label: "Admin Panel" },
  { to: "/admin/users", icon: Users, label: "Quản lý Users" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="w-72 bg-white border-r border-border flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-surface-2 text-accent-dark">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="font-display italic text-xl text-accent-dark leading-tight">Content Factory</p>
            <p className="mt-1 text-sm font-medium text-text-muted">Skincare TikTok</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-[10px] text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-br from-accent to-accent-dark text-white shadow-[0_10px_30px_rgba(212,160,192,0.14)]"
                  : "text-text-muted hover:bg-bg-surface-2 hover:text-text-primary"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

        <div className="pt-3 pb-1">
          <p className="px-4 text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium mb-1">Cộng đồng</p>
          <Link
            to="/products"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] text-sm font-medium text-text-muted hover:bg-bg-surface-2 hover:text-text-primary transition-all"
          >
            <span>🌸</span>
            Cộng đồng
          </Link>
        </div>

        {user?.role === "admin" && (
          <div className="pt-3 pb-1">
            <p className="px-4 text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium mb-1">Admin</p>
            {adminItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/admin"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-[10px] text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-br from-accent to-accent-dark text-white shadow-[0_10px_30px_rgba(212,160,192,0.14)]"
                      : "text-text-muted hover:bg-bg-surface-2 hover:text-text-primary"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-3 rounded-[18px] bg-bg-surface-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent-dark font-semibold text-sm shrink-0">
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{user?.username}</p>
            <p className="truncate text-xs text-text-muted">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[14px] border border-border bg-white px-4 py-2.5 text-sm font-medium text-text-muted transition-all hover:border-accent hover:text-accent-dark"
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
