import React from 'react';

const RecentActivity = ({ activities = [], projects = {} }) => {
  // fetching moved to parent Dashboard.jsx

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
                <p className="font-medium text-sm">{projects[item.projectId] || item.projectId}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <span className="uppercase font-bold text-gray-500">{item.plan?.action || 'BUILD'}</span>
                    <span>to {item.plan?.targetEnv || 'N/A'}</span>
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

export default RecentActivity;
