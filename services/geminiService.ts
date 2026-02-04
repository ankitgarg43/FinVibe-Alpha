import { GoogleGenAI } from "@google/genai";
import { AssetData, AssetType, OHLCData } from "../types";

// Removed global initialization to prevent runtime crash if API_KEY is missing on load.
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = 'gemini-flash-latest';

const CACHE_PREFIX = 'zenfi_asset_';
const VIBE_CACHE_KEY = 'zenfi_market_vibe';

const getCacheKey = (symbol: string) => `${CACHE_PREFIX}${symbol.toUpperCase()}`;

export const fetchAssetData = async (symbol: string): Promise<AssetData> => {
  const cacheKey = getCacheKey(symbol);
  
  const prompt = `
    Find the current live data for ${symbol} using the search tool.
    
    1. Determine Asset Type (CRYPTO, STOCK, FOREX, COMMODITY, MORTGAGE).
    2. Pricing Logic:
       - Standard: Return price in USD (pricePrimary) and CAD (priceSecondary).
       - Forex: Exchange rate.
       - Mortgage: Rate in %.
    3. Vibe Check: Provide a 1-sentence minimalist Zen description (e.g., "Flowing steadily", "Turbulence detected", "Calm waters", "Rising tide").

    RESPONSE FORMAT:
    Return ONLY a valid JSON object. Do not include markdown formatting or explanations.
    
    Required JSON Structure:
    {
      "name": "Full Name",
      "type": "STOCK", 
      "pricePrimary": 123.45,
      "currencyPrimary": "USD",
      "priceSecondary": 160.55,
      "change24h": -5.2,
      "vibe": "...",
      "rates": [{"name": "30Y Fixed", "value": 6.5}]
    }
  `;

  try {
    // Initialize client lazily to handle missing key gracefully via catch block
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType and responseSchema removed because they conflict with tools
      },
    });

    let text = response.text || "";
    
    // Clean up markdown code blocks if the model includes them
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Ensure we only try to parse the JSON object part
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1) {
        text = text.substring(startIndex, endIndex + 1);
    }

    if (!text) throw new Error("No data returned");
    
    const data = JSON.parse(text);

    // Generate advanced data
    const { sparkline, ohlcData } = generateMockHistory(data.pricePrimary, data.change24h);

    const assetData: AssetData = {
      id: symbol.toUpperCase(),
      symbol: symbol.toUpperCase(),
      name: data.name,
      price: data.pricePrimary,
      currency: data.currencyPrimary,
      secondaryPrice: data.priceSecondary || undefined,
      secondaryCurrency: data.priceSecondary ? 'CAD' : undefined,
      change24h: data.change24h,
      type: data.type as AssetType,
      vibe: data.vibe,
      lastUpdated: new Date().toLocaleTimeString(),
      sparkline,
      ohlcData,
      isTrending: Math.abs(data.change24h) > 5,
      rates: data.rates,
      isStale: false
    };

    // Save successful fetch to cache
    try {
        localStorage.setItem(cacheKey, JSON.stringify(assetData));
    } catch (e) {
        console.warn('Failed to save to cache', e);
    }

    return assetData;

  } catch (error) {
    console.warn(`Gemini fetch error for ${symbol}, attempting cache fallback:`, error);
    
    // Fallback to cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const data = JSON.parse(cached) as AssetData;
            return {
                ...data,
                isStale: true,
                vibe: `${data.vibe} (Cached)`,
                lastUpdated: `${data.lastUpdated}`
            };
        } catch (parseError) {
            console.error("Cache parse error", parseError);
        }
    }

    throw error;
  }
};

export const getMarketVibe = async (): Promise<string> => {
    try {
        // Initialize client lazily
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const response = await ai.models.generateContent({
            model: modelName,
            contents: "What is the overall sentiment of the global financial market? Answer in 1 short, soothing, zen-like sentence.",
            config: { tools: [{ googleSearch: {} }] }
        });
        const vibe = response.text || "Balance is being restored...";
        
        // Cache the vibe
        localStorage.setItem(VIBE_CACHE_KEY, vibe);
        return vibe;
    } catch (e) {
        // Fallback to cache or default
        return localStorage.getItem(VIBE_CACHE_KEY) || "Seeking equilibrium...";
    }
}

// Generate Sparkline AND Candlesticks
const generateMockHistory = (currentPrice: number, changePercent: number) => {
  const points = 30; 
  const sparkline: number[] = [];
  const ohlcData: OHLCData[] = [];
  
  let price = currentPrice * (1 - (changePercent / 100)); // Start price
  const volatility = currentPrice * 0.02;

  for (let i = 0; i < points; i++) {
    const drift = (currentPrice - price) / (points - i);
    const noise = (Math.random() - 0.5) * volatility;
    
    // Generate Candle
    const open = price;
    const close = price + drift + noise;
    const high = Math.max(open, close) + (Math.random() * volatility * 0.5);
    const low = Math.min(open, close) - (Math.random() * volatility * 0.5);
    
    ohlcData.push({ time: i, open, high, low, close });
    sparkline.push(close);
    
    price = close;
  }
  // Ensure last matches current
  ohlcData[points-1].close = currentPrice;
  sparkline[points-1] = currentPrice;

  return { sparkline, ohlcData };
};