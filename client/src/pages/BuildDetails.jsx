import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Clock, Terminal, Cpu, Share2, Activity, Play } from 'lucide-react';

const mockLogs = `[INFO] Starting build for project: Payment API
[INFO] Branch: fix/stripe-webhook (d9e8f7)
[INFO] Installing dependencies...
[INFO] Package.json found. Running 'npm install'
[SUCCESS] Dependencies installed in 12s.
[INFO] Running tests...
[INFO] Test Suite 1: Authentication - PASSED
[INFO] Test Suite 2: Payment Processing - PASSED
[INFO] Test Suite 3: Webhook Handling - STARTED
[ERROR] Test failed: "Should validate signature header"
[ERROR] Expected 200, but got 401.
[ERROR] Error: Invalid Stripe Signature.
[INFO] Test Suite 3: Webhook Handling - FAILED
[INFO] Build Failed.
`;

const AIDetailCard = () => (
    <div className="bg-surface border border-indigo-500/30 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-50">
            <Cpu size={100} className="text-indigo-500/10" />
        </div>
        
        <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Activity size={24} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-white">AI Analysis</h3>
                <p className="text-xs text-indigo-300">Powered by Gemini Pro</p>
            </div>
        </div>

        <div className="space-y-4 relative z-10">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-indigo-500/20">
                <h4 className="text-sm font-semibold text-indigo-200 mb-2">Root Cause Identified</h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                    The build failed due to a <b>401 Unauthorized</b> error in the <code>Webhook Handling</code> test suite. 
                    The specific error <code>Invalid Stripe Signature</code> suggests that the Mock Stripe Secret in your test environment variables does not match the signature generator.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-indigo-500/20">
                     <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Recommended Action</h4>
                     <p className="text-sm text-gray-300">
                        Update the <code>STRIPE_WEBHOOK_SECRET</code> in your <code>.env.test</code> file to match the mock signature used in <code>tests/webhook.test.js</code>.
                     </p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg border border-indigo-500/20">
                     <h4 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">Risk Assessment</h4>
                     <p className="text-sm text-gray-300">
                        <b>Low Risk.</b> This is a configuration issue in the test environment and does not affect production unless the same secret is mismatched there.
                     </p>
                </div>
            </div>

            <div className="flex space-x-3 mt-4">
                <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex justify-center items-center space-x-2">
                    <Play size={16} />
                    <span>Retry with Fix</span>
                </button>
                <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Dismiss
                </button>
            </div>
        </div>
    </div>
);

const BuildDetails = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('logs');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link to="/builds" className="text-gray-400 hover:text-white flex items-center mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-2" />
          Back to Builds
        </Link>
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold">Build #{id || '1023'}</h1>
                    <span className="px-3 py-1 bg-danger/10 text-danger rounded-full text-sm font-medium flex items-center space-x-1">
                        <XCircle size={14} />
                        <span>Failed</span>
                    </span>
                </div>
                <p className="text-gray-400 mt-2 flex items-center space-x-4">
                    <span>Repository: <b>Payment API</b></span>
                    <span>•</span>
                    <span>Commit: <span className="font-mono text-gray-300">z9y8x7w</span></span>
                    <span>•</span>
                    <span className="flex items-center"><Clock size={14} className="mr-1"/> 1m 45s</span>
                </p>
            </div>
            <div className="flex space-x-3">
                <button className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Rebuild
                </button>
                <button className="bg-primary hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white">
                    Deploy Anyway
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface rounded-xl border border-slate-700 overflow-hidden">
                <div className="flex border-b border-slate-700">
                    <button 
                        onClick={() => setActiveTab('logs')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'logs' ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        Console Output
                    </button>
                    <button 
                         onClick={() => setActiveTab('artifacts')}
                         className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'artifacts' ? 'border-primary text-white' : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                        Artifacts
                    </button>
                </div>
                
                <div className="p-0">
                    {activeTab === 'logs' && (
                        <div className="bg-[#0c131f] p-4 overflow-x-auto">
                            <pre className="font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {mockLogs}
                            </pre>
                        </div>
                    )}
                    {activeTab === 'artifacts' && (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No artifacts generated for this build.
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <AIDetailCard />
            
            <div className="bg-surface rounded-xl border border-slate-700 p-6">
                <h3 className="font-semibold text-sm mb-4 uppercase text-gray-400 tracking-wider">Build Info</h3>
                <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Triggered By</span>
                        <span className="text-white">Webhook (GitHub)</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Branch</span>
                        <span className="text-white font-mono">fix/stripe-webhook</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500">Agent</span>
                        <span className="text-white">Jenkins-Node-01</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BuildDetails;
