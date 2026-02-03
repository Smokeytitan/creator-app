import { Component } from 'react';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays a fallback UI
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * Or with custom fallback:
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-4">
          <div className="max-w-2xl w-full bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-display font-bold text-[var(--color-text-primary)] mb-2">
                Something Went Wrong
              </h1>
              <p className="text-[var(--color-text-secondary)]">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
            </div>

            {/* Error Details (Development Mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <h2 className="text-lg font-semibold text-red-400 mb-2">Error Details:</h2>
                <p className="text-sm text-red-300 font-mono mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-sm text-red-400 cursor-pointer hover:text-red-300">
                      Component Stack
                    </summary>
                    <pre className="text-xs text-red-300 mt-2 overflow-auto max-h-64 p-2 bg-black/30 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-semibold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                Try Again
              </button>
            </div>

            {/* Support Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">
                If the problem persists, please{' '}
                <a
                  href="mailto:support@example.com"
                  className="text-[var(--color-accent-primary)] hover:text-[var(--color-accent-secondary)] transition-colors"
                >
                  contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
