'use client';

import React from 'react';
import { Home, Search, Plus, Play, User } from 'lucide-react';

interface BottomNavigationProps {
  currentView: 'home' | 'reels';
  onNavigate: (view: 'home' | 'reels') => void;
  onShowUpload: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  currentView, 
  onNavigate, 
  onShowUpload 
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around px-4 py-1 max-w-lg mx-auto">
        {/* Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center p-2 transition-colors ${
            currentView === 'home' 
              ? 'text-black' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Home className={`w-6 h-6 ${currentView === 'home' ? 'fill-current' : ''}`} />
          <span className="text-xs mt-1">Home</span>
        </button>

        {/* Search */}
        <button
          className="flex flex-col items-center justify-center p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Search className="w-6 h-6" />
          <span className="text-xs mt-1">Search</span>
        </button>

        {/* Create (Center button with special styling) */}
        <button
          onClick={onShowUpload}
          className="flex flex-col items-center justify-center p-2 transition-transform hover:scale-105"
        >
          <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 text-white w-12 h-8 rounded-lg flex items-center justify-center">
            <Plus className="w-6 h-6" />
          </div>
        </button>

        {/* Reels */}
        <button
          onClick={() => onNavigate('reels')}
          className={`flex flex-col items-center justify-center p-2 transition-colors ${
            currentView === 'reels' 
              ? 'text-black' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Play className={`w-6 h-6 ${currentView === 'reels' ? 'fill-current' : ''}`} />
          <span className="text-xs mt-1">Reels</span>
        </button>

        {/* Profile */}
        <button
          className="flex flex-col items-center justify-center p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
