import React, { useState, useEffect } from 'react';
import { Search, Filter, Play, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getHistory, getProjects } from '../services/api';

const BuildsPage = () => {
  const [builds, setBuilds] = useState([]);
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [historyData, projectsData] = await Promise.all([
          getHistory(),
          getProjects()
        ]);
        
        // Create project map for easy lookup
        const projMap = {};
        projectsData.forEach(p => projMap[p.id] = p.name);
        setProjects(projMap);
        
        setBuilds(historyData);
      } catch (error) {
        console.error("Failed to fetch build history:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const calculateDuration = (start, end, status) => {
    if (!start) return '-';
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    
    // If pending/queued/init, show distinct duration or '...'
    if (['PENDING', 'QUEUED', 'INIT'].includes(status)) {
         const diff = Math.floor((new Date() - startTime) / 1000);
         return `${diff}s...`;
    }

    const diffMs = endTime - startTime;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    const remainingSec = diffSec % 60;
    return `${diffMin}m ${remainingSec}s`;
  };

  const formatTimeAgo = (date) => {
      if (!date) return '';
      const seconds = Math.floor((new Date() - new Date(date)) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + "y ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + "mo ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + "d ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + "h ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + "m ago";
      return Math.floor(seconds) + "s ago";
  };

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
              <th className="px-6 py-4">Context</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {builds.length === 0 ? (
                <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                        {loading ? "Loading history..." : "No builds found. Trigger a deployment to see history."}
                    </td>
                </tr>
            ) : (
                builds.map((build) => (
                <tr key={build.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-primary">#{build.id.substring(0,8)}</td>
                    <td className="px-6 py-4 font-medium">{projects[build.projectId] || build.projectId}</td>
                    <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="text-sm">{build.plan?.jenkinsParams?.BRANCH || build.plan?.targetEnv || 'Main'}</span>
                        <span className="text-xs text-gray-500 font-mono">{build.plan?.action}</span>
                    </div>
                    </td>
                    <td className="px-6 py-4">
                    <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${
                        build.status === 'SUCCESS' ? 'bg-success/10 text-success' :
                        build.status === 'FAILED' ? 'bg-danger/10 text-danger' : 
                        (build.status === 'PENDING' || build.status === 'QUEUED' || build.status === 'INIT') ? 'bg-warning/10 text-warning' : 'bg-slate-700 text-gray-300'
                    }`}>
                        {build.status === 'SUCCESS' && <CheckCircle size={12} />}
                        {build.status === 'FAILED' && <XCircle size={12} />}
                        {(build.status === 'PENDING' || build.status === 'QUEUED' || build.status === 'INIT') && <Clock size={12} />}
                        <span>{build.status}</span>
                    </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{calculateDuration(build.startTime, build.endTime, build.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatTimeAgo(build.startTime)}</td>
                    <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-white hover:bg-slate-700 p-2 rounded-lg transition-colors">
                        <Play size={16} />
                    </button>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BuildsPage;
