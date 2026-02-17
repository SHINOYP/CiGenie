import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Play, CheckCircle, XCircle, Clock, Terminal, Shield, Zap, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';
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
    <div className="flex h-[calc(100vh-120px)] gap-6 overflow-hidden">
      {/* Sidebar: Active Jobs */}
      <div className="w-72 flex flex-col bg-surface rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
           <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Projects</h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeJobs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No active projects detected</div>
            ) : (
                activeJobs.map(job => (
                    <div 
                        key={job.id}
                        className={`group relative w-full text-left p-4 border-b border-slate-700/50 transition-all hover:bg-slate-800/50 ${selectedJob === job.id ? 'bg-primary/5 border-r-4 border-r-primary' : ''}`}
                    >
                        <div 
                            className="cursor-pointer"
                            onClick={() => setSelectedJob(job.id)}
                        >
                            <div className="flex justify-between items-start mb-1 pr-6">
                                <span className={`text-sm font-bold truncate ${selectedJob === job.id ? 'text-primary' : 'text-gray-200'}`}>{job.name}</span>
                                <div className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    job.lastStatus === 'SUCCESS' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                                }`}>
                                    {job.lastStatus === 'SUCCESS' ? 'OK' : 'ERR'}
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 text-[10px] text-gray-500">
                                <span className="flex items-center"><Clock size={10} className="mr-1" /> {formatTimeAgo(job.lastDate)}</span>
                                <span>•</span>
                                <span className="px-1 bg-primary/20 text-primary rounded-[2px] font-bold text-[8px] tracking-widest uppercase">
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
                ))
            )}
        </div>
      </div>

      {/* Main Content: History */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">{selectedJob ? (projects[selectedJob] || selectedJob) : 'Selection Required'}</h2>
              <p className="text-gray-500 text-xs text-balance">Execution history and diagnostic metrics.</p>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Filter results..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-surface border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-primary w-48"
                />
            </div>
        </div>

        <div className="flex-1 bg-surface rounded-xl border border-slate-700 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-800/50 text-gray-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-700">
                        <tr>
                            <th className="px-6 py-3">ID</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Target</th>
                            <th className="px-6 py-3">Status / Metrics</th>
                            <th className="px-6 py-3 text-right">Logs</th>
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
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-primary text-xs">
                                                #{build.jenkinsBuildId || build.id.split('_').pop()}
                                            </span>
                                            <span className="text-[10px] text-gray-500">{formatTimeAgo(build.startTime)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 lowercase">
                                        <div className="flex items-center space-x-2">
                                            {(() => {
                                                const action = (build.plan?.action || build.params?.ACTION || 'DEPLOY').toUpperCase();
                                                if (action === 'TEST') return <Shield size={14} className="text-green-500" />;
                                                if (action === 'ROLLBACK') return <RefreshCw size={14} className="text-red-500" />;
                                                return <Zap size={14} className="text-blue-500" />;
                                            })()}
                                            <span className="uppercase text-[10px] font-bold px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-gray-300">
                                                {build.plan?.action || build.params?.ACTION || 'Build'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-gray-200">
                                                {build.plan?.jenkinsParams?.BRANCH || build.params?.BRANCH || 'main'}
                                            </span>
                                            <span className="text-[10px] text-gray-500 uppercase">
                                                {build.plan?.jenkinsParams?.ENV || build.params?.ENV || 'dev'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-full text-[10px] font-bold ${
                                                build.status === 'SUCCESS' ? 'bg-success/10 text-success' :
                                                build.status === 'FAILED' ? 'bg-danger/10 text-danger' : 
                                                build.status === 'UNSTABLE' ? 'bg-warning/20 text-warning border border-warning/30' :
                                                'bg-warning/10 text-warning'
                                            }`}>
                                                {build.status === 'SUCCESS' && <CheckCircle size={10} />}
                                                {build.status === 'FAILED' && <XCircle size={10} />}
                                                {(build.status === 'UNSTABLE') && <AlertTriangle size={10} />}
                                                <span>{build.status === 'UNSTABLE' ? 'TEST FAIL' : build.status}</span>
                                            </div>
                                            
                                            {build.testSummary && (
                                                <div className="flex items-center space-x-2 text-[10px] font-mono border-l border-slate-700 pl-3">
                                                    <span className="text-success">{build.testSummary.passed}P</span>
                                                    {build.testSummary.failed > 0 && <span className="text-danger">{build.testSummary.failed}F</span>}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => {
                                                setActiveBuildId(build.id);
                                                setShowTerminal(true);
                                            }}
                                            className="p-2 hover:bg-primary/20 text-primary rounded-lg transition-colors"
                                        >
                                            <Terminal size={14} />
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
