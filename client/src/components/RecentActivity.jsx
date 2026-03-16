import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, CheckCircle, XCircle, AlertTriangle, Clock, Sparkles } from 'lucide-react';

const statusDot = {
    SUCCESS:     'bg-green-500',
    FAILED:      'bg-red-500',
    UNSTABLE:    'bg-yellow-500',
    IN_PROGRESS: 'bg-blue-500 animate-pulse',
    RUNNING:     'bg-blue-500 animate-pulse',
};

const statusBadge = {
    SUCCESS:     'bg-green-500/10 text-green-400',
    FAILED:      'bg-red-500/10 text-red-400',
    UNSTABLE:    'bg-yellow-500/10 text-yellow-400',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-400',
};

const StatusIcon = ({ status }) => {
    if (status === 'SUCCESS')     return <CheckCircle  size={10} />;
    if (status === 'FAILED')      return <XCircle      size={10} />;
    if (status === 'UNSTABLE')    return <AlertTriangle size={10} />;
    return <Clock size={10} />;
};

const RecentActivity = ({ activities = [], projects = {} }) => {
    return (
        <div className="bg-surface rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-700 flex justify-between items-center">
                <h3 className="font-semibold text-base">Recent Build Activity</h3>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{activities.length} records</span>
            </div>

            <div className="divide-y divide-slate-700/70 max-h-[420px] overflow-y-auto">
                {activities.length === 0 && (
                    <div className="p-10 text-center text-gray-500 text-sm italic">No activity yet. Run your first build!</div>
                )}

                {activities.map((item) => (
                    <Link
                        key={item.id}
                        to={`/projects/${item.id}`}
                        className="flex flex-col gap-1.5 p-4 hover:bg-slate-800/60 transition-all group"
                    >
                        {/* Top row: project name, action badge, status badge, time */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot[item.status] || 'bg-gray-500'}`} />
                                <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                                    {projects[item.projectId] || item.projectId}
                                </p>
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-700/80 text-gray-400 tracking-wider shrink-0">
                                    {item.plan?.action || 'BUILD'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge[item.status] || 'bg-gray-500/10 text-gray-400'}`}>
                                    <StatusIcon status={item.status} />
                                    {item.status === 'UNSTABLE' ? 'UNSTABLE' : item.status}
                                </span>
                                <span className="text-[10px] text-gray-600">{new Date(item.startTime).toLocaleTimeString()}</span>
                            </div>
                        </div>

                        {/* AI Summary headline — the money row */}
                        {item.aiSummary?.headline ? (
                            <div className="flex items-start gap-1.5 pl-4">
                                <Sparkles size={10} className="text-purple-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-gray-400 leading-snug">{item.aiSummary.headline}</p>
                            </div>
                        ) : (item.status === 'FAILED' || item.status === 'UNSTABLE') ? (
                            <p className="text-[11px] text-gray-600 pl-4 italic">Open to see full report</p>
                        ) : null}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RecentActivity;
