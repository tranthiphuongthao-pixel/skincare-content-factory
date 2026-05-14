import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Star, Play } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const MOCK_VIDEOS = [
  { id: 1, product: "Some By Mi AHA BHA PHA", user: "@skincare.linh", rating: 5, skin: "Da dầu", gradient: "from-rose-100 to-pink-200" },
  { id: 2, product: "Laneige Water Sleeping Mask", user: "@beautyreview.vn", rating: 4, skin: "Da khô", gradient: "from-purple-100 to-violet-200" },
  { id: 3, product: "Innisfree Green Tea Serum", user: "@glowup.hana", rating: 5, skin: "Da hỗn hợp", gradient: "from-emerald-100 to-teal-200" },
  { id: 4, product: "The Ordinary Niacinamide", user: "@skintips.mia", rating: 4, skin: "Da nhạy cảm", gradient: "from-amber-100 to-orange-200" },
  { id: 5, product: "Klairs Vitamin C Serum", user: "@reviewskincare", rating: 5, skin: "Da thường", gradient: "from-yellow-100 to-lime-200" },
  { id: 6, product: "Cetaphil Moisturizing Cream", user: "@skinlove.hanoi", rating: 4, skin: "Da khô", gradient: "from-sky-100 to-blue-200" },
];

const FEATURES = [
  {
    icon: "🎬",
    title: "Script AI",
    desc: "Nhập tên sản phẩm, AI generate 2 script options trong 30 giây",
  },
  {
    icon: "📱",
    title: "Preview TikTok",
    desc: "Xem trước video trên phone mockup trước khi quay",
  },
  {
    icon: "🌸",
    title: "Cộng đồng",
    desc: "Public video, chia sẻ review thật với skincare lovers",
  },
];

function StarRating({ count }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          className={i < count ? "text-amber-400 fill-amber-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
}

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const featuresRef = useRef(null);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const scrollToFeatures = () =>
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });

  if (loading) return null;

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: "#2d2020" }}>

      {/* ── NAV ── */}
      <nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 40px",
          background: "rgba(45,32,32,0.35)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
          ✨ Content Factory
        </span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link
            to="/login"
            style={{
              color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 500,
              textDecoration: "none", padding: "8px 16px",
            }}
          >
            Đăng nhập
          </Link>
          <Link
            to="/login"
            style={{
              background: "linear-gradient(135deg,#d4a0c0,#a06080)",
              color: "#fff", fontSize: 14, fontWeight: 600,
              textDecoration: "none", padding: "9px 22px",
              borderRadius: 999, boxShadow: "0 4px 16px rgba(160,96,128,0.35)",
            }}
          >
            Bắt đầu →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        style={{
          height: "100vh", minHeight: 600,
          backgroundImage: `
            linear-gradient(135deg,rgba(45,32,32,0.72) 0%,rgba(160,96,128,0.52) 100%),
            url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&q=80')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "0 20px",
          position: "relative",
        }}
      >
        {/* Badge */}
        <span
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.3)",
            padding: "6px 16px", borderRadius: 999,
            fontSize: 13, color: "#fff",
            marginBottom: 28, display: "inline-block",
          }}
        >
          ✨ Dành cho skincare content creator
        </span>

        {/* H1 */}
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(36px, 5vw, 64px)",
            lineHeight: 1.2, fontWeight: 700, color: "#fff",
            margin: "0 0 20px", maxWidth: 700,
            whiteSpace: "pre-line",
          }}
        >
          {"Tạo video review\nskincare chuyên nghiệp\ntrong 5 phút"}
        </h1>

        {/* Sub */}
        <p
          style={{
            fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(255,255,255,0.85)",
            lineHeight: 1.6, margin: "0 0 36px", maxWidth: 480,
          }}
        >
          AI viết script, bạn chỉ cần quay.<br />
          Chia sẻ review thật với cộng đồng.
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            to="/login"
            style={{
              background: "linear-gradient(135deg,#d4a0c0,#a06080)",
              color: "#fff", fontWeight: 600, fontSize: 16,
              padding: "14px 32px", borderRadius: 999,
              textDecoration: "none",
              boxShadow: "0 8px 28px rgba(160,96,128,0.4)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(160,96,128,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 28px rgba(160,96,128,0.4)"; }}
          >
            Bắt đầu miễn phí →
          </Link>
          <button
            onClick={scrollToFeatures}
            style={{
              background: "transparent",
              color: "#fff", fontWeight: 600, fontSize: 16,
              padding: "14px 32px", borderRadius: 999,
              border: "2px solid rgba(255,255,255,0.85)",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            Xem reviews
          </button>
        </div>

        {/* Social proof */}
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, marginTop: 28 }}>
          🌸 Đã có 1,200+ scripts được tạo
        </p>

        {/* Scroll indicator */}
        <button
          onClick={scrollToFeatures}
          style={{
            position: "absolute", bottom: 32,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.7)",
            animation: "bounce 2s infinite",
          }}
        >
          <ChevronDown size={28} />
        </button>
      </section>

      {/* ── FEATURES ── */}
      <section
        ref={featuresRef}
        style={{ background: "#faf8f5", padding: "80px 20px", textAlign: "center" }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", color: "#a06080", textTransform: "uppercase", marginBottom: 12 }}>
          Tính năng
        </p>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.25,
            fontWeight: 700, color: "#2d2020",
            margin: "0 auto 56px", maxWidth: 500,
            whiteSpace: "pre-line",
          }}
        >
          {"Mọi thứ bạn cần để\ntạo content skincare"}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24, maxWidth: 1000, margin: "0 auto",
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: "#fff", borderRadius: 20,
                padding: "36px 28px", textAlign: "left",
                boxShadow: "0 2px 20px rgba(45,32,32,0.06)",
                border: "1px solid #e8ddd5",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(160,96,128,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 20px rgba(45,32,32,0.06)"; }}
            >
              <div
                style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: "linear-gradient(135deg,#f5e8f0,#e8d5e5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, marginBottom: 20,
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20, fontWeight: 700, margin: "0 0 10px", color: "#2d2020",
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "#8a7070", margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMMUNITY PREVIEW ── */}
      <section style={{ background: "#fff", padding: "80px 20px", textAlign: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.1em", color: "#a06080", textTransform: "uppercase", marginBottom: 12 }}>
          Cộng đồng
        </p>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 700,
            color: "#2d2020", margin: "0 auto 8px",
          }}
        >
          Reviews từ cộng đồng
        </h2>
        <p style={{ fontSize: 15, color: "#8a7070", margin: "0 auto 40px" }}>
          Những video review được chia sẻ gần đây
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 20, maxWidth: 960, margin: "0 auto 40px",
          }}
        >
          {MOCK_VIDEOS.map((v) => (
            <div
              key={v.id}
              style={{
                borderRadius: 16, overflow: "hidden",
                border: "1px solid #e8ddd5",
                background: "#fff",
                boxShadow: "0 2px 12px rgba(45,32,32,0.05)",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(45,32,32,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(45,32,32,0.05)"; }}
            >
              {/* Thumbnail 9:16 */}
              <div
                style={{
                  aspectRatio: "9/16",
                  background: `linear-gradient(135deg, var(--tw-gradient-stops, #f5f0eb, #e8ddd5))`,
                  backgroundImage: `linear-gradient(135deg,#f5f0eb 0%,#e8ddd5 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}
                className={`bg-gradient-to-br ${v.gradient}`}
              >
                <div
                  style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "rgba(255,255,255,0.75)",
                    backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Play size={16} style={{ color: "#a06080", marginLeft: 2 }} fill="#a06080" />
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "12px 14px" }}>
                <p style={{ fontSize: 12, color: "#8a7070", margin: "0 0 4px" }}>{v.user}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#2d2020", margin: "0 0 6px", lineHeight: 1.3 }}>
                  {v.product}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <StarRating count={v.rating} />
                  <span
                    style={{
                      fontSize: 10, fontWeight: 600,
                      background: "#f5e8f0", color: "#a06080",
                      padding: "2px 8px", borderRadius: 999,
                    }}
                  >
                    {v.skin}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Link
          to="/login"
          style={{
            display: "inline-block",
            color: "#a06080", fontWeight: 600, fontSize: 15,
            textDecoration: "none",
            padding: "12px 28px", borderRadius: 999,
            border: "2px solid #a06080",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#a06080"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a06080"; }}
        >
          Xem tất cả reviews →
        </Link>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          background: "linear-gradient(135deg,#f5f0eb 0%,#e8d5e5 100%)",
          padding: "80px 20px", textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.25,
            fontWeight: 700, color: "#2d2020",
            margin: "0 auto 16px", maxWidth: 500,
            whiteSpace: "pre-line",
          }}
        >
          {"Bắt đầu tạo content\nskincare ngay hôm nay"}
        </h2>
        <p style={{ fontSize: 16, color: "#8a7070", margin: "0 auto 36px" }}>
          Miễn phí. Không cần thẻ tín dụng.
        </p>
        <Link
          to="/login"
          style={{
            background: "linear-gradient(135deg,#d4a0c0,#a06080)",
            color: "#fff", fontWeight: 700, fontSize: 17,
            padding: "16px 40px", borderRadius: 999,
            textDecoration: "none",
            boxShadow: "0 8px 28px rgba(160,96,128,0.35)",
            display: "inline-block",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(160,96,128,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 28px rgba(160,96,128,0.35)"; }}
        >
          Tạo tài khoản miễn phí →
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          background: "#2d2020", padding: "48px 40px 32px",
          color: "rgba(255,255,255,0.7)",
        }}
      >
        <div
          style={{
            maxWidth: 960, margin: "0 auto",
            display: "flex", flexWrap: "wrap",
            justifyContent: "space-between", alignItems: "flex-start",
            gap: 24, marginBottom: 32,
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20, fontWeight: 700,
                color: "#fff", margin: "0 0 6px",
              }}
            >
              ✨ Content Factory
            </p>
            <p style={{ fontSize: 13, fontStyle: "italic", margin: 0, opacity: 0.6 }}>
              Skincare TikTok content creator
            </p>
          </div>
          <nav style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
            {["Về chúng tôi", "Điều khoản", "Bảo mật"].map(link => (
              <a
                key={link}
                href="#"
                style={{
                  color: "rgba(255,255,255,0.65)", fontSize: 14,
                  textDecoration: "none", transition: "color 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
              >
                {link}
              </a>
            ))}
          </nav>
        </div>
        <div
          style={{
            maxWidth: 960, margin: "0 auto",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 20, fontSize: 13,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          © 2024 Content Factory. All rights reserved.
        </div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(8px); }
        }
      `}</style>
    </div>
  );
}
