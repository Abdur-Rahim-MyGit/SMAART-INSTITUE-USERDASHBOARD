import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ShieldAlert, LogOut, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * LockedOut Page
 * 
 * Displayed when a user has been locked out of a course/assessment
 * due to multiple proctoring violations.
 */
const LockedOut = () => {
    const location = useLocation();
    const reason = location.state?.reason || 'Disqualified due to tab switching or window inactivity';

    return (
        <div className="min-h-screen bg-[#00152E] flex items-center justify-center p-4">
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.15) 0%, transparent 60%)'
            }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-red-500/30 bg-[#07162C] p-8 text-center shadow-2xl"
            >
                {/* Glowing border effects */}
                <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl pointer-events-none" />

                {/* Visual Lock Indicator */}
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10">
                    <ShieldAlert className="h-10 w-10 text-red-500 animate-pulse" />
                </div>

                {/* Disqualification Heading */}
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Access Suspended</h1>
                <p className="mt-2 text-red-400 font-semibold uppercase tracking-wider text-xs">Security Protocol Triggered</p>

                {/* Main Message */}
                <div className="mt-6 rounded-2xl bg-red-950/20 p-5 border border-red-900/30 text-left">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Disqualification Reason</h3>
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed font-mono bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                        {reason}
                    </p>
                    <p className="mt-3 text-xs text-slate-400">
                        Your attempt has been terminated, marked as complete (disqualified), and locked. An activity report has been automatically sent to your institution administrator.
                    </p>
                </div>

                {/* Action Choices */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <Link
                        to="/dashboard"
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 text-sm font-semibold text-white transition-all focus:outline-none border border-slate-700"
                    >
                        <LogOut className="h-4 w-4" />
                        Go to Dashboard
                    </Link>
                    <Link
                        to="/dashboard/support"
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 py-3 text-sm font-semibold text-white transition-all focus:outline-none shadow-lg shadow-red-900/20"
                    >
                        <MessageSquare className="h-4 w-4" />
                        Appeal Lockout
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default LockedOut;
