import { useEffect, useMemo, useState } from "react";
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
  IconBookmarkFilled as BookmarkFilled
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl, placementsAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

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
  const candidates = [job.displayType, job.type, job.jobType, job.employmentType, job.displayJobType]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  const combined = candidates.join(' ');
  if (!combined) return 'other';

  if (combined.includes('intern')) return 'internship';
  if (combined.includes('part')) return 'part-time';
  if (combined.includes('full') || combined.includes('permanent') || combined.includes('f\u2011time')) return 'full-time';

  return 'other';
};

const getCompanyLogo = (job) => {
  const logo = job.displayCompanyLogo || job.companyLogo || job.logo || job.logoUrl || job.companyLogoUrl || job.employerLogo || job.organisationLogo || null;
  if (!logo || typeof logo !== "string") return null;
  if (/^(https?:|data:|blob:)/i.test(logo)) return logo;
  return `${getBackendUrl()}/${logo.replace(/^\/+/, "")}`;
};

const formatStatus = (value, t) => {
  if (!value) return t("placement.open", "Open");
  const norm = String(value).toLowerCase().replace(/[-_]/g, "_");
  const key = `placement.status_${norm}`;
  const fallback = String(value).replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  return t(key, fallback);
};

const getStatusTextColor = (status) => {
  const norm = String(status || '').toLowerCase().replace(/[-_]/g, ' ').trim();
  switch (norm) {
    case 'applied': return "text-blue-600 dark:text-blue-400";
    case 'under review': return "text-amber-600 dark:text-amber-400";
    case 'declined': return "text-slate-500 dark:text-slate-400";
    case 'shortlisted': return "text-purple-600 dark:text-purple-400";
    case 'hold': return "text-orange-600 dark:text-orange-400";
    case 'selected': return "text-emerald-600 dark:text-emerald-400";
    case 'rejected': return "text-rose-600 dark:text-rose-400";
    default: return "text-slate-600 dark:text-slate-400";
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
  if (diffMs < 0) return null;
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
  
  // Data State
  const [jobs, setJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [careerRoles, setCareerRoles] = useState([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [loadingApplied, setLoadingApplied] = useState(false);
  const [activeTab, setActiveTab] = useState('jobs');
  
  // View State (home vs search is now handled by activeTab)
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [jobType, setJobType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Master-Detail State
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Confirm Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAppId, setConfirmAppId] = useState(null);
  const [confirmAppTitle, setConfirmAppTitle] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await placementsAPI.getJobs({ limit: 150 });
      const savedRes = await placementsAPI.getSavedJobs().catch(e => { console.warn(e); return { data: [] }; });
      
      setJobs(response?.data || []);
      setSavedJobs(savedRes?.data || []);
      if (response?.userSkills) setUserSkills(response.userSkills);
      if (response?.careerRoles) setCareerRoles(response.careerRoles);
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
      const enriched = await Promise.all(apps.map(async (app) => {
        try {
          if (app && app.job && typeof app.job === 'string') {
            const source = app.jobSource || 'jobpostings';
            try {
              const jobResp = await placementsAPI.getJob(source, app.job);
              if (jobResp && jobResp.data) app.job = jobResp.data;
            } catch (e) {
              console.warn('Failed to load job for application', app.job, e?.message || e);
            }
          }
        } catch (e) {}
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
    if (activeTab === 'status') fetchApplied();
  }, [activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveTab('jobs');
    setSelectedJob(null);
  };

  // ΓöÇΓöÇ FILTERING & CATEGORIZATION LOGIC ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

  // Main Filtered Results (for search view)
  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const locQuery = locationQuery.trim().toLowerCase();
    
    return jobs.filter((job) => {
      const sourceMatch = sourceFilter === "all" || job.sourceCollection === sourceFilter;
      if (!sourceMatch) return false;

      if (jobType !== 'all') {
        const normalized = normalizeJobType(job);
        if (jobType === 'full-time' && normalized !== 'full-time') return false;
        if (jobType === 'part-time' && normalized !== 'part-time') return false;
        if (jobType === 'internship' && normalized !== 'internship') return false;
      }

      if (locQuery) {
        const loc = (job.displayLocation || '').toLowerCase();
        const locWords = locQuery.split(/\s+/);
        if (!locWords.every(w => loc.includes(w))) return false;
      }

      const haystack = [
        job.displayTitle,
        job.displayCompany,
        job.displayLocation,
        job.displayType,
        getDescription(job, t),
        getSkills(job).join(" "),
      ].join(" ").toLowerCase();

        const queryWords = query.split(/\s+/);
        if (!queryWords.every(w => haystack.includes(w))) return false;
      }

      return true;
    });
  }, [jobs, searchQuery, locationQuery, sourceFilter, jobType]);

  // Derived Collections (for home view)
  const recommendedJobs = useMemo(() => {
    if (!jobs.length) return [];
    
    // Create a scoring system for jobs based on skills and career roles
    const scoredJobs = jobs.map(job => {
      let score = 0;
      const jobSkills = getSkills(job).map(s => s.toLowerCase());
      const jobTitle = (job.displayTitle || '').toLowerCase();
      
      // Score by career roles
      careerRoles.forEach(role => {
        if (jobTitle.includes(role.toLowerCase())) score += 10;
      });
      
      // Score by skills
      userSkills.forEach(skill => {
        if (jobSkills.includes(skill.toLowerCase()) || getDescription(job).toLowerCase().includes(skill.toLowerCase())) {
          score += 2;
        }
      });
      
      return { job, score };
    });
  }, [jobs, searchQuery, sourceFilter, jobType, t]);

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

  const handleToggleSave = async (e, job) => {
    e.stopPropagation();
    try {
      const source = job.sourceCollection;
      const id = job._id;
      const response = await placementsAPI.toggleSavedJob(source, id);
      setSavedJobs(response.data || []);
      toast({ 
        title: response.isSaved ? 'Job Saved' : 'Job Removed', 
        description: response.isSaved ? 'Added to your Saved Jobs.' : 'Removed from your Saved Jobs.'
      });
    } catch (err) {
      toast({ title: 'Could not save job', description: 'Please try again.', variant: 'destructive' });
    }
  };

  // Component: Job Card Mini (For Master-Detail list or Grids)
  const JobCard = ({ job, isSelected, onClick, layout = 'grid' }) => {
    const skills = getSkills(job);
    const companyLogo = getCompanyLogo(job);
    const sourceLabel = job.sourceCollection === "smaartjobpostings" ? "SMAART" : "College";
    const companyInitial = (job.displayCompany || "C").trim().charAt(0).toUpperCase();
    const rawStatus = (job.displayStatus || job.status || "").toString().toLowerCase();
    const isClosed = rawStatus.includes("closed");

    return (
      <motion.div
        whileHover={{ y: -2 }}
        onClick={() => onClick(job)}
        className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
          isSelected 
            ? 'border-[#1a3884] bg-[#f5f8ff] shadow-md dark:border-blue-500/50 dark:bg-[#1a3884]/20' 
            : 'border-[#d8e6f7] bg-white hover:border-[#1a3884]/40 hover:shadow-lg dark:border-[#1a3884]/20 dark:bg-[#001630]'
        } ${isClosed ? 'opacity-60' : ''}`}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] text-lg font-black text-[#1a3884] dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-blue-300">
            {companyLogo ? (
              <img src={companyLogo} alt="logo" className="h-full w-full object-contain p-1" />
            ) : (
              <span>{companyInitial}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 relative">
            <button 
              onClick={(e) => handleToggleSave(e, job)}
              className="absolute right-0 top-0 p-1.5 text-slate-400 hover:text-blue-600 transition-colors z-10"
            >
              {savedJobs.some(sj => sj.jobId === job._id && sj.source === job.sourceCollection) ? (
                <BookmarkFilled className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Bookmark className="h-5 w-5 hover:fill-blue-50 dark:hover:fill-blue-900/30" />
              )}
            </button>
            <h3 className="line-clamp-1 text-base font-bold text-[#0d1f4e] dark:text-white pr-8">
              {job.displayTitle}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <Building className="h-4 w-4" />
              <span className="truncate">{job.displayCompany}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{job.displayLocation || 'Remote'}</span>
              <span className="mx-1">ΓÇó</span>
              <span className="uppercase text-[#1a3884] dark:text-blue-400">{job.displayType}</span>
            </div>
            {layout === 'grid' && skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {skills.slice(0, 3).map((skill) => (
                  <span key={skill} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-[#001a3d] dark:text-slate-300">
                    {skill}
                  </span>
                ))}
                {skills.length > 3 && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-[#001a3d] dark:text-slate-300">
                    +{skills.length - 3}
                  </span>
                )}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">
                {getPostedAgo(job.displayCreatedAt || job.createdAt) || 'Recently'}
              </span>
              <span className="inline-flex rounded-lg bg-[#eef4ff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1a3884] dark:bg-[#1a3884]/20 dark:text-blue-300">
                {sourceLabel}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Mobile Back Button */}
        <div className="flex items-center sm:hidden mt-6">
          <button onClick={() => navigate("/dashboard")} className="group flex items-center gap-3 w-fit selection:bg-transparent">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <ArrowLeft stroke={2.5} className="h-4 w-4 text-[#112b6b] dark:text-slate-300" />
            </div>
            <span className="text-[#112b6b] dark:text-blue-400 text-xs font-extrabold uppercase tracking-[0.15em] transition-colors group-hover:text-[#1a3884] dark:group-hover:text-blue-300">
              {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
            </span>
          </button>
        </div>

        {/* Original Header Block */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-6 mb-6 overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-5 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0d1f4e] dark:text-white sm:text-3xl">
                {t("placement.title", "Placement")}
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
                {t("placement.subtitle", "Explore active jobs from college placement postings and SMAART job postings.")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <button
                  onClick={fetchJobs}
                  disabled={loading}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1a3884] px-4 text-sm font-bold text-white shadow-md transition-all hover:bg-[#132c6b] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Refresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  {t("placement.refresh", "Refresh")}
                </button>
              </div>
            </div>
            {/* Confirm modal */}
            {confirmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-[#0d1f4e]">{t("placement.confirm_withdraw", "Confirm withdraw")}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {t("placement.withdraw_warning", { title: confirmAppTitle, defaultValue: "Are you sure you want to withdraw your application for {{title}}? This action cannot be undone." })}
                  </p>
                  <div className="mt-4 flex justify-end gap-3">
                    <button onClick={closeConfirm} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">{t("placement.cancel", "Cancel")}</button>
                    <button onClick={confirmWithdraw} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">{t("placement.withdraw", "Withdraw")}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`h-10 rounded-xl px-4 text-sm font-bold transition-all ${activeTab === 'recommended' ? 'bg-[#1a3884] text-white shadow-sm' : 'bg-white text-[#0d1f4e] border border-[#d8e6f7] hover:bg-slate-50 dark:border-[#1a3884]/20 dark:bg-[#001630] dark:text-white'}`}
          >
            Recommended
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`h-10 rounded-xl px-4 text-sm font-bold transition-all ${activeTab === 'jobs' ? 'bg-[#1a3884] text-white shadow-sm' : 'bg-white text-[#0d1f4e] border border-[#d8e6f7] hover:bg-slate-50 dark:border-[#1a3884]/20 dark:bg-[#001630] dark:text-white'}`}
          >
            All Jobs
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`h-10 rounded-xl px-4 text-sm font-bold transition-all ${activeTab === 'saved' ? 'bg-[#1a3884] text-white shadow-sm' : 'bg-white text-[#0d1f4e] border border-[#d8e6f7] hover:bg-slate-50 dark:border-[#1a3884]/20 dark:bg-[#001630] dark:text-white'}`}
          >
            {t("placement.jobs", "Jobs")}
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`h-10 rounded-xl px-4 text-sm font-bold transition-all ${activeTab === 'status' ? 'bg-[#1a3884] text-white shadow-sm' : 'bg-white text-[#0d1f4e] border border-[#d8e6f7] hover:bg-slate-50 dark:border-[#1a3884]/20 dark:bg-[#001630] dark:text-white'}`}
          >
            {t("placement.job_status", "Job Status")}
          </button>
        </div>

        {activeTab === 'jobs' && (
          <div className="mb-5 mt-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: search box */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("placement.search_placeholder", "Search roles, companies, skills")}
                className="h-10 w-full rounded-xl border border-[#d8e6f7] bg-white pl-9 pr-3 text-sm font-medium text-black outline-none transition-all focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/15 dark:border-[#1a3884]/20 dark:bg-white dark:text-black"
              />
            </div>

            {/* Right: filters dropdowns */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="h-10 w-full sm:w-auto rounded-xl border border-[#d8e6f7] bg-white px-3 text-sm font-bold text-[#0d1f4e] outline-none hover:border-[#1a3884] dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white"
              >
                <option value="all">{t("placement.all_jobs", { count: jobs.length, defaultValue: "All jobs ({{count}})" })}</option>
                <option value="smaartjobpostings">{t("placement.smaart_jobs", { count: sourceCounts.smaartjobpostings || 0, defaultValue: "SMAART ({{count}})" })}</option>
                <option value="jobpostings">{t("placement.college_jobs", { count: sourceCounts.jobpostings || 0, defaultValue: "College ({{count}})" })}</option>
              </select>

              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="h-10 w-full sm:w-auto rounded-xl border border-[#d8e6f7] bg-white px-3 text-sm font-bold text-[#0d1f4e] outline-none hover:border-[#1a3884] dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white"
              >
                <option value="all">{t("placement.all_types", "All types")}</option>
                <option value="full-time">{t("placement.full_time", "Full-Time")}</option>
                <option value="part-time">{t("placement.part_time", "Part-Time")}</option>
                <option value="internship">{t("placement.internship", "Internship")}</option>
              </select>
            </div>
          </div>
        )}

            {loading ? (
              <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 animate-pulse rounded-2xl bg-white dark:bg-slate-800" />
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8e6f7] bg-white px-6 text-center dark:border-[#1a3884]/20 dark:bg-[#001630]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef4ff] dark:bg-[#1a3884]/15">
                  <Briefcase className="h-7 w-7 text-[#1a3884] dark:text-blue-300" />
                </div>
                <h2 className="text-lg font-bold text-[#0d1f4e] dark:text-white">{t("placement.no_jobs_found", "No placement jobs found")}</h2>
                <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  {t("placement.no_jobs_desc", "Try changing the filter or check back when new opportunities are posted.")}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredJobs.map((job, index) => {
                  const skills = getSkills(job);
                  const companyLogo = getCompanyLogo(job);
                  const sourceLabel = job.sourceCollection === "smaartjobpostings" ? t("placement.source_smaart", "SMAART") : t("placement.source_college", "College");
                  const companyInitial = (job.displayCompany || "C").trim().charAt(0).toUpperCase();
                  const statusLabel = formatStatus(job.displayStatus || job.status, t);
                  // consider job closed if status contains 'closed' (case-insensitive)
                  const rawStatus = (job.displayStatus || job.status || "").toString().toLowerCase();
                  const isClosed = rawStatus.includes("closed");
                  const applyLabel = isClosed ? t("placement.closed", "Closed") : t("placement.view", "View");

                  return (
                    <motion.article
                      key={`${job.sourceCollection}-${job._id}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className={`relative flex min-h-[225px] flex-col rounded-2xl border border-[#d8e6f7] bg-white p-5 shadow-[0_2px_16px_rgba(26,56,132,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(26,56,132,0.12)] dark:border-[#1a3884]/20 dark:bg-[#001630] ${isClosed ? 'opacity-60' : ''}`}
                    >
                      <Filter className="h-4 w-4" /> Filters
                    </button>
                  </div>

                  {/* Filters Drawer (Inline) */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div 
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden border-b border-[#d8e6f7] dark:border-[#1a3884]/20 bg-white dark:bg-[#001630] px-4"
                      >
                        <div className="py-4 space-y-4">
                          <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Source</label>
                            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-sm font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                              <option value="all">All sources</option>
                              <option value="smaartjobpostings">SMAART Platform</option>
                              <option value="jobpostings">College Placement</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Job Type</label>
                            <select value={jobType} onChange={(e) => setJobType(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-sm font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                              <option value="all">All types</option>
                              <option value="full-time">Full-Time</option>
                              <option value="part-time">Part-Time</option>
                              <option value="internship">Internship</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Scrollable List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                    {filteredJobs.length === 0 ? (
                      <div className="mt-10 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                          <Search className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">No jobs found</h3>
                        <p className="mt-1 text-xs text-slate-500">Try adjusting your search or filters.</p>
                      </div>
                    ) : (
                      filteredJobs.map(job => (
                        <JobCard 
                          key={job._id} 
                          job={job} 
                          layout="list"
                          isSelected={selectedJob?._id === job._id}
                          onClick={(j) => setSelectedJob(j)} 
                        />
                      ))
                    )}
                  </div>
                </div>

                      <div className="space-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{job.displayCompany}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{job.displayLocation || t("placement.remote", "Remote")}</span>
                        </div>
                        {getPostedAgo(job.displayCreatedAt || job.createdAt, t) && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="text-slate-400 text-xs font-semibold">
                              {getPostedAgo(job.displayCreatedAt || job.createdAt, t)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <CalendarDue className="h-4 w-4 shrink-0 text-slate-400" />
                          <span>{formatDate(job.displayDeadline, t)}</span>
                        </div>
                        {job.displaySalary && (
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate">{job.displaySalary}</span>
                          </div>
                        </div>

                        <hr className="my-8 border-slate-200 dark:border-slate-800" />

                        {/* Detail Content */}
                        <div className="grid grid-cols-3 gap-8">
                          <div className="col-span-2 space-y-8">
                            <section>
                              <h3 className="text-lg font-bold text-[#0d1f4e] dark:text-white mb-4">About the Role</h3>
                              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-medium">
                                {getDescription(selectedJob)}
                              </div>
                            </section>
                          </div>
                          
                          <div className="col-span-1 space-y-6">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Job Overview</h3>
                              <ul className="space-y-4">
                                <li>
                                  <span className="block text-xs font-semibold text-slate-500">Salary</span>
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedJob.displaySalary || 'Not disclosed'}</span>
                                </li>
                                <li>
                                  <span className="block text-xs font-semibold text-slate-500">Apply By</span>
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formatDate(selectedJob.displayDeadline)}</span>
                                </li>
                                <li>
                                  <span className="block text-xs font-semibold text-slate-500">Source</span>
                                  <span className="inline-flex rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                                    {selectedJob.sourceCollection === 'smaartjobpostings' ? 'SMAART Platform' : 'College Placement'}
                                  </span>
                                </li>
                              </ul>
                            </div>
                            
                            {getSkills(selectedJob).length > 0 && (
                              <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                  {getSkills(selectedJob).map((skill) => (
                                    <span key={skill} className="rounded-lg bg-[#eef4ff] px-3 py-1.5 text-xs font-bold text-[#1a3884] dark:bg-[#1a3884]/20 dark:text-blue-300">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Saved Jobs Tab */}
        {activeTab === 'saved' && (
          <div className="mt-8">
            <h2 className="text-2xl font-extrabold text-[#0d1f4e] dark:text-white mb-6">Saved Jobs</h2>
            
            {savedJobs.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#d8e6f7] bg-white px-6 text-center shadow-sm dark:border-[#1a3884]/20 dark:bg-[#001630]">
                <Bookmark className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                <h2 className="mt-4 text-xl font-extrabold text-[#0d1f4e] dark:text-white">No saved jobs yet</h2>
                <p className="mt-2 max-w-md text-sm font-medium text-slate-500">Bookmark jobs you are interested in applying for later.</p>
                <button onClick={() => setActiveTab('jobs')} className="mt-6 rounded-xl bg-[#1a3884] px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#132c6b] active:scale-95 transition-all">
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {jobs.filter(job => savedJobs.some(sj => sj.jobId === job._id && sj.source === job.sourceCollection)).map(job => (
                  <JobCard key={job._id} job={job} onClick={(j) => { setSelectedJob(j); setActiveTab('jobs'); }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Job Status Tab (My Applications) */}
        {activeTab === 'status' && (
          <div className="mt-8">
            <h2 className="text-2xl font-extrabold text-[#0d1f4e] dark:text-white mb-6">Your Applications</h2>
            {loadingApplied ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 animate-pulse rounded-2xl bg-white dark:bg-slate-800" />
                ))}
              </div>
            ) : appliedJobs.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8e6f7] bg-white px-6 text-center dark:border-[#1a3884]/20 dark:bg-[#001630]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef4ff] dark:bg-[#1a3884]/15">
                  <Briefcase className="h-7 w-7 text-[#1a3884] dark:text-blue-300" />
                </div>
                <h2 className="text-lg font-bold text-[#0d1f4e] dark:text-white">{t("placement.no_applications_found", "No applications found")}</h2>
                <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{t("placement.no_applications_desc", "You haven't applied to any jobs yet.")}</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {appliedJobs.map((app, index) => {
                  const jobRef = app.job || app.jobId || app.jobPosting || {};
                  const title = app.jobTitle || app.displayTitle || (jobRef && jobRef.displayTitle) || 'Role';
                  const companyName = app.companyName || app.displayCompany || (jobRef && jobRef.displayCompany) || 'Company';
                  const displayType = app.displayType || (jobRef && (jobRef.displayType || jobRef.type)) || app.jobType || '';
                  const companyLogo = getCompanyLogo(jobRef) || getCompanyLogo(app) || null;
                  const companyInitial = (companyName || 'C').trim().charAt(0).toUpperCase();
                  const appliedAt = app.appliedAt || app.createdAt || app.createdAt;
                  const location = (jobRef && jobRef.displayLocation) || app.location || '';
                  const deadline = (jobRef && jobRef.displayDeadline) || app.deadline || null;
                  const statusLabel = formatStatus(app.status || app.applicationStatus || 'applied', t);
                  const sourceLabel = app.postingOrigin || (jobRef && jobRef.sourceCollection === 'smaartjobpostings' ? t("placement.source_smaart", "SMAART") : (jobRef && jobRef.sourceCollection === 'jobpostings' ? t("placement.source_college", "College") : ''));

                  return (
                    <motion.article
                      key={app._id || app.id || index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className={`relative flex min-h-[225px] mt-6 flex-col rounded-2xl border border-[#d8e6f7] bg-white p-5 shadow-[0_2px_16px_rgba(26,56,132,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(26,56,132,0.12)]`}
                    >
                      {/* Top Row: Logo, Title, and Badges */}
                      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] text-sm font-black text-[#1a3884] dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-blue-300">
                            {companyLogo ? (
                              <img src={companyLogo} alt={`${companyName} logo`} className="h-full w-full object-contain p-1" />
                            ) : (
                              <span>{companyInitial}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h2 className="line-clamp-2 text-lg font-extrabold leading-snug text-[#0d1f4e] dark:text-white">{title}</h2>
                            {displayType && (
                              <span className="mt-1 inline-flex text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">{displayType}</span>
                            )}
                          </div>
                        </div>

                        {sourceLabel && (
                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            <span className="inline-flex rounded-lg bg-[#eef4ff] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1a3884] dark:bg-[#1a3884]/15 dark:text-blue-300">
                              {sourceLabel}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{companyName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDue className="h-4 w-4 shrink-0 text-slate-400" />
                          <span>{t("placement.applied", "Applied")}: {formatDate(appliedAt, t)}</span>
                        </div>
                      </div>

                      <div className="mt-auto pt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-bold uppercase text-black dark:text-white text-center sm:text-left">
                          {t("placement.status_prefix", "STATUS :")} <span className={getStatusTextColor(app.status || app.applicationStatus || 'applied')}>{statusLabel}</span>
                        </div>
                        <button
                          onClick={() => openConfirm(app._id || app.id, title)}
                          className="rounded-full uppercase bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors w-full sm:w-auto"
                        >
                          {t("placement.withdraw", "Withdraw")}
                        </button>
                      </div>
                    ));
                })()}
              </div>
            )}
          </div>
        )}

        {/* Withdraw Confirm Modal */}
        {confirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-800">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30">
                <X className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-center text-xl font-black text-slate-900 dark:text-white">Withdraw Application?</h3>
              <p className="mt-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
                Are you sure you want to withdraw from <strong>{confirmAppTitle}</strong>? This action cannot be undone.
              </p>
              <div className="mt-8 flex gap-4">
                <button onClick={closeConfirm} className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600">
                  Keep it
                </button>
                <button onClick={confirmWithdraw} className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 hover:bg-red-500">
                  Withdraw
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Placement;
