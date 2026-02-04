import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import TickerCard from './components/TickerCard';
import SearchBar from './components/SearchBar';
import SettingsModal from './components/SettingsModal';
import { AssetData, AssetType, FilterType, AlertSettings } from './types';
import { fetchAssetData, getMarketVibe } from './services/geminiService';
import { playTrendAlert, playUiSound } from './services/audioService';

// Initial default assets to populate the board
const DEFAULT_ASSETS = ['BTC', 'ETH', 'NVDA', 'USD/CAD', 'Mortgage Rates US', 'Mortgage Rates Canada', 'Variable Mortgage Rates'];

// Default alert thresholds (%)
const DEFAULT_SETTINGS: AlertSettings = {
  [AssetType.CRYPTO]: 5.0,
  [AssetType.STOCK]: 2.0,
  [AssetType.FOREX]: 0.5,
  [AssetType.COMMODITY]: 1.5,
  [AssetType.MORTGAGE]: 0.2 // Very sensitive for interest rates
};

const App: React.FC = () => {
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [marketVibe, setMarketVibe] = useState<string>("Loading vibes...");
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(false);
  
  // Alert State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(DEFAULT_SETTINGS);
  
  // Track last alert times to prevent spamming sounds (Map<Symbol, Timestamp>)
  const lastAlertRef = useRef<Record<string, number>>({});

  // Initialize data
  useEffect(() => {
    const init = async () => {
        getMarketVibe().then(setMarketVibe);
        for (const symbol of DEFAULT_ASSETS) {
           await handleAddAsset(symbol);
        }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time Simulation Engine & Alert Logic
  useEffect(() => {
    const interval = setInterval(() => {
        setAssets(currentAssets => 
            currentAssets.map(asset => {
                // Determine volatility based on type
                let volatility = 0.001;
                if (asset.type === AssetType.CRYPTO) volatility = 0.003;
                if (asset.type === AssetType.MORTGAGE) volatility = 0.0001; // Rates don't move much in seconds

                const direction = Math.random() > 0.5 ? 1 : -1;
                const trendBias = asset.change24h > 0 ? 0.0005 : -0.0005;
                const change = 1 + ((Math.random() * volatility * direction) + trendBias);
                
                const newPrice = asset.price * change;
                const newSparkline = [...asset.sparkline.slice(1), newPrice];
                const drift = (newPrice - asset.price) / asset.price * 100;
                const newChange24h = asset.change24h + drift;

                // Handle Mortgage sub-rates update
                let newRates = asset.rates;
                if (asset.type === AssetType.MORTGAGE && asset.rates) {
                    newRates = asset.rates.map(r => ({
                        ...r,
                        value: r.value * (1 + ((Math.random() * 0.0001 * direction)))
                    }));
                }

                // --- Sound Alert Logic ---
                const threshold = alertSettings[asset.type];
                const now = Date.now();
                const lastAlert = lastAlertRef.current[asset.symbol] || 0;
                const COOLDOWN = 10000; // 10 seconds cooldown per asset

                // Check if absolute change exceeds threshold AND cooldown passed
                if (Math.abs(newChange24h) >= threshold && (now - lastAlert > COOLDOWN)) {
                    playTrendAlert(newChange24h > 0);
                    lastAlertRef.current[asset.symbol] = now;
                }
                // -------------------------

                return {
                    ...asset,
                    price: newPrice,
                    change24h: newChange24h,
                    sparkline: newSparkline,
                    rates: newRates
                };
            })
        );
    }, 1000); // 1 Second tick rate

    return () => clearInterval(interval);
  }, [alertSettings]); // Re-create interval if settings change to capture new values

  const handleAddAsset = async (symbol: string) => {
    if (assets.some(a => a.symbol === symbol.toUpperCase())) return;

    setGlobalLoading(true);
    setLoadingMap(prev => ({ ...prev, [symbol]: true }));
    playUiSound(); // Feedback
    
    try {
      const data = await fetchAssetData(symbol);
      setAssets(prev => [...prev, data]);
    } catch (error) {
      console.error("Failed to add asset", error);
    } finally {
      setLoadingMap(prev => ({ ...prev, [symbol]: false }));
      setGlobalLoading(false);
    }
  };

  const handleRefresh = useCallback(async (symbol: string) => {
    setLoadingMap(prev => ({ ...prev, [symbol]: true }));
    playUiSound();
    try {
      const data = await fetchAssetData(symbol);
      setAssets(prev => prev.map(a => a.symbol === symbol ? data : a));
    } catch (error) {
      console.error("Failed to refresh", error);
    } finally {
      setLoadingMap(prev => ({ ...prev, [symbol]: false }));
    }
  }, []);

  const handleOpenSettings = () => {
    playUiSound();
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = (newSettings: AlertSettings) => {
      setAlertSettings(newSettings);
      playUiSound();
  };

  const filteredAssets = filter === 'ALL' 
    ? assets 
    : assets.filter(a => a.type === filter);

  return (
    <div className="min-h-screen bg-void text-white font-sans p-4 md:p-8 overflow-x-hidden selection:bg-neon-pink selection:text-white">
        
        <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)}
            settings={alertSettings}
            onSave={handleSaveSettings}
        />

        <div className="max-w-7xl mx-auto">
            <Header marketVibe={marketVibe} onOpenSettings={handleOpenSettings} />

            <SearchBar onAdd={handleAddAsset} isLoading={globalLoading} />

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-10 justify-center items-center">
                {(['ALL', 'CRYPTO', 'STOCK', 'FOREX', 'COMMODITY', 'MORTGAGE'] as const).map((f) => {
                    const isActive = filter === f;
                    return (
                        <div key={f} className="relative group">
                            {/* Glow effect matching search bar style */}
                            <div className={`absolute -inset-0.5 bg-gradient-to-r from-neon-green to-neon-pink rounded-xl blur opacity-50 transition duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>
                            
                            <button
                                onClick={() => { setFilter(f as FilterType); playUiSound(); }}
                                className={`
                                    relative px-6 py-2 rounded-xl font-mono text-sm font-bold border transition-all duration-200
                                    ${isActive 
                                        ? 'bg-black text-white border-transparent' 
                                        : 'bg-black text-gray-500 border-white/10 hover:text-white'}
                                `}
                            >
                                <span className="flex items-center gap-2">
                                    {f === 'ALL' && <span className="text-lg">🔥</span>}
                                    {f === 'MORTGAGE' && <span className="text-lg">🏠</span>}
                                    {f}
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAssets.map(asset => (
                    <TickerCard 
                        key={asset.id} 
                        data={asset} 
                        onRefresh={handleRefresh}
                        loading={!!loadingMap[asset.symbol]}
                        alertThreshold={alertSettings[asset.type]}
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