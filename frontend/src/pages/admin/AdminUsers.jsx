import { useState, useEffect } from "react";
import { Search, UserCheck, UserX, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../api/client";

const ROLE_BADGE = {
  admin: "bg-purple-500/10 text-purple-600 border-purple-200",
  user: "bg-blue-500/10 text-blue-600 border-blue-200",
};

const PLAN_BADGE = {
  free: "bg-bg-surface-2 text-text-muted border-border",
  pro: "bg-amber-500/10 text-amber-600 border-amber-200",
  enterprise: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  const LIMIT = 20;
  const totalPages = Math.ceil(total / LIMIT);

  const fetchUsers = (p = page, s = search) => {
    setLoading(true);
    api.get("/admin/users", { params: { page: p, limit: LIMIT, search: s || undefined } })
      .then(res => {
        setUsers(res.data?.items || []);
        setTotal(res.data?.total || 0);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers(page, search);
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchUsers(1, search); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleToggleActive = async (userId, currentActive) => {
    setToggling(userId);
    try {
      const res = await api.put(`/admin/users/${userId}/toggle-active`);
      setUsers(us => us.map(u => u.id === userId ? { ...u, is_active: res.data.is_active } : u));
    } catch {
      // ignore
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 bg-bg-primary">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-semibold text-text-primary">Quản lý Users</h1>
          <p className="text-text-muted text-sm mt-1">{total} users trong hệ thống</p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo username hoặc email..."
            className="input pl-10 focus:border-accent"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-border rounded-[20px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-bg-surface-2">
                <tr>
                  {["Username", "Email", "Role", "Plan", "Status", "Videos", "Ngày đăng ký", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-bg-surface-2 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-text-muted">
                      {search ? "Không tìm thấy user nào" : "Chưa có user nào"}
                    </td>
                  </tr>
                ) : users.map(user => (
                  <tr key={user.id} className="border-b border-border hover:bg-bg-surface-2/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent-dark shrink-0">
                          {user.username?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span className="font-medium text-text-primary truncate max-w-[120px]">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-muted truncate max-w-[160px]">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${ROLE_BADGE[user.role] || ROLE_BADGE.user}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${PLAN_BADGE[user.subscription_plan] || PLAN_BADGE.free}`}>
                        {user.subscription_plan || "free"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                        user.is_active
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                          : "bg-red-500/10 text-red-500 border-red-200"
                      }`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{user.video_count || 0}</td>
                    <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        disabled={toggling === user.id}
                        className={`flex items-center gap-1.5 py-1.5 px-3 rounded-[10px] border text-[11px] font-medium transition-all disabled:opacity-50 ${
                          user.is_active
                            ? "border-red-200 text-red-500 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {toggling === user.id ? (
                          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : user.is_active ? (
                          <><UserX size={12} /> Deactivate</>
                        ) : (
                          <><UserCheck size={12} /> Activate</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-text-muted">
                Trang {page} / {totalPages} — {total} users
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary p-2 rounded-[10px] disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary p-2 rounded-[10px] disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
