import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: undefined };
  }

  static getDerivedStateFromError(error: unknown): State {
    const msg = error instanceof Error ? error.message : String(error);
    return { hasError: true, message: msg };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    try {
      console.error('Runtime error caught by ErrorBoundary:', error, errorInfo);
    } catch {}
  }

  handleReload = () => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
      }
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg, #0b0b0b)', color: '#fff', padding: 24
        }}>
          <div style={{ maxWidth: 720, width: '100%', textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>Something went wrong</h1>
            <p style={{ opacity: 0.8, marginBottom: 20 }}>An error occurred while loading the app. Please reload the page.</p>
            {this.state.message ? (
              <pre style={{
                textAlign: 'left', whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 8,
                fontSize: 12, lineHeight: 1.4, overflowX: 'auto'
              }}>{this.state.message}</pre>
            ) : null}
            <button onClick={this.handleReload} style={{
              background: '#FFD700', color: '#000', border: 0, padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600
            }}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
