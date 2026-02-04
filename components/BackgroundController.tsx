import React from 'react';
import { BackgroundType } from '../types';

interface Props {
  type: BackgroundType;
}

const BackgroundController: React.FC<Props> = ({ type }) => {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none transition-opacity duration-1000">
      
      {/* BASE GRADIENT (Always present but changing) */}
      <div className={`absolute inset-0 transition-colors duration-1000 
        ${type === 'VOID' ? 'bg-[#0f1115]' : ''}
        ${type === 'OCEAN' ? 'bg-gradient-to-b from-[#0f172a] to-[#1e293b]' : ''}
        ${type === 'CLOUDS' ? 'bg-gradient-to-br from-[#1e293b] to-[#334155]' : ''}
        ${type === 'AURORA' ? 'bg-[#0f1115]' : ''}
        ${type === 'PARTICLES' ? 'bg-[#111111]' : ''}
      `}></div>

      {/* WAVE LAYER */}
      {type === 'OCEAN' && (
        <>
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-blue-900/20 to-transparent animate-pulse"></div>
            <div className="absolute top-1/4 -left-1/4 w-[150%] h-[200px] bg-blue-500/5 rounded-[100%] blur-3xl animate-[drift_20s_linear_infinite]"></div>
            <div className="absolute bottom-0 w-full h-64 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        </>
      )}

      {/* CLOUDS LAYER */}
      {type === 'CLOUDS' && (
        <>
           <div className="absolute top-20 left-10 w-96 h-96 bg-gray-500/10 rounded-full blur-[100px] animate-[float_15s_ease-in-out_infinite]"></div>
           <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-slate-600/10 rounded-full blur-[120px] animate-[float_20s_ease-in-out_infinite_reverse]"></div>
        </>
      )}

      {/* AURORA LAYER */}
      {type === 'AURORA' && (
        <>
           <div className="absolute -top-1/2 left-0 w-full h-full bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-blue-500/10 blur-[100px] opacity-50 animate-[pulse_10s_ease-in-out_infinite]"></div>
           <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-gradient-to-bl from-zen-green/5 to-transparent blur-3xl transform rotate-12"></div>
        </>
      )}
      
      {/* PARTICLES / STARS */}
      {type === 'PARTICLES' && (
        <div className="absolute inset-0">
            {Array.from({ length: 20 }).map((_, i) => (
                <div 
                    key={i}
                    className="absolute bg-white/20 rounded-full"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        width: `${Math.random() * 4}px`,
                        height: `${Math.random() * 4}px`,
                        animation: `pulse ${2 + Math.random() * 5}s infinite`
                    }}
                ></div>
            ))}
        </div>
      )}

    </div>
  );
};

export default BackgroundController;