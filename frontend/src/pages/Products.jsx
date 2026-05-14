import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Star, Sparkles, ChevronRight } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["Tất cả", "Serum", "Moisturizer", "Cleanser", "Toner", "Sunscreen", "Mask", "Khác"];

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
          <Link to="/products" className="text-sm font-medium text-accent-dark">Reviews cộng đồng</Link>
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

function ProductCard({ product }) {
  const navigate = useNavigate();
  const rating = product.avg_overall_rating;
  return (
    <div className="bg-white border border-border rounded-[20px] overflow-hidden hover:border-accent/50 hover:shadow-[0_8px_24px_rgba(212,160,192,0.12)] transition-all flex flex-col shrink-0 w-56">
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 bg-gradient-to-br from-accent/20 to-accent-dark/10 flex items-center justify-center text-4xl">
          ✨
        </div>
      )}
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <h3 className="font-semibold text-sm text-text-primary leading-tight line-clamp-2">{product.name}</h3>
          <p className="text-xs text-text-muted mt-0.5">{product.brand?.name || product.brand_name || "—"}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span className="text-xs font-medium text-text-primary">{rating ? rating.toFixed(1) : "—"}</span>
          <span className="text-xs text-text-muted">({product.review_count || 0} reviews)</span>
        </div>
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="badge bg-accent/10 text-accent-dark text-[10px] px-2 py-0.5">{product.category || "—"}</span>
          {product.price_range && <span className="text-xs text-text-muted">{product.price_range}</span>}
        </div>
        <button
          onClick={() => navigate(`/products/${product.slug}`)}
          className="w-full mt-1 py-2 rounded-[12px] border border-border text-xs font-medium text-text-primary hover:border-accent hover:text-accent-dark transition-all"
        >
          Xem review →
        </button>
      </div>
    </div>
  );
}

export default function Products() {
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchProducts = (searchVal, categoryVal) => {
    setLoading(true);
    const params = { limit: 100 };
    if (searchVal) params.search = searchVal;
    if (categoryVal && categoryVal !== "Tất cả") params.category = categoryVal;
    api.get("/products", { params })
      .then(res => setProducts(res.data?.items || res.data || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get("/brands").then(res => setBrands(res.data || [])).catch(() => setBrands([]));
    fetchProducts("", "Tất cả");
  }, []);

  const handleSearchChange = (val) => {
    setSearch(val);
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => fetchProducts(val, category), 400);
    setSearchTimeout(t);
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    fetchProducts(search, cat);
  };

  // Group products by brand
  const brandMap = {};
  products.forEach(p => {
    const brandName = p.brand?.name || p.brand_name || "Khác";
    if (!brandMap[brandName]) brandMap[brandName] = [];
    brandMap[brandName].push(p);
  });

  const brandSections = search || category !== "Tất cả"
    ? [{ name: "Kết quả tìm kiếm", products }]
    : brands.map(b => ({
        ...b,
        products: brandMap[b.name] || [],
      })).filter(b => b.products.length > 0);

  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNav />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-6">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-display font-semibold text-text-primary mb-3">
            Reviews từ cộng đồng
          </h1>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Khám phá review skincare thật sự từ những người đã dùng. Không quảng cáo, chỉ trải nghiệm thật.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  category === cat
                    ? "bg-gradient-to-r from-accent to-accent-dark text-white border-transparent shadow-[0_4px_12px_rgba(212,160,192,0.3)]"
                    : "bg-white border-border text-text-muted hover:border-accent hover:text-accent-dark"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative max-w-md mx-auto w-full">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Tìm sản phẩm..."
              className="input pl-10 focus:border-accent"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="text-6xl">🔍</span>
            <p className="text-text-muted text-lg">Không tìm thấy sản phẩm nào</p>
            <button
              onClick={() => { setSearch(""); handleCategoryChange("Tất cả"); }}
              className="btn-secondary text-sm"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {brandSections.map(section => (
              <div key={section.name || section.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {section.logo_url ? (
                      <img src={section.logo_url} alt={section.name} className="w-9 h-9 rounded-xl object-cover border border-border" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-bg-surface-2 flex items-center justify-center text-lg">
                        ✨
                      </div>
                    )}
                    <div>
                      <h2 className="font-display text-xl font-semibold text-text-primary">{section.name}</h2>
                      {section.country_of_origin && (
                        <p className="text-xs text-text-muted">{section.country_of_origin}</p>
                      )}
                    </div>
                  </div>
                  {section.slug && (
                    <Link
                      to={`/products?brand=${section.slug}`}
                      className="flex items-center gap-1 text-sm text-accent-dark font-medium hover:underline"
                    >
                      Xem tất cả <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
                <div className="flex gap-4 overflow-x-auto pb-3 -mx-1 px-1" style={{ scrollbarWidth: "thin" }}>
                  {section.products.map(p => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
