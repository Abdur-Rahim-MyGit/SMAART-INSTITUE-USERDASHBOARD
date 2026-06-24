import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  IconArrowLeft as ArrowLeft,
  IconBriefcase as Briefcase,
  IconBuilding as Building,
  IconCalendarDue as CalendarDue,
  IconClock as Clock,
  IconExternalLink as ExternalLink,
  IconFileDescription as FileDescription,
  IconX as XIcon,
  IconUpload as UploadIcon,
  IconMapPin as MapPin,
  IconTag as Tag,
} from "@tabler/icons-react";
import { getBackendUrl, placementsAPI } from "@/services/api";
import { usersAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formatDate = (value) => {
  if (!value) return "Not listed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "Not listed";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ") || "Not listed";
  if (typeof value === "object") return value.name || value.title || value.companyName || value.fullName || "Available";
  return String(value);
};

const getCompanyLogo = (job) => {
  const logo = job?.displayCompanyLogo || job?.companyLogo || job?.logo || job?.logoUrl || job?.companyLogoUrl || job?.employerLogo || job?.organisationLogo || null;
  if (!logo || typeof logo !== "string") return null;
  if (/^(https?:|data:|blob:)/i.test(logo)) return logo;
  return `${getBackendUrl()}/${logo.replace(/^\/+/, "")}`;
};

const getDescription = (job) => {
  const value = job?.description || job?.jobDescription || job?.summary || job?.aboutRole || job?.requirements;
  if (!value) return "No detailed job description has been added yet.";
  if (Array.isArray(value)) return value.join("\n");
  return String(value);
};

const getSkills = (job) => {
  const raw = job?.skills || job?.requiredSkills || job?.skillSet || job?.technologies || [];
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

const formatStatus = (value) => {
  if (!value) return "Active";
  return String(value).replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

/**
 * Returns a LinkedIn-style "Posted X ago" label.
 * Purely client-side calculation from the existing createdAt timestamp.
 */
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

const PlacementDetail = () => {
  const { source, id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState(location.state?.job || null);
  const [loading, setLoading] = useState(!location.state?.job);
  const [applyOpen, setApplyOpen] = useState(false);
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
  const [withdrewConfirmOpen, setWithdrewConfirmOpen] = useState(false);
  const [withdrewPending, setWithdrewPending] = useState(false);
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
      coverLetter: "",
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
              title: "Could not load job",
              description: jobResp.reason?.message || "Please try again in a moment.",
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
  }, [id, source]);

  const details = useMemo(() => {
    if (!job) return [];
    const postedAgo = getPostedAgo(job.displayCreatedAt || job.createdAt);
    return [
      { label: "Company", value: job.displayCompany, icon: Building },
      { label: "Location", value: job.displayLocation, icon: MapPin },
      ...(postedAgo ? [{ label: "Posted", value: postedAgo, icon: Clock }] : []),
      { label: "Job Type", value: job.displayType, icon: Briefcase },
      { label: "Deadline", value: formatDate(job.displayDeadline), icon: CalendarDue },
      { label: "Package", value: job.displaySalary || job.salaryPackage || job.ctc || job.package, icon: Tag },
      { label: "Work Mode", value: job.workMode, icon: Briefcase },
    ];
  }, [job]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="h-[520px] animate-pulse rounded-2xl border border-[#d8e6f7] bg-white dark:border-[#1a3884]/20 dark:bg-[#001630]" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-12 text-center sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-[#d8e6f7] bg-white p-8 dark:border-[#1a3884]/20 dark:bg-[#001630]">
          <h1 className="text-xl font-bold text-[#0d1f4e] dark:text-white">Job not found</h1>
          <button
            onClick={() => navigate("/dashboard/placement")}
            className="mt-5 rounded-xl bg-[#1a3884] px-5 py-2 text-sm font-bold text-white"
          >
            Back to Placement
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
  const companyAbout = job.displayCompanyAbout || job.aboutCompany || job.companyAbout;
  const companyWebsite = job.displayCompanyWebsite || job.companyWebsite || job.website;
  const statusLabel = formatStatus(job.displayStatus || job.status);

  const updateApplicationField = (field, value) => {
    setApplicationForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplicationSubmit = async (event) => {
    event.preventDefault();
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
        title: "Application submitted",
        description: `Your application for ${job.displayTitle} has been sent.`,
      });
      setApplyOpen(false);
    } catch (error) {
      toast({
        title: "Could not submit application",
        description: error.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
        }
      } catch (err) {
        // Silent fail — keep existing value from session storage
        console.warn('Failed to load profile for application modal:', err?.message || err);
      }
    };

    loadProfile();
    return () => { mounted = false; };
  }, [applyOpen]);

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
              Back to Placement
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
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#d8e6f7] bg-[#f5f8ff] text-xl font-black text-[#1a3884] dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-blue-300">
                  {companyLogo ? (
                    <img src={companyLogo} alt={`${job.displayCompany} logo`} className="h-full w-full object-contain p-2" />
                  ) : (
                    <span>{companyInitial}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold uppercase tracking-wide text-[#1a3884] dark:text-blue-300">
                    {job.displayCompany}
                  </p>
                  <h1 className="mt-1 text-2xl font-extrabold leading-tight text-[#0d1f4e] dark:text-white sm:text-3xl">
                    {job.displayTitle}
                  </h1>
                  <p className="mt-1 text-sm font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {job.displayType}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
                <span className="flex h-10 items-center justify-center rounded-xl bg-emerald-50 px-4 text-xs font-extrabold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 w-full sm:w-auto">
                  {statusLabel}
                </span>
                {documentUrl && (
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#d8e6f7] px-4 text-sm font-bold text-[#1a3884] hover:bg-[#eef4ff] dark:border-[#1a3884]/20 dark:text-blue-300 w-full sm:w-auto"
                  >
                    View JD
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setApplyOpen(true)}
                    disabled={hasApplied}
                    className={`h-10 rounded-xl px-5 text-sm font-bold text-white flex-1 sm:flex-initial justify-center items-center ${hasApplied ? 'bg-slate-400 cursor-not-allowed w-full sm:w-auto' : 'bg-[#1a3884] hover:bg-[#132c6b] w-full sm:w-auto'}`}
                  >
                      {hasApplied ? 'Applied' : 'Apply'}
                  </button>
                  {hasApplied && (
                    <>
                      <button
                        onClick={() => setWithdrewConfirmOpen(true)}
                        className="h-10 rounded-xl border border-[#d8e6f7] px-4 text-sm font-bold text-[#1a3884] hover:bg-[#eef4ff] dark:border-[#1a3884]/20 dark:text-blue-300 flex-1 sm:flex-initial justify-center items-center"
                      >
                        Withdrew
                      </button>
                      {withdrewConfirmOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
                            <h3 className="text-lg font-bold text-[#0d1f4e]">Confirm withdraw</h3>
                            <p className="mt-2 text-sm text-slate-600">Are you sure you want to withdraw your application for <strong>{job.displayTitle}</strong>? This action cannot be undone.</p>
                            <div className="mt-4 flex justify-end gap-3">
                              <button onClick={() => setWithdrewConfirmOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold">Cancel</button>
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
                                    toast({ title: 'Application withdrawn', description: 'Your application has been removed.' });
                                    setWithdrewConfirmOpen(false);
                                  } catch (err) {
                                    toast({ title: 'Could not withdraw', description: err.message || 'Please try again', variant: 'destructive' });
                                  } finally {
                                    setWithdrewPending(false);
                                  }
                                }}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
                              >
                                {withdrewPending ? 'Withdrawing...' : 'Withdraw'}
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

          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section>
              <h2 className="text-lg font-extrabold text-[#0d1f4e] dark:text-white">Job Description</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
                {getDescription(job)}
              </p>

              <div className="mt-8 border-t border-[#d8e6f7] pt-6 dark:border-[#1a3884]/20">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-extrabold text-[#0d1f4e] dark:text-white">About the Company</h2>
                  {companyWebsite && (
                    <a
                      href={companyWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold text-[#1a3884] hover:text-[#132c6b] dark:text-blue-300"
                    >
                      Website
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {companyAbout || "Company information has not been added yet."}
                </p>
              </div>

              {skills.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-extrabold text-[#0d1f4e] dark:text-white">Skills</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span key={skill} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-[#001a3d] dark:text-slate-300">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <aside>
              <div className="rounded-2xl border border-[#d8e6f7] bg-[#f8fbff] p-5 dark:border-[#1a3884]/20 dark:bg-[#001a3d]">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#1a3884] dark:text-blue-300">
                  Job Information
                </h2>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-5">
                  {details.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex gap-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#1a3884] dark:text-blue-400" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                        <p className="mt-0.5 break-words text-sm font-extrabold text-[#0d1f4e] dark:text-white">{formatValue(value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </motion.div>
      </div>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-2xl border-[#d8e6f7] bg-white p-0 dark:border-[#1a3884]/20 dark:bg-[#001630]">
          <DialogHeader className="border-b border-[#d8e6f7] px-6 py-5 text-left dark:border-[#1a3884]/20">
            <DialogTitle className="text-xl font-extrabold text-[#0d1f4e] dark:text-white">
              Apply for {job.displayTitle}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{job.displayCompany}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{job.displayLocation}</span>
                </span>
                {/* Source badge */}
                <span className="ml-2 inline-flex items-center rounded-full bg-[#eef4ff] px-2 py-0.5 text-xs font-extrabold text-[#1a3884] dark:bg-[#072046] dark:text-blue-300">
                  {job.sourceCollection === 'smaartjobpostings' ? 'SMAART' : job.sourceCollection === 'jobpostings' ? 'College' : (job.sourceCollection || 'External')}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleApplicationSubmit} className="space-y-5 px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Full Name</span>
                <input
                  required
                  value={applicationForm.fullName}
                  onChange={(event) => updateApplicationField("fullName", event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#d8e6f7] bg-[#f8fbff] px-3 text-sm font-semibold text-[#0d1f4e] outline-none focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/15 dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</span>
                <input
                  required
                  type="email"
                  value={applicationForm.email}
                  onChange={(event) => updateApplicationField("email", event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#d8e6f7] bg-[#f8fbff] px-3 text-sm font-semibold text-[#0d1f4e] outline-none focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/15 dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Mobile</span>
                <input
                  required
                  value={applicationForm.mobile}
                  onChange={(event) => updateApplicationField("mobile", event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#d8e6f7] bg-[#f8fbff] px-3 text-sm font-semibold text-[#0d1f4e] outline-none focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/15 dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Resume</span>
                <div className="flex items-center gap-3">
                  <input
                    id="resumeFileInput"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => updateApplicationField('resumeFile', e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                    className="hidden"
                  />
                  {!applicationForm.resumeFile ? (
                    <label
                      htmlFor="resumeFileInput"
                      className="inline-flex h-11 w-full items-center justify-left
                       rounded-xl border border-[#d8e6f7] bg-[#f8fbff] px-4 text-sm font-semibold text-[#0d1f4e] cursor-pointer hover:bg-[#eef4ff] dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white"
                    >
                      <UploadIcon className="mr-2 h-4 w-4 text-[#0d1f4e]" />
                      <span>Upload Resume</span>
                    </label>
                  ) : (
                    <div className="inline-flex w-full items-center justify-between gap-2 rounded-xl border border-[#d8e6f7] bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                      <span>Uploaded</span>
                      <button
                        type="button"
                        onClick={() => updateApplicationField('resumeFile', null)}
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

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cover Letter</span>
              <textarea
                value={applicationForm.coverLetter}
                onChange={(event) => updateApplicationField("coverLetter", event.target.value)}
                rows={5}
                className="w-full resize-none rounded-xl border border-[#d8e6f7] bg-[#f8fbff] px-3 py-3 text-sm font-medium leading-6 text-[#0d1f4e] outline-none focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/15 dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white"
              />
            </label>

            {applyUrl && (
              <a
                href={applyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#1a3884] hover:text-[#132c6b] dark:text-blue-300"
              >
                External application link
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            <DialogFooter className="border-t border-[#d8e6f7] pt-5 dark:border-[#1a3884]/20">
              <button
                type="button"
                onClick={() => setApplyOpen(false)}
                className="h-10 rounded-xl border border-[#d8e6f7] px-5 text-sm font-bold text-[#1a3884] hover:bg-[#eef4ff] dark:border-[#1a3884]/20 dark:text-blue-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-10 rounded-xl bg-[#1a3884] px-5 text-sm font-bold text-white hover:bg-[#132c6b] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlacementDetail;
