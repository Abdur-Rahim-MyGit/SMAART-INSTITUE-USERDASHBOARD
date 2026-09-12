import './careerAgent.css';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import PageTransition from '@/components/PageTransition';
import NeuralBackground from '@/components/ui/NeuralBackground';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import {
  GraduationCap,
  Target,
  ShieldCheck,
  CheckCircle,
  Compass,
  Search,
  Trophy,
  Sparkles,
  Lock,
  ChevronDown,
  Check,
  Info,
  Star,
  X,
  ArrowRight,
  IconArrowLeft as ArrowLeft
} from '@/components/icons';
import dropdownData from './data/dropdownData.json';
import jobRolesData from './data/jobRolesData.json';
import indianCities from './data/indianCities.json';
import useUser from '@/hooks/useUser';
import { useTranslation } from 'react-i18next';
import { fetchLockStatus } from '@/services/CareerLockService';

// Constants
const SALARY_OPTIONS = [
  '0-3 LPA', '3-5 LPA', '5-8 LPA', '8-12 LPA', '12-18 LPA', '18-25 LPA', '25+ LPA'
];
const JOB_TYPE_OPTIONS = [
  'Full-Time', 'Part-Time', 'Internship (Full-Time)', 'Internship (Part-Time)',
  'Freelance / Gig Work', 'Remote (Fully Distributed)'
];
const EXP_TYPE_OPTIONS = [
  'Full-Time', 'Part-Time', 'Internship (Full-Time)', 'Internship (Part-Time)',
  'Freelance / Gig Work', 'Remote (Fully Distributed)', 'Volunteering'
];
const ORG_TYPE_OPTIONS = [
  'Startup (Early-stage / Growth-stage)', 'Scale-up / High-growth company',
  'Small or Medium Enterprise (SME)', 'Large Indian Corporate / Conglomerate',
  'Multinational Corporation (MNC)', 'Government / Public Sector Organization',
  'Non-Profit / NGO / Social Enterprise', 'Academic / Research Institution',
  'Consulting / Professional Services Firm', 'Family-owned Business',
  'Self-employed / Entrepreneurial Venture', 'Open to any organization type', 'Other / Custom'
];
const VERIFY_OPTIONS = ['URL', 'QR Code', 'Not Verified'];
const CERT_YEARS = Array.from({ length: 31 }, (_, i) => (2010 + i).toString());

// Build comprehensive sector list from jobRolesData
const ALL_SECTORS = [...Object.keys(dropdownData.jobs || {}), 'Other / Custom'];
// Build family options per sector
const getFamilies = (sector) => sector ? Object.keys(dropdownData.jobs[sector] || {}) : [];
const getRoles = (sector, family) => {
  if (!sector || !family) return [];
  return dropdownData.jobs[sector]?.[family] || [];
};
// All roles flattened for free-text search
const ALL_ROLES = jobRolesData.roles.map(r => r.role);

const STEPS = ['Overview', 'Education', 'Primary Preference', 'Secondary Preference', 'Tertiary Preference', 'Review & Submit'];
const STEP_DISPLAY_LABELS = ['Overview', 'Education', 'Primary', 'Secondary', 'Tertiary', 'Review'];

const createEmptyValidationState = () => ({ messages: [], fields: {} });


// MultiSelect — clean open chip grid, no scrollbox
function MultiSelect({ options, selected = [], onChange, max = 3, placeholder, disabled = false }) {
  const { t } = useTranslation();

  const toggle = (opt) => {
    if (disabled) return;
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else if (selected.length < max) {
      onChange([...selected, opt]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="ob-label-row">
        <span className="ob-help">
          {selected.length === 0
            ? (placeholder || t('career_agent.onboarding.select_placeholder', 'Select...'))
            : t('career_agent.onboarding.select_up_to', 'Select up to {{count}}.', { count: max })}
        </span>
        <span className="ob-label-right">{selected.length} / {max} {t('career_agent.onboarding.selected', 'selected')}</span>
      </div>

      {/* Selected options stay highlighted in place; once locked/disabled only
          the selected ones are shown — a locked field should read as what was
          auto-filled, not as a browsable list. */}
      {disabled ? (
        selected.length === 0 ? (
          <p className="ob-help" style={{ fontStyle: 'italic' }}>
            {t('career_agent.onboarding.no_specialisation_on_file', 'No specialisation on file.')}
          </p>
        ) : (
          <div className="ob-pills">
            {selected.map(s => <span key={s} className="ob-pill selected">{s}</span>)}
          </div>
        )
      ) : options.length > 0 ? (
        <div className="ob-pills">
          {options.map(opt => {
            const isSel = selected.includes(opt);
            const isDisabled = !isSel && selected.length >= max;
            return (
              <button
                key={opt} type="button"
                onClick={() => toggle(opt)}
                disabled={isDisabled}
                className={`ob-pill${isSel ? ' selected' : ''}`}
              >
                {isSel && <Check size={14} />}
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="ob-help" style={{ fontStyle: 'italic' }}>
          {t('career_agent.onboarding.select_degree_first', 'Select a degree group to view available specialisations.')}
        </p>
      )}
    </div>
  );
}

// LockedField — read-only display for auto-filled, non-editable values.
// Deliberately NOT a disabled <select>/<input>: a disabled native control
// still renders its dropdown arrow / input chrome, which looks editable even
// though it isn't. This renders as plain locked text instead, with a small
// lock icon, so it's visually unambiguous that nothing here can be changed.
function LockedField({ value, placeholder }) {
  return (
    <div className={`ob-locked${value ? '' : ' empty'}`}>
      <span>{value || placeholder}</span>
      <span className="ob-lock-ic"><Lock size={14} /></span>
    </div>
  );
}

// CardHead — the header strip of every step card: icon tile, title, subtitle, step chip.
function CardHead({ icon, title, subtitle, step }) {
  return (
    <div className="ob-card-head">
      <div className="ob-card-head-l">
        <div className="ob-tile">{icon}</div>
        <div style={{ minWidth: 0 }}>
          <div className="ob-card-title">{title}</div>
          <p className="ob-card-sub">{subtitle}</p>
        </div>
      </div>
      <span className="step-tag">{step}</span>
    </div>
  );
}

// Eyebrow — section heading: accent bar, micro-caps label, hairline, optional right slot.
function Eyebrow({ children, right = null }) {
  return (
    <div className="ob-eyebrow">
      <span className="ob-eyebrow-text">{children}</span>
      <span className="ob-eyebrow-rule" />
      {right}
    </div>
  );
}

// RoleSearchInput — Dropdown with search bar containing all DB job roles
function RoleSearchInput({ value, onChange, sector, family, dbRoles = [], disabled = false }) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState(value || '');
  const ref = useRef(null);

  const sectorRoles = getRoles(sector, family);
  const pool = useMemo(() => {
    const list = dbRoles.length > 0 ? dbRoles : (sectorRoles.length > 0 ? sectorRoles : ALL_ROLES);
    return Array.from(new Set(list)).filter(Boolean);
  }, [dbRoles, sectorRoles]);

  const filtered = useMemo(() => {
    if (!query.trim()) return pool.slice(0, 60);
    const q = query.toLowerCase().trim();
    return pool.filter(r => typeof r === 'string' && r.toLowerCase().includes(q)).slice(0, 60);
  }, [pool, query]);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery('');
    onChange('');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          placeholder={disabled ? t('career_agent.onboarding.role_disabled_msg', 'Disabled — Career Direction selected above') : t('career_agent.onboarding.role_placeholder', 'Type or search a job role from database...')}
          value={query}
          disabled={disabled}
          onChange={e => {
            if (disabled) return;
            const val = e.target.value;
            setQuery(val);
            onChange(val);
            setShow(true);
          }}
          onFocus={() => { if (!disabled) setShow(true); }}
          style={{
            width: '100%',
            paddingRight: '2.5rem',
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
            backgroundColor: disabled ? 'rgba(0,0,0,0.04)' : 'transparent'
          }}
        />
        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear role"
            style={{
              position: 'absolute', right: '2rem', background: 'none', border: 'none',
              color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center',
              padding: '0.3rem', fontSize: '0.9rem', fontWeight: 'bold'
            }}
          >
            ×
          </button>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() => { if (!disabled) setShow(prev => !prev); }}
          style={{
            position: 'absolute', right: '0.75rem', background: 'none', border: 'none',
            color: 'var(--muted)', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
            padding: '0.3rem', opacity: disabled ? 0.5 : 1
          }}
        >
          <ChevronDown size={16} style={{ transform: show ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {disabled && (
        <p className="ob-help" style={{ marginTop: '6px' }}>
          {t('career_agent.onboarding.role_disabled_help', 'Clear the career direction above to type a role instead.')}
        </p>
      )}

      {show && !disabled && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 90,
            background: '#ffffff', border: '1px solid #d7ebf5', borderRadius: '10px',
            boxShadow: '0 12px 40px rgba(15,23,42,0.12)', maxHeight: '240px', overflowY: 'auto',
            marginTop: '6px', padding: '0.35rem 0'
          }}
        >
          <div style={{ padding: '0.45rem 0.9rem', fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', background: 'rgba(var(--accent-rgb), 0.05)', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('career_agent.onboarding.database_roles', 'Database Job Roles')}</span>
            <span>{pool.length} {t('career_agent.onboarding.available', 'available')}</span>
          </div>

          {filtered.length > 0 ? (
            filtered.map(r => {
              const isSelected = value === r;
              return (
                <div
                  key={r}
                  onClick={() => {
                    setQuery(r);
                    onChange(r);
                    setShow(false);
                  }}
                  style={{
                    padding: '0.65rem 1.1rem', cursor: 'pointer', fontSize: '0.85rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--accent)' : '#334155',
                    background: isSelected ? 'rgba(var(--accent-rgb), 0.08)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{r}</span>
                  {isSelected && <Check size={14} color="var(--accent)" />}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '0.8rem 1.1rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
              {t('career_agent.onboarding.no_matching_roles', 'No matching DB roles found. Your custom role will be used.')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// CitySearchInput — browsable + searchable, mirrors RoleSearchInput's UX:
// clicking the field (or the chevron) reveals the list immediately, typing
// narrows it. Backed by every district across all 36 Indian states/UTs
// (derived from the same postal dataset used in Profile/Signup), not just a
// curated metro shortlist — see data/indianCities.json.
function CitySearchInput({ selected = [], onChange, max = 3 }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  const cities = Array.isArray(indianCities) ? indianCities : (indianCities.cities || []);

  const available = useMemo(() => cities.filter(c => c && typeof c === 'string' && !selected.includes(c)), [cities, selected]);
  const filtered = useMemo(() => {
    if (!query.trim()) return available.slice(0, 60);
    const q = query.toLowerCase().trim();
    return available.filter(c => c.toLowerCase().includes(q)).slice(0, 60);
  }, [available, query]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const atLimit = selected.length >= max;

  const add = (city) => {
    if (!selected.includes(city) && selected.length < max) {
      onChange([...selected, city]);
    }
    setQuery('');
    if (selected.length + 1 >= max) setShow(false);
  };
  const remove = (city) => onChange(selected.filter(c => c !== city));

  return (
    <div ref={ref}>
      <div className="tags" style={{ marginBottom: '0.4rem' }}>
        {selected.map(c => (
          <span key={c} className="tag">{c} <button type="button" onClick={() => remove(c)}>x</button></span>
        ))}
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input type="text" placeholder={atLimit ? t('career_agent.onboarding.location_limit_reached', 'Limit reached — remove a city to add another') : t('career_agent.onboarding.search_city_placeholder', 'Search city...')} value={query}
          onChange={e => { setQuery(e.target.value); setShow(true); }}
          onFocus={() => { if (!atLimit) setShow(true); }}
          disabled={atLimit}
          style={{ width: '100%', paddingRight: '2.5rem', opacity: atLimit ? 0.5 : 1 }}
        />
        <button
          type="button"
          disabled={atLimit}
          onClick={() => { if (!atLimit) setShow(prev => !prev); }}
          style={{
            position: 'absolute', right: '0.75rem', background: 'none', border: 'none',
            color: 'var(--muted)', cursor: atLimit ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
            padding: '0.3rem', opacity: atLimit ? 0.5 : 1
          }}
        >
          <ChevronDown size={16} style={{ transform: show ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </button>
        {show && !atLimit && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#ffffff', border: '1px solid #d7ebf5', borderRadius: '10px', boxShadow: '0 12px 40px rgba(15,23,42,0.12)', maxHeight: '220px', overflowY: 'auto', marginTop: '6px' }}>
            {filtered.length > 0 ? filtered.map(c => (
              <div key={c} onClick={() => add(c)}
                style={{ padding: '0.7rem 1.1rem', cursor: 'pointer', fontSize: '0.85rem', color: '#334155', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >{c}</div>
            )) : (
              <div style={{ padding: '0.8rem 1.1rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                {t('career_agent.onboarding.no_matching_cities', 'No matching cities found.')}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="ob-help" style={{ marginTop: '6px' }}>{t('career_agent.onboarding.select_locations_limit', 'Select up to {{count}} locations', { count: max })} · {selected.length} / {max} {t('career_agent.onboarding.selected', 'selected')}</p>
    </div>
  );
}

// CareerDirectionSelector — searchable, grouped picker + preview panel.
// "Recommended for you" (matched to the student's own degree) comes first, then
// every other direction across ALL degrees, grouped Domain → Degree ·
// Specialisation so a student can see exactly where each one belongs. Nothing
// is blocked — any direction from any degree can be chosen.
function CareerDirectionSelector({ directions = [], browseGroups = [], selected = null, onChange, loading = false, excludeRoles = [], disabled = false }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const allSelectable = useMemo(
    () => [...directions, ...browseGroups.flatMap(g => g.degrees.flatMap(d => d.directions))],
    [directions, browseGroups]
  );

  const q = query.trim().toLowerCase();
  const matches = (dir, extra = '') => {
    if (!q) return true;
    const hay = [dir.directionName, dir.degreeAbbr, dir.degreeName, dir.specialisation, dir.domain, extra, ...(dir.roles || []).map(r => r.role)]
      .filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  };
  const recFiltered = directions.filter(d => matches(d));
  const groupsFiltered = browseGroups
    .map(g => ({
      ...g,
      degrees: g.degrees
        .map(d => ({ ...d, directions: d.directions.filter(dir => matches(dir, `${d.degreeLabel} ${d.degreeName} ${d.specialisation}`)) }))
        .filter(d => d.directions.length > 0)
    }))
    .filter(g => g.degrees.length > 0);
  const totalMatches = recFiltered.length + groupsFiltered.reduce((n, g) => n + g.degrees.reduce((m, d) => m + d.directions.length, 0), 0);

  if (loading) {
    return (
      <div className="ob-strip">
        <Search size={18} className="animate-pulse" />
        <p>{t('career_agent.onboarding.sourcing_intelligence', 'Loading career directions for your profile…')}</p>
      </div>
    );
  }

  if (allSelectable.length === 0) return null;

  const selectedDir = selected ? allSelectable.find(d => d.directionId === selected.directionId) : null;
  const isRecommended = !!selectedDir && directions.some(d => d.directionId === selectedDir.directionId);
  const availableRoles = selectedDir ? (selectedDir.roles || []).filter(r => !excludeRoles.includes(r.role)) : [];
  const metaLine = (dir) => [dir.degreeAbbr || dir.degreeName, dir.specialisation].filter(Boolean).join(' · ');

  const pick = (dir) => { onChange(dir); setOpen(false); setQuery(''); };

  const renderItem = (dir, showMeta = false) => {
    const isSel = selected?.directionId === dir.directionId;
    const roleCount = (dir.roles || []).length;
    const sub = showMeta && metaLine(dir)
      ? metaLine(dir)
      : t('career_agent.onboarding.role_count', '{{count}} roles', { count: roleCount });
    return (
      <button key={dir.directionId} type="button" className={`ob-picker-item${isSel ? ' selected' : ''}`} onClick={() => pick(dir)}>
        <span className="ob-picker-item-name">{dir.directionName}</span>
        <span className="ob-picker-item-sub">{sub}</span>
        {isSel && <Check size={16} />}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="ob-picker" ref={ref}>
        <button
          type="button"
          className={`ob-picker-trigger${open ? ' open' : ''}`}
          disabled={disabled}
          onClick={() => { if (!disabled) setOpen(o => !o); }}
        >
          {selectedDir ? (
            <span className="ob-picker-value">
              <span className="ob-picker-value-name">{selectedDir.directionName}</span>
              {isRecommended && <span className="ob-chip">{t('career_agent.onboarding.recommended', 'Recommended')}</span>}
            </span>
          ) : (
            <span className="ob-picker-placeholder">
              {disabled
                ? t('career_agent.onboarding.direction_disabled_msg', 'Disabled — a job role is typed below')
                : t('career_agent.onboarding.select_direction_placeholder', 'Select a career direction')}
            </span>
          )}
          <ChevronDown size={18} className="ob-picker-caret" />
        </button>

        {open && (
          <div className="ob-picker-pop">
            <div className="ob-picker-search">
              <Search size={16} />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('career_agent.onboarding.search_directions', 'Search directions, degrees or specialisations…')}
              />
              {query && (
                <button type="button" className="ob-picker-clear" onClick={() => setQuery('')} aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="ob-picker-list">
              {recFiltered.length > 0 && (
                <div className="ob-picker-group">
                  <div className="ob-picker-ghead">
                    <Star size={14} />
                    {t('career_agent.onboarding.recommended_for_you', 'Recommended for you')}
                    <span className="ob-chip">{recFiltered.length}</span>
                  </div>
                  {recFiltered.map(dir => renderItem(dir, true))}
                </div>
              )}
              {groupsFiltered.map(g => (
                <div key={g.domain} className="ob-picker-group">
                  <div className="ob-picker-ghead">
                    <Compass size={14} />
                    {g.domain}
                  </div>
                  {g.degrees.map(d => (
                    <div key={d.key}>
                      <div className="ob-picker-shead">
                        <GraduationCap size={14} />
                        <span>{d.degreeLabel}</span>
                        {d.specialisation && <span className="ob-picker-shead-spec">· {d.specialisation}</span>}
                      </div>
                      {d.directions.map(dir => renderItem(dir))}
                    </div>
                  ))}
                </div>
              ))}
              {totalMatches === 0 && (
                <div className="ob-picker-empty">
                  {t('career_agent.onboarding.no_direction_matches', 'No directions match "{{q}}"', { q: query })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {disabled && (
        <p className="ob-help">
          {t('career_agent.onboarding.direction_disabled_help', 'Disabled because a job role is typed below — clear it to pick a direction instead.')}
        </p>
      )}

      {/* Preview Panel — appears only when a direction is chosen */}
      {selectedDir && (
        <motion.div
          key={selectedDir.directionId}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="ob-panel"
        >
          <div className="ob-label-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <CheckCircle size={18} style={{ color: 'var(--ob-brand)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ob-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedDir.directionName}</div>
                {metaLine(selectedDir) && <div className="ob-help">{metaLine(selectedDir)}{isRecommended ? ` · ${t('career_agent.onboarding.recommended', 'Recommended')}` : ''}</div>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="btn-reset"
              style={{ height: 'auto', fontSize: '12px', color: 'var(--ob-muted)' }}
            >
              {t('career_agent.onboarding.clear', 'Clear')}
            </button>
          </div>

          {selectedDir.directionDescription && (
            <>
              <div className="ob-divider" />
              <p>{selectedDir.directionDescription}</p>
            </>
          )}

          {availableRoles.length > 0 && (
            <>
              <div className="ob-divider" />
              <div className="ob-label-row">
                <span className="fl">{t('career_agent.onboarding.core_entry_roles', 'Core entry roles')}</span>
                <span className="ob-label-right">{t('career_agent.onboarding.pick_target_role', 'Pick the role you are targeting')}</span>
              </div>
              <div className="ob-pills">
                {availableRoles.map((r, ri) => {
                  const isRoleSel = selected?.role === r.role;
                  return (
                    <button
                      key={ri}
                      type="button"
                      onClick={e => { e.stopPropagation(); onChange({ ...selectedDir, role: r.role }); }}
                      className={`ob-pill${isRoleSel ? ' selected' : ''}`}
                    >
                      {r.role}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}


function PrefBlock({ label, colorClass, data, onChange, directions = [], browseGroups = [], directionsLoading = false, dbRoles = [], excludeRoles = [], excludeDirections = [], fieldErrors = {} }) {
  const { t } = useTranslation();
  const sectors = ALL_SECTORS;
  const up = (field, val) => onChange({ ...data, [field]: val });

  const hasDirectionSelected = !!(data.careerDirection && (data.careerDirection.directionId || data.careerDirection.directionName));
  const hasCustomRoleEntered = !!(data.role && data.role.trim() && !hasDirectionSelected);

  // Recommended list minus whatever's already picked in another tier; browse
  // groups get the same exclusion applied to each group's direction list.
  const filteredDirections = directions.filter(d => !excludeDirections.includes(d.directionId));
  const filteredBrowseGroups = browseGroups
    .map(g => ({
      ...g,
      degrees: g.degrees
        .map(d => ({ ...d, directions: d.directions.filter(dir => !excludeDirections.includes(dir.directionId)) }))
        .filter(d => d.directions.length > 0)
    }))
    .filter(g => g.degrees.length > 0);
  const hasAnyDirectionOptions = filteredDirections.length > 0 || filteredBrowseGroups.length > 0;

  const fieldErrorClass = (key) => fieldErrors[key] ? 'field-error' : '';

  return (
    <div className="pref-block-card">

        {/* SECTION A: TARGET ROLE */}
        <div className="ob-section">
          <Eyebrow>01 &nbsp;{t('career_agent.onboarding.career_targeting', 'Career targeting')}</Eyebrow>
          {hasAnyDirectionOptions ? (
            <div className="fgrid">
              <div className="fg full">
                <label className="fl">{t('career_agent.onboarding.career_directions', 'Career direction')}</label>
                <CareerDirectionSelector
                  directions={filteredDirections}
                  browseGroups={filteredBrowseGroups}
                  selected={data.careerDirection || null}
                  excludeRoles={excludeRoles}
                  disabled={hasCustomRoleEntered}
                  onChange={dir => {
                    if (dir) {
                      onChange({
                        ...data,
                        careerDirection: dir,
                        careerDirectionId: dir?.directionId || '',
                        careerDirectionName: dir?.directionName || '',
                        careerDirectionDescription: dir?.directionDescription || '',
                        role: dir?.role || dir?.directionName || ''
                      });
                    } else {
                      onChange({
                        ...data,
                        careerDirection: null,
                        careerDirectionId: '',
                        careerDirectionName: '',
                        careerDirectionDescription: '',
                        role: ''
                      });
                    }
                  }}
                />
                {!hasDirectionSelected && !hasCustomRoleEntered && (
                  <p className="ob-help">{t('career_agent.onboarding.direction_help', 'Recommended directions are listed first — you can also search and pick any direction from any degree or specialisation.')}</p>
                )}
              </div>

              {/* OR Divider */}
              <div className="fg full ob-or">
                <span className="ob-chip neutral">{t('career_agent.onboarding.or', 'OR')}</span>
              </div>

              <div className="fg full">
                <label className="fl">{t('career_agent.onboarding.desired_role', 'Desired Job Role')} <span className="req">*</span></label>
                <div className={fieldErrorClass(`preferences.${colorClass}.role`)}>
                  <RoleSearchInput
                    value={data.role || ''}
                    disabled={hasDirectionSelected}
                    onChange={v => up('role', v)}
                    dbRoles={dbRoles.filter(r => !excludeRoles.includes(r))}
                  />
                </div>
              </div>
            </div>
          ) : directions.length > 0 || browseGroups.length > 0 ? (
            <div className="fgrid">
              <div className="fg full">
                <div className="ob-strip" style={{ marginBottom: '4px' }}>
                  <Info size={18} />
                  <p>{t('career_agent.onboarding.directions_mapped_selected', 'Career directions mapped to your profile have been selected in previous preferences. Please type a specific desired job role below.')}</p>
                </div>
                <label className="fl">{t('career_agent.onboarding.desired_role', 'Desired Job Role')} <span className="req">*</span></label>
                <div className={fieldErrorClass(`preferences.${colorClass}.role`)}>
                  <RoleSearchInput value={data.role || ''} onChange={v => up('role', v)} dbRoles={dbRoles.filter(r => !excludeRoles.includes(r))} />
                </div>
              </div>
            </div>
          ) : (
            <div className="fgrid">
              <div className="fg full">
                <div className="ob-strip" style={{ marginBottom: '4px' }}>
                  <Info size={18} />
                  <p>{directionsLoading
                    ? t('career_agent.onboarding.loading_directions', 'Loading career directions for your education...')
                    : t('career_agent.onboarding.type_role_below', 'Type or search for your desired job role below.')}</p>
                </div>
                <label className="fl">{t('career_agent.onboarding.desired_role', 'Desired Job Role')} <span className="req">*</span></label>
                <div className={fieldErrorClass(`preferences.${colorClass}.role`)}>
                  <RoleSearchInput value={data.role || ''} onChange={v => up('role', v)} dbRoles={dbRoles.filter(r => !excludeRoles.includes(r))} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ob-divider" />

        {/* SECTION B: MARKET PREFERENCES */}
        <div className="ob-section">
          <Eyebrow>02 &nbsp;{t('career_agent.onboarding.market_preferences', 'Market preferences')}</Eyebrow>
          <div className="fgrid">
            {/* Assignment Type */}
            <div className="fg">
              <label className="fl">{t('career_agent.onboarding.assignment_type', 'Assignment type')}</label>
              <div className="ob-select-wrap">
                <select
                  value={data.type || 'Full-Time'}
                  onChange={e => up('type', e.target.value)}
                  style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', paddingRight: '2.5rem', fontWeight: 500 }}
                >
                  {JOB_TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
                </select>
                <span className="ob-caret"><ChevronDown size={18} /></span>
              </div>
            </div>

            {/* Expected CTC */}
            <div className="fg">
              <label className="fl">{t('career_agent.onboarding.expected_ctc', 'Expected CTC (range)')} <span className="req">*</span></label>
              <div className="ob-select-wrap">
                <select
                  className={fieldErrorClass(`preferences.${colorClass}.salary`)}
                  value={data.salary || ''}
                  onChange={e => up('salary', e.target.value)}
                  style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', paddingRight: '2.5rem', fontWeight: data.salary ? 500 : 400, color: data.salary ? undefined : 'var(--ob-faint)' }}
                >
                  <option value="">{t('career_agent.onboarding.select_range', 'Select range...')}</option>
                  {SALARY_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
                <span className="ob-caret"><ChevronDown size={18} /></span>
              </div>
            </div>

            {/* Location */}
            <div className="fg full">
              <label className="fl">{t('career_agent.onboarding.location_preferences', 'Location preferences')} <span className="req">*</span></label>
              <div className={fieldErrorClass(`preferences.${colorClass}.locations`)}>
                <CitySearchInput
                  selected={Array.isArray(data.locations) ? data.locations : (data.location ? [data.location] : [])}
                  onChange={v => onChange({ ...data, locations: v, location: v[0] || '' })}
                  max={3}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="ob-divider" />

        {/* SECTION C: ORGANIZATION FIT */}
        <div className="ob-section">
          <Eyebrow>03 &nbsp;{t('career_agent.onboarding.organization_fit', 'Organisation fit')}</Eyebrow>
          <div className="fg full">
            <label className="fl">{t('career_agent.onboarding.target_cultures', 'Target cultures')} <span className="req">*</span></label>
            <div className={fieldErrorClass(`preferences.${colorClass}.orgTypes`)}>
              <MultiSelect
                options={ORG_TYPE_OPTIONS}
                selected={Array.isArray(data.orgTypes) ? data.orgTypes : (data.orgType ? [data.orgType] : [])}
                onChange={v => onChange({ ...data, orgTypes: v })}
                max={3}
                placeholder={t('career_agent.onboarding.cultures_placeholder', 'e.g. MNC, Startup, Public Sector...')}
              />
            </div>
          </div>
        </div>
    </div>
  );
}

// TagInput (Simple)
function TagInput({ tags = [], onChange, placeholder = "Type & press Enter..." }) {
  const [input, setInput] = useState('');
  const add = () => {
    const s = input.trim();
    if (s && !tags.includes(s)) { onChange([...tags, s]); }
    setInput('');
  };
  return (
    <div>
      <div className="tags" style={{ marginBottom: '0.5rem' }}>
        {tags.map(t => (
          <span key={t} className="tag">{t} <button type="button" onClick={() => onChange(tags.filter(x => x !== t))}>x</button></span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input type="text" placeholder={placeholder} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          style={{ flex: 1, height: '38px', fontSize: '0.8rem' }}
        />
        <button type="button" className="btn-primary" style={{ padding: '0 1rem', height: '38px', borderRadius: '6px' }} onClick={add}>+</button>
      </div>
    </div>
  );
}

// SkillSection
function SkillSection({ skills, onChange }) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Verified');
  const [cert, setCert] = useState({ issuer: '', year: '', url: '' });

  const add = () => {
    if (name.trim()) {
      const newSkill = {
        name: name.trim(),
        status,
        cert: status === 'Verified' ? { ...cert } : null
      };
      onChange([...skills, newSkill]);
      setName('');
      setCert({ issuer: '', year: '', url: '' });
      // Keep selected status as the default for next entry (usually users add multiple verified or multiple self-learnt at once)
      try {
        const link = document.createElement('a');
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err) {
        console.error('Download failed:', err);
      }
    }
  };

  return (
    <div className="onboard-skill-section">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Row 1: Skill Name & Basic Status */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="fl">Skill Name</label>
            <input type="text" placeholder="e.g. Python, Figma, React" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} style={{ width: '100%' }} />
          </div>
          <div className="w-full sm:w-[220px]">
            <label className="fl">Skill Status <span className="req">*</span></label>
            <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border2)' }}>
              <button type="button" onClick={() => setStatus('Verified')} style={{ flex: 1, padding: '0.45rem', border: 'none', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', background: status === 'Verified' ? 'var(--accent)' : 'transparent', color: status === 'Verified' ? '#fff' : 'var(--muted)', transition: '0.2s' }}>VERIFIED</button>
              <button type="button" onClick={() => setStatus('Self-learnt')} style={{ flex: 1, padding: '0.45rem', border: 'none', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', background: status === 'Self-learnt' ? 'var(--amber)' : 'transparent', color: status === 'Self-learnt' ? '#000' : 'var(--muted)', transition: '0.2s' }}>SELF-LEARNT</button>
            </div>
          </div>
        </div>

        {/* Row 2 (Optional): Verification Details */}
        {status === 'Verified' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ background: 'var(--accent-tint)', border: '1px solid var(--accent-border)', borderRadius: '10px', padding: '1.2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ShieldCheck size={14} /> Verification Details (Certification)</div>
            <div className="fgrid">
              <div className="fg">
                <label className="fl">Issuing Organization</label>
                <input type="text" placeholder="e.g. Google India" value={cert.issuer} onChange={e => setCert({ ...cert, issuer: e.target.value })} />
              </div>
              <div className="fg">
                <label className="fl">Year</label>
                <select value={cert.year} onChange={e => setCert({ ...cert, year: e.target.value })}>
                  <option value="">Year...</option>
                  {CERT_YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
              <div className="fg full">
                <label className="fl">Credential URL (Must start with http:// or https://)</label>
                <input type="url" placeholder="https://credentials.example.com/certificate/123" value={cert.url} onChange={e => setCert({ ...cert, url: e.target.value })} />
              </div>
            </div>
          </motion.div>
        )}

        <button type="button" onClick={add} className="btn-primary" style={{ height: '44px', width: '100%', fontSize: '0.85rem', fontWeight: 800 }}>
          {status === 'Verified' ? '+ Add Verified Skill & Certificate' : '+ Add Self-learnt Skill'}
        </button>
      </div>

      <div className="tags" style={{ marginTop: '1.5rem', minHeight: '40px' }}>
        {skills.map((s, idx) => (
          <span key={idx} className="tag" style={{ padding: '0.5rem 1rem', borderLeft: `5px solid ${s.status === 'Verified' ? 'var(--accent)' : 'var(--amber)'}`, background: 'rgba(255,255,255,0.04)' }}>
            <strong>{s.name}</strong>
            <span style={{ fontSize: '0.65rem', opacity: 0.8, marginLeft: '0.5rem', color: s.status === 'Verified' ? 'var(--accent)' : 'var(--amber)' }}>STATUS: {s.status.toUpperCase()}</span>
            <button type="button" onClick={() => onChange(skills.filter((_, i) => i !== idx))} style={{ marginLeft: '0.8rem', opacity: 0.6 }}>x</button>
          </span>
        ))}
        {skills.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>No skills added yet. Add your verified and self-learnt skills above.</p>}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 mt-5" style={{ background: 'var(--accent-tint)', borderRadius: '10px', border: '1px solid var(--accent-border)', fontSize: '0.72rem', color: 'var(--text2)' }}>
        <ShieldCheck size={20} className="text-[var(--accent)] shrink-0" />
        <span>Providing certification details for <strong>Verified</strong> skills significantly boosts your platform ranking and visibility to potential employers.</span>
      </div>
    </div>
  );
}

const LOADING_MESSAGES = [
  "Initializing v7 Intelligence Engine...",
  "Correlating Educational Background...",
  "Analyzing Technical Skill Coverage...",
  "Simulating Industry Market Match...",
  "Synthesizing Strategic Roadmap...",
  "Generating Full Analysis Report..."
];

// Main Component
const CareerAgentOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { t } = useTranslation();
  const { theme } = useTheme();

  // If coming from "Not Interested" flow, we jump to a specific step to edit just that preference
  const editState = location.state || {};
  const editTier = editState.editTier || null;   // 'primary' | 'secondary' | 'tertiary' | null
  const startStep = editState.startStep || 1;      // 3, 4, or 5 for the preference steps
  const isEditMode = !!editTier;

  const [step, setStep] = useState(isEditMode ? startStep : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationState, setValidationState] = useState(createEmptyValidationState);
  const [eduData, setEduData] = useState({});
  const [dbRoles, setDbRoles] = useState([]);

  useEffect(() => {
    axios.get('/api/degrees')
      .then(res => setEduData(res.data))
      .catch(err => console.error('Failed to load education data:', err));

    axios.get('/api/career-agent/career-roles/names')
      .then(res => setDbRoles(res.data))
      .catch(err => console.error('Failed to load career roles:', err));
  }, []);

  const [isLocked, setIsLocked] = useState(false);
  const [lockDetails, setLockDetails] = useState(null);

  useEffect(() => {
    fetchLockStatus().then(status => {
      if (!status) return;
      setLockDetails(status);
      if (status.isLocked) setIsLocked(true);
    });
  }, []);

  // ─── EDIT MODE: Pre-fill ALL form data so education is loaded when jumping to Step 3/4/5 ──
  // Tries 3 sources in order:
  //   1. /final-pathway (new dedicated endpoint — accurate after backend restart)
  //   2. /my-analysis   (existing endpoint — already stores full input_data, works NOW)
  //   3. localStorage   (last resort — cleared after submit, may be empty)
  useEffect(() => {
    if (!isEditMode) return;

    const token = sessionStorage.getItem('token');
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

    const normaliseInputData = (saved) => {
      if (!saved) return null;
      // Ensure education is an array
      if (saved.education && !Array.isArray(saved.education)) {
        saved.education = [saved.education];
      }
      if (saved.education) {
        saved.education.forEach(edu => {
          if (edu.specialisation && !Array.isArray(edu.specialisation)) {
            edu.specialisation = [edu.specialisation];
          }
          if (!edu.specialisation) edu.specialisation = [];
        });
      }
      // Ensure skills are objects
      if (Array.isArray(saved.skills) && saved.skills.length > 0 && typeof saved.skills[0] === 'string') {
        saved.skills = saved.skills.map(s => ({ name: s, status: 'Verified' }));
      }
      return saved;
    };

    const applyPreFill = (saved) => {
      if (!saved) return;
      setFormData(prev => ({
        ...prev,
        personalDetails: { ...prev.personalDetails, ...(saved.personalDetails || {}) },
        education: (saved.education && saved.education.length > 0) ? saved.education : prev.education,
        skills: (saved.skills && saved.skills.length > 0) ? saved.skills : prev.skills,
        experience: (saved.experience && saved.experience.length > 0) ? saved.experience : prev.experience,
        preferences: {
          primary: saved.preferences?.primary || prev.preferences.primary,
          secondary: saved.preferences?.secondary || prev.preferences.secondary,
          tertiary: saved.preferences?.tertiary || prev.preferences.tertiary,
        }
      }));
    };

    const loadSavedData = async () => {
      // ── Source 1: /final-pathway (new dedicated collection) ──────────────────
      try {
        const r = await fetch('/api/career-agent/final-pathway', {
          credentials: 'include', headers: authHeaders
        });
        if (r.ok) {
          const d = await r.json();
          if (d?.found && d.input_data) {
            console.log('[EditMode] Pre-filling from final-pathway');
            applyPreFill(normaliseInputData(d.input_data));
            return; // success — stop here
          }
        }
      } catch (e) {
        console.warn('[EditMode] final-pathway unavailable, trying my-analysis…');
      }

      // ── Source 2: /my-analysis (existing endpoint, already has input_data) ───
      try {
        const r = await fetch('/api/career-agent/my-analysis', {
          credentials: 'include', headers: authHeaders
        });
        if (r.ok) {
          const d = await r.json();
          if (d?.found && d.input_data) {
            console.log('[EditMode] Pre-filling from my-analysis');
            applyPreFill(normaliseInputData(d.input_data));
            return; // success — stop here
          }
        }
      } catch (e) {
        console.warn('[EditMode] my-analysis unavailable, trying localStorage…');
      }

      // ── Source 3: localStorage draft (last resort, may be empty after submit) ─
      try {
        const raw = localStorage.getItem('smaart_onboarding_draft');
        if (raw) {
          const parsed = JSON.parse(raw);
          console.log('[EditMode] Pre-filling from localStorage draft');
          applyPreFill(normaliseInputData(parsed));
        }
      } catch (e) {
        console.warn('[EditMode] localStorage draft unavailable');
      }
    };

    loadSavedData();
  }, [isEditMode]);

  // ─── AUTO-FILL PERSONAL DETAILS & ACADEMIC RECORD FROM PROFILE ───
  useEffect(() => {
    if (!user) return;

    const fillEduFromHigherEdArray = (higherEdList, defaultUniv, defaultYear) => {
      if (!Array.isArray(higherEdList) || higherEdList.length === 0) return null;

      // Registration's higherEducation array is a full academic HISTORY (can
      // include 10th/12th/diploma entries alongside the actual degree) —
      // Career Agent only cares about the degree(s) the student is CURRENTLY
      // pursuing, not their whole history. Auto-fill should never surface an
      // old/unrelated qualification as if it were a second active degree;
      // the student can always add a genuine second one manually via
      // "Add Another Academic Qualification".
      const isCurrent = (item) => {
        if (typeof item.currentlyPursuing === 'boolean') return item.currentlyPursuing;
        if (item.degreeStatus) {
          const s = item.degreeStatus.toLowerCase();
          return s.includes('pursu') || s.includes('ongoi');
        }
        return true; // no status info at all — don't silently drop it
      };
      const currentEntries = higherEdList.filter(isCurrent);
      const relevantList = currentEntries.length > 0 ? currentEntries : higherEdList;
      if (relevantList.length === 0) return null;

      const availableLevels = Object.keys(eduData || {});

      return relevantList.map(item => {
        let rawLevel = item.qualificationLevel || item.level || item.degreeLevel || '';
        let level = rawLevel;

        if (availableLevels.length > 0) {
          if (!availableLevels.includes(level)) {
            const lLower = rawLevel.toLowerCase();
            const matchedL = availableLevels.find(al => {
              const alLower = al.toLowerCase();
              return alLower === lLower ||
                (lLower.includes('postgrad') && alLower.includes('postgrad')) ||
                (lLower.includes('undergrad') && alLower.includes('undergrad')) ||
                (lLower.includes('diploma') && alLower.includes('diploma')) ||
                (lLower.includes('phd') && alLower.includes('phd'));
            });
            if (matchedL) level = matchedL;
          }
        }

        let domain = item.degree || item.domain || '';
        if (level && eduData?.[level]) {
          const availableDomains = Object.keys(eduData[level] || {});
          if (!availableDomains.includes(domain)) {
            const dMatch = availableDomains.find(ad => ad.toLowerCase() === domain.toLowerCase());
            if (dMatch) domain = dMatch;
          }
        }

        let degreeGroup = item.degreeFullName || item.degreeGroup || item.degree || '';
        if (level && domain && eduData?.[level]?.[domain]) {
          const availableGroups = Object.keys(eduData[level][domain] || {});
          if (!availableGroups.includes(degreeGroup)) {
            const gMatch = availableGroups.find(ag => ag.toLowerCase() === degreeGroup.toLowerCase());
            if (gMatch) degreeGroup = gMatch;
          }
        }

        let spec = [];
        if (Array.isArray(item.specialization)) spec = item.specialization;
        else if (item.specialization) spec = [item.specialization];
        else if (Array.isArray(item.specialisation)) spec = item.specialisation;
        else if (item.specialisation) spec = [item.specialisation];

        if (level && domain && degreeGroup && eduData?.[level]?.[domain]?.[degreeGroup]) {
          const validSpecs = eduData[level][domain][degreeGroup];
          spec = spec.map(s => {
            const matchedS = validSpecs.find(vs => vs.toLowerCase() === s.toLowerCase());
            return matchedS || s;
          });
        }

        let isPursuing = true;
        if (typeof item.currentlyPursuing === 'boolean') {
          isPursuing = item.currentlyPursuing;
        } else if (item.degreeStatus) {
          isPursuing = item.degreeStatus.toLowerCase().includes('pursu') || item.degreeStatus.toLowerCase().includes('ongoi');
        }

        return {
          level: level,
          domain: domain,
          degreeGroup: degreeGroup,
          specialisation: spec.filter(Boolean),
          university: item.institutionName || item.university || item.college || defaultUniv,
          graduationYear: item.yearOfPassing || item.graduationYear || defaultYear,
          currentlyPursuing: isPursuing
        };
      });
    };

    const applyUserData = (regDetails) => {
      setFormData(prev => {
        const updatedPersonal = {
          ...prev.personalDetails,
          name: prev.personalDetails.name || user.fullName || user.name || regDetails?.fullName || '',
          email: prev.personalDetails.email || user.email || regDetails?.email || '',
          phone: prev.personalDetails.phone || user.mobileNumber || user.mobile || user.phone || regDetails?.alternateMobile || regDetails?.mobileNumber || '',
          registrationNumber: prev.personalDetails.registrationNumber || user.studentId || user.registrationNumber || regDetails?.studentId || regDetails?.rollNumber || ''
        };

        const defaultUniv = user.college?.collegeName || user.collegeName || user.institution || regDetails?.institution || 'Smaart Institute';
        const defaultYear = user.yearOfPassing || user.batch || regDetails?.yearOfPassing || '';

        // Priority 1: students.registration.higherEducation / regDetails.higherEducation
        const higherEdList = regDetails?.higherEducation || regDetails?.registration?.higherEducation || user.registration?.higherEducation || user.higherEducation;

        let updatedEdu = prev.education;
        const firstEdu = prev.education[0];
        // Blank per-field, not all-or-nothing — this runs twice (once with
        // just the user context, once with the fuller register-details
        // response), and a field the first pass couldn't resolve should
        // still get filled by the second pass rather than being permanently
        // skipped because some OTHER field already got set.
        const hasGaps = !firstEdu || !firstEdu.level || !firstEdu.domain || !firstEdu.degreeGroup || !firstEdu.specialisation || firstEdu.specialisation.length === 0;

        const mappedHigherEd = fillEduFromHigherEdArray(higherEdList, defaultUniv, defaultYear);
        if (mappedHigherEd && mappedHigherEd.length > 0) {
          updatedEdu = mappedHigherEd;
        } else if (hasGaps) {
          // Resolve each field independently, checking every known source in
          // priority order, instead of picking one all-or-nothing source.
          // A student's real Level/Domain/Degree/Specialisation most often
          // live on `department` (level/domain/fullName/specialization),
          // not `academic` (degreeLevel/domain/degreeGroup/specialisation),
          // which defaults to empty strings unless explicitly set — so
          // `academic` alone being present is not enough to trust it fully.
          const sources = [
            regDetails?.academic,
            regDetails?.department && {
              degreeLevel: regDetails.department.level,
              domain: regDetails.department.domain,
              degreeGroup: regDetails.department.fullName || regDetails.department.abbreviation,
              specialisation: regDetails.department.specialization
            },
            regDetails?.degree && {
              degreeLevel: regDetails.degree.level,
              domain: regDetails.degree.domain,
              degreeGroup: regDetails.degree.fullName || regDetails.degree.abbreviation,
              specialisation: regDetails.degree.specialization
            },
            user.academic,
            user.department && typeof user.department === 'object' && {
              degreeLevel: user.department.level,
              domain: user.department.domain,
              degreeGroup: user.department.fullName || user.department.name,
              specialisation: user.department.specialization
            },
            user.degree && {
              degreeLevel: user.degree.level,
              domain: user.degree.domain,
              degreeGroup: user.degree.fullName,
              specialisation: user.degree.specialization
            },
            (user.qualification || user.specialization) && {
              degreeGroup: user.qualification,
              specialisation: user.specialization
            }
          ].filter(Boolean);

          const resolveField = (key) => {
            for (const src of sources) {
              if (src[key]) return src[key];
            }
            return '';
          };

          // Fill gaps only — keep whatever the first pass (or a prior run)
          // already resolved correctly, rather than overwriting it with an
          // empty value just because this pass's sources don't have it.
          const level = firstEdu?.level || resolveField('degreeLevel');
          const domain = firstEdu?.domain || resolveField('domain');
          const degreeGroup = firstEdu?.degreeGroup || resolveField('degreeGroup');
          const specialisation = (firstEdu?.specialisation && firstEdu.specialisation.length > 0)
            ? firstEdu.specialisation
            : (resolveField('specialisation') ? [resolveField('specialisation')] : []);

          if (level || domain || degreeGroup || specialisation.length > 0) {
            updatedEdu = [{
              ...firstEdu,
              level,
              domain,
              degreeGroup,
              specialisation,
              university: firstEdu?.university || defaultUniv,
              graduationYear: firstEdu?.graduationYear || defaultYear,
              currentlyPursuing: firstEdu?.currentlyPursuing ?? true
            }];
          }
        }

        return {
          ...prev,
          personalDetails: updatedPersonal,
          education: updatedEdu
        };
      });
    };

    // Apply immediate user context data first
    applyUserData(null);

    // Fetch full registration profile (higherEducation) via endpoint if email exists
    if (user.email) {
      axios.get(`/api/users/register-details/${encodeURIComponent(user.email)}`)
        .then(res => {
          if (res.data) {
            applyUserData(res.data);
          }
        })
        .catch(err => console.warn('Failed to fetch register-details for education auto-fill:', err));
    }
  }, [user, eduData]);

  const blankEdu = { level: '', domain: '', degreeGroup: '', specialisation: [], university: '', graduationYear: '', currentlyPursuing: false };
  const blankPref = { careerDirection: null, careerDirectionId: '', careerDirectionName: '', careerDirectionDescription: '', sectors: [], sector: '', family: '', role: '', type: 'Full-Time', salary: '', locations: [], location: '', orgTypes: [] };
  const blankExp = { orgName: '', designation: '', sector: '', type: 'Full-Time', startDate: '', endDate: '', currentlyWorking: false, isCustomSector: false };

  const [formData, setFormData] = useState(() => {
    let baseData = {
      personalDetails: { name: '', email: '', phone: '', registrationNumber: '' },
      education: [{ ...blankEdu }],
      skills: [],
      experience: [{ ...blankExp }],
      preferences: {
        primary: { ...blankPref },
        secondary: { ...blankPref },
        tertiary: { ...blankPref }
      }
    };

    const saved = localStorage.getItem('smaart_onboarding_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.education && !Array.isArray(parsed.education)) {
          parsed.education = [parsed.education];
        }
        if (parsed.education) {
          parsed.education.forEach(edu => {
            if (edu.specialisation && !Array.isArray(edu.specialisation)) {
              edu.specialisation = [edu.specialisation];
            }
            if (!edu.specialisation) edu.specialisation = [];
          });
        }
        if (parsed.skills && parsed.skills.length > 0 && typeof parsed.skills[0] === 'string') {
          parsed.skills = parsed.skills.map(s => ({ name: s, status: 'Verified' }));
        }
        baseData = { ...baseData, ...parsed, personalDetails: { ...baseData.personalDetails, ...(parsed.personalDetails || {}) } };
      } catch { }
    }

    try {
      const uStr = sessionStorage.getItem('user');
      if (uStr) {
        const u = JSON.parse(uStr);
        if (u.fullName && !baseData.personalDetails.name) baseData.personalDetails.name = u.fullName;
        if (u.email && !baseData.personalDetails.email) baseData.personalDetails.email = u.email;
        if ((u.mobileNumber || u.mobile) && !baseData.personalDetails.phone) baseData.personalDetails.phone = u.mobileNumber || u.mobile;
        if (u.studentId && !baseData.personalDetails.registrationNumber) baseData.personalDetails.registrationNumber = u.studentId;
      }
    } catch (e) { }

    return baseData;
  });

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem('smaart_onboarding_draft', JSON.stringify(formData));
  }, [formData]);

  // Career Direction: state
  const [careerUniqueId, setCareerUniqueId] = useState(null);
  const [careerDirections, setCareerDirections] = useState([]); // "Recommended for you" — matched to the student's own education
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [allDirections, setAllDirections] = useState([]); // every direction, across every degree — for "Browse other directions"
  const [allDirectionsLoading, setAllDirectionsLoading] = useState(false);

  // Fetch the full universe of directions ONCE on mount — doesn't depend on the
  // student's own education, it's the "browse everything" pool.
  useEffect(() => {
    setAllDirectionsLoading(true);
    axios.get('/api/career-agent/all-directions')
      .then(res => setAllDirections(res.data?.directions || []))
      .catch(err => console.warn('[CareerAgentOnboarding] Failed to load all-directions:', err.message))
      .finally(() => setAllDirectionsLoading(false));
  }, []);

  // Career Direction: fetch RECOMMENDED directions for every education entry the
  // student has filled in — one degree = its 5 mapped directions, two degrees =
  // up to 10 (merged, deduplicated), matching however many specialisations were
  // picked within each entry.
  const eduSummaryStr = useMemo(() => JSON.stringify(
    (formData.education || []).map(e => ({
      level: e?.level, domain: e?.domain, degreeGroup: e?.degreeGroup, specialisation: e?.specialisation
    }))
  ), [formData.education]);

  useEffect(() => {
    let eduEntries;
    try {
      eduEntries = JSON.parse(eduSummaryStr);
    } catch (e) {
      eduEntries = [];
    }

    const validEntries = eduEntries.filter(e => e.level && e.domain && e.degreeGroup);
    if (validEntries.length === 0) {
      console.log('[CareerAgentOnboarding] No complete education entries yet. Clearing directions.');
      setCareerUniqueId(null);
      setCareerDirections([]);
      return;
    }

    setDirectionsLoading(true);

    // Fetch unique-id + directions for EACH specialisation of EACH education entry, in parallel
    const fetchForSpec = async (entry, spec) => {
      try {
        const idRes = await axios.get('/api/career-agent/unique-id', {
          params: { level: entry.level, domain: entry.domain, degreeFullName: entry.degreeGroup, specialisation: spec }
        });
        if (!idRes.data.found || !idRes.data.uniqueId) return [];
        const dirRes = await axios.get(`/api/career-agent/directions/${idRes.data.uniqueId}`);
        return dirRes.data.found ? dirRes.data.directions : [];
      } catch (err) {
        console.warn(`[CareerAgentOnboarding] Failed for spec "${spec}":`, err.message);
        return [];
      }
    };

    const fetchPromises = [];
    for (const entry of validEntries) {
      let specs = ['General'];
      if (Array.isArray(entry.specialisation) && entry.specialisation.length > 0) {
        specs = entry.specialisation;
      }
      for (const spec of specs) {
        fetchPromises.push(fetchForSpec(entry, spec));
      }
    }

    Promise.all(fetchPromises)
      .then(results => {
        // Merge all direction arrays — deduplicate by directionId
        const seen = new Set();
        const merged = [];
        for (const dirs of results) {
          for (const dir of dirs) {
            if (!seen.has(dir.directionId)) {
              seen.add(dir.directionId);
              merged.push(dir);
            }
          }
        }
        console.log(`[CareerAgentOnboarding] Merged ${merged.length} recommended directions from ${validEntries.length} education entr${validEntries.length === 1 ? 'y' : 'ies'}`);
        setCareerDirections(merged);
      })
      .finally(() => setDirectionsLoading(false));

  }, [eduSummaryStr]);

  // Student's own field(s) of study — used only to ORDER the browse list (own
  // field first). Nothing is blocked: any direction from any degree is selectable.
  const studentDomains = useMemo(() => new Set(
    (formData.education || []).map(e => e?.domain).filter(Boolean)
  ), [formData.education]);

  const allById = useMemo(() => new Map(allDirections.map(d => [d.directionId, d])), [allDirections]);

  // Recommended directions come from /directions/:uniqueId, which carries no
  // degree meta — borrow degree / specialisation / domain from the full list so
  // the picker and preview can label them.
  const recommendedDirections = useMemo(
    () => careerDirections.map(d => ({ ...(allById.get(d.directionId) || {}), ...d })),
    [careerDirections, allById]
  );

  // Everything NOT already recommended, grouped Domain → Degree · Specialisation.
  const browseGroups = useMemo(() => {
    const recommendedIds = new Set(careerDirections.map(d => d.directionId));
    const rest = allDirections.filter(d => !recommendedIds.has(d.directionId));

    const byDomain = new Map();
    for (const dir of rest) {
      const domainKey = dir.domain || 'Other';
      if (!byDomain.has(domainKey)) byDomain.set(domainKey, new Map());
      const degMap = byDomain.get(domainKey);
      const degreeLabel = dir.degreeAbbr || dir.degreeName || 'Other';
      const specialisation = dir.specialisation || '';
      const degKey = `${degreeLabel}|${specialisation}`;
      if (!degMap.has(degKey)) {
        degMap.set(degKey, { key: degKey, degreeLabel, degreeName: dir.degreeName || '', specialisation, directions: [] });
      }
      degMap.get(degKey).directions.push(dir);
    }

    const groups = Array.from(byDomain.entries()).map(([domain, degMap]) => ({
      domain,
      own: studentDomains.has(domain),
      degrees: Array.from(degMap.values()).sort((a, b) =>
        a.degreeLabel.localeCompare(b.degreeLabel) || a.specialisation.localeCompare(b.specialisation)
      )
    }));

    // Student's own field(s) first, then everything else alphabetically.
    groups.sort((a, b) => {
      if (a.own !== b.own) return a.own ? -1 : 1;
      return a.domain.localeCompare(b.domain);
    });
    return groups;
  }, [allDirections, careerDirections, studentDomains]);

  const updatePersonal = (field, val) => setFormData(f => ({ ...f, personalDetails: { ...f.personalDetails, [field]: val } }));
  const updateEdu = (i, field, val) => setFormData(f => {
    const edu = [...f.education]; edu[i] = { ...edu[i], [field]: val };
    // Reset lower cascading fields if higher fields change
    if (field === 'level') { edu[i].domain = ''; edu[i].degreeGroup = ''; edu[i].specialisation = []; }
    if (field === 'domain') { edu[i].degreeGroup = ''; edu[i].specialisation = []; }
    if (field === 'degreeGroup') { edu[i].specialisation = []; }
    return { ...f, education: edu };
  });
  const updatePref = (tier, data) => setFormData(f => ({ ...f, preferences: { ...f.preferences, [tier]: data } }));
  const updateExp = (i, field, val) => setFormData(f => {
    const exp = [...f.experience]; exp[i] = { ...exp[i], [field]: val };
    return { ...f, experience: exp };
  });
  const addExp = () => setFormData(f => ({ ...f, experience: [...f.experience, { ...blankExp }] }));
  const removeExp = (i) => setFormData(f => ({ ...f, experience: f.experience.filter((_, idx) => idx !== i) }));

  const isUG = formData.education.some(edu => edu.level === 'Undergraduate (UG)');
  const isPG = formData.education.some(edu => edu.level === 'Postgraduate (PG)');

  const setFieldError = (fields, key) => {
    fields[key] = true;
  };

  const getPreferenceSelections = (pref) => ({
    locations: Array.isArray(pref?.locations) ? pref.locations : (pref?.location ? [pref.location] : []),
    orgTypes: Array.isArray(pref?.orgTypes) ? pref.orgTypes : (pref?.orgType ? [pref.orgType] : [])
  });

  // ── Step Validation Logic ──────────────────────────────────────────────
  const validateStep = (currentStep) => {
    const messages = [];
    const fields = {};
    switch (currentStep) {
      case 1: {
        if (!formData.personalDetails.name?.trim()) {
          messages.push('Full Name is required');
          setFieldError(fields, 'personal.name');
        }
        if (!formData.personalDetails.email?.trim()) {
          messages.push('Email Address is required');
          setFieldError(fields, 'personal.email');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalDetails.email.trim())) {
          messages.push('Please enter a valid email address');
          setFieldError(fields, 'personal.email');
        }
        if (!formData.personalDetails.phone?.trim()) {
          messages.push('Phone Number is required');
          setFieldError(fields, 'personal.phone');
        } else if (!/^\d{10}$/.test(formData.personalDetails.phone.trim())) {
          messages.push('Phone Number must be a valid 10-digit mobile number');
          setFieldError(fields, 'personal.phone');
        }
        if (!formData.personalDetails.registrationNumber?.trim()) {
          messages.push('Registration Number is required');
          setFieldError(fields, 'personal.registrationNumber');
        }
        break;
      }
      case 2: {
        const primaryEdu = formData.education[0];
        if (!primaryEdu?.level) {
          messages.push('Degree Level is required');
          setFieldError(fields, 'education.0.level');
        }
        if (!primaryEdu?.domain) {
          messages.push('Domain is required');
          setFieldError(fields, 'education.0.domain');
        }
        if (!primaryEdu?.degreeGroup) {
          messages.push('Degree Group is required');
          setFieldError(fields, 'education.0.degreeGroup');
        }
        if (!primaryEdu?.specialisation?.length) {
          messages.push('At least one Specialisation must be selected');
          setFieldError(fields, 'education.0.specialisation');
        }
        if (!primaryEdu?.graduationYear?.toString().trim()) {
          messages.push('Graduation Year is required');
          setFieldError(fields, 'education.0.graduationYear');
        }
        break;
      }
      case 3: {
        const pref = formData.preferences.primary;
        const { locations, orgTypes } = getPreferenceSelections(pref);
        if (!pref?.role?.trim()) {
          messages.push('Select a Career Direction or type a Desired Job Role');
          setFieldError(fields, 'preferences.primary.role');
        }
        if (!pref?.salary) {
          messages.push('Select the expected CTC range');
          setFieldError(fields, 'preferences.primary.salary');
        }
        if (!locations.length) {
          messages.push('Add at least one preferred location');
          setFieldError(fields, 'preferences.primary.locations');
        }
        if (!orgTypes.length) {
          messages.push('Select at least one target culture');
          setFieldError(fields, 'preferences.primary.orgTypes');
        }
        break;
      }
      case 4: {
        const pref = formData.preferences.secondary;
        const { locations, orgTypes } = getPreferenceSelections(pref);
        if (!pref?.role?.trim()) {
          messages.push('Select a Career Direction or type a Desired Job Role');
          setFieldError(fields, 'preferences.secondary.role');
        }
        if (!pref?.salary) {
          messages.push('Select the expected CTC range');
          setFieldError(fields, 'preferences.secondary.salary');
        }
        if (!locations.length) {
          messages.push('Add at least one preferred location');
          setFieldError(fields, 'preferences.secondary.locations');
        }
        if (!orgTypes.length) {
          messages.push('Select at least one target culture');
          setFieldError(fields, 'preferences.secondary.orgTypes');
        }
        break;
      }
      case 5: {
        const pref = formData.preferences.tertiary;
        const { locations, orgTypes } = getPreferenceSelections(pref);
        if (!pref?.role?.trim()) {
          messages.push('Select a Career Direction or type a Desired Job Role');
          setFieldError(fields, 'preferences.tertiary.role');
        }
        if (!pref?.salary) {
          messages.push('Select the expected CTC range');
          setFieldError(fields, 'preferences.tertiary.salary');
        }
        if (!locations.length) {
          messages.push('Add at least one preferred location');
          setFieldError(fields, 'preferences.tertiary.locations');
        }
        if (!orgTypes.length) {
          messages.push('Select at least one target culture');
          setFieldError(fields, 'preferences.tertiary.orgTypes');
        }
        break;
      }
      default: break;
    }
    return { messages, fields };
  };

  // Clear validation errors whenever the step changes
  useEffect(() => { setValidationState(createEmptyValidationState()); }, [step]);

  const getFieldErrorClass = (key) => validationState.fields[key] ? 'field-error' : '';
  const currentStepValidation = validateStep(step);
  const isCurrentStepComplete = currentStepValidation.messages.length === 0;

  const handleNext = async () => {
    const nextValidation = validateStep(step);
    if (nextValidation.messages.length > 0) {
      setValidationState(nextValidation);
      // Scroll to bottom so the user sees the validation banner near the button
      setTimeout(() => {
        const banner = document.querySelector('.validation-banner');
        if (banner) banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
    setValidationState(createEmptyValidationState());
    if (step === 1) await savePersonalDetails();
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        personalDetails: { ...formData.personalDetails, name: formData.personalDetails.name || 'Student' },
      };
      const res = await axios.post('/api/career-agent/onboarding', payload, { withCredentials: true });

      // Normalise both response shapes
      // Normal:   {status: 'success', analysis: {...} }
      // Cache hit: {success: true, cached: true, data: {output_generated_report: {...} } }
      let analysisData = res.data?.analysis
        || res.data?.data?.output_generated_report
        || res.data?.data?.analysis
        || (res.data?.data && typeof res.data.data === 'object' ? res.data.data : null);

      const analysisId = res.data?.id || res.data?.data?.id || Date.now().toString();
      // Response normalization

      if (analysisData) {
        localStorage.setItem('smaart_analysis', JSON.stringify(analysisData));
        localStorage.setItem('smaart_analysis_id', analysisId);

        // SAVE RELEVANT PROFILE INFO FOR DYNAMIC PANELS
        if (formData.education && formData.education.length > 0) {
          const edu = formData.education[0];
          localStorage.setItem('smaart_user_degree', edu.degreeGroup || '');
          localStorage.setItem('smaart_user_specialisation', (Array.isArray(edu.specialisation) ? edu.specialisation[0] : edu.specialisation) || '');
        }

        if (formData.skills) {
          localStorage.setItem('smaart_user_skills', JSON.stringify(formData.skills));
        }

        // Save selected preference names for Dashboard top-bar display
        const prefs = formData.preferences;
        localStorage.setItem('smaart_pref_primary', prefs.primary?.careerDirectionName || prefs.primary?.role || '');
        localStorage.setItem('smaart_pref_secondary', prefs.secondary?.careerDirectionName || prefs.secondary?.role || '');
        localStorage.setItem('smaart_pref_tertiary', prefs.tertiary?.careerDirectionName || prefs.tertiary?.role || '');

        localStorage.removeItem('smaart_onboarding_draft');

        if (isEditMode) {
          // Edit mode: go back to career agent dashboard so user can lock the updated path
          navigate('/dashboard/career-agent/dashboard');
        } else {
          navigate('/dashboard/career-agent/dashboard');
        }
      } else {
        // Response came back but had no usable analysis data
        console.error('No analysis data in response:', res.data);
        setError('The server returned an empty analysis. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.details || 'Submission failed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  // Save personal details to backend (Step 1)
  const savePersonalDetails = async () => {
    try {
      const res = await axios.post('/api/career-agent/student/profile', {
        personalDetails: formData.personalDetails
      });
      if (res.data?.success || res.status === 200) {
        localStorage.setItem('smaart_student_name', formData.personalDetails.name);
        localStorage.setItem('smaart_student_email', formData.personalDetails.email);
      }
    } catch (err) {
      console.warn('Profile pre-save skipped:', err.message);
    }
  };

  const [submittingStep, setSubmittingStep] = useState(0);

  useEffect(() => {
    if (isSubmitting) {
      const interval = setInterval(() => {
        setSubmittingStep(s => (s < LOADING_MESSAGES.length - 1 ? s + 1 : s));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isSubmitting]);

  const resetProfile = () => {
    if (window.confirm(t('career_agent.onboarding.reset_confirm', 'Are you sure you want to reset your profile? This will clear all entered data.'))) {
      localStorage.removeItem('smaart_onboarding_draft');
      window.location.reload();
    }
  };

  if (isSubmitting) {
    return (
      <div id="screen-loading" className="career-agent-page" style={{ background: 'var(--navy)', zIndex: 9999, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
          <div className="pulse-ring"></div>
          <div style={{ width: '100px', height: '100px', borderRadius: '25px', background: 'var(--navy2)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 40px rgba(var(--accent-rgb),0.15)', zIndex: 2, position: 'relative' }}>
            <Sparkles size={48} color="var(--accent)" className="animate-pulse" />
          </div>
        </div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginBottom: '1rem', textAlign: 'center', letterSpacing: '-0.02em' }}
        >
          {t('career_agent.onboarding.loading_title', 'Generating Your Intelligence Report')}
        </motion.h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '2.5rem', textAlign: 'center', maxWidth: '400px' }}>
          {t('career_agent.onboarding.loading_subtitle', 'Our AI engine is analyzing your profile against 500+ industry benchmarks. This typically takes 15-20 seconds.')}
        </p>
        <div style={{ width: '100%', maxWidth: '320px' }}>
          <div className="loading-bar-wrap" style={{ height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: `${(submittingStep + 1) * 16.6}%` }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--accent2))', boxShadow: '0 0 15px rgba(var(--accent-rgb),0.3)' }}
            />
          </div>
          <motion.p
            key={submittingStep}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ color: 'var(--text)', fontSize: '0.82rem', fontWeight: 700, marginTop: '1.5rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            {t('career_agent.onboarding.loading_msg.' + submittingStep, LOADING_MESSAGES[submittingStep])}
          </motion.p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <p style={{ color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 700, margin: 0 }}>{t('career_agent.onboarding.loading_engine_status', 'V7 ANALYSIS ENGINE ACTIVE')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="career-agent-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '2rem' }}>
        <div style={{ maxWidth: '500px', textAlign: 'center', background: 'var(--card)', padding: '3rem 2rem', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Lock size={40} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--text)' }}>Direction Locked</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Your career direction has been permanently locked. You can no longer generate new career analyses.
            Please return to your dashboard to view your locked career paths.
          </p>
          <button
            className="btn-primary"
            onClick={() => navigate('/dashboard/career-agent/dashboard')}
            style={{ padding: '0.8rem 2rem', fontSize: '1rem', borderRadius: '12px' }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="career-agent-page screen-onboard">
        {/* Same background treatment as Dashboard Home / My Courses: a quiet
            animated constellation texture plus two soft ambient glows,
            instead of the plain grid pattern used elsewhere in the app. */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-25">
          <NeuralBackground theme={theme === 'dark' ? 'dark' : 'light'} />
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
          <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
        </div>

        <div className="ob-container">

        {/* ── PAGE HEADER ── */}
        <div className="ob-page-head">
          <Eyebrow>{t('career_agent.onboarding.page_eyebrow', 'Career Directions · Onboarding')}</Eyebrow>
          <h1>{t('career_agent.onboarding.page_title', 'Set up your career pathway')}</h1>
          <p>{t('career_agent.onboarding.page_subtitle', 'Six short steps. Your profile and education are already linked.')}</p>
        </div>

        {/* ── EDIT MODE BANNER ── shown when user came via "Not Interested" */}
        {isEditMode && (
          <div className="ob-strip warn" style={{ alignItems: 'center' }}>
            <Info size={18} />
            <p style={{ flex: 1 }}>
              <strong>{t('career_agent.onboarding.reselecting_preference', 'Re-selecting {{tier}} preference.', { tier: editTier ? (editTier.charAt(0).toUpperCase() + editTier.slice(1)) : '' })}</strong>{' '}
              {t('career_agent.onboarding.edit_mode_not_interested_desc', 'You marked this as "Not Interested". Pick a new direction and re-submit — only this preference will be updated.')}
            </p>
            <button type="button" className="btn-back" onClick={() => navigate('/dashboard/career-agent/dashboard')} style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}>
              <ArrowLeft size={14} />Back
            </button>
          </div>
        )}

        {/* ── STEP PROGRESS INDICATOR (hidden in edit mode) ── */}
        {!isEditMode && (
          <div className="onboard-progress-container">
            {/* Desktop: one slim strip — 24px circles, 12px labels, 1px connectors */}
            <div className="onboard-progress-desktop hide-mobile">
              <div className="ob-stepper">
                {STEPS.map((label, idx) => {
                  const sn = idx + 1;
                  const isDone = step > sn;
                  const isActive = step === sn;
                  const displayLabel = STEP_DISPLAY_LABELS[idx] || label;
                  return (
                    <React.Fragment key={sn}>
                      <div className={`ob-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
                        <div className="ob-step-circle">
                          {isDone ? <Check size={14} /> : sn}
                        </div>
                        <div className="ob-step-label">{displayLabel}</div>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className={`ob-step-line${step > sn ? ' done' : ''}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Mobile progress bar (shown on mobile) */}
            <div className="onboard-progress-mobile show-mobile-block">
              <div className="onboard-progress-mobile-header">
                <span className="onboard-progress-mobile-step">
                  {t('career_agent.onboarding.step_num', 'STEP {{current}} of {{total}}', { current: step, total: 6 })}
                </span>
                <span className="onboard-progress-mobile-label">
                  {STEPS[step - 1]}
                </span>
              </div>
              <div className="onboard-progress-mobile-bar-wrap">
                <div
                  className="onboard-progress-mobile-bar-fill"
                  style={{ width: `${(step / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-card">
          {/* STEP 1: OVERVIEW — how Career Agent works, before diving into the form */}
          {step === 1 && (
            <>
              <CardHead
                icon={<Compass size={20} />}
                title={t('career_agent.onboarding.overview_title', 'How Career Agent works')}
                subtitle={t('career_agent.onboarding.overview_subtitle', 'The rules we follow before building your pathway.')}
                step={t('career_agent.onboarding.step_indicator', 'STEP {{current}} / {{total}}', { current: 1, total: 6 })}
              />
              <div className="ob-body">
                <div className="ob-rule-grid">
                  {[
                    { num: '01', icon: <GraduationCap size={18} />, title: t('career_agent.onboarding.overview_card1_title', 'Recommended for your degree'), body: t('career_agent.onboarding.overview_card1_body', 'We show the 5 career directions that best match your degree and specialisation — 10 if you have two degrees on file.') },
                    { num: '02', icon: <Target size={18} />, title: t('career_agent.onboarding.overview_card2_title', 'Pick a Primary, Secondary & Tertiary path'), body: t('career_agent.onboarding.overview_card2_body', 'Choose 3 directions in total. Pick from your recommendations, or browse any other direction within your own field of study.') },
                    { num: '03', icon: <Compass size={18} />, title: t('career_agent.onboarding.overview_card3_title', 'Browse every direction'), body: t('career_agent.onboarding.overview_card3_body', 'Recommendations come first, but nothing is off-limits — search and pick any direction from any degree or specialisation.') },
                    { num: '04', icon: <Lock size={18} />, title: t('career_agent.onboarding.overview_card4_title', 'Your 3 paths get locked'), body: t('career_agent.onboarding.overview_card4_body', 'After submitting, directions lock in after 14 days or 5 attempts — whichever comes first. Recommendations stay viewable afterwards.') },
                  ].map(r => (
                    <div key={r.num} className="ob-rule">
                      <div className="ob-rule-top">
                        <div className="ob-tile sm">{r.icon}</div>
                        <span className="ob-rule-num">{r.num}</span>
                      </div>
                      <div>
                        <h4>{r.title}</h4>
                        <p>{r.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {user && (
                  <div className="ob-strip">
                    <CheckCircle size={18} />
                    <p>
                      <strong>{t('career_agent.onboarding.profile_linked_label', 'Profile linked.')}</strong>{' '}
                      {t('career_agent.onboarding.profile_linked_body', 'Your name, email, phone and registration number are auto-filled from your SMAART profile — nothing to re-enter.')}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}


          {/* STEP 2: EDUCATION */}
          {step === 2 && (
            <>
              <CardHead
                icon={<GraduationCap size={20} />}
                title={t('career_agent.onboarding.education_title', 'Education')}
                subtitle={t('career_agent.onboarding.education_subtitle', 'Your academic background, from your student profile.')}
                step={t('career_agent.onboarding.step_indicator', 'STEP {{current}} / {{total}}', { current: 2, total: 6 })}
              />
              <div className="ob-body">
                <div className="ob-strip">
                  <Lock size={18} />
                  <p>
                    <strong>{t('career_agent.onboarding.education_locked_label', 'Auto-filled and locked.')}</strong>{' '}
                    {t('career_agent.onboarding.education_locked_body', "These details come from your student profile and can't be edited here. Contact your institute if anything is out of date.")}
                  </p>
                </div>

                {formData.education.map((edu, i) => (
                  <div key={i} className="ob-section">
                    <Eyebrow right={i === 0 ? <span className="step-tag">{t('career_agent.onboarding.primary_mandatory', 'Primary · Mandatory')}</span> : null}>
                      {t('career_agent.onboarding.academic_record', 'Academic record')} {String(i + 1).padStart(2, '0')}
                    </Eyebrow>

                    <div className="fgrid">
                      {/* Level */}
                      <div className="fg">
                        <label className="fl">Degree Level <span className="req">*</span></label>
                        <LockedField value={edu.level} placeholder="Not on file" />
                      </div>

                      {/* Domain */}
                      <div className="fg">
                        <label className="fl">Domain <span className="req">*</span></label>
                        <LockedField value={edu.domain} placeholder="Not on file" />
                      </div>

                      {/* Degree Group */}
                      <div className="fg">
                        <label className="fl">Degree Group <span className="req">*</span></label>
                        <LockedField value={edu.degreeGroup} placeholder="Not on file" />
                      </div>

                      {/* Graduation Year */}
                      <div className="fg">
                        <label className="fl">Year of Graduation / Expected <span className="req">*</span></label>
                        <LockedField value={edu.graduationYear} placeholder="Not on file" />
                      </div>

                      {/* Specialisation(s) */}
                      <div className="fg">
                        <label className="fl">Specialisation(s) <span className="req">*</span></label>
                        <LockedField
                          value={(edu.specialisation || []).join(', ')}
                          placeholder="Not on file"
                        />
                      </div>

                      {/* Currently Pursuing */}
                      <div className="fg">
                        <label className="fl">Currently Pursuing</label>
                        <LockedField value={edu.currentlyPursuing ? 'Yes' : 'No'} />
                      </div>
                    </div>
                  </div>
                ))}
                {/* No manual "Add Another Academic Qualification" button —
                    every field here is auto-filled and locked, so a
                    manually-added entry could never actually be filled in.
                    A genuine second concurrent degree is already picked up
                    automatically from the student's profile (any entry
                    marked "currently pursuing" produces its own block
                    above), so there is nothing left for a manual add to do. */}
              </div>
            </>
          )}

          {/* STEP 3: PRIMARY PREFERENCE */}
          {step === 3 && (
            <>
              <CardHead
                icon={<Trophy size={20} />}
                title={t('career_agent.onboarding.primary_title', 'Primary preference')}
                subtitle={t('career_agent.onboarding.primary_subtitle', 'Your main career direction — used for the deepest analysis.')}
                step={t('career_agent.onboarding.step_indicator', 'STEP {{current}} / {{total}}', { current: 3, total: 6 })}
              />
              <div className="ob-body">
                <PrefBlock label="Primary Preference" colorClass="primary" data={formData.preferences.primary} onChange={d => updatePref('primary', d)} directions={recommendedDirections} browseGroups={browseGroups} directionsLoading={directionsLoading} dbRoles={dbRoles} excludeRoles={[]} excludeDirections={[]} fieldErrors={validationState.fields} />
              </div>
            </>
          )}

          {/* STEP 4: SECONDARY PREFERENCE */}
          {step === 4 && (
            <>
              <CardHead
                icon={<Compass size={20} />}
                title={t('career_agent.onboarding.secondary_title', 'Secondary preference')}
                subtitle={t('career_agent.onboarding.secondary_subtitle', 'Your alternative path — helps calculate market zone overlap.')}
                step={t('career_agent.onboarding.step_indicator', 'STEP {{current}} / {{total}}', { current: 4, total: 6 })}
              />
              <div className="ob-body">
                <PrefBlock label="Secondary Preference" colorClass="secondary" data={formData.preferences.secondary} onChange={d => updatePref('secondary', d)} directions={recommendedDirections} browseGroups={browseGroups} directionsLoading={directionsLoading} dbRoles={dbRoles} excludeRoles={[formData.preferences.primary?.role].filter(Boolean)} excludeDirections={[formData.preferences.primary?.careerDirectionId].filter(Boolean)} fieldErrors={validationState.fields} />
              </div>
            </>
          )}

          {/* STEP 5: TERTIARY PREFERENCE */}
          {step === 5 && (
            <>
              <CardHead
                icon={<Target size={20} />}
                title={t('career_agent.onboarding.tertiary_title', 'Tertiary preference')}
                subtitle={t('career_agent.onboarding.tertiary_subtitle', 'Your backup or curiosity direction — gives a complete market view.')}
                step={t('career_agent.onboarding.step_indicator', 'STEP {{current}} / {{total}}', { current: 5, total: 6 })}
              />
              <div className="ob-body">
                <PrefBlock label="Tertiary Preference" colorClass="tertiary" data={formData.preferences.tertiary} onChange={d => updatePref('tertiary', d)} directions={recommendedDirections} browseGroups={browseGroups} directionsLoading={directionsLoading} dbRoles={dbRoles} excludeRoles={[formData.preferences.primary?.role, formData.preferences.secondary?.role].filter(Boolean)} excludeDirections={[formData.preferences.primary?.careerDirectionId, formData.preferences.secondary?.careerDirectionId].filter(Boolean)} fieldErrors={validationState.fields} />
              </div>
            </>
          )}

          {/* STEP 6: REVIEW & SUBMIT */}
          {step === 6 && (() => {
            const tiers = [
              { key: 'primary', label: t('career_agent.onboarding.tier_primary', 'Primary'), chip: '', val: formData.preferences.primary },
              { key: 'secondary', label: t('career_agent.onboarding.tier_secondary', 'Secondary'), chip: ' neutral', val: formData.preferences.secondary },
              { key: 'tertiary', label: t('career_agent.onboarding.tier_tertiary', 'Tertiary'), chip: ' neutral', val: formData.preferences.tertiary },
            ];
            const chosen = tiers.filter(x => x.val?.careerDirectionName || x.val?.role);
            const isRecommended = (val) => !!val?.careerDirectionId && careerDirections.some(d => d.directionId === val.careerDirectionId);
            const attemptsUsed = lockDetails?.attemptsUsed ?? 0;
            const maxAttempts = lockDetails?.maxAttempts ?? 5;
            const windowText = lockDetails?.found && lockDetails?.lockExpiryDate
              ? t('career_agent.onboarding.lock_days_left', '{{count}} days left', { count: lockDetails.remainingDays ?? 0 })
              : t('career_agent.onboarding.lock_window_default', '14 days from first submit');
            return (
              <>
                <CardHead
                  icon={<CheckCircle size={20} />}
                  title={t('career_agent.onboarding.review_title', 'Review & submit')}
                  subtitle={t('career_agent.onboarding.review_subtitle', 'Check everything before we generate your report.')}
                  step={t('career_agent.onboarding.step_indicator', 'STEP {{current}} / {{total}}', { current: 6, total: 6 })}
                />
                <div className="ob-body">

                  {/* Education */}
                  <div className="ob-section">
                    <Eyebrow>{t('career_agent.onboarding.review_education', 'Education')}</Eyebrow>
                    {formData.education.map((edu, idx) => (
                      <div key={idx} className="ob-review-row">
                        <div className="ob-edu-badge">{(edu.level || '').toLowerCase().includes('post') ? 'PG' : 'UG'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="ob-review-title">
                            {edu.degreeGroup || t('career_agent.onboarding.degree_not_set', 'Degree not set')}
                            {edu.specialisation?.length > 0 ? ` · ${edu.specialisation.join(', ')}` : ''}
                          </div>
                          <div className="ob-review-sub">
                            {[
                              edu.domain,
                              edu.graduationYear ? t('career_agent.onboarding.class_of', 'Class of {{year}}', { year: edu.graduationYear }) : null,
                              edu.currentlyPursuing ? t('career_agent.onboarding.currently_pursuing', 'Currently pursuing') : null,
                              edu.university || null,
                            ].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <span className="ob-chip done">{t('career_agent.onboarding.verified', 'Verified')}</span>
                      </div>
                    ))}
                  </div>

                  {/* Career directions */}
                  <div className="ob-section">
                    <Eyebrow right={<span className={`ob-chip${chosen.length === 3 ? ' done' : ' neutral'}`}>{chosen.length} of 3 {t('career_agent.onboarding.selected', 'selected')}</span>}>
                      {t('career_agent.onboarding.review_directions', 'Career directions')}
                    </Eyebrow>
                    {chosen.map(({ key, label, chip, val }) => (
                      <div key={key} className="ob-review-row">
                        <div className="ob-review-chip"><span className={`ob-chip${chip}`}>{label}</span></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="ob-review-title">{val.careerDirectionName || val.role}</div>
                          <div className="ob-review-sub">
                            {[
                              val.role && val.careerDirectionName ? t('career_agent.onboarding.role_prefix', 'Role: {{role}}', { role: val.role }) : null,
                              val.type || null,
                              val.salary || null,
                            ].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <span className="ob-review-right">
                          {isRecommended(val)
                            ? t('career_agent.onboarding.source_recommended', 'Recommended')
                            : val.careerDirectionId
                              ? t('career_agent.onboarding.source_browsed', 'Browsed · same field')
                              : t('career_agent.onboarding.source_custom', 'Custom role')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Locking */}
                  <div className="ob-section">
                    <Eyebrow>{t('career_agent.onboarding.review_locking', 'Locking')}</Eyebrow>
                    <div className="ob-stats">
                      <div className="ob-stat">
                        <span className="ob-stat-k">{t('career_agent.onboarding.attempts_used', 'Attempts used')}</span>
                        <span className="ob-stat-v">{attemptsUsed} of {maxAttempts}</span>
                      </div>
                      <div className="ob-stat">
                        <span className="ob-stat-k">{t('career_agent.onboarding.lock_window', 'Lock window')}</span>
                        <span className="ob-stat-v">{windowText}</span>
                      </div>
                      <div className="ob-stat">
                        <span className="ob-stat-k">{t('career_agent.onboarding.status', 'Status')}</span>
                        <span className="ob-stat-v">{t('career_agent.onboarding.not_locked', 'Not locked')}</span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="ob-strip warn">
                      <Info size={18} />
                      <p>{error}</p>
                    </div>
                  )}

                  <div className="ob-strip">
                    <Sparkles size={18} />
                    <p>
                      <strong>{t('career_agent.onboarding.next_label', 'What happens next.')}</strong>{' '}
                      {t('career_agent.onboarding.next_body', "SMAART's intelligence engine computes your career mapping and personalised roadmap. This usually takes 15–30 seconds.")}
                    </p>
                  </div>

                  <button type="submit" disabled={isSubmitting} className="ob-submit">
                    {isSubmitting
                      ? t('career_agent.onboarding.generating', 'Generating report…')
                      : t('career_agent.onboarding.generate_report', 'Generate Career Intelligence Report')}
                    {!isSubmitting && <ArrowRight size={16} />}
                  </button>
                </div>
              </>
            );
          })()}

          {/* VALIDATION ERROR BANNER */}
          <AnimatePresence>
            {validationState.messages.length > 0 && (
              <motion.div
                className="validation-banner"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="validation-banner-inner">
                  <div className="validation-banner-icon">
                    <Info size={18} />
                  </div>
                  <div className="validation-banner-content">
                    <div className="validation-banner-title">{t('career_agent.onboarding.complete_required', 'Complete all required fields to continue to the next step.')}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* NAVIGATION — card footer */}
          <div className="form-nav">
            <div className="ob-nav-l">
              {step > 1 && (
                <button type="button" className="btn-back" onClick={() => setStep(s => s - 1)}>
                  <ArrowLeft size={16} />
                  {t('career_agent.onboarding.back', 'Back')}
                </button>
              )}
              <button type="button" className="btn-reset" onClick={resetProfile}>
                {t('career_agent.onboarding.reset', 'Reset')}
              </button>
            </div>
            <div className="ob-nav-r">
              <span className={`ob-status${isCurrentStepComplete ? ' ok' : ''}`}>
                {isCurrentStepComplete
                  ? t('career_agent.onboarding.all_complete', 'All required details completed')
                  : t('career_agent.onboarding.step_of', 'Step {{current}} of {{total}}', { current: step, total: STEPS.length })}
              </span>
              {step < STEPS.length && (
                <button type="button" className={`btn-primary-onboard${validationState.messages.length > 0 ? ' shake' : ''}`} onClick={handleNext}>
                  {step === 1
                    ? t('career_agent.onboarding.continue', 'Continue')
                    : t('career_agent.onboarding.save_continue', 'Save & Continue')}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          </div>
        </form>

        </div>
      </div>
    </PageTransition>
  );
};

export default CareerAgentOnboarding;
