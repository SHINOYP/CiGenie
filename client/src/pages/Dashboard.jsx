import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import ActionPanel from '../components/ActionPanel';
import StatCard from '../components/StatCard';
import RecentActivity from '../components/RecentActivity';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Control Plane</h2>
      </div>

      <ActionPanel />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Builds" value="1,284" icon={CheckCircle} color="blue" trend={12} />
        <StatCard title="Success Rate" value="94.2%" icon={CheckCircle} color="green" trend={2.5} />
        <StatCard title="Failed Builds" value="48" icon={XCircle} color="red" trend={-15} />
        <StatCard title="Avg Duration" value="4m 12s" icon={Clock} color="yellow" trend={-8} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
        <div className="bg-surface rounded-xl border border-slate-700 p-6">
          <h3 className="font-semibold text-lg mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">Jenkins Master</span>
              </div>
              <span className="text-xs text-green-400">Operational</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">Decision Engine</span>
              </div>
              <span className="text-xs text-green-400">Online</span>
            </div>
             <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">AI Analysis</span>
              </div>
              <span className="text-xs text-green-400">Ready</span>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-slate-800 rounded-lg">
             <div className="flex items-start space-x-3">
               <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
               <div>
                  <p className="text-xs font-bold text-yellow-500 mb-1">AI Recommendation</p>
                  <p className="text-xs text-gray-400">
                    High failure rate detected in <b>Payment API</b> integration tests. Recommended rollback to v2.4.1.
                  </p>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
