import { GoogleGenAI, Type } from "@google/genai";
import { AssetData, AssetType } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = 'gemini-3-flash-preview';

export const fetchAssetData = async (symbol: string): Promise<AssetData> => {
  const prompt = `
    Find the current live price/rate, 24h percentage change, and full name for ${symbol}.
    
    SPECIAL HANDLING FOR MORTGAGES (if query involves "Mortgage", "Rates", or "Variable"):
    - Set type to 'MORTGAGE'.
    - If the query specifically mentions "Variable" or "ARM", use the current Variable/Adjustable Rate as the main 'price'.
    - Otherwise, use the 30-Year Fixed rate as the main 'price'.
    - Always provide a 'rates' array including keys like: "30Y Fixed", "15Y Fixed", "Variable" (or "5/1 ARM").
    
    Also provide a "Gen Alpha" style short vibe check (1 sentence slang description, e.g., "Straight bussin", "It's joever", "To the moon", "Cooked", "High key expensive").
    Determine if it is CRYPTO, STOCK, FOREX, COMMODITY, or MORTGAGE.
    
    Return strictly JSON with this schema:
    {
      "name": "Full Name",
      "price": 123.45,
      "currency": "USD" or "CAD" or "%",
      "change24h": -5.2 (number only),
      "type": "STOCK",
      "vibe": "slang description",
      "rates": [{"name": "30Y Fixed", "value": 6.5}, ...] (Optional, only for MORTGAGE)
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
            price: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            change24h: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: [AssetType.CRYPTO, AssetType.STOCK, AssetType.FOREX, AssetType.COMMODITY, AssetType.MORTGAGE] },
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
          required: ["name", "price", "change24h", "type", "vibe", "currency"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    
    const data = JSON.parse(text);

    // Mock sparkline data since search doesn't return history easily in one go
    // We generate a trend that matches the change24h direction
    const sparkline = generateMockSparkline(data.price, data.change24h);

    return {
      id: symbol.toUpperCase(),
      symbol: symbol.toUpperCase(),
      name: data.name,
      price: data.price,
      currency: data.currency,
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
    // Return a fallback or rethrow
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
  const points = 50; // Increased points for smoother graph
  const data: number[] = [];
  let price = currentPrice * (1 - (changePercent / 100)); // approximate start
  
  for (let i = 0; i < points; i++) {
    // Add randomness but bias towards the final currentPrice
    const noise = (Math.random() - 0.5) * (currentPrice * 0.05); // More volatility
    const step = (currentPrice - price) / (points - i); 
    price += step + noise;
    data.push(price);
  }
  data.push(currentPrice); // Ensure end matches
  return data;
};