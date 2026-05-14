import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
          <div className="bg-white rounded-[24px] border border-border p-8 max-w-md w-full text-center shadow-lg">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="font-display text-xl font-semibold text-text-primary mb-2">
              Có lỗi xảy ra
            </h2>
            <p className="text-text-muted text-sm mb-1">
              {this.state.error?.message || "Lỗi không xác định"}
            </p>
            <p className="text-text-muted text-xs mb-6 font-mono bg-bg-surface-2 rounded-xl p-3 text-left overflow-auto max-h-32">
              {this.state.error?.stack?.split("\n")[0]}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                className="btn-primary"
              >
                Tải lại trang
              </button>
              <button
                onClick={() => {
                  try { localStorage.clear(); } catch { /* ignore */ }
                  try { sessionStorage.clear(); } catch { /* ignore */ }
                  window.location.href = "/";
                }}
                className="btn-secondary"
              >
                Xóa dữ liệu cục bộ
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
