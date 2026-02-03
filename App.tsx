import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TickerCard from './components/TickerCard';
import SearchBar from './components/SearchBar';
import { AssetData, AssetType, FilterType } from './types';
import { fetchAssetData, getMarketVibe } from './services/geminiService';

// Initial default assets to populate the board
const DEFAULT_ASSETS = ['BTC', 'ETH', 'NVDA', 'USD/CAD'];

const App: React.FC = () => {
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [marketVibe, setMarketVibe] = useState<string>("Loading vibes...");
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(false);

  // Initialize data
  useEffect(() => {
    const init = async () => {
        // Fetch vibe
        getMarketVibe().then(setMarketVibe);

        // Fetch defaults one by one to show progress
        for (const symbol of DEFAULT_ASSETS) {
           await handleAddAsset(symbol);
        }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time Simulation Engine
  useEffect(() => {
    const interval = setInterval(() => {
        setAssets(currentAssets => 
            currentAssets.map(asset => {
                // Simulate "live" movement
                // High volatility for crypto, lower for forex
                const volatility = asset.type === 'CRYPTO' ? 0.003 : 0.001; 
                const direction = Math.random() > 0.5 ? 1 : -1;
                // Add some bias from 24h trend
                const trendBias = asset.change24h > 0 ? 0.0005 : -0.0005;
                const change = 1 + ((Math.random() * volatility * direction) + trendBias);
                
                const newPrice = asset.price * change;
                
                // Update sparkline (Keep last 50 points)
                const newSparkline = [...asset.sparkline.slice(1), newPrice];

                // Recalculate Change 24h roughly based on price movement
                // This makes the percentage dance a bit too
                const drift = (newPrice - asset.price) / asset.price * 100;
                const newChange24h = asset.change24h + drift;

                return {
                    ...asset,
                    price: newPrice,
                    change24h: newChange24h,
                    sparkline: newSparkline
                };
            })
        );
    }, 1000); // 1 Second tick rate

    return () => clearInterval(interval);
  }, []);

  const handleAddAsset = async (symbol: string) => {
    // Avoid duplicates
    if (assets.some(a => a.symbol === symbol.toUpperCase())) return;

    setGlobalLoading(true);
    setLoadingMap(prev => ({ ...prev, [symbol]: true }));
    
    try {
      const data = await fetchAssetData(symbol);
      setAssets(prev => [...prev, data]);
    } catch (error) {
      console.error("Failed to add asset", error);
      alert(`Could not find data for ${symbol}. Try again?`);
    } finally {
      setLoadingMap(prev => ({ ...prev, [symbol]: false }));
      setGlobalLoading(false);
    }
  };

  const handleRefresh = useCallback(async (symbol: string) => {
    setLoadingMap(prev => ({ ...prev, [symbol]: true }));
    try {
      const data = await fetchAssetData(symbol);
      setAssets(prev => prev.map(a => a.symbol === symbol ? data : a));
    } catch (error) {
      console.error("Failed to refresh", error);
    } finally {
      setLoadingMap(prev => ({ ...prev, [symbol]: false }));
    }
  }, []);

  const filteredAssets = filter === 'ALL' 
    ? assets 
    : assets.filter(a => a.type === filter);

  return (
    <div className="min-h-screen bg-void text-white font-sans p-4 md:p-8 overflow-x-hidden selection:bg-neon-pink selection:text-white">
        
        <div className="max-w-7xl mx-auto">
            <Header marketVibe={marketVibe} />

            <SearchBar onAdd={handleAddAsset} isLoading={globalLoading} />

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {(['ALL', 'CRYPTO', 'STOCK', 'FOREX', 'COMMODITY'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as FilterType)}
                        className={`
                            px-4 py-2 rounded-full font-mono text-sm font-bold border-2 transition-all
                            ${filter === f 
                                ? 'bg-white text-black border-white shadow-[4px_4px_0px_0px_rgba(57,255,20,1)]' 
                                : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}
                        `}
                    >
                        {f === 'ALL' ? '🔥 ALL' : f}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAssets.map(asset => (
                    <TickerCard 
                        key={asset.id} 
                        data={asset} 
                        onRefresh={handleRefresh}
                        loading={!!loadingMap[asset.symbol]}
                    />
                ))}
            </div>

            {filteredAssets.length === 0 && !globalLoading && (
                <div className="text-center py-20 opacity-50 font-mono">
                    <p className="text-2xl">NO ASSETS FOUND</p>
                    <p>Start searching to build your dashboard.</p>
                </div>
            )}
        </div>
        
        {/* Decorative elements */}
        <div className="fixed top-20 left-10 w-64 h-64 bg-neon-purple rounded-full blur-[100px] opacity-10 pointer-events-none -z-10"></div>
        <div className="fixed bottom-20 right-10 w-96 h-96 bg-neon-blue rounded-full blur-[120px] opacity-10 pointer-events-none -z-10"></div>
    </div>
  );
};

export default App;