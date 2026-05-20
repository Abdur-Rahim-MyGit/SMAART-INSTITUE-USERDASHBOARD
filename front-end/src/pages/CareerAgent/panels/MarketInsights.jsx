import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockTrendData = [
  { month: 'Jan', dataAnalyst: 4000, fullStack: 2400 },
  { month: 'Feb', dataAnalyst: 3000, fullStack: 1398 },
  { month: 'Mar', dataAnalyst: 2000, fullStack: 9800 },
  { month: 'Apr', dataAnalyst: 2780, fullStack: 3908 },
  { month: 'May', dataAnalyst: 1890, fullStack: 4800 },
  { month: 'Jun', dataAnalyst: 2390, fullStack: 3800 },
  { month: 'Jul', dataAnalyst: 3490, fullStack: 4300 },
];

const MarketInsights = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div id="screen-loading">
        <div className="loading-logo">SM<span>A</span>ART</div>
        <div className="loading-bar-wrap">
          <div className="loading-bar-track">
            <div className="loading-bar-fill" style={{ width: '80%' }}></div>
          </div>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Syncing Hiring Vectors...</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '5rem' }}>
      <div className="onboard-header" style={{ marginBottom: '4rem' }}>
        <div className="hero-badge"><span className="pulse-dot"></span>Live Market Intelligence</div>
        <h1 style={{ fontSize: '3.5rem' }}>Indian Tech <br /> <em>Hiring Trends</em></h1>
        <p>Real-time hiring volume and salary expectations for 225+ career roles across Tier-1 regions.</p>
      </div>

      <div className="panel">
        <div className="ri-card" style={{ height: '500px', marginBottom: '3rem' }}>
          <div className="ri-label">📈 Supply & Demand Momentum (Monthly Volume)</div>
          <div style={{ height: '400px', marginTop: '2rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: 'var(--accent)', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="fullStack" stroke="var(--accent)" fillOpacity={1} fill="url(#colorArea)" strokeWidth={3} />
                <Area type="monotone" dataKey="dataAnalyst" stroke="var(--green)" fillOpacity={0} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="ri-card">
            <div className="ri-label">📊 Top High-Growth Roles</div>
            <div style={{ marginTop: '1.5rem' }}>
              {[
                { role: 'AI Engineering', growth: '+310%', zone: 'Green' },
                { role: 'Cloud Architecture', growth: '+185%', zone: 'Green' },
                { role: 'Cyber Operations', growth: '+142%', zone: 'Amber' },
                { role: 'Data Science', growth: '+95%', zone: 'Amber' }
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border2)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.role}</div>
                  <div style={{ color: r.zone === 'Green' ? 'var(--green)' : 'var(--amber)', fontWeight: 800 }}>{r.growth}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="ri-card">
            <div className="ri-label">💼 Entry-Level Benchmarks (India)</div>
            <div style={{ marginTop: '1.5rem' }}>
              {[
                { role: 'Software Engineer', range: '6–12 LPA' },
                { role: 'Data Analyst', range: '5–9 LPA' },
                { role: 'Product Designer', range: '7–15 LPA' },
                { role: 'Cloud Engineer', range: '8–14 LPA' }
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border2)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.role}</div>
                  <div style={{ color: 'var(--accent)', fontWeight: 800 }}>{r.range}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketInsights;
