import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  Settings,
  MonitorCog,
  X,
} from "lucide-react";
import { getConfig } from "../services/api";

const Sidebar = ({ isOpen, onClose }) => {
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
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        flex flex-col w-64 h-screen border-r bg-surface border-slate-700
        fixed inset-y-0 left-0 z-50 transition-transform duration-300 transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                CiGenie
            </h1>
            <p className="mt-1 text-sm text-gray-400">Platform Management</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-4 px-4 py-4 rounded-xl transition-all ${
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-gray-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <LayoutDashboard size={22} />
            <span className="font-medium">Dashboard</span>
          </NavLink>

          <NavLink
            to="/control"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-4 px-4 py-4 rounded-xl transition-all ${
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-gray-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <MonitorCog  size={22} />
            <span className="font-medium">Control Panel</span>
          </NavLink>
          <NavLink
            to="/projects"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-4 px-4 py-4 rounded-xl transition-all ${
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-gray-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <List size={22} />
            <span className="font-medium">Execution History</span>
          </NavLink>

          <div className="pt-6 mt-6 border-t border-slate-700/50">
            <p className="px-4 mb-3 text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">
              Application Settings
            </p>
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center space-x-4 px-4 py-4 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-gray-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <Settings size={22} />
              <span className="font-medium">Configuration</span>
            </NavLink>
          </div>
        </nav>

        <div className="p-6 border-t border-slate-700/50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white rounded-full bg-gradient-to-tr from-primary to-cyan-500 shadow-md">
              {getInitials(username)}
            </div>
            <div className="overflow-hidden">
              <p className="text-base font-semibold truncate leading-tight">{username}</p>
              <p className="text-xs text-green-400 font-medium tracking-wide">Connected</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
