import { Star, Edit, Trash2, ExternalLink } from "lucide-react";

const SOURCE_BADGES = {
  own_use: { label: "Đã dùng thật", class: "bg-emerald-500/20 text-emerald-400" },
  researched: { label: "Đã nghiên cứu", class: "bg-blue-500/20 text-blue-400" },
};

export default function ProductCard({ product, onEdit, onDelete }) {
  const badge = SOURCE_BADGES[product.source_type] || SOURCE_BADGES.researched;

  return (
    <div className="card hover:border-accent/30 transition-all group">
      {product.image_url ? (
        <img src={product.image_url} alt={product.name} className="w-full h-36 object-cover rounded-xl mb-4 bg-surface" />
      ) : (
        <div className="w-full h-36 bg-surface rounded-xl mb-4 flex items-center justify-center text-4xl">
          ✨
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
            <p className="text-xs text-text-secondary">{product.brand}</p>
          </div>
          <span className={`badge ${badge.class} whitespace-nowrap shrink-0`}>{badge.label}</span>
        </div>

        {product.personal_rating && (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={12} className={i < product.personal_rating ? "text-yellow-400 fill-yellow-400" : "text-border"} />
            ))}
          </div>
        )}

        {product.ingredients_highlight && (
          <p className="text-xs text-text-secondary line-clamp-2">{product.ingredients_highlight}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          {product.price ? (
            <span className="text-sm font-semibold text-highlight">{product.price.toLocaleString()}đ</span>
          ) : <span />}
          <span className={`badge text-xs ${product.category ? "bg-accent/10 text-accent" : ""}`}>{product.category}</span>
        </div>

        <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {product.affiliate_link && (
            <a href={product.affiliate_link} target="_blank" rel="noopener noreferrer" className="btn-secondary py-1.5 px-3 text-xs">
              <ExternalLink size={12} /> Link
            </a>
          )}
          <button onClick={() => onEdit(product)} className="btn-secondary py-1.5 px-3 text-xs ml-auto">
            <Edit size={12} /> Sửa
          </button>
          <button onClick={() => onDelete(product.id)} className="py-1.5 px-3 rounded-xl text-xs text-red-400 hover:bg-red-500/10 border border-border transition-all flex items-center gap-1">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
