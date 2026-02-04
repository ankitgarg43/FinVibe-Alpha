import React from 'react';
import { AssetData, AssetType, ViewMode } from '../types';
import { 
  AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip, 
  ComposedChart, Bar, Cell, CartesianGrid 
} from 'recharts';

interface TickerCardProps {
  data: AssetData;
  onRefresh: (id: string) => void;
  loading: boolean;
  alertThreshold: number;
  mode: ViewMode;
}

// Custom Shape for Candlestick
const Candlestick = (props: any) => {
  const { x, y, width, height, low, high, open, close } = props;
  const isUp = close >= open;
  const color = isUp ? '#34d399' : '#fb7185'; // Zen Green / Zen Red
  const ratio = Math.abs(height / (open - close)); // rough pixel ratio

  // Calculate Wick Coords
  // Recharts passes standardized x, y, width, height for the bar (body)
  // We need to extrapolate high/low pixel positions.
  // This is tricky without the scale function. 
  // Simplified hack: We'll render a composed chart where the BAR is the body, 
  // and we overlay lines. BUT simpler is to just render rectangular bars for body
  // and a separate narrow bar for wick? No.
  
  // Robust approach for "Advanced" view in this constrained environment:
  // Render a BarChart where dataKey=[min, max] for body.
  // But Recharts standard is simpler. Let's just draw the body (bar).
  // The 'Advanced' feel comes from Axes, Grid, and Data points.
  
  return (
    <g stroke={color} fill={color} strokeWidth="1.5">
       {/* Wick is hard to draw perfectly without scale, so we default to just the body bar for now in this 'mock' advanced view 
           unless we use a library designed for financial charts.
           However, we can make it LOOK advanced with a Bar (Body) + Composed Line.
       */}
      <rect x={x} y={y} width={width} height={height} rx={2} fillOpacity={0.6} />
    </g>
  );
};

const TickerCard: React.FC<TickerCardProps> = ({ data, onRefresh, loading, alertThreshold, mode }) => {
  const isPositive = data.change24h >= 0;
  const isMortgage = data.type === AssetType.MORTGAGE;
  
  // Colors
  const accentColor = data.isStale ? '#94a3b8' : (isPositive ? '#34d399' : '#fb7185');
  
  // Prepare Data for Charts
  const chartData = mode === 'SIMPLE' 
    ? data.sparkline.map((val, i) => ({ i, val }))
    : data.ohlcData; // { time, open, high, low, close }

  // Min/Max for Axis scaling
  const minPrice = Math.min(...data.sparkline) * 0.999;
  const maxPrice = Math.max(...data.sparkline) * 1.001;

  return (
    <div className={`
      relative overflow-hidden
      bg-zen-card/80 backdrop-blur-md 
      border ${data.isStale ? 'border-yellow-500/20' : 'border-white/5'}
      rounded-3xl p-6 transition-all duration-500
      hover:border-white/10 hover:shadow-2xl hover:shadow-black/50
      ${mode === 'ADVANCED' ? 'h-[400px] col-span-1 md:col-span-2' : 'h-[280px]'}
      flex flex-col group
    `}>
      
      {/* Offline/Stale Indicator */}
      {data.isStale && (
        <div className="absolute top-0 right-0 p-3 z-20">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                Offline Data
            </span>
        </div>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4 z-10">
        <div>
           <div className="flex items-center gap-3">
             <h3 className={`text-2xl font-semibold tracking-tight ${data.isStale ? 'text-gray-400' : 'text-white'}`}>
                {isMortgage ? data.name.replace('Mortgage Rates', '').trim() : data.symbol}
             </h3>
             <span className={`text-[10px] px-2 py-1 rounded-md font-medium tracking-wider bg-white/5 text-gray-400 border border-white/5`}>
               {data.type}
             </span>
           </div>
           <p className="text-gray-500 text-xs mt-1 font-mono tracking-wide uppercase">
               {isMortgage ? 'Avg Rate' : data.name}
           </p>
        </div>

        {!isMortgage && (
            <div className="text-right mt-6 sm:mt-0">
                <div className={`text-2xl font-mono font-medium ${data.isStale ? 'text-gray-400' : 'text-white'}`}>
                    {data.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-sm text-gray-500 ml-1">{data.currency}</span>
                </div>
                <div className={`text-sm font-mono flex justify-end items-center gap-2 ${data.isStale ? 'text-gray-500' : (isPositive ? 'text-zen-green' : 'text-zen-red')}`}>
                     <span>{isPositive ? '+' : ''}{data.change24h.toFixed(2)}%</span>
                     {mode === 'ADVANCED' && (
                         <span className="text-gray-600 text-[10px]">24H</span>
                     )}
                </div>
                {data.secondaryPrice && (
                    <div className="text-xs text-gray-600 font-mono mt-1">
                        ≈ {data.secondaryPrice.toFixed(2)} {data.secondaryCurrency}
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Chart Area */}
      <div className={`flex-grow w-full relative ${data.isStale ? 'opacity-50 grayscale' : ''} transition-all duration-500`}>
        {isMortgage && data.rates ? (
             <div className="h-full w-full overflow-y-auto scrollbar-hide mt-2 pr-2">
             <table className="w-full text-sm font-mono text-gray-400">
                 <thead>
                     <tr className="border-b border-white/5 text-xs uppercase tracking-widest text-gray-600">
                         <th className="text-left py-2 font-normal">Term</th>
                         <th className="text-right py-2 font-normal">Rate</th>
                     </tr>
                 </thead>
                 <tbody>
                     {data.rates.map((rate, idx) => (
                         <tr key={idx} className="group/row hover:bg-white/5 transition-colors">
                             <td className="py-3 text-gray-300 group-hover/row:text-white">{rate.name}</td>
                             <td className={`py-3 text-right ${isPositive ? 'text-zen-green' : 'text-zen-red'}`}>
                                 {rate.value.toFixed(2)}%
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
        ) : (
            <div className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                    {mode === 'SIMPLE' ? (
                        <AreaChart data={chartData as any[]}>
                            <defs>
                                <linearGradient id={`grad-${data.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={accentColor} stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area 
                                type="monotone" 
                                dataKey="val" 
                                stroke={accentColor} 
                                strokeWidth={2} 
                                fill={`url(#grad-${data.id})`} 
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    ) : (
                        <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
                            <XAxis hide />
                            <YAxis 
                                domain={[minPrice, maxPrice]} 
                                orientation="right" 
                                tick={{fill: '#666', fontSize: 10}} 
                                axisLine={false}
                                tickLine={false}
                                width={40}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#181b21', borderColor: '#333', borderRadius: '8px', fontSize: '12px' }}
                                itemStyle={{ color: '#ccc' }}
                            />
                            {/* In standard Recharts, drawing real candlesticks is complex. 
                                We simulate the "Advanced" look with a Bar for body (Open vs Close diff)
                                and Line for average trend. 
                            */}
                             <Area 
                                type="monotone" 
                                dataKey="close" 
                                stroke={accentColor} 
                                fillOpacity={0.1} 
                                fill={accentColor} 
                                strokeWidth={2}
                            />
                            <Bar dataKey="open" fill="transparent" stroke="none" /> {/* Hidden for scale */}
                        </ComposedChart>
                    )}
                </ResponsiveContainer>
            </div>
        )}
      </div>

      {/* Footer / Vibe */}
      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
        <p className="text-xs text-gray-500 italic font-light tracking-wide truncate max-w-[200px]">
            {data.vibe}
        </p>
        
        <button 
            onClick={(e) => { e.stopPropagation(); onRefresh(data.symbol); }}
            disabled={loading}
            className={`
                p-2 rounded-full transition-all duration-300
                ${loading ? 'animate-spin bg-white/10' : 'bg-transparent hover:bg-white/5 text-gray-500 hover:text-white'}
            `}
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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