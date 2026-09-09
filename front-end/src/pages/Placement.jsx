import { useEffect, useMemo, useState, useRef } from "react";
import NeuralBackground from "@/components/ui/NeuralBackground";
import PageTransition from "@/components/PageTransition";
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
  IconCircleCheck as CircleCheck,
  IconAlertCircle as AlertCircle,
  IconHistory as History,
  IconDownload as Download,
  IconMicrophone as Microphone,
  IconCalendarPlus as CalendarPlus,
  IconTicket as Ticket,
  IconArrowUpRight as ArrowUpRight
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl, placementsAPI, usersAPI, apiCall } from "@/services/api";
import {
  evaluateEligibility,
  extractStudentProfile,
  daysUntil,
  getMatchScore,
  roleMatchesTitle,
  normalizeText,
} from "@/services/placementEligibility";
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
      return "text-blue-600 dark:text-[#A6D7E8]";
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
// ── Job fair helpers ─────────────────────────────────────────────────────────
const getFairCountdown = (startDate, endDate, t) => {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  const end = endDate ? new Date(endDate) : null;
  if (end && !Number.isNaN(end.getTime()) && now > end) return { tone: "past", label: t("placement.fair_ended", "Ended") };
  if (now >= start) return { tone: "live", label: t("placement.fair_live", "Happening now") };
  const days = Math.ceil((start - now) / 86400000);
  if (days <= 0) return { tone: "live", label: t("placement.fair_today", "Starts today") };
  if (days === 1) return { tone: "soon", label: t("placement.fair_tomorrow", "Starts tomorrow") };
  return { tone: days <= 7 ? "soon" : "later", label: t("placement.fair_in_days", { count: days, defaultValue: `Starts in ${days} days` }) };
};

const toIcsDate = (d) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

// Build a one-event .ics so the fair lands in Google/Apple/Outlook calendars.
const downloadFairIcs = (fair) => {
  if (!fair?.startDate) return;
  const start = new Date(fair.startDate);
  const end = fair.endDate ? new Date(fair.endDate) : new Date(start.getTime() + 3 * 3600000);
  const esc = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/[,;]/g, (m) => `\\${m}`);
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SMAART Institute//Placement//EN", "BEGIN:VEVENT",
    `UID:${fair._id || Date.now()}@smaart-institute`, `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`, `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${esc(fair.title)}`, `DESCRIPTION:${esc(fair.description)}`, `LOCATION:${esc(fair.location)}`,
    "END:VEVENT", "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${String(fair.title || "job-fair").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Application status helpers ───────────────────────────────────────────────
const INTERVIEW_STATUS_RE = /interview|shortlist/i;
const OFFER_STATUS_RE = /offer|accepted|hired|selected/i;
const REJECTED_STATUS_RE = /reject|declined/i;

const statusBucket = (status) => {
  const s = String(status || "applied");
  if (INTERVIEW_STATUS_RE.test(s)) return "interview";
  if (OFFER_STATUS_RE.test(s)) return "offer";
  if (REJECTED_STATUS_RE.test(s)) return "rejected";
  return "applied";
};

// Prefer the server's statusHistory; otherwise synthesise the two points we
// can prove from existing fields so older applications still get a timeline.
const buildStatusTimeline = (app) => {
  const history = Array.isArray(app.statusHistory) ? app.statusHistory.filter((h) => h && h.status) : [];
  if (history.length > 0) {
    return [...history].sort((a, b) => new Date(a.changedAt || 0) - new Date(b.changedAt || 0));
  }
  const current = app.status || app.applicationStatus || "applied";
  const points = [{ status: "applied", changedAt: app.appliedAt || app.createdAt || null, note: null }];
  if (String(current).toLowerCase() !== "applied") {
    points.push({ status: current, changedAt: app.updatedAt || null, note: app.declineReason || app.note || app.recruiterNote || null });
  }
  return points;
};

// Proof-of-application PDF. jsPDF is already a dependency (CGPA report).
const downloadApplicationReceipt = async (app) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const title = app.jobTitle || app.job?.displayTitle || "Role";
  const company = app.companyName || app.job?.displayCompany || "Company";
  const appliedAt = app.appliedAt || app.createdAt;

  doc.setFillColor(7, 32, 54);
  doc.rect(0, 0, 595, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SMAART Institute", 40, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Application Receipt", 40, 66);

  const rows = [
    ["Application ID", String(app._id || app.id || "—")],
    ["Role", title],
    ["Company", company],
    ["Applied on", appliedAt ? new Date(appliedAt).toLocaleString() : "—"],
    ["Current status", String(app.status || "applied")],
    ["Applicant", app.studentName || "—"],
    ["Email", app.studentEmail || "—"],
  ];
  let y = 136;
  rows.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(k.toUpperCase(), 40, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(7, 32, 54);
    doc.text(String(v), 190, y, { maxWidth: 360 });
    y += 30;
  });
  doc.setDrawColor(215, 235, 245);
  doc.line(40, y, 555, y);
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated ${new Date().toLocaleString()}. This receipt confirms the application was submitted through SMAART Institute.`, 40, y + 22, { maxWidth: 515 });
  doc.save(`application-receipt-${String(title).replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
};

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

  // The constellation canvas paints from a prop, not CSS, so it has to be
  // told when the dark class flips -- same observer the dashboard uses.
  const [isDarkTheme, setIsDarkTheme] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

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

  // Feature state
  const [savedJobs, setSavedJobs] = useState([]);              // [{ jobId, source }]
  const [careerRoles, setCareerRoles] = useState([]);          // locked career-path roles from /placements/jobs
  const [studentProfile, setStudentProfile] = useState(null);  // { cgpa, backlogs, branch } for eligibility badges
  const [sortBy, setSortBy] = useState("newest");              // newest | deadline | match
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");     // all | applied | interview | offer | rejected
  const [timelineApp, setTimelineApp] = useState(null);        // application open in the timeline drawer
  const [selectedPartner, setSelectedPartner] = useState(null); // company open in the partner drawer
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
      setCareerRoles(Array.isArray(response?.careerRoles) ? response.careerRoles.filter(Boolean) : []);
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
    placementsAPI.getSavedJobs().then((r) => setSavedJobs(r?.data || [])).catch(() => {});
    // Eligibility badges need the student's CGPA (saved from the calculator)
    // and backlogs/branch (profile). Best-effort: if either fails the badges
    // simply stay hidden rather than guessing.
    Promise.all([usersAPI.getProfile().catch(() => null), apiCall("/cgpa").catch(() => null)])
      .then(([me, cg]) => setStudentProfile(extractStudentProfile(me, cg)))
      .catch(() => {});
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

  const isJobSaved = (job) =>
    savedJobs.some((s) => String(s.jobId) === String(job._id) && s.source === job.sourceCollection);

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = jobs.filter((job) => {
      const sourceMatch = sourceFilter === "all" || job.sourceCollection === sourceFilter;
      if (!sourceMatch) return false;

      if (jobType !== 'all') {
        const normalized = normalizeJobType(job);
        if (jobType === 'full-time' && normalized !== 'full-time') return false;
        if (jobType === 'part-time' && normalized !== 'part-time') return false;
        if (jobType === 'internship' && normalized !== 'internship') return false;
      }

      if (workMode !== 'all' && (job.workMode || "").trim().toLowerCase() !== workMode) return false;

      if (showSavedOnly && !savedJobs.some((s) => String(s.jobId) === String(job._id) && s.source === job.sourceCollection)) return false;

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

    const createdTs = (job) => new Date(job.displayCreatedAt || job.createdAt || 0).getTime() || 0;
    const deadlineTs = (job) => {
      const d = job.displayDeadline ? new Date(job.displayDeadline).getTime() : NaN;
      return Number.isNaN(d) ? Infinity : d;
    };
    const sorted = [...list];
    if (sortBy === "deadline") sorted.sort((a, b) => deadlineTs(a) - deadlineTs(b));
    else if (sortBy === "match") sorted.sort((a, b) => (getMatchScore(b, getSkills(b).length) ?? -1) - (getMatchScore(a, getSkills(a).length) ?? -1));
    else sorted.sort((a, b) => createdTs(b) - createdTs(a));
    return sorted;
  }, [jobs, searchQuery, sourceFilter, jobType, workMode, sortBy, showSavedOnly, savedJobs, t]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchSearch = (c.name || '').toLowerCase().includes(companySearch.toLowerCase());
      const matchType = companyTypeFilter === 'all' || c.partnerType === companyTypeFilter;
      return matchSearch && matchType;
    });
  }, [companies, companySearch, companyTypeFilter]);

  // Recommended: backend skill-match evaluation + the student's locked career
  // path, with a nudge for roles closing this week. Only shown on the
  // unfiltered list; each entry is { job, score, match }.
  const recommendedJobs = useMemo(() => {
    if (!jobs.length) return [];
    return jobs
      .filter((job) => !String(job.displayStatus || "").toLowerCase().includes("closed"))
      .map((job) => {
        let score = 0;
        const match = getMatchScore(job, getSkills(job).length);
        if (match != null) score += match / 25;
        if (careerRoles.some((r) => roleMatchesTitle(r, job.displayTitle))) score += 3;
        const d = daysUntil(job.displayDeadline);
        if (d != null && d >= 0 && d <= 7) score += 1;
        return { job, score, match };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [jobs, careerRoles]);

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

  // Optimistic bookmark toggle; the server's savedJobs array wins on response.
  const toggleSaveJob = async (e, job) => {
    e.stopPropagation();
    const entry = { jobId: job._id, source: job.sourceCollection };
    const same = (s) => String(s.jobId) === String(job._id) && s.source === job.sourceCollection;
    const wasSaved = savedJobs.some(same);
    setSavedJobs((prev) => (wasSaved ? prev.filter((s) => !same(s)) : [...prev, entry]));
    try {
      const res = await placementsAPI.toggleSavedJob(job.sourceCollection, job._id);
      if (Array.isArray(res?.data)) setSavedJobs(res.data);
      toast({ title: res?.isSaved ? t("placement.saved_toast", "Job saved") : t("placement.unsaved_toast", "Removed from saved jobs") });
    } catch (err) {
      setSavedJobs((prev) => (wasSaved ? [...prev, entry] : prev.filter((s) => !same(s))));
      toast({ title: t("placement.error_save", "Could not update saved jobs"), description: err.message, variant: "destructive" });
    }
  };

  // Status cards link back to the posting they were made against.
  const openApplicationJob = (app) => {
    if (app.jobRemoved) return;
    const jobId = app.job && typeof app.job === "object" ? app.job._id : app.job;
    if (!jobId) return;
    const state = app.job && typeof app.job === "object" ? { state: { job: app.job } } : undefined;
    navigate(`/dashboard/placement/${app.jobSource || "jobpostings"}/${jobId}`, state);
  };

  const handleDownloadReceipt = async (app) => {
    try {
      await downloadApplicationReceipt(app);
    } catch (err) {
      toast({ title: t("placement.error_receipt", "Could not generate receipt"), description: err.message, variant: "destructive" });
    }
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
      const recruiterNote = app.recruiterNote || app.note || app.declineReason || null;
      const isInterviewStage = statusBucket(app.status || app.applicationStatus) === "interview";
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
          className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-[#045C9A]/35 hover:shadow-[0_4px_20px_-4px_rgba(13,31,78,0.14)] dark:border-[#045C9A]/25 dark:bg-[#0d3a5f] dark:hover:border-[#045C9A]/60"
        >
          {/* Header: logo + title + company */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-[13px] font-semibold text-[#045C9A] dark:border-[#045C9A]/25 dark:bg-[#0d3a5f] dark:text-[#A6D7E8]">
              {companyLogo ? (
                <img src={companyLogo} alt={`${companyName} logo`} className="h-full w-full object-contain p-1.5" />
              ) : (
                <span>{companyInitial}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2
                title={title}
                onClick={() => openApplicationJob(app)}
                className={`line-clamp-2 text-[15px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#072036] dark:text-white ${jobRemoved ? '' : 'cursor-pointer transition-colors hover:text-[#045C9A] dark:hover:text-[#A6D7E8]'}`}
              >
                {title}
              </h2>
              <p className="mt-1 truncate text-[13px] leading-tight text-slate-500 dark:text-slate-400">{companyName}</p>
            </div>
            {sourceLabel && (
              <span className={`mt-0.5 shrink-0 rounded-md px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.05em] ${
                isSmaartApp
                  ? 'bg-[#072036] text-white dark:bg-[#045C9A] dark:text-white'
                  : 'bg-[#EAF7FD] text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]'
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
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-[#045C9A]/20">
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
            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-[#045C9A]/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-slate-400">{t("placement.status_label", "Status")}</span>
                  <span className={`truncate text-[13.5px] font-semibold ${getStatusTextColor(app.status || app.applicationStatus || 'applied')}`}>{statusLabel}</span>
                  {recruiterNote && (
                    <span className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-slate-500 dark:text-slate-400" title={recruiterNote}>
                      {recruiterNote}
                    </span>
                  )}
                </div>
                {!['Accepted', 'Declined', 'Hired'].includes(app.status) && (
                  <button
                    onClick={() => openConfirm(app._id || app.id, title)}
                    className="h-9 shrink-0 rounded-lg border border-slate-200 px-3.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-[#045C9A]/30 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  >
                    {t("placement.withdraw", "Withdraw")}
                  </button>
                )}
              </div>

              {/* Secondary actions: timeline, open the posting, interview prep, receipt */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTimelineApp(app)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d7ebf5] bg-white px-2.5 text-[12px] font-medium text-[#045C9A] transition-colors hover:bg-[#EAF7FD] dark:border-[#045C9A]/30 dark:bg-transparent dark:text-[#A6D7E8] dark:hover:bg-[#045C9A]/20"
                >
                  <History className="h-3.5 w-3.5" stroke={1.8} />
                  {t("placement.timeline", "Timeline")}
                </button>
                {!jobRemoved && (
                  <button
                    type="button"
                    onClick={() => openApplicationJob(app)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d7ebf5] bg-white px-2.5 text-[12px] font-medium text-[#045C9A] transition-colors hover:bg-[#EAF7FD] dark:border-[#045C9A]/30 dark:bg-transparent dark:text-[#A6D7E8] dark:hover:bg-[#045C9A]/20"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" stroke={1.8} />
                    {t("placement.view_role", "View role")}
                  </button>
                )}
                {isInterviewStage && (
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/interview-prep')}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0E2136] px-2.5 text-[12px] font-medium text-white transition-colors hover:bg-[#1b3457] dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white"
                  >
                    <Microphone className="h-3.5 w-3.5" stroke={1.8} />
                    {t("placement.prepare_interview", "Prepare for interview")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDownloadReceipt(app)}
                  title={t("placement.receipt", "Download application receipt")}
                  className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d7ebf5] bg-white px-2.5 text-[12px] font-medium text-slate-600 transition-colors hover:border-[#045C9A]/40 hover:text-[#045C9A] dark:border-[#045C9A]/30 dark:bg-transparent dark:text-slate-300 dark:hover:text-[#A6D7E8]"
                >
                  <Download className="h-3.5 w-3.5" stroke={1.8} />
                  {t("placement.receipt_short", "Receipt")}
                </button>
              </div>
            </div>
          )}
        </motion.article>
      );
    };
    const counts = appliedJobs.reduce(
      (acc, a) => {
        acc.total += 1;
        acc[statusBucket(a.status || a.applicationStatus)] += 1;
        return acc;
      },
      { total: 0, applied: 0, interview: 0, offer: 0, rejected: 0 }
    );
    const responded = counts.interview + counts.offer + counts.rejected;
    const responseRate = counts.total ? Math.round((responded / counts.total) * 100) : 0;
    const visible = statusFilter === "all"
      ? appliedJobs
      : appliedJobs.filter((a) => statusBucket(a.status || a.applicationStatus) === statusFilter);

    const tiles = [
      [t("placement.stat_applied", "Applied"), counts.total, "text-[#072036] dark:text-white"],
      [t("placement.stat_interviews", "Interviews"), counts.interview, "text-amber-600 dark:text-amber-400"],
      [t("placement.stat_offers", "Offers"), counts.offer, "text-emerald-600 dark:text-emerald-400"],
      [t("placement.stat_response", "Response rate"), `${responseRate}%`, "text-[#045C9A] dark:text-[#A6D7E8]"],
    ];
    const chips = [
      ["all", t("placement.filter_all", "All"), counts.total],
      ["applied", t("placement.filter_applied", "Applied"), counts.applied],
      ["interview", t("placement.filter_interview", "Interview"), counts.interview],
      ["offer", t("placement.filter_offer", "Offer"), counts.offer],
      ["rejected", t("placement.filter_rejected", "Rejected"), counts.rejected],
    ];

    return (
      <>
        {/* Summary strip -- same bordered stat-strip pattern as the CGPA result panel */}
        <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#d7ebf5] bg-[#d7ebf5] dark:border-white/10 dark:bg-white/10 sm:grid-cols-4">
          {tiles.map(([label, value, cls]) => (
            <div key={label} className="bg-white px-4 py-3 dark:bg-[#0d3a5f]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
              <p className={`mt-1 text-lg font-extrabold ${cls}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Stage filter chips */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {chips.map(([key, label, n]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-medium transition-colors ${
                statusFilter === key
                  ? 'border-[#045C9A] bg-[#EAF7FD] text-[#045C9A] dark:border-[#A6D7E8]/50 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]'
                  : 'border-[#d7ebf5] bg-white text-slate-600 hover:border-[#045C9A]/30 hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#0d3a5f] dark:text-slate-300 dark:hover:border-white/20'
              }`}
            >
              {label}
              <span className={`rounded-md px-1.5 text-[11px] font-semibold ${statusFilter === key ? 'bg-[#045C9A]/10 dark:bg-[#A6D7E8]/15' : 'bg-slate-100 dark:bg-white/10'}`}>{n}</span>
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-[#045C9A]/30 dark:bg-[#0d3a5f]">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t("placement.no_apps_in_filter", "No applications in this stage yet.")}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((app, origIdx) => renderCard(app, origIdx))}
          </div>
        )}
      </>
    );
  };

  return (
    <PageTransition>
    <div className="relative min-h-screen overflow-hidden bg-transparent pb-12 transition-colors duration-300">
      {/* Same ambient layer as the dashboard, courses, assessments,
          toolkit and CGPA calculator pages */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
        <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
      </div>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
        <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-4 sm:px-5 sm:pt-5 lg:px-6 lg:pt-6">
        {/* Back Button (Mobile Mode Only) */}
        <div className="mb-4 flex items-center md:hidden">
          <button
            onClick={() => navigate("/dashboard")}
            className="group flex items-center gap-3 w-fit selection:bg-transparent"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d7ebf5] bg-white shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-white/10 dark:bg-white/5">
              <ArrowLeft stroke={2} className="h-4 w-4 text-[#034a7d] transition-transform group-hover:-translate-x-0.5 dark:text-slate-300" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#034a7d] transition-colors group-hover:text-[#045C9A] dark:text-[#A6D7E8] dark:group-hover:text-white">
              {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
            </span>
          </button>
        </div>

        {/* Hero -- same structure, padding and type scale as the
            courses/assessments/toolkit/CGPA calculator hero. */}
        <motion.section
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative mb-6 w-full overflow-hidden rounded-2xl border border-[#d7ebf5]/80 bg-white shadow-sm dark:border-[#045C9A]/20 dark:bg-[#0d3a5f]"
        >
          <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />

          <div className="relative z-10 flex flex-col gap-4 px-6 py-5 sm:px-8 sm:py-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[#d7ebf5] bg-[#EAF7FD] text-[#045C9A] shadow-sm dark:border-[#045C9A]/30 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]">
                <Briefcase className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1
                  className="text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {t("placement.title", "Placement")}
                </h1>
                <p className="mt-0.5 text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">
                  {t("placement.subtitle", "Explore active jobs from college placement postings and SMAART job postings.")}
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-3 border-t border-[#d7ebf5] pt-4 dark:border-[#045C9A]/20 md:border-l md:border-t-0 md:pl-6 md:pt-0">
              <div className="flex flex-col text-left">
                <span className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {t("placement.open_roles", "Open Roles")}
                </span>
                <span
                  className="max-w-[200px] truncate text-[13px] font-bold text-[#072036] dark:text-white md:max-w-[250px]"
                  title={rolesSummary}
                >
                  {rolesSummary}
                </span>
              </div>

              <button
                type="button"
                onClick={fetchJobs}
                disabled={loading}
                title={t("placement.refresh", "Refresh")}
                aria-label={t("placement.refresh", "Refresh")}
                className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl border border-[#d7ebf5] bg-white text-[#045C9A] transition-colors hover:border-[#045C9A]/40 hover:bg-[#EAF7FD] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#045C9A]/30 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8] dark:hover:bg-[#045C9A]/30"
              >
                <Refresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} stroke={2} />
              </button>
            </div>
          </div>
        </motion.section>

        {/* Unified toolbar: tabs + search + filters on one surface */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#d7ebf5] bg-white shadow-[0_2px_16px_rgba(26,56,132,0.05)] dark:border-[#045C9A]/20 dark:bg-[#0d3a5f]">
          {/* Tabs: Jobs | Job Status | Job Fair | Partners */}
          <div className={`overflow-x-auto px-2 ${activeTab === 'jobs' ? 'border-b border-slate-200 dark:border-[#045C9A]/20' : ''}`}>
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
                      ? 'text-[#072036] after:bg-[#072036] dark:text-white dark:after:bg-[#A6D7E8]'
                      : 'text-slate-500 after:bg-transparent hover:text-[#072036] dark:text-slate-400 dark:hover:text-white'
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
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-10 pr-9 text-[13.5px] text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-[#045C9A] focus:bg-white dark:border-[#045C9A]/30 dark:bg-[#0d3a5f] dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-[#0d3a5f]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label={t("placement.clear_search", "Clear search")}
                    className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-[#045C9A]/30"
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
                      className={`h-10 w-full cursor-pointer appearance-none rounded-lg border pl-3.5 pr-9 text-[13px] font-medium outline-none transition-colors focus:border-[#045C9A] sm:w-[154px] ${
                        workMode !== 'all'
                          ? 'border-[#045C9A]/50 bg-[#EAF7FD] text-[#045C9A] dark:border-[#045C9A] dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]'
                          : 'border-slate-200 bg-slate-50/70 text-[#072036] hover:border-slate-300 dark:border-[#045C9A]/30 dark:bg-[#0d3a5f] dark:text-white'
                      }`}
                    >
                      <option value="all">{t("placement.all_work_modes", "All work modes")}</option>
                      {workModeOptions.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <ChevronRight className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 ${workMode !== 'all' ? 'text-[#045C9A] dark:text-[#A6D7E8]' : 'text-slate-400'}`} />
                  </div>
                )}

                <div className="relative">
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className={`h-10 w-full cursor-pointer appearance-none rounded-lg border pl-3.5 pr-9 text-[13px] font-medium outline-none transition-colors focus:border-[#045C9A] sm:w-[154px] ${
                      sourceFilter !== 'all'
                        ? 'border-[#045C9A]/50 bg-[#EAF7FD] text-[#045C9A] dark:border-[#045C9A] dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]'
                        : 'border-slate-200 bg-slate-50/70 text-[#072036] hover:border-slate-300 dark:border-[#045C9A]/30 dark:bg-[#0d3a5f] dark:text-white'
                    }`}
                  >
                    <option value="all">{t("placement.all_jobs", { count: jobs.length, defaultValue: "All jobs ({{count}})" })}</option>
                    <option value="smaartjobpostings">{t("placement.smaart_jobs", { count: sourceCounts.smaartjobpostings || 0, defaultValue: "SMAART ({{count}})" })}</option>
                    <option value="jobpostings">{t("placement.college_jobs", { count: sourceCounts.jobpostings || 0, defaultValue: "College ({{count}})" })}</option>
                  </select>
                  <ChevronRight className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 ${sourceFilter !== 'all' ? 'text-[#045C9A] dark:text-[#A6D7E8]' : 'text-slate-400'}`} />
                </div>

                <div className="relative">
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className={`h-10 w-full cursor-pointer appearance-none rounded-lg border pl-3.5 pr-9 text-[13px] font-medium outline-none transition-colors focus:border-[#045C9A] sm:w-[136px] ${
                      jobType !== 'all'
                        ? 'border-[#045C9A]/50 bg-[#EAF7FD] text-[#045C9A] dark:border-[#045C9A] dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]'
                        : 'border-slate-200 bg-slate-50/70 text-[#072036] hover:border-slate-300 dark:border-[#045C9A]/30 dark:bg-[#0d3a5f] dark:text-white'
                    }`}
                  >
                    <option value="all">{t("placement.all_types", "All types")}</option>
                    <option value="full-time">{t("placement.full_time", "Full-Time")}</option>
                    <option value="part-time">{t("placement.part_time", "Part-Time")}</option>
                    <option value="internship">{t("placement.internship", "Internship")}</option>
                  </select>
                  <ChevronRight className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 ${jobType !== 'all' ? 'text-[#045C9A] dark:text-[#A6D7E8]' : 'text-slate-400'}`} />
                </div>

                {/* Sort */}
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50/70 pl-3.5 pr-9 text-[13px] font-medium text-[#072036] outline-none transition-colors hover:border-slate-300 focus:border-[#045C9A] dark:border-[#045C9A]/30 dark:bg-[#0d3a5f] dark:text-white sm:w-[158px]"
                  >
                    <option value="newest">{t("placement.sort_newest", "Newest first")}</option>
                    <option value="deadline">{t("placement.sort_deadline", "Deadline soonest")}</option>
                    <option value="match">{t("placement.sort_match", "Best match")}</option>
                  </select>
                  <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-slate-400" />
                </div>

                {/* Saved only */}
                <button
                  type="button"
                  onClick={() => setShowSavedOnly((v) => !v)}
                  aria-pressed={showSavedOnly}
                  title={t("placement.saved_only", "Show saved jobs only")}
                  className={`flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3.5 text-[13px] font-medium transition-colors ${
                    showSavedOnly
                      ? 'border-[#045C9A]/50 bg-[#EAF7FD] text-[#045C9A] dark:border-[#045C9A] dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]'
                      : 'border-slate-200 bg-slate-50/70 text-[#072036] hover:border-slate-300 dark:border-[#045C9A]/30 dark:bg-[#0d3a5f] dark:text-white'
                  }`}
                >
                  {showSavedOnly ? <BookmarkFilled className="h-4 w-4" stroke={1.8} /> : <Bookmark className="h-4 w-4" stroke={1.8} />}
                  <span>{t("placement.saved", "Saved")}</span>
                  {savedJobs.length > 0 && (
                    <span className="rounded-md bg-[#045C9A]/10 px-1.5 text-[11px] font-semibold text-[#045C9A] dark:bg-[#A6D7E8]/15 dark:text-[#A6D7E8]">{savedJobs.length}</span>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {activeTab === 'jobs' && (
          <>
            {!loading && recommendedJobs.length > 0 && !searchQuery && sourceFilter === 'all' && jobType === 'all' && workMode === 'all' && !showSavedOnly && (
              <section className="mb-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#045C9A] dark:text-[#A6D7E8]" stroke={1.8} />
                  <h2 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#045C9A] dark:text-[#A6D7E8]">
                    {t("placement.recommended", "Recommended for you")}
                  </h2>
                  <span className="text-[12px] text-slate-400 dark:text-slate-500">
                    {t("placement.recommended_hint", "based on your skills and career path")}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {recommendedJobs.map(({ job, match }) => {
                    const logo = getCompanyLogo(job);
                    const initial = (job.displayCompany || "C").trim().charAt(0).toUpperCase();
                    const pathHit = careerRoles.find((r) => roleMatchesTitle(r, job.displayTitle));
                    return (
                      <button
                        key={`rec-${job.sourceCollection}-${job._id}`}
                        type="button"
                        onClick={() => navigate(`/dashboard/placement/${job.sourceCollection}/${job._id}`, { state: { job } })}
                        className="group flex items-center gap-3 rounded-xl border border-[#d7ebf5] bg-gradient-to-br from-[#EAF7FD] to-white p-3.5 text-left transition-colors hover:border-[#045C9A]/40 dark:border-[#045C9A]/30 dark:from-[#045C9A]/15 dark:to-[#0d3a5f]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#d7ebf5] bg-white text-[13px] font-semibold text-[#045C9A] dark:border-[#045C9A]/30 dark:bg-[#0d3a5f] dark:text-[#A6D7E8]">
                          {logo ? <img src={logo} alt="" className="h-full w-full object-contain p-1.5" /> : <span>{initial}</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-semibold text-[#072036] dark:text-white">{job.displayTitle}</p>
                          <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">{job.displayCompany}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {match != null && (
                              <span className="rounded-md bg-white px-1.5 py-[2px] text-[10.5px] font-semibold text-[#045C9A] dark:bg-[#072036] dark:text-[#A6D7E8]">
                                {match}% {t("placement.match", "match")}
                              </span>
                            )}
                            {pathHit && (
                              <span className="max-w-[160px] truncate rounded-md bg-white px-1.5 py-[2px] text-[10.5px] font-semibold text-[#045C9A] dark:bg-[#072036] dark:text-[#A6D7E8]">
                                {pathHit}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#045C9A] transition-transform group-hover:translate-x-0.5 dark:text-[#A6D7E8]" stroke={2} />
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-[268px] animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-[#045C9A]/25 dark:bg-[#0d3a5f]" />
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-[#045C9A]/30 dark:bg-[#0d3a5f]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF7FD] dark:bg-[#045C9A]/15">
                  <Briefcase className="h-6 w-6 text-[#045C9A] dark:text-[#A6D7E8]" />
                </div>
                <h2 className="text-base font-semibold text-[#072036] dark:text-white">{t("placement.no_jobs_found", "No placement jobs found")}</h2>
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
                  const daysLeft = daysUntil(job.displayDeadline);
                  const closingSoon = !isClosed && daysLeft != null && daysLeft >= 0 && daysLeft <= 3;
                  const pathMatch = careerRoles.find((r) => roleMatchesTitle(r, job.displayTitle)) || null;
                  const eligibility = evaluateEligibility(job, studentProfile);
                  const saved = isJobSaved(job);

                  return (
                    <motion.article
                      key={`${job.sourceCollection}-${job._id}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className={`group relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-[#045C9A]/35 hover:shadow-[0_4px_20px_-4px_rgba(13,31,78,0.14)] dark:border-[#045C9A]/25 dark:bg-[#0d3a5f] dark:hover:border-[#045C9A]/60 ${isClosed ? 'opacity-60' : ''}`}
                    >
                      {/* Eyebrow: source + status on the left, bookmark on the right */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`inline-flex shrink-0 items-center rounded px-1.5 py-[2px] text-[10px] font-semibold uppercase tracking-[0.08em] ${
                              isSmaartPost
                                ? 'bg-[#072036] text-white dark:bg-[#A6D7E8] dark:text-[#072036]'
                                : 'bg-[#EAF7FD] text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]'
                            }`}
                          >
                            {sourceLabel}
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isClosed ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                            <span className="truncate">{statusLabel}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleSaveJob(e, job)}
                          aria-pressed={saved}
                          title={saved ? t("placement.unsave", "Remove from saved") : t("placement.save", "Save job")}
                          className={`-mr-1.5 -mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                            saved
                              ? 'text-[#045C9A] dark:text-[#A6D7E8]'
                              : 'text-slate-300 hover:bg-[#EAF7FD] hover:text-[#045C9A] dark:text-slate-500 dark:hover:bg-[#045C9A]/20 dark:hover:text-[#A6D7E8]'
                          }`}
                        >
                          {saved ? <BookmarkFilled className="h-[17px] w-[17px]" stroke={1.8} /> : <Bookmark className="h-[17px] w-[17px]" stroke={1.8} />}
                        </button>
                      </div>

                      {/* Header: logo + title + company */}
                      <div className="mt-3 flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white text-[14px] font-semibold text-[#045C9A] dark:border-[#045C9A]/30 dark:bg-[#072036] dark:text-[#A6D7E8]">
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
                            className="line-clamp-2 text-[15px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#072036] dark:text-white"
                          >
                            {job.displayTitle}
                          </h2>
                          <p className="mt-0.5 truncate text-[13px] leading-snug text-slate-500 dark:text-slate-400">
                            {job.displayCompany}
                          </p>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="mt-4 space-y-2 text-[13px] leading-tight text-slate-600 dark:text-slate-300">
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

                      {(closingSoon || eligibility || pathMatch) && (
                        <div className="mt-3.5 flex flex-wrap gap-1.5">
                          {closingSoon && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-[3px] text-[10.5px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                              <Clock className="h-3 w-3" stroke={2} />
                              {daysLeft === 0
                                ? t("placement.closes_today", "Closes today")
                                : t("placement.closes_in_days", { count: daysLeft, defaultValue: `Closes in ${daysLeft}d` })}
                            </span>
                          )}
                          {eligibility && (
                            <span
                              title={eligibility.checks.map((c) => `${c.label}: ${c.detail}`).join(" · ")}
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-[3px] text-[10.5px] font-semibold ${
                                eligibility.status === "yes"
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
                                  : eligibility.status === "no"
                                    ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400'
                                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300'
                              }`}
                            >
                              {eligibility.status === "yes" ? <CircleCheck className="h-3 w-3" stroke={2} /> : <AlertCircle className="h-3 w-3" stroke={2} />}
                              {eligibility.status === "yes"
                                ? t("placement.eligible", "You're eligible")
                                : eligibility.status === "no"
                                  ? t("placement.not_eligible", { label: eligibility.failed[0].label, defaultValue: `Below: ${eligibility.failed[0].label}` })
                                  : t("placement.eligibility_unknown", "Eligibility: complete your profile")}
                            </span>
                          )}
                          {pathMatch && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-[#045C9A]/20 bg-[#EAF7FD] px-2 py-[3px] text-[10.5px] font-semibold text-[#045C9A] dark:border-[#045C9A]/40 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]">
                              <TrendingUp className="h-3 w-3" stroke={2} />
                              {t("placement.path_match", { role: pathMatch, defaultValue: `Matches your path: ${pathMatch}` })}
                            </span>
                          )}
                        </div>
                      )}

                      {skills.length > 0 && (
                        <div className="mt-3.5 flex flex-wrap gap-1.5">
                          {skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="rounded-md bg-slate-100 px-2 py-[3px] text-[11.5px] font-medium text-slate-600 dark:bg-[#0d3a5f] dark:text-slate-300">
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
                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5 dark:border-[#045C9A]/20">
                        <p className="min-w-0 truncate text-[12px] text-slate-500 dark:text-slate-400">
                          {job.displayType && <span className="font-medium text-slate-600 dark:text-slate-300">{job.displayType}</span>}
                          {job.displayType && postedLabel && <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>}
                          {postedLabel && <span>{postedLabel}</span>}
                        </p>
                        <button
                          onClick={() => !isClosed && navigate(`/dashboard/placement/${job.sourceCollection}/${job._id}`, { state: { job } })}
                          disabled={isClosed}
                          className={
                            isClosed
                              ? "flex h-8 shrink-0 cursor-not-allowed items-center justify-center rounded-md bg-slate-100 px-3.5 text-[12.5px] font-medium text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                              : "group/btn flex h-8 shrink-0 items-center justify-center gap-1 rounded-md bg-[#0E2136] pl-3.5 pr-2.5 text-[12.5px] font-medium text-white outline-none transition-colors hover:bg-[#1b3457] focus-visible:ring-2 focus-visible:ring-[#045C9A]/40 focus-visible:ring-offset-2 active:scale-[0.98] dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white dark:focus-visible:ring-offset-[#0d3a5f]"
                          }
                        >
                          <span>{applyLabel}</span>
                          {!isClosed && (
                            <ChevronRight
                              className="h-3.5 w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5"
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
                  <div key={i} className="h-[236px] animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-[#045C9A]/25 dark:bg-[#0d3a5f]" />
                ))}
              </div>
            ) : appliedJobs.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-[#045C9A]/30 dark:bg-[#0d3a5f]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF7FD] dark:bg-[#045C9A]/15">
                  <Briefcase className="h-6 w-6 text-[#045C9A] dark:text-[#A6D7E8]" />
                </div>
                <h2 className="text-base font-semibold text-[#072036] dark:text-white">{t("placement.no_applications_found", "No applications found")}</h2>
                <p className="mt-1 max-w-md text-[13px] text-slate-500 dark:text-slate-400">{t("placement.no_applications_desc", "You haven't applied to any jobs yet.")}</p>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="mt-5 h-9 rounded-lg bg-[#0E2136] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1b3457] dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white"
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
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#045C9A] focus:ring-[3px] focus:ring-[#045C9A]/10 dark:border-[#045C9A]/30 dark:bg-[#0d3a5f] dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
              <div className="relative sm:w-[180px]">
                <select
                  value={companyTypeFilter}
                  onChange={(e) => setCompanyTypeFilter(e.target.value)}
                  className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pl-3.5 pr-9 text-[13px] font-medium text-[#072036] outline-none transition-colors hover:border-[#045C9A]/40 focus:border-[#045C9A] focus:ring-[3px] focus:ring-[#045C9A]/10 dark:border-[#045C9A]/30 dark:bg-[#0d3a5f] dark:text-white"
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
                  <div key={i} className="h-[232px] animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-[#045C9A]/25 dark:bg-[#0d3a5f]" />
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-[#045C9A]/30 dark:bg-[#0d3a5f]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF7FD] dark:bg-[#045C9A]/15">
                  <Building className="h-6 w-6 text-[#045C9A] dark:text-[#A6D7E8]" stroke={1.6} />
                </div>
                <h2 className="text-base font-semibold text-[#072036] dark:text-white">{t("placement.no_partners_found", "No partners found")}</h2>
                <p className="mt-1 max-w-md text-[13px] text-slate-500 dark:text-slate-400">{t("placement.no_partners_desc", "Try adjusting your filters or search query.")}</p>
                {(companySearch || companyTypeFilter !== 'all') && (
                  <button
                    onClick={() => { setCompanySearch(""); setCompanyTypeFilter("all"); }}
                    className="mt-5 h-9 rounded-lg bg-[#0E2136] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1b3457] dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white"
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
                      className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-[#045C9A]/35 hover:shadow-[0_4px_20px_-4px_rgba(13,31,78,0.14)] dark:border-[#045C9A]/25 dark:bg-[#0d3a5f] dark:hover:border-[#045C9A]/60"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-[#045C9A] dark:border-[#045C9A]/25 dark:bg-[#0d3a5f] dark:text-[#A6D7E8]">
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
                          <h3 className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em] text-[#072036] dark:text-white" title={partner.name}>
                            {partner.name}
                          </h3>
                          <span className={`mt-1.5 inline-flex rounded-md px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.05em] ${
                            isSmaart
                              ? 'bg-[#072036] text-white dark:bg-[#045C9A] dark:text-white'
                              : 'bg-[#EAF7FD] text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]'
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
                          className="mt-3.5 flex items-center gap-1.5 text-[12.5px] font-medium text-[#045C9A] transition-colors hover:underline dark:text-[#A6D7E8]"
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
                          onClick={() => setSelectedPartner(partner)}
                          className="flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-slate-200 text-[13px] font-medium text-[#072036] transition-colors hover:border-[#045C9A]/40 hover:bg-[#EAF7FD] dark:border-[#045C9A]/30 dark:text-slate-200 dark:hover:bg-[#0d3a5f]"
                        >
                          {t("placement.view_profile", "View profile")}
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
                  <div key={index} className="h-[268px] animate-pulse rounded-xl border border-slate-200 bg-slate-50 dark:border-[#045C9A]/25 dark:bg-[#0d3a5f]" />
                ))}
              </div>
            ) : jobFairs.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-[#045C9A]/30 dark:bg-[#0d3a5f]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF7FD] dark:bg-[#045C9A]/15">
                  <Briefcase className="h-6 w-6 text-[#045C9A] dark:text-[#A6D7E8]" />
                </div>
                <h2 className="text-base font-semibold text-[#072036] dark:text-white">{t("placement.no_fairs_found", "No Job Fairs found")}</h2>
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
                  const countdown = getFairCountdown(fair.startDate, fair.endDate, t);

                  return (
                    <motion.article
                      key={fair._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className="relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:border-[#045C9A]/35 hover:shadow-[0_4px_20px_-4px_rgba(13,31,78,0.14)] dark:border-[#045C9A]/25 dark:bg-[#0d3a5f] dark:hover:border-[#045C9A]/60"
                    >
                      {bannerImageUrl && (
                        <div className="h-32 w-full overflow-hidden border-b border-slate-100 dark:border-[#045C9A]/20">
                          <img src={bannerImageUrl} alt={fair.title} className="h-full w-full object-cover" />
                        </div>
                      )}

                      <div className="flex flex-1 flex-col p-5">
                        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-md px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.05em] ${
                            fair.label === 'smaart job fair'
                              ? 'bg-[#072036] text-white dark:bg-[#045C9A] dark:text-white'
                              : 'bg-[#EAF7FD] text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]'
                          }`}>
                            {fair.label === 'smaart job fair' ? t("placement.source_smaart_job_fair", "SMAART Job Fair") : t("placement.source_college_job_fair", "College Job Fair")}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[10.5px] font-medium ${
                            fair.status === 'active'
                              ? 'border-[#045C9A]/20 bg-white text-[#045C9A] dark:border-[#045C9A]/50 dark:bg-transparent dark:text-[#A6D7E8]'
                              : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${fair.status === 'active' ? 'bg-[#045C9A] dark:bg-[#A6D7E8]' : 'bg-slate-400'}`} />
                            {formatStatus(fair.status, t)}
                          </span>
                        </div>

                        <h2 className="line-clamp-2 text-[15px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#072036] dark:text-white">{fair.title}</h2>
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
                          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4 text-[12.5px] text-slate-500 dark:border-[#045C9A]/20 dark:text-slate-400">
                            <Briefcase className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                            <span>
                              {t("placement.fair_jobs_count", { count: fairJobs.length, defaultValue: `${fairJobs.length} ${fairJobs.length === 1 ? 'role' : 'roles'} posted` })}
                            </span>
                          </div>
                        )}
                        {/* Countdown + registration state on the left; calendar,
                            fair pass and the primary action on the right. Roles and
                            registration themselves live on the fair page. */}
                        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                          {countdown && (
                            <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] font-semibold ${
                              countdown.tone === "live"
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : countdown.tone === "soon"
                                  ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
                                  : countdown.tone === "past"
                                    ? 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400'
                                    : 'border-[#045C9A]/20 bg-[#EAF7FD] text-[#045C9A] dark:border-[#045C9A]/40 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]'
                            }`}>
                              <Clock className="h-3 w-3" stroke={2} />
                              {countdown.label}
                            </span>
                          )}
                          {isRegistered && (
                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#045C9A]/20 bg-[#EAF7FD] px-2 py-1 text-[10.5px] font-medium text-[#045C9A] dark:border-[#045C9A]/50 dark:bg-[#045C9A]/25 dark:text-[#A6D7E8]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#045C9A] dark:bg-[#A6D7E8]" />
                              {t("placement.registered", "Registered")}
                            </span>
                          )}
                          <div className="ml-auto flex items-center gap-1.5">
                            {countdown?.tone !== "past" && (
                              <button
                                type="button"
                                onClick={() => downloadFairIcs(fair)}
                                title={t("placement.add_to_calendar", "Add to calendar")}
                                aria-label={t("placement.add_to_calendar", "Add to calendar")}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d7ebf5] bg-white text-[#045C9A] transition-colors hover:bg-[#EAF7FD] dark:border-[#045C9A]/30 dark:bg-transparent dark:text-[#A6D7E8] dark:hover:bg-[#045C9A]/20"
                              >
                                <CalendarPlus className="h-4 w-4" stroke={1.8} />
                              </button>
                            )}
                            {isRegistered && (
                              <button
                                type="button"
                                onClick={() => navigate(`/dashboard/placement/job-fair/${fair._id}`)}
                                title={t("placement.view_pass", "View digital fair pass")}
                                aria-label={t("placement.view_pass", "View digital fair pass")}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#d7ebf5] bg-white text-[#045C9A] transition-colors hover:bg-[#EAF7FD] dark:border-[#045C9A]/30 dark:bg-transparent dark:text-[#A6D7E8] dark:hover:bg-[#045C9A]/20"
                              >
                                <Ticket className="h-4 w-4" stroke={1.8} />
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/dashboard/placement/job-fair/${fair._id}`)}
                              className="group/btn flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0E2136] px-4 text-[13px] font-medium text-white outline-none transition-colors hover:bg-[#1b3457] focus-visible:ring-2 focus-visible:ring-[#045C9A]/40 focus-visible:ring-offset-2 active:scale-[0.98] dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white"
                            >
                              <span>{t("placement.view_fair", "View Fair")}</span>
                              <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" stroke={2.2} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Application timeline drawer ─────────────────────────────── */}
        {timelineApp &&
          createPortal(
            <div className="fixed inset-0 z-[100] flex justify-end bg-[#072036]/40 backdrop-blur-sm" onClick={() => setTimelineApp(null)}>
              <motion.aside
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                onClick={(e) => e.stopPropagation()}
                className="flex h-full w-full max-w-md flex-col overflow-hidden border-l border-[#d7ebf5] bg-white shadow-2xl dark:border-[#045C9A]/30 dark:bg-[#0d3a5f]"
              >
                {(() => {
                  const app = timelineApp;
                  const title = app.jobTitle || app.job?.displayTitle || t("placement.role", "Role");
                  const company = app.companyName || app.job?.displayCompany || t("placement.company", "Company");
                  const points = buildStatusTimeline(app);
                  const usingFallback = points.some((p) => p.synthesized) || !(Array.isArray(app.statusHistory) && app.statusHistory.length > 0);
                  return (
                    <>
                      <div className="flex items-start justify-between gap-3 border-b border-[#d7ebf5] p-5 dark:border-[#045C9A]/20">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d7ebf5] bg-[#EAF7FD] text-[#045C9A] dark:border-[#045C9A]/30 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]">
                            <History className="h-5 w-5" stroke={1.8} />
                          </div>
                          <div className="min-w-0">
                            <h2 className="text-[15px] font-bold text-[#072036] dark:text-white">{t("placement.application_timeline", "Application timeline")}</h2>
                            <p className="truncate text-[12.5px] text-slate-500 dark:text-slate-400">{title} · {company}</p>
                          </div>
                        </div>
                        <button onClick={() => setTimelineApp(null)} aria-label={t("placement.close", "Close")} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#072036]">
                          <X className="h-5 w-5" stroke={2} />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-5">
                        <ol className="relative ml-2 border-l-2 border-[#d7ebf5] dark:border-[#045C9A]/30">
                          {points.map((p, i) => {
                            const isLast = i === points.length - 1;
                            const bucket = statusBucket(p.status);
                            const dot = bucket === "offer" ? 'bg-emerald-500' : bucket === "rejected" ? 'bg-rose-500' : bucket === "interview" ? 'bg-amber-500' : 'bg-[#045C9A] dark:bg-[#A6D7E8]';
                            return (
                              <li key={`${p.status}-${i}`} className="relative mb-6 pl-6 last:mb-0">
                                <span className={`absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-[#0d3a5f] ${dot}`}>
                                  {isLast && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </span>
                                <p className={`text-[13.5px] font-semibold ${isLast ? getStatusTextColor(p.status) : 'text-[#072036] dark:text-white'}`}>{formatStatus(p.status, t)}</p>
                                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                                  {p.changedAt
                                    ? new Date(p.changedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
                                    : t("placement.date_unknown", "Date not recorded")}
                                </p>
                                {p.note && (
                                  <p className="mt-1.5 rounded-lg border border-[#d7ebf5] bg-[#F1F5F9] px-3 py-2 text-[12.5px] leading-relaxed text-slate-600 dark:border-white/10 dark:bg-[#072036] dark:text-slate-300">{p.note}</p>
                                )}
                              </li>
                            );
                          })}
                        </ol>
                        {usingFallback && (
                          <p className="mt-6 rounded-xl border border-[#d7ebf5] bg-[#EAF7FD] p-3 text-[12px] leading-relaxed text-[#045C9A] dark:border-[#045C9A]/30 dark:bg-[#045C9A]/10 dark:text-[#A6D7E8]">
                            {t("placement.timeline_fallback", "Stage-by-stage history is recorded from your next status change onward. Until then this shows when you applied and the current stage.")}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 border-t border-[#d7ebf5] p-4 dark:border-[#045C9A]/20">
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(app)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d7ebf5] bg-white px-3.5 text-[13px] font-medium text-[#045C9A] transition-colors hover:bg-[#EAF7FD] dark:border-[#045C9A]/30 dark:bg-transparent dark:text-[#A6D7E8] dark:hover:bg-[#045C9A]/20"
                        >
                          <Download className="h-4 w-4" stroke={1.8} />
                          {t("placement.receipt_short", "Receipt")}
                        </button>
                        {!app.jobRemoved && (
                          <button
                            type="button"
                            onClick={() => { setTimelineApp(null); openApplicationJob(app); }}
                            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0E2136] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1b3457] dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white"
                          >
                            {t("placement.view_role", "View role")}
                            <ChevronRight className="h-4 w-4" stroke={2} />
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </motion.aside>
            </div>,
            document.body
          )}

        {/* ── Partner profile drawer ─────────────────────────────────── */}
        {selectedPartner &&
          createPortal(
            <div className="fixed inset-0 z-[100] flex justify-end bg-[#072036]/40 backdrop-blur-sm" onClick={() => setSelectedPartner(null)}>
              <motion.aside
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                onClick={(e) => e.stopPropagation()}
                className="flex h-full w-full max-w-md flex-col overflow-hidden border-l border-[#d7ebf5] bg-white shadow-2xl dark:border-[#045C9A]/30 dark:bg-[#0d3a5f]"
              >
                {(() => {
                  const partner = selectedPartner;
                  const isSmaart = partner.partnerType === 'smaart';
                  const initial = (partner.name || "C").trim().charAt(0).toUpperCase();
                  const logo = partner.logo
                    ? (partner.logo.startsWith('http') || partner.logo.startsWith('data:') ? partner.logo : `${getBackendUrl()}/${partner.logo.replace(/^\/+/, '')}`)
                    : null;
                  const website = partner.website ? (partner.website.startsWith('http') ? partner.website : `https://${partner.website}`) : null;
                  const key = normalizeText(partner.name);
                  const openRoles = jobs.filter((j) => key && normalizeText(j.displayCompany) === key && !String(j.displayStatus || '').toLowerCase().includes('closed'));
                  return (
                    <>
                      <div className="flex items-start justify-between gap-3 border-b border-[#d7ebf5] p-5 dark:border-[#045C9A]/20">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d7ebf5] bg-[#EAF7FD] text-base font-semibold text-[#045C9A] dark:border-[#045C9A]/30 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]">
                            {logo ? <img src={logo} alt="" className="h-full w-full object-contain p-2" /> : <span>{initial}</span>}
                          </div>
                          <div className="min-w-0">
                            <h2 className="truncate text-[16px] font-bold text-[#072036] dark:text-white">{partner.name}</h2>
                            <span className={`mt-1 inline-flex rounded-md px-2 py-[3px] text-[10.5px] font-semibold uppercase tracking-[0.05em] ${isSmaart ? 'bg-[#072036] text-white dark:bg-[#045C9A]' : 'bg-[#EAF7FD] text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]'}`}>
                              {isSmaart ? t("placement.smaart_partner", "SMAART Partner") : t("placement.college_partner", "College Partner")}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => setSelectedPartner(null)} aria-label={t("placement.close", "Close")} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#072036]">
                          <X className="h-5 w-5" stroke={2} />
                        </button>
                      </div>

                      <div className="flex-1 space-y-5 overflow-y-auto p-5">
                        {website && (
                          <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#045C9A] hover:underline dark:text-[#A6D7E8]">
                            <ExternalLink className="h-4 w-4" stroke={1.8} />
                            {website.replace(/^https?:\/\//i, '')}
                          </a>
                        )}

                        <div>
                          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("placement.about_company", "About the Company")}</p>
                          <p className="rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] p-3.5 text-[13px] leading-relaxed text-slate-600 dark:border-white/10 dark:bg-[#072036] dark:text-slate-300">
                            {partner.description || t("placement.no_company_info", "Company information has not been added yet.")}
                          </p>
                        </div>

                        <div>
                          <p className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            {t("placement.open_roles_count", { count: openRoles.length, defaultValue: `Open roles (${openRoles.length})` })}
                          </p>
                          {openRoles.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-[12.5px] text-slate-500 dark:border-[#045C9A]/30 dark:text-slate-400">
                              {t("placement.no_open_roles", "No open roles from this company right now.")}
                            </p>
                          ) : (
                            <ul className="overflow-hidden rounded-xl border border-[#d7ebf5] dark:border-white/10">
                              {openRoles.map((job, i) => (
                                <li key={`${job.sourceCollection}-${job._id}`}>
                                  <button
                                    type="button"
                                    onClick={() => { setSelectedPartner(null); navigate(`/dashboard/placement/${job.sourceCollection}/${job._id}`, { state: { job } }); }}
                                    className={`group flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[#F1F5F9] dark:hover:bg-white/5 ${i !== openRoles.length - 1 ? 'border-b border-[#d7ebf5] dark:border-white/10' : ''}`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-[13.5px] font-semibold text-[#072036] dark:text-white">{job.displayTitle}</p>
                                      <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">
                                        {job.displayType}{job.displayLocation ? ` · ${job.displayLocation}` : ''}{job.displayDeadline ? ` · ${t("placement.apply_by", "Apply by")} ${formatDate(job.displayDeadline, t)}` : ''}
                                      </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0 text-[#045C9A] transition-transform group-hover:translate-x-0.5 dark:text-[#A6D7E8]" stroke={2} />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </motion.aside>
            </div>,
            document.body
          )}

        {confirmOpen &&
          createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#045C9A]/30 dark:bg-[#0d3a5f]">
                <h2 className="mb-2 text-[16px] font-semibold tracking-[-0.01em] text-[#072036] dark:text-white">{t("placement.confirm_withdraw_title", "Withdraw Application?")}</h2>
                <p className="mb-6 text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {t("placement.confirm_withdraw_desc", "Are you sure you want to withdraw your application for")} <span className="font-medium text-slate-700 dark:text-slate-200">{confirmAppTitle}</span>? {t("placement.confirm_withdraw_warning", "This action cannot be undone.")}
                </p>
                <div className="flex justify-end gap-2.5">
                  <button onClick={closeConfirm} className="h-9 rounded-lg border border-slate-200 px-4 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-[#045C9A]/30 dark:text-slate-300 dark:hover:bg-[#0d3a5f]">
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
    </PageTransition>
  );
};

export default Placement;
