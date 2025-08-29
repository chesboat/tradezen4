import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  label?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: any;
  errorInfo?: any;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught error:', this.props.label, error, info);
    this.setState({ errorInfo: info });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 m-4 rounded-lg border bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200">
          <div className="font-semibold mb-1">Something went wrong rendering this section{this.props.label ? `: ${this.props.label}` : ''}.</div>
          <div className="text-xs opacity-80 break-words mb-1">
            {this.state.error?.message || String(this.state.error)}
          </div>
          {this.state.errorInfo?.componentStack && (
            <pre className="text-[10px] whitespace-pre-wrap opacity-70">
              {this.state.errorInfo.componentStack}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


