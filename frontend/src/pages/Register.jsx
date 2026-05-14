import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      await register(email, username, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-accent-dark rounded-2xl mb-4 shadow-[0_14px_28px_rgba(212,160,192,0.3)]">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-semibold text-text-primary">Skincare Content Factory</h1>
          <p className="text-text-muted mt-2 text-sm">Tạo tài khoản miễn phí ngay hôm nay</p>
        </div>

        <div className="card shadow-[0_8px_32px_rgba(160,96,128,0.08)]">
          <h2 className="text-xl font-display font-semibold mb-6 text-text-primary">Tạo tài khoản</h2>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-text-muted mb-1.5 block font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input focus:border-accent"
                required
              />
            </div>
            <div>
              <label className="text-sm text-text-muted mb-1.5 block font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="skincarebyname"
                className="input focus:border-accent"
                required
              />
            </div>
            <div>
              <label className="text-sm text-text-muted mb-1.5 block font-medium">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10 focus:border-accent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-text-muted mb-1.5 block font-medium">Xác nhận mật khẩu</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10 focus:border-accent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : "Tạo tài khoản"}
            </button>
          </form>
          <p className="text-center text-sm text-text-muted mt-5">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-accent-dark font-medium hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
