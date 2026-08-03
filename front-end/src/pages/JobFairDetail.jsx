import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  IconArrowLeft as ArrowLeft,
  IconBriefcase as Briefcase,
  IconBuilding as Building,
  IconCalendarDue as CalendarDue,
  IconClock as Clock,
  IconMapPin as MapPin,
  IconTag as Tag,
  IconChevronRight as ChevronRight,
  IconQrcode as QrCode,
} from "@tabler/icons-react";
import { getBackendUrl, placementsAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import useUser from "@/hooks/useUser";
import JobFairFloorMap from "./JobFairFloorMap";
import CompanyShowcaseCards from "./CompanyShowcaseCards";
import JobFairDigitalPassModal from "@/components/JobFairDigitalPassModal";

const formatDate = (value, t) => {
  if (!value) return t("placement.no_deadline", "No deadline listed");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const getCompanyLogo = (job) => {
  const logo = job?.displayCompanyLogo || job?.companyLogo || job?.logo || job?.logoUrl || job?.companyLogoUrl || null;
  if (!logo || typeof logo !== "string") return null;
  if (/^(https?:|data:|blob:)/i.test(logo)) return logo;
  return `${getBackendUrl()}/${logo.replace(/^\/+/, "")}`;
};

const getSkills = (job) => {
  const raw = job?.skills || job?.requiredSkills || job?.skillSet || job?.technologies || [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") return raw.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
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

const JobFairDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();

  const [fair, setFair] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState("roles"); // 'roles' | 'companies' | 'floormap'
  const [showPassModal, setShowPassModal] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await placementsAPI.getJobFair(id);
        if (active) setFair(response?.data || null);
      } catch (error) {
        if (active) {
          setFair(null);
          toast({
            title: t("placement.error_load_fairs_title", "Could not load job fair"),
            description: error.message || t("placement.error_load_fairs_desc", "Please try again in a moment."),
            variant: "destructive",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id, t, toast]);

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const response = await placementsAPI.registerJobFair(id);
      if (response.success) {
        toast({
          title: t("placement.register_fair_success_title", "Registered Successfully"),
          description: t("placement.register_fair_success_desc", "You have successfully registered for the Job Fair."),
        });
        // Reflect the new registration without a full refetch.
        setFair((prev) => {
          if (!prev) return prev;
          const students = [...(prev.registeredStudents || [])];
          if (user?._id && !students.includes(user._id)) students.push(user._id);
          return { ...prev, registeredStudents: students };
        });
      }
    } catch (error) {
      toast({
        title: t("placement.error_register_fair_title", "Registration Failed"),
        description: error.message || t("placement.error_register_fair_desc", "Please try again in a moment."),
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto mt-8 max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-slate-50 dark:border-[#1a3884]/25 dark:bg-[#001630]" />
      </div>
    );
  }

  if (!fair) {
    return (
      <div className="mx-auto mt-8 max-w-4xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-[#d8e6f7] bg-white p-8 text-center shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630]">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f8ff] dark:bg-[#1a3884]/15">
            <Briefcase className="h-6 w-6 text-[#1a3884] dark:text-blue-300" stroke={1.7} />
          </div>
          <h1 className="text-base font-semibold text-[#0d1f4e] dark:text-white">
            {t("placement.fair_not_found", "Job fair not found")}
          </h1>
          <p className="mt-1 max-w-md text-[13px] text-slate-500 dark:text-slate-400">
            {t("placement.fair_not_found_desc", "This job fair may have been removed or is not available to you.")}
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

  const isSmaartFair = fair.label === "smaart job fair";
  const isRegistered = fair.registeredStudents?.some((s) => {
    const sid = typeof s === "object" ? (s._id || s.id) : s;
    return sid === user?._id;
  });
  const totalRegistered = fair.registeredStudents?.length || 0;
  const closed = fair.status === "completed" || fair.status === "cancelled";
  const jobs = Array.isArray(fair.jobs) ? fair.jobs : [];
  const companyCount = new Set(
    jobs
      .map(
        (j) =>
          (j.company?._id && String(j.company._id)) ||
          (j.company && typeof j.company === "string" && j.company) ||
          (j.postedByRecruiter?._id && String(j.postedByRecruiter._id)) ||
          (j.postedByRecruiter && typeof j.postedByRecruiter === "string" && j.postedByRecruiter) ||
          j.displayCompany
      )
      .filter(Boolean)
  ).size;
  const bannerImageUrl = fair.bannerImage
    ? (fair.bannerImage.startsWith("http") ? fair.bannerImage : `${getBackendUrl()}/${fair.bannerImage.replace(/^\/+/, "")}`)
    : null;

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <div className="mx-auto mt-8 max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <div className="mb-5 mt-6 flex items-center">
          <button onClick={() => navigate("/dashboard/placement")} className="group flex w-fit items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
              <ArrowLeft stroke={2.5} className="h-4 w-4 text-[#112b6b] transition-transform group-hover:-translate-x-0.5 dark:text-slate-300" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#112b6b] transition-colors group-hover:text-[#1a3884] dark:text-blue-400">
              {t("placement.back_to_placement", "Back to Placement")}
            </span>
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630]"
        >
          {/* Banner — navy placeholder sits underneath so a missing or broken
              image degrades gracefully instead of collapsing the header. */}
          <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-[#1a3884] to-[#00152E] sm:h-56">
            <div className="absolute inset-0 flex items-center justify-center">
              <Briefcase className="h-10 w-10 text-white/25" stroke={1.5} />
            </div>
            {bannerImageUrl && (
              <img
                src={bannerImageUrl}
                alt={fair.title}
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
            <div className="absolute inset-x-5 top-5 flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-1 text-[10.5px] font-semibold uppercase tracking-[0.05em] backdrop-blur-sm ${
                isSmaartFair ? "bg-white/95 text-[#0d1f4e]" : "bg-black/35 text-white ring-1 ring-white/30"
              }`}>
                {isSmaartFair ? t("placement.source_smaart_job_fair", "SMAART Job Fair") : t("placement.source_college_job_fair", "College Job Fair")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-2 py-1 text-[10.5px] font-medium text-[#1a3884] backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1a3884]" />
                {formatStatus(fair.status, t)}
              </span>
            </div>
          </div>

          {/* Fair header */}
          <div className="border-b border-[#d8e6f7] p-6 dark:border-[#1a3884]/20">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-[#0d1f4e] dark:text-white sm:text-[26px]">
                  {fair.title}
                </h1>
                {fair.description && (
                  <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {fair.description}
                  </p>
                )}

                <div className="mt-4 grid gap-x-6 gap-y-2 text-[13px] text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                    <span className="truncate">{fair.location || t("placement.remote", "Remote")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDue className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                    <span className="truncate">{formatDate(fair.startDate, t)} – {formatDate(fair.endDate, t)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                    <span className="truncate">
                      {t("placement.registered_count", { count: totalRegistered, defaultValue: `${totalRegistered} students registered` })}
                    </span>
                  </div>
                  {fair.registrationDeadline && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                      <span className="truncate">
                        {t("placement.register_by", "Register by")} {formatDate(fair.registrationDeadline, t)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full shrink-0 lg:w-auto">
                {isRegistered && (
                  <button
                    onClick={() => setShowPassModal(true)}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0d1f4e] via-[#122b68] to-[#1a3884] px-4 text-[13px] font-bold text-white shadow-md transition-all hover:shadow-[0_4px_16px_rgba(26,56,132,0.35)] active:scale-[0.98] dark:from-[#1a3884] dark:to-[#24499e] lg:w-auto"
                  >
                    <QrCode className="h-4 w-4 text-cyan-300" />
                    <span>Digital Fair Pass & QR</span>
                  </button>
                )}

                <button
                  onClick={() => !isRegistered && !closed && handleRegister()}
                  disabled={isRegistered || closed || registering}
                  className={`flex h-10 w-full items-center justify-center rounded-lg px-6 text-[13.5px] font-medium transition-colors lg:w-auto ${
                    isRegistered
                      ? "cursor-default border border-[#1a3884]/20 bg-[#eef2fb] text-[#1a3884] dark:border-[#1a3884]/50 dark:bg-[#1a3884]/25 dark:text-blue-300"
                      : closed
                        ? "cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                        : "bg-[#0d1f4e] text-white hover:bg-[#1a3884] active:scale-[0.98]"
                  }`}
                >
                  {registering
                    ? t("placement.registering", "Registering…")
                    : isRegistered
                      ? t("placement.registered", "Registered")
                      : t("placement.register", "Register")}
                </button>
              </div>
            </div>
          </div>

          {/* ── Modern Navigation Tabs ── */}
          <div className="border-b border-[#d8e6f7] px-6 pt-2 bg-slate-50/60 dark:bg-[#001430]/60 dark:border-[#1a3884]/25 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("roles")}
              className={`flex items-center gap-2 px-4 py-3.5 border-b-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "roles"
                  ? "border-[#1a3884] text-[#1a3884] dark:border-blue-400 dark:text-blue-300 shadow-sm"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              {t("placement.fair_roles", "Roles at this Fair")}
              {jobs.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                  activeTab === "roles"
                    ? "bg-[#1a3884]/10 dark:bg-blue-400/20 text-[#1a3884] dark:text-blue-300"
                    : "bg-slate-200/60 dark:bg-slate-800 text-slate-500"
                }`}>
                  {jobs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("companies")}
              className={`flex items-center gap-2 px-4 py-3.5 border-b-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "companies"
                  ? "border-[#1a3884] text-[#1a3884] dark:border-blue-400 dark:text-blue-300 shadow-sm"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Building className="h-4 w-4" />
              Participating Companies
              {companyCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                  activeTab === "companies"
                    ? "bg-[#1a3884]/10 dark:bg-blue-400/20 text-[#1a3884] dark:text-blue-300"
                    : "bg-slate-200/60 dark:bg-slate-800 text-slate-500"
                }`}>
                  {companyCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("floormap")}
              className={`flex items-center gap-2 px-4 py-3.5 border-b-2 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === "floormap"
                  ? "border-[#1a3884] text-[#1a3884] dark:border-blue-400 dark:text-blue-300 shadow-sm"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <MapPin className="h-4 w-4" />
              Interactive Floor Map
            </button>
          </div>

          {/* ── Tab Content ── */}
          <div className="p-6">
            {/* 1. Floor Map Tab */}
            {activeTab === "floormap" && (
              <JobFairFloorMap
                fair={fair}
                isDark={typeof document !== "undefined" && document.documentElement.classList.contains("dark")}
              />
            )}

            {/* 2. Companies Tab */}
            {activeTab === "companies" && (
              <CompanyShowcaseCards
                fair={fair}
              />
            )}

            {/* 3. Roles Tab */}
            {activeTab === "roles" && (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase className="h-[18px] w-[18px] text-[#1a3884] dark:text-blue-400" stroke={1.7} />
                  <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0d1f4e] dark:text-white">
                    {t("placement.fair_roles", "Roles at this fair")}
                  </h2>
                  {jobs.length > 0 && (
                    <span className="rounded-md bg-[#eef2fb] px-2 py-[3px] text-[11px] font-semibold text-[#1a3884] dark:bg-[#1a3884]/30 dark:text-blue-300">
                      {jobs.length}
                    </span>
                  )}
                </div>

                {jobs.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center dark:border-[#1a3884]/30 dark:bg-[#001630]">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f8ff] dark:bg-[#1a3884]/15">
                      <Briefcase className="h-6 w-6 text-[#1a3884] dark:text-blue-300" stroke={1.7} />
                    </div>
                    <h3 className="text-base font-semibold text-[#0d1f4e] dark:text-white">
                      {t("placement.no_fair_roles", "No roles posted yet")}
                    </h3>
                    <p className="mt-1 max-w-md text-[13px] text-slate-500 dark:text-slate-400">
                      {t("placement.no_fair_roles_desc", "Recruiters have not posted roles for this fair yet. Register to be notified when they do.")}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {jobs.map((job, index) => {
                      const skills = getSkills(job);
                      const companyLogo = getCompanyLogo(job);
                      const companyInitial = (String(job?.displayCompany || job?.companyName || "C").trim().charAt(0) || "C").toUpperCase();
                      const statusLabel = formatStatus(job.displayStatus || job.status, t);
                      const isClosed = (job.displayStatus || job.status || "").toString().toLowerCase().includes("closed");
                      const missed = job.missedMustHaves || [];
                      const deadlineLabel = job.displayDeadline ? formatDate(job.displayDeadline, t) : null;

                      return (
                        <motion.article
                          key={`${job.sourceCollection}-${job._id}`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.03, 0.3) }}
                          className={`group relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-[#1a3884]/35 hover:shadow-[0_4px_20px_-4px_rgba(13,31,78,0.14)] dark:border-[#1a3884]/25 dark:bg-[#001630] dark:hover:border-[#1a3884]/60 ${isClosed ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-[13px] font-semibold text-[#1a3884] dark:border-[#1a3884]/25 dark:bg-[#001a3d] dark:text-blue-300">
                              {companyLogo ? (
                                <img src={companyLogo} alt="" className="h-full w-full object-contain p-1.5" />
                              ) : (
                                <span>{companyInitial}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 title={job.displayTitle} className="line-clamp-2 text-[15px] font-semibold leading-[1.35] tracking-[-0.01em] text-[#0d1f4e] dark:text-white">
                                {job.displayTitle}
                              </h3>
                              <div className="mt-1 flex items-center gap-2 truncate text-[13px] leading-tight text-slate-500 dark:text-slate-400">
                                <span className="truncate">{job.displayCompany}</span>
                                {(() => {
                                  const companyId = job.company?._id || job.company || job.companyId || job.recruiter?._id || job.recruiter;
                                  if (!companyId) return null;
                                  const booth = fair?.boothAssignments?.find(
                                    (b) => String(b.entityId?._id || b.entityId) === String(companyId)
                                  )?.boothNumber;
                                  if (!booth) return null;
                                  return (
                                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-[#1a3884] px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
                                      <MapPin className="h-[10px] w-[10px]" stroke={2.5} />
                                      Booth {booth}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                            <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-[3px] text-[10.5px] font-medium ${
                              isClosed
                                ? "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
                                : "border-[#1a3884]/20 bg-white text-[#1a3884] dark:border-[#1a3884]/50 dark:bg-transparent dark:text-blue-300"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${isClosed ? "bg-slate-400" : "bg-[#1a3884] dark:bg-blue-400"}`} />
                              {statusLabel}
                            </span>
                          </div>

                          <div className="mt-4 space-y-[7px] text-[13px] leading-tight text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                              <span className="truncate">{job.displayLocation || t("placement.remote", "Remote")}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarDue className="h-[15px] w-[15px] shrink-0 text-slate-400" stroke={1.6} />
                              {deadlineLabel ? (
                                <span className="truncate">{t("placement.apply_by", "Apply by")} {deadlineLabel}</span>
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
                                <span className="rounded-md px-1 py-[3px] text-[11.5px] font-medium text-slate-400">+{skills.length - 3}</span>
                              )}
                            </div>
                          )}

                          {missed.length > 0 && (
                            <div className="mt-3.5 rounded-lg border border-amber-200/70 bg-amber-50/70 px-3 py-2.5 dark:border-amber-500/25 dark:bg-amber-500/[0.07]">
                              <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-amber-700 dark:text-amber-400">
                                {t("placement.skill_gap", "Skill gap detected")}
                              </p>
                              <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-amber-900/80 dark:text-amber-200/80">
                                {missed.slice(0, 3).map((m) => (typeof m === "string" ? m : m.name)).join(", ")}
                                {missed.length > 3 ? ` +${missed.length - 3} more` : ""}
                              </p>
                            </div>
                          )}

                          <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-[#1a3884]/20">
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <span className="truncate text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
                                {job.displayType}
                              </span>
                              {job.displayPostedBy && (
                                <span className="flex items-center gap-1 truncate text-[11px] text-slate-400 dark:text-slate-500">
                                  <Building className="h-3 w-3 shrink-0" stroke={1.6} />
                                  {job.displayPostedBy}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => !isClosed && navigate(`/dashboard/placement/${job.sourceCollection}/${job._id}`, { state: { job } })}
                              disabled={isClosed}
                              className={
                                isClosed
                                  ? "flex h-9 shrink-0 cursor-not-allowed items-center justify-center rounded-lg bg-slate-100 px-4 text-[13px] font-medium text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                                  : "group/btn flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0d1f4e] pl-4 pr-3.5 text-[13px] font-medium text-white outline-none transition-colors hover:bg-[#1a3884] focus-visible:ring-2 focus-visible:ring-[#1a3884]/40 focus-visible:ring-offset-2 active:scale-[0.98] dark:bg-[#1a3884] dark:hover:bg-[#24499e]"
                              }
                            >
                              <span>{isClosed ? t("placement.closed", "Closed") : t("placement.view", "View Details")}</span>
                              {!isClosed && (
                                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" stroke={2.2} />
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
          </div>
        </motion.div>
      </div>

      {/* ── Digital Fair Pass & QR Modal ── */}
      <JobFairDigitalPassModal
        isOpen={showPassModal}
        onClose={() => setShowPassModal(false)}
        fair={fair}
        user={user}
      />
    </div>
  );
};

export default JobFairDetail;
