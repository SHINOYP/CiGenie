import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-surface p-6 rounded-xl border border-slate-700">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">{title}</p>
        <h3 className="text-3xl font-bold mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg bg-${color}-500/10 text-${color}-500`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-xs">
      <span className={trend > 0 ? 'text-green-400' : 'text-red-400'}>
        {trend > 0 ? '+' : ''}{trend}%
      </span>
      <span className="text-gray-500 ml-2">from last week</span>
    </div>
  </div>
);

export default StatCard;
