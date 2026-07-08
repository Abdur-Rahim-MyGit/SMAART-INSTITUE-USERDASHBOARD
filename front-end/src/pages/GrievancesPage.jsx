import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  LifeBuoy,
  MessageSquare,
  History,
  Plus,
  Loader2,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Inbox
} from 'lucide-react';
import GrievanceForm from '@/components/grievances/GrievanceForm';
import GrievanceDetail from '@/components/grievances/GrievanceDetail';
import { getMyGrievances } from '@/services/grievanceApi';

const GrievancesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'history'
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);

  // Fetch History on Tab Change or mount
  useEffect(() => {
    if (activeTab === 'history') {
      fetchGrievances();
    }
  }, [activeTab]);

  const fetchGrievances = async () => {
    try {
      setLoading(true);
      const response = await getMyGrievances();
      if (response.success) {
        setGrievances(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch grievances", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (newGrievance) => {
    setActiveTab('history');
    fetchGrievances(); // Refresh list
  };

  const statusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'text-emerald-600 bg-emerald-50 border-emerald-250 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'in-progress':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
      case 'closed':
        return 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20';
      case 'pending':
      default:
        return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    }
  };

  const getCategoryLabel = (cat) => {
    const config = {
      'placement': t("grievance.cat_placement", 'Placement'),
      'course': t("grievance.cat_course", 'Course'),
      'assessment': t("grievance.cat_assessment", 'Assessment'),
      'badges': t("grievance.cat_badges", 'Badges'),
      'certificate': t("grievance.cat_certificate", 'Certificate'),
      'career-direction': t("grievance.cat_career_direction", 'Career Direction'),
      'skill-passport': t("grievance.cat_skill_passport", 'Skill Passport'),
      'other-suggestion': t("grievance.cat_suggestions", 'Suggestions')
    };
    return config[cat] || cat;
  };

  // Calculate statistics
  const totalCount = grievances.length;
  const pendingCount = grievances.filter(g => g.status === 'pending' || g.status === 'in-progress').length;
  const resolvedCount = grievances.filter(g => g.status === 'resolved' || g.status === 'closed').length;

  return (
    <div className="min-h-screen bg-transparent pb-24">
      <div className="pt-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">

          {/* Back Button */}
          <div className="mb-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="group flex items-center gap-2 text-[#112b6b] dark:text-slate-300 text-[10px] font-bold uppercase tracking-[0.1em] hover:text-[#1a3884] transition-all"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-x-1 group-hover:shadow-md dark:border-white/10 dark:bg-slate-800">
                <ArrowLeft className="h-4 w-4" />
              </div>
              {t("grievance.back_to_dashboard", "Back to Dashboard")}
            </button>
          </div>

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0f2c59] dark:bg-[#1a3884] shadow-md shadow-[#0f2c59]/10">
                <LifeBuoy className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold leading-none tracking-tight text-slate-950 dark:text-white">
                  {t("grievance.title_header", "Grievance Redressal")}
                </h1>
                <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  {t("grievance.desc_header", "Submit and monitor complaints directly to SMAART Administration")}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 p-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm self-start md:self-auto flex-shrink-0">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all ${activeTab === 'create'
                  ? 'bg-[#0f2c59] dark:bg-[#1a3884] text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <Plus size={15} /> {t("grievance.new_tab", "Submit Grievance")}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all ${activeTab === 'history'
                  ? 'bg-[#0f2c59] dark:bg-[#1a3884] text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <History size={15} /> {t("grievance.history_tab", "Grievance History")}
              </button>
            </div>
          </motion.div>

          {/* Stats Section (Visible in History Tab) */}
          {activeTab === 'history' && !loading && grievances.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-450 dark:text-slate-400 block">{t("grievance.stats_total", "Total Submitted")}</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-450 dark:text-slate-400 block">{t("grievance.stats_pending", "Pending Resolution")}</span>
                <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm flex flex-col justify-center">
                <span className="text-xs font-semibold text-slate-450 dark:text-slate-400 block">{t("grievance.stats_resolved", "Resolved")}</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{resolvedCount}</span>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'create' ? (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {/* Information Callout */}
                <div className="p-4 rounded-2xl bg-[#1a3884]/5 dark:bg-[#1a3884]/15 border border-[#1a3884]/15 dark:border-white/10 shadow-sm flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#1a3884] dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-[#1a3884] dark:text-blue-300 block">
                      {t("grievance.safe_space", "Secure Grievance Portal")}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                      {t("grievance.safe_space_desc", "This system handles critical grievances directly with SMAART Admin handlers. Toggle anonymous mode if you wish to completely conceal your student identity details.")}
                    </p>
                  </div>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 p-6 sm:p-8 shadow-sm">
                  <GrievanceForm
                    onSuccess={handleSuccess}
                    onCancel={() => navigate("/dashboard")}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                {/* List Container */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                      <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#1a3884]" />
                      <p className="text-sm font-semibold">{t("grievance.loading", "Loading your grievance history...")}</p>
                    </div>
                  ) : grievances.length === 0 ? (
                    <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                      <div className="w-16 h-16 bg-slate-550/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Inbox className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-950 dark:text-white mb-2">
                        {t("grievance.empty_title", "No Grievances Found")}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto mb-6 leading-relaxed">
                        {t("grievance.empty_desc", "You haven't submitted any grievances yet. If you are experiencing serious issues, feel free to open a ticket.")}
                      </p>
                      <button
                        onClick={() => setActiveTab('create')}
                        className="px-6 py-2.5 bg-[#0f2c59] dark:bg-[#1a3884] text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                      >
                        {t("grievance.empty_btn", "Submit a Grievance")}
                      </button>
                    </div>
                  ) : (
                    grievances.map((item) => {
                      const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });

                      return (
                        <div
                          key={item._id}
                          onClick={() => setSelectedGrievance(item)}
                          className="relative bg-white dark:bg-slate-900 p-6 pl-8 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-[#1a3884]/40 hover:shadow-md hover:shadow-slate-200/10 dark:hover:shadow-none transition-all group cursor-pointer overflow-hidden"
                        >
                          {/* Left Bar Accent Color */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.status === 'resolved' ? 'bg-emerald-500' : item.isAnonymous ? 'bg-indigo-500' : 'bg-[#1a3884]'}`} />

                          {/* Top Row: ID, Category & Status */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold text-slate-450 uppercase tracking-wider">
                                #{item.grievanceId || item._id.slice(-6)}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold uppercase tracking-wider">
                                {getCategoryLabel(item.category)}
                              </span>
                              {item.isAnonymous && (
                                <span className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider">
                                  <ShieldCheck className="w-3 h-3" /> Anonymous
                                </span>
                              )}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(item.status)} capitalize shadow-sm flex-shrink-0`}>
                              {item.status.replace('-', ' ')}
                            </span>
                          </div>

                          {/* Grievance Title */}
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2.5 mb-1.5 leading-snug">
                            {item.title}
                          </h3>

                          {/* Description Excerpt */}
                          <p className="text-slate-550 dark:text-slate-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>

                          {/* Footer details */}
                          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-400 font-semibold pt-1">
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} className="text-slate-400" />
                              {dateStr}
                            </span>
                            {item.responses?.length > 0 && (
                              <span className="flex items-center gap-1.5 text-[#1a3884] dark:text-blue-400">
                                <MessageSquare size={14} />
                                {item.responses.length} {item.responses.length === 1 ? t("grievance.response", "Response") : t("grievance.responses", "Responses")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Detail Dialog */}
      <AnimatePresence>
        {selectedGrievance && (
          <GrievanceDetail
            grievance={selectedGrievance}
            onClose={() => setSelectedGrievance(null)}
            onUpdate={(updated) => {
              setGrievances(prev => prev.map(g =>
                g._id === updated._id ? updated : g
              ));
              setSelectedGrievance(updated);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GrievancesPage;
