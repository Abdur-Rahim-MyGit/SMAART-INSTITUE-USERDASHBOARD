import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2, Briefcase, Globe, Mail, MapPin,
  IndianRupee, GraduationCap, ChevronRight, Search,
  ExternalLink, Sparkles
} from "lucide-react";
import { getBackendUrl } from "@/services/api";

const ACCENTS = [
  { from: "#0d1f4e", to: "#1a3884" },
  { from: "#0f3a6e", to: "#1d5bb0" },
  { from: "#122a59", to: "#24499e" },
  { from: "#0e4375", to: "#2176cc" },
];

const paletteFor = (name = "") => {
  const h = name.split("").reduce((a, c) => c.charCodeAt(0) + a, 0);
  return ACCENTS[h % ACCENTS.length];
};

const initials = (name = "") =>
  name.trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";

const isLive = (status) => !status || ["active", "open", "live", "published"].includes(String(status).toLowerCase());

const CompanyShowcaseCards = ({ fair }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCompanies, setExpandedCompanies] = useState({});

  const toggleExpand = (id) => {
    setExpandedCompanies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const jobs = Array.isArray(fair?.jobs) ? fair.jobs : [];
  const boothAssignments = Array.isArray(fair?.boothAssignments) ? fair.boothAssignments : [];

  // Group all jobs by participating company
  const companies = useMemo(() => {
    const map = new Map();

    jobs.forEach((job) => {
      const entityId =
        (job.company?._id && String(job.company._id)) ||
        (job.company && typeof job.company === "string" && job.company) ||
        (job.postedByRecruiter?._id && String(job.postedByRecruiter._id)) ||
        (job.postedByRecruiter && typeof job.postedByRecruiter === "string" && job.postedByRecruiter) ||
        job.displayCompany ||
        "unknown";

      const companyName = job.displayCompany || (typeof job.company === "object" ? job.company?.name : null) || "Unknown Company";
      const rawLogo = job.displayCompanyLogo || (typeof job.company === "object" ? job.company?.logo : null) || job.companyLogo;
      const logoUrl = rawLogo
        ? rawLogo.startsWith("http") || rawLogo.startsWith("data:")
          ? rawLogo
          : `${getBackendUrl()}/${rawLogo.replace(/^\/+/, "")}`
        : null;

      if (!map.has(entityId)) {
        const booth = boothAssignments.find(
          (b) => String(b.entityId?._id || b.entityId) === String(entityId)
        );

        map.set(entityId, {
          id: entityId,
          name: companyName,
          logo: logoUrl,
          website: job.displayCompanyWebsite || (typeof job.company === "object" ? job.company?.website : null) || null,
          email: job.companyEmail || (typeof job.company === "object" ? job.company?.email : null) || null,
          industry: job.industry || (typeof job.company === "object" ? job.company?.industry : null) || "Technology & Services",
          boothNumber: booth?.boothNumber || null,
          jobs: [],
        });
      }

      map.get(entityId).jobs.push(job);
    });

    return [...map.values()].sort((a, b) => {
      if (a.boothNumber && !b.boothNumber) return -1;
      if (!a.boothNumber && b.boothNumber) return 1;
      return b.jobs.length - a.jobs.length;
    });
  }, [jobs, boothAssignments]);

  // Filter companies based on search
  const filteredCompanies = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.jobs.some((j) => (j.displayTitle || j.title || "").toLowerCase().includes(q))
    );
  }, [companies, searchTerm]);

  if (companies.length === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-[#1a3884]/30 dark:bg-[#001630]">
        <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-[#0d1f4e] dark:text-white">
          No companies registered yet
        </h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
          Participating companies and their showcases will appear here once jobs are published for this fair.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Overview Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[#1a3884] dark:text-blue-400" />
          <h2 className="text-[15px] font-semibold text-[#0d1f4e] dark:text-white">
            Participating Companies
          </h2>
          <span className="rounded-md bg-[#eef2fb] px-2 py-[2px] text-[11px] font-bold text-[#1a3884] dark:bg-[#1a3884]/30 dark:text-blue-300">
            {filteredCompanies.length}
          </span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search company or role…"
            className="h-9 w-full rounded-lg border border-[#d8e6f7] bg-white pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#1a3884] focus:ring-1 focus:ring-[#1a3884]/20 dark:border-[#1a3884]/30 dark:bg-[#001026] dark:text-white"
          />
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid gap-5 grid-cols-1">
        {filteredCompanies.map((comp) => {
          const { from, to } = paletteFor(comp.name);
          const activeJobs = comp.jobs.filter((j) => isLive(j.displayStatus || j.status));
          const isExpanded = expandedCompanies[comp.id] ?? true;

          return (
            <motion.div
              key={comp.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="group rounded-2xl border border-[#d8e6f7] bg-white shadow-sm transition-all hover:shadow-[0_4px_20px_rgba(26,56,132,0.08)] dark:border-[#1a3884]/25 dark:bg-[#001430] overflow-hidden"
            >
              {/* Top Gradient Banner */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#0d1f4e] via-[#1a3884] to-[#4f7dff]" />

              <div className="p-5 sm:p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Logo / Monogram */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#d8e6f7] bg-white p-1.5 shadow-sm dark:border-[#1a3884]/30 dark:bg-[#001026]">
                      {comp.logo ? (
                        <img
                          src={comp.logo}
                          alt={comp.name}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center rounded-lg text-sm font-bold text-white shadow-inner"
                          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                        >
                          {initials(comp.name)}
                        </div>
                      )}
                    </div>

                    {/* Company Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-[#0d1f4e] dark:text-white truncate">
                          {comp.name}
                        </h3>
                        {comp.boothNumber && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#1a3884]/10 px-2 py-0.5 text-[11px] font-bold text-[#1a3884] dark:bg-blue-400/20 dark:text-blue-300">
                            <MapPin className="h-3 w-3" /> Booth {comp.boothNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>{comp.industry}</span>
                        {comp.website && (
                          <a
                            href={comp.website.startsWith("http") ? comp.website : `https://${comp.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-[#1a3884] hover:underline dark:text-blue-400 truncate max-w-xs"
                          >
                            <Globe className="h-3 w-3" />
                            {comp.website.replace(/^https?:\/\//, "")}
                            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                          </a>
                        )}
                        {comp.email && (
                          <a
                            href={`mailto:${comp.email}`}
                            className="inline-flex items-center gap-1 font-medium text-[#1a3884] hover:underline dark:text-blue-400"
                          >
                            <Mail className="h-3 w-3" />
                            {comp.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Pill */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
                      {activeJobs.length} Active {activeJobs.length === 1 ? "Role" : "Roles"}
                    </span>
                  </div>
                </div>

                {/* Open Positions Section */}
                <div className="mt-5 border-t border-[#d8e6f7] pt-4 dark:border-[#1a3884]/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Open Positions ({comp.jobs.length})
                    </span>
                    <button
                      onClick={() => toggleExpand(comp.id)}
                      className="text-xs font-semibold text-[#1a3884] hover:underline dark:text-blue-400"
                    >
                      {isExpanded ? "Collapse" : "Expand"}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                      {comp.jobs.map((job) => {
                        const title = job.displayTitle || job.title;
                        const salary = job.displaySalary || job.salaryPackage;
                        const jobType = job.displayType || job.jobType;
                        const location = job.displayLocation || job.location;
                        const minCGPA = job.eligibility?.minCGPA || 0;
                        const isClosed = ["closed", "filled", "cancelled"].includes(
                          String(job.displayStatus || job.status).toLowerCase()
                        );

                        return (
                          <div
                            key={job._id}
                            className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:border-[#1a3884]/40 hover:bg-[#f5f8ff] dark:border-[#1a3884]/20 dark:bg-[#001026]/70 dark:hover:bg-[#001630]"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-[13.5px] font-bold text-[#0d1f4e] dark:text-white leading-snug">
                                  {title}
                                </h4>
                                <span
                                  className={`shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${
                                    isClosed
                                      ? "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                      : "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  }`}
                                >
                                  {isClosed ? "Closed" : "Active"}
                                </span>
                              </div>

                              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                                {salary && (
                                  <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                    <IndianRupee className="h-3 w-3" />
                                    {salary}
                                  </span>
                                )}
                                {jobType && (
                                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                                    {jobType}
                                  </span>
                                )}
                                {location && (
                                  <span className="text-slate-500 dark:text-slate-400">
                                    📍 {location}
                                  </span>
                                )}
                                {minCGPA > 0 && (
                                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                    <GraduationCap className="h-3 w-3" />
                                    CGPA ≥ {minCGPA}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-end border-t border-slate-200/50 pt-2.5 dark:border-slate-800">
                              <button
                                onClick={() =>
                                  !isClosed &&
                                  navigate(`/dashboard/placement/${job.sourceCollection}/${job._id}`, {
                                    state: { job },
                                  })
                                }
                                disabled={isClosed}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                  isClosed
                                    ? "cursor-not-allowed text-slate-400"
                                    : "bg-[#0d1f4e] text-white hover:bg-[#1a3884] active:scale-[0.98] dark:bg-[#1a3884] dark:hover:bg-[#24499e]"
                                }`}
                              >
                                {isClosed ? "Closed" : "View & Apply"}
                                {!isClosed && <ChevronRight className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CompanyShowcaseCards;
