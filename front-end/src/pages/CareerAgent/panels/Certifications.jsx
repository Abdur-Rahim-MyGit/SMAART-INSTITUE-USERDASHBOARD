import React, { useState, useEffect, useRef } from 'react';
import { Award, ExternalLink, ShieldCheck, Clock, BookOpen, Star, ChevronRight, Cpu, BrainCircuit, Building2, AlertCircle, RefreshCw } from 'lucide-react';

// ─── Static fallback colours per provider ────────────────────────────────────
const PROVIDER_COLORS = {
  'Coursera': 'var(--accent)',
  'AWS Training': 'var(--amber)',
  'AWS': 'var(--amber)',
  'Microsoft Learn': '#00a4ef',
  'Microsoft': '#00a4ef',
  'Google Cloud': '#34a853',
  'Google': '#34a853',
  'DeepLearning.AI': '#ff6f00',
  'IBM': 'var(--accent2)',
  'GitHub': '#24292f',
  'GitHub (Microsoft)': '#24292f',
  'LinkedIn Learning': '#0a66c2',
  'Oracle': '#e34f26',
  'Linux Foundation': '#326ce5',
  'Hugging Face': '#ff9d00',
  'PMI': '#5b248a',
  'Scrum Alliance': '#00558c',
  'Axelos': '#008a9f',
  'MeitY (India)': '#1d6c3c',
  'Udemy': '#a435f0',
};

const getProviderColor = (provider) => {
  if (!provider) return 'var(--accent)';
  for (const [key, color] of Object.entries(PROVIDER_COLORS)) {
    if (provider.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return 'var(--accent)';
};

// ─── Extract provider short-name from issuing_body string ────────────────────
const extractProvider = (issuingBody) => {
  if (!issuingBody) return 'Online Platform';
  // e.g. "Google / Coursera" → "Google / Coursera" (truncate at first " – ")
  const trimmed = issuingBody.split(' – ')[0].trim();
  return trimmed.length > 30 ? trimmed.slice(0, 30) + '…' : trimmed;
};

// ─── CertCard ─────────────────────────────────────────────────────────────────
const CertCard = ({ cert, hoveredId, onEnter, onLeave }) => {
  const color = getProviderColor(cert.provider);
  const isHovered = hoveredId === cert.id;
  const provider = extractProvider(cert.provider);

  return (
    <a
      href={cert.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => onEnter(cert.id)}
      onMouseLeave={() => onLeave()}
      style={{
        textDecoration: 'none',
        background: 'var(--navy2)',
        border: `1px solid ${isHovered ? color : 'var(--border)'}`,
        borderRadius: '16px',
        padding: '1.5rem',
        transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? `0 12px 24px -8px ${color}40` : '0 4px 12px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: '-50px', right: '-50px',
        width: '100px', height: '100px',
        background: color,
        filter: 'blur(40px)',
        opacity: isHovered ? 0.3 : 0.05,
        transition: 'opacity 0.4s',
      }} />

      {/* Provider & link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.7rem',
          borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600',
          color: 'var(--text2)', border: '1px solid var(--border)',
        }}>
          <ShieldCheck size={14} color={color} />
          {provider}
        </div>
        <div style={{
          color: isHovered ? 'var(--text)' : 'var(--muted)',
          transition: 'color 0.3s',
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          fontSize: '0.75rem', fontWeight: 600,
        }}>
          View Course <ExternalLink size={14} />
        </div>
      </div>

      {/* Certificate name */}
      <h4 style={{
        fontSize: '1rem',
        color: 'var(--text)',
        marginBottom: '1rem',
        lineHeight: '1.45',
        flex: 1,
      }}>
        {cert.name || cert.skillName || 'Certification'}
      </h4>

      {/* Fee badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
          <Star size={14} color="var(--amber)" />
          {cert.fee || 'Check Website'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
          <Clock size={14} color="var(--accent)" />
          Self-Paced
        </div>
      </div>

      {/* Skill covered */}
      {cert.skillName && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
          marginTop: 'auto', paddingTop: '1rem',
          borderTop: '1px dashed var(--border)',
        }}>
          <div style={{
            width: '100%', fontSize: '0.7rem', textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: '0.2rem',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <BookOpen size={12} /> Skill Covered
          </div>
          <span style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border2)',
            color: 'var(--text2)',
            padding: '0.2rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: '500',
          }}>
            {cert.skillName}
          </span>
        </div>
      )}

      {/* Hover arrow */}
      <div style={{
        position: 'absolute', bottom: '1rem', right: '1rem',
        opacity: isHovered ? 1 : 0,
        transform: isHovered ? 'translateX(0)' : 'translateX(-10px)',
        transition: 'all 0.3s ease',
        color,
      }}>
        <ChevronRight size={20} />
      </div>
    </a>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Certifications = ({ roleName }) => {
  const [activeTab, setActiveTab] = useState('technical');
  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [certsData, setCertsData] = useState({ technical: [], ai: [], domain: [] });
  const lastRole = useRef(null);

  const tabs = [
    { id: 'technical', label: 'Technical Skills', icon: <Cpu size={16} /> },
    { id: 'ai',        label: 'AI & Data Skills', icon: <BrainCircuit size={16} /> },
    { id: 'domain',    label: 'Domain Skills',    icon: <Building2 size={16} /> },
  ];

  // ── Fetch certifications for the current role ──────────────────────────────
  useEffect(() => {
    if (!roleName || roleName === lastRole.current) return;
    lastRole.current = roleName;

    let cancelled = false;
    const fetchCerts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/career-agent/certifications/${encodeURIComponent(roleName)}`);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setCertsData({
            technical: data.technical || [],
            ai:        data.ai        || [],
            domain:    data.domain    || [],
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCerts();
    return () => { cancelled = true; };
  }, [roleName]);

  const displayCerts = certsData[activeTab] || [];

  return (
    <div style={{ marginTop: '1rem', animation: 'fadeIn 0.5s ease-out' }}>

      {/* Introduction Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79, 142, 247, 0.1), rgba(79, 142, 247, 0.02))',
        border: '1px solid rgba(79, 142, 247, 0.25)',
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '2rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'rgba(79, 142, 247, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, border: '2px solid rgba(79,142,247,0.4)',
            boxShadow: '0 0 20px rgba(79, 142, 247, 0.2)',
          }}>
            <Award size={28} color="var(--accent)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.3rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Top Recommended Certifications
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0, maxWidth: '550px' }}>
              Boost your profile as a <strong style={{ color: 'var(--text2)' }}>{roleName || 'Software Developer'}</strong> by acquiring these industry-recognised credentials — sourced directly from the SMAART Career Agent Database.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '0.6rem',
          background: 'linear-gradient(135deg, rgba(79, 142, 247, 0.12), rgba(167, 139, 250, 0.08))',
          border: '1px solid rgba(79, 142, 247, 0.2)',
          padding: '0.45rem', borderRadius: '12px',
          width: 'fit-content',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)',
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
                  : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--text2)',
                border: 'none',
                padding: '0.55rem 1.1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: activeTab === tab.id ? 700 : 600,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                boxShadow: activeTab === tab.id ? '0 4px 14px rgba(79, 142, 247, 0.4)' : 'none',
                transform: activeTab === tab.id ? 'translateY(-1px)' : 'none',
              }}
            >
              {tab.icon}
              {tab.label}
              {/* Count badge */}
              {certsData[tab.id]?.length > 0 && (
                <span style={{
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : 'rgba(79,142,247,0.15)',
                  color: activeTab === tab.id ? '#fff' : 'var(--accent)',
                  fontSize: '0.65rem', fontWeight: 800,
                  padding: '0.1rem 0.45rem', borderRadius: '100px',
                  minWidth: '18px', textAlign: 'center',
                }}>
                  {certsData[tab.id].length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '280px', gap: '1rem',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            Fetching certifications for <strong style={{ color: 'var(--text2)' }}>{roleName}</strong>…
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '200px', gap: '0.75rem',
          background: 'var(--navy2)', borderRadius: '16px',
          border: '1px solid rgba(239,68,68,0.25)', padding: '2rem',
        }}>
          <AlertCircle size={32} color="var(--red)" />
          <h4 style={{ color: 'var(--text)', fontSize: '0.95rem', fontWeight: 700 }}>Could not load certifications</h4>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', textAlign: 'center', maxWidth: '360px' }}>{error}</p>
          <button
            onClick={() => { lastRole.current = null; setCertsData({ technical: [], ai: [], domain: [] }); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', borderRadius: '8px',
              background: 'var(--accent)', color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
            }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && displayCerts.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '250px',
          background: 'var(--navy2)', borderRadius: '16px',
          border: '1px solid var(--border)', padding: '2rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.4 }}>🎓</div>
          <h3 style={{ color: 'var(--text2)', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: 700 }}>
            No {activeTab === 'ai' ? 'AI & Data' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} certifications found for "{roleName}"
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem', maxWidth: '360px', lineHeight: 1.6 }}>
            The database doesn't have mapped certifications for this skill category yet. Try switching to another category.
          </p>
        </div>
      )}

      {/* Certifications Grid */}
      {!loading && !error && displayCerts.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem',
          paddingBottom: '2rem',
        }}>
          {displayCerts.map((cert) => (
            <CertCard
              key={cert.id}
              cert={cert}
              hoveredId={hoveredId}
              onEnter={setHoveredId}
              onLeave={() => setHoveredId(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Certifications;
