/**
 * StudentPrepKit.jsx — Student Dashboard
 * Readiness dashboard with fair readiness score, fair-day checklist,
 * and skill-match recommendations derived directly from the fair and user profile.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconSparkles as Sparkles,
  IconTarget as Target,
  IconCircleCheck as CheckCircle2,
  IconAlertCircle as AlertCircle,
  IconChevronRight as ChevronRight,
  IconBriefcase as Briefcase,
  IconWorld as Globe,
  IconCurrencyRupee as IndianRupee,
  IconSchool as GraduationCap,
  IconBuilding as Building2,
  IconBolt as Zap,
  IconRefresh as RefreshCw,
  IconMapPin as MapPin,
} from "@tabler/icons-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
const PALETTE = [
  ["#1a3884", "#4f7dff"],
  ["#0e4f7a", "#3ab5e6"],
  ["#2d1e6b", "#8b5cf6"],
  ["#0f4c2a", "#34d399"],
];

const cardColor = (name = "") => {
  const hash = name.split("").reduce((a, c) => c.charCodeAt(0) + a, 0);
  return PALETTE[hash % PALETTE.length];
};

const initials = (name = "") =>
  name.trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";

const skillName = (s) => (typeof s === "string" ? s : s?.skill_name || s?.name || "");

const computeMatch = (studentSkills = [], job) => {
  const required = (job.eligibility?.requiredSkills || job.skills || []).map((s) => skillName(s).toLowerCase());
  if (required.length === 0) return { pct: 85, matched: [], missing: [] };
  const studentSet = new Set(studentSkills.map((s) => skillName(s).toLowerCase()));
  const matched = required.filter((r) => studentSet.has(r));
  const missing = required.filter((r) => !studentSet.has(r));
  return {
    pct: Math.round((matched.length / required.length) * 100),
    matched,
    missing,
  };
};

const matchBand = (pct) => {
  if (pct >= 80) return { label: "Strong Match", color: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400" };
  if (pct >= 50) return { label: "Good Match", color: "#3b82f6", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400" };
  if (pct >= 30) return { label: "Partial Match", color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400" };
  return { label: "Low Match", color: "#f43f5e", bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-400" };
};

// ─── PrepCheckItem ─────────────────────────────────────────────────────────────
const PrepCheckItem = ({ done, label, sub }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${done ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`}>
      {done ? <CheckCircle2 size={13} className="text-white" /> : <span className="w-2 h-2 rounded-full bg-white/60" />}
    </div>
    <div>
      <p className={`text-sm font-bold ${done ? "text-gray-800 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}>{label}</p>
      {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── CompanyMatchCard ──────────────────────────────────────────────────────────
const CompanyMatchCard = ({ entity, studentSkills, cgpa }) => {
  const [imgErr, setImgErr] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { name, logo, website, jobs = [], boothNumber } = entity;
  const [from, to] = cardColor(name);

  const eligibleJobs = jobs.filter((job) => {
    const minCGPA = job.eligibility?.minCGPA || 0;
    return !cgpa || cgpa >= minCGPA;
  });

  const bestMatch = jobs.reduce((best, job) => {
    const { pct } = computeMatch(studentSkills, job);
    return pct > best ? pct : best;
  }, 0);

  const band = matchBand(bestMatch);

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200 bg-white dark:bg-[#001430] border-[#d8e6f7] dark:border-[#1a3884]/25 shadow-sm"
    >
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center shrink-0">
            {logo && !imgErr ? (
              <img src={logo} alt={name} onError={() => setImgErr(true)} className="w-full h-full object-contain p-1" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-white text-sm" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
                {initials(name)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-black text-base text-gray-900 dark:text-white leading-tight truncate">{name}</h4>
              {boothNumber && (
                <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black bg-[#1a3884] text-white">
                  Booth {boothNumber}
                </span>
              )}
            </div>
            {website && (
              <a
                href={website.startsWith("http") ? website : `https://${website}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-[#1a3884] dark:text-[#4f7dff] hover:underline mt-0.5 inline-block truncate max-w-xs"
              >
                {website.replace(/^https?:\/\//, "")}
              </a>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${band.bg} ${band.text}`}>
                {bestMatch}% {band.label}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${eligibleJobs.length > 0 ? "bg-[#1a3884]/8 dark:bg-[#1a3884]/25 text-[#1a3884] dark:text-[#4f7dff]" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                {eligibleJobs.length}/{jobs.length} roles eligible
              </span>
            </div>
          </div>

          {/* Circle gauge */}
          <div className="relative w-12 h-12 shrink-0">
            <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
              <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" className="text-slate-200 dark:text-[#1a3884]/30" strokeWidth="4" />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke={band.color}
                strokeWidth="4"
                strokeDasharray={`${(bestMatch / 100) * 100.53} 100.53`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black" style={{ color: band.color }}>
              {bestMatch}%
            </span>
          </div>
        </div>

        {/* Roles list */}
        {jobs.length > 0 && (
          <>
            <button
              onClick={() => setExpanded((e) => !e)}
              className="w-full flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[12px] font-bold text-slate-600 dark:text-slate-300 hover:text-[#1a3884] dark:hover:text-[#4f7dff] transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Briefcase size={13} />
                {jobs.length} Position{jobs.length !== 1 ? "s" : ""} Available
              </span>
              <ChevronRight size={14} className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
            </button>

            {expanded && (
              <div className="mt-2.5 space-y-2">
                {jobs.map((job, i) => {
                  const { pct, missing } = computeMatch(studentSkills, job);
                  const jband = matchBand(pct);
                  const minCGPA = job.eligibility?.minCGPA || 0;
                  const cgpaOk = !cgpa || cgpa >= minCGPA;

                  return (
                    <div
                      key={job._id || i}
                      className="p-3 rounded-xl border bg-slate-50 dark:bg-[#001026] border-slate-200 dark:border-[#1a3884]/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[13px] text-gray-900 dark:text-white truncate">{job.displayTitle || job.title}</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            {(job.displaySalary || job.salaryPackage) && (
                              <span className="flex items-center gap-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                <IndianRupee size={10} />{job.displaySalary || job.salaryPackage}
                              </span>
                            )}
                            {(job.displayType || job.jobType) && <span className="text-[10px] text-slate-400">{job.displayType || job.jobType}</span>}
                            {(job.displayLocation || job.location) && <span className="text-[10px] text-slate-400">{job.displayLocation || job.location}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${jband.bg} ${jband.text}`}>{pct}%</span>
                          {!cgpaOk && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
                              CGPA {minCGPA}+
                            </span>
                          )}
                        </div>
                      </div>
                      {missing.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Skills to improve:</p>
                          <div className="flex flex-wrap gap-1">
                            {missing.slice(0, 4).map((sk, si) => (
                              <span key={si} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 capitalize">
                                {sk}
                              </span>
                            ))}
                            {missing.length > 4 && <span className="text-[9px] text-slate-400">+{missing.length - 4}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main StudentPrepKit ───────────────────────────────────────────────────────
const StudentPrepKit = ({ fair, user }) => {
  const [sortBy, setSortBy] = useState("match"); // 'match' | 'jobs'

  const studentSkills = useMemo(() => {
    return (
      user?.skills ||
      user?.placementProfile?.skills ||
      user?.verifiedSkills ||
      user?.academic?.skills ||
      []
    );
  }, [user]);

  const cgpa = user?.cgpa || user?.academic?.cgpa || user?.registration?.cgpa || 0;
  const degree = user?.degree?.abbreviation || user?.degree?.fullName || user?.degree || "";
  const hasResume = !!(user?.placementProfile?.resumeUrl || user?.resumeUrl || user?.resume);

  // Group fair jobs by company entity
  const entities = useMemo(() => {
    if (!fair) return [];
    const jobs = Array.isArray(fair.jobs) ? fair.jobs : [];
    const boothAssignments = Array.isArray(fair.boothAssignments) ? fair.boothAssignments : [];

    const entityMap = new Map();

    jobs.forEach((job) => {
      const entityId =
        (job.company?._id && String(job.company._id)) ||
        (job.company && typeof job.company === "string" && job.company) ||
        (job.postedByRecruiter?._id && String(job.postedByRecruiter._id)) ||
        (job.postedByRecruiter && typeof job.postedByRecruiter === "string" && job.postedByRecruiter) ||
        job.displayCompany;

      if (!entityId) return;

      if (!entityMap.has(entityId)) {
        const booth = boothAssignments.find(
          (b) => String(b.entityId?._id || b.entityId) === String(entityId)
        );
        entityMap.set(entityId, {
          entityId,
          name: job.displayCompany || "Unknown Company",
          logo: job.displayCompanyLogo || null,
          website: job.displayCompanyWebsite || null,
          boothNumber: booth?.boothNumber || null,
          jobs: [],
        });
      }
      entityMap.get(entityId).jobs.push(job);
    });

    const list = [...entityMap.values()].map((e) => {
      const best = e.jobs.reduce((max, job) => {
        const { pct } = computeMatch(studentSkills, job);
        return pct > max ? pct : max;
      }, 0);
      return { ...e, bestMatch: best };
    });

    return list.sort((a, b) => {
      if (sortBy === "match") return b.bestMatch - a.bestMatch;
      if (sortBy === "jobs") return b.jobs.length - a.jobs.length;
      return 0;
    });
  }, [fair, studentSkills, sortBy]);

  const topMatches = entities.filter((e) => e.bestMatch >= 70);

  const checklistItems = [
    { done: studentSkills.length > 0, label: "Skills profile updated", sub: studentSkills.length > 0 ? `${studentSkills.length} skills found in profile` : "Add your verified skills in Profile" },
    { done: hasResume, label: "Resume uploaded", sub: hasResume ? "Resume ready for applications" : "Upload your resume in Profile" },
    { done: !!cgpa && cgpa > 0, label: "CGPA recorded", sub: cgpa > 0 ? `CGPA: ${cgpa}` : "Update your academic details" },
    { done: !!degree, label: "Degree information complete", sub: degree ? `Degree: ${degree}` : "Add degree information" },
  ];

  const readinessScore = Math.round((checklistItems.filter((c) => c.done).length / checklistItems.length) * 100);

  return (
    <div className="space-y-6">
      {/* Readiness Banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg"
        style={{ background: "linear-gradient(135deg, #0d1f4e 0%, #1a3884 60%, #2a52b0 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 10% 20%, white 1px, transparent 1px), radial-gradient(circle at 90% 80%, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-300" />
              <span className="text-[11px] font-black uppercase tracking-widest text-blue-300">AI Student Prep Kit</span>
            </div>
            <h3 className="text-2xl font-black leading-tight">
              Fair Readiness: {readinessScore}%
            </h3>
            <p className="text-sm text-blue-100/90 font-medium max-w-xl">
              {topMatches.length > 0
                ? `You're a strong match for ${topMatches.length} compan${topMatches.length === 1 ? "y" : "ies"} attending this fair.`
                : "Complete your profile checklist below to maximize recruiter interest."}
            </p>
          </div>

          <div className="relative w-16 h-16 shrink-0 self-center sm:self-auto">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke="white"
                strokeWidth="5"
                strokeDasharray={`${(readinessScore / 100) * 138.23} 138.23`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-white">
              {readinessScore}%
            </span>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${readinessScore}%` }} />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="rounded-2xl border p-5 bg-white dark:bg-[#001630] border-[#d8e6f7] dark:border-[#1a3884]/20 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 size={16} className="text-[#1a3884] dark:text-[#4f7dff]" />
          <h4 className="text-sm font-black text-gray-900 dark:text-white">Fair Day Checklist</h4>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">Ensure your profile is ready before applying or speaking to recruiters</p>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {checklistItems.map((item, i) => (
            <PrepCheckItem key={i} {...item} />
          ))}
        </div>
      </div>

      {/* Company Recommendations */}
      {entities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#1a3884] dark:text-[#4f7dff]" />
              <h4 className="text-sm font-black text-gray-900 dark:text-white">Company Match Recommendations</h4>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#1a3884]/8 dark:bg-[#1a3884]/25 text-[#1a3884] dark:text-[#4f7dff]">
                {entities.length}
              </span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-[11px] font-bold border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-[#001430] text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="match">Best Match First</option>
              <option value="jobs">Most Roles First</option>
            </select>
          </div>

          <div className="grid gap-3">
            {entities.map((entity, i) => (
              <CompanyMatchCard
                key={entity.entityId || i}
                entity={entity}
                studentSkills={studentSkills}
                cgpa={cgpa}
              />
            ))}
          </div>
        </div>
      )}

      {/* Skill tip */}
      {studentSkills.length < 5 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
          <Zap size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Boost your match score</p>
            <p className="text-[12px] text-amber-700/90 dark:text-amber-400 mt-0.5">
              You have {studentSkills.length} skill{studentSkills.length !== 1 ? "s" : ""} in your profile. Adding more verified skills will increase your matching accuracy with company requirements.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPrepKit;
