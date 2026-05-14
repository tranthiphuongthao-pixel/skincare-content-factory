import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText, Calendar, Package, Sparkles, Video,
  Wand2, BarChart2, ArrowRight, Users
} from "lucide-react";
import api from "../api/client";
import MetricCard from "../components/MetricCard";
import { useAuth } from "../context/AuthContext";

const STATUS_COLORS = {
  draft: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  ready: "bg-blue-500/10 text-blue-600 border-blue-200",
  posted: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

const POLICY_BADGE = {
  safe: { label: "🟢 An toàn", cls: "bg-emerald-500/10 text-emerald-600" },
  warning: { label: "🟡 Cảnh báo", cls: "bg-yellow-500/10 text-yellow-600" },
  violation: { label: "🔴 Vi phạm", cls: "bg-red-500/10 text-red-500" },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [scripts, setScripts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [stats, setStats] = useState({ scripts: 0, videos: 0, public_videos: 0, this_month: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/scripts/").catch(() => ({ data: [] })),
      api.get("/videos/my").catch(() => ({ data: [] })),
    ]).then(([scriptsRes, videosRes]) => {
      const allScripts = Array.isArray(scriptsRes.data) ? scriptsRes.data : (scriptsRes.data?.items || []);
      const allVideos = videosRes.data?.items || (Array.isArray(videosRes.data) ? videosRes.data : []);
      setScripts(allScripts.slice(0, 5));
      setVideos(allVideos.slice(0, 5));

      const now = new Date();
      const thisMonthScripts = allScripts.filter(s => {
        const d = new Date(s.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      setStats({
        scripts: allScripts.length,
        videos: allVideos.length,
        public_videos: allVideos.filter(v => v.is_public).length,
        this_month: thisMonthScripts.length,
      });
    }).finally(() => setLoading(false));
  }, []);

  const quickActions = [
    { to: "/create", icon: Wand2, label: "Tạo script mới", desc: "Tạo nội dung với AI" },
    { to: "/my/products", icon: Package, label: "Thêm sản phẩm", desc: "Quản lý sản phẩm của bạn" },
    { to: "/calendar", icon: Calendar, label: "Xem lịch content", desc: "Lên lịch đăng bài" },
    { to: "/products", icon: Users, label: "Xem cộng đồng", desc: "Review từ cộng đồng" },
  ];

  return (
    <div className="min-h-screen p-8 bg-bg-primary text-text-primary">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.24em] text-text-muted mb-2 font-medium">Content Factory</p>
        <h1 className="text-4xl font-display font-semibold tracking-tight">
          Xin chào, {user?.username || "bạn"}! 👋
        </h1>
        <p className="max-w-2xl text-sm text-text-muted mt-3">
          Đây là tổng quan content của bạn. Tiếp tục tạo nội dung đẹp cho kênh skincare TikTok.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <MetricCard
          label="Scripts của tôi"
          value={loading ? "—" : stats.scripts.toLocaleString()}
          subtitle="Tổng scripts đã tạo"
          icon={FileText}
        />
        <MetricCard
          label="Video của tôi"
          value={loading ? "—" : stats.videos.toLocaleString()}
          subtitle="Tổng videos"
          icon={Video}
        />
        <MetricCard
          label="Videos public"
          value={loading ? "—" : stats.public_videos.toLocaleString()}
          subtitle="Đã chia sẻ cộng đồng"
          icon={BarChart2}
        />
        <MetricCard
          label="Tháng này"
          value={loading ? "—" : stats.this_month.toLocaleString()}
          subtitle="Scripts tháng này"
          icon={Sparkles}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {quickActions.map(({ to, icon: Icon, label, desc }) => (
          <Link
            key={to}
            to={to}
            className="group bg-white border border-border rounded-[20px] p-5 transition-all hover:border-accent hover:shadow-[0_10px_30px_rgba(212,160,192,0.14)] flex flex-col gap-3"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-surface-2 text-accent-dark group-hover:bg-accent/10 transition-colors">
              <Icon size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{label}</p>
              <p className="text-xs text-text-muted mt-0.5">{desc}</p>
            </div>
            <ArrowRight size={14} className="text-text-muted group-hover:text-accent-dark ml-auto transition-colors" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent scripts */}
        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Scripts gần đây</h2>
              <p className="mt-1 text-sm text-text-muted">5 scripts mới nhất của bạn</p>
            </div>
            <Link to="/my/scripts" className="pill-button text-xs">Xem tất cả</Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-[16px] bg-bg-surface-2 animate-pulse" />
              ))}
            </div>
          ) : scripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-border bg-bg-surface-2 p-8 text-center">
              <span className="text-4xl">✨</span>
              <p className="text-sm text-text-muted">Chưa có script nào. Bắt đầu tạo ngay!</p>
              <Link to="/create" className="btn-primary text-xs py-2 px-4">Tạo script đầu tiên</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {scripts.map(script => (
                <div key={script.id} className="flex items-center gap-3 rounded-[14px] border border-border bg-bg-surface p-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary line-clamp-1">{script.hook || "Script chưa có hook"}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{script.product?.name || "—"} · {script.topic_type || "—"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${STATUS_COLORS[script.status] || STATUS_COLORS.draft}`}>
                    {script.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent videos */}
        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Videos gần đây</h2>
              <p className="mt-1 text-sm text-text-muted">5 videos mới nhất của bạn</p>
            </div>
            <Link to="/my/videos" className="pill-button text-xs">Xem tất cả</Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-[16px] bg-bg-surface-2 animate-pulse" />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-border bg-bg-surface-2 p-8 text-center">
              <span className="text-4xl">🎬</span>
              <p className="text-sm text-text-muted">Chưa có video nào. Tạo script trước nhé!</p>
              <Link to="/create" className="btn-primary text-xs py-2 px-4">Tạo script mới</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {videos.map(video => {
                const policyBadge = video.policy_status ? POLICY_BADGE[video.policy_status] : null;
                return (
                  <div key={video.id} className="flex items-center gap-3 rounded-[14px] border border-border bg-bg-surface p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary line-clamp-1">{video.title || "Video chưa có tên"}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{video.product?.name || "—"}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {policyBadge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${policyBadge.cls}`}>
                          {policyBadge.label}
                        </span>
                      )}
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${STATUS_COLORS[video.status] || STATUS_COLORS.draft}`}>
                        {video.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
