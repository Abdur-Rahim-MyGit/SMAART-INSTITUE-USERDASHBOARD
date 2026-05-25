import './careerAgent.css';
import React, { useState, useEffect, useRef } from 'react';
import PageTransition from '@/components/PageTransition';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { User, GraduationCap, Target, Briefcase, ShieldCheck, CheckCircle, MapPin, CreditCard, Clock, Compass, Search, Navigation, Zap, Trophy, Sparkles } from 'lucide-react';
import dropdownData from './data/dropdownData.json';
import jobRolesData from './data/jobRolesData.json';
import indianCities from './data/indianCities.json';
import useUser from '@/hooks/useUser';
import { useTranslation } from 'react-i18next';

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

// Education cascading: Level -> Domain -> DegreeGroup -> Specialisation
// Education cascading dynamic helpers
const getDomains = (eduData, level) => level && eduData[level] ? Object.keys(eduData[level] || {}) : [];
const getDegreeGroups = (eduData, level, domain) => level && domain && eduData[level]?.[domain] ? Object.keys(eduData[level]?.[domain] || {}) : [];
const getSpecialisations = (eduData, level, domain, degree) => level && domain && degree ? eduData[level]?.[domain]?.[degree] || [] : [];

const STEPS = ['Personal Details', 'Education', 'Primary Preference', 'Secondary Preference', 'Tertiary Preference', 'Review & Submit'];
const STEP_DISPLAY_LABELS = ['Personal', 'Education', 'Primary', 'Secondary', 'Tertiary', 'Review'];

const createEmptyValidationState = () => ({ messages: [], fields: {} });


// MultiSelect
function MultiSelect({ options, selected = [], onChange, max = 3, placeholder }) {
  const { t } = useTranslation();
  const displayPlaceholder = placeholder || t('career_agent.onboarding.select_placeholder', 'Select...');

  const toggle = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else if (selected.length < max) {
      onChange([...selected, opt]);
    }
  };


  return (
    <div>
      <div className="tags" style={{ marginBottom: '0.6rem' }}>
        {selected.map(s => (
          <span key={s} className="tag">
            {s} <button type="button" onClick={() => toggle(s)}>x</button>
          </span>
        ))}
        {selected.length === 0 && <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{displayPlaceholder}</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxHeight: '140px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          {options.map(opt => (
            <button
              key={opt} type="button"
              onClick={() => toggle(opt)}
              style={{
                padding: '0.25rem 0.75rem', fontSize: '0.72rem', borderRadius: '100px', cursor: 'pointer',
                fontFamily: 'var(--font)', border: '1px solid',
                background: selected.includes(opt) ? 'rgba(var(--accent-rgb), 0.2)' : 'rgba(255,255,255,0.03)',
                borderColor: selected.includes(opt) ? 'var(--accent)' : 'var(--border2)',
                color: selected.includes(opt) ? 'var(--text)' : 'var(--text2)',
                transition: 'all 0.15s',
                opacity: (!selected.includes(opt) && selected.length >= max) ? 0.4 : 1
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {max > 1 && <p style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.4rem' }}>{t('career_agent.onboarding.select_up_to', 'Select up to {{count}}.', { count: max })}</p>}
    </div>
  );
}

// RoleSearchInput
function RoleSearchInput({ value, onChange, sector, family, dbRoles = [] }) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef(null);

  const sectorRoles = getRoles(sector, family);
  const pool = dbRoles.length > 0 ? dbRoles : (sectorRoles.length > 0 ? sectorRoles : ALL_ROLES);
  const filtered = query.length > 0
    ? pool.filter(r => r && typeof r === 'string' && r.toLowerCase().includes(query.toLowerCase())).slice(0, 12)
    : [];

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder={t('career_agent.onboarding.role_placeholder', 'Type or search a job role...')}
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        style={{ width: '100%' }}
      />
      {show && filtered.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 12px 40px rgba(15,23,42,0.12)', maxHeight: '180px', overflowY: 'auto', marginTop: '6px' }}>
          {filtered.map(r => (
            <div
              key={r}
              onClick={() => { setQuery(r); onChange(r); setShow(false); }}
              style={{ padding: '0.75rem 1.1rem', cursor: 'pointer', fontSize: '0.85rem', color: '#334155', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// CitySearchInput
function CitySearchInput({ selected = [], onChange, max = 3 }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const cities = Array.isArray(indianCities) ? indianCities : (indianCities.cities || []);
  const filtered = query.length > 0
    ? cities.filter(c => c && typeof c === 'string' && c.toLowerCase().includes(query.toLowerCase())).slice(0, 10)
    : [];

  const add = (city) => {
    if (!selected.includes(city) && selected.length < max) {
      onChange([...selected, city]);
    }
    setQuery('');
  };
  const remove = (city) => onChange(selected.filter(c => c !== city));

  return (
    <div>
      <div className="tags" style={{ marginBottom: '0.4rem' }}>
        {selected.map(c => (
          <span key={c} className="tag">{c} <button type="button" onClick={() => remove(c)}>x</button></span>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <input type="text" placeholder={t('career_agent.onboarding.search_city_placeholder', 'Search city...')} value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={selected.length >= max}
          style={{ opacity: selected.length >= max ? 0.5 : 1 }}
        />
        {filtered.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 12px 40px rgba(15,23,42,0.12)', maxHeight: '160px', overflowY: 'auto', marginTop: '6px' }}>
            {filtered.map(c => (
              <div key={c} onClick={() => add(c)}
                style={{ padding: '0.7rem 1.1rem', cursor: 'pointer', fontSize: '0.85rem', color: '#334155', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >{c}</div>
            ))}
          </div>
        )}
      </div>
      <p style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.3rem' }}>{t('career_agent.onboarding.select_locations_limit', 'Select up to {{count}} locations', { count: max })}</p>
    </div>
  );
}

// CareerDirectionSelector
function CareerDirectionSelector({ directions = [], selected = null, onChange, loading = false, excludeRoles = [] }) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', background: 'var(--navy2)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ marginBottom: '0.8rem', color: 'var(--accent)' }}><Search size={24} className="animate-pulse" /></div>
        <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{t('career_agent.onboarding.sourcing_intelligence', 'Sourcing intelligence for your profile...')}</div>
      </div>
    );
  }

  if (directions.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '480px', overflowY: 'auto', paddingRight: '0.5rem' }}>
      {directions.map(dir => {
        const isSel = selected?.directionId === dir.directionId;
        const themeColor = 'var(--accent)';

        return (
          <div key={dir.directionId} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => onChange(isSel ? null : dir)}
              style={{
                width: '100%', textAlign: 'left', padding: '1.2rem',
                borderRadius: isSel ? '20px 20px 0 0' : '20px',
                cursor: 'pointer', fontFamily: 'inherit',
                border: isSel ? `1.5px solid var(--accent)` : '1px solid var(--border)',
                background: 'var(--card)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex', alignItems: 'center', gap: '1.2rem',
                boxShadow: isSel ? `0 15px 35px -5px rgba(var(--accent-rgb),0.15)` : 'none'
              }}
              onMouseEnter={e => { if (!isSel) { e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb),0.3)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.05)'; e.currentTarget.querySelector('.icon-box').style.transform = 'scale(1.1)'; } }}
              onMouseLeave={e => { if (!isSel) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.querySelector('.icon-box').style.transform = 'scale(1)'; } }}
            >
              <div className="icon-box" style={{
                width: '52px', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                background: isSel ? 'var(--accent)' : 'var(--navy2)',
                border: isSel ? '1px solid var(--accent)' : '1px solid var(--border)',
                color: isSel ? '#ffffff' : 'var(--muted)',
                boxShadow: isSel ? '0 4px 15px rgba(var(--accent-rgb),0.3)' : 'none'
              }}>
                <Target size={24} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: isSel ? 'var(--accent)' : 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem', transition: 'color 0.3s ease' }}>Career Pathway</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: isSel ? 'var(--accent)' : 'var(--text)', marginBottom: '0.2rem', letterSpacing: '-0.02em' }}>{dir.directionName}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{dir.directionDescription}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {isSel && (
                  <div style={{
                    background: 'var(--accent-tint)', color: 'var(--accent)', borderRadius: '50%',
                    width: '32px', height: '32px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    <CheckCircle size={18} strokeWidth={2.5} />
                  </div>
                )}
              </div>
            </button>
            {isSel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ padding: '1.2rem 1.5rem', background: `rgba(var(--accent-rgb),0.01)`, border: `1.5px solid var(--accent)`, borderTop: 'none', borderRadius: '0 0 20px 20px', overflow: 'hidden' }}
              >
                {dir.directionOverview && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: dir.roles?.length > 0 ? '0.8rem' : 0 }}>{dir.directionOverview}</p>
                )}
                {dir.roles && dir.roles.filter(r => !excludeRoles.includes(r.role)).length > 0 && (
                  <>
                    <div style={{ fontSize: '0.62rem', color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{t('career_agent.onboarding.core_entry_roles', 'Core Entry Roles')}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {dir.roles.filter(r => !excludeRoles.includes(r.role)).map((r, ri) => {
                        const isRoleSel = selected?.role === r.role;
                        return (
                          <button
                            key={ri}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onChange({ ...dir, role: r.role });
                            }}
                            style={{
                              fontSize: '0.65rem',
                              padding: '0.2rem 0.65rem',
                              background: isRoleSel ? 'var(--accent)' : '#fff',
                              border: isRoleSel ? '1px solid var(--accent)' : '1px solid var(--border2)',
                              borderRadius: '100px',
                              color: isRoleSel ? '#fff' : 'var(--text2)',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
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
      })}
    </div>
  );
}

function PrefBlock({ label, colorClass, data, onChange, directions = [], directionsLoading = false, dbRoles = [], excludeRoles = [], excludeDirections = [], fieldErrors = {} }) {
  const { t } = useTranslation();
  const sectors = ALL_SECTORS;
  const up = (field, val) => onChange({ ...data, [field]: val });

  // Priority branding
  const theme = {
    primary: { glow: 'rgba(var(--accent-rgb), 0.08)', bg: 'rgba(var(--accent-rgb), 0.1)', accent: 'var(--accent)', icon: <Trophy size={18} />, label: 'Primary Goal' },
    secondary: { glow: 'rgba(34,211,238,0.06)', bg: 'rgba(34,211,238,0.08)', accent: 'var(--accent2)', icon: <Compass size={18} />, label: 'Secondary Path' },
    tertiary: { glow: 'rgba(167,139,250,0.06)', bg: 'rgba(167,139,250,0.08)', accent: '#a78bfa', icon: <Sparkles size={18} />, label: 'Tertiary Option' }
  }[colorClass] || { glow: 'rgba(var(--accent-rgb), 0.08)', bg: 'rgba(var(--accent-rgb), 0.1)', accent: 'var(--accent)', icon: <Trophy size={18} />, label: 'Primary Goal' };

  const sectionLabelStyle = {
    fontSize: '0.7rem',
    fontWeight: 900,
    color: 'var(--text1)',
    letterSpacing: '0.15em',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    textTransform: 'uppercase'
  };

  const fieldErrorClass = (key) => fieldErrors[key] ? 'field-error' : '';

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid rgba(0,0,0,0.05)',
      borderRadius: '28px',
      padding: '2.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2.5rem',
      boxShadow: '0 15px 40px -10px rgba(0,0,0,0.04)',
      position: 'relative'
    }}>
      {/* Accent Line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: theme.accent }}></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

        {/* SECTION A: TARGET ROLE */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1.5rem' }}>
          <div style={sectionLabelStyle}><span style={{ color: theme.accent }}>01</span> {t('career_agent.onboarding.career_targeting', 'Career Targeting')}</div>
          {(directions.filter(d => !excludeDirections.includes(d.directionId)).length) > 0 ? (
            <div className="fgrid">
              <div className="fg full">
                <label className="fl">{t('career_agent.onboarding.desired_role', 'Desired Job Role')} <span className="req">*</span></label>
                <div className={fieldErrorClass(`preferences.${colorClass}.role`)}>
                  <RoleSearchInput value={data.role || ''} onChange={v => up('role', v)} dbRoles={dbRoles.filter(r => !excludeRoles.includes(r))} />
                </div>
              </div>
              <div className="fg full">
                <label className="fl" style={{ marginBottom: '0.6rem', display: 'block' }}>{t('career_agent.onboarding.career_directions', 'Career Directions')}</label>
                <CareerDirectionSelector
                  directions={directions.filter(d => !excludeDirections.includes(d.directionId))}
                  selected={data.careerDirection || null}
                  excludeRoles={excludeRoles}
                  onChange={dir => onChange({
                    ...data,
                    careerDirection: dir,
                    careerDirectionId: dir?.directionId || '',
                    careerDirectionName: dir?.directionName || '',
                    careerDirectionDescription: dir?.directionDescription || '',
                    role: dir?.role || dir?.directionName || ''
                  })}
                />
              </div>
            </div>
          ) : directions.length > 0 ? (
            <div className="fgrid">
              <div className="fg full">
                <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginBottom: '0.8rem', padding: '0.6rem 0.9rem', background: 'rgba(56,189,248,0.05)', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.1)' }}>
                  {t('career_agent.onboarding.directions_mapped_selected', 'Career directions mapped to your profile have been selected in previous preferences. Please type a specific desired job role below.')}
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
                <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginBottom: '0.8rem', padding: '0.6rem 0.9rem', background: 'rgba(245,158,11,0.05)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.1)' }}>
                  {t('career_agent.onboarding.complete_edu_first_to_load', 'Complete your Education details first to load directions, or type a role below.')}
                </div>
                <label className="fl">{t('career_agent.onboarding.desired_role', 'Desired Job Role')} <span className="req">*</span></label>
                <div className={fieldErrorClass(`preferences.${colorClass}.role`)}>
                  <RoleSearchInput value={data.role || ''} onChange={v => up('role', v)} dbRoles={dbRoles.filter(r => !excludeRoles.includes(r))} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION B: MARKET PREFERENCES */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <div style={sectionLabelStyle}><span style={{ color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={16} /> 02</span> {t('career_agent.onboarding.market_preferences', 'Market Preferences')}</div>
          <div className="fgrid">
            <div className="fg">
              <label className="fl">{t('career_agent.onboarding.assignment_type', 'Assignment Type')}</label>
              <select value={data.type || 'Full-Time'} onChange={e => up('type', e.target.value)}>
                {JOB_TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">{t('career_agent.onboarding.expected_ctc', 'Expected CTC (Range)')} <span className="req">*</span></label>
              <select className={fieldErrorClass(`preferences.${colorClass}.salary`)} value={data.salary || ''} onChange={e => up('salary', e.target.value)}>
                <option value="">{t('career_agent.onboarding.select_range', 'Select range...')}</option>
                {SALARY_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="fg full">
              <label className="fl">{t('career_agent.onboarding.location_preferences', 'Location Preferences (Max 3)')} <span className="req">*</span></label>
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

        {/* SECTION C: ORGANIZATION FIT */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <div style={sectionLabelStyle}><span style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Briefcase size={16} /> 03</span> {t('career_agent.onboarding.organization_fit', 'Organization Fit')}</div>
          <div className="fg full">
            <label className="fl">{t('career_agent.onboarding.target_cultures', 'Target Cultures (Multi)')} <span className="req">*</span></label>
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
    }
  };

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '1.8rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Row 1: Skill Name & Basic Status */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label className="fl">Skill Name</label>
            <input type="text" placeholder="e.g. Python, Figma, React" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
          </div>
          <div style={{ width: '220px' }}>
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

      <div style={{ marginTop: '1.2rem', padding: '0.9rem', background: 'var(--accent-tint)', borderRadius: '10px', border: '1px solid var(--accent-border)', fontSize: '0.72rem', color: 'var(--text2)', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
        <ShieldCheck size={20} style={{ color: 'var(--accent)' }} />
        <span>Providing certification details for <strong>Verified</strong> skills significantly boosts your platform ranking and visibility to potential employers.</span>
      </div>
    </div>
  );
}

// Main Component
const CareerAgentOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { t } = useTranslation();

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
  }, [isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // â”€â”€â”€ AUTO-FILL PERSONAL DETAILS FROM PROFILE â”€â”€â”€
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        personalDetails: {
          ...prev.personalDetails,
          name: prev.personalDetails.name || user.fullName || user.name || '',
          email: prev.personalDetails.email || user.email || '',
          phone: prev.personalDetails.phone || user.mobileNumber || user.mobile || user.phone || '',
          registrationNumber: prev.personalDetails.registrationNumber || user.studentId || user.registrationNumber || ''
        }
      }));
    }
  }, [user]);

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
  const [careerDirections, setCareerDirections] = useState([]);
  const [directionsLoading, setDirectionsLoading] = useState(false);

  // Career Direction: fetch directions for ALL selected specialisations and merge them.
  // If 2 specialisations are selected (each with 10 directions) → 20 total directions.
  // Secondary excludes the 1 picked as primary → 19 shown.
  // Tertiary excludes primary + secondary picks → 18 shown.
  useEffect(() => {
    const edu = formData.education[0];
    console.log('[CareerAgentOnboarding] Education changed:', edu);

    if (!edu?.level || !edu?.domain || !edu?.degreeGroup) {
      console.log('[CareerAgentOnboarding] Education incomplete. Clearing directions.');
      setCareerUniqueId(null);
      setCareerDirections([]);
      return;
    }

    // Collect all specialisations to fetch for (at least one — 'General' if none selected)
    const specs = edu.specialisation?.length > 0 ? edu.specialisation : ['General'];
    console.log('[CareerAgentOnboarding] Fetching directions for specs:', specs);

    setDirectionsLoading(true);

    // Fetch unique-id + directions for EACH specialisation in parallel
    const fetchForSpec = async (spec) => {
      try {
        const idRes = await axios.get('/api/career-agent/unique-id', {
          params: { level: edu.level, domain: edu.domain, degreeFullName: edu.degreeGroup, specialisation: spec }
        });
        if (!idRes.data.found || !idRes.data.uniqueId) return [];
        const dirRes = await axios.get(`/api/career-agent/directions/${idRes.data.uniqueId}`);
        return dirRes.data.found ? dirRes.data.directions : [];
      } catch (err) {
        console.warn(`[CareerAgentOnboarding] Failed for spec "${spec}":`, err.message);
        return [];
      }
    };

    Promise.all(specs.map(fetchForSpec))
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
        console.log(`[CareerAgentOnboarding] Merged ${merged.length} directions from ${specs.length} spec(s)`);
        setCareerDirections(merged);
      })
      .finally(() => setDirectionsLoading(false));

  }, [
    formData.education[0]?.level,
    formData.education[0]?.domain,
    formData.education[0]?.degreeGroup,
    JSON.stringify(formData.education[0]?.specialisation)
  ]);

  const updatePersonal = (field, val) => setFormData(f => ({ ...f, personalDetails: { ...f.personalDetails, [field]: val } }));
  const updateEdu = (i, field, val) => setFormData(f => {
    const edu = [...f.education]; edu[i] = { ...edu[i], [field]: val };
    // Reset lower cascading fields if higher fields change
    if (field === 'level') { edu[i].domain = ''; edu[i].degreeGroup = ''; edu[i].specialisation = []; }
    if (field === 'domain') { edu[i].degreeGroup = ''; edu[i].specialisation = []; }
    if (field === 'degreeGroup') { edu[i].specialisation = []; }
    return { ...f, education: edu };
  });
  const addEdu = () => setFormData(f => ({ ...f, education: [...f.education, { ...blankEdu }] }));
  const removeEdu = (i) => setFormData(f => ({ ...f, education: f.education.filter((_, idx) => idx !== i) }));
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
  const loadingMessages = [
    "Initializing v7 Intelligence Engine...",
    "Correlating Educational Background...",
    "Analyzing Technical Skill Coverage...",
    "Simulating Industry Market Match...",
    "Synthesizing Strategic Roadmap...",
    "Generating Full Analysis Report..."
  ];

  useEffect(() => {
    if (isSubmitting) {
      const interval = setInterval(() => {
        setSubmittingStep(s => (s < loadingMessages.length - 1 ? s + 1 : s));
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
            {t('career_agent.onboarding.loading_msg.' + submittingStep, loadingMessages[submittingStep])}
          </motion.p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <p style={{ color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 700, margin: 0 }}>{t('career_agent.onboarding.loading_engine_status', 'V7 ANALYSIS ENGINE ACTIVE')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="career-agent-page screen-onboard">
        {/* ── EDIT MODE BANNER ── shown when user came via "Not Interested" */}
        {isEditMode && (
          <div style={{ maxWidth: '680px', margin: '0 auto 1.5rem', padding: '0 1rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.35)',
              borderRadius: '16px', padding: '1rem 1.2rem',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem'
              }}>✏️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('career_agent.onboarding.reselecting_preference', 'Re-selecting {{tier}} Preference', { tier: editTier ? (editTier.charAt(0).toUpperCase() + editTier.slice(1)) : '' })}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: '0.15rem' }}>
                  {t('career_agent.onboarding.edit_mode_not_interested_desc', 'You marked this as "Not Interested". Pick a new direction and re-submit — only this preference will be updated.')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard/career-agent/dashboard')}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700,
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                  color: '#d97706', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap'
                }}
              >
                {t('common.back', '← Back')}
              </button>
            </div>
          </div>
        )}

      {/* ── STEP PROGRESS INDICATOR (hidden in edit mode) ── */}
      {!isEditMode && <div style={{ maxWidth: '680px', margin: '0 auto 2.5rem', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEPS.map((label, idx) => {
            const sn = idx + 1;
            const isDone = step > sn;
            const isActive = step === sn;
            const displayLabel = STEP_DISPLAY_LABELS[idx] || label;
            return (
              <React.Fragment key={sn}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem', minWidth: '92px', flex: '0 0 92px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 800, transition: 'all 0.3s',
                    background: isDone ? '#10b981' : isActive ? 'var(--accent)' : '#f1f5f9',
                    color: isDone || isActive ? '#fff' : '#94a3b8',
                    border: isActive ? '2px solid var(--accent)' : isDone ? '2px solid #10b981' : '2px solid #e2e8f0',
                    boxShadow: isActive ? '0 0 0 4px rgba(var(--accent-rgb),0.12)' : 'none',
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  }}>
                    {isDone ? 'OK' : sn}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div style={{ flex: 1, minWidth: '18px', height: '2px', background: step > sn ? '#10b981' : '#e2e8f0', borderRadius: '2px', marginTop: '18px', transition: 'background 0.3s' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>}

        <form onSubmit={handleSubmit}>
          {/* STEP 1: PERSONAL DETAILS */}
          {step === 1 && (
            <div className="form-card">
              <div className="step-title" style={{ display: 'flex', alignItems: 'center' }}><User size={22} style={{ color: 'var(--accent)', marginRight: '0.7rem', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.02em' }}>{t('career_agent.onboarding.personal_details', 'Personal Details')}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.1rem', fontWeight: 400 }}>{t('career_agent.onboarding.personal_details_subtitle', 'Your basic information to personalise your career report.')}</div>
                </div>
                <span className="step-tag">{t('career_agent.onboarding.step_indicator', 'STEP {{current}} / {{total}}', { current: 1, total: 6 })}</span>
              </div>


            {user && (
              <div style={{ background: 'var(--accent-tint)', border: '1px solid var(--accent-border)', borderRadius: '16px', padding: '1rem 1.2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={16} />
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600 }}>
                  Profile Linked: <span style={{ color: 'var(--text2)', fontWeight: 500 }}>We've auto-filled your details from your SMAART profile.</span>
                </div>
              )}

              <div className="fgrid">
                {/* Full Name */}
                <div className="fg">
                  <label className="fl">{t('career_agent.onboarding.full_name', 'Full Name')} <span className="req">*</span></label>
                  <input className={getFieldErrorClass('personal.name')} type="text" required placeholder="e.g. Priya Sharma"
                    value={formData.personalDetails.name}
                    onChange={e => updatePersonal('name', e.target.value)}
                  />
                </div>

                {/* Email Address */}
                <div className="fg">
                  <label className="fl">{t('career_agent.onboarding.email_address', 'Email Address')} <span className="req">*</span></label>
                  <input className={getFieldErrorClass('personal.email')} type="email" required placeholder="your@email.com"
                    value={formData.personalDetails.email}
                    onChange={e => updatePersonal('email', e.target.value)}
                  />
                </div>

                {/* Phone Number */}
                <div className="fg">
                  <label className="fl">{t('career_agent.onboarding.phone_number', 'Phone Number')} <span className="req">*</span></label>
                  <input className={getFieldErrorClass('personal.phone')} type="tel" placeholder="10-digit mobile number"
                    value={formData.personalDetails.phone}
                    onChange={e => updatePersonal('phone', e.target.value)}
                    maxLength={10}
                  />
                </div>

                {/* Registration Number */}
                <div className="fg">
                  <label className="fl">{t('career_agent.onboarding.reg_num', 'Registration Number')} <span className="req">*</span></label>
                  <input className={getFieldErrorClass('personal.registrationNumber')} type="text" placeholder="e.g. REG-12345"
                    value={formData.personalDetails.registrationNumber}
                    onChange={e => updatePersonal('registrationNumber', e.target.value)}
                  />
                </div>


              </div>

              <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                Your information is securely stored and used only for your report.
              </div>
            </div>
          )}


          {/* STEP 2: EDUCATION */}
          {step === 2 && (
            <div className="form-card">
              <div className="step-title" style={{ display: 'flex', alignItems: 'center' }}><GraduationCap size={22} style={{ color: 'var(--accent)', marginRight: '0.7rem', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.02em' }}>Education</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.1rem', fontWeight: 400 }}>Your academic background - you can add up to 3 qualifications.</div>
                </div>
                <span className="step-tag">STEP 2 / 6</span>
              </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {formData.education.map((edu, i) => (
                <div key={i} style={{ background: 'rgba(var(--accent-rgb), 0.02)', border: '1px solid rgba(var(--accent-rgb), 0.08)', borderRadius: '18px', padding: '1.8rem', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', transition: 'all 0.3s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px dashed rgba(var(--accent-rgb), 0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <div style={{ background: i === 0 ? 'var(--accent)' : 'var(--navy2)', color: i === 0 ? '#fff' : 'var(--text1)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, boxShadow: i === 0 ? '0 4px 10px rgba(var(--accent-rgb), 0.3)' : 'none' }}>
                        {i + 1}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.01em' }}>
                          Academic Record
                        </span>
                        {i === 0 && <span style={{ color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary & Mandatory</span>}
                      </div>
                      {i > 0 && (
                        <button type="button" onClick={() => removeEdu(i)} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: '8px', padding: '0.35rem 0.8rem', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="fgrid">
                      {/* Level */}
                      <div className="fg">
                        <label className="fl">Degree Level <span className="req">*</span></label>
                        <select className={i === 0 ? getFieldErrorClass('education.0.level') : ''} required={i === 0} value={edu.level} onChange={e => updateEdu(i, 'level', e.target.value)}>
                          <option value="">Select Level...</option>
                          {Object.keys(eduData).map(l => <option key={l}>{l}</option>)}
                        </select>
                      </div>

                      {/* Domain */}
                      <div className="fg">
                        <label className="fl">Domain <span className="req">*</span></label>
                        <select className={i === 0 ? getFieldErrorClass('education.0.domain') : ''} required={i === 0} value={edu.domain} onChange={e => updateEdu(i, 'domain', e.target.value)} disabled={!edu.level}>
                          <option value="">Select Domain...</option>
                          {getDomains(eduData, edu.level).map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>

                      {/* Degree Group */}
                      <div className="fg">
                        <label className="fl">Degree Group <span className="req">*</span></label>
                        <select className={i === 0 ? getFieldErrorClass('education.0.degreeGroup') : ''} required={i === 0} value={edu.degreeGroup} onChange={e => updateEdu(i, 'degreeGroup', e.target.value)} disabled={!edu.domain}>
                          <option value="">Select Degree...</option>
                          {getDegreeGroups(eduData, edu.level, edu.domain).map(d => <option key={d}>{d}</option>)}
                        </select>
                      </div>

                      {/* Graduation Year */}
                      <div className="fg">
                        <label className="fl">Year of Graduation / Expected <span className="req">*</span></label>
                        <input className={i === 0 ? getFieldErrorClass('education.0.graduationYear') : ''} type="number" placeholder="e.g. 2024" min="2010" max="2040" value={edu.graduationYear} onChange={e => updateEdu(i, 'graduationYear', e.target.value)} />
                      </div>

                      {/* Specialisation (Multi) */}
                      <div className="fg">
                        <label className="fl">Specialisation(s) <span className="req">*</span></label>
                        <div className={i === 0 ? getFieldErrorClass('education.0.specialisation') : ''}>
                          <MultiSelect
                            options={getSpecialisations(eduData, edu.level, edu.domain, edu.degreeGroup)}
                            selected={edu.specialisation || []}
                            onChange={v => updateEdu(i, 'specialisation', v)}
                            max={2}
                            placeholder="Select specialisation(s)..."
                          />
                        </div>
                      </div>

                      {/* Currently Pursuing */}
                      <div className="fg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text2)', fontWeight: 600, padding: '0.6rem 0', height: '42px' }}>
                          <input type="checkbox" checked={edu.currentlyPursuing} onChange={e => updateEdu(i, 'currentlyPursuing', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }} />
                          Currently Pursuing this degree
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {formData.education.length < 3 && (
                <button type="button" onClick={addEdu} 
                  style={{ background: 'rgba(var(--accent-rgb), 0.04)', border: '1.5px dashed rgba(var(--accent-rgb), 0.25)', color: 'var(--accent)', borderRadius: '16px', padding: '1.2rem', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font)', fontWeight: 700, width: '100%', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.01)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.08)'; e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.04)'; e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.25)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <span style={{ fontSize: '1.2rem', fontWeight: 400, lineHeight: 1 }}>+</span> Add Another Academic Qualification
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: PRIMARY PREFERENCE */}
        {step === 3 && (
          <div className="form-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.8rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.15), rgba(var(--accent-rgb), 0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(var(--accent-rgb), 0.2)' }}>
                <Trophy size={22} color="var(--accent)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.02em' }}>Primary Preference</span>
                  <span className="step-tag">STEP 3 / 6</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem', fontWeight: 400 }}>Your main career direction - used for your deepest intelligence analysis.</p>
              </div>
            </div>
          )}

          {/* STEP 3: PRIMARY PREFERENCE */}
          {step === 3 && (
            <div className="form-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.8rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(37,99,235,0.2)' }}>
                  <Trophy size={22} color="var(--accent)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.02em' }}>Primary Preference</span>
                    <span className="step-tag">STEP 3 / 6</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem', fontWeight: 400 }}>Your main career direction - used for your deepest intelligence analysis.</p>
                </div>
              </div>
              <PrefBlock label="Primary Preference" colorClass="primary" data={formData.preferences.primary} onChange={d => updatePref('primary', d)} directions={careerDirections} directionsLoading={directionsLoading} dbRoles={dbRoles} excludeRoles={[]} excludeDirections={[]} fieldErrors={validationState.fields} />
            </div>
          )}

          {/* STEP 4: SECONDARY PREFERENCE */}
          {step === 4 && (
            <div className="form-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.8rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(34,211,238,0.2)' }}>
                  <Compass size={22} color="var(--accent2)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.02em' }}>Secondary Preference</span>
                    <span className="step-tag">STEP 4 / 6</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem', fontWeight: 400 }}>Your alternative path - helps calculate market zone overlap.</p>
                </div>
              </div>
              <PrefBlock label="Secondary Preference" colorClass="secondary" data={formData.preferences.secondary} onChange={d => updatePref('secondary', d)} directions={careerDirections} directionsLoading={directionsLoading} dbRoles={dbRoles} excludeRoles={[formData.preferences.primary?.role].filter(Boolean)} excludeDirections={[formData.preferences.primary?.careerDirectionId].filter(Boolean)} fieldErrors={validationState.fields} />
            </div>
          )}

          {/* STEP 5: TERTIARY PREFERENCE */}
          {step === 5 && (
            <div className="form-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.8rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(167,139,250,0.2)' }}>
                  <Sparkles size={22} color="#a78bfa" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.02em' }}>Tertiary Preference</span>
                    <span className="step-tag">STEP 5 / 6</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem', fontWeight: 400 }}>Your backup or curiosity direction - gives a complete market view.</p>
                </div>
              </div>
              <PrefBlock label="Tertiary Preference" colorClass="tertiary" data={formData.preferences.tertiary} onChange={d => updatePref('tertiary', d)} directions={careerDirections} directionsLoading={directionsLoading} dbRoles={dbRoles} excludeRoles={[formData.preferences.primary?.role, formData.preferences.secondary?.role].filter(Boolean)} excludeDirections={[formData.preferences.primary?.careerDirectionId, formData.preferences.secondary?.careerDirectionId].filter(Boolean)} fieldErrors={validationState.fields} />
            </div>
          )}

            {/* Summary Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>

              {/* Education Summary */}
              <div style={{ background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.04), rgba(var(--accent-rgb), 0.01))', border: '1px solid rgba(var(--accent-rgb), 0.12)', borderRadius: '16px', padding: '1.2rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                  <GraduationCap size={15} color="var(--accent)" />
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Education History</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text1)', letterSpacing: '-0.02em' }}>Review & Submit</span>
                    <span className="step-tag">STEP 6 / 6</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Review your profile before submitting. SMAART will generate your personalised career intelligence report.</p>
                </div>
              </div>

              {/* Summary Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>

                {/* Education Summary */}
                <div style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.04), rgba(37,99,235,0.01))', border: '1px solid rgba(37,99,235,0.12)', borderRadius: '16px', padding: '1.2rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                    <GraduationCap size={15} color="var(--accent)" />
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Education History</span>
                  </div>
                  {formData.education.map((edu, idx) => (
                    <div key={idx} style={{ marginBottom: idx < formData.education.length - 1 ? '0.6rem' : 0 }}>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text1)', fontWeight: 700 }}>{edu.degreeGroup || 'Not set'} {edu.specialisation?.length > 0 ? `in ${edu.specialisation.join(', ')}` : ''}</p>
                      {edu.graduationYear && <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.1rem' }}>Class of {edu.graduationYear}{edu.currentlyPursuing ? ' - Currently Pursuing' : ''}</p>}
                    </div>
                  ))}
                </div>

                {/* Career Directions Summary */}
                <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.04), rgba(245,158,11,0.01))', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '16px', padding: '1.2rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                    <Target size={15} color="#f59e0b" />
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Career Directions</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {[{ label: 'Primary', color: 'var(--accent)', val: formData.preferences.primary }, { label: 'Secondary', color: 'var(--accent2)', val: formData.preferences.secondary }, { label: 'Tertiary', color: '#a78bfa', val: formData.preferences.tertiary }].map(({ label, color, val }) => (
                      (val?.careerDirectionName || val?.role) && (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <span style={{ fontSize: '0.6rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '60px' }}>{label}</span>
                          <span style={{ fontSize: '0.88rem', color: 'var(--text1)', fontWeight: 600 }}>{val?.careerDirectionName || val?.role}</span>
                          {val?.role && val?.careerDirectionName && <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Role: {val.role}</span>}
                        </div>
                      )
                    ))}
                  </div>
                </div>

              </div>

              {error && (
                <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {error}
                </div>
              )}

              <div style={{ background: 'linear-gradient(135deg,rgba(37,99,235,0.06),rgba(34,211,238,0.03))', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '14px', padding: '1rem 1.2rem', marginBottom: '1.5rem', fontSize: '0.82rem', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <Sparkles size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
                Once submitted, SMAART's intelligence engine will compute your career mapping and personalized roadmap. This typically takes 15-30 seconds.
              </div>

            <div style={{ background: 'linear-gradient(135deg,rgba(var(--accent-rgb),0.06),rgba(34,211,238,0.03))', border: '1px solid rgba(var(--accent-rgb),0.15)', borderRadius: '14px', padding: '1rem 1.2rem', marginBottom: '1.5rem', fontSize: '0.82rem', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <Sparkles size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
              Once submitted, SMAART's intelligence engine will compute your career mapping and personalized roadmap. This typically takes 15-30 seconds.
            </div>
          )}

            <button type="submit" style={{ width: '100%', padding: '1rem 2rem', fontSize: '0.95rem', fontWeight: 800, borderRadius: '14px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7rem', boxShadow: '0 10px 30px rgba(var(--accent-rgb), 0.25)', transition: 'all 0.2s', fontFamily: 'var(--font)' }} disabled={isSubmitting} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
              <Sparkles size={18} />
              {isSubmitting ? 'Generating Report...' : 'Generate Career Intelligence Report'}
            </button>
          </div>
        )}

        {/* VALIDATION ERROR BANNER */}
        <AnimatePresence>
          {validationState.messages.length > 0 && (
            <motion.div
              className="validation-banner"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="validation-banner-inner">
                <div className="validation-banner-icon">
                  <ShieldCheck size={20} />
                </div>
                <div className="validation-banner-content">
                  <div className="validation-banner-title">Complete all required fields to continue to the next step.</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* NAVIGATION */}
          <div className="form-nav">
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              {step > 1 && (
                <button type="button" className="btn-back" onClick={() => setStep(s => s - 1)}>
                  Back
                </button>
              )}
              <button type="button" className="btn-reset" onClick={resetProfile}>
                Reset
              </button>
            </div>
            <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isCurrentStepComplete ? '#10b981' : 'var(--muted)' }}>
                {isCurrentStepComplete ? 'All required details completed' : `Step ${step} of ${STEPS.length}`}
              </span>
              {step < STEPS.length && (
                <button type="button" className={`btn-primary-onboard${validationState.messages.length > 0 ? ' shake' : ''}`} onClick={handleNext}>
                  Save & Continue <Navigation size={16} />
                </button>
              )}
            </div>
          </div>

        </form>
      </div>
    </PageTransition>
  );
};

export default CareerAgentOnboarding;
