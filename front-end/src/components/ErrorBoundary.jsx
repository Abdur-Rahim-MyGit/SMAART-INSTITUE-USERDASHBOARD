import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#001229] p-4">
                    <div className="max-w-md w-full bg-white dark:bg-[#002147] rounded-2xl p-8 text-center shadow-xl border border-gray-200 dark:border-white/10">
                        {/* Error Icon */}
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>

                        {/* Error Message */}
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            Oops! Something went wrong
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                            We encountered an unexpected error. Don't worry, your data is safe.
                            Please try refreshing the page.
                        </p>

                        {/* Error Details (Development Only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-gray-100 dark:bg-black/30 rounded-xl text-left">
                                <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-6 py-3 bg-[#1a3884] text-white rounded-xl font-semibold hover:bg-[#287a84] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#1a3884]/20"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="flex-1 px-6 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                            >
                                Go Home
                            </button>
                        </div>

                        {/* Support Link */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
                            If this problem persists, please{' '}
                            <a
                                href="/dashboard/support"
                                className="text-[#1a3884] hover:underline font-semibold"
                            >
                                contact support
                            </a>
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

