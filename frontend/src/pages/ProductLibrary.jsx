import { useState, useEffect } from "react";
import { Plus, Search, Package, Star } from "lucide-react";
import api from "../api/client";
import ProductCard from "../components/ProductCard";

const CATEGORIES = [
  { value: "all", label: "Tất cả" },
  { value: "serum", label: "Serum" },
  { value: "moisturizer", label: "Moisturizer" },
  { value: "cleanser", label: "Cleanser" },
  { value: "toner", label: "Toner" },
  { value: "sunscreen", label: "SPF" },
  { value: "mask", label: "Mask" },
  { value: "eye_care", label: "Eye Cream" },
  { value: "other", label: "Exfoliant" },
  { value: "other", label: "Oil" },
];
const SOURCE_TYPES = [
  { value: "own_use", label: "Đã dùng thật" },
  { value: "researched", label: "Đã nghiên cứu" },
];

export default function ProductLibrary() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({
    name: "", brand: "", category: "Serum", price: "", ingredients_highlight: "",
    personal_rating: "", personal_notes: "", affiliate_link: "", image_url: "",
    source_type: "own_use", status: "active",
  });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products/");
      setProducts(res.data?.items || (Array.isArray(res.data) ? res.data : []));
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: form.price ? parseFloat(form.price) : null, personal_rating: form.personal_rating ? parseInt(form.personal_rating) : null };
    if (editProduct) {
      await api.put(`/products/${editProduct.id}`, payload);
    } else {
      await api.post("/products/", payload);
    }
    setShowForm(false);
    setEditProduct(null);
    setForm({ name: "", brand: "", category: "Serum", price: "", ingredients_highlight: "", personal_notes: "", affiliate_link: "", image_url: "", source_type: "own_use", status: "active" });
    fetchProducts();
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setForm({ ...product, price: product.price?.toString() ?? "", personal_rating: product.personal_rating?.toString() ?? "" });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Xóa sản phẩm này?")) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  const filtered = products.filter(p =>
    (category === "all" || p.category === category) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thư viện sản phẩm</h1>
          <p className="text-text-secondary text-sm mt-1">{products.length} sản phẩm</p>
        </div>
        <button onClick={() => { setEditProduct(null); setShowForm(true); }} className="btn-primary">
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm sản phẩm..." className="input pl-9" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setCategory(cat.value)} className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${category === cat.value ? "bg-accent text-white" : "bg-card text-text-secondary hover:text-white border border-border"}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-card rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Không tìm thấy sản phẩm nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => <ProductCard key={p.id} product={p} onEdit={handleEdit} onDelete={handleDelete} />)}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-5">{editProduct ? "Chỉnh sửa" : "Thêm sản phẩm mới"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-sm text-text-secondary mb-1 block">Tên sản phẩm *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" required placeholder="CeraVe Moisturizing Cream" />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Thương hiệu</label>
                  <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="input" placeholder="CeraVe" />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Danh mục</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input">
                    {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Giá (VND)</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="input" placeholder="250000" />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Đánh giá (1-5)</label>
                  <input type="number" min="1" max="5" value={form.personal_rating} onChange={e => setForm({...form, personal_rating: e.target.value})} className="input" placeholder="4" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-text-secondary mb-1 block">Thành phần nổi bật</label>
                  <input value={form.ingredients_highlight} onChange={e => setForm({...form, ingredients_highlight: e.target.value})} className="input" placeholder="Ceramide, Hyaluronic Acid, Niacinamide" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-text-secondary mb-1 block">Ghi chú cá nhân</label>
                  <textarea value={form.personal_notes} onChange={e => setForm({...form, personal_notes: e.target.value})} className="input resize-none" rows={3} placeholder="Cảm nhận sau khi dùng..." />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-text-secondary mb-1 block">Affiliate link</label>
                  <input value={form.affiliate_link} onChange={e => setForm({...form, affiliate_link: e.target.value})} className="input" placeholder="https://shopee.vn/..." />
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-text-secondary mb-1 block">URL hình ảnh</label>
                  <input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="input" placeholder="https://..." />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Nguồn</label>
                  <select value={form.source_type} onChange={e => setForm({...form, source_type: e.target.value})} className="input">
                    {SOURCE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1 block">Trạng thái</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="input">
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 justify-center">Hủy</button>
                <button type="submit" className="btn-primary flex-1 justify-center">
                  {editProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
