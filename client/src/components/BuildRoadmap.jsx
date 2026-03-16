import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Loader, GitBranch, Package, FlaskConical, Rocket, Sparkles } from 'lucide-react';
import { getExecution } from '../services/api';

// ─── Stage Definitions ───────────────────────────────────────────────────────
const STAGES_DEPLOY = [
    {
        key: 'checkout',
        label: 'Checkout',
        desc: 'Cloning repository from GitHub',
        icon: GitBranch,
        detect: (logs) => logs.some(l => /Checkout|Cloning into|git clone|Fetching changes/i.test(l)),
    },
    {
        key: 'install',
        label: 'Install',
        desc: 'Installing npm dependencies',
        icon: Package,
        detect: (logs) => logs.some(l => /Install Dependencies|npm ci|npm install|added \d+ package/i.test(l)),
    },
    {
        key: 'build',
        label: 'Build',
        desc: 'Compiling production artifacts',
        icon: Rocket,
        detect: (logs) => logs.some(l => /\(Build\)|npm run build|Creating an optimized|compiled successfully/i.test(l)),
    },
    {
        key: 'deploy',
        label: 'Deploy',
        desc: 'Copying files to target path',
        icon: Rocket,
        detect: (logs) => logs.some(l => /\(Deploy\)|Deploying|rsync|robocopy|deployed to/i.test(l)),
    },
];

const STAGES_TEST = [
    {
        key: 'checkout',
        label: 'Checkout',
        desc: 'Cloning repository from GitHub',
        icon: GitBranch,
        detect: (logs) => logs.some(l => /Checkout|Cloning into|git clone|Fetching changes/i.test(l)),
    },
    {
        key: 'install',
        label: 'Install',
        desc: 'Installing npm dependencies',
        icon: Package,
        detect: (logs) => logs.some(l => /Install Dependencies|npm ci|npm install|added \d+ package/i.test(l)),
    },
    {
        key: 'test',
        label: 'Run Tests',
        desc: 'Executing test suite',
        icon: FlaskConical,
        detect: (logs) => logs.some(l => /Run Tests|npm test|PASS |FAIL |Test Suites:/i.test(l)),
    },
    {
        key: 'result',
        label: 'Analyze',
        desc: 'Post-processing results',
        icon: Sparkles,
        detect: (logs, status) => status === 'SUCCESS' || status === 'FAILED' || status === 'UNSTABLE',
    },
];

// ─── Stage Status Computation ─────────────────────────────────────────────────
const computeStages = (execution, stagesDef) => {
    const logs = execution?.logs || [];
    const status = execution?.status || 'PENDING';
    const isFinished = ['SUCCESS', 'FAILED', 'UNSTABLE'].includes(status);

    // Find the highest detected stage index
    let lastDetected = -1;
    stagesDef.forEach((s, i) => {
        if (s.detect(logs, status)) lastDetected = i;
    });

    return stagesDef.map((s, i) => {
        if (i < lastDetected) return { ...s, state: 'done' };
        if (i === lastDetected) {
            if (isFinished) {
                return { ...s, state: status === 'SUCCESS' ? 'done' : status === 'UNSTABLE' ? 'unstable' : 'failed' };
            }
            return { ...s, state: 'active' };
        }
        if (i === lastDetected + 1 && !isFinished) return { ...s, state: 'pending-active' };
        return { ...s, state: 'pending' };
    });
};

// ─── Stage Icon Component ─────────────────────────────────────────────────────
const StepIcon = ({ state, Icon }) => {
    if (state === 'done')         return <CheckCircle size={18} className="text-green-400" />;
    if (state === 'failed')       return <XCircle size={18} className="text-red-400" />;
    if (state === 'unstable')     return <AlertTriangle size={18} className="text-yellow-400" />;
    if (state === 'active')       return <Loader size={18} className="text-blue-400 animate-spin" />;
    if (state === 'pending-active') return <div className="w-4.5 h-4.5 rounded-full border-2 border-blue-500/50 bg-blue-500/10 flex items-center justify-center"><Icon size={10} className="text-blue-400" /></div>;
    return <Icon size={16} className="text-gray-600" />;
};

const stateConnector = (state) => {
    if (state === 'done' || state === 'unstable') return 'bg-green-500/60';
    if (state === 'failed') return 'bg-red-500/40';
    if (state === 'active') return 'bg-gradient-to-r from-green-500/60 to-blue-500/20 animate-pulse';
    return 'bg-slate-700';
};

// ─── AI Summary Strip ─────────────────────────────────────────────────────────
const AISummaryStrip = ({ aiSummary }) => {
    if (!aiSummary?.headline) return null;
    const colors = {
        success: 'bg-green-500/10 border-green-500/20 text-green-300',
        warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
        error:   'bg-red-500/10 border-red-500/20 text-red-300',
        info:    'bg-blue-500/10 border-blue-500/20 text-blue-300',
    };
    return (
        <div className={`mt-4 rounded-xl border p-4 ${colors[aiSummary.type] || colors.info}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles size={11} className="text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">AI Analysis</span>
            </div>
            <p className="text-sm font-semibold leading-snug mb-1">{aiSummary.headline}</p>
            {aiSummary.reason && <p className="text-xs opacity-80 leading-relaxed">{aiSummary.reason}</p>}
            {aiSummary.suggestion && (
                <p className="text-xs mt-2 font-medium border-t border-white/10 pt-2 opacity-90">{aiSummary.suggestion}</p>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const BuildRoadmap = ({ executionId, action, onClose }) => {
    const [execution, setExecution] = useState(null);

    const stagesDef = (action || '').toUpperCase() === 'TEST' ? STAGES_TEST : STAGES_DEPLOY;

    useEffect(() => {
        if (!executionId) return;
        let interval;
        const fetch = async () => {
            try {
                const data = await getExecution(executionId);
                setExecution(data);
                if (['SUCCESS', 'FAILED', 'UNSTABLE'].includes(data.status)) {
                    clearInterval(interval);
                }
            } catch (e) { /* swallow */ }
        };
        fetch();
        interval = setInterval(fetch, 2000);
        return () => clearInterval(interval);
    }, [executionId]);

    const stages = computeStages(execution, stagesDef);
    const isFinished = execution && ['SUCCESS', 'FAILED', 'UNSTABLE'].includes(execution.status);

    const headerColors = {
        SUCCESS:     'border-green-500/30 bg-green-500/5',
        FAILED:      'border-red-500/30 bg-red-500/5',
        UNSTABLE:    'border-yellow-500/30 bg-yellow-500/5',
    };
    const statusLabel = {
        SUCCESS:     { text: 'Completed', color: 'text-green-400' },
        FAILED:      { text: 'Failed', color: 'text-red-400' },
        UNSTABLE:    { text: 'Tests Failed', color: 'text-yellow-400' },
        IN_PROGRESS: { text: 'In Progress', color: 'text-blue-400' },
        QUEUED:      { text: 'Queued', color: 'text-gray-400' },
        PENDING:     { text: 'Starting...', color: 'text-gray-400' },
    };
    const sl = statusLabel[execution?.status] || statusLabel.PENDING;

    return (
        <div className={`mt-6 rounded-2xl border overflow-hidden ${headerColors[execution?.status] || 'border-blue-500/20 bg-blue-500/5'}`}>
            {/* Header */}
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {!isFinished && <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        Pipeline — {(action || 'BUILD').toUpperCase()}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold ${sl.color}`}>{sl.text}</span>
                    {isFinished && (
                        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-[10px] underline">dismiss</button>
                    )}
                </div>
            </div>

            {/* Responsive Stepper: Vertical on mobile, Horizontal on LG+ */}
            <div className="px-6 py-5">
                <div className="flex flex-col lg:flex-row items-center lg:items-start lg:justify-between relative gap-6 lg:gap-0">
                    {stages.map((stage, i) => {
                        const Icon = stage.icon;
                        const isLast = i === stages.length - 1;

                        return (
                            <React.Fragment key={stage.key}>
                                {/* Step node */}
                                <div className="flex flex-row lg:flex-col items-center gap-4 lg:gap-2 flex-1 w-full lg:w-auto">
                                    {/* Circle + icon */}
                                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10 shrink-0 ${
                                        stage.state === 'done'          ? 'border-green-500/60 bg-green-500/10' :
                                        stage.state === 'unstable'      ? 'border-yellow-500/60 bg-yellow-500/10' :
                                        stage.state === 'failed'        ? 'border-red-500/60 bg-red-500/10' :
                                        stage.state === 'active'        ? 'border-blue-500 bg-blue-500/15 shadow-[0_0_12px_rgba(59,130,246,0.4)]' :
                                        stage.state === 'pending-active' ? 'border-blue-500/30 bg-slate-800' :
                                        'border-slate-700 bg-slate-800/50'
                                    }`}>
                                        <StepIcon state={stage.state} Icon={Icon} />
                                    </div>
                                    {/* Text content */}
                                    <div className="text-left lg:text-center flex-1">
                                        <p className={`text-[11px] font-bold ${
                                            stage.state === 'done' ? 'text-green-400' :
                                            stage.state === 'failed' ? 'text-red-400' :
                                            stage.state === 'unstable' ? 'text-yellow-400' :
                                            stage.state === 'active' ? 'text-white' :
                                            'text-gray-600'
                                        }`}>{stage.label}</p>
                                        <p className={`text-[9px] mt-0.5 leading-tight ${stage.state === 'active' ? 'text-gray-400' : 'text-gray-700'}`}>
                                            {stage.desc}
                                        </p>
                                    </div>
                                </div>

                                {/* Connector line (visible only on desktop) */}
                                {!isLast && (
                                    <div className={`hidden lg:block h-0.5 flex-1 mx-1 mt-5 rounded transition-all duration-700 ${stateConnector(stage.state)}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* AI Summary when done */}
                {isFinished && <AISummaryStrip aiSummary={execution?.aiSummary} />}

                {/* Loading hint while running and no AI yet */}
                {!isFinished && execution && (
                    <p className="text-center text-[10px] text-gray-600 mt-3 animate-pulse">
                        Polling Jenkins every 2 seconds for updates...
                    </p>
                )}
                {!execution && (
                    <p className="text-center text-[10px] text-gray-600 mt-3 animate-pulse">
                        Waiting for build agent to pick up the job...
                    </p>
                )}
            </div>
        </div>
    );
};

export default BuildRoadmap;
