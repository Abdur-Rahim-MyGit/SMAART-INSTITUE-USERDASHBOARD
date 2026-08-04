import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  IconArrowLeft as ArrowLeft,
  IconBriefcase as Briefcase,
  IconBuilding as Building,
  IconCalendarDue as CalendarDue,
  IconClock as Clock,
  IconExternalLink as ExternalLink,
  IconX as XIcon,
  IconUpload as UploadIcon,
  IconMapPin as MapPin,
  IconTag as Tag,
  IconCertificate as Certificate,
  IconSchool as School,
  IconBook as Book,
  IconShieldCheck as ShieldCheck,
  IconStar as Star,
  IconCheckbox as Checkbox,
  IconGitBranch as GitBranch,
  IconWand as Wand,
  IconX as X,
  IconFileDescription as FileDescription
} from "@tabler/icons-react";
import { getBackendUrl, placementsAPI } from "@/services/api";
import { usersAPI } from "@/services/api";
import ResumeBuilder from '@/pages/AICareerCoach/ResumeBuilder';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const formatValue = (value, t) => {
  if (value === null || value === undefined || value === "") return t("placement.not_listed", "Not listed");
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || t("placement.not_listed", "Not listed");
  if (typeof value === "object") return value.name || value.title || value.companyName || value.fullName || t("placement.available", "Available");
  const str = String(value);
  if (str.toLowerCase() === "remote") return t("placement.remote", "Remote");
  return str;
};

const getCompanyLogo = (job) => {
  const logo = job?.displayCompanyLogo || job?.companyLogo || job?.logo || job?.logoUrl || job?.companyLogoUrl || job?.employerLogo || job?.organisationLogo || null;
  if (!logo || typeof logo !== "string") return null;
  if (/^(https?:|data:|blob:)/i.test(logo)) return logo;
  return `${getBackendUrl()}/${logo.replace(/^\/+/, "")}`;
};

const getDescription = (job, t) => {
  const value = job?.description || job?.jobDescription || job?.summary || job?.aboutRole || job?.requirements;
  if (!value) return t("placement.no_description", "No detailed job description has been added yet.");
  if (Array.isArray(value)) return value.join("\n");
  return String(value);
};

const getSkills = (job) => {
  const raw = job?.skills || job?.eligibility?.skills || job?.requiredSkills || job?.skillSet || job?.technologies || [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") return raw.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
};

const getDocumentUrl = (job) => {
  const doc = job?.jdDocument || job?.document || job?.attachmentUrl || job?.jdUrl || null;
  if (!doc || typeof doc !== "string") return null;
  if (/^(https?:|data:|blob:)/i.test(doc)) return doc;
  return `${getBackendUrl()}/${doc.replace(/^\/+/, "")}`;
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

/**
 * Returns a LinkedIn-style "Posted X ago" label.
 * Purely client-side calculation from the existing createdAt timestamp.
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
  if (days < 7) return t("placement.posted_days_ago", { count: days, defaultValue: "Posted {{count}} days ago" });
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return t("placement.posted_week_ago", "Posted 1 week ago");
  if (weeks < 5) return t("placement.posted_weeks_ago", { count: weeks, defaultValue: "Posted {{count}} weeks ago" });
  const months = Math.floor(days / 30);
  if (months === 1) return t("placement.posted_month_ago", "Posted 1 month ago");
  return t("placement.posted_months_ago", { count: months, defaultValue: "Posted {{count}} months ago" });
};

const PlacementDetail = () => {
  const { t } = useTranslation();
  const { source, id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState(location.state?.job || null);
  const [loading, setLoading] = useState(!location.state?.job);
  const [applyOpen, setApplyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [buildResumeOpen, setBuildResumeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(() => {
    try {
      const key = `applied:${source}:${id}`;
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (Date.now() - (parsed.ts || 0) < 24 * 60 * 60 * 1000)) {
          return true;
        }
      }
    } catch (_) {}
    return false;
  });
  const [applicationId, setApplicationId] = useState(() => {
    try {
      const key = `applied:${source}:${id}`;
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (Date.now() - (parsed.ts || 0) < 24 * 60 * 60 * 1000)) {
          return parsed.applicationId || null;
        }
      }
    } catch (_) {}
    return null;
  });
  const [applicationData, setApplicationData] = useState(null);
  const [withdrewConfirmOpen, setWithdrewConfirmOpen] = useState(false);
  const [withdrewPending, setWithdrewPending] = useState(false);
  const [isBacklogReadOnly, setIsBacklogReadOnly] = useState(false);
  
  const [eSignature, setESignature] = useState('');
  const [offerPending, setOfferPending] = useState(false);
  
  const handleOfferResponse = async (responseStatus) => {
    if (responseStatus === 'Accepted' && !eSignature.trim()) {
      toast({
        title: t("placement.signature_required", "Signature Required"),
        description: t("placement.signature_desc", "Please type your full name to accept the offer."),
        variant: "destructive"
      });
      return;
    }
    try {
      setOfferPending(true);
      const res = await placementsAPI.api.post(`/placements/applications/${applicationId}/respond-offer`, {
        status: responseStatus,
        eSignature
      });
      if (res.data.success) {
        toast({
          title: responseStatus === 'Accepted' ? t("placement.offer_accepted", "Offer Accepted!") : t("placement.offer_declined", "Offer Declined"),
          description: responseStatus === 'Accepted' ? t("placement.offer_accepted_desc", "Congratulations on your new job!") : t("placement.offer_declined_desc", "You have declined the offer.")
        });
        setApplicationData(prev => ({ ...prev, status: responseStatus }));
      }
    } catch (err) {
       toast({ 
         title: "Error", 
         description: err.response?.data?.error || "Failed to respond to offer", 
         variant: "destructive" 
       });
    } finally {
      setOfferPending(false);
    }
  };

  const [applicationForm, setApplicationForm] = useState(() => {
    let user = {};
    try {
      user = JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      user = {};
    }

    return {
      fullName: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email || "",
      mobile: user.mobile || user.phone || "",
      resumeFile: null,
      resumeUrl: null,
      coverLetter: "",
      activeBacklog: "",
    };
  });

  useEffect(() => {
    let active = true;

    const loadJobAndStatus = async () => {
      const needsFullLoad = !job || job._id !== id || job.sourceCollection !== source;
      if (needsFullLoad) {
        setLoading(true);
      }

      try {
        const [jobResp, appliedResp] = await Promise.allSettled([
          placementsAPI.getJob(source, id),
          placementsAPI.hasApplied(source, id)
        ]);

        if (!active) return;

        // 1. Handle Job Response
        if (jobResp.status === 'fulfilled') {
          setJob(jobResp.value?.data || null);
        } else {
          console.error("Failed to load job details:", jobResp.reason);
          if (needsFullLoad) {
            toast({
              title: t("placement.error_load_job_title", "Could not load job"),
              description: jobResp.reason?.message || t("placement.error_load_job_desc", "Please try again in a moment."),
              variant: "destructive",
            });
          }
        }

        // 2. Handle Applied Status Response
        if (appliedResp.status === 'fulfilled') {
          const applied = appliedResp.value;
          try { if (process.env.NODE_ENV !== 'production') console.debug('hasApplied response:', applied); } catch (_) {}

          let apps = [];
          if (!applied) apps = [];
          else if (Array.isArray(applied)) apps = applied;
          else if (applied.success && Array.isArray(applied.data)) apps = applied.data;
          else if (applied.data && Array.isArray(applied.data)) apps = applied.data;
          else if (applied.data && !Array.isArray(applied.data) && typeof applied.data === 'object') apps = [applied.data];

          if (apps.length > 0) {
            setHasApplied(true);
            setApplicationData(apps[0]);
            const possibleId = apps[0]._id || apps[0].id || null;
            setApplicationId(possibleId);
            
            // Keep local storage cache in sync
            try {
              const key = `applied:${source}:${id}`;
              sessionStorage.setItem(key, JSON.stringify({ applicationId: possibleId, ts: Date.now() }));
            } catch (_) {}
          } else {
            // No application found on the server
            setHasApplied(false);
            setApplicationId(null);
            
            // Clear local storage cache since the server says they haven't applied
            try {
              const key = `applied:${source}:${id}`;
              sessionStorage.removeItem(key);
            } catch (_) {}
          }
        } else {
          console.warn('hasApplied check failed on server:', appliedResp.reason);
          // If server check fails (network error, timeout, server select issue),
          // DO NOT reset hasApplied to false! Trust our local storage state.
          try {
            const key = `applied:${source}:${id}`;
            const raw = sessionStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && (Date.now() - (parsed.ts || 0) < 24 * 60 * 60 * 1000)) {
                setHasApplied(true);
                setApplicationId(parsed.applicationId || null);
              }
            }
          } catch (_) {}
        }
      } catch (error) {
        console.error("General error in loadJobAndStatus:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadJobAndStatus();

    return () => {
      active = false;
    };
  }, [id, source, t]);

  const details = useMemo(() => {
    if (!job) return [];
    const postedAgo = getPostedAgo(job.displayCreatedAt || job.createdAt, t);
    // Publisher vs host college are different things and must not be conflated.
    // When a recruiter published the role we name them; otherwise the college
    // placement office did. The owning college is shown on its own row, labelled
    // "Host College" — calling it "Posted By" credited SRM for a role that
    // Google's recruiter posted into SRM's fair.
    const viaRecruiter = job.displayPostedByType === 'recruiter';
    const poster = job.displayPostedBy;
    const posterIsCompany = poster && poster.trim().toLowerCase() === (job.displayCompany || '').trim().toLowerCase();
    const postedByValue = poster && !posterIsCompany
      ? poster
      : (viaRecruiter ? t("placement.posted_via_smaart", "SMAART Recruiter") : t("placement.posted_via_college", "College Placement Office"));

    // Only worth its own row when it is not already the publisher.
    const hostCollege = job.displayHostCollege;
    const showHostCollege = hostCollege && (viaRecruiter || hostCollege !== poster);

    return [
      { label: t("placement.label_company", "Company"), value: job.displayCompany, icon: Building },
      { label: t("placement.label_posted_by", "Posted By"), value: postedByValue, icon: viaRecruiter ? Briefcase : School },
      ...(job.displayJobFairTitle
        ? [{ label: t("placement.label_job_fair", "Job Fair"), value: job.displayJobFairTitle, icon: Briefcase }]
        : []),
      ...(showHostCollege
        ? [{ label: t("placement.label_host_college", "Host College"), value: hostCollege, icon: School }]
        : []),
      { label: t("placement.label_location", "Location"), value: job.displayLocation, icon: MapPin },
      ...(postedAgo ? [{ label: t("placement.label_posted", "Posted"), value: postedAgo, icon: Clock }] : []),
      { label: t("placement.label_job_type", "Job Type"), value: job.displayType, icon: Briefcase },
      { label: t("placement.label_deadline", "Deadline"), value: job.displayDeadline ? formatDate(job.displayDeadline, t) : t("placement.no_deadline_short", "No closing date set"), icon: CalendarDue },
      { label: t("placement.label_package", "Package"), value: job.displaySalary || job.salaryPackage || job.ctc || job.package, icon: Tag },
      { label: t("placement.label_work_mode", "Work Mode"), value: job.workMode, icon: Briefcase },
      ...(job.experience ? [{ label: t("placement.label_experience", "Experience"), value: job.experience, icon: Star }] : []),
    ];
  }, [job, t]);

  const eligibility = useMemo(() => {
    if (!job || !job.eligibility) return null;
    const e = job.eligibility;
    const list = [];
    if (e.minCGPA > 0) list.push({ label: t("placement.label_min_cgpa", "Minimum CGPA"), value: e.minCGPA, icon: Certificate });
    if (e.noBacklog) list.push({ label: t("placement.label_no_backlog", "Backlogs"), value: t("placement.no_active_backlogs", "No Active Backlogs"), icon: ShieldCheck });
    if (e.hasMin12th && e.min12thPercentage > 0) list.push({ label: t("placement.label_12th_criteria", "12th Criteria"), value: `Min ${e.min12thPercentage}%`, icon: School });
    if (e.hasMin10th && e.min10thPercentage > 0) list.push({ label: t("placement.label_10th_criteria", "10th Criteria"), value: `Min ${e.min10thPercentage}%`, icon: School });
    if (e.allowedDegrees && e.allowedDegrees.length > 0) list.push({ label: t("placement.label_qualifications", "Qualifications"), value: e.allowedDegrees.join(", "), icon: Book, fullWidth: true });
    if (e.allowedBranches && e.allowedBranches.length > 0) list.push({ label: t("placement.label_branches", "Branches"), value: e.allowedBranches.join(", "), icon: GitBranch, fullWidth: true });
    
    return list.length > 0 ? list : null;
  }, [job, t]);

  const updateApplicationField = (field, value) => {
    setApplicationForm((prev) => ({ ...prev, [field]: value }));
  };

  // When the Apply modal opens, fetch the latest profile to prefill mobile
  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (!applyOpen) return;
      try {
        const response = await usersAPI.getProfile();
        if (!mounted) return;
        // /auth/me returns { success: true, user, registration }
        if (response && response.success) {
          const user = response.user || {};
          const registration = response.registration || {};
          // Prefer user.mobile, fallback to registration.mobileNumber or user.phone
          const mobileFromUser = user.mobile || user.phone || user.mobileNumber;
          const mobileFromReg = registration.mobileNumber || registration.mobile;
          const mobile = mobileFromUser || mobileFromReg;
          if (mobile) updateApplicationField('mobile', mobile);
          
          let backlogsCount = null;
          if (Array.isArray(user.activeArrears)) {
              backlogsCount = user.activeArrears.length;
          } else if (user.academic?.activeBacklogs !== undefined && user.academic?.activeBacklogs !== null) {
              backlogsCount = Number(user.academic.activeBacklogs);
          } else if (user.activeBacklogs !== undefined && user.activeBacklogs !== null) {
              backlogsCount = Number(user.activeBacklogs);
          } else if (registration.academic?.activeBacklogs !== undefined && registration.academic?.activeBacklogs !== null) {
              backlogsCount = Number(registration.academic.activeBacklogs);
          }

          if (backlogsCount !== null && !isNaN(backlogsCount)) {
              updateApplicationField('activeBacklog', backlogsCount);
              setIsBacklogReadOnly(true);
          }
        }
      } catch (err) {
        // Silent fail — keep existing value from session storage
        console.warn('Failed to load profile for application modal:', err?.message || err);
      }
    };

    loadProfile();
    return () => { mounted = false; };
  }, [applyOpen]);

  if (loading) {
    return (
      <div className="mx-auto mt-8 max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="h-[520px] animate-pulse rounded-2xl border border-slate-200 bg-slate-50 dark:border-[#1a3884]/25 dark:bg-[#001630]" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto mt-8 max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-[#d8e6f7] bg-white p-8 text-center shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f8ff] dark:bg-[#1a3884]/15">
            <Briefcase className="h-6 w-6 text-[#1a3884] dark:text-blue-300" stroke={1.7} />
          </div>
          <h1 className="text-base font-semibold text-[#0d1f4e] dark:text-white">{t("placement.job_not_found", "Job not found")}</h1>
          <p className="mt-1 max-w-md text-[13px] text-slate-500 dark:text-slate-400">
            {t("placement.job_not_found_desc", "This posting may have been closed or removed.")}
          </p>
          <button
            onClick={() => navigate("/dashboard/placement")}
            className="mt-5 h-9 rounded-lg bg-[#0d1f4e] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#1a3884]"
          >
            {t("placement.back_to_placement", "Back to Placement")}
          </button>
        </div>
      </div>
    );
  }

  const companyLogo = getCompanyLogo(job);
  const companyInitial = (job.displayCompany || "C").trim().charAt(0).toUpperCase();
  const skills = getSkills(job);
  const documentUrl = getDocumentUrl(job);
  const applyUrl = job.displayApplyUrl;
  const fallbackCompanyDesc = (job.displayCompany && job.displayCompany !== 'Company not listed')
    ? `${job.displayCompany} is an active corporate hiring partner participating in this campus placement drive.`
    : null;
  const companyAbout = job.displayCompanyAbout || job.aboutCompany || job.companyAbout || job.about || fallbackCompanyDesc;
  const companyWebsite = job.displayCompanyWebsite || job.companyWebsite || job.website;
  const statusLabel = formatStatus(job.displayStatus || job.status, t);
  const isSmaartSource = job.displaySource
    ? job.displaySource === 'smaart'
    : job.sourceCollection === 'smaartjobpostings';
  const missedMustHaves = Array.isArray(job.missedMustHaves) ? job.missedMustHaves : [];
  const hasSkillGap = missedMustHaves.length > 0;



  const handleApplicationSubmit = (event) => {
    event.preventDefault();
    setTermsOpen(true);
  };

  const executeApplicationSubmit = async () => {
    setTermsOpen(false);
    setSubmitting(true);
    try {
      let applyResp = null;
      // If a resume file is attached, submit as FormData so backend can receive the file
      if (applicationForm.resumeFile instanceof File) {
        const formData = new FormData();
        formData.append('fullName', applicationForm.fullName || '');
        formData.append('email', applicationForm.email || '');
        formData.append('mobile', applicationForm.mobile || '');
        formData.append('coverLetter', applicationForm.coverLetter || '');
        formData.append('resume', applicationForm.resumeFile);
        if (applicationForm.activeBacklog !== undefined && applicationForm.activeBacklog !== null && applicationForm.activeBacklog !== "") {
          formData.append('activeBacklog', applicationForm.activeBacklog);
        }
        applyResp = await placementsAPI.applyJob(source, id, formData);
      } else {
        // Remove any file property before sending JSON
        const payload = { ...applicationForm };
        delete payload.resumeFile;
        applyResp = await placementsAPI.applyJob(source, id, payload);
      }
      // Try to capture application id from apply response, or poll the list endpoint as confirmation.
      try {
        let possibleId = null;
        if (applyResp) {
          // Common shapes: { success:true, data: {...} } OR { success:true, data: [...] } OR direct object
          possibleId = applyResp._id || applyResp.id || (applyResp.data && (applyResp.data._id || applyResp.data.id)) || (applyResp.data && Array.isArray(applyResp.data) && applyResp.data[0] && (applyResp.data[0]._id || applyResp.data[0].id));
        }

        // If apply response didn't include id, poll the list endpoint a few times to allow for any slight propagation delay
        if (!possibleId) {
          const maxAttempts = 3;
          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
              const list = await placementsAPI.listApplications({ job: id, jobSource: source });
              const apps = list && list.success && Array.isArray(list.data) ? list.data : (Array.isArray(list) ? list : []);
              if (apps.length > 0) {
                possibleId = apps[0]._id || apps[0].id || null;
                break;
              }
            } catch (_) {
              // ignore individual list errors
            }
            // small backoff
            await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
          }
        }

        if (possibleId) {
          setHasApplied(true);
          setApplicationId(possibleId);
          try {
            const key = `applied:${source}:${id}`;
            sessionStorage.setItem(key, JSON.stringify({ applicationId: possibleId, ts: Date.now() }));
          } catch (_) {}
        } else {
          // As a last resort, set applied true locally (optimistic) and set a fallback marker so reloads keep the state
          setHasApplied(true);
          try {
            const key = `applied:${source}:${id}`;
            sessionStorage.setItem(key, JSON.stringify({ applicationId: null, ts: Date.now() }));
          } catch (_) {}
        }
      } catch (e) {
        console.warn('Error while finalizing application state:', e?.message || e);
      }
      toast({
        title: t("placement.success_submit_title", "Application submitted"),
        description: t("placement.success_submit_desc", { title: job.displayTitle, defaultValue: "Your application for {{title}} has been sent." }),
      });
      setApplyOpen(false);
    } catch (error) {
      toast({
        title: t("placement.error_submit_title", "Could not submit application"),
        description: error.message || t("placement.error_submit_desc", "Please try again in a moment."),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="mt-8 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="flex items-center mt-6 mb-5">
          <button
            onClick={() => navigate("/dashboard/placement")}
            className="group flex items-center gap-3 w-fit selection:bg-transparent"
          >
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:shadow-md group-hover:border-slate-350 dark:group-hover:border-slate-600 transition-all duration-300">
              <ArrowLeft stroke={2.5} className="h-4 w-4 text-[#112b6b] dark:text-slate-300 group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[#112b6b] dark:text-blue-400 text-xs font-extrabold uppercase tracking-[0.15em] transition-colors group-hover:text-[#1a3884] dark:group-hover:text-blue-300">
              {t("placement.back_to_placement", "Back to Placement")}
            </span>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630]"
        >
          <div className="border-b border-[#d8e6f7] p-6 dark:border-[#1a3884]/20">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-lg font-semibold text-[#1a3884] dark:border-[#1a3884]/25 dark:bg-[#001a3d] dark:text-blue-300">
                  {companyLogo ? (
                    <img src={companyLogo} alt={`${job.displayCompany} logo`} className="h-full w-full object-contain p-2" />
                  ) : (
                    <span>{companyInitial}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#1a3884] dark:text-blue-300">
                    {job.displayCompany}
                  </p>
                  <h1 className="mt-1 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-[#0d1f4e] dark:text-white sm:text-[26px]">
                    {job.displayTitle}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-500 dark:text-slate-400">
                    {job.displayType && <span>{job.displayType}</span>}
                    {job.displayLocation && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span>{job.displayLocation}</span>
                      </>
                    )}
                    {getPostedAgo(job.displayCreatedAt || job.createdAt, t) && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span>{getPostedAgo(job.displayCreatedAt || job.createdAt, t)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-center lg:w-auto">
                <div className="flex shrink-0 items-center gap-2">
                  <span className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#1a3884]/20 bg-white px-3 text-[11.5px] font-medium text-[#1a3884] dark:border-[#1a3884]/50 dark:bg-transparent dark:text-blue-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1a3884] dark:bg-blue-400" />
                    {statusLabel}
                  </span>
                  <span className={`flex h-9 items-center justify-center rounded-lg px-3 text-[11.5px] font-semibold uppercase tracking-[0.05em] ${
                    isSmaartSource
                      ? 'bg-[#0d1f4e] text-white dark:bg-blue-500/90 dark:text-white'
                      : 'bg-[#eef2fb] text-[#1a3884] dark:bg-[#1a3884]/30 dark:text-blue-300'
                  }`}>
                    {isSmaartSource ? t("placement.source_smaart", "SMAART") : t("placement.source_college", "College")}
                  </span>
                </div>
                {documentUrl && (
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3.5 text-[13px] font-medium text-[#0d1f4e] transition-colors hover:border-[#1a3884]/40 hover:bg-[#f5f8ff] dark:border-[#1a3884]/30 dark:text-slate-200 dark:hover:bg-[#001a3d] sm:w-auto"
                  >
                    {t("placement.view_jd", "View JD")}
                    <ExternalLink className="h-3.5 w-3.5" stroke={1.8} />
                  </a>
                )}
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  {!hasApplied && (
                      <button
                        onClick={() => setBuildResumeOpen(true)}
                        className="flex h-9 w-full items-center justify-center rounded-lg border border-slate-200 px-4 text-[13px] font-medium text-[#0d1f4e] transition-colors hover:border-[#1a3884]/40 hover:bg-[#f5f8ff] dark:border-[#1a3884]/30 dark:text-slate-200 dark:hover:bg-[#001a3d] sm:w-auto"
                      >
                        {t("placement.generate_resume", "Build Resume")}
                      </button>
                  )}
                  <button
                    onClick={() => setApplyOpen(true)}
                    disabled={hasApplied}
                    className={`flex h-9 w-full flex-1 items-center justify-center rounded-lg px-5 text-[13px] font-medium text-white transition-colors sm:w-auto sm:flex-initial ${hasApplied ? 'cursor-not-allowed bg-slate-300 dark:bg-slate-700' : 'bg-[#0d1f4e] hover:bg-[#1a3884] active:scale-[0.98]'}`}
                  >
                    {hasApplied ? t("placement.applied", "Applied") : t("placement.apply", "Apply")}
                  </button>
                  {hasApplied && (
                    <>
                      <button
                        onClick={() => setWithdrewConfirmOpen(true)}
                        className="flex h-9 w-full flex-1 items-center justify-center rounded-lg border border-slate-200 px-4 text-[13px] font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-[#1a3884]/30 dark:text-slate-300 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 sm:w-auto sm:flex-initial"
                      >
                        {t("placement.withdraw", "Withdraw")}
                      </button>
                      {withdrewConfirmOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#1a3884]/30 dark:bg-[#001630]">
                            <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-[#0d1f4e] dark:text-white">{t("placement.confirm_withdraw", "Confirm withdraw")}</h3>
                            <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                              {t("placement.withdraw_warning", { title: job.displayTitle, defaultValue: "Are you sure you want to withdraw your application for {{title}}? This action cannot be undone." })}
                            </p>
                            <div className="mt-6 flex justify-end gap-2.5">
                              <button onClick={() => setWithdrewConfirmOpen(false)} className="h-9 rounded-lg border border-slate-200 px-4 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-[#1a3884]/30 dark:text-slate-300 dark:hover:bg-[#001a3d]">{t("placement.cancel", "Cancel")}</button>
                              <button
                                onClick={async () => {
                                  if (withdrewPending) return;
                                  try {
                                    setWithdrewPending(true);
                                    let appId = applicationId;
                                    if (!appId) {
                                      const list = await placementsAPI.listApplications({ job: id, jobSource: source });
                                      const apps = list && list.success && Array.isArray(list.data) ? list.data : (Array.isArray(list) ? list : []);
                                      if (apps.length > 0) {
                                        appId = apps[0]._id || apps[0].id || null;
                                        setApplicationId(appId);
                                      }
                                    }
                                    if (!appId) {
                                      throw new Error("Could not find the application details to withdraw.");
                                    }
                                    await placementsAPI.deleteApplication(appId);
                                    setHasApplied(false);
                                    setApplicationId(null);
                                    try {
                                      const key = `applied:${source}:${id}`;
                                      sessionStorage.removeItem(key);
                                    } catch (_) {}
                                    toast({
                                      title: t("placement.applied_toast_title", "Application withdrawn"),
                                      description: t("placement.applied_toast_desc", "Your application has been removed.")
                                    });
                                    setWithdrewConfirmOpen(false);
                                  } catch (err) {
                                    toast({
                                      title: t("placement.error_withdraw_title", "Could not withdraw"),
                                      description: err.message || t("placement.error_withdraw_desc", "Please try again"),
                                      variant: 'destructive'
                                    });
                                  } finally {
                                    setWithdrewPending(false);
                                  }
                                }}
                                className="h-9 rounded-lg bg-red-600 px-4 text-[13px] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                              >
                                {withdrewPending ? t("placement.withdrawing", "Withdrawing...") : t("placement.withdraw", "Withdraw")}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Offer Banner UI */}
          {hasApplied && applicationData && applicationData.status === 'Offer' && (
            <div className="mx-6 mt-6 rounded-xl border border-sky-200 bg-sky-50/70 p-5 dark:border-sky-500/25 dark:bg-sky-500/[0.07]">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-sky-900 dark:text-sky-300">
                            You have received an offer
                        </h2>
                        <p className="mt-1 text-[13px] leading-relaxed text-sky-800/80 dark:text-sky-400/90">
                            Congratulations! {job.displayTitle} has extended an offer to you. Review the details below.
                        </p>

                        <div className="mt-4 flex flex-col gap-6 rounded-lg border border-sky-100 bg-white p-4 dark:border-sky-500/20 dark:bg-[#001630] sm:flex-row">
                            <div>
                                <p className="mb-1 text-[10.5px] font-medium uppercase tracking-[0.07em] text-slate-400">Package Offered</p>
                                <p className="text-[15px] font-semibold text-[#0d1f4e] dark:text-white">{applicationData.offeredPackage || 'Not specified'}</p>
                            </div>
                            <div>
                                <p className="mb-1 text-[10.5px] font-medium uppercase tracking-[0.07em] text-slate-400">Offer Date</p>
                                <p className="text-[15px] font-semibold text-[#0d1f4e] dark:text-white">
                                    {applicationData.offerDate ? new Date(applicationData.offerDate).toLocaleDateString() : new Date().toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 md:w-[260px] md:flex-shrink-0">
                        <div>
                            <label className="mb-1.5 block text-[10.5px] font-medium uppercase tracking-[0.07em] text-sky-700 dark:text-sky-400">E-Signature</label>
                            <input
                                type="text"
                                placeholder="Type full name to sign"
                                value={eSignature}
                                onChange={(e) => setESignature(e.target.value)}
                                className="h-10 w-full rounded-lg border border-sky-200 bg-white px-3.5 text-[13.5px] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-[3px] focus:ring-sky-500/10 dark:border-sky-500/25 dark:bg-[#001630] dark:text-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleOfferResponse('Declined')}
                                disabled={offerPending}
                                className="h-9 flex-1 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Decline
                            </button>
                            <button
                                onClick={() => handleOfferResponse('Accepted')}
                                disabled={offerPending}
                                className="h-9 flex-[2] rounded-lg bg-sky-600 text-[13px] font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
                            >
                                {offerPending ? 'Processing…' : 'Accept Offer'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* Already Accepted/Hired Banner */}
          {hasApplied && applicationData && (applicationData.status === 'Hired' || applicationData.status === 'Accepted') && (
            <div className="mx-6 mt-6 flex items-start gap-3.5 rounded-xl border border-emerald-200/70 bg-emerald-50/70 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/[0.07]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/15">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" stroke={1.7} />
                </div>
                <div className="min-w-0">
                    <h3 className="text-[14.5px] font-semibold text-emerald-800 dark:text-emerald-300">Offer accepted</h3>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-emerald-700/80 dark:text-emerald-400/90">You have successfully accepted the offer for {job.displayTitle}. Your signature was recorded on {applicationData.signatureDate ? new Date(applicationData.signatureDate).toLocaleDateString() : new Date().toLocaleDateString()}.</p>
                </div>
            </div>
          )}

          <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
            <section className="space-y-7">
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-[#0d1f4e] dark:text-white">
                  <FileDescription stroke={1.7} className="h-[18px] w-[18px] text-[#1a3884] dark:text-blue-400" />
                  {t("placement.job_description", "Job Description")}
                </h2>
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-[#1a3884]/25 dark:bg-[#001a3d]">
                  <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {getDescription(job, t)}
                  </p>
                </div>
              </div>

              {eligibility && (
                <div>
                  <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-[#0d1f4e] dark:text-white">
                    <ShieldCheck stroke={1.7} className="h-[18px] w-[18px] text-[#1a3884] dark:text-blue-400" />
                    {t("placement.eligibility_criteria", "Eligibility Criteria")}
                  </h2>
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-[#1a3884]/25 dark:bg-[#001a3d]">
                    <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                      {eligibility.map(({ label, value, icon: Icon, fullWidth }) => (
                        <div key={label} className={`flex items-start gap-3 ${fullWidth ? 'sm:col-span-2' : ''}`}>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-[#1a3884]/30 dark:bg-[#001630]">
                            <Icon stroke={1.7} className="h-[17px] w-[17px] text-[#1a3884] dark:text-blue-400" />
                          </div>
                          <div className="flex min-w-0 flex-col pt-[2px]">
                            <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-slate-400">{label}</p>
                            <p className="mt-0.5 break-words text-[13.5px] font-semibold leading-tight text-[#0d1f4e] dark:text-white">{formatValue(value, t)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}



              {/* ── Skill Gap Section ─────────────────────────────────── */}
              {hasSkillGap && (
                <div>
                  <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-[#0d1f4e] dark:text-white">
                    <span className="text-[#1a3884] dark:text-blue-400 text-[18px] leading-none">⚠️</span>
                    {t("placement.skill_gap", "Skill Gap Detected")}
                  </h3>
                  <div className="mt-3 rounded-xl border border-[#1a3884]/20 bg-[#001a3d]/5 p-5 dark:border-[#1a3884]/30 dark:bg-[#001a3d]/40">
                    <p className="mb-4 text-[13px] leading-relaxed text-[#112b6b] dark:text-blue-200 font-medium">
                      The following must-have skills are missing or below the required level. Closing these gaps will boost your chances.
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {missedMustHaves.map((skill, idx) => {
                        // Handle both old string format and new object format gracefully
                        const isObj = typeof skill === 'object' && skill !== null;
                        const name = isObj ? skill.name : skill;
                        const reqLvl = isObj ? skill.requiredLevel : '?';
                        const stdLvl = isObj ? skill.studentLevel : '?';

                        return (
                          <div key={`${name}-${idx}`} className="flex flex-col rounded-xl border border-[#d8e6f7] bg-white p-3.5 shadow-sm dark:border-[#1a3884]/30 dark:bg-[#001630]">
                            <p className="truncate text-[13.5px] font-bold text-[#0d1f4e] dark:text-white">{name}</p>
                            <div className="mt-2 flex items-center gap-3">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Required</span>
                                <span className="text-[12.5px] font-bold text-[#1a3884] dark:text-blue-300">Level {reqLvl}</span>
                              </div>
                              <div className="h-6 w-px bg-slate-200 dark:bg-[#1a3884]/30" />
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">You have</span>
                                <span className="text-[12.5px] font-bold text-slate-600 dark:text-slate-300">Level {stdLvl}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-[11px] italic text-[#1a3884]/70 dark:text-blue-300/70">
                      *Reflects verified skills only. Your application will still be reviewed.
                    </p>
                  </div>
                </div>
              )}
              {/* ──────────────────────────────────────────────────────── */}


            </section>

            <aside className="space-y-6 lg:sticky lg:top-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-[#1a3884]/25 dark:bg-[#001a3d]">
                <h2 className="mb-4 border-b border-slate-200 pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#1a3884] dark:border-[#1a3884]/25 dark:text-blue-300">
                  {t("placement.job_information", "Job Information")}
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {details.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-[#1a3884]/30 dark:bg-[#001630]">
                        <Icon stroke={1.7} className="h-[17px] w-[17px] text-[#1a3884] dark:text-blue-400" />
                      </div>
                      <div className="flex min-w-0 flex-col justify-center">
                        <p className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-slate-400">{label}</p>
                        <p className="mt-0.5 break-words text-[13.5px] font-semibold leading-tight text-[#0d1f4e] dark:text-white">{formatValue(value, t)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {skills.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-[#1a3884]/25 dark:bg-[#001a3d]">
                  <h2 className="mb-4 border-b border-slate-200 pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#1a3884] dark:border-[#1a3884]/25 dark:text-blue-300">
                    {t("placement.skills", "Skills & Technologies")}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span key={skill} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#0d1f4e] dark:border-[#1a3884]/30 dark:bg-[#001630] dark:text-slate-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-[#1a3884]/25 dark:bg-[#001a3d]">
                <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-[#1a3884]/25">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#1a3884] dark:text-blue-300">
                    {t("placement.about_company", "About the Company")}
                  </h2>
                  {companyWebsite && (
                    <a
                      href={companyWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1a3884] transition-colors hover:underline dark:text-blue-400"
                    >
                      {t("placement.website", "Website")}
                      <ExternalLink stroke={1.8} className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {companyAbout || t("placement.no_company_info", "Company information has not been added yet.")}
                </p>
              </div>
            </aside>
          </div>
        </motion.div>
      </div>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:left-[calc(50%+128px)] w-[92%] sm:w-full max-h-[92vh] max-w-2xl overflow-y-auto rounded-2xl border-[#d8e6f7] bg-white p-0 dark:border-[#1a3884]/20 dark:bg-[#001630]">
          <DialogHeader className="border-b border-[#d8e6f7] px-6 py-5 text-left dark:border-[#1a3884]/20">
            <DialogTitle className="text-[17px] font-semibold tracking-[-0.01em] text-[#0d1f4e] dark:text-white">
              {t("placement.apply_for", { title: job.displayTitle, defaultValue: "Apply for {{title}}" })}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-slate-500 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{job.displayCompany}</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span>{job.displayLocation}</span>
                {/* Source badge */}
                <span className="ml-1 inline-flex items-center rounded-md bg-[#f1f5fd] px-2 py-[3px] text-[10.5px] font-medium text-[#1a3884] dark:bg-[#1a3884]/20 dark:text-blue-300">
                  {job.sourceCollection === 'smaartjobpostings' ? t("placement.source_smaart", "SMAART") : job.sourceCollection === 'jobpostings' ? t("placement.source_college", "College") : (job.sourceCollection || 'External')}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplicationSubmit} className="space-y-5 px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-slate-400">{t("placement.full_name", "Full Name")}</span>
                <input
                  required
                  value={applicationForm.fullName}
                  onChange={(event) => updateApplicationField("fullName", event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13.5px] text-slate-900 outline-none transition-all focus:border-[#1a3884] focus:ring-[3px] focus:ring-[#1a3884]/10 dark:border-[#1a3884]/30 dark:bg-[#001a3d] dark:text-white"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-slate-400">{t("placement.email", "Email")}</span>
                <input
                  required
                  type="email"
                  value={applicationForm.email}
                  onChange={(event) => updateApplicationField("email", event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13.5px] text-slate-900 outline-none transition-all focus:border-[#1a3884] focus:ring-[3px] focus:ring-[#1a3884]/10 dark:border-[#1a3884]/30 dark:bg-[#001a3d] dark:text-white"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-slate-400">{t("placement.mobile", "Mobile")}</span>
                <input
                  required
                  value={applicationForm.mobile}
                  onChange={(event) => updateApplicationField("mobile", event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-[13.5px] text-slate-900 outline-none transition-all focus:border-[#1a3884] focus:ring-[3px] focus:ring-[#1a3884]/10 dark:border-[#1a3884]/30 dark:bg-[#001a3d] dark:text-white"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-slate-400">{t("placement.active_backlog", "Active Backlogs")}</span>
                <div className="relative">
                    <input
                      required
                      type="number"
                      min="0"
                      placeholder="0"
                      value={applicationForm.activeBacklog}
                      readOnly={isBacklogReadOnly}
                      onChange={(event) => updateApplicationField("activeBacklog", event.target.value)}
                      className={`h-10 w-full rounded-lg border border-slate-200 px-3.5 text-[13.5px] text-slate-900 outline-none transition-all focus:border-[#1a3884] focus:ring-[3px] focus:ring-[#1a3884]/10 dark:border-[#1a3884]/30 dark:bg-[#001a3d] dark:text-white ${isBacklogReadOnly ? 'cursor-not-allowed border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-900/10 dark:text-emerald-300' : 'bg-white'}`}
                      title={isBacklogReadOnly ? "Auto-synced from Academic Records" : ""}
                    />
                    {isBacklogReadOnly && (
                        <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" title="Auto-synced from Academic Records" />
                    )}
                </div>
              </label>

              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-slate-400">{t("placement.resume", "Resume")}</span>
                <div className="flex items-center gap-3">
                  <input
                    id="resumeFileInput"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      updateApplicationField('resumeFile', e.target.files && e.target.files[0] ? e.target.files[0] : null);
                      updateApplicationField('resumeUrl', null);
                    }}
                    className="hidden"
                  />
                  {!applicationForm.resumeFile && !applicationForm.resumeUrl ? (
                    <label
                      htmlFor="resumeFileInput"
                      className="inline-flex h-10 w-full cursor-pointer items-center justify-start rounded-lg border border-dashed border-slate-300 bg-white px-3.5 text-[13.5px] font-medium text-[#0d1f4e] transition-colors hover:border-[#1a3884]/50 hover:bg-[#f5f8ff] dark:border-[#1a3884]/40 dark:bg-[#001a3d] dark:text-slate-200"
                    >
                      <UploadIcon className="mr-2 h-4 w-4 text-slate-400" stroke={1.7} />
                      <span>{t("placement.upload_resume", "Upload Resume")}</span>
                    </label>
                  ) : (
                    <div className="inline-flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 text-[13px] font-medium text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/[0.07] dark:text-emerald-400">
                      <div className="flex items-center gap-2">
                          <Checkbox className="h-4 w-4 text-emerald-600" stroke={1.8} />
                          <span>{applicationForm.resumeUrl ? t("placement.smaart_resume_attached", "SMAART Resume Attached") : t("placement.uploaded", "Uploaded")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                            updateApplicationField('resumeFile', null);
                            updateApplicationField('resumeUrl', null);
                        }}
                        aria-label="Remove uploaded resume"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-emerald-700 hover:bg-emerald-100"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </label>
            </div>



            {applyUrl && (
              <a
                href={applyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1a3884] transition-colors hover:underline dark:text-blue-400"
              >
                {t("placement.external_link", "External application link")}
                <ExternalLink className="h-3.5 w-3.5" stroke={1.8} />
              </a>
            )}

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-[#1a3884]/25 dark:bg-[#001a3d]">
              <label className="inline-flex cursor-pointer items-start gap-3 text-left">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#1a3884] focus:ring-[#1a3884] dark:border-[#1a3884]/40 dark:bg-[#001630] dark:checked:bg-[#1a3884]"
                />
                <span className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {t("placement.consent_declare", "I hereby declare and grant permission to share my resume and profile details with the recruiter for this job application.")}
                </span>
              </label>
            </div>

            <DialogFooter className="mt-5 gap-2 border-t border-[#d8e6f7] pt-5 dark:border-[#1a3884]/20 sm:gap-2">
              <button
                type="button"
                onClick={() => setApplyOpen(false)}
                className="h-9 rounded-lg border border-slate-200 px-4 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-[#1a3884]/30 dark:text-slate-300 dark:hover:bg-[#001a3d]"
              >
                {t("placement.cancel", "Cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-9 rounded-lg bg-[#0d1f4e] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#1a3884] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? t("placement.submitting", "Submitting…") : t("placement.submit_application", "Submit Application")}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="sm:left-[calc(50%+128px)] w-[92%] sm:w-full max-w-md rounded-2xl border border-[#d8e6f7] bg-white p-6 dark:border-[#1a3884]/20 dark:bg-[#001630]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[16px] font-semibold tracking-[-0.01em] text-[#0d1f4e] dark:text-white">
              <ShieldCheck className="h-[18px] w-[18px] text-[#1a3884] dark:text-blue-400" stroke={1.7} />
              {t("placement.terms_title", "Terms & Conditions")}
            </DialogTitle>
            <DialogDescription className="mt-3 text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              {t("placement.terms_text", "I hereby declare that all the information provided above is correct. Any misleading information will lead to rejection of my application.")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex justify-end gap-2 border-t border-[#d8e6f7] pt-4 dark:border-[#1a3884]/20">
            <button
              type="button"
              onClick={() => setTermsOpen(false)}
              className="h-9 rounded-lg border border-slate-200 px-4 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-[#1a3884]/30 dark:text-slate-300 dark:hover:bg-[#001a3d]"
            >
              {t("placement.cancel", "Cancel")}
            </button>
            <button
              type="button"
              onClick={executeApplicationSubmit}
              className="h-9 rounded-lg bg-[#0d1f4e] px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#1a3884]"
            >
              {t("placement.accept_submit", "Accept & Submit")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {buildResumeOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/50 backdrop-blur-sm sm:p-4">
          <div className="flex-1 w-full bg-[#F8FAFC] dark:bg-[#00152E] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
            <button 
              onClick={() => setBuildResumeOpen(false)}
              className="absolute top-4 right-4 z-[110] flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <X stroke={2} className="h-5 w-5" />
            </button>
            <div className="flex-1 overflow-y-auto w-full h-full rounded-2xl relative">
              <ResumeBuilder 
                  embedded={true} 
                  jobContext={job} 
                  onClose={(builtData) => {
                      setBuildResumeOpen(false);
                      if (builtData && builtData.url) {
                          updateApplicationField('resumeUrl', builtData.url);
                          updateApplicationField('resumeFile', null);
                          setApplyOpen(true);
                      }
                  }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementDetail;
