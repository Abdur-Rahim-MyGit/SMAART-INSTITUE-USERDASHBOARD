import React, { useState, useEffect, useRef } from 'react';
import { Award, AlertCircle, RefreshCw, Code, Bot, Building, Building2, IconCertificate, CheckCircle, Users } from '@/components/icons';
import { Spinner, EmptyState, CardHead } from './shared';

// ─── Category config ───────────────────────────────────────────────────────────
const CATS = [
  { key: 'technical', label: 'Technical certifications', sub: 'Tools, platforms and hands-on skills', Icon: Code },
  { key: 'ai',        label: 'AI & data certifications', sub: 'AI assistants, analytics and data tooling', Icon: Bot },
  { key: 'domain',    label: 'Domain certifications',    sub: 'Subject-matter credentials for the field', Icon: Building },
];

// Certificate names in the data often repeat the provider and the pricing in the
// title ("Statistics with Python – Coursera / University of Michigan (Free audit)").
// The provider has its own row and "free" its own tag, so keep the title itself short.
const providerOf = (cert) => (cert.provider || '').split(' – ')[0].split(' / ')[0].trim();

const FREE_RE = /\(\s*free[^)]*\)/i;

const cleanCertName = (raw = '') => {
  let name = String(raw).replace(FREE_RE, '').trim();
  const dash = name.search(/\s[–—-]\s/);
  if (dash > 12) name = name.slice(0, dash);
  return name.replace(/[\s,–—-]+$/, '').trim() || String(raw).trim();
};

// ─── Cert Card ─────────────────────────────────────────────────────────────────
const CertCard = ({ cert, totalRoles }) => {
  const [tip, setTip] = useState(false);
  const provider = providerOf(cert);
  const isFree = FREE_RE.test(cert.name || '') || /free/i.test(cert.provider || '');
  return (
    <div className="cert-card">
      <div className="cert-top">
        <div className="cert-ic"><IconCertificate size={18} /></div>
        <div className="cert-name" title={cert.name}>{cleanCertName(cert.name)}</div>
      </div>
      {provider && <div className="cert-prov"><Building2 size={14} /><span>{provider}</span></div>}
      {cert.skillName && (
        <div className="cert-skill" title={cert.skillName}>
          <b>Skill covered</b>
          {cert.skillName}
        </div>
      )}
      <div className="cert-foot">
        {isFree ? <span className="cert-free"><CheckCircle size={14} /> Free</span> : <span />}
        <span
          className="rm-count"
          onMouseEnter={() => setTip(true)}
          onMouseLeave={() => setTip(false)}
        >
          <span className="ic"><Users size={13} /></span>
          {cert.roleCount}/{totalRoles} roles
          {tip && cert.roles?.length > 0 && (
            <div className="rm-tip">
              <div className="rm-tip-h">Recommended for</div>
              {cert.roles.map((r, i) => <div key={i} className="rm-tip-i">{r}</div>)}
            </div>
          )}
        </span>
      </div>
    </div>
  );
};

// ─── Section ───────────────────────────────────────────────────────────────────
const CertSection = ({ label, sub, Icon, certs, totalRoles }) => {
  if (!certs || certs.length === 0) return null;
  return (
    <div className="dp-card">
      <CardHead icon={<Icon size={20} />} title={label} sub={sub} right={<span className="dchip">{certs.length}</span>} />
      <div className="cert-grid">
        {certs.map((cert, i) => <CertCard key={cert.skillId || i} cert={cert} totalRoles={totalRoles} />)}
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

  // ── Fetch ALL roles in parallel, deduplicate, count X/Y roles ───────────────
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

        const techMap = {}, aiMap = {}, domMap = {};
        const merge = (list, map, rName) => {
          (list || []).forEach(cert => {
            const id = cert.skillId || cert.name;
            if (!map[id]) map[id] = { ...cert, roleCount: 0, roles: [] };
            map[id].roleCount++;
            map[id].roles.push(rName);
          });
        };
        results.forEach((res, idx) => {
          const rName = roleList[idx];
          merge(res.technical, techMap, rName);
          merge(res.ai,        aiMap,  rName);
          merge(res.domain,    domMap, rName);
        });
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

  if (loading) return <Spinner text={`Loading certifications across ${totalRoles} roles…`} />;

  if (error) {
    return (
      <div className="state">
        <div className="state-ic" style={{ color: 'var(--red)' }}><AlertCircle size={24} /></div>
        <div className="state-t">Could not load certifications</div>
        <button type="button" className="btn-ghost" onClick={() => { lastKey.current = null; setData({ technical: [], ai: [], domain: [] }); }}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  if (total === 0) {
    return <EmptyState icon={<Award size={24} />} title="No certifications mapped yet" text="No certifications are mapped for this career direction in the database yet." />;
  }

  return (
    <div className="dp animate-fade-in">
      <div className="dp-grid-4">
        <div className="stat"><div className="stat-k">Certifications</div><div className="stat-v brand">{total}</div><div className="stat-s">across {totalRoles} roles{directionName ? ` in ${directionName}` : ''}</div></div>
        <div className="stat"><div className="stat-k">Technical</div><div className="stat-v">{data.technical.length}</div><div className="stat-s">tools &amp; platforms</div></div>
        <div className="stat"><div className="stat-k">AI &amp; data</div><div className="stat-v">{data.ai.length}</div><div className="stat-s">AI assistants &amp; analytics</div></div>
        <div className="stat"><div className="stat-k">Domain</div><div className="stat-v">{data.domain.length}</div><div className="stat-s">subject-matter credentials</div></div>
      </div>
      {CATS.map(cat => (
        <CertSection key={cat.key} label={cat.label} sub={cat.sub} Icon={cat.Icon} certs={data[cat.key]} totalRoles={totalRoles} />
      ))}
    </div>
  );
};

export default Certifications;
