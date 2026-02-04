import React from 'react';

interface HeaderProps {
  marketVibe: string;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ marketVibe, onOpenSettings }) => {
  return (
    <header className="mb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-neon-green via-white to-neon-pink animate-pulse">
            FINVIBE
          </h1>
          <p className="text-xl md:text-2xl font-mono text-gray-400">
            NO CAP MARKET TRACKER
          </p>
        </div>
        
        <div className="flex flex-col gap-2 items-end">
            <button 
                onClick={onOpenSettings}
                className="group flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-neon-blue rounded-full transition-all hover:bg-white/10"
            >
                <span className="text-neon-blue">⚙️</span>
                <span className="font-mono text-sm font-bold text-gray-300 group-hover:text-white">ALERTS CONFIG</span>
            </button>

            <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-4 rounded-xl max-w-md w-full">
                <span className="text-xs font-bold text-neon-blue uppercase tracking-widest mb-1 block">
                    ✨ GLOBAL MARKET MOOD
                </span>
                <p className="text-lg font-medium leading-snug">
                    {marketVibe}
                </p>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;