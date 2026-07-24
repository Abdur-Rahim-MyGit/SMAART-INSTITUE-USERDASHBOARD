import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Monitor,
  Video,
  User,
  Clock,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { proctoringApi } from '@/services/proctoringApi';
import { getBackendUrl } from '@/services/api';

const ProctoringDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('held');
  const [statusFilter, setStatusFilter] = useState('locked'); // Default to showing locked/held sessions
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected session for detailed view
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Lightbox modal state
  const [activeImage, setActiveImage] = useState(null);

  // Review states
  const [reviewNote, setReviewNote] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await proctoringApi.getSessions(params);
      if (res && res.success) {
        setSessions(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      toast.error('Failed to load proctoring sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [statusFilter]);

  const loadSessionDetails = async (id) => {
    setDetailsLoading(true);
    setSelectedSessionId(id);
    setReviewNote('');
    try {
      const res = await proctoringApi.getSessionDetails(id);
      if (res && res.success) {
        setSessionDetails(res.data);
      }
    } catch (err) {
      console.error('Failed to load details:', err);
      toast.error('Failed to load session details');
      setSelectedSessionId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleReviewDecision = async (decision) => {
    if (!sessionDetails?.session?._id) return;
    setSubmittingDecision(true);
    try {
      const res = await proctoringApi.unlockSession(sessionDetails.session._id, decision, reviewNote);
      if (res && res.success) {
        toast.success(`Session successfully resolved: ${decision}`);
        // Reload details and list
        await loadSessionDetails(sessionDetails.session._id);
        fetchSessions();
      } else {
        toast.error(res.error || 'Failed to submit review decision');
      }
    } catch (err) {
      console.error('Failed to submit review decision:', err);
      toast.error('Failed to submit review decision');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Active
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 size={12} /> Passed
          </span>
        );
      case 'flagged':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
            <AlertTriangle size={12} /> Flagged
          </span>
        );
      case 'terminated':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
            <XCircle size={12} /> Terminated
          </span>
        );
      case 'locked':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
            <ShieldAlert size={12} /> Held / Locked
          </span>
        );
      default:
        return <span className="text-xs uppercase text-gray-500 font-bold">{status}</span>;
    }
  };

  const getRiskColor = (score) => {
    if (score < 30) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30';
    if (score < 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/30';
    if (score < 80) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30';
    return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30';
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'tab_switch':
      case 'minimize':
      case 'fullscreen_exit':
        return <Monitor size={14} className="text-amber-600 dark:text-amber-400" />;
      case 'face_absent':
      case 'multiple_faces':
        return <Video size={14} className="text-rose-600 dark:text-rose-400" />;
      case 'attention_check_fail':
      case 'inactivity':
        return <Clock size={14} className="text-rose-500" />;
      case 'identity_verified':
        return <CheckCircle2 size={14} className="text-emerald-600" />;
      default:
        return <Shield size={14} className="text-slate-500" />;
    }
  };

  // Filtered Sessions by search query
  const filteredSessions = sessions.filter(session => {
    const fullName = session.userId?.fullName?.toLowerCase() || '';
    const email = session.userId?.email?.toLowerCase() || '';
    const studentId = session.userId?.studentId?.toLowerCase() || '';
    const assessmentName = session.assessmentId?.assessmentName?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();

    return fullName.includes(query) || email.includes(query) || studentId.includes(query) || assessmentName.includes(query);
  });

  const totalFlagged = sessions.filter(s => s.status === 'flagged').length;
  const totalTerminated = sessions.filter(s => s.status === 'terminated').length;
  const avgRisk = sessions.length > 0 ? Math.round(sessions.reduce((acc, curr) => acc + (curr.riskScore || 0), 0) / sessions.length) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] p-4 md:p-8 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-[#112b6b] dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-7 h-7 text-[#1a3884]" />
              AI Proctoring Reviews
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Review integrity metrics, liveness checks, and flagged assessment violation logs.
            </p>
          </div>
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-[#112b6b] dark:text-white hover:bg-slate-50 dark:hover:bg-[#002a5c] shadow-sm disabled:opacity-60 transition-all active:scale-95"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#002147] rounded-3xl p-5 border border-slate-150 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Monitored</p>
            <p className="text-3xl font-black text-[#1a3884] dark:text-white mt-1">{sessions.length}</p>
          </div>
          <div className="bg-white dark:bg-[#002147] rounded-3xl p-5 border border-slate-150 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-amber-500">Flagged Sessions</p>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{totalFlagged}</p>
          </div>
          <div className="bg-white dark:bg-[#002147] rounded-3xl p-5 border border-slate-150 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-rose-500">Lockout Submit</p>
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{totalTerminated}</p>
          </div>
          <div className="bg-white dark:bg-[#002147] rounded-3xl p-5 border border-slate-150 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Avg Risk Score</p>
            <p className="text-3xl font-black text-[#112b6b] dark:text-cyan-400 mt-1">{avgRisk}%</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-150 dark:border-white/5 mb-6">
          <button
            onClick={() => {
              setActiveTab('held');
              setStatusFilter('locked');
            }}
            className={`px-5 py-3 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${
              activeTab === 'held'
                ? 'border-[#1a3884] dark:border-cyan-400 text-[#1a3884] dark:text-cyan-400'
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
          >
            Held / Pending Review
          </button>
          <button
            onClick={() => {
              setActiveTab('all');
              setStatusFilter('');
            }}
            className={`px-5 py-3 text-xs font-black tracking-wider uppercase border-b-2 transition-all ${
              activeTab === 'all'
                ? 'border-[#1a3884] dark:border-cyan-400 text-[#1a3884] dark:text-cyan-400'
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350'
            }`}
          >
            All Sessions
          </button>
        </div>

        {/* Filters and List */}
        <div className="bg-white dark:bg-[#002147] rounded-3xl border border-slate-150 dark:border-white/5 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.04)] overflow-hidden">
          
          {/* Controls Bar */}
          <div className="p-5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-[#002147]/50">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate, student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#00152E] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a3884] dark:focus:ring-cyan-400 transition-all placeholder:font-normal placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 self-center hidden sm:block" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={activeTab === 'held'}
                className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#00152E] text-xs font-bold text-[#112b6b] dark:text-white focus:outline-none disabled:opacity-50"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed / Passed</option>
                <option value="flagged">Flagged</option>
                <option value="locked">Held / Locked</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          {/* Table / List */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-24 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a3884] mx-auto mb-3"></div>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">Fetching monitored telemetry...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="py-20 text-center">
                <Shield className="w-12 h-12 text-slate-200 dark:text-white/10 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">No proctoring records found</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/20 dark:bg-black/5">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Assessment</th>
                    <th className="px-6 py-4">Started At</th>
                    <th className="px-6 py-4 text-center">Violations</th>
                    <th className="px-6 py-4 text-center">Risk Score</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredSessions.map((session) => (
                    <tr
                      key={session._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                      onClick={() => loadSessionDetails(session._id)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-extrabold text-[#112b6b] dark:text-white group-hover:text-[#1a3884] transition-colors">{session.userId?.fullName || 'Anonymous'}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">ID: {session.userId?.studentId || 'N/A'} • {session.userId?.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">{session.assessmentId?.assessmentName || 'Baseline Assessment'}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{session.assessmentId?.assessmentCode || 'T1'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {new Date(session.startedAt || session.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className="px-6 py-4 text-center font-extrabold text-sm text-slate-700 dark:text-slate-300">
                        {session.totalViolations || 0}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black ${getRiskColor(session.riskScore)}`}>
                          {session.riskScore || 0}%
                        </span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(session.status)}</td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => loadSessionDetails(session._id)}
                          className="p-2 bg-slate-100 hover:bg-[#1a3884]/10 dark:bg-white/5 dark:hover:bg-[#1a3884]/30 rounded-xl transition-all"
                        >
                          <Eye size={14} className="text-[#1a3884] dark:text-cyan-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over details drawer */}
      <AnimatePresence>
        {selectedSessionId && (
          <>
            {/* Overlay background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSessionId(null)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Drawer Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-screen w-full sm:w-[500px] bg-white dark:bg-[#00152E] z-50 shadow-2xl flex flex-col border-l border-slate-200 dark:border-white/10"
            >
              {detailsLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1a3884] mb-3"></div>
                  <p className="text-slate-400 text-xs font-medium">Loading session timeline...</p>
                </div>
              ) : sessionDetails ? (
                <>
                  {/* Drawer Header */}
                  <div className="p-6 border-b border-slate-150 dark:border-white/5 bg-slate-50 dark:bg-[#002147]/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Candidate Detail</span>
                      <h3 className="text-lg font-black text-[#112b6b] dark:text-white mt-0.5">{sessionDetails.session?.userId?.fullName || 'Student'}</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{sessionDetails.session?.userId?.collegeName || 'SRM Institute'}</p>
                    </div>
                    <button
                      onClick={() => setSelectedSessionId(null)}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Drawer Body Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    {/* Risk Summary card */}
                    <div className="p-4 bg-slate-50 dark:bg-[#002147]/40 rounded-2xl border border-slate-100 dark:border-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-500">Security Composite Risk</span>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${getRiskColor(sessionDetails.session?.riskScore)}`}>
                          {sessionDetails.session?.riskScore || 0}% Risk
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-white/10 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500`}
                          style={{
                            width: `${sessionDetails.session?.riskScore || 0}%`,
                            background: `linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #ef4444 100%)`
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                        Score calculated dynamically based on severity weightings of infractions.
                      </p>
                    </div>

                    {/* Action Section */}
                    {sessionDetails.session?.status === 'locked' ? (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl space-y-4 shadow-sm">
                        <div>
                          <h4 className="text-xs font-extrabold text-[#112b6b] dark:text-amber-305 uppercase tracking-widest flex items-center gap-1.5">
                            <ShieldAlert size={14} className="text-amber-600 dark:text-amber-450" />
                            Review Action Required
                          </h4>
                          <p className="text-[11px] text-slate-650 dark:text-slate-400 mt-1.5 font-medium bg-[#112b6b]/5 dark:bg-white/5 p-2.5 rounded-xl">
                            <strong>Reason:</strong> {sessionDetails.session?.lockReason || 'Held for review'}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Reviewer Note / Decision Reason</label>
                          <textarea
                            placeholder="Explain the reasoning for this decision. This note will be recorded in the student's notification..."
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-[#00152E] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a3884] dark:focus:ring-cyan-400 transition-all placeholder:text-slate-400 min-h-[75px] resize-none"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            onClick={() => handleReviewDecision('released')}
                            disabled={submittingDecision}
                            className="flex-1 min-w-[120px] px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm disabled:opacity-60"
                          >
                            <CheckCircle2 size={13} /> Release Score
                          </button>
                          <button
                            onClick={() => handleReviewDecision('retake')}
                            disabled={submittingDecision}
                            className="flex-1 min-w-[120px] px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm disabled:opacity-60"
                          >
                            <RefreshCw size={13} /> Allow Retake
                          </button>
                          <button
                            onClick={() => handleReviewDecision('invalidated')}
                            disabled={submittingDecision}
                            className="flex-1 min-w-[120px] px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm disabled:opacity-60"
                          >
                            <XCircle size={13} /> Invalidate
                          </button>
                        </div>
                      </div>
                    ) : sessionDetails.session?.decision?.state ? (
                      <div className="p-4 bg-slate-50 dark:bg-[#002147]/30 border border-slate-150 dark:border-white/5 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Review Outcome</span>
                          <span className={`inline-flex px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${
                            sessionDetails.session?.decision?.state === 'released'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30'
                              : sessionDetails.session?.decision?.state === 'retake'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450 border border-blue-100 dark:border-blue-900/30'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30'
                          }`}>
                            {sessionDetails.session?.decision?.state}
                          </span>
                        </div>
                        {sessionDetails.session?.decision?.note && (
                          <div className="text-xs text-slate-650 dark:text-slate-350 font-medium bg-white dark:bg-[#00152E] p-3 rounded-xl border border-slate-150 dark:border-white/5 italic">
                            "{sessionDetails.session?.decision?.note}"
                          </div>
                        )}
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold flex justify-between">
                          <span>Resolved at: {new Date(sessionDetails.session?.decision?.decidedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ) : null}

                    {/* Environment check details */}
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">System Checks</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-white dark:bg-[#002147] border border-slate-150 dark:border-white/5 rounded-2xl shadow-sm">
                          <p className="text-slate-400 dark:text-slate-500 font-medium">Camera Gating</p>
                          <p className="font-bold text-[#112b6b] dark:text-white mt-0.5">
                            {sessionDetails.session?.environmentCheck?.cameraGranted ? 'Passed' : 'Soft Setup'}
                          </p>
                        </div>
                        <div className="p-3 bg-white dark:bg-[#002147] border border-slate-150 dark:border-white/5 rounded-2xl shadow-sm">
                          <p className="text-slate-400 dark:text-slate-500 font-medium">Locked Fullscreen</p>
                          <p className="font-bold text-[#112b6b] dark:text-white mt-0.5">
                            {sessionDetails.session?.environmentCheck?.fullScreenGranted ? 'Enforced' : 'Not Granted'}
                          </p>
                        </div>
                        <div className="p-3 bg-white dark:bg-[#002147] border border-slate-150 dark:border-white/5 rounded-2xl shadow-sm col-span-2">
                          <p className="text-slate-400 dark:text-slate-500 font-medium">Candidate Device info</p>
                          <p className="font-bold text-[#112b6b] dark:text-white mt-0.5 leading-relaxed break-all">
                            {sessionDetails.session?.environmentCheck?.browserInfo || 'N/A'}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Resolution: {sessionDetails.session?.environmentCheck?.screenResolution || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Snapshots Gallery */}
                    {sessionDetails.events?.some(e => e.screenshotUrl) && (
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Webcam Screenshots</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {sessionDetails.events
                            .filter(e => e.screenshotUrl)
                            .map((event, idx) => (
                              <div
                                key={event._id || idx}
                                onClick={() => setActiveImage(`${getBackendUrl()}${event.screenshotUrl}`)}
                                className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 cursor-pointer shadow-sm group hover:shadow-md transition-all aspect-[4/3] bg-slate-900"
                              >
                                <img
                                  src={`${getBackendUrl()}${event.screenshotUrl}`}
                                  alt={event.eventType}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5">
                                  <p className="text-[10px] font-bold text-white uppercase tracking-wider">{event.eventType.replace('_', ' ')}</p>
                                  <p className="text-[8px] text-slate-300 font-medium mt-0.5">
                                    {new Date(event.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Violations Timeline */}
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Integrity Violations Timeline</h4>
                      
                      {sessionDetails.events?.length === 0 ? (
                        <p className="text-slate-400 text-xs italic">No violations occurred during this session.</p>
                      ) : (
                        <div className="space-y-4 pl-4 border-l border-slate-100 dark:border-white/5 relative ml-2">
                          {sessionDetails.events.map((event, idx) => (
                            <div key={event._id || idx} className="relative">
                              {/* Dot Icon indicator */}
                              <div className="absolute -left-[23px] top-0.5 p-1 bg-white dark:bg-[#00152E] border border-slate-100 dark:border-white/10 rounded-full shadow-sm">
                                {getEventIcon(event.eventType)}
                              </div>
                              <div className="pl-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-extrabold text-[#112b6b] dark:text-white capitalize">
                                    {event.eventType.replace('_', ' ')}
                                  </span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                                    {new Date(event.timestamp).toLocaleTimeString(undefined, {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{event.details}</p>
                                
                                {event.screenshotUrl && (
                                  <button
                                    onClick={() => setActiveImage(`${getBackendUrl()}${event.screenshotUrl}`)}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1a3884] dark:text-cyan-400 hover:underline mt-1.5"
                                  >
                                    View screenshot <ArrowRight size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Drawer Footer */}
                  <div className="p-4 border-t border-slate-150 dark:border-white/5 bg-slate-50 dark:bg-[#002147]/50 flex justify-end text-xs font-bold text-slate-400 dark:text-slate-500">
                    Session ID: {sessionDetails.session?._id}
                  </div>
                </>
              ) : null}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox photo modal */}
      <AnimatePresence>
        {activeImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
            >
              <X size={20} />
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-full max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900"
            >
              <img src={activeImage} alt="Webcam Snapshot" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProctoringDashboard;
