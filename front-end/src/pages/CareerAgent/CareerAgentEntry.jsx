import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * CareerAgentEntry
 * Smart entry guard: checks if user has existing career analysis.
 * If yes → redirects to /dashboard/career-agent/dashboard
 * If no  → redirects to /dashboard/career-agent/onboarding
 */
const CareerAgentEntry = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const analysisId = localStorage.getItem('smaart_analysis_id');
    const analysis = localStorage.getItem('smaart_analysis');

    if (analysisId && analysis) {
      navigate('/dashboard/career-agent/dashboard', { replace: true });
    } else {
      navigate('/dashboard/career-agent/onboarding', { replace: true });
    }
  }, [navigate]);

  return null;
};

export default CareerAgentEntry;
