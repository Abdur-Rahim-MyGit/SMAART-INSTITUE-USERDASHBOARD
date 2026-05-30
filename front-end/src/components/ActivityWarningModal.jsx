import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, MonitorOff, Hourglass } from 'lucide-react';

/**
 * ActivityWarningModal
 * 
 * A beautiful, non-dismissible overlay modal warning the user about a security breach.
 * Prevents interaction with the underlying content until the user acknowledges the warning.
 */
export const ActivityWarningModal = ({ 
    isOpen, 
    warningsCount, 
    maxWarnings = 3, 
    lastViolationType, 
    onAcknowledge 
}) => {
    if (!isOpen) return null;

    const remainingWarnings = Math.max(0, maxWarnings - warningsCount + 1);

    const getViolationDetails = () => {
        switch (lastViolationType) {
            case 'tab_switch':
                return {
                    title: 'Tab Switch Detected',
                    description: 'Leaving the course/assessment window or switching browser tabs is strictly prohibited.',
                    icon: AlertTriangle,
                    colorClass: 'text-amber-500 border-amber-500/20 bg-amber-500/10'
                };
            case 'minimize':
                return {
                    title: 'Window Focus Lost',
                    description: 'Minimizing the browser window or focusing on other desktop applications is not allowed.',
                    icon: MonitorOff,
                    colorClass: 'text-orange-500 border-orange-500/20 bg-orange-500/10'
                };
            case 'inactivity':
                return {
                    title: 'Inactivity Warning',
                    description: 'No activity was detected for 5 minutes. Please stay active to continue.',
                    icon: Hourglass,
                    colorClass: 'text-amber-600 border-amber-600/20 bg-amber-600/10'
                };
            default:
                return {
                    title: 'Security Violation',
                    description: 'An unauthorized window or navigation change has been detected.',
                    icon: ShieldAlert,
                    colorClass: 'text-red-500 border-red-500/20 bg-red-500/10'
                };
        }
    };

    const details = getViolationDetails();
    const IconComponent = details.icon;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    transition={{ type: 'spring', duration: 0.4 }}
                    className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-900/50 bg-[#07162C] p-6 text-center shadow-2xl"
                >
                    {/* Glowing background highlights */}
                    <div className="absolute -top-12 -left-12 h-24 w-24 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl pointer-events-none" />

                    {/* Icon container */}
                    <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border ${details.colorClass}`}>
                        <IconComponent className="h-8 w-8" />
                    </div>

                    {/* Badge */}
                    <span className="inline-block rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-400 border border-red-500/20">
                        Warning {warningsCount} of {maxWarnings}
                    </span>

                    {/* Content */}
                    <h2 className="mt-4 text-xl font-bold text-white tracking-tight">{details.title}</h2>
                    <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                        {details.description}
                    </p>

                    {/* Callout box */}
                    <div className="mt-5 rounded-xl bg-slate-900/60 p-4 border border-slate-800 text-left">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wide">Critical Security Policy</h4>
                                <p className="mt-1 text-xs text-slate-400">
                                    You have <strong className="text-white">{remainingWarnings - 1} warning{remainingWarnings - 1 !== 1 ? 's' : ''} remaining</strong>. A 4th violation will trigger immediate, automatic submission and disqualify you.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Acknowledge Button */}
                    <button
                        type="button"
                        onClick={onAcknowledge}
                        className="mt-6 w-full rounded-xl bg-gradient-to-r from-red-600 to-orange-600 py-3 text-sm font-semibold text-white shadow-lg shadow-red-900/20 hover:from-red-500 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all transform active:scale-[0.98]"
                    >
                        I Acknowledge & Understand
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ActivityWarningModal;
