import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: any;
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
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 m-4 rounded-lg border bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200">
          <div className="font-semibold mb-1">Something went wrong rendering this section.</div>
          <div className="text-xs opacity-80 break-words">
            {String(this.state.error)}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;


