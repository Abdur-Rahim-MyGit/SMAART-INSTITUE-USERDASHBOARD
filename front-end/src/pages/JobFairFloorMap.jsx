import React, { useState, useEffect } from 'react';
import {
  MapPin, Building2, Briefcase, Globe, Mail,
  X, IndianRupee, RotateCcw, AlertCircle, ZoomIn, ZoomOut,
  GraduationCap, Users, DoorOpen
} from 'lucide-react';

/* ── helpers ─────────────────────────────────────────────────────────────── */

// Booth tiles are a FIXED size rather than stretching to fill their row.
const TILE = 132;

const ACCENTS = ['#1a3884', '#1d4ed8', '#0f766e', '#4338ca', '#0369a1', '#5b21b6', '#155e75'];

const accentFor = (name = '') => {
  const h = name.split('').reduce((a, c) => c.charCodeAt(0) + a, 0);
  return ACCENTS[h % ACCENTS.length];
};

const initials = (name = '') =>
  name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

const companyNameOf = (company) =>
  company?.name || company?.fullName || company?.qualification || 'Unknown Company';

const isLive = (status) => !status || ['active', 'open', 'live', 'published'].includes(String(status).toLowerCase());

/* ── CompanyShowcasePanel ────────────────────────────────────────────────── */
const CompanyShowcasePanel = ({ booth, onClose, isDark }) => {
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!booth) return null;

  const { company, jobs = [], boothNumber } = booth;
  const name = companyNameOf(company);
  const accent = accentFor(name);
  const activeJobs = jobs.filter(j => isLive(j.displayStatus || j.status));

  const surface = isDark ? '#00152e' : '#ffffff';
  const border = isDark ? 'rgba(79,125,255,0.18)' : 'rgba(15,23,42,0.08)';
  const subtle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.025)';
  const heading = isDark ? '#ffffff' : '#0f172a';
  const muted = isDark ? 'rgba(148,163,184,0.85)' : '#64748b';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: isDark ? 'rgba(2,6,23,0.7)' : 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} booth details`}
    >
      <div
        className="relative w-full max-w-md flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: surface,
          border: `1px solid ${border}`,
          boxShadow: '0 24px 60px rgba(15,23,42,0.28)',
          maxHeight: '85vh'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div className="shrink-0 px-5 py-4 flex items-start gap-3.5" style={{ borderBottom: `1px solid ${border}` }}>
          <div
            className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
            style={{
              background: company?.logo && !imgErr ? '#fff' : accent,
              border: `1px solid ${border}`
            }}
          >
            {company?.logo && !imgErr ? (
              <img src={company.logo} alt={name} onError={() => setImgErr(true)}
                className="w-full h-full object-contain p-1.5" />
            ) : (
              <span className="text-white font-bold text-base">{initials(name)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h2 className="text-[15px] font-bold leading-snug truncate" style={{ color: heading }} title={name}>
              {name}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {boothNumber && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: `${accent}14`, color: accent }}>
                  <MapPin size={9} /> Booth {boothNumber}
                </span>
              )}
              {company?.industry && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ background: subtle, color: muted }}>
                  {company.industry}
                </span>
              )}
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{
                  background: activeJobs.length ? 'rgba(16,185,129,0.12)' : subtle,
                  color: activeJobs.length ? '#059669' : muted
                }}>
                {activeJobs.length ? `${activeJobs.length} open` : 'No open roles'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-opacity hover:opacity-70"
            style={{ background: subtle, color: muted }}
          >
            <X size={14} />
          </button>
        </div>

        {/* contact */}
        {(company?.website || company?.email) && (
          <div className="shrink-0 px-5 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5"
            style={{ borderBottom: `1px solid ${border}` }}>
            {company.website && (
              <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium hover:underline truncate"
                style={{ color: accent }}>
                <Globe size={12} className="shrink-0" />
                {company.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            {company.email && (
              <a href={`mailto:${company.email}`}
                className="flex items-center gap-1.5 text-xs font-medium hover:underline truncate"
                style={{ color: accent }}>
                <Mail size={12} className="shrink-0" />
                {company.email}
              </a>
            )}
          </div>
        )}

        {/* positions */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: muted }}>
            Positions {jobs.length > 0 && `(${jobs.length})`}
          </p>

          {jobs.length > 0 ? (
            <div className="space-y-2">
              {jobs.map((job, i) => {
                const title = job.displayTitle || job.title;
                const status = job.displayStatus || job.status;
                const salary = job.displaySalary || job.salaryPackage;
                const type = job.displayType || job.jobType;
                const location = job.displayLocation || job.location;
                const minCGPA = job.eligibility?.minCGPA || 0;

                return (
                  <div key={job._id || i} className="rounded-xl px-3.5 py-3"
                    style={{ background: subtle, border: `1px solid ${border}` }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-[13px] leading-snug" style={{ color: heading }}>
                        {title}
                      </p>
                      <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide"
                        style={{
                          background: isLive(status) ? 'rgba(16,185,129,0.12)' : subtle,
                          color: isLive(status) ? '#059669' : muted
                        }}>
                        {isLive(status) ? 'Live' : status || 'N/A'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                      {salary && (
                        <span className="flex items-center gap-0.5 text-[11px] font-semibold" style={{ color: '#059669' }}>
                          <IndianRupee size={9} />{salary}
                        </span>
                      )}
                      {type && (
                        <span className="text-[11px]" style={{ color: muted }}>{type}</span>
                      )}
                      {location && (
                        <span className="text-[11px]" style={{ color: muted }}>{location}</span>
                      )}
                      {minCGPA > 0 && (
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: muted }}>
                          <GraduationCap size={10} /> CGPA {minCGPA}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 rounded-xl text-center"
              style={{ background: subtle, border: `1px dashed ${border}` }}>
              <Briefcase size={18} style={{ color: muted, opacity: 0.6 }} />
              <p className="text-xs font-medium mt-2" style={{ color: muted }}>No positions posted yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── BoothTile ───────────────────────────────────────────────────────────── */
const BoothTile = ({ booth, isDark, onSelect }) => {
  const [imgErr, setImgErr] = useState(false);
  const { company, jobs = [], boothNumber } = booth;
  const name = companyNameOf(company);
  const isEmpty = !company;
  const accent = accentFor(name);
  const activeJobs = jobs.filter(j => isLive(j.displayStatus || j.status));

  if (isEmpty) {
    return (
      <div
        className="rounded-xl flex flex-col items-center justify-center gap-0.5"
        style={{
          width: TILE,
          height: TILE,
          background: isDark ? 'rgba(148,163,184,0.03)' : 'rgba(148,163,184,0.05)',
          border: `1px dashed ${isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.35)'}`
        }}
      >
        {boothNumber && (
          <span className="text-[10px] font-bold" style={{ color: isDark ? 'rgba(148,163,184,0.4)' : '#94a3b8' }}>
            {boothNumber}
          </span>
        )}
        <span className="text-[10px]" style={{ color: isDark ? 'rgba(148,163,184,0.3)' : '#cbd5e1' }}>
          Available
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(booth)}
      title={`${name}${boothNumber ? ` — Booth ${boothNumber}` : ''}`}
      className="group rounded-xl flex flex-col items-center justify-center gap-2 px-2.5 relative transition-transform duration-150 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#1a3884]"
      style={{
        width: TILE,
        height: TILE,
        background: isDark ? '#0a1a3a' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(79,125,255,0.2)' : 'rgba(15,23,42,0.1)'}`,
        boxShadow: isDark ? 'none' : '0 1px 3px rgba(15,23,42,0.06)'
      }}
    >
      {boothNumber && (
        <span className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{
            background: `${accent}12`,
            color: accent
          }}>
          {boothNumber}
        </span>
      )}

      {activeJobs.length > 0 && (
        <span className="absolute top-2 right-2 flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(16,185,129,0.12)', color: '#059669' }}>
          <Briefcase size={8} />{activeJobs.length}
        </span>
      )}

      <div className="w-11 h-11 rounded-lg flex items-center justify-center overflow-hidden mt-3"
        style={{
          background: company?.logo && !imgErr ? (isDark ? '#fff' : '#f8fafc') : accent,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)'}`
        }}>
        {company?.logo && !imgErr ? (
          <img src={company.logo} alt={name} onError={() => setImgErr(true)}
            className="w-full h-full object-contain p-1" />
        ) : (
          <span className="text-white font-bold text-sm">{initials(name)}</span>
        )}
      </div>

      <p className="text-[11px] font-semibold leading-tight line-clamp-2 text-center w-full"
        style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
        {name}
      </p>
    </button>
  );
};

/* ── Main component ──────────────────────────────────────────────────────── */
const JobFairFloorMap = ({ fair, isDark }) => {
  const [selectedBooth, setSelectedBooth] = useState(null);
  const [zoom, setZoom] = useState(1);

  if (!fair) return null;

  const jobs = Array.isArray(fair.jobs) ? fair.jobs : [];
  const boothAssignments = Array.isArray(fair.boothAssignments) ? fair.boothAssignments : [];

  // Group jobs by company entity
  const entityMap = new Map();
  jobs.forEach(job => {
    const entityId =
      (job.company?._id && String(job.company._id)) ||
      (job.company && typeof job.company === 'string' && job.company) ||
      (job.postedByRecruiter?._id && String(job.postedByRecruiter._id)) ||
      (job.postedByRecruiter && typeof job.postedByRecruiter === 'string' && job.postedByRecruiter) ||
      job.displayCompany;

    if (!entityId) return;

    if (!entityMap.has(entityId)) {
      const booth = boothAssignments.find(
        b => String(b.entityId?._id || b.entityId) === String(entityId)
      );
      entityMap.set(entityId, {
        entityId,
        boothNumber: booth?.boothNumber || null,
        company: {
          name: job.displayCompany || 'Unknown Company',
          logo: job.displayCompanyLogo || null,
          website: job.displayCompanyWebsite || null,
          industry: job.industry || null,
          email: job.companyEmail || null
        },
        jobs: []
      });
    }
    entityMap.get(entityId).jobs.push(job);
  });

  const booths = [...entityMap.values()].sort((a, b) => {
    if (a.boothNumber && !b.boothNumber) return -1;
    if (!a.boothNumber && b.boothNumber) return 1;
    return 0;
  });

  const panelBg = isDark ? 'rgba(148,163,184,0.05)' : '#f8fafc';
  const panelBorder = isDark ? 'rgba(79,125,255,0.15)' : 'rgba(15,23,42,0.07)';

  if (booths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[240px] gap-2.5 text-center px-6">
        <Building2 size={26} className="text-slate-300 dark:text-slate-600" />
        <p className="text-sm font-semibold text-gray-900 dark:text-white">No companies added yet</p>
        <p className="text-xs text-slate-400 max-w-xs">Companies and their booths will appear here once registered.</p>
      </div>
    );
  }

  const occupiedCount = booths.filter(b => b.company).length;
  const registeredCount = fair.registeredStudents?.length || 0;

  // Grid sizing: center booths, max 5 cols, fixed TILE width
  const cols = Math.min(Math.max(booths.length, 1), 5);
  const rows = [];
  for (let i = 0; i < booths.length; i += cols) rows.push(booths.slice(i, i + cols));
  const midRow = Math.floor(rows.length / 2);
  const showAisle = rows.length > 2;

  const stats = [
    { label: 'Companies', value: occupiedCount, icon: Building2 },
    { label: 'Positions', value: jobs.length, icon: Briefcase },
    { label: 'Registered', value: registeredCount, icon: Users }
  ];

  return (
    <>
      <div className="space-y-3">
        {/* Single-line Header Stats & Zoom Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={14} className="text-slate-400 shrink-0" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {[
              { icon: ZoomOut, action: () => setZoom(z => Math.max(0.6, +(z - 0.1).toFixed(1))), title: 'Zoom out' },
              { icon: RotateCcw, action: () => setZoom(1), title: 'Reset zoom' },
              { icon: ZoomIn, action: () => setZoom(z => Math.min(1.6, +(z + 0.1).toFixed(1))), title: 'Zoom in' },
            ].map(({ icon: Icon, action, title }) => (
              <button key={title} onClick={action} title={title} aria-label={title}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#1a3884] dark:hover:text-[#4f7dff] transition-colors"
                style={{ background: panelBg, border: `1px solid ${panelBorder}` }}>
                <Icon size={12} />
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded"
              style={{ background: isDark ? '#0a1a3a' : '#fff', border: `1px solid ${isDark ? 'rgba(79,125,255,0.3)' : 'rgba(15,23,42,0.15)'}` }} />
            Occupied
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded border border-dashed border-slate-300 dark:border-slate-600" />
            Available
          </span>
        </div>

        {/* Floor Map Canvas */}
        <div className="overflow-auto rounded-xl"
          style={{
            background: isDark ? 'rgba(2,10,30,0.5)' : '#f8fafc',
            border: `1px solid ${panelBorder}`,
            maxHeight: 460
          }}>
          <div style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease',
            padding: '24px'
          }}>
            {/* Slim Stage Marker */}
            <div className="flex justify-center mb-5">
              <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md"
                style={{
                  background: isDark ? 'rgba(79,125,255,0.1)' : 'rgba(26,56,132,0.06)',
                  color: isDark ? '#93b4ff' : '#1a3884'
                }}>
                Stage
              </span>
            </div>

            {/* Grid */}
            <div className="space-y-3">
              {rows.map((row, rIdx) => (
                <React.Fragment key={rIdx}>
                  {showAisle && rIdx === midRow && (
                    <div className="flex items-center gap-2.5 py-1">
                      <div className="flex-1 border-t border-dashed" style={{ borderColor: panelBorder }} />
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400">Aisle</span>
                      <div className="flex-1 border-t border-dashed" style={{ borderColor: panelBorder }} />
                    </div>
                  )}

                  <div className="grid gap-3 justify-center"
                    style={{ gridTemplateColumns: `repeat(${cols}, ${TILE}px)` }}>
                    {row.map((booth, bIdx) => (
                      <BoothTile
                        key={booth.entityId || `empty-${rIdx}-${bIdx}`}
                        booth={booth}
                        isDark={isDark}
                        onSelect={setSelectedBooth}
                      />
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Entrance Marker */}
            <div className="flex items-center justify-center gap-2 mt-5">
              <DoorOpen size={12} className="text-slate-400" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Entrance</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Select a booth to view the company profile and its open roles.
        </p>
      </div>

      {selectedBooth && (
        <CompanyShowcasePanel
          booth={selectedBooth}
          isDark={isDark}
          onClose={() => setSelectedBooth(null)}
        />
      )}
    </>
  );
};

export default JobFairFloorMap;
