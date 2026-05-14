import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Check, X, RefreshCw, Plus, ChevronRight, ChevronLeft,
  Sparkles, Copy, Wand2, ClipboardCopy, Package,
  Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import api from "../api/client";
import PhonePreview from "../components/PhonePreview";

// ─── Script wizard constants ───────────────────────────────────────────────
const TOPICS = [
  { value: "honest_review",       icon: "📝", label: "Honest Review" },
  { value: "ingredient_breakdown",icon: "🧪", label: "Phân tích thành phần" },
  { value: "before_after",        icon: "📸", label: "Before & After" },
  { value: "comparison",          icon: "⚖️", label: "So sánh sản phẩm" },
  { value: "routine_feature",     icon: "💆", label: "Trong routine" },
  { value: "red_flag_check",      icon: "🚩", label: "Kiểm tra red flags" },
  { value: "dupe_finder",         icon: "💸", label: "Tìm dupe rẻ hơn" },
  { value: "community_review",    icon: "👥", label: "Tổng hợp cộng đồng" },
];

const POLICY_BADGE = {
  safe:      { label: "🟢 An toàn",  cls: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  warning:   { label: "🟡 Cảnh báo", cls: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  violation: { label: "🔴 Vi phạm",  cls: "bg-red-500/10 text-red-500 border-red-200" },
};

const CREATE_VIDEO_DRAFT_KEY = "createVideoDraft_v3";

const SCENE_LABEL_COLORS = {
  "HOOK":         "bg-pink-100 text-pink-700",
  "PRODUCT INTRO":"bg-purple-100 text-purple-700",
  "TEXTURE":      "bg-blue-100 text-blue-700",
  "RESULT":       "bg-emerald-100 text-emerald-700",
  "VERDICT":      "bg-amber-100 text-amber-700",
  "CTA":          "bg-accent/15 text-accent-dark",
};

// ─── Scripts list constants ────────────────────────────────────────────────
const STATUS_COLORS = {
  draft:  "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  ready:  "bg-blue-500/10 text-blue-600 border-blue-200",
  posted: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

const SCRIPT_FILTER_TABS = ["Tất cả", "Draft", "Ready", "Posted"];

const TOPIC_LABELS = {
  honest_review:        "Honest Review",
  ingredient_breakdown: "Phân tích thành phần",
  before_after:         "Before & After",
  comparison:           "So sánh",
  routine_feature:      "Trong routine",
  red_flag_check:       "Red flags",
  dupe_finder:          "Tìm dupe",
  community_review:     "Cộng đồng",
};

// ─── Stepper ───────────────────────────────────────────────────────────────
function Stepper({ step }) {
  const steps = ["Sản phẩm", "Topic", "Generate", "Chi tiết"];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = num === step;
        const done = num < step;
        return (
          <div key={num} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${active ? "text-accent-dark" : done ? "text-emerald-500" : "text-text-muted"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                active ? "bg-gradient-to-br from-accent to-accent-dark text-white shadow-[0_4px_12px_rgba(212,160,192,0.3)]"
                : done ? "bg-emerald-500 text-white"
                : "bg-bg-surface-2 text-text-muted"
              }`}>
                {done ? <Check size={12} /> : num}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${active ? "text-accent-dark" : done ? "text-emerald-500" : "text-text-muted"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px mx-1 ${num < step ? "bg-emerald-300" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Improve Hook modal ────────────────────────────────────────────────────
function ImproveHookModal({ hook, productName, onClose }) {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    api.post("/generator/improve-hook", { hook, product_name: productName })
      .then(res => setAlternatives(res.data?.alternatives || res.data || []))
      .catch(() => setAlternatives([]))
      .finally(() => setLoading(false));
  }, [hook, productName]);

  const copyHook = (h, i) => {
    navigator.clipboard.writeText(h);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] border border-border w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-display text-lg font-semibold">Cải thiện Hook</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>
        <div className="p-6">
          <div className="bg-bg-surface-2 rounded-[16px] p-4 mb-5">
            <p className="text-xs text-text-muted font-medium mb-1">Hook gốc</p>
            <p className="text-sm text-text-primary">{hook}</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : alternatives.length === 0 ? (
            <p className="text-center text-text-muted text-sm py-4">Không có gợi ý</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-text-muted">Gợi ý thay thế:</p>
              {(Array.isArray(alternatives) ? alternatives : [alternatives]).map((alt, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-[14px] border border-border hover:border-accent/40 transition-all">
                  <p className="text-sm text-text-primary flex-1">{typeof alt === "string" ? alt : alt.hook || alt.text || JSON.stringify(alt)}</p>
                  <button
                    onClick={() => copyHook(typeof alt === "string" ? alt : alt.hook || alt.text || "", i)}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-bg-surface-2 transition-colors"
                  >
                    {copied === i ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-text-muted" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Scripts list (Đã tạo tab) ────────────────────────────────────────────
function ScriptsList({ onCreateNew, onSelectScript }) {
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("Tất cả");
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get("/scripts/")
      .then(res => setScripts(Array.isArray(res.data) ? res.data : res.data?.items || []))
      .catch(() => setScripts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = scripts.filter(s =>
    filterTab === "Tất cả" || s.status?.toLowerCase() === filterTab.toLowerCase()
  );

  const handleDelete = async (id) => {
    if (!window.confirm("Xóa script này?")) return;
    setDeleting(id);
    try {
      await api.delete(`/scripts/${id}`);
      setScripts(ss => ss.filter(s => s.id !== id));
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-sm text-text-muted">{scripts.length} scripts đã tạo</p>
        <div className="flex gap-1 bg-bg-surface-2 rounded-[14px] p-1">
          {SCRIPT_FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all ${
                filterTab === tab ? "bg-white text-text-primary shadow-sm" : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 rounded-[14px] bg-bg-surface-2 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <span className="text-5xl">📝</span>
          <p className="text-text-muted text-sm">
            {filterTab === "Tất cả" ? "Chưa có script nào" : `Không có script "${filterTab}"`}
          </p>
          <button onClick={onCreateNew} className="btn-primary text-sm">Tạo script đầu tiên</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(script => (
            <div key={script.id} className="border border-border rounded-[14px] overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-bg-surface-2/50 transition-colors"
                onClick={() => setExpanded(e => e === script.id ? null : script.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary line-clamp-1">{script.hook || "Chưa có hook"}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-text-muted truncate">{script.product?.name || "—"}</span>
                    {script.topic_type && (
                      <span className="text-[11px] text-text-muted">· {TOPIC_LABELS[script.topic_type] || script.topic_type}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_COLORS[script.status] || STATUS_COLORS.draft}`}>
                    {script.status}
                  </span>
                  <span className="text-[11px] text-text-muted hidden sm:block">
                    {new Date(script.created_at).toLocaleDateString("vi-VN")}
                  </span>
                  {expanded === script.id ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
                </div>
              </div>

              {expanded === script.id && (
                <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                  {script.caption && (
                    <p className="text-sm text-text-muted leading-relaxed">{script.caption}</p>
                  )}
                  {Array.isArray(script.hashtags) && script.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {script.hashtags.map((h, i) => (
                        <span key={i} className="badge bg-accent/10 text-accent-dark text-xs">#{h}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectScript(script)}
                      className="flex items-center gap-1.5 flex-1 py-1.5 px-3 rounded-[10px] border border-accent bg-accent/5 text-xs font-medium text-accent-dark hover:bg-accent/10 transition-all"
                    >
                      <Sparkles size={12} />
                      Tạo video
                    </button>
                    <button
                      onClick={() => handleDelete(script.id)}
                      disabled={deleting === script.id}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-[10px] border border-border text-xs font-medium text-red-400 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      {deleting === script.id ? "Đang xóa..." : "Xóa"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Script detail ─────────────────────────────────────────────────
function Step4ScriptDetail({ selectedOption: rawSelectedOption, selectedProduct, policyFor, actionLoading, actionMsg, onBack, onCreateVideo, onImproveHook }) {
  const [copiedVoiceover, setCopiedVoiceover] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [activeTab, setActiveTab] = useState("script");

  const selectedOption = rawSelectedOption && typeof rawSelectedOption === "object" && !Array.isArray(rawSelectedOption) ? rawSelectedOption : {};
  const safeScenes = Array.isArray(selectedOption.scenes) ? selectedOption.scenes : [];
  const safeHashtags = Array.isArray(selectedOption.hashtags) ? selectedOption.hashtags : [];
  const safePropsNeeded = Array.isArray(selectedOption.props_needed) ? selectedOption.props_needed : [];
  const allVoiceover = safeScenes
    .filter(s => s.voiceover)
    .map((s, i) => `[${s.label || `Scene ${i + 1}`}] ${s.voiceover}`)
    .join("\n\n") || "";

  const copyVoiceover = () => {
    if (!allVoiceover) return;
    navigator.clipboard.writeText(allVoiceover);
    setCopiedVoiceover(true);
    setTimeout(() => setCopiedVoiceover(false), 2000);
  };

  const copyCaption = () => {
    const text = `${selectedOption.caption || ""}\n\n${safeHashtags.map(t => `#${t}`).join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const policy = policyFor(selectedOption);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        {/* LEFT: Phone preview */}
        <div className="flex flex-col items-center gap-4">
          <PhonePreview
            script={selectedOption}
            product={selectedProduct}
            formatType={selectedOption._format_type || "text_on_screen"}
          />
          {selectedProduct && (
            <div className="w-[260px] bg-white border border-border rounded-[16px] p-3">
              <div className="flex items-center gap-2">
                {selectedProduct.image_url ? (
                  <img src={selectedProduct.image_url} alt="" className="w-8 h-8 rounded-[8px] object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-[8px] bg-accent/20 flex items-center justify-center text-sm">✨</div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">{selectedProduct.name}</p>
                  <p className="text-[10px] text-text-muted truncate">{selectedProduct.brand?.name || "—"}</p>
                </div>
              </div>
              {policy && (
                <span className={`mt-2 flex items-center justify-center badge border text-[10px] w-full ${policy.cls}`}>
                  {policy.label}
                </span>
              )}
            </div>
          )}
          {selectedOption.total_duration && (
            <div className="w-[260px] flex items-center justify-between px-3 py-2 bg-bg-surface-2 rounded-[12px]">
              <span className="text-xs text-text-muted">Tổng thời lượng</span>
              <span className="text-xs font-semibold text-text-primary">{selectedOption.total_duration}</span>
            </div>
          )}
        </div>

        {/* RIGHT: Script content */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">Script của bạn</h2>
              <p className="text-text-muted text-sm">{selectedProduct?.name}</p>
            </div>
            <div className="flex gap-1 border border-border rounded-[14px] p-1">
              {["script", "caption"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-[10px] text-xs font-medium transition-all ${
                    activeTab === tab ? "bg-accent text-white" : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tab === "script" ? "Script" : "Caption"}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "script" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-accent/10 to-accent-dark/5 border border-accent/20 rounded-[18px] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-medium mb-1.5">Hook</p>
                <p className="text-base font-display font-semibold text-text-primary leading-snug">
                  {selectedOption.hook}
                </p>
                <button
                  onClick={onImproveHook}
                  className="mt-2 flex items-center gap-1.5 text-xs text-accent-dark font-medium hover:underline"
                >
                  <Wand2 size={11} /> Improve hook
                </button>
              </div>

              {allVoiceover && (
                <button
                  onClick={copyVoiceover}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] border text-sm font-medium transition-all w-full justify-center ${
                    copiedVoiceover
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                      : "bg-bg-surface-2 border-border text-text-muted hover:border-accent/50 hover:text-accent-dark"
                  }`}
                >
                  {copiedVoiceover ? <Check size={14} /> : <ClipboardCopy size={14} />}
                  {copiedVoiceover ? "Đã copy voiceover!" : "Copy toàn bộ voiceover"}
                </button>
              )}

              {safeScenes.length > 0 && (
                <div className="space-y-2">
                  {safeScenes.map((scene, i) => {
                    const labelCls = SCENE_LABEL_COLORS[scene.label] || "bg-bg-surface-2 text-text-muted";
                    return (
                      <div key={i} className="border border-border rounded-[14px] bg-white overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-bg-surface">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${labelCls}`}>
                            {scene.label || `Scene ${i + 1}`}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono bg-bg-surface-2 px-2 py-0.5 rounded-full">
                            {scene.timestamp || `${i * 4}s`}
                          </span>
                        </div>
                        <div className="p-3 space-y-1.5">
                          {scene.visual_direction && (
                            <p className="text-xs text-text-muted flex gap-1.5">
                              <span className="shrink-0">🎬</span>
                              <span>{scene.visual_direction}</span>
                            </p>
                          )}
                          {scene.text_on_screen && (
                            <p className="text-sm text-text-primary font-medium flex gap-1.5">
                              <span className="shrink-0">📱</span>
                              <span>{scene.text_on_screen}</span>
                            </p>
                          )}
                          {scene.voiceover && (
                            <p className="text-xs text-text-primary italic flex gap-1.5">
                              <span className="shrink-0">🎙️</span>
                              <span className="text-text-muted">"{scene.voiceover}"</span>
                            </p>
                          )}
                          {scene.camera_tip && (
                            <p className="text-[11px] text-blue-600 flex gap-1.5 pt-0.5 border-t border-border mt-1">
                              <span className="shrink-0">📷</span>
                              <span>{scene.camera_tip}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {safePropsNeeded.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-[14px] p-4">
                  <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                    <Package size={12} /> Props cần chuẩn bị
                  </p>
                  <ul className="space-y-1">
                    {safePropsNeeded.map((prop, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-amber-800">
                        <span className="w-4 h-4 rounded border border-amber-300 flex items-center justify-center shrink-0 bg-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        </span>
                        {prop}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedOption.music_vibe && (
                <div className="bg-bg-surface-2 rounded-[14px] p-3 flex items-center gap-2">
                  <span className="text-base">🎵</span>
                  <div>
                    <p className="text-[10px] text-text-muted">Music vibe</p>
                    <p className="text-xs text-text-primary font-medium">{selectedOption.music_vibe}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "caption" && (
            <div className="space-y-4">
              {selectedOption.caption && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium mb-2">Caption</p>
                  <div className="bg-bg-surface-2 rounded-[16px] p-4">
                    <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{selectedOption.caption}</p>
                  </div>
                </div>
              )}
              {safeHashtags.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted font-medium mb-2">Hashtags</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {safeHashtags.map((tag, i) => (
                      <span key={i} className="badge bg-accent/10 text-accent-dark text-xs">#{tag}</span>
                    ))}
                  </div>
                  <button
                    onClick={copyCaption}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] border text-sm font-medium transition-all ${
                      copiedCaption
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                        : "bg-bg-surface-2 border-border text-text-muted hover:border-accent/50 hover:text-accent-dark"
                    }`}
                  >
                    {copiedCaption ? <Check size={14} /> : <ClipboardCopy size={14} />}
                    {copiedCaption ? "Đã copy!" : "Copy caption + hashtags"}
                  </button>
                </div>
              )}
              {selectedOption.estimated_performance && (
                <div className="bg-bg-surface-2 rounded-[16px] p-4">
                  <p className="text-xs text-text-muted font-medium mb-1">Estimated Performance</p>
                  <p className="text-sm text-text-primary">
                    {typeof selectedOption.estimated_performance === "string"
                      ? selectedOption.estimated_performance
                      : JSON.stringify(selectedOption.estimated_performance)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          {actionMsg}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button onClick={onBack} className="btn-secondary gap-2">
          <ChevronLeft size={16} /> Quay lại
        </button>
        <button
          onClick={onCreateVideo}
          disabled={actionLoading === "video"}
          className="btn-primary gap-2 disabled:opacity-60"
        >
          {actionLoading === "video" ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : "🎬"} Tạo video
        </button>
        <button onClick={onImproveHook} className="btn-secondary gap-2">
          <Wand2 size={14} /> Improve hook
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function Create() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState("new"); // "new" | "history"

  // Wizard step
  const [step, setStep] = useState(1);

  // Step 1
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Step 2
  const [selectedTopics, setSelectedTopics] = useState([]);

  // Step 3
  const [generating, setGenerating] = useState(false);
  const [optionA, setOptionA] = useState(null);
  const [optionB, setOptionB] = useState(null);
  const [generateError, setGenerateError] = useState("");

  // Step 4
  const [selectedOption, setSelectedOption] = useState(null);
  const [showImproveHook, setShowImproveHook] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  // Draft persistence
  const saveDraft = (draft) => {
    try { localStorage.setItem(CREATE_VIDEO_DRAFT_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
  };
  const clearDraft = () => localStorage.removeItem(CREATE_VIDEO_DRAFT_KEY);

  const sanitizeOption = (opt) => {
    if (!opt || typeof opt !== "object" || Array.isArray(opt)) return null;
    return {
      ...opt,
      scenes: Array.isArray(opt.scenes) ? opt.scenes : [],
      hashtags: Array.isArray(opt.hashtags) ? opt.hashtags : [],
      props_needed: Array.isArray(opt.props_needed) ? opt.props_needed : [],
    };
  };

  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(CREATE_VIDEO_DRAFT_KEY));
      if (draft && typeof draft === "object") {
        setStep(draft.step || 1);
        setSelectedProduct(draft.selectedProduct || null);
        setSelectedTopics(Array.isArray(draft.selectedTopics) ? draft.selectedTopics : []);
        setOptionA(sanitizeOption(draft.optionA));
        setOptionB(sanitizeOption(draft.optionB));
        setSelectedOption(sanitizeOption(draft.selectedOption));
        setProductSearch(draft.productSearch || "");
      }
    } catch { clearDraft(); }
  }, []);

  useEffect(() => {
    saveDraft({ step, selectedProduct, selectedTopics, productSearch, optionA, optionB, selectedOption });
  }, [step, selectedProduct, selectedTopics, productSearch, optionA, optionB, selectedOption]);

  // Product search
  const searchProducts = async (q) => {
    if (!q.trim()) { setProductResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await api.get("/products", { params: { search: q, limit: 10 } });
      const items = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
      setProductResults(items);
    } catch {
      setProductResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productSearch), 350);
    return () => clearTimeout(t);
  }, [productSearch]);

  // Generate
  const handleGenerateDual = async () => {
    if (!selectedProduct) return;
    setGenerating(true);
    setGenerateError("");
    const topic = selectedTopics[0] || "honest_review";
    try {
      const res = await api.post("/generator/generate-dual", {
        product_id: selectedProduct.id,
        topic_types: [topic, selectedTopics[1] || topic],
      });
      setOptionA(sanitizeOption(res.data?.option_a));
      setOptionB(sanitizeOption(res.data?.option_b));
    } catch (err) {
      setGenerateError(err.response?.data?.detail || "Generation thất bại");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (step === 3 && !optionA && !generating) handleGenerateDual();
  }, [step]);

  const handleCreateVideo = async () => {
    if (!selectedOption || !selectedProduct) return;
    setActionLoading("video");
    try {
      await api.post("/videos", {
        product_id: selectedProduct.id,
        script_id: selectedOption.script_id,
        title: `${selectedProduct.name} - ${selectedTopics[0] || "review"}`,
        platform: "tiktok",
        project_type: "A",
      });
      navigate("/my/videos");
      clearDraft();
    } catch (err) {
      setActionMsg(err.response?.data?.detail || "Tạo video thất bại");
    } finally {
      setActionLoading("");
    }
  };

  const policyFor = (option) => {
    if (!option?.policy_check) return null;
    const p = option.policy_check;
    return POLICY_BADGE[p.risk_level === "safe" ? "safe" : p.risk_level === "warning" ? "warning" : "violation"];
  };

  const handleSelectScript = (script) => {
    if (script.product) {
      setSelectedProduct(script.product);
    }
    setSelectedOption(sanitizeOption({
      hook: script.hook,
      scenes: script.scenes,
      caption: script.caption,
      hashtags: script.hashtags,
      music_vibe: script.music_vibe,
      estimated_performance: script.estimated_performance,
      script_id: script.id,
    }));
    setMainTab("new");
    setStep(4);
  };

  return (
    <div className="min-h-screen p-6 md:p-10 bg-bg-primary">
      <div className="max-w-5xl mx-auto">

        {/* Page header + main tabs */}
        <div className="mb-6">
          <h1 className="text-3xl font-display font-semibold text-text-primary">Tạo Content</h1>
          <p className="text-text-muted text-sm mt-1">Script TikTok skincare được tạo bởi AI</p>
        </div>

        <div className="flex gap-1 bg-bg-surface-2 rounded-[16px] p-1 w-fit mb-8">
          <button
            onClick={() => setMainTab("new")}
            className={`px-5 py-2.5 rounded-[12px] text-sm font-medium transition-all ${
              mainTab === "new"
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            ✨ Tạo mới
          </button>
          <button
            onClick={() => setMainTab("history")}
            className={`px-5 py-2.5 rounded-[12px] text-sm font-medium transition-all ${
              mainTab === "history"
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            📋 Đã tạo
          </button>
        </div>

        {/* ── TAB: Tạo mới ── */}
        {mainTab === "new" && (
          <>
            <Stepper step={step} />

            {/* STEP 1: Select product */}
            {step === 1 && (
              <div className="card">
                <h2 className="font-display text-xl font-semibold mb-2">Chọn sản phẩm</h2>
                <p className="text-text-muted text-sm mb-5">Tìm sản phẩm bạn muốn tạo content cho</p>

                <div className="relative mb-4">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Tìm theo tên sản phẩm..."
                    className="input pl-10 focus:border-accent"
                  />
                </div>

                {searchLoading && (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {productResults.length > 0 && (
                  <div className="space-y-2 mb-4 max-h-72 overflow-y-auto">
                    {productResults.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className={`flex items-center gap-3 p-3 rounded-[14px] border cursor-pointer transition-all ${
                          selectedProduct?.id === p.id
                            ? "border-accent bg-accent/5 shadow-[0_0_0_1px_rgba(212,160,192,0.4)]"
                            : "border-border hover:border-accent/40 hover:bg-bg-surface-2"
                        }`}
                      >
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-bg-surface-2 flex items-center justify-center text-lg">✨</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                          <p className="text-xs text-text-muted">{p.brand?.name || "—"} · {p.category || "—"}</p>
                        </div>
                        {selectedProduct?.id === p.id && <Check size={16} className="text-accent shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}

                {selectedProduct && (
                  <div className="bg-accent/5 border border-accent/30 rounded-[16px] p-4 mb-4 flex items-center gap-3">
                    {selectedProduct.image_url ? (
                      <img src={selectedProduct.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-xl">✨</div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{selectedProduct.name}</p>
                      <p className="text-xs text-text-muted">{selectedProduct.brand?.name || selectedProduct.brand_name} · {selectedProduct.category}</p>
                    </div>
                    <Check size={18} className="text-accent ml-auto" />
                  </div>
                )}

                <a
                  href="/my/products"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-accent-dark font-medium hover:underline mb-6"
                >
                  <Plus size={14} /> Thêm sản phẩm mới
                </a>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedProduct}
                    className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tiếp theo <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Select topic */}
            {step === 2 && (
              <div className="card">
                <h2 className="font-display text-xl font-semibold mb-2">Chọn chủ đề</h2>
                <p className="text-text-muted text-sm mb-5">Chọn 1-2 chủ đề để AI tạo script phù hợp</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {TOPICS.map(topic => {
                    const isSelected = selectedTopics.includes(topic.value);
                    return (
                      <button
                        key={topic.value}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTopics(t => t.filter(x => x !== topic.value));
                          } else if (selectedTopics.length < 2) {
                            setSelectedTopics(t => [...t, topic.value]);
                          }
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-[16px] border transition-all text-center ${
                          isSelected
                            ? "border-accent bg-accent/5 shadow-[0_0_0_1px_rgba(212,160,192,0.4)]"
                            : "border-border hover:border-accent/40 hover:bg-bg-surface-2"
                        }`}
                      >
                        <span className="text-2xl">{topic.icon}</span>
                        <span className={`text-xs font-medium leading-tight ${isSelected ? "text-accent-dark" : "text-text-primary"}`}>
                          {topic.label}
                        </span>
                        {isSelected && <Check size={12} className="text-accent" />}
                      </button>
                    );
                  })}
                </div>

                {selectedTopics.length > 0 && (
                  <div className="bg-bg-surface-2 rounded-[14px] p-3 mb-5 flex flex-wrap gap-2">
                    {selectedTopics.map(v => {
                      const t = TOPICS.find(x => x.value === v);
                      return <span key={v} className="badge bg-accent/10 text-accent-dark text-xs">{t?.icon} {t?.label}</span>;
                    })}
                  </div>
                )}

                <div className="flex justify-between">
                  <button onClick={() => setStep(1)} className="btn-secondary gap-2">
                    <ChevronLeft size={16} /> Quay lại
                  </button>
                  <button
                    onClick={() => { setOptionA(null); setOptionB(null); setStep(3); }}
                    disabled={selectedTopics.length === 0}
                    className="btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate <Sparkles size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Generate */}
            {step === 3 && (
              <div className="card">
                <h2 className="font-display text-xl font-semibold mb-2">AI đang tạo script</h2>
                <p className="text-text-muted text-sm mb-6">Xem preview và chọn option phù hợp với style của bạn</p>

                {generating && (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                      <Sparkles size={20} className="absolute inset-0 m-auto text-accent" />
                    </div>
                    <p className="text-text-muted text-sm font-medium">AI đang viết script của bạn... ✨</p>
                    <p className="text-text-muted text-xs">Đang phân tích sản phẩm và tạo nội dung</p>
                  </div>
                )}

                {generateError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
                    {generateError}
                    <button onClick={handleGenerateDual} className="ml-3 underline text-red-400 hover:text-red-300">
                      Thử lại
                    </button>
                  </div>
                )}

                {!generating && optionA && optionB && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {[
                        { option: optionA, label: "Option A — Text on Screen", format: "text_on_screen" },
                        { option: optionB, label: "Option B — Voiceover", format: "voiceover" },
                      ].map(({ option, label, format }) => {
                        const badge = policyFor(option);
                        return (
                          <div key={label} className="flex flex-col items-center gap-4">
                            <p className="text-sm font-semibold text-text-muted">{label}</p>
                            <PhonePreview script={option} product={selectedProduct} formatType={format} />
                            {badge && (
                              <span className={`badge border text-xs ${badge.cls}`}>{badge.label}</span>
                            )}
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => { setSelectedOption(sanitizeOption({ ...option, _format_type: format })); setStep(4); }}
                                className="btn-primary flex-1 justify-center text-sm py-2"
                              >
                                Chọn option này
                              </button>
                              <button
                                onClick={handleGenerateDual}
                                className="btn-secondary px-3 py-2 rounded-[14px] text-sm gap-1"
                              >
                                <RefreshCw size={14} /> Tạo lại
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-start">
                      <button onClick={() => setStep(2)} className="btn-secondary gap-2">
                        <ChevronLeft size={16} /> Quay lại
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 4: Script detail */}
            {step === 4 && selectedOption && (
              <Step4ScriptDetail
                selectedOption={selectedOption}
                selectedProduct={selectedProduct}
                policyFor={policyFor}
                actionLoading={actionLoading}
                actionMsg={actionMsg}
                onBack={() => setStep(3)}
                onCreateVideo={handleCreateVideo}
                onImproveHook={() => setShowImproveHook(true)}
              />
            )}
          </>
        )}

        {/* ── TAB: Đã tạo ── */}
        {mainTab === "history" && (
          <ScriptsList onCreateNew={() => setMainTab("new")} onSelectScript={handleSelectScript} />
        )}
      </div>

      {showImproveHook && selectedOption && (
        <ImproveHookModal
          hook={selectedOption.hook}
          productName={selectedProduct?.name || ""}
          onClose={() => setShowImproveHook(false)}
        />
      )}
    </div>
  );
}
