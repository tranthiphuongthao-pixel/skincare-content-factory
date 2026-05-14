import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Shield, X, Star } from "lucide-react";
import api from "../api/client";

const STATUS_COLORS = {
  draft: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  ready: "bg-blue-500/10 text-blue-600 border-blue-200",
  posted: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  public: "bg-purple-500/10 text-purple-600 border-purple-200",
};

const POLICY_BADGE = {
  safe: { label: "🟢 An toàn", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  warning: { label: "🟡 Cảnh báo", cls: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  violation: { label: "🔴 Vi phạm", cls: "bg-red-500/10 text-red-500 border-red-200" },
};

const TABS = ["Tất cả", "Draft", "Ready", "Posted", "Public"];
const SKIN_TYPES = ["Oily", "Dry", "Combination", "Sensitive", "Normal"];
const STORES = ["Hasaki", "Shopee", "Guardian", "Beauty Box", "Lazada", "Khác"];

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          className="focus:outline-none"
        >
          <Star
            size={18}
            className={i < value ? "fill-amber-400 text-amber-400" : "text-gray-200 hover:text-amber-200 transition-colors"}
          />
        </button>
      ))}
    </div>
  );
}

function PublishModal({ video, onClose, onPublished }) {
  const [form, setForm] = useState({
    skin_type: "",
    usage_duration_weeks: "",
    purchased_at: "",
    video_url: "",
    rating_hydration: 0,
    rating_texture: 0,
    rating_effectiveness: 0,
    rating_scent: 0,
    rating_value: 0,
    is_suitable: false,
    would_repurchase: false,
    would_recommend: false,
    short_note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        usage_duration_weeks: form.usage_duration_weeks ? parseInt(form.usage_duration_weeks) : undefined,
      };
      await api.put(`/videos/${video.id}/publish`, payload);
      onPublished(video.id);
    } catch (err) {
      setError(err.response?.data?.detail || "Publish thất bại");
    } finally {
      setLoading(false);
    }
  };

  const ratings = [
    { key: "rating_hydration", label: "💧 Độ ẩm" },
    { key: "rating_texture", label: "✨ Texture" },
    { key: "rating_effectiveness", label: "⚡ Hiệu quả" },
    { key: "rating_scent", label: "🌸 Mùi hương" },
    { key: "rating_value", label: "💰 Giá trị" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-[28px] sm:rounded-[28px] border border-border w-full sm:max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-border sticky top-0 bg-white rounded-t-[28px] z-10">
          <div>
            <h3 className="font-display text-xl font-semibold text-text-primary">Public video này?</h3>
            <p className="text-text-muted text-sm mt-1">Điền thông tin review trước khi chia sẻ với cộng đồng</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-muted font-medium mb-1.5 block">Loại da của bạn</label>
              <select className="input focus:border-accent" value={form.skin_type} onChange={e => set("skin_type", e.target.value)}>
                <option value="">Chọn loại da</option>
                {SKIN_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-text-muted font-medium mb-1.5 block">Đã dùng được (tuần)</label>
              <input
                type="number"
                min="1"
                className="input focus:border-accent"
                value={form.usage_duration_weeks}
                onChange={e => set("usage_duration_weeks", e.target.value)}
                placeholder="4"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted font-medium mb-1.5 block">Mua tại</label>
            <select className="input focus:border-accent" value={form.purchased_at} onChange={e => set("purchased_at", e.target.value)}>
              <option value="">Chọn nơi mua</option>
              {STORES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-text-muted font-medium mb-1.5 block">Link video (TikTok/YouTube)</label>
            <input
              type="url"
              className="input focus:border-accent"
              value={form.video_url}
              onChange={e => set("video_url", e.target.value)}
              placeholder="https://tiktok.com/..."
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-text-muted">Đánh giá sản phẩm</p>
            {ratings.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-text-primary">{label}</span>
                <StarRating value={form[key]} onChange={v => set(key, v)} />
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            {[
              { key: "is_suitable", label: "Phù hợp với da tôi" },
              { key: "would_repurchase", label: "Sẽ mua lại" },
              { key: "would_recommend", label: "Recommend cho bạn bè" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <div
                  onClick={() => set(key, !form[key])}
                  className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all cursor-pointer ${
                    form[key] ? "bg-accent border-accent" : "border-border group-hover:border-accent/50"
                  }`}
                >
                  {form[key] && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className="text-sm text-text-primary">{label}</span>
              </label>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-text-muted font-medium">Ghi chú ngắn</label>
              <span className="text-xs text-text-muted">{form.short_note.length}/200</span>
            </div>
            <textarea
              className="input resize-none h-20 focus:border-accent"
              value={form.short_note}
              onChange={e => set("short_note", e.target.value.slice(0, 200))}
              placeholder="Cảm nhận nhanh về sản phẩm..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Hủy</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-60 gap-2">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : "Public video này →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Tất cả");
  const [publishVideo, setPublishVideo] = useState(null);
  const [checkingPolicy, setCheckingPolicy] = useState(null);
  const [policyResults, setPolicyResults] = useState({});

  useEffect(() => {
    api.get("/videos/my")
      .then(res => setVideos(res.data?.items || (Array.isArray(res.data) ? res.data : [])))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = videos.filter(v => {
    if (activeTab === "Tất cả") return true;
    if (activeTab === "Public") return v.is_public;
    return v.status?.toLowerCase() === activeTab.toLowerCase();
  });

  const handleCheckPolicy = async (videoId) => {
    setCheckingPolicy(videoId);
    try {
      const res = await api.post(`/videos/${videoId}/check-policy`);
      setPolicyResults(p => ({ ...p, [videoId]: res.data }));
    } catch {
      setPolicyResults(p => ({ ...p, [videoId]: { error: true } }));
    } finally {
      setCheckingPolicy(null);
    }
  };

  const handlePublished = (videoId) => {
    setVideos(vs => vs.map(v => v.id === videoId ? { ...v, is_public: true } : v));
    setPublishVideo(null);
  };

  return (
    <div className="min-h-screen p-6 md:p-8 bg-bg-primary">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-semibold text-text-primary">Video của tôi</h1>
            <p className="text-text-muted text-sm mt-1">{videos.length} videos</p>
          </div>
          <Link to="/create" className="btn-primary gap-2">
            <Plus size={16} /> Tạo video mới
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-[20px] border border-border bg-white p-4 animate-pulse">
                <div className="aspect-[9/16] bg-bg-surface-2 rounded-[14px] mb-3" />
                <div className="h-4 bg-bg-surface-2 rounded mb-2" />
                <div className="h-3 bg-bg-surface-2 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="text-6xl">🎬</span>
            <p className="text-text-muted text-lg">Chưa có video nào{activeTab !== "Tất cả" ? ` ở trạng thái "${activeTab}"` : ""}</p>
            <Link to="/create" className="btn-primary">Tạo video đầu tiên</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(video => {
              const policy = POLICY_BADGE[video.policy_status];
              const policyResult = policyResults[video.id];
              const canPublish = ["posted", "ready"].includes(video.status);

              return (
                <div key={video.id} className="bg-white border border-border rounded-[20px] overflow-hidden hover:shadow-[0_8px_24px_rgba(160,96,128,0.08)] transition-all">
                  {/* Thumbnail */}
                  <div className="relative aspect-[9/16] max-h-56 bg-gradient-to-br from-accent/20 to-accent-dark/10 flex items-center justify-center overflow-hidden">
                    {video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="text-5xl">🎬</div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                      {policy && (
                        <span className={`badge border text-[10px] ${policy.cls}`}>{policy.label}</span>
                      )}
                      {video.is_public && (
                        <span className="badge bg-purple-500/80 text-white text-[10px]">Public</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary line-clamp-1">
                        {video.title || "Video chưa có tên"}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">{video.product?.name || "—"}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${STATUS_COLORS[video.status] || STATUS_COLORS.draft}`}>
                        {video.status}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {new Date(video.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>

                    {/* Policy check result */}
                    {policyResult && !policyResult.error && (
                      <div className={`rounded-[12px] p-2.5 text-xs ${policyResult.is_safe ? "bg-emerald-50 text-emerald-700" : "bg-yellow-50 text-yellow-700"}`}>
                        {policyResult.is_safe ? "✅ Nội dung an toàn" : `⚠️ ${policyResult.issues?.[0] || "Có vấn đề"}`}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCheckPolicy(video.id)}
                        disabled={checkingPolicy === video.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[12px] border border-border text-xs font-medium text-text-muted hover:border-accent/40 hover:text-accent-dark transition-all disabled:opacity-60"
                      >
                        {checkingPolicy === video.id ? (
                          <span className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />
                        ) : <Shield size={12} />}
                        Kiểm tra policy
                      </button>

                      {canPublish && !video.is_public && (
                        <button
                          onClick={() => setPublishVideo(video)}
                          className="flex-1 btn-primary py-2 text-xs justify-center"
                        >
                          Public
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {publishVideo && (
        <PublishModal
          video={publishVideo}
          onClose={() => setPublishVideo(null)}
          onPublished={handlePublished}
        />
      )}
    </div>
  );
}
