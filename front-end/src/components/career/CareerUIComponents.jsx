import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const FormInput = ({ label, name, value, onChange, placeholder, required, type = 'text', icon: Icon }) => (
    <div className="group">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Icon size={18} />
                </div>
            )}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#002A5C] text-slate-800 dark:text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-300 dark:hover:border-slate-600`}
            />
        </div>
    </div>
);

export const FormSelect = ({ label, name, value, onChange, options, required, icon: Icon }) => (
    <div className="group">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10">
                    <Icon size={18} />
                </div>
            )}
            <select
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-10 py-3.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#002A5C] text-slate-800 dark:text-white appearance-none cursor-pointer transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-300 dark:hover:border-slate-600`}
            >
                <option value="">Select...</option>
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
    </div>
);

export const FormTextarea = ({ label, name, value, onChange, placeholder, required, icon: Icon }) => (
    <div className="group">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && (
                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Icon size={18} />
                </div>
            )}
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                rows={3}
                className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#002A5C] text-slate-800 dark:text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-300 dark:hover:border-slate-600 resize-none`}
            />
        </div>
    </div>
);

export const CircularProgress = ({ percentage, label, color = '#6366f1', size = 120 }) => {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-700" />
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
                        strokeLinecap="round" strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                        className="text-2xl font-black text-slate-800 dark:text-white"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                    >
                        {percentage}%
                    </motion.span>
                </div>
            </div>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 text-center">{label}</span>
        </div>
    );
};

export const ReportSection = ({ title, icon: Icon, color, children, delay = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="bg-white dark:bg-[#002147] rounded-xl border border-slate-200 dark:border-white/8 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-[#F8FAFC] dark:hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-[#F8FAFC] dark:bg-[#002A5C] text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-white/10`}>
                        <Icon size={22} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown size={20} className="text-slate-400" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export const SkillTag = ({ text, variant = 'default' }) => {
    const variants = {
        default: 'bg-[#F8FAFC] dark:bg-[#002A5C] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10',
        success: 'bg-[#F8FAFC] dark:bg-[#002A5C] text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-white/10',
        warning: 'bg-[#F8FAFC] dark:bg-[#002A5C] text-amber-600 dark:text-amber-400 border-slate-200 dark:border-white/10',
        purple: 'bg-[#F8FAFC] dark:bg-[#002A5C] text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-white/10',
        rose: 'bg-[#F8FAFC] dark:bg-[#002A5C] text-rose-600 dark:text-rose-400 border-slate-200 dark:border-white/10',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${variants[variant]} transition-colors hover:bg-slate-100 dark:hover:bg-[#002A5C]`}>
            {text}
        </span>
    );
};

export const PriorityBadge = ({ priority }) => {
    const colors = {
        Critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20',
        High: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
        Medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    };

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colors[priority] || colors.Medium}`}>
            {priority}
        </span>
    );
};
