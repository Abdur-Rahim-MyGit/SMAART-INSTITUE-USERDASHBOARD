import { Component } from 'react';
import { AlertTriangle, RefreshCw } from '@/components/icons';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            showDetails: false,
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // NOTE: production builds strip console.* (see vite.config.ts
        // `drop: ["console", "debugger"]`), so this never reaches anyone's
        // console in prod. The details box below is the only way to see
        // what actually broke without a dev build.
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
        window.location.reload();
    };

    toggleDetails = () => this.setState(s => ({ showDetails: !s.showDetails }));

    render() {
        if (this.state.hasError) {
            const { error, errorInfo, showDetails } = this.state;
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#e8eff8] dark:bg-[#00152E] p-4">
                    <div className="max-w-md w-full bg-white dark:bg-[#001b3a] rounded-2xl p-8 text-center shadow-xl border border-[#d7ebf5] dark:border-white/10">
                        {/* Error Icon */}
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-200 dark:border-red-500/25">
                            <AlertTriangle size={30} className="text-red-500" />
                        </div>

                        {/* Error Message */}
                        <h2 className="text-xl font-bold text-[#072036] dark:text-white mb-2 tracking-tight">
                            Oops! Something went wrong
                        </h2>
                        <p className="text-[#35566b] dark:text-slate-300 mb-6 leading-relaxed text-sm">
                            We encountered an unexpected error. Don't worry, your data is safe.
                            Please try refreshing the page.
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 h-11 bg-[#072036] dark:bg-[#045C9A] text-white rounded-xl text-sm font-semibold hover:bg-[#0d3a5f] dark:hover:bg-[#0b6fb8] transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="flex-1 h-11 bg-[#F1F5F9] dark:bg-white/10 text-[#35566b] dark:text-white rounded-xl text-sm font-semibold hover:bg-[#EAF7FD] dark:hover:bg-white/20 transition-colors"
                            >
                                Go Home
                            </button>
                        </div>

                        {/* Technical details — always available (not gated to dev builds,
                            since production console.* calls are stripped and would
                            otherwise leave no way to see what broke), tucked behind a
                            toggle so it doesn't confront a regular end user. */}
                        {error && (
                            <div className="mt-5 text-left">
                                <button
                                    onClick={this.toggleDetails}
                                    className="text-xs font-semibold text-[#045C9A] dark:text-[#A6D7E8] hover:underline"
                                >
                                    {showDetails ? 'Hide technical details' : 'Show technical details'}
                                </button>
                                {showDetails && (
                                    <div className="mt-2 p-3 bg-[#F8FAFC] dark:bg-black/30 rounded-lg border border-[#d7ebf5] dark:border-white/10 max-h-48 overflow-auto">
                                        <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all whitespace-pre-wrap">
                                            {error.toString()}
                                        </p>
                                        {errorInfo?.componentStack && (
                                            <p className="mt-2 text-[11px] font-mono text-[#64748b] dark:text-slate-400 break-all whitespace-pre-wrap">
                                                {errorInfo.componentStack.trim()}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Support Link */}
                        <p className="text-xs text-[#64748b] dark:text-slate-300 mt-6">
                            If this problem persists, please{' '}
                            <a
                                href="/dashboard/support"
                                className="text-[#045C9A] dark:text-[#A6D7E8] hover:underline font-semibold"
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
