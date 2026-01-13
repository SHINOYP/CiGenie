import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, List, Settings, BarChart } from 'lucide-react';

const Sidebar = () => {
  return (
    <div className="w-64 h-screen bg-surface border-r border-slate-700 flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
          AI CI/CD
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
          to="/builds" 
          className={({ isActive }) => 
            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <List size={20} />
          <span>Builds</span>
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
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-xs">
            JD
          </div>
          <div>
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-green-400">Online</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
