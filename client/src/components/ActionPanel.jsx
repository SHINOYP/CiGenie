import React, { useState, useEffect } from 'react';
import { Play, Shield, RefreshCw, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { getProjects, analyzeIntent, executePlan } from '../services/api';

const ActionPanel = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [environment, setEnvironment] = useState('dev');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    getProjects().then(setProjects).catch(console.error);
  }, []);

  const handleIntent = async (action) => {
    if (!selectedProject) return;
    setLoading(true);
    setPlan(null);
    
    try {
      const result = await analyzeIntent(selectedProject, {
        action,
        environment,
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
    setExecuting(true);
    try {
      await executePlan(plan);
      alert('Deployment Started!');
      setPlan(null);
    } catch (error) {
      alert('Failed: ' + error.message);
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
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">Select Project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {selectedProject && (() => {
            const proj = projects.find(p => p.id === selectedProject);
            return proj ? (
                <div className="flex-1 flex flex-col justify-center text-sm px-4 border-l border-slate-700">
                    <div className="text-gray-400 text-xs">{proj.description || 'No description provided'}</div>
                    <a href={proj.cloneUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs truncate">
                        {proj.repo}
                    </a>
                </div>
            ) : null;
        })()}

        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-600">
          {['dev', 'staging', 'production'].map(env => (
            <button
              key={env}
              onClick={() => setEnvironment(env)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                environment === env ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {env}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => handleIntent('DEPLOY')}
          disabled={!selectedProject}
          className="flex flex-col items-center justify-center p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-xl transition-all group disabled:opacity-50"
        >
          <div className="p-3 rounded-full bg-blue-500/10 text-blue-500 mb-2 group-hover:scale-110 transition-transform">
            <Play size={24} />
          </div>
          <span className="font-medium text-sm">Deploy</span>
        </button>

        <button 
          onClick={() => handleIntent('TEST')}
          disabled={!selectedProject}
          className="flex flex-col items-center justify-center p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-green-500 rounded-xl transition-all group disabled:opacity-50"
        >
          <div className="p-3 rounded-full bg-green-500/10 text-green-500 mb-2 group-hover:scale-110 transition-transform">
            <Shield size={24} />
          </div>
          <span className="font-medium text-sm">Run Tests</span>
        </button>

        <button 
          onClick={() => handleIntent('REDEPLOY')}
          disabled={!selectedProject}
          className="flex flex-col items-center justify-center p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-yellow-500 rounded-xl transition-all group disabled:opacity-50"
        >
          <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-500 mb-2 group-hover:scale-110 transition-transform">
            <RefreshCw size={24} />
          </div>
          <span className="font-medium text-sm">Redeploy</span>
        </button>

        <button 
          onClick={() => handleIntent('ROLLBACK')}
          disabled={!selectedProject}
          className="flex flex-col items-center justify-center p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-red-500 rounded-xl transition-all group disabled:opacity-50"
        >
          <div className="p-3 rounded-full bg-red-500/10 text-red-500 mb-2 group-hover:scale-110 transition-transform">
            <Zap size={24} />
          </div>
          <span className="font-medium text-sm">Emergency Fix</span>
        </button>
      </div>

      {loading && (
        <div className="mt-6 p-4 text-center text-gray-400">
          Thinking...
        </div>
      )}

      {plan && (
        <div className="mt-6 border border-slate-700 rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium">AI Decision Summary</span>
            </div>
            <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
              Confidence: {(plan.confidenceScore * 100).toFixed(0)}%
            </span>
          </div>
          <div className="p-4 bg-slate-900/50">
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                    <span className="text-gray-500 block text-xs">Target Environment</span>
                    <span className="text-white font-mono">{plan.targetEnv}</span>
                </div>
                 <div>
                    <span className="text-gray-500 block text-xs">Jenkins Job</span>
                    <span className="text-white font-mono">{plan.jenkinsJob}</span>
                </div>
            </div>
            
            <div className="space-y-2 mb-6">
                <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Reasoning</p>
                {plan.reasoning.map((r, i) => (
                    <div key={i} className="flex items-start space-x-2 text-sm text-gray-300">
                        <CheckCircle size={14} className="mt-1 text-green-500 shrink-0" />
                        <span>{r}</span>
                    </div>
                ))}
                 {plan.riskFlags.map((r, i) => (
                    <div key={i} className="flex items-start space-x-2 text-sm text-yellow-400">
                        <AlertTriangle size={14} className="mt-1 text-yellow-500 shrink-0" />
                        <span>Risk Detected: {r}</span>
                    </div>
                ))}
            </div>

            <div className="flex justify-end space-x-3">
                <button 
                    onClick={() => setPlan(null)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleExecute}
                    disabled={executing}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                    {executing ? 'Executing...' : 'Approve & Execute'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionPanel;
