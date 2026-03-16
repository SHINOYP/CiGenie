import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Play, CheckCircle, XCircle, Clock, Terminal, Shield, Zap, RefreshCw, AlertTriangle, Trash2, Sparkles } from 'lucide-react';
import { getHistory, getProjects, deleteProjectJob } from '../services/api';
import TerminalModal from '../components/TerminalModal';

const ProjectsPage = () => {
  const [builds, setBuilds] = useState([]);
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [showTerminal, setShowTerminal] = useState(false);
  const [activeBuildId, setActiveBuildId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(null); // Track jobId being deleted

  const fetchData = async () => {
    try {
      const [historyData, projectsData] = await Promise.all([
        getHistory(),
        getProjects()
      ]);
      
      const projMap = {};
      projectsData.forEach(p => projMap[p.id] = p.name);
      setProjects(projMap);
      
      const sorted = (historyData || []).sort((a,b) => new Date(b.startTime) - new Date(a.startTime));
      setBuilds(sorted);

      if (!selectedJob && sorted.length > 0) {
          setSelectedJob(sorted[0].projectId);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [selectedJob]);

  const activeJobs = useMemo(() => {
    const jobs = {};
    builds.forEach(b => {
        if (!jobs[b.projectId]) {
            jobs[b.projectId] = {
                id: b.projectId,
                name: projects[b.projectId] || b.projectId,
                total: 0,
                success: 0,
                lastStatus: b.status,
                lastDate: b.startTime
            };
        }
        jobs[b.projectId].total++;
        if (b.status === 'SUCCESS') jobs[b.projectId].success++;
    });
    return Object.values(jobs).sort((a,b) => new Date(b.lastDate) - new Date(a.lastDate));
  }, [builds, projects]);

  const filteredBuilds = builds.filter(b => 
    b.projectId === selectedJob && 
    (b.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (b.plan?.action || b.params?.ACTION || 'Build').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteJob = async (jobId, jobName) => {
      const confirmed = window.confirm(`DANGER: Are you sure you want to delete "${jobName}"? \n\nThis will remove the job from Jenkins and PERMANENTLY clear all execution history in CiGenie.`);
      if (!confirmed) return;

      setDeleting(jobId);
      try {
          await deleteProjectJob(jobId);
          alert('Project job and history cleared successfully.');
          if (selectedJob === jobId) setSelectedJob(null);
          await fetchData();
      } catch (error) {
          alert('Failed to delete job: ' + (error.response?.data?.error || error.message));
      } finally {
          setDeleting(null);
      }
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
    <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-120px)] gap-6 overflow-hidden">
      {/* Sidebar: Active Jobs */}
      <div className="w-full lg:w-72 flex flex-col bg-surface rounded-xl border border-slate-700 overflow-hidden shrink-0 max-h-[300px] lg:max-h-full">
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
           <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Projects</h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeJobs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No active projects detected</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 divide-y lg:divide-y divide-slate-700/50">
                    {activeJobs.map(job => (
                        <div 
                            key={job.id}
                            className={`group relative w-full text-left p-4 transition-all hover:bg-slate-800/50 ${selectedJob === job.id ? 'bg-primary/5 border-l-4 lg:border-l-0 lg:border-r-4 border-primary' : ''}`}
                        >
                            <div 
                                className="cursor-pointer"
                                onClick={() => setSelectedJob(job.id)}
                            >
                                <div className="flex justify-between items-start mb-2 pr-8">
                                    <span className={`text-base font-bold truncate ${selectedJob === job.id ? 'text-primary' : 'text-gray-200'}`}>{job.name}</span>
                                    <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                        job.lastStatus === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                                        job.lastStatus === 'UNSTABLE' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                    }`}>
                                        {job.lastStatus === 'SUCCESS' ? 'Stable' : job.lastStatus === 'UNSTABLE' ? 'Warning' : 'Error'}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-gray-400">
                                    <span className="flex items-center"><Clock size={12} className="mr-1.5" /> {formatTimeAgo(job.lastDate)}</span>
                                    <span className="font-bold uppercase tracking-widest text-[10px] bg-slate-700/50 px-2 py-0.5 rounded text-gray-500">
                                        {(builds.find(b => b.projectId === job.id)?.plan?.type || 'NODE')}
                                    </span>
                                </div>
                            </div>

                            {/* Delete Toggle */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteJob(job.id, job.name);
                                }}
                                disabled={deleting === job.id}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-500 transition-all ${deleting === job.id ? 'animate-pulse opacity-100' : ''}`}
                                title="Delete project configuration and history"
                            >
                                {deleting === job.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* Main Content: History */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-bold truncate leading-tight">{selectedJob ? (projects[selectedJob] || selectedJob) : 'Selection Required'}</h2>
              <p className="text-gray-400 text-sm mt-1">Full history and status reporting for this project.</p>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search history..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-surface border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary w-64 shadow-inner"
                />
            </div>
        </div>

        <div className="flex-1 bg-surface rounded-xl border border-slate-700 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-800/50 text-gray-400 text-xs uppercase font-bold tracking-[0.2em] border-b border-slate-700">
                        <tr>
                            <th className="px-6 py-5">History ID</th>
                            <th className="px-6 py-5">Action Type</th>
                            <th className="px-6 py-5">Source Branch</th>
                            <th className="px-6 py-5">Status Report</th>
                            <th className="px-6 py-5 text-right">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700 text-sm text-balance">
                        {loading && builds.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">
                                    Syncing data...
                                </td>
                            </tr>
                        ) : filteredBuilds.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">
                                    {selectedJob ? "No records found." : "Select a project to view history."}
                                </td>
                            </tr>
                        ) : (
                            filteredBuilds.map((build) => (
                                <tr key={build.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-primary text-sm">
                                                Build No. {build.jenkinsBuildId || build.id.split('_').pop()}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium mt-1">{formatTimeAgo(build.startTime)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center space-x-3">
                                            {(() => {
                                                const action = (build.plan?.action || build.params?.ACTION || 'DEPLOY').toUpperCase();
                                                if (action === 'TEST') return <Shield size={18} className="text-green-500" />;
                                                return <Zap size={18} className="text-blue-500" />;
                                            })()}
                                            <span className="uppercase text-xs font-bold px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 text-gray-300 tracking-wide">
                                                {build.plan?.action || build.params?.ACTION || 'Build'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-200">
                                                {build.plan?.jenkinsParams?.BRANCH || build.params?.BRANCH || 'main'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center space-x-3">
                                            <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                                                build.status === 'SUCCESS' ? 'bg-success/10 text-success' :
                                                build.status === 'FAILED' ? 'bg-danger/10 text-danger' : 
                                                build.status === 'UNSTABLE' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                'bg-warning/10 text-warning'
                                            }`}>
                                                {build.status === 'SUCCESS' && <CheckCircle size={14} />}
                                                {build.status === 'FAILED' && <XCircle size={14} />}
                                                {(build.status === 'UNSTABLE') && <AlertTriangle size={14} />}
                                                <span className="tracking-wide">{build.status}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <button 
                                            onClick={() => {
                                                setActiveBuildId(build.id);
                                                setShowTerminal(true);
                                            }}
                                            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all font-bold text-xs uppercase tracking-widest flex items-center float-right"
                                        >
                                            <Terminal size={14} className="mr-2" />
                                            Log View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {showTerminal && (
          <TerminalModal 
            executionId={activeBuildId} 
            onClose={() => {
                setShowTerminal(false);
                setActiveBuildId(null);
            }} 
          />
      )}
    </div>
  );
};

export default ProjectsPage;
