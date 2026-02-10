import React, { useState, useEffect } from 'react';
import { Play, Shield, RefreshCw, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { getProjects, analyzeIntent, executePlan, getLivePaths } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ActionPanel = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [environment, setEnvironment] = useState('dev');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [outputPath, setOutputPath] = useState('/var/www/html');
  const [livePaths, setLivePaths] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPaths = livePaths.filter(p => 
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    getProjects().then(setProjects).catch(console.error);
    getLivePaths().then(paths => {
        if (paths && paths.length > 0) {
            setLivePaths(paths);
            // Only set default if not locked later
        }
    }).catch(err => console.error('Failed to fetch live paths:', err));
  }, []);

  // Sync output path with locked project path
  useEffect(() => {
    if (selectedProject && projects.length > 0) {
        const proj = projects.find(p => p.id === selectedProject);
        if (proj?.deployed?.isLocked) {
            setOutputPath(proj.deployed.lockedPath);
        }
    }
  }, [selectedProject, projects]);

  const handleIntent = async (action) => {
    if (!selectedProject) return;
    setLoading(true);
    setPlan(null);
    setRiskAccepted(false); // Reset on new analysis
    
    try {
      const result = await analyzeIntent(selectedProject, {
        action,
        environment,
        outputPath,
        branch: 'main' // Default for now
      });
      setPlan(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!plan) return;
    if (plan.approvalRequired && !riskAccepted) return;

    // Safety check for failed tests before deployment
    const isDeployment = ['DEPLOY', 'REDEPLOY', 'ROLLBACK'].includes(plan.action?.toUpperCase());
    const proj = projects.find(p => p.id === selectedProject);
    const testStatus = proj?.deployed?.lastTestStatus;

    if (isDeployment && (testStatus === 'FAILED' || testStatus === 'UNSTABLE')) {
        const confirmed = window.confirm(
            "WARNING: The last test execution for this project failed (or was unstable). \n\n" +
            "It is highly recommended to fix failing tests before deploying. \n\n" +
            "Are you sure you want to proceed with this deployment?"
        );
        if (!confirmed) return;
    }

    setExecuting(true);
    try {
      await executePlan(plan);
      // We don't navigate anymore. The user can see the progress in "Recent Activity" 
      // or go to the "Builds" page to open the terminal.
      setPlan(null);
      setRiskAccepted(false);
      alert('Execution initiated successfully! Check Build History for details.');
    } catch (error) {
      const errorMsg = error.response?.data?.details || error.response?.data?.error || error.message;
      alert('Failed: ' + errorMsg);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-slate-700 p-6 mb-6">
      <h3 className="font-semibold text-lg mb-4">Deployment Control Plane</h3>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <select 
          className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
          value={selectedProject}
          onChange={(e) => {
              setSelectedProject(e.target.value);
              setPlan(null);
              setRiskAccepted(false);
          }}
        >
          <option value="">Select Project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {selectedProject && (() => {
            const proj = projects.find(p => p.id === selectedProject);
            return proj ? (
                <div className="flex-1 flex flex-col justify-center text-xs px-4 border-l border-slate-700">
                    <div className="flex items-center space-x-2 mb-1">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                             proj.type === 'REACT' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 
                             proj.type === 'NODE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-700 text-gray-400'
                         }`}>
                             {proj.type || 'UNKNOWN'}
                         </span>
                         <span className="text-gray-400 truncate">{proj.description || 'No description provided'}</span>
                    </div>
                    <a href={proj.cloneUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">
                        {proj.repo}
                    </a>
                </div>
            ) : null;
        })()}

        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-600">
          {['dev', 'production'].map(env => (
            <button
              key={env}
              onClick={() => {
                  setEnvironment(env);
                  setPlan(null);
                  setRiskAccepted(false);
              }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                environment === env ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {env}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-xl border h-full transition-all ${
              (() => {
                  const proj = projects.find(p => p.id === selectedProject);
                  return proj?.deployed?.isLocked ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-800/30 border-slate-700';
              })()
          }`}>
              <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest">Build Output Location</label>
                  {(() => {
                      const proj = projects.find(p => p.id === selectedProject);
                      return proj?.deployed?.isLocked && (
                          <div className="flex items-center space-x-1 text-amber-500">
                              <Shield size={10} />
                              <span className="text-[9px] font-bold uppercase">Locked</span>
                          </div>
                      );
                  })()}
              </div>
              <div className="flex gap-2">
                  <input 
                    type="text"
                    value={outputPath}
                    disabled={(() => {
                        const proj = projects.find(p => p.id === selectedProject);
                        return proj?.deployed?.isLocked;
                    })()}
                    onChange={(e) => {
                        setOutputPath(e.target.value);
                        setSearchQuery(e.target.value);
                    }}
                    className={`flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-blue-300 focus:outline-none focus:border-primary transition-all ${
                        (() => {
                            const proj = projects.find(p => p.id === selectedProject);
                            return proj?.deployed?.isLocked ? 'opacity-70 cursor-not-allowed' : '';
                        })()
                    }`}
                    placeholder="Search or enter path..."
                  />
                  <select 
                    className={`bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-gray-400 focus:outline-none max-w-[150px] ${
                        (() => {
                            const proj = projects.find(p => p.id === selectedProject);
                            return proj?.deployed?.isLocked ? 'opacity-50 cursor-not-allowed' : '';
                        })()
                    }`}
                    disabled={(() => {
                        const proj = projects.find(p => p.id === selectedProject);
                        return proj?.deployed?.isLocked;
                    })()}
                    onChange={(e) => {
                        setOutputPath(e.target.value);
                        setSearchQuery(e.target.value);
                    }}
                    value={outputPath}
                  >
                      <option value="" disabled>Live Server Paths ({filteredPaths.length})</option>
                      {(filteredPaths.length > 0 ? filteredPaths : ['/var/www/html', '/opt/deploy']).map(p => (
                          <option key={p} value={p}>{p}</option>
                      ))}
                  </select>
              </div>
              {(() => {
                  const proj = projects.find(p => p.id === selectedProject);
                  return proj?.deployed?.isLocked ? (
                      <p className="text-[9px] text-amber-400/70 mt-2 flex items-center">
                          <AlertTriangle size={10} className="mr-1" />
                          Path is pinned to existing Jenkins job. Delete job in Jenkins to change.
                      </p>
                  ) : (
                      <p className="text-[9px] text-gray-500 mt-2 italic">Output directory on the target executor node.</p>
                  );
              })()}
          </div>

          <div className="flex flex-col gap-4">
              {(() => {
                  const proj = projects.find(p => p.id === selectedProject);
                  const isDeployed = proj?.deployed?.[environment];
                  const testStatus = proj?.deployed?.lastTestStatus;
                  
                  return (
                    <>
                        {isDeployed ? (
                            <div className="bg-success/5 p-4 rounded-xl border border-success/20 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-success mb-1 tracking-widest">Current Deployment</p>
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle size={14} className="text-success" />
                                        <span className="text-sm font-medium text-white truncate max-w-[150px] block">{proj.deployed[`${environment}Path`]}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        Last Updated: {new Date(proj.deployed[`${environment}Date`]).toLocaleString()}
                                    </p>
                                </div>
                                <div className="px-3 py-1 bg-success/10 rounded-full border border-success/30">
                                    <span className="text-[10px] text-success font-bold uppercase">Live</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-800/20 p-4 rounded-xl border border-slate-700/50 flex items-center justify-center text-gray-500 italic text-xs h-full">
                                No active deployment detected.
                            </div>
                        )}

                        {testStatus && (testStatus === 'UNSTABLE' || testStatus === 'FAILED') && (
                            <div className="bg-warning/5 p-3 rounded-xl border border-warning/20 flex items-start space-x-3">
                                <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-warning tracking-widest">Sanity Alert</p>
                                    <p className="text-[10px] text-gray-400 leading-normal">
                                        The last test run for this project failed. Review your code logic before deploying to production.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                  );
              })()}
          </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(() => {
          const proj = projects.find(p => p.id === selectedProject);
          const isDeployed = proj?.deployed?.[environment];
          
          return (
            <>
              {!isDeployed && (
                <button 
                  onClick={() => handleIntent('DEPLOY')}
                  disabled={!selectedProject}
                  className="flex flex-col items-center justify-center p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-xl transition-all group disabled:opacity-50 disabled:grayscale"
                >
                  <div className="p-3 rounded-full bg-blue-500/10 text-blue-500 mb-2 group-hover:scale-110 transition-transform">
                    <Play size={24} />
                  </div>
                  <span className="font-medium text-sm">Deploy</span>
                </button>
              )}

              <button 
                onClick={() => handleIntent('TEST')}
                disabled={!selectedProject}
                className="flex flex-col items-center justify-center p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-green-500 rounded-xl transition-all group disabled:opacity-50 disabled:grayscale"
              >
                <div className="p-3 rounded-full bg-green-500/10 text-green-500 mb-2 group-hover:scale-110 transition-transform">
                  <Shield size={24} />
                </div>
                <span className="font-medium text-sm">Run Tests</span>
              </button>

              <button 
                onClick={() => handleIntent('REDEPLOY')}
                disabled={!selectedProject || !isDeployed}
                className="flex flex-col items-center justify-center p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-yellow-500 rounded-xl transition-all group disabled:opacity-50 disabled:grayscale"
              >
                <div className={`p-3 rounded-full ${isDeployed ? 'bg-yellow-500/10 text-yellow-500' : 'bg-slate-700/50 text-gray-500'} mb-2 group-hover:scale-110 transition-transform`}>
                  <RefreshCw size={24} />
                </div>
                <span className="font-medium text-sm">Redeploy</span>
              </button>

              <button 
                onClick={() => handleIntent('ROLLBACK')}
                disabled={!selectedProject || !isDeployed}
                className="flex flex-col items-center justify-center p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-red-500 rounded-xl transition-all group disabled:opacity-50 disabled:grayscale"
              >
                <div className={`p-3 rounded-full ${isDeployed ? 'bg-red-500/10 text-red-500' : 'bg-slate-700/50 text-gray-500'} mb-2 group-hover:scale-110 transition-transform`}>
                  <Zap size={24} />
                </div>
                <span className="font-medium text-sm">Emergency Fix</span>
              </button>
            </>
          );
        })()}
      </div>

      {loading && (
        <div className="mt-6 p-4 text-center text-gray-400">
           <div className="animate-pulse">Analyzing intent...</div>
        </div>
      )}

      {plan && (() => {
        const getActionTheme = (action) => {
            switch(action) {
                case 'TEST': return { color: 'green', text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' };
                case 'ROLLBACK': return { color: 'red', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
                default: return { color: 'blue', text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
            }
        };
        const theme = getActionTheme(plan.action);
        
        return (
          <div className={`mt-6 border ${theme.border} rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4 shadow-lg backdrop-blur-sm`}>
            <div className={`${theme.bg} p-4 border-b ${theme.border} flex justify-between items-center`}>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full bg-${theme.color}-500 animate-pulse`} />
                <span className={`font-semibold ${theme.text} uppercase tracking-wider text-xs`}>{plan.action} Plan</span>
              </div>
            </div>
            <div className="p-4 bg-slate-900/40">
              {plan.approvalRequired && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3">
                      <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                      <div>
                          <p className="text-sm font-bold text-red-500 uppercase tracking-wider">Human Approval Required</p>
                          <p className="text-xs text-red-400/80 mt-1">
                              This action affects the <b>{plan.targetEnv.toUpperCase()}</b> environment. It requires explicit confirmation to proceed.
                          </p>
                      </div>
                  </div>
              )}
  
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                      <span className="text-gray-500 block text-xs">Target Environment</span>
                      <span className="text-white font-mono uppercase tracking-tighter text-[10px]">{plan.targetEnv}</span>
                  </div>
                   <div>
                      <span className="text-gray-500 block text-xs">Jenkins Executor</span>
                      <span className="text-white font-mono truncate block text-[10px]">{plan.jenkinsJob}</span>
                  </div>
              </div>
              
              <div className="space-y-2 mb-6 bg-black/20 p-3 rounded-lg border border-slate-800">
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold mb-2">Analysis Reasoning</p>
                  {plan.reasoning.map((r, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-gray-300">
                          <CheckCircle size={12} className={`mt-1 ${theme.text} shrink-0`} />
                          <span>{r}</span>
                      </div>
                  ))}
                   {plan.riskFlags.map((r, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs text-yellow-400">
                          <AlertTriangle size={12} className="mt-1 text-yellow-500 shrink-0" />
                          <span>Risk: {r}</span>
                      </div>
                  ))}
              </div>
  
              {plan.approvalRequired && (
                  <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-red-500/30 transition-colors">
                      <label className="flex items-start space-x-3 cursor-pointer">
                          <input 
                              type="checkbox" 
                              className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500" 
                              checked={riskAccepted}
                              onChange={(e) => setRiskAccepted(e.target.checked)}
                          />
                          <span className="text-xs text-gray-400 select-none leading-relaxed">
                              I acknowledge that this action will modify the production environment and take full responsibility for any service interruption.
                          </span>
                      </label>
                  </div>
              )}
  
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button 
                      onClick={() => {
                          setPlan(null);
                          setRiskAccepted(false);
                      }}
                      className="px-4 py-2 text-xs text-gray-500 hover:text-white transition-colors"
                  >
                      Cancel
                  </button>
                  <button 
                      onClick={handleExecute}
                      disabled={executing || (plan.approvalRequired && !riskAccepted)}
                      className={`${
                          plan.approvalRequired ? 'bg-red-600 hover:bg-red-700' : 
                          plan.action === 'TEST' ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-blue-600'
                      } text-white px-6 py-2 rounded-lg text-sm font-medium transition-all transform active:scale-95 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                      {executing ? (
                          <RefreshCw size={16} className="animate-spin" />
                      ) : (
                          plan.action === 'TEST' ? <Shield size={16} /> : <Zap size={16} />
                      )}
                      <span>{executing ? 'Executing...' : plan.approvalRequired ? 'Acknowledge & Execute' : 'Approve & Execute'}</span>
                  </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ActionPanel;
