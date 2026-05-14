import { useState } from "react";
import { Settings as SettingsIcon, Key, User, Bell, Shield, Save, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

const SKIN_TYPES = ["Oily", "Dry", "Combination", "Sensitive", "Normal"];

export default function Settings() {
  const { user } = useAuth();

  // Profile form state
  const [profile, setProfile] = useState({
    bio: user?.bio || "",
    tiktok_handle: user?.tiktok_handle || "",
    skin_type: user?.skin_type || "",
    avatar_url: user?.avatar_url || "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  const setProfile_ = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    try {
      await api.put("/auth/me", profile);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      setProfileError(err.response?.data?.detail || "Lưu thất bại");
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 bg-bg-primary">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-semibold text-text-primary">Cài đặt</h1>
          <p className="text-text-muted text-sm mt-1">Quản lý tài khoản và tùy chỉnh ứng dụng</p>
        </div>

        {/* Profile section */}
        <div className="card space-y-5">
          <h2 className="font-semibold flex items-center gap-2 text-text-primary">
            <User size={16} className="text-accent" /> Thông tin cá nhân
          </h2>

          <div className="flex items-center gap-4 p-4 bg-bg-surface-2 rounded-[16px]">
            <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-xl font-bold text-accent-dark overflow-hidden shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                user?.username?.[0]?.toUpperCase() || "U"
              )}
            </div>
            <div>
              <p className="font-semibold text-text-primary">{user?.username}</p>
              <p className="text-sm text-text-muted">{user?.email}</p>
              <span className={`mt-1 inline-block badge text-[10px] ${
                user?.role === "admin" ? "bg-purple-500/10 text-purple-600" : "bg-emerald-500/10 text-emerald-600"
              }`}>
                {user?.role || "user"}
              </span>
            </div>
          </div>

          {profileError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              {profileError}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="text-sm text-text-muted font-medium mb-1.5 block">Avatar URL</label>
              <input
                type="url"
                className="input focus:border-accent"
                value={profile.avatar_url}
                onChange={e => setProfile_("avatar_url", e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div>
              <label className="text-sm text-text-muted font-medium mb-1.5 block">Bio</label>
              <div className="relative">
                <textarea
                  className="input resize-none h-20 focus:border-accent"
                  value={profile.bio}
                  onChange={e => setProfile_("bio", e.target.value.slice(0, 200))}
                  placeholder="Giới thiệu ngắn về bạn..."
                  maxLength={200}
                />
                <span className="absolute bottom-2 right-3 text-xs text-text-muted">{profile.bio.length}/200</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-text-muted font-medium mb-1.5 block">TikTok Handle</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">@</span>
                <input
                  type="text"
                  className="input pl-8 focus:border-accent"
                  value={profile.tiktok_handle}
                  onChange={e => setProfile_("tiktok_handle", e.target.value.replace(/^@/, ""))}
                  placeholder="yourtiktokhandle"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-text-muted font-medium mb-1.5 block">Loại da của bạn</label>
              <select
                className="input focus:border-accent"
                value={profile.skin_type}
                onChange={e => setProfile_("skin_type", e.target.value)}
              >
                <option value="">Chọn loại da</option>
                {SKIN_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <button
              type="submit"
              disabled={profileLoading || profileSaved}
              className="btn-primary gap-2 disabled:opacity-70"
            >
              {profileLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : profileSaved ? (
                <><Check size={14} /> Đã lưu!</>
              ) : (
                <><Save size={14} /> Lưu thay đổi</>
              )}
            </button>
          </form>
        </div>

        {/* Account info (read-only) */}
        <div className="card space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-text-primary">
            <SettingsIcon size={16} className="text-accent" /> Thông tin tài khoản
          </h2>
          <div className="space-y-2">
            {[
              { label: "Email", value: user?.email },
              { label: "Username", value: user?.username },
              { label: "Plan", value: user?.subscription_plan || "Free" },
              { label: "Trạng thái", value: user?.is_active ? "Active" : "Inactive" },
              { label: "Ngày tạo", value: user?.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-bg-surface-2 rounded-[14px]">
                <span className="text-sm text-text-muted">{label}</span>
                <span className="text-sm font-medium text-text-primary">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* API settings */}
        <div className="card space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-text-primary">
            <Key size={16} className="text-accent" /> Gemini API
          </h2>
          <p className="text-text-muted text-sm">Cấu hình Gemini API key trong file backend/.env</p>
          <div className="bg-bg-surface-2 rounded-[14px] p-4 font-mono text-sm text-text-muted">
            GEMINI_API_KEY=your-key-here
          </div>
          <div className="bg-accent/10 border border-accent/30 rounded-[14px] p-4">
            <p className="text-sm text-accent-dark">Lấy API key tại: <span className="font-mono">aistudio.google.com</span></p>
            <p className="text-xs text-text-muted mt-1">Gemini 1.5 Pro được dùng cho tất cả AI generation</p>
          </div>
        </div>

        {/* Content settings */}
        <div className="card space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-text-primary">
            <Bell size={16} className="text-accent" /> Content Settings
          </h2>
          <div className="space-y-2">
            {[
              { label: "Video mỗi ngày", value: "1 video/ngày" },
              { label: "Platform mặc định", value: "TikTok" },
              { label: "Khung giờ vàng", value: "11:00, 19:00, 21:00" },
              { label: "Mix content", value: "50% own use / 50% researched" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between p-3 bg-bg-surface-2 rounded-[14px]">
                <span className="text-sm text-text-muted">{label}</span>
                <span className="text-sm font-medium text-text-primary">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="card space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-text-primary">
            <Shield size={16} className="text-accent" /> Về ứng dụng
          </h2>
          <div className="space-y-1.5 text-sm text-text-muted">
            <p>Skincare Content Factory v2.0.0</p>
            <p>Built with FastAPI + React + Gemini AI</p>
            <p>Light theme · Beauty/Skincare community</p>
          </div>
        </div>
      </div>
    </div>
  );
}
