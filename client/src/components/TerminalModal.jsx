import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal as TerminalIcon, Clock, Sparkles, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { getExecution } from '../services/api';

const statusConfig = {
    SUCCESS:     { icon: CheckCircle,    color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20',  label: 'PASSED' },
    FAILED:      { icon: XCircle,        color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    label: 'FAILED' },
    UNSTABLE:    { icon: AlertTriangle,  color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'UNSTABLE' },
    IN_PROGRESS: { icon: Clock,          color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   label: 'RUNNING' },
    QUEUED:      { icon: Clock,          color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20',   label: 'QUEUED' },
    PENDING:     { icon: Clock,          color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20',   label: 'PENDING' },
};

const aiTypeConfig = {
    success: { bg: 'bg-green-500/10',  border: 'border-green-500/25',  iconColor: 'text-green-400',  icon: CheckCircle  },
    warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/25', iconColor: 'text-yellow-400', icon: AlertTriangle },
    error:   { bg: 'bg-red-500/10',    border: 'border-red-500/25',    iconColor: 'text-red-400',    icon: XCircle      },
    info:    { bg: 'bg-blue-500/10',   border: 'border-blue-500/25',   iconColor: 'text-blue-400',   icon: Info         },
};

const AISummaryCard = ({ aiSummary }) => {
    if (!aiSummary) return null;
    const cfg = aiTypeConfig[aiSummary.type] || aiTypeConfig.info;
    const Icon = cfg.icon;

    return (
        <div className={`m-4 rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
            <div className="flex items-center px-6 py-3 border-b border-white/5">
                <Sparkles size={16} className="mr-3 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">AI Logic Reasoning</span>
            </div>
            <div className="p-4 space-y-3">
                {/* Headline */}
                <div className="flex items-start gap-3">
                    <Icon size={18} className={`${cfg.iconColor} shrink-0 mt-0.5`} />
                    <p className="text-sm font-bold text-white leading-snug">{aiSummary.headline}</p>
                </div>

                {/* Reason */}
                {aiSummary.reason && (
                    <div className="pl-8">
                        <p className="text-xs uppercase font-bold text-gray-500 tracking-widest mb-2">Detailed Observation</p>
                        <p className="text-sm text-gray-300 leading-relaxed font-medium">{aiSummary.reason}</p>
                    </div>
                )}

                {/* Suggestion */}
                {aiSummary.suggestion && (
                    <div className="pl-8 pt-4 border-t border-white/5">
                        <p className="text-xs uppercase font-bold text-gray-500 tracking-widest mb-2">Recommended Action</p>
                        <p className="text-sm text-gray-200 leading-relaxed font-bold">{aiSummary.suggestion}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const TerminalModal = ({ executionId, onClose }) => {
    const [execution, setExecution] = useState(null);
    const [showLogs, setShowLogs] = useState(false);
    const logsRef = useRef(null);

    useEffect(() => {
        if (showLogs && logsRef.current) {
            logsRef.current.scrollTop = logsRef.current.scrollHeight;
        }
    }, [execution?.logs, showLogs]);

    useEffect(() => {
        let interval;
        const fetchDetails = async () => {
            try {
                const data = await getExecution(executionId);
                setExecution(data);

                // Auto-expand logs if they exist and build is running
                if (data.logs?.length > 0 && (data.status === 'IN_PROGRESS' || data.status === 'QUEUED')) {
                    setShowLogs(true);
                }

                if (data.status === 'SUCCESS' || data.status === 'FAILED' || data.status === 'UNSTABLE') {
                    if (interval) clearInterval(interval);
                }
            } catch (e) {
                console.error('Failed to fetch logs:', e);
            }
        };
        fetchDetails();
        interval = setInterval(fetchDetails, 1500); // Faster polling for "live" feel
        return () => clearInterval(interval);
    }, [executionId]);

    if (!executionId) return null;

    const isFinished = execution?.status === 'SUCCESS' || execution?.status === 'FAILED' || execution?.status === 'UNSTABLE';
    const isRunning = !isFinished && execution;
    const cfg = statusConfig[execution?.status] || statusConfig.PENDING;
    const StatusIcon = cfg.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#0d1117] border border-slate-700/60 w-full lg:max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-full lg:max-h-[90vh]">

                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-700/60 flex items-center justify-between bg-slate-800/50">
                    <div className="flex items-center space-x-4 min-w-0">
                        <div className="p-2 bg-slate-700/60 rounded-xl shrink-0">
                            <TerminalIcon size={20} className="text-purple-400" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-white truncate">Final Build Report</h3>
                            <p className="text-xs text-gray-500 font-mono truncate">Transaction ID: {executionId?.substring(0, 16)}...</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                        {execution && (
                            <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.1em] ${cfg.bg} ${cfg.color} border-2 ${cfg.border} shadow-sm`}>
                                {isRunning && <div className="w-2 h-2 rounded-full bg-current animate-pulse" />}
                                <span>{cfg.label}</span>
                            </div>
                        )}
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/50">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">

                    {/* Loading state */}
                    {!execution && (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-600 space-y-4">
                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs animate-pulse">Connecting to build agent...</p>
                        </div>
                    )}

                    {/* Running state — no AI summary yet */}
                    {isRunning && !execution?.aiSummary && (
                        <div className="m-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-blue-300">Build is in progress...</p>
                                <p className="text-[10px] text-gray-500">AI analysis will appear here once the build finishes.</p>
                            </div>
                        </div>
                    )}

                    {/* AI Summary — shown prominently when finished */}
                    {execution?.aiSummary && <AISummaryCard aiSummary={execution.aiSummary} />}

                    {/* Test Results summary row */}
                    {isFinished && execution?.testResults && (execution.testResults.testsPassed > 0 || execution.testResults.testsFailed > 0) && (
                        <div className="mx-4 mb-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-xl bg-green-500/10 border-2 border-green-500/20 text-center shadow-sm">
                                <p className="text-2xl font-black text-green-400">{execution.testResults.testsPassed}</p>
                                <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">Successful</p>
                            </div>
                            <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/20 text-center shadow-sm">
                                <p className="text-2xl font-black text-red-400">{execution.testResults.testsFailed}</p>
                                <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">Failed</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-800/60 border-2 border-slate-700 text-center col-span-2 sm:col-span-1 shadow-sm">
                                <p className="text-2xl font-black text-white">{(execution.testResults.testsPassed || 0) + (execution.testResults.testsFailed || 0)}</p>
                                <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">Executed</p>
                            </div>
                        </div>
                    )}

                    {/* Terminal logs toggle */}
                    {execution && (
                        <div className="px-4 pb-4">
                            <button
                                onClick={() => setShowLogs(v => !v)}
                                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors text-xs text-gray-400 hover:text-white"
                            >
                                <div className="flex items-center gap-2">
                                    <TerminalIcon size={12} />
                                    <span>Raw Console Output</span>
                                    <span className="text-gray-600">({execution.logs?.length || 0} lines)</span>
                                </div>
                                <span className="text-gray-600">{showLogs ? '▲ collapse' : '▼ expand'}</span>
                            </button>

                            {showLogs && (
                                <div
                                    className="mt-2 rounded-lg bg-black/60 border border-slate-800 max-h-64 overflow-y-auto p-3 font-mono text-[11px] text-gray-300 leading-relaxed"
                                    ref={logsRef}
                                >
                                    {execution.logs?.length === 0 ? (
                                        <p className="text-gray-600 italic">No output yet...</p>
                                    ) : (
                                        execution.logs.map((log, i) => (
                                            <div key={i} className={`whitespace-pre-wrap py-0.5 ${
                                                log.includes('ERROR') || log.includes('FAILURE') || log.includes('failed') ? 'text-red-400' :
                                                log.includes('SUCCESS') || log.includes('passed') ? 'text-green-400' : ''
                                            }`}>
                                                <span className="text-gray-700 mr-2 select-none">{(i + 1).toString().padStart(3, '0')}</span>
                                                {log}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-700/60 flex justify-between items-center bg-slate-800/30">
                    <div className="text-[10px] text-gray-600 flex items-center gap-1">
                        <Clock size={10} />
                        {execution?.startTime ? new Date(execution.startTime).toLocaleString() : 'Waiting...'}
                    </div>
                    <button onClick={onClose} className="text-white bg-slate-700 hover:bg-slate-600 px-5 py-1.5 rounded-lg text-xs transition-colors font-medium">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TerminalModal;
