import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      const stack = this.state.error?.stack || "";
      const componentStack = this.state.info?.componentStack || "";
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
          <div className="bg-white rounded-[24px] border border-border p-8 max-w-2xl w-full shadow-lg">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">⚠️</div>
              <h2 className="font-display text-xl font-semibold text-text-primary mb-2">
                Có lỗi xảy ra
              </h2>
              <p className="text-text-muted text-sm">
                {this.state.error?.message || "Lỗi không xác định"}
              </p>
            </div>
            <details className="mb-4 text-xs" open>
              <summary className="cursor-pointer text-text-muted font-medium mb-2">Stack trace</summary>
              <pre className="text-text-muted font-mono bg-bg-surface-2 rounded-xl p-3 text-left overflow-auto max-h-48 whitespace-pre-wrap break-all">
{stack}
              </pre>
            </details>
            {componentStack && (
              <details className="mb-4 text-xs">
                <summary className="cursor-pointer text-text-muted font-medium mb-2">Component stack</summary>
                <pre className="text-text-muted font-mono bg-bg-surface-2 rounded-xl p-3 text-left overflow-auto max-h-48 whitespace-pre-wrap break-all">
{componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => { this.setState({ hasError: false, error: null, info: null }); window.location.reload(); }}
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
