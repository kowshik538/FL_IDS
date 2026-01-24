import React, { StrictMode, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Centralized Error Boundary component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Optionally send to logging service
  }
  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong:</h1>
          <pre>{this.state.error?.message}</pre>
          <button onClick={() => window.location.reload()}>Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Get root container with explicit null check
const container = document.getElementById('root');
if (!container) throw new Error('Root container with id="root" not found');

// Create React 18 root
const root = ReactDOM.createRoot(container);

// Router selection:
// - In packaged Electron we typically load via file:// which breaks BrowserRouter refresh/history.
// - In web dev/prod we serve under /app/, so BrowserRouter needs basename.
const isFileProtocol = window.location.protocol === 'file:';
const basename = window.location.pathname.startsWith('/app') ? '/app' : undefined;

// Render the app
root.render(
  <StrictMode>
    {isFileProtocol ? (
      <HashRouter>
        <ErrorBoundary>
          <Suspense fallback={<div>Loading…</div>}>
            <App />
          </Suspense>
        </ErrorBoundary>
      </HashRouter>
    ) : (
      <BrowserRouter basename={basename}>
        <ErrorBoundary>
          <Suspense fallback={<div>Loading…</div>}>
            <App />
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    )}
  </StrictMode>
);
