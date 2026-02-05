import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.fallback) {
        return this.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800 font-sans">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-100 shadow-xl text-center">
            <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-rose-50 mb-4 border border-rose-100">
              <span className="text-rose-500 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              エラーが発生しました
            </h2>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              申し訳ありません。予期せぬ問題により画面を表示できませんでした。
              <br />
              一度ページを再読み込み（リロード）してみてください。
            </p>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-full hover:bg-slate-800 shadow-md transition-all"
            >
              ページを再読み込みする
            </button>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-[10px] text-slate-300 font-mono text-left overflow-auto max-h-32 p-2 bg-slate-50 rounded">
                {this.state.error?.message}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.children;
  }

  // Accessing props in render since we don't use constructor
  private get children() {
    return this.props.children;
  }
  private get fallback() {
    return this.props.fallback;
  }
}
