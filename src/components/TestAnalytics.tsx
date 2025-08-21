import React from 'react';
import { DashboardGrid } from './DashboardGrid';

// Simple test component to view just the grid
export const TestAnalytics: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">New Analytics Dashboard</h1>
      <DashboardGrid />
    </div>
  );
};

export default TestAnalytics;
