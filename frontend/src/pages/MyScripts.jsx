import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Video, ChevronDown, ChevronUp } from "lucide-react";
import api from "../api/client";

const STATUS_COLORS = {
  draft: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  ready: "bg-blue-500/10 text-blue-600 border-blue-200",
  posted: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

const TABS = ["Tất cả", "Draft", "Ready", "Posted"];

const TOPIC_LABELS = {
  honest_review: "Honest Review",
  ingredient_breakdown: "Phân tích thành phần",
  before_after: "Before & After",
  comparison: "So sánh",
  routine_feature: "Trong routine",
  red_flag_check: "Red flags",
  dupe_finder: "Tìm dupe",
  community_review: "Cộng đồng",
};

const FORMAT_LABELS = {
  text_on_screen: "Text on Screen",
  voiceover: "Voiceover",
};

export default function MyScripts() {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get("/scripts/")
      .then(res => setScripts(Array.isArray(res.data) ? res.data : res.data?.items || []))
      .catch(() => setScripts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = scripts.filter(s => {
    if (activeTab === "Tất cả") return true;
    return s.status?.toLowerCase() === activeTab.toLowerCase();
  });

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa script này?")) return;
    setDeleting(id);
    try {
      await api.delete(`/scripts/${id}`);
      setScripts(ss => ss.filter(s => s.id !== id));
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 bg-bg-primary">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-semibold text-text-primary">Scripts của tôi</h1>
            <p className="text-text-muted text-sm mt-1">{scripts.length} scripts</p>
          </div>
          <Link to="/create" className="btn-primary gap-2">
            <Plus size={16} /> Tạo script mới
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-bg-surface-2 rounded-[14px] p-1 w-fit mb-6">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-[10px] text-sm font-medium transition-all ${
                activeTab === tab ? "bg-white text-text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-[16px] bg-white border border-border animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="text-6xl">📝</span>
            <p className="text-text-muted text-lg">Chưa có script nào{activeTab !== "Tất cả" ? ` ở trạng thái "${activeTab}"` : ""}</p>
            <Link to="/create" className="btn-primary">Tạo script đầu tiên</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header row */}
            <div className="hidden md:grid grid-cols-[1fr_140px_100px_90px_100px_100px] gap-3 px-4 py-2">
              {["Hook", "Sản phẩm", "Topic", "Format", "Trạng thái", "Ngày tạo"].map(h => (
                <span key={h} className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">{h}</span>
              ))}
            </div>

            {filtered.map(script => (
              <div key={script.id} className="bg-white border border-border rounded-[16px] overflow-hidden">
                <div
                  className="grid grid-cols-1 md:grid-cols-[1fr_140px_100px_90px_100px_100px] gap-3 px-4 py-4 cursor-pointer hover:bg-bg-surface-2/50 transition-colors items-center"
                  onClick={() => setExpanded(e => e === script.id ? null : script.id)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary line-clamp-1">{script.hook || "Chưa có hook"}</p>
                    <p className="text-xs text-text-muted mt-0.5 md:hidden">{script.product?.name || "—"}</p>
                  </div>
                  <p className="text-xs text-text-muted hidden md:block truncate">{script.product?.name || "—"}</p>
                  <span className="text-xs text-text-muted hidden md:block">{TOPIC_LABELS[script.topic_type] || script.topic_type || "—"}</span>
                  <span className="text-xs text-text-muted hidden md:block">{FORMAT_LABELS[script.format_type] || script.format_type || "—"}</span>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide w-fit ${STATUS_COLORS[script.status] || STATUS_COLORS.draft}`}>
                    {script.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-text-muted hidden md:block">
                      {new Date(script.created_at).toLocaleDateString("vi-VN")}
                    </span>
                    {expanded === script.id ? <ChevronUp size={14} className="text-text-muted ml-auto" /> : <ChevronDown size={14} className="text-text-muted ml-auto" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expanded === script.id && (
                  <div className="px-4 pb-4 border-t border-border space-y-4 pt-4">
                    {script.caption && (
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium mb-1.5">Caption</p>
                        <p className="text-sm text-text-muted leading-relaxed">{script.caption}</p>
                      </div>
                    )}
                    {script.hashtags?.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium mb-1.5">Hashtags</p>
                        <div className="flex flex-wrap gap-1.5">
                          {script.hashtags.map((h, i) => (
                            <span key={i} className="badge bg-accent/10 text-accent-dark text-xs">#{h}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Link
                        to="/create"
                        className="flex items-center gap-1.5 py-1.5 px-3 rounded-[10px] border border-border text-xs font-medium text-text-muted hover:border-accent/40 hover:text-accent-dark transition-all"
                      >
                        <Video size={12} /> Dùng trong video
                      </Link>
                      <button
                        onClick={() => handleDelete(script.id)}
                        disabled={deleting === script.id}
                        className="flex items-center gap-1.5 py-1.5 px-3 rounded-[10px] border border-border text-xs font-medium text-red-400 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        {deleting === script.id ? "..." : "Xóa"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
