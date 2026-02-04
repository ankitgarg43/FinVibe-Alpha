import React from 'react';
import { ViewMode, BackgroundType } from '../types';

interface HeaderProps {
  marketVibe: string;
  onOpenSettings: () => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ marketVibe, onOpenSettings, viewMode, onToggleViewMode }) => {
  return (
    <header className="mb-8 pt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Branding */}
        <div>
          <h1 className="text-4xl font-light tracking-tight text-white mb-1">
            Zen<span className="font-semibold text-zen-green">Fi</span>
          </h1>
          <p className="text-sm text-gray-500 font-light tracking-wide">
            MINIMALIST MARKET TRACKER
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-4">
            {/* View Mode Switcher */}
            <div className="flex bg-zen-card rounded-lg p-1 border border-white/5">
                <button
                    onClick={onToggleViewMode}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'SIMPLE' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    SIMPLE
                </button>
                <button
                    onClick={onToggleViewMode}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'ADVANCED' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    ADVANCED
                </button>
            </div>

            {/* Vibe / Settings */}
            <div className="flex items-center gap-3">
                <div className="hidden md:block px-4 py-2 bg-white/5 rounded-full border border-white/5">
                    <span className="text-xs text-gray-400">
                        {marketVibe}
                    </span>
                </div>
                
                <button 
                    onClick={onOpenSettings}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-gray-400 hover:text-white"
                >
                    <span className="text-lg">⚙️</span>
                </button>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;