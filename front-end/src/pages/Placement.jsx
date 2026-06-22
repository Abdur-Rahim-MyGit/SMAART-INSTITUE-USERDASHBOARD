import { useEffect, useMemo, useState } from "react";
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
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl, placementsAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const formatDate = (value) => {
  if (!value) return "No deadline listed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getDescription = (job) => {
  const value = job.description || job.jobDescription || job.summary || job.aboutRole || job.requirements;
  if (!value) return "Role details will be shared by the placement team.";
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
  if (combined.includes('full') || combined.includes('permanent') || combined.includes('f\u2011time')) return 'full-time';

  return 'other';
};

const getCompanyLogo = (job) => {
  const logo = job.displayCompanyLogo || job.companyLogo || job.logo || job.logoUrl || job.companyLogoUrl || job.employerLogo || job.organisationLogo || null;
  if (!logo || typeof logo !== "string") return null;
  if (/^(https?:|data:|blob:)/i.test(logo)) return logo;
  return `${getBackendUrl()}/${logo.replace(/^\/+/, "")}`;
};

const formatStatus = (value) => {
  if (!value) return "Open";
  return String(value).replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Returns a LinkedIn-style "Posted X ago" label.
 * Calculation is purely client-side from the existing createdAt timestamp.
 */
const getPostedAgo = (createdAt) => {
  if (!createdAt) return null;
  const posted = new Date(createdAt);
  if (Number.isNaN(posted.getTime())) return null;
  const diffMs = Date.now() - posted.getTime();
  if (diffMs < 0) return null; // future date — don't show
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "Posted Today";
  if (days === 1) return "Posted 1 day ago";
  if (days < 7) return `Posted ${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "Posted 1 week ago";
  if (weeks < 5) return `Posted ${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "Posted 1 month ago";
  return `Posted ${months} months ago`;
};

const Placement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [loadingApplied, setLoadingApplied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [jobType, setJobType] = useState('all');
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
        title: "Could not load jobs",
        description: error.message || "Please try again in a moment.",
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
      toast({ title: 'Could not load applications', description: error.message || 'Please try again', variant: 'destructive' });
    } finally {
      setLoadingApplied(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'status') {
      fetchApplied();
    }
  }, [activeTab]);

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
        getDescription(job),
        getSkills(job).join(" "),
      ].join(" ").toLowerCase();

      return haystack.includes(query);
    });
  }, [jobs, searchQuery, sourceFilter, jobType]);

  const handleWithdraw = async (applicationId) => {
    try {
      await placementsAPI.deleteApplication(applicationId);
      setAppliedJobs((prev) => prev.filter((a) => a._id !== applicationId && a.id !== applicationId));
      toast({ title: 'Application withdrawn', description: 'Your application has been removed.' });
    } catch (err) {
      console.error('withdraw error', err);
      toast({ title: 'Could not withdraw', description: err.message || 'Please try again', variant: 'destructive' });
    }
  };

  const openConfirm = (id, title) => {
    setConfirmAppId(id);
    setConfirmAppTitle(title || 'this application');
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
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 mb-6 overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-5 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0d1f4e] dark:text-white sm:text-3xl">
                Placement
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
                Explore active jobs from college placement postings and SMAART job postings.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile: back button to dashboard */}
              <button
                onClick={() => navigate('/dashboard')}
                className="sm:hidden inline-flex items-center gap-3"
                aria-label="Back to dashboard"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d8e6f7] bg-white text-sm text-[#0d1f4e] shadow-sm">
                  <ArrowLeft className="h-4 w-4" />
                </span>
                <span className="uppercase tracking-widest text-xs font-bold text-[#0d1f4e]">Back</span>
              </button>

              <div className="hidden sm:block">
                <button
                  onClick={fetchJobs}
                  disabled={loading}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#1a3884] px-4 text-sm font-bold text-white shadow-md transition-all hover:bg-[#132c6b] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Refresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
            {/* Confirm modal */}
            {confirmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-[#0d1f4e]">Confirm withdraw</h3>
                  <p className="mt-2 text-sm text-slate-600">Are you sure you want to withdraw your application for <strong>{confirmAppTitle}</strong>? This action cannot be undone.</p>
                  <div className="mt-4 flex justify-end gap-3">
                    <button onClick={closeConfirm} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Cancel</button>
                    <button onClick={confirmWithdraw} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white">Withdraw</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

  {/* Tabs: Jobs | Job Status */}
  <div className="mt-4 flex items-center gap-3">
    <button
      onClick={() => setActiveTab('jobs')}
      className={`h-10 rounded-xl px-4 text-sm font-bold ${activeTab === 'jobs' ? 'bg-[#1a3884] text-white' : 'bg-white text-[#0d1f4e] border border-[#d8e6f7]'}`}
    >
      Jobs
    </button>
    <button
      onClick={() => setActiveTab('status')}
      className={`h-10 rounded-xl px-4 text-sm font-bold ${activeTab === 'status' ? 'bg-[#1a3884] text-white' : 'bg-white text-[#0d1f4e] border border-[#d8e6f7]'}`}
    >
      Job Status
    </button>
  </div>

  {activeTab === 'jobs' && (
    <div className="mb-5 mt-3 flex items-center justify-between gap-3">
      {/* Left: search box */}
      <div className="relative flex-1 mr-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search roles, companies, skills"
          className="h-10 w-full rounded-xl border border-[#d8e6f7] bg-white pl-9 pr-3 text-sm font-medium text-black outline-none transition-all focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/15 dark:border-[#1a3884]/20 dark:bg-white dark:text-black"
        />
      </div>

      {/* Right: filters dropdowns */}
      <div className="flex items-center gap-3">
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="h-10 rounded-xl border border-[#d8e6f7] bg-white px-3 text-sm font-bold text-[#0d1f4e] outline-none hover:border-[#1a3884] dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white"
        >
          <option value="all">All jobs ({jobs.length})</option>
          <option value="smaartjobpostings">SMAART ({sourceCounts.smaartjobpostings || 0})</option>
          <option value="jobpostings">College ({sourceCounts.jobpostings || 0})</option>
        </select>

        <select
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          className="h-10 rounded-xl border border-[#d8e6f7] bg-white px-3 text-sm font-bold text-[#0d1f4e] outline-none hover:border-[#1a3884] dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white"
        >
          <option value="all">All types</option>
          <option value="full-time">Full-Time</option>
          <option value="part-time">Part-Time</option>
          <option value="internship">Internship</option>
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
                <h2 className="text-lg font-bold text-[#0d1f4e] dark:text-white">No placement jobs found</h2>
                <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  Try changing the filter or check back when new opportunities are posted.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredJobs.map((job, index) => {
                  const skills = getSkills(job);
                  const companyLogo = getCompanyLogo(job);
                  const sourceLabel = job.sourceCollection === "smaartjobpostings" ? "SMAART" : "College";
                  const companyInitial = (job.displayCompany || "C").trim().charAt(0).toUpperCase();
                  const statusLabel = formatStatus(job.displayStatus || job.status);
                  // consider job closed if status contains 'closed' (case-insensitive)
                  const rawStatus = (job.displayStatus || job.status || "").toString().toLowerCase();
                  const isClosed = rawStatus.includes("closed");
                  const applyLabel = isClosed ? "Closed" : "View";

                  return (
                    <motion.article
                      key={`${job.sourceCollection}-${job._id}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className={`relative flex min-h-[225px] flex-col rounded-2xl border border-[#d8e6f7] bg-white p-5 shadow-[0_2px_16px_rgba(26,56,132,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(26,56,132,0.12)] dark:border-[#1a3884]/20 dark:bg-[#001630] ${isClosed ? 'opacity-60' : ''}`}
                    >
                      <div className="absolute right-5 top-5 flex items-center gap-2">
                        <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                          {statusLabel}
                        </span>
                        <span className="inline-flex rounded-lg bg-[#eef4ff] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1a3884] dark:bg-[#1a3884]/15 dark:text-blue-300">
                          {sourceLabel}
                        </span>
                      </div>

                      <div className="mb-5 flex items-center gap-3 pr-36">
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

                      <div className="space-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{job.displayCompany}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{job.displayLocation || 'Remote'}</span>
                        </div>
                        {getPostedAgo(job.displayCreatedAt || job.createdAt) && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="text-slate-400 text-xs font-semibold">
                              {getPostedAgo(job.displayCreatedAt || job.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <CalendarDue className="h-4 w-4 shrink-0 text-slate-400" />
                          <span>{formatDate(job.displayDeadline)}</span>
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
                <h2 className="text-lg font-bold text-[#0d1f4e] dark:text-white">No applications found</h2>
                <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">You haven't applied to any jobs yet.</p>
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
                  const statusLabel = formatStatus(app.status || app.applicationStatus || 'applied');
                  const sourceLabel = app.postingOrigin || (jobRef && jobRef.sourceCollection === 'smaartjobpostings' ? 'SMAART' : (jobRef && jobRef.sourceCollection === 'jobpostings' ? 'College' : ''));

                  return (
                    <motion.article
                      key={app._id || app.id || index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className={`relative flex min-h-[225px] mt-6 flex-col rounded-2xl border border-[#d8e6f7] bg-white p-5 shadow-[0_2px_16px_rgba(26,56,132,0.06)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(26,56,132,0.12)]`}
                    >
                      <div className="absolute right-5 top-5 flex items-center gap-2">
                        {/* <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                          {statusLabel}
                        </span> */}
                        {sourceLabel && (
                          <span className="inline-flex rounded-lg bg-[#eef4ff] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1a3884]">
                            {sourceLabel}
                          </span>
                        )}
                      </div>

                      <div className="mb-5 flex items-center gap-3 pr-36">
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

                      <div className="space-y-2 text-sm font-medium text-slate-600">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="truncate">{companyName}</span>
                        </div>
                        {/* {location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate">{location}</span>
                          </div>
                        )} */}
                        <div className="flex items-center gap-2">
                          <CalendarDue className="h-4 w-4 shrink-0 text-slate-400" />
                          <span>Applied: {formatDate(appliedAt)}</span>
                        </div>
                      </div>

                      <div className="mt-auto pt-5 flex items-center justify-center gap-3">
                        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 uppercase">STATUS : {String(statusLabel).toLowerCase()}</div>
                        <button
                          onClick={() => openConfirm(app._id || app.id, title)}
                          className="rounded-full uppercase bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100"
                        >
                          Withdraw
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
