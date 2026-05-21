import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    Brain, Target, GraduationCap, Briefcase, Sparkles,
    Layers, Clock, Compass, Database, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight, Loader2, Rocket, Zap
} from 'lucide-react';

import {
    DEGREE_GROUPS, SPECIALISATIONS, FOUR_YEAR_DEGREES, SECTOR_OPTIONS,
    COMPANY_TYPES, INTEREST_OPTIONS, PLACEMENT_TIMELINES, SUGGESTED_SKILLS, DOMAINS, FORM_STEPS
} from './CareerConstants';
import { FormInput, FormTextarea } from './CareerUIComponents';

const CareerForm = ({
    currentStep, setCurrentStep,
    formData, setFormData,
    excelData,
    isGenerating, handleSubmit,
    report, setShowForm, startNew,
    validateStep
}) => {
    const [skillInput, setSkillInput] = useState('');
    const [roleSuggestions, setRoleSuggestions] = useState([]);
    const [isSearchingRole, setIsSearchingRole] = useState(false);
    const suggestionsRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setRoleSuggestions([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const renderFormStep = () => {
        switch (currentStep) {
            case 0: {
                const specs = SPECIALISATIONS[formData.degreeGroup];
                return (
                    <motion.div key="degree" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Degree Group <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {DEGREE_GROUPS.map(deg => (
                                    <button key={deg} type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, degreeGroup: deg, specialisation: '' }))}
                                        className={`p-3 rounded-xl border-2 text-sm font-semibold text-center transition-all duration-200 ${formData.degreeGroup === deg ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-md' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C]'}`}>
                                        {formData.degreeGroup === deg && <CheckCircle2 size={13} className="inline mr-1 text-indigo-500" />}{deg}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {specs && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Specialisation <span className="text-red-500">*</span> <span className="text-xs font-normal text-slate-400">(Conditional — based on your degree)</span></label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {specs.map(sp => (
                                        <button key={sp} type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, specialisation: sp }))}
                                            className={`p-3 rounded-xl border-2 text-sm font-semibold text-center transition-all duration-200 ${formData.specialisation === sp ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-violet-300 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C]'}`}>
                                            {formData.specialisation === sp && <CheckCircle2 size={13} className="inline mr-1 text-violet-500" />}{sp}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                );
            }

            case 1: {
                const isFour = FOUR_YEAR_DEGREES.includes(formData.degreeGroup);
                const years = isFour ? ['Year 1', 'Year 2', 'Year 3', 'Year 4'] : ['Year 1', 'Year 2', 'Year 3'];
                return (
                    <motion.div key="year" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                            <GraduationCap size={20} className="text-indigo-500" />
                            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{formData.degreeGroup}{formData.specialisation ? ` → ${formData.specialisation}` : ''}</span>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Year of Study <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {years.map(yr => (
                                    <button key={yr} type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, yearOfStudy: yr }))}
                                        className={`p-6 rounded-2xl border-2 text-center font-bold transition-all duration-200 ${formData.yearOfStudy === yr ? 'border-indigo-500 bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 scale-105' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-indigo-300 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C]'}`}>
                                        <div className="text-2xl font-black">{yr.split(' ')[1]}</div>
                                        <div className="text-xs mt-1 opacity-70">{yr}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );
            }

            case 2: {
                const addRole = (role) => {
                    if (!role || !role.trim()) return;
                    if (formData.jobRolePreferences.includes(role)) return;
                    if (formData.jobRolePreferences.length >= 5) { toast.error('Maximum 5 roles allowed'); return; }
                    setFormData(prev => ({ ...prev, jobRolePreferences: [...prev.jobRolePreferences, role], interestedJobRole: role }));
                    setRoleSuggestions([]);
                    setIsSearchingRole(false);
                };
                return (
                    <motion.div key="roles" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-medium">
                            Select <strong>1–5</strong> job roles. Search from our database or type your own and press Enter.
                        </div>
                        <div className="relative">
                            <div className="relative">
                                <Briefcase size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input id="roleSearchInput" type="text"
                                    placeholder="Search role… e.g. Data Analyst, UX Designer"
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#002A5C] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val.length > 1) {
                                            const matches = (excelData?.roles || []).filter(r => r.toLowerCase().includes(val.toLowerCase())).slice(0, 10);
                                            setRoleSuggestions(matches.length ? matches : [val]);
                                            setIsSearchingRole(true);
                                        } else { setRoleSuggestions([]); setIsSearchingRole(false); }
                                    }}
                                    onKeyDown={e => { if (e.key === 'Enter') { addRole(e.target.value); e.target.value = ''; } }}
                                />
                            </div>
                            {isSearchingRole && roleSuggestions.length > 0 && (
                                <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-white dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto no-scrollbar">
                                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase bg-[#F8FAFC] dark:bg-slate-700/50 border-b border-slate-100 dark:border-white/10">SMAART Role Database</div>
                                    {roleSuggestions.map((s, i) => (
                                        <button key={i} className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 dark:hover:bg-[#002A5C] transition-colors text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-white/10 last:border-0"
                                            onClick={() => { addRole(s); document.getElementById('roleSearchInput').value = ''; }}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {formData.jobRolePreferences.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.jobRolePreferences.map((r, i) => (
                                    <span key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-sm font-semibold border border-indigo-200 dark:border-indigo-500/30">
                                        {r}
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, jobRolePreferences: prev.jobRolePreferences.filter((_, j) => j !== i) }))} className="text-indigo-400 hover:text-red-500 transition-colors leading-none">✕</button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-slate-400">{formData.jobRolePreferences.length}/5 roles selected (minimum 1)</p>
                    </motion.div>
                );
            }

            case 3:
                return (
                    <motion.div key="sector" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-8">
                        <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 text-xs text-slate-500 font-medium">
                            Both fields are <strong>optional</strong> — they boost your career match score, not filter it.
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Sector Preference <span className="text-xs font-normal text-slate-400">(Optional · Max 2)</span></label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                                {SECTOR_OPTIONS.map(s => {
                                    const sel = formData.sectorPreference.includes(s);
                                    return (
                                        <button key={s} type="button"
                                            onClick={() => {
                                                if (sel) {
                                                    setFormData(prev => ({ ...prev, sectorPreference: prev.sectorPreference.filter(x => x !== s) }));
                                                } else if (formData.sectorPreference.length < 2) {
                                                    setFormData(prev => ({ ...prev, sectorPreference: [...prev.sectorPreference, s] }));
                                                } else {
                                                    toast.error('Maximum 2 sectors allowed');
                                                }
                                            }}
                                            className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${sel ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-emerald-300 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C]'}`}>
                                            {sel && <CheckCircle2 size={11} className="inline mr-1 text-emerald-500" />}{s}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Company Type Preference <span className="text-xs font-normal text-slate-400">(Optional)</span></label>
                            <div className="flex gap-4">
                                {COMPANY_TYPES.map(ct => (
                                    <button key={ct} type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, companyTypePreference: ct }))}
                                        className={`flex-1 py-5 rounded-2xl border-2 font-bold text-sm transition-all duration-200 flex flex-col items-center gap-1 ${formData.companyTypePreference === ct ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-md' : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C]'}`}>
                                        <span className="text-2xl">{ct === 'STARTUP' ? '🚀' : ct === 'TRADITIONAL' ? '🏢' : '🌐'}</span>
                                        <span className="text-xs">{ct}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );

            case 4:
                return (
                    <motion.div key="goals" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <FormTextarea label="Career Goal – Short Term (0–12 months)" name="shortTermGoal" value={formData.shortTermGoal} onChange={handleInputChange} placeholder="e.g., Land my first internship / entry-level role in data analytics by October" required icon={Target} />
                        <FormTextarea label="Career Goal – Long Term (3–5 years)" name="longTermGoal" value={formData.longTermGoal} onChange={handleInputChange} placeholder="e.g., Become a Senior Data Scientist at a product company or start my own AI venture" required icon={Rocket} />
                    </motion.div>
                );

            case 5:
                return (
                    <motion.div key="interests" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                            Select up to <strong>3</strong> interest areas that best describe you. <span className="text-red-400">*</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {INTEREST_OPTIONS.map(item => {
                                const sel = formData.interests.includes(item.name);
                                return (
                                    <button key={item.name} type="button"
                                        onClick={() => {
                                            if (sel) {
                                                setFormData(prev => ({ ...prev, interests: prev.interests.filter(x => x !== item.name) }));
                                            } else if (formData.interests.length < 3) {
                                                setFormData(prev => ({ ...prev, interests: [...prev.interests, item.name] }));
                                            } else {
                                                toast.error('Maximum 3 interests allowed');
                                            }
                                        }}
                                        className={`p-4 rounded-2xl border-2 text-center flex flex-col items-center gap-2 transition-all duration-200 ${sel ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-lg scale-105' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C]'}`}>
                                        <span className="text-2xl">{item.icon}</span>
                                        <span className="text-xs font-bold leading-tight">{item.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-400">{formData.interests.length}/3 selected</p>
                    </motion.div>
                );

            case 6:
                return (
                    <motion.div key="timeline" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {PLACEMENT_TIMELINES.map(tl => {
                                const isPri = tl === 'Within 6 months';
                                const sel = formData.placementTimeline === tl;
                                return (
                                    <button key={tl} type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, placementTimeline: tl, isPriority: isPri }))}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${sel ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-xl shadow-indigo-500/10 scale-[1.02]' : 'border-slate-200 dark:border-white/10 hover:border-indigo-300 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C]'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-sm font-bold ${sel ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>{tl}</span>
                                            <div className="flex items-center gap-2">
                                                {isPri && <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">⚡ Priority</span>}
                                                {sel && <CheckCircle2 size={16} className="text-indigo-500" />}
                                            </div>
                                        </div>
                                        {isPri && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Your profile will be fast-tracked for skill ranking</p>}
                                    </button>
                                );
                            })}
                        </div>
                        {formData.isPriority && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                <Zap size={18} className="text-amber-500 flex-shrink-0" />
                                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">You are marked as a <strong>Priority Candidate</strong> — your skills will be ranked first.</p>
                            </motion.div>
                        )}
                    </motion.div>
                );

            case 7: {
                const suggested = [...new Set([...(SUGGESTED_SKILLS[formData.degreeGroup] || []), ...SUGGESTED_SKILLS.default])];
                const addSkill = (sk) => {
                    if (!sk || !sk.trim()) return;
                    if (formData.currentSkills.includes(sk.trim())) return;
                    setFormData(prev => ({ ...prev, currentSkills: [...prev.currentSkills, sk.trim()] }));
                    setSkillInput('');
                };
                return (
                    <motion.div key="skills" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 text-xs text-slate-500 font-medium">
                            Add skills from the suggestions below, or type any skill (programming language, tool, soft skill, certification) and press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-[#003170] rounded text-[10px] font-mono">Enter</kbd> or click Add.
                        </div>
                        <div className="flex gap-2">
                            <input type="text" value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                                placeholder="e.g. Python, Leadership, AWS, Figma…"
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#002A5C] text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" />
                            <button type="button" onClick={() => addSkill(skillInput)}
                                className="px-5 py-3 rounded-xl bg-[#1a3884] text-white font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all">Add</button>
                        </div>
                        {formData.currentSkills.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[#F8FAFC] dark:bg-[#002A5C] border border-slate-200 dark:border-white/10">
                                {formData.currentSkills.map((sk, i) => (
                                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-sm font-semibold border border-indigo-200 dark:border-indigo-500/30">
                                        {sk}
                                        <button type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, currentSkills: prev.currentSkills.filter((_, j) => j !== i) }))}
                                            className="text-indigo-400 hover:text-red-500 transition-colors leading-none ml-0.5">✕</button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Suggested for {formData.degreeGroup || 'your degree'}</p>
                            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto no-scrollbar">
                                {suggested.filter(sk => !formData.currentSkills.includes(sk)).map((sk, i) => (
                                    <button key={i} type="button" onClick={() => addSkill(sk)}
                                        className="px-3 py-1.5 rounded-full border border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-xs font-medium hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all">
                                        + {sk}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">{formData.currentSkills.length} skill{formData.currentSkills.length !== 1 ? 's' : ''} added</p>
                    </motion.div>
                );
            }

            case 8:
                return (
                    <motion.div key="domain" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-2">
                                <div className="p-8 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm border border-slate-200 dark:border-white/10 relative overflow-hidden h-full">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <h3 className="text-2xl font-black mb-4">Confirm Target</h3>
                                        <p className="text-white/80 dark:text-slate-600 text-sm leading-relaxed mb-6">Skills, roadmap &amp; market data will be generated based on this domain.</p>
                                        <div className="mt-auto space-y-3">
                                            <div className="p-3 rounded-2xl bg-black/20 dark:bg-slate-100 border border-white/10 dark:border-slate-200">
                                                <p className="text-[10px] uppercase font-black tracking-widest text-indigo-300 dark:text-indigo-600 mb-1">Target Roles</p>
                                                <p className="text-sm font-bold">{formData.jobRolePreferences.join(', ') || 'Not Selected'}</p>
                                            </div>
                                            {formData.isPriority && (
                                                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-xs font-bold text-amber-300 dark:text-amber-700 text-center">⚡ Priority Candidate</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-3 space-y-4">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Which domain should the data be generated from? <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
                                    {DOMAINS.map(domain => (
                                        <button key={domain} type="button" onClick={() => setFormData(prev => ({ ...prev, domain }))}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${formData.domain === domain ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-lg' : 'border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:bg-slate-700/30'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold">{domain}</span>
                                                {formData.domain === domain ? <CheckCircle2 size={16} className="text-indigo-500" /> : <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {formData.domain === 'Others' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <FormInput label="Specify Custom Domain" name="domainOther" value={formData.domainOther} onChange={handleInputChange} placeholder="e.g., Quantum Computing, Neurotech" icon={Target} required />
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );

        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-[#002147] rounded-2xl border border-slate-200 dark:border-white/8 shadow-sm overflow-hidden">
            {/* Step Indicator */}
            <div className="p-6 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    {FORM_STEPS.map((step, i) => {
                        const StepIcon = step.icon;
                        const isActive = i === currentStep;
                        const isCompleted = i < currentStep;
                        return (
                            <div key={step.id} className="flex items-center">
                                <button
                                    onClick={() => i <= currentStep && setCurrentStep(i)}
                                    className={`relative flex flex-col items-center gap-2 transition-all duration-300 ${i <= currentStep ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-white dark:bg-[#002A5C] shadow-sm border border-slate-200 dark:border-white/10 text-white shadow-lg shadow-indigo-500/30 scale-110'
                                        : isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                            : 'bg-slate-100 dark:bg-[#003170] text-slate-400'
                                        }`}>
                                        {isCompleted ? <CheckCircle2 size={20} /> : <StepIcon size={20} />}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider hidden md:block ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                                        {step.title}
                                    </span>
                                </button>
                                {i < FORM_STEPS.length - 1 && (
                                    <div className={`w-12 lg:w-20 h-0.5 mx-2 rounded-full transition-colors ${i < currentStep ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-[#003170]'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="p-8">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{FORM_STEPS[currentStep].title}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{FORM_STEPS[currentStep].description}</p>
                </div>

                <AnimatePresence mode="wait">
                    {renderFormStep()}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="p-6 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                <button
                    onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${currentStep === 0 ? 'opacity-40 cursor-not-allowed text-slate-400' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#002A5C]'
                        }`}
                >
                    <ArrowLeft size={16} /> Back
                </button>

                {report && !showForm && (
                    <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl font-semibold text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all">
                        View Report
                    </button>
                )}

                {currentStep < FORM_STEPS.length - 1 ? (
                    <button
                        onClick={() => validateStep() && setCurrentStep(currentStep + 1)}
                        disabled={!validateStep()}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${validateStep()
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100'
                            : 'bg-slate-200 dark:bg-[#003170] text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        Next <ArrowRight size={16} />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={!validateStep() || isGenerating}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all ${validateStep() && !isGenerating
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100'
                            : 'bg-slate-200 dark:bg-[#003170] text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Brain size={16} /> Generate Career Intelligence</>}
                    </button>
                )}
            </div>

            {/* Existing report banner */}
            {report && (
                <div className="px-6 pb-6">
                    <button
                        onClick={() => setShowForm(false)}
                        className="w-full p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-200 dark:border-indigo-500/20 text-center hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-500/20 dark:hover:to-purple-500/20 transition-all"
                    >
                        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                            📊 You have a previous Career Intelligence Report — <span className="underline">View it here</span>
                        </span>
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default CareerForm;
