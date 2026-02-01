import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { getDashboardStats, getSystemStatus, getAIInsights, getHistory, getProjects } from '../services/api';
import ActionPanel from '../components/ActionPanel';
import StatCard from '../components/StatCard';
import RecentActivity from '../components/RecentActivity';

const Dashboard = () => {
  const [stats, setStats] = useState({
      totalBuilds: 0,
      successRate: '0%',
      failedBuilds: 0,
      avgDuration: '0s'
  });
  
  const [status, setStatus] = useState({
      jenkins: 'Checking...',
      decisionEngine: 'Online',
      aiAnalysis: 'Ready',
      jenkinsStatus: 'Unknown'
  });

  const [insight, setInsight] = useState(null);
  const [activities, setActivities] = useState([]);
  const [projects, setProjects] = useState({});

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [statsData, statusData, insightData, historyData, projectsData] = await Promise.all([
                getDashboardStats(),
                getSystemStatus(),
                getAIInsights(),
                getHistory(),
                getProjects()
            ]);
            setStats(statsData);
            setStatus(statusData);
            setInsight(insightData);
            setActivities(historyData);
            
            // Create project map
            const projMap = {};
            projectsData.forEach(p => projMap[p.id] = p.name);
            setProjects(projMap);
        } catch (error) {
            console.error("Dashboard fetch failed:", error);
        }
    };

    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Control Plane</h2>
      </div>

      <ActionPanel />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Builds" value={stats.totalBuilds.toString()} icon={CheckCircle} color="blue" trend={null} />
        <StatCard title="Success Rate" value={stats.successRate} icon={CheckCircle} color="green" trend={null} />
        <StatCard title="Failed Builds" value={stats.failedBuilds.toString()} icon={XCircle} color="red" trend={null} />
        <StatCard title="Avg Duration" value={stats.avgDuration} icon={Clock} color="yellow" trend={null} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity activities={activities} projects={projects} />
        </div>
        <div className="bg-surface rounded-xl border border-slate-700 p-6">
          <h3 className="font-semibold text-lg mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${status.jenkins === 'Connected' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-sm">Jenkins Master</span>
              </div>
              <span className={`text-xs ${status.jenkins === 'Connected' ? 'text-green-400' : 'text-yellow-400'}`}>{status.jenkinsStatus || status.jenkins}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">Decision Engine</span>
              </div>
              <span className="text-xs text-green-400">{status.decisionEngine}</span>
            </div>
             <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm">AI Analysis</span>
              </div>
              <span className="text-xs text-green-400">{status.aiAnalysis}</span>
            </div>
          </div>
          
          {insight && (
          <div className="mt-8 p-4 bg-slate-800 rounded-lg">
             <div className="flex items-start space-x-3">
               <AlertTriangle className={`${insight.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'} shrink-0`} size={20} />
               <div>
                  <p className={`text-xs font-bold ${insight.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'} mb-1`}>{insight.title}</p>
                  <p className="text-xs text-gray-400">
                    {insight.message}
                  </p>
               </div>
             </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
