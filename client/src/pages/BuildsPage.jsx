import React, { useState } from 'react';
import { Search, Filter, Play, CheckCircle, XCircle, Clock } from 'lucide-react';

const mockBuilds = [
  { id: '1024', project: 'Auth Service', branch: 'feature/login-v2', commit: 'a1b2c3d', status: 'Success', duration: '2m 15s', time: '2m ago' },
  { id: '1023', project: 'Payment API', branch: 'fix/stripe-webhook', commit: 'z9y8x7w', status: 'Failed', duration: '1m 45s', time: '15m ago' },
  { id: '1022', project: 'Frontend', branch: 'main', commit: 'f5g6h7j', status: 'Success', duration: '3m 10s', time: '1h ago' },
  { id: '1021', project: 'Auth Service', branch: 'main', commit: 'p1q2r3s', status: 'Success', duration: '2m 12s', time: '2h ago' },
  { id: '1020', project: 'Notification Svc', branch: 'chore/aws-sdk', commit: 'm4n5o6p', status: 'Pending', duration: '-', time: '3h ago' },
];

const BuildsPage = () => {
  const [filter, setFilter] = useState('All');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Build History</h2>
          <p className="text-gray-400 text-sm mt-1">View and manage execution history across all projects.</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search builds..." 
              className="bg-surface border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary w-64"
            />
          </div>
          <button className="bg-surface border border-slate-700 hover:bg-slate-700 p-2 rounded-lg transition-colors">
            <Filter size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-800/50 text-gray-400 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Build ID</th>
              <th className="px-6 py-4">Project</th>
              <th className="px-6 py-4">Branch / Commit</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {mockBuilds.map((build) => (
              <tr key={build.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-sm text-primary">#{build.id}</td>
                <td className="px-6 py-4 font-medium">{build.project}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm">{build.branch}</span>
                    <span className="text-xs text-gray-500 font-mono">{build.commit}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${
                     build.status === 'Success' ? 'bg-success/10 text-success' :
                     build.status === 'Failed' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                   }`}>
                     {build.status === 'Success' && <CheckCircle size={12} />}
                     {build.status === 'Failed' && <XCircle size={12} />}
                     {build.status === 'Pending' && <Clock size={12} />}
                     <span>{build.status}</span>
                   </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">{build.duration}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{build.time}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-colors">
                    <Play size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BuildsPage;
