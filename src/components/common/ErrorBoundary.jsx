import React from 'react';
import { useRouteError, Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { ROUTES } from '../../utils/constants';

export function RouteErrorBoundary() {
  const error = useRouteError();
  console.error('Route error caught by ErrorBoundary:', error);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
      <div className="bg-surface border border-border rounded-3xl p-8 max-w-md w-full shadow-xl space-y-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-navy">Something went wrong</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            {error?.statusText || error?.message || 'An unexpected application error occurred.'}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-3 px-4 bg-background border border-border rounded-xl text-xs font-bold text-text-primary hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Page
          </button>
          <Link
            to={ROUTES.HOME}
            className="flex-1 py-3 px-4 gradient-yuga text-white rounded-xl text-xs font-bold shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
          <div className="bg-surface border border-border rounded-3xl p-8 max-w-md w-full shadow-xl space-y-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-navy">Application Error</h2>
              <p className="text-xs text-text-secondary leading-relaxed">
                {this.state.error?.message || 'An error occurred while loading this view.'}
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 gradient-yuga text-white rounded-xl text-xs font-bold shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Platform
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
