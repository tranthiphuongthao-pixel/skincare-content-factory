import { useState, useEffect } from "react";
import { Sparkles, Wand2, Copy, Save, RefreshCw } from "lucide-react";
import api from "../api/client";
import PhonePreview from "../components/PhonePreview";

const TOPIC_TYPES = [
  { value: "honest_review", label: "Honest Review", emoji: "⭐" },
  { value: "ingredient_breakdown", label: "Phân tích thành phần", emoji: "🔬" },
  { value: "before_after", label: "Before/After", emoji: "✨" },
  { value: "comparison", label: "So sánh sản phẩm", emoji: "⚖️" },
  { value: "routine_feature", label: "Giới thiệu trong routine", emoji: "🌿" },
  { value: "red_flag_check", label: "Kiểm tra Red Flag", emoji: "🚩" },
  { value: "dupe_finder", label: "Tìm Dupe rẻ hơn", emoji: "💰" },
  { value: "community_review", label: "Tổng hợp Community", emoji: "👥" },
];

const FORMAT_TYPES = [
  { value: "text_on_screen", label: "Text on Screen", desc: "Chữ hiện trên màn hình" },
  { value: "voiceover", label: "Voiceover", desc: "Lồng tiếng" },
];

export default function ScriptGenerator() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [topicType, setTopicType] = useState("honest_review");
  const [formatType, setFormatType] = useState("text_on_screen");
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState(null);
  const [hookAlts, setHookAlts] = useState(null);
  const [loadingHook, setLoadingHook] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get("/products/?status=active").then(r => setProducts(r.data?.items || (Array.isArray(r.data) ? r.data : []))).catch(() => {});
  }, []);

  const generate = async () => {
    if (!selectedProduct) return alert("Vui lòng chọn sản phẩm!");
    setLoading(true);
    setScript(null);
    setHookAlts(null);
    setSaved(false);
    try {
      const res = await api.post("/generator/script", {
        product_id: parseInt(selectedProduct),
        format_type: formatType,
        topic_type: topicType,
      });
      setScript(res.data);
    } catch (err) {
      alert("Lỗi tạo script: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const improveHook = async () => {
    if (!script) return;
    setLoadingHook(true);
    const product = products.find(p => p.id === parseInt(selectedProduct));
    try {
      const res = await api.post("/generator/improve-hook", {
        hook: script.hook,
        product_name: product?.name || "",
      });
      setHookAlts(res.data);
    } finally {
      setLoadingHook(false);
    }
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
  };

  const product = products.find(p => p.id === parseInt(selectedProduct));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Script Generator</h1>
        <p className="text-text-secondary text-sm mt-1">Tạo TikTok script bằng AI cho kênh skincare</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="card space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><Sparkles size={16} className="text-accent" /> Cài đặt</h2>

            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Sản phẩm</label>
              <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="input">
                <option value="">Chọn sản phẩm...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.brand || "?"}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-2 block">Loại content</label>
              <div className="grid grid-cols-2 gap-2">
                {TOPIC_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTopicType(t.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${topicType === t.value ? "border-accent bg-accent/10 text-white" : "border-border bg-surface text-text-secondary hover:border-accent/50"}`}
                  >
                    <span className="text-base">{t.emoji}</span>
                    <p className="text-xs font-medium mt-1">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-text-secondary mb-2 block">Format</label>
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_TYPES.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFormatType(f.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${formatType === f.value ? "border-highlight bg-highlight/10 text-white" : "border-border bg-surface text-text-secondary hover:border-highlight/50"}`}
                  >
                    <p className="font-medium text-sm">{f.label}</p>
                    <p className="text-xs mt-0.5">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generate} disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang tạo...</>
              ) : (
                <><Wand2 size={16} /> Tạo Script với AI</>
              )}
            </button>
          </div>

          {script && (
            <div className="card space-y-4">
              <h2 className="font-semibold">Kết quả</h2>

              <div className="bg-surface rounded-xl p-4">
                <div className="flex items-start justify-between mb-1">
                  <label className="text-xs text-accent font-semibold uppercase">Hook (3s đầu)</label>
                  <div className="flex gap-2">
                    <button onClick={improveHook} disabled={loadingHook} className="text-xs text-text-secondary hover:text-accent flex items-center gap-1">
                      <RefreshCw size={12} className={loadingHook ? "animate-spin" : ""} /> Cải thiện
                    </button>
                    <button onClick={() => copyText(script.hook)} className="text-xs text-text-secondary hover:text-accent"><Copy size={12} /></button>
                  </div>
                </div>
                <p className="text-sm font-medium">{script.hook}</p>
                {hookAlts?.alternatives && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    <p className="text-xs text-text-secondary">Alternatives:</p>
                    {hookAlts.alternatives.map((h, i) => (
                      <div key={i} className="flex items-center justify-between bg-card rounded-lg px-3 py-2">
                        <p className="text-xs">{h}</p>
                        <button onClick={() => setScript({...script, hook: h})} className="text-xs text-accent hover:underline ml-2">Dùng</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-surface rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-accent font-semibold uppercase">Scenes</label>
                </div>
                <div className="space-y-3">
                  {script.scenes?.map((scene, i) => (
                    <div key={i} className="border-l-2 border-accent/30 pl-3">
                      <p className="text-xs text-text-secondary">{scene.timestamp}</p>
                      <p className="text-xs text-highlight">{scene.visual_direction}</p>
                      {scene.text_on_screen && <p className="text-xs font-medium mt-0.5">{scene.text_on_screen}</p>}
                      {scene.voiceover && <p className="text-xs italic mt-0.5 text-text-secondary">"{scene.voiceover}"</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-accent font-semibold uppercase">Caption</label>
                  <button onClick={() => copyText(script.caption)} className="text-xs text-text-secondary hover:text-accent"><Copy size={12} /></button>
                </div>
                <p className="text-sm">{script.caption}</p>
              </div>

              {script.hashtags && (
                <div className="bg-surface rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-accent font-semibold uppercase">Hashtags</label>
                    <button onClick={() => copyText(script.hashtags.map(h => `#${h}`).join(" "))} className="text-xs text-text-secondary hover:text-accent"><Copy size={12} /></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {script.hashtags.map((tag, i) => (
                      <span key={i} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {script.music_vibe && (
                <div className="flex items-center gap-3 bg-surface rounded-xl p-3">
                  <span className="text-xl">🎵</span>
                  <div>
                    <p className="text-xs text-text-secondary">Music vibe</p>
                    <p className="text-sm font-medium">{script.music_vibe}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-6 self-start">
          <PhonePreview script={script} product={product} formatType={formatType} />
        </div>
      </div>
    </div>
  );
}
