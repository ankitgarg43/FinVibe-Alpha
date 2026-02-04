import React from 'react';
import { AssetData, AssetType } from '../types';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

interface TickerCardProps {
  data: AssetData;
  onRefresh: (id: string) => void;
  loading: boolean;
  alertThreshold: number;
}

const TickerCard: React.FC<TickerCardProps> = ({ data, onRefresh, loading, alertThreshold }) => {
  const isPositive = data.change24h >= 0;
  // For mortgages, positive change (higher rates) is usually "bad" for borrowers, 
  // but strictly mathematically we keep the logic consistent or invert color context if desired. 
  // Sticking to standard financial signaling: Green = Number goes up.
  
  const isHighVolatility = Math.abs(data.change24h) >= alertThreshold;
  const isMortgage = data.type === AssetType.MORTGAGE;
  
  const chartData = data.sparkline.map((val, i) => ({ i, val }));
  const color = isPositive ? '#39ff14' : '#ff00ff';
  const gradientId = `colorGradient-${data.id}`;

  return (
    <div className={`
      relative overflow-hidden group
      bg-glass backdrop-blur-md border-2 
      ${isHighVolatility 
          ? (isPositive ? 'border-neon-green shadow-[0_0_20px_rgba(57,255,20,0.4)]' : 'border-neon-pink shadow-[0_0_20px_rgba(255,0,255,0.4)]')
          : (isPositive ? 'border-neon-green/30 hover:border-neon-green' : 'border-neon-pink/30 hover:border-neon-pink')
      }
      rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-neo flex flex-col h-[280px]
    `}>
      {/* Background decoration */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[60px] opacity-20 ${isPositive ? 'bg-neon-green' : 'bg-neon-pink'}`}></div>

      <div className="relative z-10 flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xl md:text-2xl font-bold font-mono tracking-tighter truncate" title={data.name}>{isMortgage ? data.name.replace('Mortgage Rates', '').trim() : data.symbol}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-black ${isPositive ? 'bg-neon-green' : 'bg-neon-pink'}`}>
              {data.type}
            </span>
          </div>
          <p className="text-gray-400 text-xs truncate max-w-[150px]">
              {isMortgage 
                ? (data.symbol.includes('VARIABLE') ? 'Avg Variable Rate' : 'Avg 30Y Fixed') 
                : data.name}
          </p>
        </div>
        
        {!isMortgage && (
            <div className="text-right ml-2">
                <div className="flex items-center justify-end gap-2">
                    <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPositive ? 'bg-neon-green' : 'bg-neon-pink'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isPositive ? 'bg-neon-green' : 'bg-neon-pink'}`}></span>
                    </span>
                    <span className="text-[10px] font-bold tracking-wider text-gray-500">LIVE</span>
                </div>
                <div className="text-2xl font-bold font-sans">
                    {data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-xs text-gray-500 ml-1">{data.currency}</span>
                </div>
                <div className={`text-xs font-mono font-bold flex items-center justify-end gap-1 ${isPositive ? 'text-neon-green' : 'text-neon-pink'}`}>
                    {isHighVolatility && (
                        <span className="flex items-center justify-center w-4 h-4 bg-white/10 rounded-full animate-pulse mr-1" title="High Volatility Alert">
                            ⚡
                        </span>
                    )}
                    {isPositive ? '▲' : '▼'} {Math.abs(data.change24h).toFixed(2)}%
                </div>
            </div>
        )}
      </div>

      {/* Content Area: Chart for standard assets, Table for Mortgage */}
      <div className="flex-grow w-full relative">
        {isMortgage && data.rates ? (
            <div className="h-full w-full overflow-y-auto scrollbar-hide mt-2">
                <table className="w-full text-sm font-mono">
                    <thead>
                        <tr className="text-gray-500 border-b border-white/10">
                            <th className="text-left py-1">TERM</th>
                            <th className="text-right py-1">RATE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.rates.map((rate, idx) => (
                            <tr key={idx} className="group/row hover:bg-white/5 transition-colors">
                                <td className="py-2 text-gray-300 group-hover/row:text-white font-bold">{rate.name}</td>
                                <td className={`py-2 text-right font-bold ${isPositive ? 'text-neon-green' : 'text-neon-pink'}`}>
                                    {rate.value.toFixed(2)}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            <div className="w-full h-full -ml-2">
                <ResponsiveContainer width="105%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <YAxis domain={['dataMin', 'dataMax']} hide={true} />
                    <Area 
                    type="monotone" 
                    dataKey="val" 
                    stroke={color} 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill={`url(#${gradientId})`} 
                    isAnimationActive={false}
                    />
                </AreaChart>
                </ResponsiveContainer>
            </div>
        )}
      </div>

      {/* Vibe Check & Footer */}
      <div className="flex justify-between items-end mt-2">
        <div className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">VIBE CHECK</span>
            <p className="text-sm italic text-white/90 truncate max-w-[200px]">"{data.vibe}"</p>
        </div>
        
        <button 
            onClick={(e) => { e.stopPropagation(); onRefresh(data.symbol); }}
            disabled={loading}
            className={`
                p-2 rounded-xl transition-colors
                ${loading ? 'animate-spin bg-gray-800' : 'bg-white/10 hover:bg-white/20'}
            `}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6"></path>
                <path d="M2.5 22v-6h6"></path>
                <path d="M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8"></path>
                <path d="M22 12.5a10 10 0 0 1-18.8 4.3L2.5 16"></path>
            </svg>
        </button>
      </div>
    </div>
  );
};

export default TickerCard;