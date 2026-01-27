import React from 'react';
import { Cpu, Activity, CheckCircle } from 'lucide-react';

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

export default AIDetailCard;
