export enum AssetType {
  CRYPTO = 'CRYPTO',
  STOCK = 'STOCK',
  FOREX = 'FOREX',
  COMMODITY = 'COMMODITY',
  MORTGAGE = 'MORTGAGE'
}

export interface AssetData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change24h: number; // Percentage
  type: AssetType;
  vibe: string; // Gen Alpha slang description
  lastUpdated: string;
  sparkline: number[]; // Array of numbers for chart
  isTrending?: boolean;
  rates?: { name: string; value: number }[]; // Specific for Mortgage type (e.g. 30yr, 15yr)
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: AssetType;
}

export type FilterType = 'ALL' | AssetType;

export type AlertSettings = {
  [key in AssetType]: number; // Threshold percentage
};