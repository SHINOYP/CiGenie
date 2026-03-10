import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  Settings,
  BarChart,
  SlidersHorizontal,
} from "lucide-react";
import { getConfig } from "../services/api";

const Sidebar = () => {
  const [username, setUsername] = useState("User");

  useEffect(() => {
    getConfig()
      .then((data) => {
        if (data && data.githubUsername) {
          setUsername(data.githubUsername);
        }
      })
      .catch((err) => console.error("Sidebar config fetch failed:", err));
  }, []);

  const getInitials = (name) => {
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col w-64 h-screen border-r bg-surface border-slate-700">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
          CiGenie
        </h1>
        <p className="mt-1 text-xs text-gray-400">Platform Orchestrator</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-gray-400 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/control"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-gray-400 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <SlidersHorizontal size={20} />

          <span>Control Panel</span>
        </NavLink>
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-gray-400 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <List size={20} />
          <span>Projects</span>
        </NavLink>

        <div className="pt-4 mt-4 border-t border-slate-700">
          <p className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Settings
          </p>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-400 hover:bg-slate-800 hover:text-white"
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
          <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white rounded-full bg-gradient-to-tr from-primary to-cyan-500">
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
