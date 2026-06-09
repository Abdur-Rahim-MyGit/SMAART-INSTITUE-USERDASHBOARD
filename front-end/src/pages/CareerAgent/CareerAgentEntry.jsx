import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * CareerAgentEntry
 * Smart entry guard: checks if user has existing career analysis.
 * First checks localStorage. If missing, calls API to verify.
 * If found → redirects to /dashboard/career-agent/dashboard (preserving ?tab= query)
 * If not found → redirects to /dashboard/career-agent/onboarding
 */
const CareerAgentEntry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      // Preserve any query params (e.g. ?tab=secondary) through the redirect
      const search = location.search;

      // Fast path: if we have it in localStorage, go to dashboard
      const analysisId = localStorage.getItem('smaart_analysis_id');
      const analysis = localStorage.getItem('smaart_analysis');

      if (analysisId && analysis) {
        navigate(`/dashboard/career-agent/dashboard${search}`, { replace: true });
        return;
      }

      // Check backend to see if a pathway exists
      try {
        const token = sessionStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const res = await fetch('/api/career-agent/final-pathway', {
          credentials: 'include',
          headers
        });

        if (res.ok) {
          const payload = await res.json();
          // If the backend has an analysis for this user, route to dashboard
          if (payload.found && payload.output_data) {
            navigate(`/dashboard/career-agent/dashboard${search}`, { replace: true });
            return;
          }
        }
      } catch (e) {
        console.error('Error checking backend analysis status:', e);
      }

      // If nothing was found, go to onboarding
      navigate('/dashboard/career-agent/onboarding', { replace: true });
    };

    checkStatus();
  }, [navigate, location.search]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(26, 56, 132, 0.2)', borderTopColor: '#1a3884', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return null;
};

export default CareerAgentEntry;
