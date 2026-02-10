import React from 'react';
import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';

const ExecutionPlanCard = ({ plan, status }) => {
    const getActionTheme = (action) => {
        switch(action) {
            case 'TEST': return { color: 'green', text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: <Shield size={24} /> };
            case 'ROLLBACK': return { color: 'red', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <Activity size={24} /> };
            default: return { color: 'blue', text: 'text-primary', bg: 'bg-primary/10', border: 'border-slate-700/50', icon: <Play size={24} /> };
        }
    };
    const theme = getActionTheme(plan?.action);

    return (
        <div className={`bg-surface border ${theme.border} rounded-xl p-6 relative overflow-hidden mb-6 shadow-sm`}>
            <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 ${theme.bg} rounded-lg ${theme.text}`}>
                    {theme.icon}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">{plan?.action || 'Execution'} Plan</h3>
                    <p className="text-xs text-gray-400">Context for {plan?.action} to {plan?.targetEnv}</p>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider text-[10px]">Decision Logic</h4>
                    <ul className="space-y-2">
                        {plan?.reasoning?.map((r, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start space-x-2">
                                <CheckCircle size={14} className={`mt-1 ${theme.text} shrink-0`} />
                                <span>{r}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {status === 'FAILED' && (
                    <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                        <h4 className="text-sm font-semibold text-red-400 mb-2 uppercase tracking-wider text-[10px]">Issue Detection</h4>
                        <p className="text-sm text-gray-300">
                            The execution failed. Review the <b>Live Console Output</b> for specific error logs and stack traces.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExecutionPlanCard;
