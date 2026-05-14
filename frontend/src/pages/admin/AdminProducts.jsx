import { useState, useEffect } from "react";
import { Plus, X, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../api/client";

const CATEGORIES = ["Serum", "Moisturizer", "Cleanser", "Toner", "Sunscreen", "Mask", "Khác"];

function AddBrandModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    country_of_origin: "",
    logo_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleNameChange = (v) => {
    setForm(f => ({
      ...f,
      name: v,
      slug: f.slug || v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { setError("Tên brand không được để trống"); return; }
    setLoading(true);
    try {
      const res = await api.post("/brands", form);
      onAdded(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Thêm brand thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] border border-border w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-display text-lg font-semibold">Thêm brand mới</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}
          <div>
            <label className="text-sm text-text-muted font-medium mb-1.5 block">Tên brand *</label>
            <input
              className="input focus:border-accent"
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="VD: The Ordinary"
              required
            />
          </div>
          <div>
            <label className="text-sm text-text-muted font-medium mb-1.5 block">Slug</label>
            <input
              className="input focus:border-accent"
              value={form.slug}
              onChange={e => set("slug", e.target.value)}
              placeholder="the-ordinary"
            />
          </div>
          <div>
            <label className="text-sm text-text-muted font-medium mb-1.5 block">Quốc gia</label>
            <input
              className="input focus:border-accent"
              value={form.country_of_origin}
              onChange={e => set("country_of_origin", e.target.value)}
              placeholder="UK, Korea, USA..."
            />
          </div>
          <div>
            <label className="text-sm text-text-muted font-medium mb-1.5 block">Mô tả</label>
            <textarea
              className="input resize-none h-20 focus:border-accent"
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Mô tả ngắn về brand..."
            />
          </div>
          <div>
            <label className="text-sm text-text-muted font-medium mb-1.5 block">Logo URL</label>
            <input
              className="input focus:border-accent"
              value={form.logo_url}
              onChange={e => set("logo_url", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Hủy</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-60">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : "Thêm brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");

  const LIMIT = 20;
  const totalPages = Math.ceil(total / LIMIT);

  const fetchProducts = (p = page, cat = categoryFilter) => {
    setLoading(true);
    const params = { page: p, limit: LIMIT };
    if (cat) params.category = cat;
    api.get("/products", { params })
      .then(res => {
        setProducts(res.data?.items || []);
        setTotal(res.data?.total || 0);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts(page, categoryFilter);
  }, [page, categoryFilter]);

  const handleToggleVerified = async (productId, currentVerified) => {
    setToggling(productId);
    try {
      const res = await api.put(`/admin/products/${productId}/toggle-verified`);
      setProducts(ps => ps.map(p => p.id === productId ? { ...p, is_verified: res.data.is_verified } : p));
    } catch {
      // ignore
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-8 bg-bg-primary">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-semibold text-text-primary">Quản lý Sản phẩm</h1>
            <p className="text-text-muted text-sm mt-1">{total} sản phẩm</p>
          </div>
          <button onClick={() => setShowAddBrand(true)} className="btn-primary gap-2">
            <Plus size={16} /> Thêm brand mới
          </button>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setCategoryFilter(""); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              !categoryFilter ? "bg-gradient-to-r from-accent to-accent-dark text-white border-transparent" : "bg-white border-border text-text-muted hover:border-accent/40"
            }`}
          >
            Tất cả
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                categoryFilter === cat ? "bg-gradient-to-r from-accent to-accent-dark text-white border-transparent" : "bg-white border-border text-text-muted hover:border-accent/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="bg-white border border-border rounded-[20px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-bg-surface-2">
                <tr>
                  {["Image", "Tên sản phẩm", "Brand", "Category", "Reviews", "Videos", "Verified", "Actions"].map(h => (
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
                          <div className="h-4 bg-bg-surface-2 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-text-muted">
                      Không có sản phẩm nào
                    </td>
                  </tr>
                ) : products.map(product => (
                  <tr key={product.id} className="border-b border-border hover:bg-bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-[10px] bg-bg-surface-2 overflow-hidden flex items-center justify-center shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>✨</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary max-w-[180px] truncate">{product.name}</p>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{product.brand?.name || product.brand_name || "—"}</td>
                    <td className="px-4 py-3">
                      {product.category && (
                        <span className="badge bg-accent/10 text-accent-dark text-[10px]">{product.category}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted">{product.review_count || 0}</td>
                    <td className="px-4 py-3 text-text-muted">{product.video_count || 0}</td>
                    <td className="px-4 py-3">
                      {product.is_verified ? (
                        <CheckCircle size={16} className="text-emerald-500" />
                      ) : (
                        <XCircle size={16} className="text-text-muted/40" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleVerified(product.id, product.is_verified)}
                        disabled={toggling === product.id}
                        className={`flex items-center gap-1 py-1.5 px-2.5 rounded-[10px] border text-[11px] font-medium transition-all disabled:opacity-50 ${
                          product.is_verified
                            ? "border-red-200 text-red-500 hover:bg-red-50"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {toggling === product.id ? (
                          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : product.is_verified ? (
                          <>Unverify</>
                        ) : (
                          <>Verify</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-text-muted">
                Trang {page} / {totalPages} — {total} sản phẩm
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

      {showAddBrand && (
        <AddBrandModal
          onClose={() => setShowAddBrand(false)}
          onAdded={() => { setShowAddBrand(false); fetchProducts(1, categoryFilter); }}
        />
      )}
    </div>
  );
}
