import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import ActionPanel from '../components/ActionPanel';
import { getHistory } from '../services/api';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-surface p-6 rounded-xl border border-slate-700">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{title}</p>
        <h3 className="text-3xl font-bold mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg bg-${color}-500/10 text-${color}-500`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-xs">
      <span className={trend > 0 ? 'text-green-400' : 'text-red-400'}>
        {trend > 0 ? '+' : ''}{trend}%
      </span>
      <span className="text-gray-500 ml-2">from last week</span>
    </div>
  </div>
);

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Poll for history updates for now
    const fetchHistory = async () => {
        try {
            const data = await getHistory();
            setActivities(data);
        } catch (e) { console.error(e); }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-surface rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-semibold text-lg">Recent Intent Executions</h3>
      </div>
      <div className="divide-y divide-slate-700 max-h-[400px] overflow-y-auto">
        {activities.length === 0 && (
            <div className="p-8 text-center text-gray-400">No activity yet.</div>
        )}
        {activities.map((item) => (
          <div key={item.id} className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-2 h-2 rounded-full ${
                item.status === 'SUCCESS' ? 'bg-success' : 
                item.status === 'FAILED' ? 'bg-danger' : 
                item.status === 'RUNNING' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'
              }`} />
              <div>
                <p className="font-medium text-sm">{item.plan.projectId}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span className="uppercase font-bold text-gray-500">{item.plan.action}</span>
                    <span>to {item.plan.targetEnv}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full ${
                 item.status === 'SUCCESS' ? 'bg-success/10 text-success' : 
                 item.status === 'FAILED' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
              }`}>
                {item.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">{new Date(item.startTime).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
