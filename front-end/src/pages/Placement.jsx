import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const getPostedAgo = (createdAt) => {
  if (!createdAt) return null;
  const posted = new Date(createdAt);
  if (Number.isNaN(posted.getTime())) return null;
  const diffMs = Date.now() - posted.getTime();
  if (diffMs < 0) return null;
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
  
  // Companies State
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [companyTypeFilter, setCompanyTypeFilter] = useState("all");
  
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
      toast({ title: 'Could not load applications', description: error.message || 'Please try again', variant: 'destructive' });
    } finally {
      setLoadingApplied(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'status') fetchApplied();
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

  // ── FILTERING & CATEGORIZATION LOGIC ────────────────────────────────────────

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

      if (query) {
        const haystack = [
          job.displayTitle, job.displayCompany, job.displayType,
          getDescription(job), getSkills(job).join(" ")
        ].join(" ").toLowerCase();

        const queryWords = query.split(/\s+/);
        if (!queryWords.every(w => haystack.includes(w))) return false;
      }

      return true;
    });
  }, [jobs, searchQuery, locationQuery, sourceFilter, jobType]);

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
    
    // Sort by score, keep only those with a score > 0, fallback to recent if none match
    const matches = scoredJobs.filter(j => j.score > 0).sort((a, b) => b.score - a.score).map(j => j.job);
    return matches.length > 0 ? matches.slice(0, 6) : jobs.slice(0, 6);
  }, [jobs, userSkills, careerRoles]);

  const newJobs = useMemo(() => jobs.slice(0, 6), [jobs]);
  
  const internships = useMemo(() => jobs.filter(job => normalizeJobType(job) === 'internship').slice(0, 6), [jobs]);

  // ── EVENT HANDLERS ─────────────────────────────────────────────────────────

  const handleWithdraw = async (applicationId) => {
    try {
      await placementsAPI.deleteApplication(applicationId);
      setAppliedJobs((prev) => prev.filter((a) => a._id !== applicationId && a.id !== applicationId));
      toast({ title: 'Application withdrawn', description: 'Your application has been removed.' });
    } catch (err) {
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
              <span className="mx-1">•</span>
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
            <span className="text-[#112b6b] dark:text-blue-400 text-xs font-extrabold uppercase tracking-[0.15em]">Back to Dashboard</span>
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
                Placement
              </h1>
              <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">
                Explore active jobs from college placement postings and SMAART job postings.
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
                  Refresh
                </button>
              </div>
            </div>
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
            Saved Jobs
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`h-10 rounded-xl px-4 text-sm font-bold transition-all ${activeTab === 'status' ? 'bg-[#1a3884] text-white shadow-sm' : 'bg-white text-[#0d1f4e] border border-[#d8e6f7] hover:bg-slate-50 dark:border-[#1a3884]/20 dark:bg-[#001630] dark:text-white'}`}
          >
            My Applications
          </button>
          <button
            onClick={() => setActiveTab('companies')}
            className={`h-10 rounded-xl px-4 text-sm font-bold transition-all ${activeTab === 'companies' ? 'bg-[#1a3884] text-white shadow-sm' : 'bg-white text-[#0d1f4e] border border-[#d8e6f7] hover:bg-slate-50 dark:border-[#1a3884]/20 dark:bg-[#001630] dark:text-white'}`}
          >
            Partners
          </button>
        </div>

        {(activeTab === 'recommended' || activeTab === 'jobs') && (
          <div className="mt-6">
            {/* CLEAN SEARCH SECTION */}
            <form onSubmit={handleSearch} className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim() && activeTab === 'recommended') setActiveTab('jobs');
                  }}
                  placeholder="Job title, skills, or company"
                  className="h-12 w-full rounded-xl border border-[#d8e6f7] bg-white pl-11 pr-4 text-sm font-medium text-black outline-none transition-all focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/15 dark:border-[#1a3884]/20 dark:bg-[#001630] dark:text-white shadow-sm hover:border-[#1a3884]/40"
                />
              </div>
              <div className="relative flex-1">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={locationQuery}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    if (e.target.value.trim() && activeTab === 'recommended') setActiveTab('jobs');
                  }}
                  placeholder="City, state, or remote"
                  className="h-12 w-full rounded-xl border border-[#d8e6f7] bg-white pl-11 pr-4 text-sm font-medium text-black outline-none transition-all focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/15 dark:border-[#1a3884]/20 dark:bg-[#001630] dark:text-white shadow-sm hover:border-[#1a3884]/40"
                />
              </div>
              <button type="submit" className="h-12 rounded-xl bg-[#1a3884] px-8 text-sm font-bold text-white transition-all hover:bg-[#132c6b] shadow-md active:scale-95">
                Search
              </button>
            </form>

            {loading ? (
              <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 animate-pulse rounded-2xl bg-white dark:bg-slate-800" />
                ))}
              </div>
            ) : activeTab === 'recommended' ? (
              /* HOME VIEW (Collections & Categories) */
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                
                {/* Recommended Jobs */}
                {recommendedJobs.length > 0 && (
                  <section>
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-[#0d1f4e] dark:text-white">Recommended for you</h2>
                      </div>
                      <button onClick={() => { setActiveTab('jobs'); }} className="text-sm font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1">
                        View all <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {recommendedJobs.map(job => (
                        <JobCard key={job._id} job={job} onClick={(j) => { setSelectedJob(j); setActiveTab('jobs'); }} />
                      ))}
                    </div>
                  </section>
                )}

                {/* New Postings */}
                {newJobs.length > 0 && (
                  <section>
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-[#0d1f4e] dark:text-white">Newly Posted</h2>
                      </div>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {newJobs.map(job => (
                        <JobCard key={job._id} job={job} onClick={(j) => { setSelectedJob(j); setActiveTab('jobs'); }} />
                      ))}
                    </div>
                  </section>
                )}

              </motion.div>
            ) : (
              /* SEARCH VIEW (Master-Detail LinkedIn Style) */
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]">
                
                {/* Left Panel: Job List (Master) */}
                <div className="flex flex-col w-full lg:w-1/3 h-full rounded-2xl border border-[#d8e6f7] bg-white shadow-sm dark:border-[#1a3884]/20 dark:bg-[#001630] overflow-hidden">
                  
                  {/* Filters Bar */}
                  <div className="border-b border-[#d8e6f7] dark:border-[#1a3884]/20 p-4 bg-slate-50 dark:bg-[#001a3d] flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {filteredJobs.length} Results
                    </span>
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-[#1a3884] border border-[#d8e6f7] shadow-sm hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400"
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

                {/* Right Panel: Job Details (Detail) */}
                <div className="hidden lg:flex flex-col w-2/3 h-full rounded-2xl border border-[#d8e6f7] bg-white shadow-sm dark:border-[#1a3884]/20 dark:bg-[#001630] overflow-hidden relative">
                  {!selectedJob ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <img src="https://illustrations.popsy.co/amber/freelancer.svg" alt="Select a job" className="w-64 h-64 opacity-80" />
                      <h3 className="mt-6 text-xl font-extrabold text-[#0d1f4e] dark:text-white">Select a job to view details</h3>
                      <p className="mt-2 text-slate-500 font-medium">Click on any job from the list on the left to see the full description and apply.</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto">
                      {/* Detail Header */}
                      <div className="relative h-32 bg-gradient-to-r from-slate-100 to-[#eef4ff] dark:from-slate-800 dark:to-[#1a3884]/30 border-b border-slate-200 dark:border-slate-700">
                        <button onClick={() => setSelectedJob(null)} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/50 backdrop-blur flex items-center justify-center text-slate-600 hover:bg-white dark:bg-slate-900/50 dark:text-slate-300">
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="px-8 pb-8">
                        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                          <div className="flex items-start gap-6">
                            <div className="-mt-10 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md dark:border-[#001630] dark:bg-slate-800 relative z-10">
                              {getCompanyLogo(selectedJob) ? (
                                <img src={getCompanyLogo(selectedJob)} alt="logo" className="h-full w-full object-contain p-2" />
                              ) : (
                                <span className="text-3xl font-black text-[#1a3884]">{(selectedJob.displayCompany || "C").charAt(0)}</span>
                              )}
                            </div>
                            <div className="pt-3">
                              <h2 className="text-2xl font-black text-[#0d1f4e] dark:text-white">{selectedJob.displayTitle}</h2>
                              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                <span className="flex items-center gap-1.5"><Building className="h-4 w-4" /> {selectedJob.displayCompany}</span>
                                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {selectedJob.displayLocation || 'Remote'}</span>
                                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {selectedJob.displayType}</span>
                              </div>
                            </div>
                          </div>
                          <div className="xl:pt-3">
                            <button 
                              onClick={() => navigate(`/dashboard/placement/${selectedJob.sourceCollection}/${selectedJob._id}`, { state: { job: selectedJob } })}
                              className="flex h-12 w-full xl:w-auto items-center justify-center rounded-xl bg-[#1a3884] px-8 text-base font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-[#132c6b] hover:shadow-xl active:scale-95 shrink-0"
                            >
                              Apply Now
                            </button>
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
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#d8e6f7] bg-white px-6 text-center shadow-sm dark:border-[#1a3884]/20 dark:bg-[#001630]">
                <img src="https://illustrations.popsy.co/amber/surreal-hourglass.svg" alt="No applications" className="h-48 w-48 opacity-80" />
                <h2 className="mt-6 text-xl font-extrabold text-[#0d1f4e] dark:text-white">No applications yet</h2>
                <p className="mt-2 max-w-md text-sm font-medium text-slate-500">Your journey starts here. Search for jobs and send your first application!</p>
                <button onClick={() => setActiveTab('jobs')} className="mt-6 rounded-xl bg-[#1a3884] px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#132c6b] active:scale-95 transition-all">
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div className="flex h-[calc(100vh-250px)] min-h-[650px] gap-6 overflow-x-auto pb-6 pt-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                {(() => {
                  const columns = {
                    applied: { 
                      id: 'applied', title: 'Applied', items: [], 
                      theme: { dot: 'bg-blue-500 shadow-blue-500/40', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' } 
                    },
                    reviewing: { 
                      id: 'reviewing', title: 'Under Review', items: [], 
                      theme: { dot: 'bg-amber-500 shadow-amber-500/40', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' } 
                    },
                    interviewing: { 
                      id: 'interviewing', title: 'Interviewing', items: [], 
                      theme: { dot: 'bg-purple-500 shadow-purple-500/40', badge: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' } 
                    },
                    offered: { 
                      id: 'offered', title: 'Offered', items: [], 
                      theme: { dot: 'bg-emerald-500 shadow-emerald-500/40', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' } 
                    },
                    rejected: { 
                      id: 'rejected', title: 'Not Selected', items: [], 
                      theme: { dot: 'bg-rose-500 shadow-rose-500/40', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' } 
                    }
                  };

                  appliedJobs.forEach(app => {
                    const rawStatus = (app.status || '').toLowerCase().replace(/[-_]/g, ' ').trim();
                    if (rawStatus.includes('select') || rawStatus.includes('offer') || rawStatus.includes('hire')) {
                      columns.offered.items.push(app);
                    } else if (rawStatus.includes('shortlist') || rawStatus.includes('interview')) {
                      columns.interviewing.items.push(app);
                    } else if (rawStatus.includes('review') || rawStatus.includes('hold') || rawStatus.includes('progress')) {
                      columns.reviewing.items.push(app);
                    } else if (rawStatus.includes('reject') || rawStatus.includes('decline') || rawStatus.includes('not selected')) {
                      columns.rejected.items.push(app);
                    } else {
                      columns.applied.items.push(app);
                    }
                  });

                  return Object.values(columns)
                    .filter(col => col.items.length > 0 || col.id !== 'rejected')
                    .map(col => (
                      <div key={col.id} className="flex h-full w-[340px] shrink-0 flex-col rounded-3xl bg-slate-50/50 p-4 border border-[#d8e6f7] shadow-sm dark:bg-[#001630]/50 dark:border-[#1a3884]/20">
                        <div className="mb-5 flex items-center justify-between px-2">
                          <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full shadow-sm ${col.theme.dot}`} />
                            <h3 className="text-base font-extrabold text-[#0d1f4e] dark:text-white">{col.title}</h3>
                          </div>
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-xs font-black text-slate-700 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                            {col.items.length}
                          </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-4 scrollbar-none pb-4 px-1">
                          {col.items.length === 0 ? (
                            <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                              <span className="text-xs font-bold text-slate-400">No applications</span>
                            </div>
                          ) : (
                            col.items.map((app, index) => {
                              const jobRef = app.job || {};
                              const title = app.jobTitle || app.displayTitle || jobRef.displayTitle || 'Role';
                              const companyName = app.companyName || jobRef.displayCompany || 'Company';
                              const companyLogo = getCompanyLogo(jobRef) || null;
                              const appliedAt = app.appliedAt || app.createdAt;
                              const statusLabel = formatStatus(app.status);

                              return (
                                <motion.article
                                  key={app._id} 
                                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                                  className="group relative flex flex-col rounded-2xl border border-[#d8e6f7] bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 hover:border-[#1a3884]/30 dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:hover:border-blue-500/40"
                                >
                                  <div className="mb-4 flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
                                      {companyLogo ? (
                                        <img src={companyLogo} alt="logo" className="h-8 w-8 object-contain" />
                                      ) : (
                                        <Briefcase className="h-5 w-5 text-slate-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="truncate text-sm font-black text-[#0d1f4e] dark:text-white" title={title}>{title}</h4>
                                      <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                        <Building className="h-3.5 w-3.5 shrink-0" /> 
                                        <span className="truncate">{companyName}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-auto space-y-4">
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${col.theme.badge}`}>
                                        {statusLabel}
                                      </span>
                                      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                        <CalendarDue className="h-3.5 w-3.5" />
                                        {formatDate(appliedAt)}
                                      </span>
                                    </div>
                                    
                                    {col.id === 'applied' && (
                                      <button
                                        onClick={() => openConfirm(app._id, title)}
                                        className="w-full rounded-xl border border-red-100 bg-white py-2 text-xs font-bold text-red-500 opacity-0 transition-all hover:bg-red-50 group-hover:opacity-100 focus:opacity-100 dark:border-red-900/30 dark:bg-transparent dark:hover:bg-red-900/20"
                                      >
                                        Withdraw
                                      </button>
                                    )}
                                  </div>
                                </motion.article>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ));
                })()}
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
