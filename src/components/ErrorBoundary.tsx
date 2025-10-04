import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log to error tracking service if available
    if (typeof window !== 'undefined' && (window as any).trackError) {
      (window as any).trackError(error, { errorInfo });
    }
  }

  handleReset = () => {
    // Clear potentially corrupted localStorage
    try {
      const keysToPreserve = ['tradzen_theme', 'tradzen_selected_account'];
      const storage = window.localStorage;
      const preserved: { [key: string]: string } = {};
      
      // Preserve essential keys
      keysToPreserve.forEach(key => {
        const value = storage.getItem(key);
        if (value) preserved[key] = value;
      });
      
      // Clear all localStorage
      storage.clear();
      
      // Restore preserved keys
      Object.entries(preserved).forEach(([key, value]) => {
        storage.setItem(key, value);
      });
      
      console.log('[ErrorBoundary] Cleared localStorage (preserved essential keys)');
    } catch (e) {
      console.error('[ErrorBoundary] Failed to clear localStorage:', e);
    }
    
    // Reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-500/10 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Something went wrong
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    The app encountered an unexpected error
                  </p>
                </div>
              </div>

              {this.state.error && (
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm font-mono text-foreground break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear Data & Reload
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                >
                  Try Reloading
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  If this problem persists, try using a different browser or clearing your browser cache.
                  Your cloud data is safe and will sync back when you reload.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

