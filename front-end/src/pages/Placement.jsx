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
  IconChevronRight as ChevronRight,
  IconExternalLink as ExternalLink,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl, placementsAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import useUser from "@/hooks/useUser";

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
  if (!value) return t("placement.open", "Open");
  const norm = String(value).toLowerCase().replace(/[-_]/g, "_");
  const key = `placement.status_${norm}`;
  const fallback = String(value).replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
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
      return "text-orange-600 dark:text-orange-400";
    case 'selected':
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

      // Enrich applications: if application.job is an id string, fetch the job object so we can read nested recruiter/company fields
      const enriched = await Promise.all(apps.map(async (app) => {
        try {
          if (app && app.job && typeof app.job === 'string') {
            const source = app.jobSource || app.jobSource || 'jobpostings';
            try {
              const jobResp = await placementsAPI.getJob(source, app.job);
              if (jobResp && jobResp.data) {
                // replace job id with the full job object
                app.job = jobResp.data;
              }
            } catch (e) {
              // fail quietly and keep original app.job
              console.warn('Failed to load job for application', app.job, e?.message || e);
            }
          }
        } catch (e) {
          // ignore per-app errors
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

  const handleRegisterFair = async (fairId) => {
    try {
      const response = await placementsAPI.registerJobFair(fairId);
      if (response.success) {
        toast({
          title: t("placement.register_fair_success_title", "Registered Successfully"),
          description: t("placement.register_fair_success_desc", "You have successfully registered for the Job Fair."),
        });
        // Update the local state so the registered status and student count reflect immediately
        setJobFairs(prev => prev.map(fair => {
          if (fair._id === fairId) {
            const updatedStudents = [...(fair.registeredStudents || [])];
            if (user?._id && !updatedStudents.includes(user._id)) {
              updatedStudents.push(user._id);
            }
            return {
              ...fair,
              registeredStudents: updatedStudents
            };
          }
          return fair;
        }));
      }
    } catch (error) {
      console.error("Failed to register for job fair:", error);
      toast({
        title: t("placement.error_register_fair_title", "Registration Failed"),
        description: error.message || t("placement.error_register_fair_desc", "Please try again in a moment."),
        variant: "destructive",
      });
    }
  };

  const sourceCounts = useMemo(() => {
    return jobs.reduce((acc, job) => {
      const key = job.sourceCollection || "jobpostings";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
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
  }, [jobs, searchQuery, sourceFilter, jobType, t]);

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

        {/* Tabs: Jobs | Job Status | Job Fair */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`h-10 rounded-xl px-4 text-sm font-bold ${activeTab === 'jobs' ? 'bg-[#1a3884] text-white' : 'bg-white text-[#0d1f4e] border border-[#d8e6f7]'}`}
          >
            {t("placement.jobs", "Jobs")}
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`h-10 rounded-xl px-4 text-sm font-bold ${activeTab === 'status' ? 'bg-[#1a3884] text-white' : 'bg-white text-[#0d1f4e] border border-[#d8e6f7]'}`}
          >
            {t("placement.job_status", "Job Status")}
          </button>
          <button
            onClick={() => setActiveTab('job-fair')}
            className={`h-10 rounded-xl px-4 text-sm font-bold ${activeTab === 'job-fair' ? 'bg-[#1a3884] text-white' : 'bg-white text-[#0d1f4e] border border-[#d8e6f7]'}`}
          >
            {t("placement.job_fair", "Job Fair")}
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`h-10 rounded-xl px-4 text-sm font-bold transition-all ${activeTab === 'companies' ? 'bg-[#1a3884] text-white shadow-sm' : 'bg-white text-[#0d1f4e] border border-[#d8e6f7] hover:bg-slate-50 dark:border-[#1a3884]/20 dark:bg-[#001630] dark:text-white'}`}
          >
            Partners
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

        {activeTab === 'jobs' && (
          <>
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-56 animate-pulse rounded-2xl border border-[#d8e6f7] bg-white dark:border-[#1a3884]/20 dark:bg-[#001630]" />
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
                      {/* Top Row: Logo, Title, and Badges */}
                      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] text-sm font-black text-[#1a3884] dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-blue-300">
                            {companyLogo ? (
                              <img
                                src={companyLogo}
                                alt={`${job.displayCompany} logo`}
                                className="h-full w-full object-contain p-1"
                              />
                            ) : (
                              <span>{companyInitial}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h2 className="line-clamp-2 text-lg font-extrabold leading-snug text-[#0d1f4e] dark:text-white">
                              {job.displayTitle}
                            </h2>
                            <span className="mt-1 inline-flex text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                              {job.displayType}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                            {statusLabel}
                          </span>
                          <span className="inline-flex rounded-lg bg-[#eef4ff] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1a3884] dark:bg-[#1a3884]/15 dark:text-blue-300">
                            {sourceLabel}
                          </span>
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
                        )}
                      </div>

                      {skills.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <span key={skill} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-[#001a3d] dark:text-slate-300">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-auto pt-5">
                        <button
                          onClick={() => !isClosed && navigate(`/dashboard/placement/${job.sourceCollection}/${job._id}`, { state: { job } })}
                          disabled={isClosed}
                          className={isClosed ? "flex h-10 w-full items-center justify-center rounded-xl bg-gray-200 text-sm font-bold text-slate-500 transition-all cursor-not-allowed" : "flex h-10 w-full items-center justify-center rounded-xl bg-[#1a3884] text-sm font-bold text-white transition-all hover:bg-[#132c6b] active:scale-[0.98]"}
                        >
                          {applyLabel}
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
                  <div key={i} className="h-56 animate-pulse rounded-2xl border border-[#d8e6f7] bg-white dark:border-[#1a3884]/20 dark:bg-[#001630]" />
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

                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="mt-8">
            <h2 className="text-2xl font-extrabold text-[#0d1f4e] dark:text-white mb-6">Partners Directory</h2>
            
            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  placeholder="Search by company name..."
                  className="h-12 w-full rounded-xl border border-[#d8e6f7] bg-white pl-11 pr-4 text-sm font-medium text-black outline-none transition-all focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/15 dark:border-[#1a3884]/20 dark:bg-[#001630] dark:text-white shadow-sm hover:border-[#1a3884]/40"
                />
              </div>
              <div className="relative sm:w-64">
                <select
                  value={companyTypeFilter}
                  onChange={(e) => setCompanyTypeFilter(e.target.value)}
                  className="h-12 w-full appearance-none rounded-xl border border-[#d8e6f7] bg-white px-4 text-sm font-bold text-slate-700 outline-none transition-all focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/15 dark:border-[#1a3884]/20 dark:bg-[#001630] dark:text-slate-200 shadow-sm hover:border-[#1a3884]/40"
                >
                  <option value="all">All Partners</option>
                  <option value="smaart">SMAART Partners</option>
                  <option value="college">College Partners</option>
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                </div>
              </div>
            </div>

            {loadingCompanies ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-64 animate-pulse rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700" />
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#d8e6f7] bg-white px-6 text-center shadow-sm dark:border-[#1a3884]/20 dark:bg-[#001630]">
                <Building className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                <h2 className="mt-4 text-xl font-extrabold text-[#0d1f4e] dark:text-white">No partners found</h2>
                <p className="mt-2 max-w-md text-sm font-medium text-slate-500">Try adjusting your filters or search query.</p>
                {(companySearch || companyTypeFilter !== 'all') && (
                  <button onClick={() => { setCompanySearch(""); setCompanyTypeFilter("all"); }} className="mt-6 rounded-xl bg-[#1a3884] px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#132c6b] active:scale-95 transition-all">
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredCompanies.map((partner) => {
                  const companyInitial = (partner.name || "C").trim().charAt(0).toUpperCase();
                  const isSmaart = partner.partnerType === 'smaart';
                  
                  return (
                    <div
                      key={partner._id}
                      className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-[#d8e6f7] bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-[#1a3884]/20 dark:bg-[#001630]"
                    >
                      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#1a3884]/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:via-blue-500/30" />
                      
                      <div className="absolute left-3 right-3 top-3 flex justify-start">
                        <span className={`truncate max-w-[90%] rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          isSmaart 
                            ? 'border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-400' 
                            : 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {isSmaart ? 'SMAART Partner' : 'College Partner'}
                        </span>
                      </div>

                      <div className="mb-4 mt-6 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 text-2xl font-black text-[#1a3884] shadow-sm dark:border-slate-700 dark:bg-[#001a3d] dark:text-blue-300 relative">
                        {partner.logo && (
                          <img 
                            src={partner.logo.startsWith('http') || partner.logo.startsWith('data:') ? partner.logo : `${getBackendUrl()}/${partner.logo.replace(/^\/+/, '')}`} 
                            alt="logo" 
                            className="absolute inset-0 h-full w-full object-contain p-2" 
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        )}
                        <span style={{ display: partner.logo ? 'none' : 'flex' }} className="h-full w-full items-center justify-center">{companyInitial}</span>
                      </div>

                      <h3 className="mb-1.5 w-full truncate px-2 text-lg font-black text-[#0d1f4e] dark:text-white" title={partner.name}>
                        {partner.name}
                      </h3>

                      {partner.website && (
                        <a
                          href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mb-3 flex items-center justify-center gap-1.5 w-full truncate px-2 text-xs font-bold text-[#1a3884] transition-colors hover:text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{partner.website.replace(/^https?:\/\//i, '')}</span>
                        </a>
                      )}

                      {partner.description && (
                        <div className="mt-2 w-full border-t border-slate-100 pt-3 px-1 dark:border-slate-800">
                          <p className="line-clamp-3 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                            {partner.description}
                          </p>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => {
                           setSearchQuery(partner.name);
                           setActiveTab('jobs');
                        }}
                        className="mt-4 w-full rounded-xl bg-[#f5f8ff] py-2 text-xs font-bold text-[#1a3884] transition-colors hover:bg-[#eef4ff] dark:bg-[#1a3884]/10 dark:text-blue-400 dark:hover:bg-[#1a3884]/20"
                      >
                        View Jobs
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Job Fair Tab */}
        {activeTab === 'job-fair' && (
          <div className="mt-6">
            {loadingFairs ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-56 animate-pulse rounded-2xl border border-[#d8e6f7] bg-white dark:border-[#1a3884]/20 dark:bg-[#001630]" />
                ))}
              </div>
            ) : jobFairs.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8e6f7] bg-white px-6 text-center dark:border-[#1a3884]/20 dark:bg-[#001630]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef4ff] dark:bg-[#1a3884]/15">
                  <Briefcase className="h-7 w-7 text-[#1a3884] dark:text-blue-300" />
                </div>
                <h2 className="text-lg font-bold text-[#0d1f4e] dark:text-white">{t("placement.no_fairs_found", "No Job Fairs found")}</h2>
                <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
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

                  return (
                    <motion.article
                      key={fair._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className="relative flex min-h-[225px] mt-6 flex-col rounded-2xl border border-[#d8e6f7] bg-white p-5 shadow-[0_2px_16px_rgba(26,56,132,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(26,56,132,0.12)] dark:border-[#1a3884]/20 dark:bg-[#001630]"
                    >
                      {bannerImageUrl && (
                        <div className="mb-4 h-32 w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
                          <img src={bannerImageUrl} alt={fair.title} className="h-full w-full object-cover" />
                        </div>
                      )}

                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                            {fair.label === 'smaart job fair' ? t("placement.source_smaart_job_fair", "SMAART Job Fair") : t("placement.source_college_job_fair", "College Job Fair")}
                          </span>
                          <span className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                            fair.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' :
                            fair.status === 'completed' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {formatStatus(fair.status, t)}
                          </span>
                        </div>
                        <h2 className="text-lg font-extrabold text-[#0d1f4e] dark:text-white line-clamp-2">{fair.title}</h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-3">{fair.description}</p>
                      </div>

                      <div className="space-y-2 text-sm font-medium text-slate-600 dark:text-slate-300 mb-5">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{fair.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDue className="h-4 w-4 shrink-0 text-slate-400" />
                          <span>
                            {formatDate(fair.startDate, t)} - {formatDate(fair.endDate, t)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                          <span>
                            {t("placement.registered_count", { count: totalRegistered, defaultValue: `${totalRegistered} students registered` })}
                          </span>
                        </div>
                      </div>

                      <div className="mt-auto pt-4">
                        <button
                          onClick={() => !isRegistered && handleRegisterFair(fair._id)}
                          disabled={isRegistered || fair.status === 'completed' || fair.status === 'cancelled'}
                          className={`flex h-10 w-full items-center justify-center rounded-xl text-sm font-bold transition-all ${
                            isRegistered 
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 cursor-default" 
                              : fair.status === 'completed' || fair.status === 'cancelled'
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-[#1a3884] text-white hover:bg-[#132c6b] active:scale-[0.98]"
                          }`}
                        >
                          {isRegistered ? t("placement.registered", "Registered") : t("placement.register", "Register")}
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Placement;
