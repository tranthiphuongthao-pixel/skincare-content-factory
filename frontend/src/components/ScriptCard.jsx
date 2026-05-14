import { Copy, Check, Calendar, Music } from "lucide-react";
import { useState } from "react";

const STATUS_STYLES = {
  draft: "bg-yellow-500/20 text-yellow-400",
  ready: "bg-blue-500/20 text-blue-400",
  posted: "bg-emerald-500/20 text-emerald-400",
};

export default function ScriptCard({ script, onStatusChange }) {
  const [copied, setCopied] = useState(false);

  const copyCaption = () => {
    const text = `${script.caption}\n\n${(script.hashtags || []).map(h => `#${h}`).join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="card hover:border-accent/30 transition-all space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm line-clamp-2">{script.hook}</p>
          <p className="text-xs text-text-secondary mt-1">{script.product?.name} · {script.topic_type}</p>
        </div>
        <select
          value={script.status}
          onChange={e => onStatusChange?.(script.id, e.target.value)}
          className={`text-xs font-medium px-2 py-1 rounded-full border-none outline-none cursor-pointer ${STATUS_STYLES[script.status] || STATUS_STYLES.draft}`}
          style={{ background: "transparent" }}
        >
          <option value="draft">draft</option>
          <option value="ready">ready</option>
          <option value="posted">posted</option>
        </select>
      </div>

      {script.caption && (
        <p className="text-xs text-text-secondary line-clamp-2">{script.caption}</p>
      )}

      {script.hashtags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {script.hashtags.slice(0, 5).map((tag, i) => (
            <span key={i} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">#{tag}</span>
          ))}
          {script.hashtags.length > 5 && (
            <span className="text-xs text-text-secondary">+{script.hashtags.length - 5}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        {script.music_vibe && (
          <div className="flex items-center gap-1 text-xs text-text-secondary">
            <Music size={11} /> <span className="truncate max-w-24">{script.music_vibe}</span>
          </div>
        )}
        <button onClick={copyCaption} className="ml-auto btn-secondary py-1 px-2.5 text-xs">
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy caption"}
        </button>
      </div>
    </div>
  );
}
