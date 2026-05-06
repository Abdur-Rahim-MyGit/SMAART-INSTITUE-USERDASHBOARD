import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardHeader from '@/components/DashboardHeader';

const AnimatedRoutesTest = () => {
  return (
    <div>
      <DashboardHeader />
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Dashboard Test Page</h1>
        <p>Basic routing and header are working.</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default AnimatedRoutesTest;
