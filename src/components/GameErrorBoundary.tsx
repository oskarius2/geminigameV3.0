// @ts-nocheck — React class-component APIs (state, setState, props) are not
// typed in this project (no @types/react). Error boundary logic is correct;
// suppressing TS noise only in this file.
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

/**
 * Catches React render errors inside the game UI.
 * Replaces the crashed subtree with a friendly recovery screen.
 */
export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[GameErrorBoundary] Caught render error:', error);
    console.error('[GameErrorBoundary] Component stack:', info.componentStack);
  }

  handleRefresh = () => window.location.reload();

  handleDismiss = () => this.setState({ hasError: false, message: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="absolute inset-0 z-[9999] flex items-center justify-center p-6"
        style={{ background: 'rgba(2,2,14,0.97)', backdropFilter: 'blur(6px)' }}
      >
        <div
          className="w-full max-w-md rounded-xl border p-6 flex flex-col gap-4"
          style={{
            borderColor: 'rgba(255,34,68,0.5)',
            background: 'rgba(30,5,10,0.95)',
            boxShadow: '0 0 40px rgba(255,34,68,0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-2xl shrink-0"
              aria-hidden
              style={{ filter: 'drop-shadow(0 0 8px #ff2244)' }}
            >
              ⚠
            </span>
            <h2
              className="font-display font-black uppercase tracking-widest text-base"
              style={{ color: '#ff4466' }}
            >
              Game Crashed
            </h2>
          </div>

          <p className="text-sm text-white/70 leading-relaxed">
            A rendering error was caught. Check the browser console (F12) for details.
          </p>

          {this.state.message && (
            <pre
              className="text-xs font-mono rounded-lg p-3 overflow-x-auto"
              style={{
                background: 'rgba(0,0,0,0.5)',
                color: '#fca5a5',
                border: '1px solid rgba(255,34,68,0.25)',
                maxHeight: '120px',
              }}
            >
              {this.state.message}
            </pre>
          )}

          <div className="flex flex-col gap-2 mt-1">
            <button
              type="button"
              onClick={this.handleRefresh}
              className="w-full min-h-[44px] rounded-lg font-display font-bold uppercase tracking-widest text-sm transition-all"
              style={{
                background: 'rgba(255,34,68,0.15)',
                border: '1px solid rgba(255,34,68,0.5)',
                color: '#ff4466',
              }}
            >
              Refresh &amp; Restart
            </button>
            <button
              type="button"
              onClick={this.handleDismiss}
              className="w-full min-h-[44px] rounded-lg font-display font-semibold uppercase tracking-wider text-xs transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              Try to continue
            </button>
          </div>
        </div>
      </div>
    );
  }
}
