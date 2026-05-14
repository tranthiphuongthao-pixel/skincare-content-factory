import { useState, useEffect } from "react";
import { TrendingUp, Plus, Eye, Heart, MessageCircle, Share2, Bookmark, UserPlus } from "lucide-react";
import api from "../api/client";
import MetricCard from "../components/MetricCard";

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ script_id: "", views: 0, likes: 0, comments: 0, shares: 0, saves: 0, follower_gain: 0 });

  useEffect(() => {
    Promise.all([
      api.get("/analytics/summary"),
      api.get("/analytics/"),
      api.get("/scripts/?status=posted"),
    ]).then(([sum, ana, scr]) => {
      setSummary(sum.data);
      setAnalytics(ana.data);
      setScripts(scr.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/analytics/", { ...form, script_id: parseInt(form.script_id) });
    setShowForm(false);
    const [sum, ana] = await Promise.all([api.get("/analytics/summary"), api.get("/analytics/")]);
    setSummary(sum.data);
    setAnalytics(ana.data);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-text-secondary text-sm mt-1">Performance tracking</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> Nhập dữ liệu
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Tổng lượt xem" value={summary?.total_views?.toLocaleString() ?? "—"} icon={Eye} color="text-accent" />
        <MetricCard label="Tổng likes" value={summary?.total_likes?.toLocaleString() ?? "—"} icon={Heart} color="text-highlight" />
        <MetricCard label="Tổng shares" value={summary?.total_shares?.toLocaleString() ?? "—"} icon={Share2} color="text-blue-400" />
        <MetricCard label="Engagement rate" value={summary ? `${summary.avg_engagement_rate}%` : "—"} icon={TrendingUp} color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Tổng saves" value={summary?.total_saves?.toLocaleString() ?? "—"} icon={Bookmark} color="text-yellow-400" />
        <MetricCard label="Comments" value={summary?.total_comments?.toLocaleString() ?? "—"} icon={MessageCircle} color="text-orange-400" />
        <MetricCard label="Follower gain" value={summary?.total_follower_gain?.toLocaleString() ?? "—"} icon={UserPlus} color="text-pink-400" />
        <MetricCard label="Videos tracked" value={summary?.total_videos?.toString() ?? "0"} icon={TrendingUp} color="text-purple-400" />
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Chi tiết analytics</h2>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-surface rounded-xl animate-pulse" />)}
          </div>
        ) : analytics.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Chưa có dữ liệu analytics</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-secondary border-b border-border">
                  <th className="text-left pb-3">Script ID</th>
                  <th className="text-right pb-3">Views</th>
                  <th className="text-right pb-3">Likes</th>
                  <th className="text-right pb-3">Comments</th>
                  <th className="text-right pb-3">Shares</th>
                  <th className="text-right pb-3">Saves</th>
                  <th className="text-right pb-3">Followers</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map(a => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                    <td className="py-3 text-accent">#{a.script_id}</td>
                    <td className="py-3 text-right">{a.views.toLocaleString()}</td>
                    <td className="py-3 text-right text-highlight">{a.likes.toLocaleString()}</td>
                    <td className="py-3 text-right">{a.comments.toLocaleString()}</td>
                    <td className="py-3 text-right text-blue-400">{a.shares.toLocaleString()}</td>
                    <td className="py-3 text-right text-yellow-400">{a.saves.toLocaleString()}</td>
                    <td className="py-3 text-right text-emerald-400">+{a.follower_gain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-5">Nhập dữ liệu analytics</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Script</label>
                <select value={form.script_id} onChange={e => setForm({...form, script_id: e.target.value})} className="input" required>
                  <option value="">Chọn script...</option>
                  {scripts.map(s => <option key={s.id} value={s.id}>#{s.id} — {s.hook?.slice(0, 40)}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["views", "likes", "comments", "shares", "saves", "follower_gain"].map(field => (
                  <div key={field}>
                    <label className="text-sm text-text-secondary mb-1 block capitalize">{field.replace("_", " ")}</label>
                    <input type="number" min="0" value={form[field]} onChange={e => setForm({...form, [field]: parseInt(e.target.value) || 0})} className="input" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Hủy</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
