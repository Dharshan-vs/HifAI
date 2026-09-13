import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '../Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-text-primary">Something went wrong</h1>
              <p className="text-text-secondary">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
            </div>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
