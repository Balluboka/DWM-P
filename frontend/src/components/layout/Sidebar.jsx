import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Database, Workflow, BarChart3, Boxes, LineChart,
  Film, Star, Tag, Settings, Compass, Sparkles, User, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAdmin, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const adminItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Dataset', path: '/admin/dataset', icon: Database },
    { name: 'ETL & Preprocessing', path: '/admin/etl', icon: Workflow },
    { name: 'OLAP Analytics', path: '/admin/olap', icon: BarChart3 },
    { name: 'Clustering', path: '/admin/clustering', icon: Boxes },
    { name: 'Visualization', path: '/admin/visualization', icon: LineChart },
    { name: 'Movies', path: '/admin/movies', icon: Film },
    { name: 'Ratings', path: '/admin/ratings', icon: Star },
    { name: 'Tags', path: '/admin/tags', icon: Tag },
    { name: 'System Info', path: '/admin/system', icon: Settings },
  ];

  const userItems = [
    { name: 'Dashboard', path: '/user', icon: LayoutDashboard },
    { name: 'Discover', path: '/user/discover', icon: Compass },
    { name: 'Recommendations', path: '/user/recommendations', icon: Sparkles },
    { name: 'My Ratings', path: '/user/my-ratings', icon: Star },
    { name: 'Profile', path: '/user/profile', icon: User },
  ];

  const navItems = isAdmin ? adminItems : userItems;

  return (
    <div className={`flex flex-col h-screen bg-white border-r border-surface-200 transition-all duration-300 select-none shadow-sm relative ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-surface-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            <span className="font-extrabold text-lg text-surface-900 tracking-tight">MovieDWM</span>
          </div>
        )}
        {collapsed && <span className="text-2xl mx-auto">🎬</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-surface-500 hover:text-surface-800 absolute -right-3.5 top-5 bg-white rounded-full p-1.5 border border-surface-200 shadow-md hover:bg-surface-50 transition-colors z-20"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1.5 px-3">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/admin' || item.path === '/user'}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium
                  ${isActive
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/30'
                    : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                  }
                  ${collapsed ? 'justify-center px-0' : ''}
                `}
                title={collapsed ? item.name : ''}
              >
                <item.icon size={19} className="shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-surface-200 bg-surface-50">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-1'}`}>
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 border border-primary-200 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-surface-900 truncate">{user?.username}</p>
              <p className="text-xs text-surface-500 font-medium truncate capitalize">{user?.role || 'User'}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={logout}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-red-50 text-surface-700 hover:text-red-600 border border-surface-200 hover:border-red-200 rounded-lg transition-colors text-xs font-semibold shadow-sm"
          >
            <LogOut size={14} /> Sign Out
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
