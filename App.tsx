import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import TickerCard from './components/TickerCard';
import SearchBar from './components/SearchBar';
import SettingsModal from './components/SettingsModal';
import BackgroundController from './components/BackgroundController';
import { AssetData, AssetType, FilterType, AlertSettings, ViewMode, BackgroundType } from './types';
import { fetchAssetData, getMarketVibe } from './services/geminiService';
import { playTrendAlert, playUiSound } from './services/audioService';

const DEFAULT_ASSETS = ['BTC', 'SPY', 'USD/CAD', 'Mortgage Rates US'];

const DEFAULT_SETTINGS: AlertSettings = {
  [AssetType.CRYPTO]: 5.0,
  [AssetType.STOCK]: 2.0,
  [AssetType.FOREX]: 0.5,
  [AssetType.COMMODITY]: 1.5,
  [AssetType.MORTGAGE]: 0.2
};

const App: React.FC = () => {
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [marketVibe, setMarketVibe] = useState<string>("Harmonizing...");
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [globalLoading, setGlobalLoading] = useState(false);
  
  // New States
  const [viewMode, setViewMode] = useState<ViewMode>('SIMPLE');
  const [background, setBackground] = useState<BackgroundType>('OCEAN');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(DEFAULT_SETTINGS);
  
  const lastAlertRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const init = async () => {
        getMarketVibe().then(setMarketVibe);
        for (const symbol of DEFAULT_ASSETS) {
           await handleAddAsset(symbol);
        }
    };
    init();
  }, []);

  // Simulation Engine
  useEffect(() => {
    const interval = setInterval(() => {
        setAssets(currentAssets => 
            currentAssets.map(asset => {
                let volatility = 0.001;
                if (asset.type === AssetType.CRYPTO) volatility = 0.003;
                if (asset.type === AssetType.MORTGAGE) volatility = 0.0001;

                const direction = Math.random() > 0.5 ? 1 : -1;
                const trendBias = asset.change24h > 0 ? 0.0005 : -0.0005;
                const change = 1 + ((Math.random() * volatility * direction) + trendBias);
                
                const newPrice = asset.price * change;
                const newSecondaryPrice = asset.secondaryPrice ? asset.secondaryPrice * change : undefined;
                
                const newSparkline = [...asset.sparkline.slice(1), newPrice];
                
                // Update OHLC (Advanced Mode Data)
                // We fake the last candle updating live
                const newOhlc = [...asset.ohlcData];
                const lastCandle = newOhlc[newOhlc.length - 1];
                lastCandle.close = newPrice;
                lastCandle.high = Math.max(lastCandle.high, newPrice);
                lastCandle.low = Math.min(lastCandle.low, newPrice);
                
                const drift = (newPrice - asset.price) / asset.price * 100;
                const newChange24h = asset.change24h + drift;

                let newRates = asset.rates;
                if (asset.type === AssetType.MORTGAGE && asset.rates) {
                    newRates = asset.rates.map(r => ({
                        ...r,
                        value: r.value * (1 + ((Math.random() * 0.0001 * direction)))
                    }));
                }

                const threshold = alertSettings[asset.type];
                const now = Date.now();
                const lastAlert = lastAlertRef.current[asset.symbol] || 0;
                const COOLDOWN = 10000;

                if (Math.abs(newChange24h) >= threshold && (now - lastAlert > COOLDOWN)) {
                    playTrendAlert(newChange24h > 0);
                    lastAlertRef.current[asset.symbol] = now;
                }

                return {
                    ...asset,
                    price: newPrice,
                    secondaryPrice: newSecondaryPrice,
                    change24h: newChange24h,
                    sparkline: newSparkline,
                    ohlcData: newOhlc,
                    rates: newRates
                };
            })
        );
    }, 1000);

    return () => clearInterval(interval);
  }, [alertSettings]);

  const handleAddAsset = async (symbol: string) => {
    if (assets.some(a => a.symbol === symbol.toUpperCase())) return;
    setGlobalLoading(true);
    setLoadingMap(prev => ({ ...prev, [symbol]: true }));
    playUiSound();
    
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

  const filteredAssets = filter === 'ALL' ? assets : assets.filter(a => a.type === filter);

  return (
    <div className="min-h-screen text-gray-200 font-sans p-4 md:p-8 overflow-x-hidden selection:bg-zen-green selection:text-black">
        
        <BackgroundController type={background} />

        <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)}
            settings={alertSettings}
            onSave={setAlertSettings}
            currentBg={background}
            onChangeBg={setBackground}
        />

        <div className="max-w-7xl mx-auto relative z-10">
            <Header 
                marketVibe={marketVibe} 
                onOpenSettings={() => { playUiSound(); setIsSettingsOpen(true); }}
                viewMode={viewMode}
                onToggleViewMode={() => { playUiSound(); setViewMode(prev => prev === 'SIMPLE' ? 'ADVANCED' : 'SIMPLE'); }}
            />

            <SearchBar onAdd={handleAddAsset} isLoading={globalLoading} />

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {(['ALL', 'CRYPTO', 'STOCK', 'FOREX', 'COMMODITY', 'MORTGAGE'] as const).map((f) => {
                    const isActive = filter === f;
                    return (
                        <button
                            key={f}
                            onClick={() => { setFilter(f as FilterType); playUiSound(); }}
                            className={`
                                px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all border
                                ${isActive 
                                    ? 'bg-white text-black border-transparent' 
                                    : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20 hover:text-white'}
                            `}
                        >
                            {f}
                        </button>
                    );
                })}
            </div>

            {/* Grid */}
            <div className={`grid gap-6 ${viewMode === 'ADVANCED' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3 xl:grid-cols-4'}`}>
                {filteredAssets.map(asset => (
                    <TickerCard 
                        key={asset.id} 
                        data={asset} 
                        onRefresh={handleRefresh}
                        loading={!!loadingMap[asset.symbol]}
                        alertThreshold={alertSettings[asset.type]}
                        mode={viewMode}
                    />
                ))}
            </div>

            {filteredAssets.length === 0 && !globalLoading && (
                <div className="text-center py-32 opacity-30 font-light">
                    <p className="text-xl tracking-widest uppercase">Tranquility</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default App;