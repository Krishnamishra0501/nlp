import React from 'react';
import { NavLink } from 'react-router-dom';
import { Upload, Layers, AlertTriangle, FileCheck } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { label: 'Upload Contract', path: '/upload', icon: Upload },
    { label: 'Domain Detection', path: '/domain-detection', icon: Layers },
    { label: 'Risk Analysis', path: '/analysis', icon: AlertTriangle },
    { label: 'Reports', path: '/reports', icon: FileCheck },
  ];

  return (
    <aside className="w-64 bg-pastel-lilac border-r border-pastel-indigo-dark/10 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] shadow-sm">
      <div className="p-4">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl text-xs transition-all duration-150 ${
                    isActive
                      ? 'bg-pastel-indigo text-pastel-indigo-dark font-extrabold shadow-md shadow-pastel-indigo/30'
                      : 'text-slate-700 font-bold hover:bg-white/60 hover:text-pastel-indigo-dark'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-pastel-indigo-dark" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-pastel-indigo-dark/10 text-[11px] text-slate-600 flex flex-col space-y-1">
        <div className="flex items-center justify-between">
          <span>Engine Version</span>
          <span className="text-slate-800 font-bold">v1.0.0</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Model Engine</span>
          <span className="text-slate-800 font-semibold">RoBERTa / DeBERTa</span>
        </div>
      </div>
    </aside>
  );
};
