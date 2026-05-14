import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, Wand2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import api from "../api/client";
import CalendarGrid from "../components/CalendarGrid";

export default function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [showGenModal, setShowGenModal] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [currentDate]);

  useEffect(() => {
    api.get("/products/?status=active").then(r => setProducts(r.data?.items || (Array.isArray(r.data) ? r.data : []))).catch(() => {});
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await api.get("/calendar/", {
        params: { month: currentDate.getMonth() + 1, year: currentDate.getFullYear() }
      });
      const items = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items) ? res.data.items : [];
      setEntries(items);
    } catch { setEntries([]); } finally { setLoading(false); }
  };

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const handleGenerate = async () => {
    if (selectedProductIds.length === 0) return alert("Chọn ít nhất 1 sản phẩm!");
    setGenerating(true);
    try {
      await api.post("/generator/calendar", {
        product_ids: selectedProductIds.map(Number),
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      });
      setShowGenModal(false);
      fetchEntries();
    } catch (err) {
      alert("Lỗi tạo lịch: " + (err.response?.data?.detail || err.message));
    } finally { setGenerating(false); }
  };

  const handleStatusChange = async (id, status) => {
    await api.put(`/calendar/${id}`, { status });
    fetchEntries();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Calendar</h1>
          <p className="text-text-muted text-sm mt-1">{entries.length} video được lên lịch</p>
        </div>
        <button onClick={() => setShowGenModal(true)} className="btn-primary">
          <Wand2 size={16} /> Tạo lịch AI
        </button>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-surface rounded-xl transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold">
            {format(currentDate, "MMMM yyyy", { locale: vi })}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-surface rounded-xl transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <CalendarGrid
          currentDate={currentDate}
          entries={entries}
          loading={loading}
          onStatusChange={handleStatusChange}
        />
      </div>

      {showGenModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Wand2 size={18} className="text-accent" /> Tạo lịch AI tháng {currentDate.getMonth() + 1}/{currentDate.getFullYear()}
            </h2>
            <p className="text-text-muted text-sm mb-4">Chọn sản phẩm để AI tạo lịch 30 ngày tự động</p>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {products.map(p => (
                <label key={p.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-surface">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(p.id)}
                    onChange={e => setSelectedProductIds(prev =>
                      e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id)
                    )}
                    className="accent-[#c084fc]"
                  />
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-text-muted">{p.brand} · {p.category}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowGenModal(false)} className="btn-secondary flex-1 justify-center">Hủy</button>
              <button onClick={handleGenerate} disabled={generating} className="btn-primary flex-1 justify-center">
                {generating ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Tạo lịch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
