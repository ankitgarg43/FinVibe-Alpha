import { GoogleGenAI, Type } from "@google/genai";
import { AssetData, AssetType } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = 'gemini-3-flash-preview';

export const fetchAssetData = async (symbol: string): Promise<AssetData> => {
  const prompt = `
    Find the current live data for ${symbol}.
    
    1. Determine Asset Type: CRYPTO, STOCK, FOREX, COMMODITY, or MORTGAGE.
    2. Pricing Logic:
       - IF CRYPTO, STOCK, or COMMODITY: Return the price in USD as 'pricePrimary' and the converted price in CAD as 'priceSecondary'. Set 'currencyPrimary' to "USD".
       - IF FOREX (e.g. USD/CAD): Return the exchange rate as 'pricePrimary'. Set 'priceSecondary' to null. Set 'currencyPrimary' to the quote currency (e.g. CAD for USD/CAD).
       - IF MORTGAGE (or "Rates"): Return the rate (e.g. 6.5) as 'pricePrimary'. Set 'currencyPrimary' to "%".
         - If query mentions "Variable" or "ARM", use that rate. Otherwise 30Y Fixed.
         - Must include 'rates' array for mortgages.

    3. Vibe Check: Provide a 1-sentence Gen Alpha slang description ("Straight bussin", "Cooked", "Fanum tax", etc).

    Return strictly JSON:
    {
      "name": "Full Name",
      "type": "STOCK",
      "pricePrimary": 123.45,
      "currencyPrimary": "USD",
      "priceSecondary": 160.55, (nullable)
      "change24h": -5.2,
      "vibe": "...",
      "rates": [{"name": "30Y Fixed", "value": 6.5}, ...] (Optional)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: [AssetType.CRYPTO, AssetType.STOCK, AssetType.FOREX, AssetType.COMMODITY, AssetType.MORTGAGE] },
            pricePrimary: { type: Type.NUMBER },
            currencyPrimary: { type: Type.STRING },
            priceSecondary: { type: Type.NUMBER },
            change24h: { type: Type.NUMBER },
            vibe: { type: Type.STRING },
            rates: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  value: { type: Type.NUMBER }
                }
              }
            }
          },
          required: ["name", "pricePrimary", "currencyPrimary", "change24h", "type", "vibe"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    
    const data = JSON.parse(text);

    const sparkline = generateMockSparkline(data.pricePrimary, data.change24h);

    return {
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
      isTrending: Math.abs(data.change24h) > 5,
      rates: data.rates
    };

  } catch (error) {
    console.error("Gemini fetch error:", error);
    throw error;
  }
};

export const getMarketVibe = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: "What is the overall sentiment of the global financial market right now? Answer in 1 short sentence using Gen Alpha slang (e.g. 'We cooking', 'Fanum tax on gains', 'Rizzing up the charts').",
            config: {
                 tools: [{ googleSearch: {} }],
            }
        });
        return response.text || "Vibes are loading...";
    } catch (e) {
        return "Vibes currently unreachable.";
    }
}

// Helper to generate fake chart data based on current trend
const generateMockSparkline = (currentPrice: number, changePercent: number): number[] => {
  const points = 50;
  const data: number[] = [];
  let price = currentPrice * (1 - (changePercent / 100)); 
  
  for (let i = 0; i < points; i++) {
    const noise = (Math.random() - 0.5) * (currentPrice * 0.05); 
    const step = (currentPrice - price) / (points - i); 
    price += step + noise;
    data.push(price);
  }
  data.push(currentPrice); 
  return data;
};