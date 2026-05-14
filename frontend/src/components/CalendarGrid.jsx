import { eachDayOfInterval, startOfMonth, endOfMonth, getDay, isSameDay, format } from "date-fns";
import { vi } from "date-fns/locale";

const STATUS_COLORS = {
  planned: "border-l-yellow-400 bg-yellow-400/10",
  ready: "border-l-blue-400 bg-blue-400/10",
  posted: "border-l-emerald-400 bg-emerald-400/10",
  skipped: "border-l-red-400 bg-red-400/10",
};

const TOPIC_EMOJIS = {
  honest_review: "⭐",
  ingredient_breakdown: "🔬",
  before_after: "✨",
  comparison: "⚖️",
  routine_feature: "🌿",
  red_flag_check: "🚩",
  dupe_finder: "💰",
  community_review: "👥",
};

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function CalendarGrid({ currentDate, entries, loading, onStatusChange }) {
  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const firstDayOfWeek = getDay(startOfMonth(currentDate));
  const blanks = Array(firstDayOfWeek).fill(null);

  const getEntryForDay = (day) =>
    entries.find(e => isSameDay(new Date(e.scheduled_date), day));

  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map(d => <div key={d} className="text-center text-xs text-text-secondary py-2">{d}</div>)}
        {Array(35).fill(null).map((_, i) => (
          <div key={i} className="aspect-square bg-surface rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAYS.map(d => (
        <div key={d} className="text-center text-xs font-medium text-text-secondary py-2">{d}</div>
      ))}
      {blanks.map((_, i) => <div key={`blank-${i}`} />)}
      {days.map(day => {
        const entry = getEntryForDay(day);
        const today = isSameDay(day, new Date());
        return (
          <div
            key={day.toISOString()}
            className={`min-h-[72px] p-1.5 rounded-lg border ${today ? "border-accent" : "border-border"} ${entry ? "" : "bg-surface/30"} transition-all hover:border-accent/50`}
          >
            <p className={`text-xs font-medium mb-1 ${today ? "text-accent" : "text-text-secondary"}`}>
              {format(day, "d")}
            </p>
            {entry ? (
              <div className={`rounded border-l-2 p-1.5 ${STATUS_COLORS[entry.status] || STATUS_COLORS.planned}`}>
                <p className="text-xs leading-tight line-clamp-1 font-medium">
                  {TOPIC_EMOJIS[entry.script?.topic_type] || "📹"} {entry.script?.product?.name || "Video"}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {entry.time_slot === "morning" ? "11:00" : entry.time_slot === "afternoon" ? "19:00" : "21:00"}
                </p>
                <select
                  value={entry.status}
                  onChange={e => onStatusChange?.(entry.id, e.target.value)}
                  className="text-xs bg-transparent outline-none cursor-pointer text-text-secondary mt-0.5 w-full"
                  onClick={e => e.stopPropagation()}
                >
                  <option value="planned">Planned</option>
                  <option value="ready">Ready</option>
                  <option value="posted">Posted</option>
                  <option value="skipped">Skipped</option>
                </select>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
