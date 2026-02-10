import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal as TerminalIcon, Clock } from 'lucide-react';
import { getExecution } from '../services/api';

const TerminalModal = ({ executionId, onClose }) => {
    const [execution, setExecution] = useState(null);
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
                const data = await getExecution(executionId);
                setExecution(data);
                if (data.status === 'SUCCESS' || data.status === 'FAILED') {
                    if (interval) clearInterval(interval);
                }
            } catch (e) {
                console.error('Failed to fetch logs:', e);
            }
        };

        fetchDetails();
        interval = setInterval(fetchDetails, 3000);
        return () => clearInterval(interval);
    }, [executionId]);

    if (!executionId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-slate-700/50 rounded-lg text-primary">
                            <TerminalIcon size={18} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Live Console Output</h3>
                            <p className="text-[10px] text-gray-500 font-mono">ID: {executionId.substring(0, 12)}...</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        {execution && (
                            <div className={`flex items-center space-x-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                execution.status === 'SUCCESS' ? 'bg-success/10 text-success' :
                                execution.status === 'FAILED' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                            }`}>
                                {execution.status === 'IN_PROGRESS' ? 'STREAMING' : execution.status}
                            </div>
                        )}
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex flex-col bg-[#0c131f]">
                    <div 
                        className="flex-1 overflow-y-auto p-4 font-mono text-xs text-gray-300 leading-relaxed custom-scrollbar" 
                        ref={logsRef}
                    >
                        {!execution ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-4">
                                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <div className="animate-pulse italic">Connecting to Jenkins...</div>
                            </div>
                        ) : execution.logs?.length === 0 ? (
                            <div className="text-gray-600 italic">No output received yet. Waiting for build to start...</div>
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

                {/* Footer */}
                <div className="bg-slate-800/30 px-4 py-2 border-t border-slate-700 flex justify-between items-center">
                    <div className="text-[10px] text-gray-500 flex items-center">
                        <Clock size={10} className="mr-1" />
                        Last checked: {new Date().toLocaleTimeString()}
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-white bg-slate-700 hover:bg-slate-600 px-4 py-1 rounded text-xs transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TerminalModal;
