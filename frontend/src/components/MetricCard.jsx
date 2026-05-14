export default function MetricCard({ label, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="bg-white border border-border rounded-[16px] p-6 shadow-[0_2px_12px_rgba(160,96,128,0.06)] transition-all hover:shadow-[0_6px_20px_rgba(212,160,192,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.24em] text-text-muted font-medium">{label}</p>
          <p className="mt-3 text-4xl font-display font-semibold text-text-primary">{value}</p>
          {subtitle && <p className="mt-2 text-sm text-text-muted">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`mt-3 text-sm ${trend >= 0 ? "text-[#2a7f5d]" : "text-[#b02a3b]"}`}>
              {trend >= 0 ? "+" : ""}{trend}%
            </p>
          )}
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-bg-surface-2 text-accent">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
