import React, { useState, useEffect, useRef } from 'react';
import { Award, BookOpen, Star, AlertCircle, RefreshCw, Cpu, BrainCircuit, Building2 } from 'lucide-react';

// ─── Category config ───────────────────────────────────────────────────────────
const CATS = [
  { key: 'technical', label: 'Technical Skills',  color: '#3b82f6', Icon: Cpu },
  { key: 'ai',        label: 'AI & Data Skills',  color: '#8b5cf6', Icon: BrainCircuit },
  { key: 'domain',    label: 'Domain Skills',      color: '#10b981', Icon: Building2 },
];

// ─── Cert Card ─────────────────────────────────────────────────────────────────
const CertCard = ({ cert, totalRoles }) => {
  const [hovered, setHovered]         = useState(false);
  const [rolesHovered, setRolesHover] = useState(false);
  const catConf = CATS.find(c => {
    if (cert.category === 'Technical') return c.key === 'technical';
    if (cert.category === 'AI-Tool')   return c.key === 'ai';
    return c.key === 'domain';
  }) || CATS[0];
  const color    = catConf.color;
  const provider = (cert.provider || '').split(' – ')[0].split(' / ')[0].trim().slice(0, 24);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--card-hover, rgba(26,56,132,0.06))' : 'var(--card-bg, rgba(255,255,255,0.9))',
        border: `1px solid ${hovered ? color + '50' : 'var(--border, rgba(0,0,0,0.1))'}`,
        borderRadius: '12px',
        padding: '1rem 1.1rem 0.9rem',
        transition: 'all 0.18s ease',
        cursor: 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        minHeight: '110px',
        position: 'relative',
        boxShadow: hovered ? `0 4px 16px ${color}18` : '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Row 1: Cert name + X/10 Roles badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.6rem' }}>
        <span style={{ fontSize: '0.87rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.45, flex: 1 }}>
          {cert.name}
        </span>

        {/* Roles badge — hover shows tooltip with role names */}
        <div
          style={{ position: 'relative', flexShrink: 0 }}
          onMouseEnter={e => { e.stopPropagation(); setRolesHover(true); }}
          onMouseLeave={e => { e.stopPropagation(); setRolesHover(false); }}
        >
          <span style={{
            display: 'inline-block',
            padding: '0.15rem 0.5rem',
            background: `${color}22`,
            border: `1px solid ${color}50`,
            borderRadius: '20px',
            fontSize: '0.62rem', fontWeight: 700,
            color, whiteSpace: 'nowrap',
          }}>
            {cert.roleCount}/{totalRoles} Roles
          </span>

          {rolesHovered && cert.roles && cert.roles.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              background: 'var(--tooltip-bg, #ffffff)',
              border: `1px solid ${color}40`,
              borderRadius: '10px',
              padding: '0.65rem 0.85rem',
              zIndex: 9999,
              minWidth: '185px',
              boxShadow: `0 10px 30px rgba(0,0,0,0.15), 0 0 0 1px ${color}20`,
              pointerEvents: 'none',
            }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                Required by {cert.roles.length} roles
              </div>
              {cert.roles.map((r, i) => (
                <div key={i} style={{ fontSize: '0.71rem', color: 'var(--text2)', paddingBottom: '0.26rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                  {r}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Provider */}
      {provider && (
        <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{provider}</div>
      )}

      {/* Row 3: Skill name tag only */}
      {cert.skillName && (
        <div style={{ marginTop: 'auto' }}>
          <span style={{
            padding: '0.18rem 0.55rem',
            background: `${color}12`,
            border: `1px solid ${color}30`,
            borderRadius: '5px',
            fontSize: '0.68rem', color: 'var(--text2)',
          }}>
            {cert.skillName}
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Section (Foundational / Specialization style) ────────────────────────────
const CertSection = ({ catKey, label, color, Icon, certs, totalRoles }) => {
  if (!certs || certs.length === 0) return null;
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      {/* Section header — same style as Career Roadmap */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        marginBottom: '1.2rem',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: `${color}20`, border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.07em', color: 'var(--text2)', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{
          padding: '0.1rem 0.5rem',
          background: `${color}15`,
          border: `1px solid ${color}30`,
          borderRadius: '12px',
          fontSize: '0.68rem', fontWeight: 700,
          color,
        }}>
          {certs.length}
        </span>
      </div>

      {/* Grid of cert cards — same as roadmap */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: '0.85rem',
      }}>
        {certs.map((cert, i) => (
          <CertCard key={cert.skillId || i} cert={cert} totalRoles={totalRoles} />
        ))}
      </div>
    </div>
  );
};

// ─── Main Certifications Component ────────────────────────────────────────────
const Certifications = ({ roleName, directionName, directionRoles = [] }) => {
  const [data, setData] = useState({ technical: [], ai: [], domain: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const lastKey = useRef(null);

  const roleList   = directionRoles.length > 0 ? directionRoles.filter(Boolean) : roleName ? [roleName] : [];
  const totalRoles = roleList.length;

  // ── Fetch ALL roles in parallel, deduplicate, count X/Y Roles ───────────────
  useEffect(() => {
    if (roleList.length === 0) return;
    const key = roleList.join('|');
    if (key === lastKey.current) return;
    lastKey.current = key;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          roleList.map(role =>
            fetch(`/api/career-agent/certifications/${encodeURIComponent(role)}`, { credentials: 'include' })
              .then(r => r.ok ? r.json() : { technical: [], ai: [], domain: [] })
              .catch(() => ({ technical: [], ai: [], domain: [] }))
          )
        );

        // Deduplicate by skillId, count roleCount AND track role names for tooltip
        const techMap = {}, aiMap = {}, domMap = {};

        const merge = (list, map, roleName) => {
          (list || []).forEach(cert => {
            const id = cert.skillId || cert.name;
            if (!map[id]) {
              map[id] = { ...cert, roleCount: 0, roles: [] };
            }
            map[id].roleCount++;
            map[id].roles.push(roleName);   // ← push role name for tooltip
          });
        };

        results.forEach((res, idx) => {
          const roleName = roleList[idx];   // ← which role this result belongs to
          merge(res.technical, techMap, roleName);
          merge(res.ai,        aiMap,  roleName);
          merge(res.domain,    domMap, roleName);
        });


        // Sort by roleCount DESC (most-common first — like foundational)
        const sort = map => Object.values(map).sort((a, b) => b.roleCount - a.roleCount);

        if (!cancelled) {
          setData({ technical: sort(techMap), ai: sort(aiMap), domain: sort(domMap) });
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) { setError(e.message); setLoading(false); }
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [roleList.join('|')]);

  // Reset when direction changes
  useEffect(() => {
    lastKey.current = null;
    setData({ technical: [], ai: [], domain: [] });
  }, [directionName]);

  const total = data.technical.length + data.ai.length + data.domain.length;

  return (
    <div style={{ padding: '0.5rem 0' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.8rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <Award size={22} color="var(--accent)" />
          Certifications
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.84rem', maxWidth: '640px', lineHeight: 1.6 }}>
          Industry-recognised certifications mapped across all <strong style={{ color: 'var(--text2)' }}>{totalRoles} roles</strong> in
          {directionName ? <> the <strong style={{ color: 'var(--accent)' }}> {directionName}</strong> career path</> : ' this career path'}.
          Each certificate shows how many roles recommend it.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '280px', gap: '1rem' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid rgba(79,142,247,0.2)', borderTopColor: '#4f8ef7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Loading certifications for all {totalRoles} roles…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', minHeight: '220px', justifyContent: 'center' }}>
          <AlertCircle size={32} color="#ef4444" />
          <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>Could not load certifications</p>
          <button onClick={() => { lastKey.current = null; setData({ technical: [], ai: [], domain: [] }); }}
            style={{ padding: '0.5rem 1.2rem', background: 'rgba(79,142,247,0.15)', border: '1px solid rgba(79,142,247,0.3)', borderRadius: '8px', color: '#4f8ef7', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* No data */}
      {!loading && !error && total === 0 && (
        <div style={{ textAlign: 'center', minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '2.5rem', opacity: 0.25 }}>🎓</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No certifications found for this career path.</p>
        </div>
      )}

      {/* Sections — Technical / AI / Domain — like Career Roadmap */}
      {!loading && !error && total > 0 && CATS.map(cat => (
        <CertSection
          key={cat.key}
          catKey={cat.key}
          label={cat.label}
          color={cat.color}
          Icon={cat.Icon}
          certs={data[cat.key]}
          totalRoles={totalRoles}
        />
      ))}

    </div>
  );
};

export default Certifications;
