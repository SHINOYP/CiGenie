import React from 'react';
import { Activity, CheckCircle, AlertTriangle, Shield, Play } from 'lucide-react';

const ExecutionPlanCard = ({ plan, status }) => {
    const getActionTheme = (action) => {
        switch(action) {
            case 'TEST': return { color: 'green', text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: <Shield size={28} /> };
            default: return { color: 'blue', text: 'text-primary', bg: 'bg-primary/10', border: 'border-slate-700/50', icon: <Play size={28} /> };
        }
    };
    const theme = getActionTheme(plan?.action);

    return (
        <div className={`bg-surface border-2 ${theme.border} rounded-2xl p-8 relative overflow-hidden mb-8 shadow-xl`}>
            <div className="flex items-center space-x-4 mb-6">
                <div className={`p-4 ${theme.bg} rounded-xl ${theme.text} shadow-inner`}>
                    {theme.icon}
                </div>
                <div>
                    <h3 className="text-xl font-black text-white tracking-tight">{plan?.action || 'Execution'} Intent</h3>
                    <p className="text-sm text-gray-400 font-medium">Processing {plan?.action} for {plan?.targetEnv} node</p>
                </div>
            </div>

            <div className="space-y-6 relative z-10">
                <div className="bg-slate-900/60 p-6 rounded-2xl border-2 border-slate-800 shadow-inner">
                    <h4 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-[0.2em]">Decision Reasoning</h4>
                    <ul className="space-y-3">
                        {plan?.reasoning?.map((r, i) => (
                            <li key={i} className="text-base text-gray-200 flex items-start space-x-3 font-medium">
                                <CheckCircle size={18} className={`mt-1 ${theme.text} shrink-0`} />
                                <span>{r}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {status === 'FAILED' && (
                    <div className="bg-red-500/10 p-6 rounded-2xl border-2 border-red-500/20">
                        <h4 className="text-xs font-bold text-red-500 mb-2 uppercase tracking-[0.2em]">Diagnostic Alert</h4>
                        <p className="text-sm text-gray-200 leading-relaxed font-medium">
                            The execution pipeline was interrupted. Please analyze the <b>Real-time Logs</b> for technical root cause identification.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExecutionPlanCard;
