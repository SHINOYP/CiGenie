import React from 'react';
import { Play, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

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
  const activities = [
    { id: 1, project: 'Auth Service', action: 'Build #34', status: 'Success', time: '2m ago' },
    { id: 2, project: 'Payment API', action: 'Build #12', status: 'Failed', time: '15m ago' },
    { id: 3, project: 'Frontend', action: 'Deploy #8', status: 'Pending', time: '1h ago' },
  ];

  return (
    <div className="bg-surface rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-semibold text-lg">Recent Activity</h3>
        <button className="text-sm text-primary hover:text-primary/80">View All</button>
      </div>
      <div className="divide-y divide-slate-700">
        {activities.map((item) => (
          <div key={item.id} className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-2 h-2 rounded-full ${
                item.status === 'Success' ? 'bg-success' : 
                item.status === 'Failed' ? 'bg-danger' : 'bg-warning'
              }`} />
              <div>
                <p className="font-medium text-sm">{item.project}</p>
                <p className="text-xs text-gray-400">{item.action}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full ${
                 item.status === 'Success' ? 'bg-success/10 text-success' : 
                 item.status === 'Failed' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
              }`}>
                {item.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">{item.time}</p>
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
        <h2 className="text-2xl font-bold">Overview</h2>
        <button className="bg-primary hover:bg-blue-600 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center space-x-2">
          <Play size={16} />
          <span>New Build</span>
        </button>
      </div>

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
                <span className="text-sm">Database</span>
              </div>
              <span className="text-xs text-green-400">Operational</span>
            </div>
             <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-sm">AI Analysis Engine</span>
              </div>
              <span className="text-xs text-yellow-400">Latency High</span>
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
