import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, ExternalLink, Sparkles, ArrowLeft, Play } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function TopNav() {
  const { user } = useAuth();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-dark">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-display italic text-lg text-accent-dark">Content Factory</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/products" className="text-sm font-medium text-text-muted hover:text-accent-dark">Reviews cộng đồng</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="btn-primary py-2 px-4 text-sm">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary py-2 px-4 text-sm">Đăng nhập</Link>
              <Link to="/register" className="btn-primary py-2 px-4 text-sm">Tạo account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function RatingBar({ label, value, max = 5 }) {
  const pct = value ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-text-muted w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-dark transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-text-primary w-8 text-right shrink-0">
        {value ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}

function StarDisplay({ rating, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}
        />
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get(`/products/${slug}`)
      .then(res => {
        const data = res.data;
        setProduct(data.product || data);
        const productData = data.product || data;
        return Promise.all([
          api.get(`/products/${productData.id}/reviews`).catch(() => ({ data: [] })),
          api.get(`/videos/public`, { params: { product_id: productData.id, limit: 6 } }).catch(() => ({ data: { items: [] } })),
        ]);
      })
      .then(([revRes, vidRes]) => {
        const revs = Array.isArray(revRes.data)
          ? revRes.data
          : Array.isArray(revRes.data?.items) ? revRes.data.items : [];
        const vids = Array.isArray(vidRes.data?.items)
          ? vidRes.data.items
          : Array.isArray(vidRes.data) ? vidRes.data : [];
        setReviews(revs);
        setVideos(vids);
      })
      .catch(() => setError("Không tìm thấy sản phẩm"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav />
      <div className="flex justify-center items-center pt-40">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav />
      <div className="flex flex-col items-center justify-center pt-40 gap-4">
        <span className="text-6xl">😕</span>
        <p className="text-text-muted text-lg">{error || "Không tìm thấy sản phẩm"}</p>
        <Link to="/products" className="btn-primary">Quay lại</Link>
      </div>
    </div>
  );

  const r = product;
  const overallRating = r.avg_overall_rating || 0;
  const repurchasePct = r.repurchase_rate ? Math.round(r.repurchase_rate * 100) : null;
  const suitablePct = r.suitable_rate ? Math.round(r.suitable_rate * 100) : null;

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-6">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/products")}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-accent-dark transition-colors mb-6"
        >
          <ArrowLeft size={16} /> Quay lại cộng đồng
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-10">
          {/* LEFT: Product info */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="bg-white border border-border rounded-[24px] overflow-hidden">
              {r.image_url ? (
                <img src={r.image_url} alt={r.name} className="w-full h-64 object-cover" />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-accent/20 to-accent-dark/10 flex items-center justify-center text-6xl">
                  ✨
                </div>
              )}
            </div>

            <div className="bg-white border border-border rounded-[24px] p-6 space-y-5">
              <div>
                <h1 className="font-display text-2xl font-semibold text-text-primary leading-tight">{r.name}</h1>
                <span className="inline-block mt-2 badge bg-accent/10 text-accent-dark text-xs">
                  {r.brand?.name || r.brand_name || "—"}
                </span>
              </div>

              {r.key_ingredients?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium mb-2">Thành phần chính</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.key_ingredients.map((ing, i) => (
                      <span key={i} className="badge bg-blue-50 text-blue-600 border border-blue-100 text-[11px]">{ing}</span>
                    ))}
                  </div>
                </div>
              )}

              {r.skin_concerns?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium mb-2">Vấn đề da</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.skin_concerns.map((c, i) => (
                      <span key={i} className="badge bg-pink-50 text-pink-600 border border-pink-100 text-[11px]">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {r.suitable_skin_types?.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium mb-2">Phù hợp với</p>
                  <div className="flex flex-wrap gap-1.5">
                    {r.suitable_skin_types.map((t, i) => (
                      <span key={i} className="badge bg-bg-surface-2 text-text-primary border border-border text-[11px]">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                {r.affiliate_link && (
                  <a
                    href={r.affiliate_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary w-full justify-center gap-2 text-sm"
                  >
                    <ExternalLink size={14} /> Mua sản phẩm
                  </a>
                )}
                {user ? (
                  <Link to="/create" className="btn-primary w-full justify-center text-sm">
                    Thêm review của bạn
                  </Link>
                ) : (
                  <Link to="/register" className="btn-primary w-full justify-center text-sm">
                    Đăng ký để review
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Ratings */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            <div className="bg-white border border-border rounded-[24px] p-6">
              <div className="flex items-start gap-6 mb-6">
                <div className="text-center">
                  <div className="text-5xl font-display font-bold text-text-primary">
                    {overallRating ? overallRating.toFixed(1) : "—"}
                  </div>
                  <div className="text-sm text-text-muted">/5</div>
                  <StarDisplay rating={overallRating} size={14} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-3 mb-4">
                    <div className="bg-bg-surface-2 rounded-[12px] px-4 py-2 text-center">
                      <p className="text-lg font-bold text-text-primary">{r.review_count || 0}</p>
                      <p className="text-xs text-text-muted">reviews</p>
                    </div>
                    <div className="bg-bg-surface-2 rounded-[12px] px-4 py-2 text-center">
                      <p className="text-lg font-bold text-text-primary">{r.video_count || 0}</p>
                      <p className="text-xs text-text-muted">videos</p>
                    </div>
                    {repurchasePct !== null && (
                      <div className="bg-emerald-50 rounded-[12px] px-4 py-2 text-center">
                        <p className="text-lg font-bold text-emerald-600">{repurchasePct}%</p>
                        <p className="text-xs text-text-muted">sẽ mua lại</p>
                      </div>
                    )}
                    {suitablePct !== null && (
                      <div className="bg-blue-50 rounded-[12px] px-4 py-2 text-center">
                        <p className="text-lg font-bold text-blue-600">{suitablePct}%</p>
                        <p className="text-xs text-text-muted">phù hợp da</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <RatingBar label="💧 Độ ẩm" value={r.avg_rating_hydration} />
                <RatingBar label="✨ Texture" value={r.avg_rating_texture} />
                <RatingBar label="⚡ Hiệu quả" value={r.avg_rating_effectiveness} />
                <RatingBar label="🌸 Mùi hương" value={r.avg_rating_scent} />
                <RatingBar label="💰 Giá trị" value={r.avg_rating_value} />
              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="bg-white border border-border rounded-[24px] p-6">
                <h2 className="font-display text-lg font-semibold mb-4">Nhận xét từ cộng đồng</h2>
                <div className="space-y-4">
                  {reviews.slice(0, 5).map(rev => (
                    <div key={rev.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-xs font-semibold text-accent-dark">
                            {rev.user?.username?.[0]?.toUpperCase() || "U"}
                          </div>
                          <span className="text-sm font-medium text-text-primary">{rev.user?.username || "Ẩn danh"}</span>
                          {rev.skin_type && (
                            <span className="badge bg-bg-surface-2 text-text-muted text-[10px]">{rev.skin_type}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <StarDisplay rating={rev.overall_rating} size={12} />
                          <span className="text-xs text-text-muted">
                            {new Date(rev.created_at).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                      {rev.short_note && (
                        <p className="text-sm text-text-muted ml-9 leading-relaxed">{rev.short_note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Video reviews */}
        {videos.length > 0 && (
          <div className="bg-white border border-border rounded-[24px] p-6">
            <h2 className="font-display text-xl font-semibold mb-5">Video reviews</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {videos.map(vid => (
                <div key={vid.id} className="flex flex-col gap-2">
                  <div className="aspect-[9/16] bg-gradient-to-br from-accent/20 to-accent-dark/10 rounded-[16px] relative overflow-hidden flex items-center justify-center">
                    {vid.thumbnail_url ? (
                      <img src={vid.thumbnail_url} alt={vid.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <Play size={24} className="text-accent-dark/50" />
                    )}
                    {vid.skin_type && (
                      <span className="absolute top-2 left-2 badge bg-white/90 text-text-primary text-[9px] px-1.5 py-0.5">
                        {vid.skin_type}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-primary line-clamp-1">{vid.user?.username || "—"}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span className="text-[10px] text-text-muted">{vid.overall_rating || "—"}</span>
                      {vid.usage_duration_weeks && (
                        <span className="text-[10px] text-text-muted">· {vid.usage_duration_weeks}w</span>
                      )}
                    </div>
                    {vid.video_url && (
                      <a
                        href={vid.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-[10px] text-accent-dark font-medium hover:underline"
                      >
                        Xem video →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
