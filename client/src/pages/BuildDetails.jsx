import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Cpu, Activity, Play, Shield } from 'lucide-react';
import { getExecutionDetails, analyzeIntent, executePlan } from '../services/api';

const AIDetailCard = ({ plan, status }) => (
    <div className="bg-surface border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 p-4 opacity-50">
            <Cpu size={100} className="text-indigo-500/10" />
        </div>
        
        <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Activity size={24} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-white">AI Decision Context</h3>
                <p className="text-xs text-indigo-300">Analysis for {plan?.action} to {plan?.targetEnv}</p>
            </div>
        </div>

        <div className="space-y-4 relative z-10">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-indigo-500/20">
                <h4 className="text-sm font-semibold text-indigo-200 mb-2">Execution Reasoning</h4>
                <ul className="space-y-2">
                    {plan?.reasoning?.map((r, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start space-x-2">
                            <CheckCircle size={14} className="mt-1 text-indigo-400 shrink-0" />
                            <span>{r}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {status === 'FAILED' && (
                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                     <h4 className="text-sm font-semibold text-red-400 mb-2">Failure Analysis</h4>
                     <p className="text-sm text-gray-300">
                        The build failed during the testing phase. Possible root cause: <b>Integration Test Timeout</b>.
                     </p>
                </div>
            )}
        </div>
    </div>
);

const BuildDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let interval;
    const fetchDetails = async () => {
        try {
            const data = await getExecutionDetails(id);
            setExecution(data);
            if (data.status === 'SUCCESS' || data.status === 'FAILED') {
                 setLoading(false);
                 if (interval) clearInterval(interval);
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    fetchDetails();
    interval = setInterval(fetchDetails, 2000); // Poll for updates
    return () => clearInterval(interval);
  }, [id]);

  const handleRetry = async () => {
      if (!execution) return;
      setRetrying(true);
      try {
          // Re-analyze intent to get a new plan (or just reuse, but analysis is safer)
          const newPlan = await analyzeIntent(execution.projectId, {
              action: execution.plan.action,
              environment: execution.plan.targetEnv,
              branch: execution.plan.jenkinsParams.BRANCH
          });
          const result = await executePlan(newPlan);
          navigate(`/build/${result.executionId}`);
      } catch (e) {
          alert('Retry failed: ' + e.message);
          setRetrying(false);
      }
  };

  if (!execution && loading) return <div className="p-8 text-center">Loading execution details...</div>;
  if (!execution) return <div className="p-8 text-center text-red-400">Execution not found</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="text-gray-400 hover:text-white flex items-center mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Back to Control Plane
        </Link>
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold">
                        {execution.plan?.action} <span className="text-gray-500">to</span> {execution.plan?.targetEnv}
                    </h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${
                        execution.status === 'SUCCESS' ? 'bg-success/10 text-success' :
                        execution.status === 'FAILED' ? 'bg-danger/10 text-danger' :
                        'bg-yellow-500/10 text-yellow-500'
                    }`}>
                        {execution.status === 'SUCCESS' ? <CheckCircle size={14} /> : 
                         execution.status === 'FAILED' ? <XCircle size={14} /> : <Clock size={14} />}
                        <span>{execution.status}</span>
                    </span>
                </div>
                <p className="text-gray-400 mt-2 flex items-center space-x-4">
                    <span>Project: <b>{execution.plan?.projectId}</b></span>
                    <span>•</span>
                    <span>ID: <span className="font-mono text-gray-300">{execution.id}</span></span>
                    <span>•</span>
                    <span>{new Date(execution.startTime).toLocaleString()}</span>
                </p>
            </div>
            <div className="flex space-x-3">
                {execution.status === 'FAILED' && (
                    <button 
                        onClick={handleRetry}
                        disabled={retrying}
                        className="bg-primary hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white flex items-center space-x-2"
                    >
                        <Play size={16} />
                        <span>{retrying ? 'Retrying...' : 'Retry Intent'}</span>
                    </button>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-slate-700 font-semibold">
                    Execution Logs
                </div>
                <div className="bg-[#0c131f] p-4 h-[400px] overflow-y-auto font-mono text-xs text-gray-300 leading-relaxed">
                    {execution.logs?.length === 0 ? (
                        <span className="text-gray-600">Waiting for logs...</span>
                    ) : (
                        execution.logs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))
                    )}
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <AIDetailCard plan={execution.plan} status={execution.status} />
            
            <div className="bg-surface rounded-xl border border-slate-700 p-6">
                <h3 className="font-semibold text-sm mb-4 uppercase text-gray-400 tracking-wider">Parameters</h3>
                <div className="space-y-2 text-sm">
                    {Object.entries(execution.plan?.jenkinsParams || {}).map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-gray-500">{key}</span>
                            <span className="text-white font-mono">{val}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BuildDetails;
