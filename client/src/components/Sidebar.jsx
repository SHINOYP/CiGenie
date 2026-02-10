import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, List, Settings, BarChart } from 'lucide-react';
import { getConfig } from '../services/api';

const Sidebar = () => {
  const [username, setUsername] = useState('User');

  useEffect(() => {
    getConfig().then(data => {
      if (data && data.githubUsername) {
        setUsername(data.githubUsername);
      }
    }).catch(err => console.error('Sidebar config fetch failed:', err));
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-64 h-screen bg-surface border-r border-slate-700 flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 tracking-tight">
          CiGenie
        </h1>
        <p className="text-xs text-gray-400 mt-1">Platform Orchestrator</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/projects" 
          className={({ isActive }) => 
            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <List size={20} />
          <span>Projects</span>
        </NavLink>

        <div className="pt-4 mt-4 border-t border-slate-700">
          <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Settings
          </p>
          <NavLink 
            to="/settings" 
            className={({ isActive }) => 
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Settings size={20} />
            <span>Configuration</span>
          </NavLink>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center font-bold text-xs text-white">
            {getInitials(username)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{username}</p>
            <p className="text-xs text-green-400">Online</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
