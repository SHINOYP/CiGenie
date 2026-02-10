import React, { useState, useEffect } from 'react';
import { Shield, Github, Save, CheckCircle, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { getConfig, updateConfig, syncGithubProjects } from '../services/api';

const SettingsPage = () => {
    const [config, setConfig] = useState({
        githubUsername: '',
        githubToken: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }
    const [showToken, setShowToken] = useState(false);

    useEffect(() => {
        getConfig()
            .then(data => {
                setConfig(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatus(null);
        try {
            await updateConfig(config);
            setStatus({ type: 'success', message: 'Configuration saved successfully! Projects will sync in the background.' });
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to save configuration: ' + err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading configuration...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold">System Configuration</h2>
                <p className="text-gray-400 text-sm mt-1">Manage global credentials and integration settings.</p>
            </div>

            <div className="bg-surface rounded-xl border border-slate-700 overflow-hidden">
                <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700 flex items-center space-x-3">
                    <Github className="text-white" size={20} />
                    <h3 className="font-semibold">GitHub Integration</h3>
                </div>
                
                <form onSubmit={handleSave} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">
                                GitHub Username
                            </label>
                            <input 
                                type="text"
                                value={config.githubUsername}
                                onChange={(e) => setConfig({ ...config, githubUsername: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors"
                                placeholder="e.g. octocat"
                                required
                            />
                            <p className="text-[10px] text-gray-500 mt-1.5 italic">
                                Note: This username will be used to fetch your repositories.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">
                                Personal Access Token
                            </label>
                            <div className="relative">
                                <input 
                                    type={showToken ? "text" : "password"}
                                    value={config.githubToken}
                                    onChange={(e) => setConfig({ ...config, githubToken: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary transition-colors pr-12"
                                    placeholder="ghp_xxxxxxxxxxxx"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowToken(!showToken)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                >
                                    {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1.5 flex items-start">
                                <Shield size={10} className="mr-1 mt-0.5" />
                                <span>Token is used for authenticated API calls and to increase rate limits. (Repo scope required)</span>
                            </p>
                        </div>
                    </div>

                    {status && (
                        <div className={`p-4 rounded-lg flex items-start space-x-3 ${
                            status.type === 'success' ? 'bg-success/10 border border-success/20 text-success' : 'bg-danger/10 border border-danger/20 text-danger'
                        }`}>
                            {status.type === 'success' ? <CheckCircle size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                            <span className="text-sm">{status.message}</span>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-700 flex justify-end">
                        <button 
                            type="submit"
                            disabled={saving}
                            className="bg-primary hover:bg-blue-600 px-6 py-2 rounded-lg text-sm font-medium transition-colors text-white flex items-center space-x-2 disabled:opacity-50"
                        >
                            <Save size={18} />
                            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                        </button>
                    </div>

                    <div className="pt-6 border-t border-slate-700">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-bold text-gray-300">Force Repository Sync</h4>
                                <p className="text-[10px] text-gray-500 mt-0.5">Manually re-fetch your GitHub projects list.</p>
                            </div>
                            <button 
                                type="button"
                                onClick={async () => {
                                    setSaving(true);
                                    try {
                                        const result = await syncGithubProjects();
                                        setStatus({ type: 'success', message: `Successfully synced ${result.count} projects from GitHub!` });
                                    } catch (err) {
                                        setStatus({ type: 'error', message: 'Sync failed: ' + err.message });
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                                disabled={saving || !config.githubUsername}
                                className="border border-slate-700 hover:bg-slate-800 px-4 py-2 rounded-lg text-xs font-medium transition-colors text-gray-300 flex items-center space-x-2 disabled:opacity-50"
                            >
                                <RefreshCw size={14} className={saving ? 'animate-spin' : ''} />
                                <span>Sync Repos Now</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="mt-8 p-6 bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
                <h4 className="text-sm font-bold text-gray-300 mb-2">Security Notice</h4>
                <div className="text-xs text-gray-500 leading-relaxed">
                    Credentials are stored in-memory on the Control Plane (Node.js). They are used ONLY for:
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                        <li>Fetching public/private repositories for display.</li>
                        <li>Downloading project source code during build execution in Jenkins.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
