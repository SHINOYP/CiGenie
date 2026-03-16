import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Play, Shield, RefreshCw, Zap } from 'lucide-react';
import { getExecution, analyzeIntent, executePlan } from '../services/api';
import ExecutionPlanCard from '../components/ExecutionPlanCard';


const BuildDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const logsRef = useRef(null);

  useEffect(() => {
    if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [execution?.logs]);

  useEffect(() => {
    let interval;
    const fetchDetails = async () => {
        try {
            const data = await getExecution(id);
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
          navigate(`/projects/${result.executionId}`);
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
        <Link to="/" className="text-gray-400 hover:text-white flex items-center mb-6 transition-colors text-sm font-medium tracking-wide">
          <ArrowLeft size={18} className="mr-2" />
          Return to Control Plane
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                        {execution.plan?.action} <span className="text-gray-500">to</span> {execution.plan?.targetEnv}
                    </h1>
                    <span className={`w-fit px-4 py-1.5 rounded-full text-sm font-bold flex items-center space-x-2 border-2 ${
                        execution.status === 'SUCCESS' ? 'bg-success/10 text-success border-success/20' :
                        execution.status === 'FAILED' ? 'bg-danger/10 text-danger border-danger/20' :
                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                        {execution.status === 'SUCCESS' ? <CheckCircle size={16} /> : 
                         execution.status === 'FAILED' ? <XCircle size={16} /> : <Clock size={16} />}
                        <span className="tracking-widest uppercase">{execution.status}</span>
                    </span>
                </div>
                <div className="text-gray-400 mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
                    <span>Project: <b className="text-white">{execution.plan?.projectId}</b></span>
                    {execution.plan?.projectType && (
                        <span className={`px-3 py-0.5 rounded-full text-xs font-bold tracking-[0.1em] ${
                            execution.plan.projectType === 'REACT' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 
                            execution.plan.projectType === 'NODE' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-700 text-gray-400'
                        }`}>
                            {execution.plan.projectType}
                        </span>
                    )}
                    <span className="hidden sm:inline text-gray-700">•</span>
                    <span>Reference: <span className="font-mono text-gray-300">{execution.id?.substring(0, 12)}...</span></span>
                    <span className="hidden sm:inline text-gray-700">•</span>
                    <span>{new Date(execution.startTime).toLocaleString()}</span>
                </div>
            </div>
            <div className="flex space-x-3 w-full md:w-auto">
                {execution.status === 'FAILED' && (
                    <button 
                        onClick={handleRetry}
                        disabled={retrying}
                        className="w-full md:w-auto bg-primary hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white flex items-center justify-center space-x-2"
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
            <div className="bg-[#0c131f] rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
                <div className="bg-slate-800/80 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center space-x-3">
                        <div className="flex space-x-2">
                            <div className="w-4 h-4 rounded-full bg-red-500/60" />
                            <div className="w-4 h-4 rounded-full bg-yellow-500/60" />
                            <div className="w-4 h-4 rounded-full bg-green-500/60" />
                        </div>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] ml-3">Real-time Pipeline Logs</span>
                    </div>
                </div>
                <div className="p-6 h-[600px] overflow-y-auto font-mono text-sm text-gray-300 leading-relaxed custom-scrollbar bg-black/40" ref={logsRef}>
                    {execution.logs?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-4">
                             <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                             <div className="animate-pulse">Initializing Terminal...</div>
                        </div>
                    ) : (
                        execution.logs.map((log, i) => (
                            <div key={i} className={`whitespace-pre-wrap py-0.5 ${log.includes('ERROR') || log.includes('FAILURE') || log.includes('failed') ? 'text-red-400 bg-red-400/5' : ''} ${log.includes('SUCCESS') || log.includes('passed') ? 'text-green-400' : ''}`}>
                                <span className="text-gray-600 mr-2 opacity-50 select-none">{(i + 1).toString().padStart(3, '0')}</span>
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

         <div className="space-y-6">
            <ExecutionPlanCard plan={execution.plan} status={execution.status} />

            {execution.testResults && (
                <div className="bg-surface rounded-xl border border-slate-700 p-6 animate-in slide-in-from-right-4">
                    <h3 className="font-semibold text-sm mb-4 uppercase text-gray-400 tracking-wider flex items-center">
                        <Shield size={16} className="mr-2 text-primary" />
                        Test Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-800 p-4 rounded-lg text-center border border-slate-700">
                            <div className="text-2xl font-bold text-green-500">{execution.testResults.testsPassed || 0}</div>
                            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-semibold">Passed</div>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-lg text-center border border-slate-700">
                            <div className="text-2xl font-bold text-red-500">{execution.testResults.testsFailed || 0}</div>
                            <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-semibold">Failed</div>
                        </div>
                    </div>
                    {execution.testResults.recommendation && (
                        <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
                            execution.testResults.testsFailed > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
                        }`}>
                            <span className="font-bold mr-1 block mb-1 uppercase tracking-tighter text-[10px]">Analysis & Recommendation:</span>
                            {execution.testResults.recommendation}
                        </div>
                    )}
                </div>
            )}
            
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
