import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-surface p-8 rounded-2xl border border-slate-700 shadow-lg">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-sm uppercase tracking-[0.2em] font-bold">{title}</p>
        <h3 className="text-3xl sm:text-4xl font-black mt-3 text-white tracking-tight">{value}</h3>
      </div>
      <div className={`p-4 rounded-xl bg-${color}-500/10 text-${color}-500 shadow-inner`}>
        <Icon size={28} />
      </div>
    </div>
    {trend !== null && (
      <div className="mt-6 flex items-center text-sm">
        <span className={`font-bold px-2 py-0.5 rounded ${trend > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
        <span className="text-gray-500 ml-3 font-medium">vs last month</span>
      </div>
    )}
  </div>
);

export default StatCard;
