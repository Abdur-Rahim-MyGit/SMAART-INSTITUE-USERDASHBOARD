import { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  IconBriefcase as Briefcase,
  IconBuilding as Building,
  IconCalendarDue as CalendarDue,
  IconClock as Clock,
  IconMapPin as MapPin,
  IconRefresh as Refresh,
  IconSearch as Search,
  IconTag as Tag,
  IconArrowLeft as ArrowLeft,
  IconFilter as Filter,
  IconX as X,
  IconExternalLink as ExternalLink,
  IconSparkles as Sparkles,
  IconTrendingUp as TrendingUp,
  IconBriefcase2 as Briefcase2,
  IconCategory as Category,
  IconChevronRight as ChevronRight,
  IconBookmark as Bookmark,
  IconBookmarkFilled as BookmarkFilled,
  IconCircleCheck as CircleCheck
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl, placementsAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { createPortal } from "react-dom";
import useUser from "@/hooks/useUser";
import OfferLetterModal from "@/components/OfferLetterModal";

const formatDate = (value, t) => {
  if (!value) return t("placement.no_deadline", "No deadline listed");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getDescription = (job, t) => {
  const value = job.description || job.jobDescription || job.summary || job.aboutRole || job.requirements;
  if (!value) return t("placement.no_details", "Role details will be shared by the placement team.");
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
};

const getSkills = (job) => {
  const raw = job.skills || job.requiredSkills || job.skillSet || job.technologies || [];
  if (Array.isArray(raw)) return raw.filter(Boolean).slice(0, 5);
  if (typeof raw === "string") {
    return raw.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 5);
  }
  return [];
};

const normalizeJobType = (job) => {
  // Look through several possible fields to find a type string
  const candidates = [job.displayType, job.type, job.jobType, job.employmentType, job.displayJobType]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  const combined = candidates.join(' ');
  if (!combined) return 'other';

  if (combined.includes('intern')) return 'internship';
  if (combined.includes('part')) return 'part-time';
  if (combined.includes('full') || combined.includes('permanent') || combined.includes('f‑time')) return 'full-time';

  return 'other';
};

const getCompanyLogo = (job) => {
  const logo = job.displayCompanyLogo || job.companyLogo || job.logo || job.logoUrl || job.companyLogoUrl || job.employerLogo || job.organisationLogo || null;
  if (!logo || typeof logo !== "string") return null;
  if (/^(https?:|data:|blob:)/i.test(logo)) return logo;
  return `${getBackendUrl()}/${logo.replace(/^\/+/, "")}`;
};

const formatStatus = (value, t) => {
  if (!value) return t("placement.active", "Active");
  let norm = String(value).toLowerCase().replace(/[-_]/g, "_");
  if (norm === 'open') norm = 'active';
  if (norm === 'closed') norm = 'inactive';
  const key = `placement.status_${norm}`;
  const fallback = String(norm).replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  return t(key, fallback);
};

const getStatusTextColor = (status) => {
  const norm = String(status || '').toLowerCase().replace(/[-_]/g, ' ').trim();
  switch (norm) {
    case 'applied':
      return "text-blue-600 dark:text-blue-400";
    case 'under review':
      return "text-amber-600 dark:text-amber-400";
    case 'declined':
      return "text-slate-500 dark:text-slate-400";
    case 'shortlisted':
      return "text-purple-600 dark:text-purple-400";
    case 'hold':
    case 'in progress':
      return "text-amber-600 dark:text-amber-400";
    case 'selected':
    case 'accepted':
    case 'hired':
      return "text-emerald-600 dark:text-emerald-400";
    case 'rejected':
      return "text-rose-600 dark:text-rose-400";
    default:
      return "text-slate-600 dark:text-slate-400";
  }
};

/**
 * Returns a LinkedIn-style "Posted X ago" label.
 * Calculation is purely client-side from the existing createdAt timestamp.
 */
const getPostedAgo = (createdAt, t) => {
  if (!createdAt) return null;
  const posted = new Date(createdAt);
  if (Number.isNaN(posted.getTime())) return null;
  const diffMs = Date.now() - posted.getTime();
  if (diffMs < 0) return null; // future date — don't show
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return t("placement.posted_today", "Posted Today");
  if (days === 1) return t("placement.posted_day_ago", "Posted 1 day ago");
  if (days < 7) return t("placement.posted_days_ago", { count: days, defaultValue: `Posted ${days} days ago` });
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return t("placement.posted_week_ago", "Posted 1 week ago");
  if (weeks < 5) return t("placement.posted_weeks_ago", { count: weeks, defaultValue: `Posted ${weeks} weeks ago` });
  const months = Math.floor(days / 30);
  if (months === 1) return t("placement.posted_month_ago", "Posted 1 month ago");
  return t("placement.posted_months_ago", { count: months, defaultValue: `Posted ${months} months ago` });
};

const Placement = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useUser();
  const hasLoadedRef = useRef(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loadingApplied, setLoadingApplied] = useState(false);
  const [jobFairs, setJobFairs] = useState([]);
  const [loadingFairs, setLoadingFairs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [jobType, setJobType] = useState('all');
  const [workMode, setWorkMode] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Companies State
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [companyTypeFilter, setCompanyTypeFilter] = useState("all");
  
  // Master-Detail State
  const [selectedJob, setSelectedJob] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAppId, setConfirmAppId] = useState(null);
  const [confirmAppTitle, setConfirmAppTitle] = useState('');
  
  // Offer Letter State
  const [offerModalApp, setOfferModalApp] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await placementsAPI.getJobs({ limit: 150 });
      setJobs(response?.data || []);
    } catch (error) {
      console.error("Failed to load placement jobs:", error);
      toast({
        title: t("placement.error_load_jobs_title", "Could not load jobs"),
        description: error.message || t("placement.error_load_jobs_desc", "Please try again in a moment."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchApplied = async () => {
    setLoadingApplied(true);
    try {
      const response = await placementsAPI.listApplications();
      const apps = response?.data || [];

      // The API now attaches the resolved posting (and flags jobRemoved when it no
      // longer exists). Older responses may still hand back a bare id, so fetch those
      // individually as a fallback.
      const enriched = await Promise.all(apps.map(async (app) => {
        if (app?.job && typeof app.job === 'string') {
          try {
            const jobResp = await placementsAPI.getJob(app.jobSource || 'jobpostings', app.job);
            if (jobResp?.data) return { ...app, job: jobResp.data };
          } catch (e) {
            // Posting was deleted — keep the application, mark it so the card can say so.
            return { ...app, jobRemoved: true };
          }
        }
        return app;
      }));

      setAppliedJobs(enriched);
    } catch (error) {
      console.error('Failed to load applications:', error);
      toast({ title: t("placement.error_load_apps_title", "Could not load applications"), description: error.message || t("placement.error_withdraw_desc", "Please try again"), variant: 'destructive' });
    } finally {
      setLoadingApplied(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'status') {
      fetchApplied();
    } else if (activeTab === 'job-fair') {
      fetchJobFairs();
    }
  }, [activeTab]);

  const fetchCompaniesData = async () => {
    setLoadingCompanies(true);
    try {
      const response = await placementsAPI.getCompanies();
      setCompanies(response?.data || []);
    } catch (error) {
      console.error('Failed to load companies:', error);
      toast({ title: 'Could not load partners', description: error.message || 'Please try again', variant: 'destructive' });
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'companies' && companies.length === 0) {
      fetchCompaniesData();
    }
  }, [activeTab, companies.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveTab('jobs');
    setSelectedJob(null);
  };

  const fetchJobFairs = async () => {
    setLoadingFairs(true);
    try {
      const response = await placementsAPI.getJobFairs();
      setJobFairs(response?.data || []);
    } catch (error) {
      console.error("Failed to load job fairs:", error);
      toast({
        title: t("placement.error_load_fairs_title", "Could not load job fairs"),
        description: error.message || t("placement.error_load_fairs_desc", "Please try again in a moment."),
        variant: "destructive",
      });
    } finally {
      setLoadingFairs(false);
    }
  };


  const sourceCounts = useMemo(() => {
    return jobs.reduce((acc, job) => {
      const key = job.sourceCollection || "jobpostings";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [jobs]);

  // Work modes actually present in the loaded postings, so the dropdown never
  // offers an option that would return nothing.
  const workModeOptions = useMemo(() => {
    const seen = new Map();
    jobs.forEach((job) => {
      const raw = (job.workMode || "").trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      if (!seen.has(key)) seen.set(key, raw);
    });
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return jobs.filter((job) => {
      const sourceMatch = sourceFilter === "all" || job.sourceCollection === sourceFilter;
      if (!sourceMatch) return false;

      if (jobType !== 'all') {
        const normalized = normalizeJobType(job);
        if (jobType === 'full-time' && normalized !== 'full-time') return false;
        if (jobType === 'part-time' && normalized !== 'part-time') return false;
        if (jobType === 'internship' && normalized !== 'internship') return false;
      }

      if (workMode !== 'all' && (job.workMode || "").trim().toLowerCase() !== workMode) return false;

      if (!query) return true;

      const haystack = [
        job.displayTitle,
        job.displayCompany,
        job.displayLocation,
        job.displayType,
        getDescription(job, t),
        getSkills(job).join(" "),
      ].join(" ").toLowerCase();

      return haystack.includes(query);
    });
  }, [jobs, searchQuery, sourceFilter, jobType, workMode, t]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchSearch = (c.name || '').toLowerCase().includes(companySearch.toLowerCase());
      const matchType = companyTypeFilter === 'all' || c.partnerType === companyTypeFilter;
      return matchSearch && matchType;
    });
  }, [companies, companySearch, companyTypeFilter]);

  // Derived Collections (for home view)
  const recommendedJobs = useMemo(() => {
    if (!jobs.length) return [];
    
    // Create a scoring system for jobs based on skills and career roles
    const scoredJobs = jobs.map(job => {
      let score = 0;
      const jobSkills = getSkills(job).map(s => s.toLowerCase());
      const jobTitle = (job.displayTitle || '').toLowerCase();
      
      return { job, score };
    });
    
    // Sort by score, keep only those with a score > 0, fallback to recent if none match
    const matches = scoredJobs.filter(j => j.score > 0).sort((a, b) => b.score - a.score).map(j => j.job);
    return matches.length > 0 ? matches.slice(0, 6) : jobs.slice(0, 6);
  }, [jobs]);

  const newJobs = useMemo(() => jobs.slice(0, 6), [jobs]);

  // Header summary: unique companies across all loaded postings
  const companyCount = useMemo(() => {
    const names = new Set();
    jobs.forEach((job) => {
      const name = (job.displayCompany || "").trim().toLowerCase();
      if (name) names.add(name);
    });
    return names.size;
  }, [jobs]);

  const rolesSummary = loading
    ? t("placement.loading_roles", "Loading opportunities…")
    : t("placement.active_roles_summary", {
        count: jobs.length,
        companies: companyCount,
        defaultValue: `${jobs.length} active roles from ${companyCount} companies`,
      });
  
  const internships = useMemo(() => jobs.filter(job => normalizeJobType(job) === 'internship').slice(0, 6), [jobs]);

  // ── EVENT HANDLERS ─────────────────────────────────────────────────────────

  const handleWithdraw = async (applicationId) => {
    try {
      await placementsAPI.deleteApplication(applicationId);
      setAppliedJobs((prev) => prev.filter((a) => a._id !== applicationId && a.id !== applicationId));
      toast({ title: t("placement.applied_toast_title", "Application withdrawn"), description: t("placement.applied_toast_desc", "Your application has been removed.") });
    } catch (err) {
      console.error('withdraw error', err);
      toast({ title: t("placement.error_withdraw_title", "Could not withdraw"), description: err.message || t("placement.error_withdraw_desc", "Please try again"), variant: 'destructive' });
    }
  };

  const handleUpdateStatus = async (applicationId, newStatus, eSignature = null, declineReason = null) => {
    try {
      await placementsAPI.updateApplicationStatus(applicationId, newStatus, eSignature, declineReason);
      toast({ title: t("placement.status_updated", "Status Updated"), description: `Offer ${newStatus.toLowerCase()} successfully.` });
      fetchApplied();
    } catch (err) {
      console.error('status update error', err);
      toast({ title: t("placement.error_update", "Could not update status"), description: err.message || 'Please try again', variant: 'destructive' });
    }
  };

  const openConfirm = (id, title) => {
    setConfirmAppId(id);
    setConfirmAppTitle(title || t("placement.this_application", "this application"));
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setConfirmAppId(null);
    setConfirmAppTitle('');
  };

  const confirmWithdraw = async () => {
    if (!confirmAppId) return;
    await handleWithdraw(confirmAppId);
    closeConfirm();
  };

  const renderStatusCards = () => {
    const renderCard = (app, origIdx) => {
      const jobRef = app.job || app.jobId || app.jobPosting || {};
      const title = app.jobTitle || app.displayTitle || (jobRef && jobRef.displayTitle) || 'Role';
      const companyName = app.companyName || app.displayCompany || (jobRef && jobRef.displayCompany) || 'Company';
      const displayType = app.displayType || (jobRef && (jobRef.displayType || jobRef.type)) || app.jobType || '';
      const jobObj = jobRef && typeof jobRef === 'object' ? jobRef : {};
      const companyLogo = getCompanyLogo(jobObj) || getCompanyLogo(app) || null;
      const companyInitial = (companyName || 'C').trim().charAt(0).toUpperCase();
      const appliedAt = app.appliedAt || app.createdAt;
      const statusLabel = formatStatus(app.status || app.applicationStatus || 'applied', t);
      const jobRemoved = app.jobRemoved === true;
      const appSource = app.jobSource || jobObj.sourceCollection || '';
      const isSmaartApp = jobObj.displaySource
        ? jobObj.displaySource === 'smaart'
        : app.displaySource
          ? app.displaySource === 'smaart'
          : appSource === 'smaartjobpostings' || /smaart/i.test(app.postingOrigin || '');
      const isSmaartJobFairFallback = (appSource === 'jobpostings' || jobObj?.sourceCollection === 'jobpostings') && isSmaartApp;
      const isJobFair = !!(app.jobFairId || app.jobFair || jobObj.jobFairId || jobObj.jobFair || jobObj.displayJobFairTitle || isSmaartJobFairFallback || /job[\s-]?fair/i.test(app.postingOrigin || '') || /job[\s-]?fair/i.test(jobObj.postingOrigin || '') || app.interviewLocation === 'Booth' || (app.statusHistory && app.statusHistory.some(h => /job[\s-]?fair/i.test(h.note))));
      let sourceLabel = app.postingOrigin || '';
      if (isJobFair) {
        sourceLabel = isSmaartApp ? t("placement.source_smaart_job_fair", "SMAART JOB FAIR") : t("placement.source_college_job_fair", "COLLEGE JOB FAIR");
      } else if (appSource) {
        sourceLabel = isSmaartApp ? t("placement.source_smaart", "SMAART") : t("placement.source_college", "COLLEGE");
      }

      // card key
      const cardId = app._id || app.id || origIdx;
      return (
        <motion.article
          key={cardId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(origIdx * 0.03, 0.3) }}
          className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-[#1a3884]/35 hover:shadow-[0_4px_20px_-4px_rgba(13,31,78,0.14)] dark:border-[#1a3884]/25 dark:bg-[#001630] dark:hover:border-[#1a3884]/60"
        >
          {/* Header: logo + title + company */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-[13px] font-semibold text-[#1a3884] dark:border-[#1a3884]/25 dark:bg-[#001a3d] dark:text-blue-300">
              {companyLogo ? (
                <img src={companyLogo} alt={`${companyName} logo`} className="h-full w-full object-contain p-1.5" />
              ) : (
                <span>{companyInitial}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 title={title} className="line-clamp-2 text-[15px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#0d1f4e] dark:text-white">{title}</h2>
              <p className="mt-1 truncate text-[13px] leading-tight text-slate-500 dark:text-slate-400">{companyName}</p>
            </div>
            {sourceLabel && (
              <span className={`mt-0.5 shrink-0 rounded-md px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.05em] ${
                isSmaartApp
                  ? 'bg-[#0d1f4e] text-white dark:bg-blue-500/90 dark:text-white'
                  : 'bg-[#eef2fb] text-[#1a3884] dark:bg-[#1a3884]/30 dark:text-blue-300'
              }`}>
                {sourceLabel}
              </span>
            )}
          </div>
          <div className="mt-4 grow space-y-[7px] text-[13px] leading-tight text-slate-600 dark:text-slate-300">
            {displayType && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                <span className="truncate">{displayType}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CalendarDue className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
              <span className="truncate">{t("placement.applied", "Applied")} {formatDate(appliedAt, t)}</span>
            </div>
            {jobRemoved && (
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <Building className="h-[15px] w-[15px] shrink-0" stroke={1.6} />
                <span className="truncate">{t("placement.posting_removed", "Posting no longer listed")}</span>
              </div>
            )}
          </div>
          {app.status === 'Offer' && app.offeredPackage ? (
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-[#1a3884]/20">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-emerald-600 dark:text-emerald-400">{t("placement.offer_received", "Offer Received 🎉")}</span>
                <span className="truncate text-[13.5px] font-semibold text-emerald-700 dark:text-emerald-300">{t("placement.congratulations", "Congratulations!")}</span>
              </div>
              <button
                onClick={() => setOfferModalApp(app)}
                className="h-8 shrink-0 rounded-lg bg-emerald-600 px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-emerald-700"
              >
                {t("placement.view_offer_letter", "View Offer Letter")}
              </button>
            </div>
          ) : (
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-5 dark:border-[#1a3884]/20">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-slate-400">{t("placement.status_label", "Status")}</span>
                <span className={`truncate text-[13.5px] font-semibold ${getStatusTextColor(app.status || app.applicationStatus || 'applied')}`}>{statusLabel}</span>
              </div>
              {!['Accepted', 'Declined', 'Hired'].includes(app.status) && (
                <button
                  onClick={() => openConfirm(app._id || app.id, title)}
                  className="h-9 shrink-0 rounded-lg border border-slate-200 px-3.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-[#1a3884]/30 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  {t("placement.withdraw", "Withdraw")}
                </button>
              )}
            </div>
          )}
        </motion.article>
      );
    };
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {appliedJobs.map((app, origIdx) => renderCard(app, origIdx))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Back Button (Mobile Mode Only) */}
        <div className="flex items-center sm:hidden mt-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="group flex items-center gap-3 w-fit selection:bg-transparent"
          >
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:shadow-md group-hover:border-slate-350 dark:group-hover:border-slate-600 transition-all duration-300">
              <ArrowLeft stroke={2.5} className="h-4 w-4 text-[#112b6b] dark:text-slate-300 group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[#112b6b] dark:text-blue-400 text-xs font-extrabold uppercase tracking-[0.15em] transition-colors group-hover:text-[#1a3884] dark:group-hover:text-blue-300">
              {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
            </span>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative mb-6 mt-6 flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)] md:flex-row md:items-center"
        >
          <div className="flex-1">
            <h1 className="text-[20px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
              {t("placement.title", "Placement")}
            </h1>
            <p className="mt-1 max-w-2xl text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              {t("placement.subtitle", "Explore active jobs from college placement postings and SMAART job postings.")}
            </p>
          </div>

          <div className="flex w-full flex-shrink-0 justify-start border-t border-[#d8e6f7] pt-4 dark:border-[#1a3884]/20 md:w-auto md:justify-end md:border-l md:border-t-0 md:pl-6 md:pt-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-col text-left">
                <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  {t("placement.open_roles", "Open Roles")}
                </span>
                <span
                  className="max-w-[200px] truncate text-[13px] font-bold text-[#0d1f4e] dark:text-white md:max-w-[250px]"
                  title={rolesSummary}
                >
                  {rolesSummary}
                </span>
              </div>

              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={fetchJobs}
                  disabled={loading}
                  title={t("placement.refresh", "Refresh")}
                  aria-label={t("placement.refresh", "Refresh")}
                  className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-[#d8e6f7] bg-white text-[#1a3884] transition-all hover:border-[#1a3884]/40 hover:bg-[#f5f8ff] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#1a3884]/25 dark:bg-[#001a3d] dark:text-blue-300 dark:hover:bg-[#002050]"
                >
                  <Refresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} stroke={2} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Unified toolbar: tabs + search + filters on one surface */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white shadow-[0_2px_16px_rgba(26,56,132,0.05)] dark:border-[#1a3884]/20 dark:bg-[#001630]">
          {/* Tabs: Jobs | Job Status | Job Fair | Partners */}
          <div className={`overflow-x-auto px-2 ${activeTab === 'jobs' ? 'border-b border-slate-200 dark:border-[#1a3884]/20' : ''}`}>
            <div className="flex min-w-max gap-1">
              {[
                { id: 'jobs', label: t("placement.jobs", "Jobs") },
                { id: 'status', label: t("placement.job_status", "Job Status") },
                { id: 'job-fair', label: t("placement.job_fair", "Job Fair") },
                { id: 'companies', label: t("placement.partners", "Partners") },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative h-11 whitespace-nowrap px-4 text-[13px] font-medium transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-[2px] after:rounded-t-full after:transition-colors ${
                    activeTab === tab.id
                      ? 'text-[#0d1f4e] after:bg-[#0d1f4e] dark:text-white dark:after:bg-blue-400'
                      : 'text-slate-500 after:bg-transparent hover:text-[#0d1f4e] dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'jobs' && (
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              {/* Left: search box */}
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("placement.search_placeholder", "Search roles, companies, skills")}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-10 pr-9 text-[13.5px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1a3884] focus:bg-white dark:border-[#1a3884]/30 dark:bg-[#001a3d] dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#001a3d]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label={t("placement.clear_search", "Clear search")}
                    className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-[#1a3884]/30"
                  >
                    <X className="h-3.5 w-3.5" stroke={2} />
                  </button>
                )}
              </div>

              {/* Right: filters dropdowns */}
              <div className="grid grid-cols-2 gap-3 sm:flex sm:shrink-0">
                {workModeOptions.length > 1 && (
                  <div className="relative">
                    <select
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value)}
                      className={`h-10 w-full cursor-pointer appearance-none rounded-lg border pl-3.5 pr-9 text-[13px] font-medium outline-none transition-colors focus:border-[#1a3884] sm:w-[154px] ${
                        workMode !== 'all'
                          ? 'border-[#1a3884]/50 bg-[#f1f5fd] text-[#1a3884] dark:border-[#1a3884] dark:bg-[#1a3884]/20 dark:text-blue-300'
                          : 'border-slate-200 bg-slate-50/70 text-[#0d1f4e] hover:border-slate-300 dark:border-[#1a3884]/30 dark:bg-[#001a3d] dark:text-white'
                      }`}
                    >
                      <option value="all">{t("placement.all_work_modes", "All work modes")}</option>
                      {workModeOptions.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <ChevronRight className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 ${workMode !== 'all' ? 'text-[#1a3884] dark:text-blue-300' : 'text-slate-400'}`} />
                  </div>
                )}

                <div className="relative">
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className={`h-10 w-full cursor-pointer appearance-none rounded-lg border pl-3.5 pr-9 text-[13px] font-medium outline-none transition-colors focus:border-[#1a3884] sm:w-[154px] ${
                      sourceFilter !== 'all'
                        ? 'border-[#1a3884]/50 bg-[#f1f5fd] text-[#1a3884] dark:border-[#1a3884] dark:bg-[#1a3884]/20 dark:text-blue-300'
                        : 'border-slate-200 bg-slate-50/70 text-[#0d1f4e] hover:border-slate-300 dark:border-[#1a3884]/30 dark:bg-[#001a3d] dark:text-white'
                    }`}
                  >
                    <option value="all">{t("placement.all_jobs", { count: jobs.length, defaultValue: "All jobs ({{count}})" })}</option>
                    <option value="smaartjobpostings">{t("placement.smaart_jobs", { count: sourceCounts.smaartjobpostings || 0, defaultValue: "SMAART ({{count}})" })}</option>
                    <option value="jobpostings">{t("placement.college_jobs", { count: sourceCounts.jobpostings || 0, defaultValue: "College ({{count}})" })}</option>
                  </select>
                  <ChevronRight className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 ${sourceFilter !== 'all' ? 'text-[#1a3884] dark:text-blue-300' : 'text-slate-400'}`} />
                </div>

                <div className="relative">
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className={`h-10 w-full cursor-pointer appearance-none rounded-lg border pl-3.5 pr-9 text-[13px] font-medium outline-none transition-colors focus:border-[#1a3884] sm:w-[136px] ${
                      jobType !== 'all'
                        ? 'border-[#1a3884]/50 bg-[#f1f5fd] text-[#1a3884] dark:border-[#1a3884] dark:bg-[#1a3884]/20 dark:text-blue-300'
                        : 'border-slate-200 bg-slate-50/70 text-[#0d1f4e] hover:border-slate-300 dark:border-[#1a3884]/30 dark:bg-[#001a3d] dark:text-white'
                    }`}
                  >
                    <option value="all">{t("placement.all_types", "All types")}</option>
                    <option value="full-time">{t("placement.full_time", "Full-Time")}</option>
                    <option value="part-time">{t("placement.part_time", "Part-Time")}</option>
                    <option value="internship">{t("placement.internship", "Internship")}</option>
                  </select>
                  <ChevronRight className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 ${jobType !== 'all' ? 'text-[#1a3884] dark:text-blue-300' : 'text-slate-400'}`} />
                </div>
              </div>
            </div>
          )}

        </div>

        {activeTab === 'jobs' && (
          <>
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[268px] animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-[#1a3884]/25 dark:bg-[#001630]" />
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-[#1a3884]/30 dark:bg-[#001630]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f8ff] dark:bg-[#1a3884]/15">
                  <Briefcase className="h-6 w-6 text-[#1a3884] dark:text-blue-300" />
                </div>
                <h2 className="text-base font-semibold text-[#0d1f4e] dark:text-white">{t("placement.no_jobs_found", "No placement jobs found")}</h2>
                <p className="mt-1 max-w-md text-[13px] text-slate-500 dark:text-slate-400">
                  {t("placement.no_jobs_desc", "Try changing the filter or check back when new opportunities are posted.")}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredJobs.map((job, index) => {
                  const skills = getSkills(job);
                  const companyLogo = getCompanyLogo(job);
                  const companyInitial = (job.displayCompany || "C").trim().charAt(0).toUpperCase();
                  const statusLabel = formatStatus(job.displayStatus || job.status, t);
                  const rawStatus = (job.displayStatus || job.status || "").toString().toLowerCase();
                  const isClosed = rawStatus.includes("closed");
                  const applyLabel = isClosed ? t("placement.closed", "Closed") : t("placement.view", "View Details");
                  const postedLabel = getPostedAgo(job.displayCreatedAt || job.createdAt, t);
                  const missedMustHaves = job.missedMustHaves || [];
                  const hasSkillGap = missedMustHaves.length > 0;
                  // "Matched" is only claimed when the backend actually evaluated
                  // this job (missedMustHaves present), the role has skill
                  // requirements, and nothing is missing. Jobs with no listed
                  // skills show neither state.
                  const skillsMatched =
                    Array.isArray(job.missedMustHaves) &&
                    !hasSkillGap &&
                    ((job.structuredSkills?.length || 0) > 0 || skills.length > 0);
                  const isSmaartPost = job.displaySource ? job.displaySource === 'smaart' : job.sourceCollection === 'smaartjobpostings';
                  const isSmaartJobFairPostFallback = job.sourceCollection === 'jobpostings' && isSmaartPost;
                  const isJobFairPost = !!(job.jobFairId || job.jobFair || isSmaartJobFairPostFallback || /job[\s-]?fair/i.test(job.postingOrigin || '') || /job[\s-]?fair/i.test(job.displayPostedBy || ''));

                  let sourceLabel = t("placement.source_college", "COLLEGE");
                  if (isJobFairPost) {
                    sourceLabel = isSmaartPost ? t("placement.source_smaart_job_fair", "SMAART JOB FAIR") : t("placement.source_college_job_fair", "COLLEGE JOB FAIR");
                  } else if (isSmaartPost) {
                    sourceLabel = t("placement.source_smaart", "SMAART");
                  }

                  // The named publisher. Recruiter accounts are frequently registered under the
                  // company name itself, and some seeded college refs no longer resolve — in both
                  // cases the badge already says everything, so skip the row instead of repeating it.
                  const postedBy = job.displayPostedBy;
                  const posterIsCompany = postedBy && postedBy.trim().toLowerCase() === (job.displayCompany || '').trim().toLowerCase();
                  const postedByLabel = postedBy && !posterIsCompany ? postedBy : null;
                  const deadlineLabel = job.displayDeadline ? formatDate(job.displayDeadline, t) : null;

                  return (
                    <motion.article
                      key={`${job.sourceCollection}-${job._id}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className={`group relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-[#1a3884]/35 hover:shadow-[0_4px_20px_-4px_rgba(13,31,78,0.14)] dark:border-[#1a3884]/25 dark:bg-[#001630] dark:hover:border-[#1a3884]/60 ${isClosed ? 'opacity-60' : ''}`}
                    >
                      {/* Header: logo + title + company */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-[13px] font-semibold text-[#1a3884] dark:border-[#1a3884]/25 dark:bg-[#001a3d] dark:text-blue-300">
                          {companyLogo ? (
                            <img
                              src={companyLogo}
                              alt={`${job.displayCompany} logo`}
                              className="h-full w-full object-contain p-1.5"
                            />
                          ) : (
                            <span>{companyInitial}</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2
                            title={job.displayTitle}
                            className="line-clamp-2 text-[15px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#0d1f4e] dark:text-white"
                          >
                            {job.displayTitle}
                          </h2>
                          <p className="mt-1 truncate text-[13px] leading-tight text-slate-500 dark:text-slate-400">
                            {job.displayCompany}
                          </p>
                        </div>

                        <div className="mt-0.5 flex shrink-0 flex-col items-end gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[10.5px] font-medium tracking-[0.02em] ${
                              isClosed
                                ? 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400'
                                : 'border-[#1a3884]/20 bg-white text-[#1a3884] dark:border-[#1a3884]/50 dark:bg-transparent dark:text-blue-300'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${isClosed ? 'bg-slate-400' : 'bg-[#1a3884] dark:bg-blue-400'}`} />
                            {statusLabel}
                          </span>
                          <span
                            className={`rounded-md px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.05em] ${
                              isSmaartPost
                                ? 'bg-[#0d1f4e] text-white dark:bg-blue-500/90 dark:text-white'
                                : 'bg-[#eef2fb] text-[#1a3884] dark:bg-[#1a3884]/30 dark:text-blue-300'
                            }`}
                          >
                            {sourceLabel}
                          </span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="mt-4 space-y-[7px] text-[13px] leading-tight text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                          <span className="truncate">{job.displayLocation || t("placement.remote", "Remote")}</span>
                        </div>
                        {postedByLabel && (
                          <div className="flex items-center gap-2">
                            <Building className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                            <span className="truncate" title={postedByLabel}>{postedByLabel}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <CalendarDue className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                          {deadlineLabel ? (
                            <span className="truncate">
                              {t("placement.apply_by", "Apply by")} {deadlineLabel}
                            </span>
                          ) : (
                            <span className="truncate text-slate-400 dark:text-slate-500">
                              {t("placement.no_deadline_short", "No closing date set")}
                            </span>
                          )}
                        </div>
                        {job.displaySalary && (
                          <div className="flex items-center gap-2">
                            <Tag className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                            <span className="truncate">{job.displaySalary}</span>
                          </div>
                        )}
                      </div>

                      {skills.length > 0 && (
                        <div className="mt-3.5 flex flex-wrap gap-1.5">
                          {skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="rounded-md bg-slate-100 px-2 py-[3px] text-[11.5px] font-medium text-slate-600 dark:bg-[#001a3d] dark:text-slate-300">
                              {skill}
                            </span>
                          ))}
                          {skills.length > 3 && (
                            <span className="rounded-md px-1 py-[3px] text-[11.5px] font-medium text-slate-400">
                              +{skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Skills matched — a quiet positive signal. Skill gaps are
                          deliberately NOT flagged on the card; the detail page
                          breaks them down for the student instead. */}
                      {skillsMatched && (
                        <div className="mt-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/70 bg-emerald-50/70 px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.06em] text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/[0.07] dark:text-emerald-400">
                            <CircleCheck className="h-3.5 w-3.5" stroke={2} />
                            {t("placement.skills_matched", "Skills matched")}
                          </span>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-[#1a3884]/20">
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
                            {job.displayType}
                          </span>
                          {postedLabel && (
                            <span className="truncate text-[11px] text-slate-400 dark:text-slate-500">{postedLabel}</span>
                          )}
                        </div>
                        <button
                          onClick={() => !isClosed && navigate(`/dashboard/placement/${job.sourceCollection}/${job._id}`, { state: { job } })}
                          disabled={isClosed}
                          className={
                            isClosed
                              ? "flex h-9 shrink-0 cursor-not-allowed items-center justify-center rounded-lg bg-slate-100 px-4 text-[13px] font-medium text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                              : "group/btn flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0d1f4e] pl-4 pr-3.5 text-[13px] font-medium text-white outline-none transition-colors hover:bg-[#1a3884] focus-visible:ring-2 focus-visible:ring-[#1a3884]/40 focus-visible:ring-offset-2 active:scale-[0.98] dark:bg-[#1a3884] dark:hover:bg-[#24499e] dark:focus-visible:ring-offset-[#001630]"
                          }
                        >
                          <span>{applyLabel}</span>
                          {!isClosed && (
                            <ChevronRight
                              className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5"
                              stroke={2.2}
                            />
                          )}
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Job Status tab */}
        {activeTab === 'status' && (
          <div>
            {loadingApplied ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[236px] animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-[#1a3884]/25 dark:bg-[#001630]" />
                ))}
              </div>
            ) : appliedJobs.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-[#1a3884]/30 dark:bg-[#001630]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f8ff] dark:bg-[#1a3884]/15">
                  <Briefcase className="h-6 w-6 text-[#1a3884] dark:text-blue-300" />
                </div>
                <h2 className="text-base font-semibold text-[#0d1f4e] dark:text-white">{t("placement.no_applications_found", "No applications found")}</h2>
                <p className="mt-1 max-w-md text-[13px] text-slate-500 dark:text-slate-400">{t("placement.no_applications_desc", "You haven't applied to any jobs yet.")}</p>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="mt-5 h-9 rounded-lg bg-[#0d1f4e] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1a3884]"
                >
                  {t("placement.browse_jobs", "Browse Jobs")}
                </button>
              </div>
            ) : renderStatusCards()}

          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div>
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder={t("placement.search_company_placeholder", "Search by company name")}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#1a3884] focus:ring-[3px] focus:ring-[#1a3884]/10 dark:border-[#1a3884]/30 dark:bg-[#001630] dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
              <div className="relative sm:w-[180px]">
                <select
                  value={companyTypeFilter}
                  onChange={(e) => setCompanyTypeFilter(e.target.value)}
                  className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-9 text-[13px] font-medium text-[#0d1f4e] outline-none transition-colors hover:border-[#1a3884]/40 focus:border-[#1a3884] focus:ring-[3px] focus:ring-[#1a3884]/10 dark:border-[#1a3884]/30 dark:bg-[#001630] dark:text-white"
                >
                  <option value="all">{t("placement.all_partners", "All Partners")}</option>
                  <option value="smaart">{t("placement.smaart_partners", "SMAART Partners")}</option>
                  <option value="college">{t("placement.college_partners", "College Partners")}</option>
                </select>
                <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
              </div>
            </div>

            {loadingCompanies ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-[232px] animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-[#1a3884]/25 dark:bg-[#001630]" />
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-[#1a3884]/30 dark:bg-[#001630]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f8ff] dark:bg-[#1a3884]/15">
                  <Building className="h-6 w-6 text-[#1a3884] dark:text-blue-300" stroke={1.6} />
                </div>
                <h2 className="text-base font-semibold text-[#0d1f4e] dark:text-white">{t("placement.no_partners_found", "No partners found")}</h2>
                <p className="mt-1 max-w-md text-[13px] text-slate-500 dark:text-slate-400">{t("placement.no_partners_desc", "Try adjusting your filters or search query.")}</p>
                {(companySearch || companyTypeFilter !== 'all') && (
                  <button
                    onClick={() => { setCompanySearch(""); setCompanyTypeFilter("all"); }}
                    className="mt-5 h-9 rounded-lg bg-[#0d1f4e] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1a3884]"
                  >
                    {t("placement.clear_filters", "Clear Filters")}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCompanies.map((partner) => {
                  const companyInitial = (partner.name || "C").trim().charAt(0).toUpperCase();
                  const isSmaart = partner.partnerType === 'smaart';

                  return (
                    <div
                      key={partner._id}
                      className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-[#1a3884]/35 hover:shadow-[0_4px_20px_-4px_rgba(13,31,78,0.14)] dark:border-[#1a3884]/25 dark:bg-[#001630] dark:hover:border-[#1a3884]/60"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-[#1a3884] dark:border-[#1a3884]/25 dark:bg-[#001a3d] dark:text-blue-300">
                          {partner.logo && (
                            <img
                              src={partner.logo.startsWith('http') || partner.logo.startsWith('data:') ? partner.logo : `${getBackendUrl()}/${partner.logo.replace(/^\/+/, '')}`}
                              alt=""
                              className="absolute inset-0 h-full w-full object-contain p-1.5"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                          )}
                          <span style={{ display: partner.logo ? 'none' : 'flex' }} className="h-full w-full items-center justify-center">{companyInitial}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em] text-[#0d1f4e] dark:text-white" title={partner.name}>
                            {partner.name}
                          </h3>
                          <span className={`mt-1.5 inline-flex rounded-md px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.05em] ${
                            isSmaart
                              ? 'bg-[#0d1f4e] text-white dark:bg-blue-500/90 dark:text-white'
                              : 'bg-[#eef2fb] text-[#1a3884] dark:bg-[#1a3884]/30 dark:text-blue-300'
                          }`}>
                            {isSmaart ? t("placement.smaart_partner", "SMAART Partner") : t("placement.college_partner", "College Partner")}
                          </span>
                        </div>
                      </div>

                      {partner.website && (
                        <a
                          href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3.5 flex items-center gap-1.5 text-[12.5px] font-medium text-[#1a3884] transition-colors hover:underline dark:text-blue-400"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" stroke={1.8} />
                          <span className="truncate">{partner.website.replace(/^https?:\/\//i, '')}</span>
                        </a>
                      )}

                      {partner.description && (
                        <p className="mt-3 line-clamp-3 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                          {partner.description}
                        </p>
                      )}

                      <div className="mt-auto pt-4">
                        <button
                          onClick={() => {
                            setSearchQuery(partner.name);
                            setActiveTab('jobs');
                          }}
                          className="flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-slate-200 text-[13px] font-medium text-[#0d1f4e] transition-colors hover:border-[#1a3884]/40 hover:bg-[#f5f8ff] dark:border-[#1a3884]/30 dark:text-slate-200 dark:hover:bg-[#001a3d]"
                        >
                          {t("placement.view_jobs", "View Jobs")}
                          <ChevronRight className="h-3.5 w-3.5" stroke={2} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Job Fair Tab */}
        {activeTab === 'job-fair' && (
          <div>
            {loadingFairs ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-[268px] animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-[#1a3884]/25 dark:bg-[#001630]" />
                ))}
              </div>
            ) : jobFairs.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-[#1a3884]/30 dark:bg-[#001630]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f8ff] dark:bg-[#1a3884]/15">
                  <Briefcase className="h-6 w-6 text-[#1a3884] dark:text-blue-300" />
                </div>
                <h2 className="text-base font-semibold text-[#0d1f4e] dark:text-white">{t("placement.no_fairs_found", "No Job Fairs found")}</h2>
                <p className="mt-1 max-w-md text-[13px] text-slate-500 dark:text-slate-400">
                  {t("placement.no_fairs_desc", "There are no active or upcoming job fairs at this moment.")}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {jobFairs.map((fair, index) => {
                  const isRegistered = fair.registeredStudents?.some(student => {
                    const studentId = typeof student === 'object' ? (student._id || student.id) : student;
                    return studentId === user?._id;
                  });
                  const totalRegistered = fair.registeredStudents?.length || 0;
                  const bannerImageUrl = fair.bannerImage ?
                    (fair.bannerImage.startsWith('http') ? fair.bannerImage : `${getBackendUrl()}/${fair.bannerImage.replace(/^\/+/, "")}`) :
                    null;
                  const fairJobs = Array.isArray(fair.jobs) ? fair.jobs : [];

                  return (
                    <motion.article
                      key={fair._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className="relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:border-[#1a3884]/35 hover:shadow-[0_4px_20px_-4px_rgba(13,31,78,0.14)] dark:border-[#1a3884]/25 dark:bg-[#001630] dark:hover:border-[#1a3884]/60"
                    >
                      {bannerImageUrl && (
                        <div className="h-32 w-full overflow-hidden border-b border-slate-100 dark:border-[#1a3884]/20">
                          <img src={bannerImageUrl} alt={fair.title} className="h-full w-full object-cover" />
                        </div>
                      )}

                      <div className="flex flex-1 flex-col p-5">
                        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-md px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.05em] ${
                            fair.label === 'smaart job fair'
                              ? 'bg-[#0d1f4e] text-white dark:bg-blue-500/90 dark:text-white'
                              : 'bg-[#eef2fb] text-[#1a3884] dark:bg-[#1a3884]/30 dark:text-blue-300'
                          }`}>
                            {fair.label === 'smaart job fair' ? t("placement.source_smaart_job_fair", "SMAART Job Fair") : t("placement.source_college_job_fair", "College Job Fair")}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[10.5px] font-medium ${
                            fair.status === 'active'
                              ? 'border-[#1a3884]/20 bg-white text-[#1a3884] dark:border-[#1a3884]/50 dark:bg-transparent dark:text-blue-300'
                              : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${fair.status === 'active' ? 'bg-[#1a3884] dark:bg-blue-400' : 'bg-slate-400'}`} />
                            {formatStatus(fair.status, t)}
                          </span>
                        </div>

                        <h2 className="line-clamp-2 text-[15px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#0d1f4e] dark:text-white">{fair.title}</h2>
                        {fair.description && (
                          <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-slate-500 dark:text-slate-400">{fair.description}</p>
                        )}

                        <div className="mt-4 space-y-[7px] text-[13px] leading-tight text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                            <span className="truncate">{fair.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CalendarDue className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                            <span className="truncate">
                              {formatDate(fair.startDate, t)} – {formatDate(fair.endDate, t)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                            <Clock className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                            <span className="truncate text-[12.5px]">
                              {t("placement.registered_count", { count: totalRegistered, defaultValue: `${totalRegistered} students registered` })}
                            </span>
                          </div>
                        </div>

                        {fairJobs.length > 0 && (
                          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-[12.5px] text-slate-500 dark:border-[#1a3884]/20 dark:text-slate-400">
                            <Briefcase className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                            <span>
                              {t("placement.fair_jobs_count", { count: fairJobs.length, defaultValue: `${fairJobs.length} ${fairJobs.length === 1 ? 'role' : 'roles'} posted` })}
                            </span>
                          </div>
                        )}
                        {/* Roles and registration both live on the fair page, so the
                            card carries a single action rather than competing buttons. */}
                        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                          {isRegistered && (
                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#1a3884]/20 bg-[#eef2fb] px-2 py-1 text-[10.5px] font-medium text-[#1a3884] dark:border-[#1a3884]/50 dark:bg-[#1a3884]/25 dark:text-blue-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#1a3884] dark:bg-blue-400" />
                              {t("placement.registered", "Registered")}
                            </span>
                          )}
                          <button
                            onClick={() => navigate(`/dashboard/placement/job-fair/${fair._id}`)}
                            className="group/btn ml-auto flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0d1f4e] pl-4 pr-3.5 text-[13px] font-medium text-white outline-none transition-colors hover:bg-[#1a3884] focus-visible:ring-2 focus-visible:ring-[#1a3884]/40 focus-visible:ring-offset-2 active:scale-[0.98] dark:bg-[#1a3884] dark:hover:bg-[#24499e]"
                          >
                            <span>{t("placement.view_fair", "View Fair")}</span>
                            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" stroke={2.2} />
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {confirmOpen &&
          createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#1a3884]/30 dark:bg-[#001630]">
                <h2 className="mb-2 text-[16px] font-semibold tracking-[-0.01em] text-[#0d1f4e] dark:text-white">{t("placement.confirm_withdraw_title", "Withdraw Application?")}</h2>
                <p className="mb-6 text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {t("placement.confirm_withdraw_desc", "Are you sure you want to withdraw your application for")} <span className="font-medium text-slate-700 dark:text-slate-200">{confirmAppTitle}</span>? {t("placement.confirm_withdraw_warning", "This action cannot be undone.")}
                </p>
                <div className="flex justify-end gap-2.5">
                  <button onClick={closeConfirm} className="h-9 rounded-lg border border-slate-200 px-4 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-[#1a3884]/30 dark:text-slate-300 dark:hover:bg-[#001a3d]">
                    {t("placement.cancel", "Cancel")}
                  </button>
                  <button onClick={confirmWithdraw} className="h-9 rounded-lg bg-red-600 px-4 text-[13px] font-medium text-white transition-colors hover:bg-red-700">
                    {t("placement.confirm_withdraw", "Yes, Withdraw")}
                  </button>
                </div>
              </motion.div>
            </div>,
            document.body
          )}
          
        <OfferLetterModal
          isOpen={!!offerModalApp}
          onClose={() => setOfferModalApp(null)}
          application={offerModalApp}
          onAccept={(id, signature) => handleUpdateStatus(id, 'Accepted', signature)}
          onDecline={(id, reason) => handleUpdateStatus(id, 'Declined', null, reason)}
          onKeepInProgress={(id) => handleUpdateStatus(id, 'In Progress')}
          companyName={offerModalApp ? (offerModalApp.job?.companyName || offerModalApp.job?.displayCompany || offerModalApp.job?.company?.name || 'Company Name') : ''}
          companyLogo={offerModalApp && offerModalApp.job ? getCompanyLogo(offerModalApp.job) : null}
        />
      </div>
    </div>
  );
};

export default Placement;
