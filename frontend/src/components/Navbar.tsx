import React from 'react';
import { User, LogOut, RefreshCw, Activity } from 'lucide-react';

interface NavbarProps {
  userInfo: {
    first_name: string;
    last_name: string;
    role?: string;
  } | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onLogout: () => void;
  isAutoRefreshing?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ userInfo, onRefresh, isRefreshing, onLogout, isAutoRefreshing = false }) => (
  <header className="bg-white/90 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shadow-sm">
    <div className="container mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              License Management System
            </h1>
            <p className="text-sm text-gray-500">Automate Management System</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Auto-sync indicator */}
          {isAutoRefreshing && (
            <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Auto-sync</span>
            </div>
          )}
          
          <div className="hidden md:flex items-center space-x-3 bg-white/80 rounded-full px-4 py-2 border border-white/30 shadow-sm">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-right">
              <span className="text-gray-700 font-medium block">
                {userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : 'User'}
              </span>
              <span className="text-xs text-gray-500 capitalize">{userInfo?.role}</span>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-full bg-white/80 hover:bg-white border border-white/30 transition-all duration-200 hover:scale-105 shadow-sm"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  </header>
);

export default Navbar; 