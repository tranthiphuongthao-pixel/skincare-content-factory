import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Plus, X, Wand2, ImagePlus } from "lucide-react";
import api from "../api/client";
import SafeImage from "../components/SafeImage";

const CATEGORIES = [
  { value: "serum", label: "Serum" },
  { value: "moisturizer", label: "Moisturizer" },
  { value: "cleanser", label: "Cleanser" },
  { value: "toner", label: "Toner" },
  { value: "sunscreen", label: "Sunscreen" },
  { value: "mask", label: "Mask" },
  { value: "eye_care", label: "Eye Cream" },
  { value: "essence", label: "Essence" },
  { value: "other", label: "Khác" },
];
const PRICE_RANGES = [
  { value: "under_200k", label: "Under 200k" },
  { value: "200k_500k", label: "200k - 500k" },
  { value: "500k_1m", label: "500k - 1M" },
  { value: "over_1m", label: "Over 1M" },
];
const SKIN_CONCERNS = ["Acne", "Dry skin", "Oily skin", "Dark spots", "Anti-aging", "Sensitive", "Brightening"];
const SKIN_TYPES = ["Oily", "Dry", "Combination", "Sensitive", "Normal"];

function AddProductModal({ brands: rawBrands, onClose, onAdded }) {
  const brands = Array.isArray(rawBrands) ? rawBrands : [];
  const [form, setForm] = useState({
    brand_id: "",
    name: "",
    category: "",
    price_range: "",
    key_ingredients: [],
    skin_concerns: [],
    suitable_skin_types: [],
    image_url: "",
    affiliate_link: "",
  });
  const [ingredientInput, setIngredientInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k, v) => setForm(f => ({
    ...f,
    [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v],
  }));

  const addIngredient = () => {
    const val = ingredientInput.trim();
    if (val && !form.key_ingredients.includes(val)) {
      setForm(f => ({ ...f, key_ingredients: [...f.key_ingredients, val] }));
      setIngredientInput("");
    }
  };

  const handleImageFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Ảnh tối đa 5MB"); return; }
    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/products/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set("image_url", res.data.image_url);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload ảnh thất bại");
      setImagePreview("");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category) { setError("Điền tên và danh mục sản phẩm"); return; }
    setLoading(true);
    // Strip empty strings so FastAPI Optional[int] / Optional[str] fields don't 422
    const payload = {
      name: form.name,
      category: form.category,
      key_ingredients: Array.isArray(form.key_ingredients) ? form.key_ingredients : [],
      skin_concerns: Array.isArray(form.skin_concerns) ? form.skin_concerns : [],
      suitable_skin_types: Array.isArray(form.suitable_skin_types) ? form.suitable_skin_types : [],
    };
    if (form.brand_id) payload.brand_id = parseInt(form.brand_id, 10);
    if (form.price_range) payload.price_range = form.price_range;
    if (form.image_url) payload.image_url = form.image_url;
    if (form.affiliate_link) payload.affiliate_link = form.affiliate_link;
    try {
      const res = await api.post("/products/", payload);
      onAdded(res.data);
    } catch (err) {
      const msg = err.response?.data?.detail;
      setError(typeof msg === "string" ? msg : "Thêm sản phẩm thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white rounded-t-[24px] z-10">
          <h3 className="font-display text-lg font-semibold">Thêm sản phẩm mới</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <div>
            <label className="text-sm text-text-muted font-medium mb-1.5 block">Brand</label>
            <select className="input focus:border-accent" value={form.brand_id} onChange={e => set("brand_id", e.target.value)}>
              <option value="">Chọn brand</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm text-text-muted font-medium mb-1.5 block">Tên sản phẩm *</label>
            <input
              className="input focus:border-accent"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="VD: Vitamin C Serum 20%"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-text-muted font-medium mb-1.5 block">Danh mục *</label>
              <select className="input focus:border-accent" value={form.category} onChange={e => set("category", e.target.value)} required>
                <option value="">Chọn danh mục</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-text-muted font-medium mb-1.5 block">Khoảng giá</label>
              <select className="input focus:border-accent" value={form.price_range} onChange={e => set("price_range", e.target.value)}>
                <option value="">Chọn</option>
                {PRICE_RANGES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted font-medium mb-1.5 block">Thành phần chính</label>
            <div className="flex gap-2 mb-2">
              <input
                className="input flex-1 focus:border-accent"
                value={ingredientInput}
                onChange={e => setIngredientInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addIngredient())}
                placeholder="VD: Niacinamide, Retinol..."
              />
              <button
                type="button"
                onClick={addIngredient}
                className="btn-secondary px-3 py-2 rounded-[12px] shrink-0"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {form.key_ingredients.map(ing => (
                <span key={ing} className="badge bg-blue-50 text-blue-600 border border-blue-100 text-xs gap-1">
                  {ing}
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, key_ingredients: f.key_ingredients.filter(x => x !== ing) }))}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted font-medium mb-1.5 block">Vấn đề da giải quyết</label>
            <div className="flex flex-wrap gap-1.5">
              {SKIN_CONCERNS.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => toggleArr("skin_concerns", c)}
                  className={`badge text-xs border transition-all ${form.skin_concerns.includes(c) ? "bg-accent/20 text-accent-dark border-accent/30" : "bg-bg-surface-2 text-text-muted border-border hover:border-accent/30"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted font-medium mb-1.5 block">Phù hợp với loại da</label>
            <div className="flex flex-wrap gap-1.5">
              {SKIN_TYPES.map(t => (
                <button
                  key={t} type="button"
                  onClick={() => toggleArr("suitable_skin_types", t)}
                  className={`badge text-xs border transition-all ${form.suitable_skin_types.includes(t) ? "bg-accent/20 text-accent-dark border-accent/30" : "bg-bg-surface-2 text-text-muted border-border hover:border-accent/30"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted font-medium mb-1.5 block">Ảnh sản phẩm (tùy chọn)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={e => handleImageFile(e.target.files?.[0])}
            />
            {imagePreview || form.image_url ? (
              <div className="relative w-full h-36 rounded-[14px] overflow-hidden border border-border group">
                <img
                  src={imagePreview || form.image_url}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setImagePreview(""); set("image_url", ""); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 px-3 py-1.5 rounded-[10px] bg-black/60 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Đổi ảnh
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-28 rounded-[14px] border-2 border-dashed border-border hover:border-accent/50 flex flex-col items-center justify-center gap-2 text-text-muted hover:text-accent-dark transition-all"
              >
                <ImagePlus size={22} />
                <span className="text-xs font-medium">Tải ảnh lên (jpg, png — tối đa 5MB)</span>
              </button>
            )}
          </div>

          <div>
            <label className="text-sm text-text-muted font-medium mb-1.5 block">Affiliate link (tùy chọn)</label>
            <input
              className="input focus:border-accent"
              value={form.affiliate_link}
              onChange={e => set("affiliate_link", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Hủy</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-60">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : "Thêm sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyProducts() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploadingFor, setUploadingFor] = useState(null);

  const FREE_PLAN_LIMIT = 10;

  const handleImageChange = async (productId, file) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { alert("Ảnh tối đa 3MB"); return; }
    setUploadingFor(productId);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await api.post("/products/upload-image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const res = await api.put(`/products/${productId}`, { image_url: up.data.image_url });
      setProducts(ps => ps.map(p => p.id === productId ? res.data : p));
    } catch (err) {
      alert(err.response?.data?.detail || "Đổi ảnh thất bại");
    } finally {
      setUploadingFor(null);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Xóa sản phẩm này?")) return;
    try {
      await api.delete(`/products/${productId}`);
      setProducts(ps => ps.filter(p => p.id !== productId));
    } catch (err) {
      alert(err.response?.data?.detail || "Xóa thất bại");
    }
  };

  useEffect(() => {
    Promise.all([
      api.get("/products/my").catch(() => ({ data: { items: [] } })),
      api.get("/brands/").catch(() => ({ data: [] })),
    ]).then(([prodRes, brandRes]) => {
      const prodItems = Array.isArray(prodRes.data)
        ? prodRes.data
        : Array.isArray(prodRes.data?.items) ? prodRes.data.items : [];
      const brandItems = Array.isArray(brandRes.data)
        ? brandRes.data
        : Array.isArray(brandRes.data?.items) ? brandRes.data.items : [];
      setProducts(prodItems);
      setBrands(brandItems);
    }).finally(() => setLoading(false));
  }, []);

  const handleAdded = (product) => {
    setProducts(ps => [...ps, product]);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen p-6 md:p-8 bg-bg-primary">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-semibold text-text-primary">Sản phẩm của tôi</h1>
            <p className="text-text-muted text-sm mt-1">
              {products.length}/{FREE_PLAN_LIMIT} sản phẩm (free plan)
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={products.length >= FREE_PLAN_LIMIT}
            className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> Thêm sản phẩm
          </button>
        </div>

        {/* Free plan bar */}
        <div className="bg-white border border-border rounded-[16px] p-4 mb-6 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-text-primary">Dung lượng sản phẩm</span>
              <span className="text-sm text-text-muted">{products.length}/{FREE_PLAN_LIMIT}</span>
            </div>
            <div className="h-2 bg-bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-dark transition-all"
                style={{ width: `${Math.min((products.length / FREE_PLAN_LIMIT) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-border rounded-[20px] p-4 animate-pulse">
                <div className="h-32 bg-bg-surface-2 rounded-[14px] mb-3" />
                <div className="h-4 bg-bg-surface-2 rounded mb-2" />
                <div className="h-3 bg-bg-surface-2 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="text-6xl">📦</span>
            <p className="text-text-muted text-lg">Chưa có sản phẩm nào</p>
            <p className="text-text-muted text-sm">Thêm sản phẩm để bắt đầu tạo content</p>
            <button onClick={() => setShowModal(true)} className="btn-primary gap-2">
              <Plus size={16} /> Thêm sản phẩm đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map(product => (
              <div key={product.id} className="bg-white border border-border rounded-[20px] overflow-hidden hover:border-accent/40 hover:shadow-[0_8px_24px_rgba(160,96,128,0.08)] transition-all flex flex-col">
                <div className="relative group">
                  <SafeImage
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-36 object-cover bg-gradient-to-br from-accent/20 to-accent-dark/10"
                    fallback={<span className="text-4xl">✨</span>}
                  />
                  {uploadingFor === product.id && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <label className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-[10px] bg-black/70 text-white text-[11px] font-medium cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <ImagePlus size={12} />
                    {product.image_url ? "Đổi ảnh" : "Thêm ảnh"}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={e => handleImageChange(product.id, e.target.files?.[0])}
                    />
                  </label>
                </div>
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary leading-tight line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">{product.brand?.name || product.brand_name || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.category && (
                      <span className="badge bg-accent/10 text-accent-dark text-[10px]">{product.category}</span>
                    )}
                    {product.price_range && (
                      <span className="text-xs text-text-muted">{product.price_range}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted mt-auto">
                    <span>{product.review_count || 0} reviews</span>
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    <Link
                      to="/create"
                      state={{ product }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[12px] bg-gradient-to-r from-accent/10 to-accent-dark/5 border border-accent/20 text-xs font-medium text-accent-dark hover:from-accent/20 hover:to-accent-dark/10 transition-all"
                    >
                      <Wand2 size={12} /> Tạo script
                    </Link>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="px-2.5 py-2 rounded-[12px] border border-border text-xs text-red-400 hover:border-red-200 hover:bg-red-50 transition-all"
                      title="Xóa sản phẩm"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddProductModal
          brands={brands}
          onClose={() => setShowModal(false)}
          onAdded={handleAdded}
        />
      )}
    </div>
  );
}
