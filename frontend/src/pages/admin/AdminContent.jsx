import { useState, useEffect, Fragment } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../api/client";

const POLICY_BADGE = {
  safe: { label: "🟢 An toàn", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  warning: { label: "🟡 Cảnh báo", cls: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  violation: { label: "🔴 Vi phạm", cls: "bg-red-500/10 text-red-500 border-red-200" },
  null: { label: "⬜ Chưa kiểm tra", cls: "bg-bg-surface-2 text-text-muted border-border" },
};

const TABS = ["Tất cả", "Cảnh báo", "Vi phạm"];

function getPolicyFilter(tab) {
  if (tab === "Cảnh báo") return "warning";
  if (tab === "Vi phạm") return "violation";
  return undefined;
}

export default function AdminContent() {
  const [videos, setVideos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const LIMIT = 20;
  const totalPages = Math.ceil(total / LIMIT);

  const fetchVideos = (p = page, tab = activeTab) => {
    setLoading(true);
    const params = { page: p, limit: LIMIT };
    const pf = getPolicyFilter(tab);
    if (pf) params.policy_status = pf;

    api.get("/admin/videos", { params })
      .then(res => {
        setVideos(res.data?.items || []);
        setTotal(res.data?.total || 0);
      })
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVideos(page, activeTab);
  }, [page, activeTab]);

  const handleTogglePublic = async (videoId, currentPublic) => {
    setToggling(videoId);
    try {
      const res = await api.put(`/admin/videos/${videoId}/toggle-public`);
      setVideos(vs => vs.map(v => v.id === videoId ? { ...v, is_public: res.data.is_public } : v));
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
          <h1 className="text-3xl font-display font-semibold text-text-primary">Quản lý Content</h1>
          <p className="text-text-muted text-sm mt-1">{total} videos</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-bg-surface-2 rounded-[14px] p-1 w-fit mb-6">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-4 py-2 rounded-[10px] text-sm font-medium transition-all ${
                activeTab === tab ? "bg-white text-text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-border rounded-[20px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-bg-surface-2">
                <tr>
                  {["Thumbnail", "Title", "User", "Sản phẩm", "Policy", "Public", "Actions"].map(h => (
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
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-bg-surface-2 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : videos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-text-muted">
                      Không có video nào{activeTab !== "Tất cả" ? ` với trạng thái "${activeTab}"` : ""}
                    </td>
                  </tr>
                ) : videos.map(video => {
                  const badge = POLICY_BADGE[video.policy_status] || POLICY_BADGE.null;
                  const isExpanded = expanded === video.id;

                  return (
                    <Fragment key={video.id}>
                      <tr className="border-b border-border hover:bg-bg-surface-2/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="w-10 h-14 bg-gradient-to-br from-accent/20 to-accent-dark/10 rounded-[10px] flex items-center justify-center overflow-hidden shrink-0">
                            {video.thumbnail_url ? (
                              <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg">🎬</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-text-primary max-w-[200px] truncate">{video.title || "Chưa có tên"}</p>
                          <p className="text-xs text-text-muted mt-0.5">{new Date(video.created_at).toLocaleDateString("vi-VN")}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-text-muted">{video.user?.username || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-text-muted truncate max-w-[120px] block">{video.product?.name || "—"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                            video.is_public ? "bg-purple-500/10 text-purple-600 border-purple-200" : "bg-bg-surface-2 text-text-muted border-border"
                          }`}>
                            {video.is_public ? "Public" : "Private"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleTogglePublic(video.id, video.is_public)}
                              disabled={toggling === video.id}
                              className={`flex items-center gap-1 py-1.5 px-2.5 rounded-[10px] border text-[11px] font-medium transition-all disabled:opacity-50 ${
                                video.is_public
                                  ? "border-red-200 text-red-500 hover:bg-red-50"
                                  : "border-purple-200 text-purple-600 hover:bg-purple-50"
                              }`}
                            >
                              {toggling === video.id ? (
                                <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              ) : video.is_public ? (
                                <><EyeOff size={12} /> Hide</>
                              ) : (
                                <><Eye size={12} /> Show</>
                              )}
                            </button>
                            {video.policy_status && video.policy_status !== "safe" && (
                              <button
                                onClick={() => setExpanded(e => e === video.id ? null : video.id)}
                                className="p-1.5 rounded-[10px] border border-border text-text-muted hover:border-accent/40 hover:text-accent-dark transition-all"
                              >
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && video.policy_issues && (
                        <tr className="border-b border-border bg-yellow-50/50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-text-muted uppercase tracking-[0.15em]">Policy Issues</p>
                              {Array.isArray(video.policy_issues) ? video.policy_issues.map((issue, i) => (
                                <p key={i} className="text-sm text-yellow-700">• {issue}</p>
                              )) : (
                                <p className="text-sm text-yellow-700">{video.policy_issues}</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-text-muted">
                Trang {page} / {totalPages} — {total} videos
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
