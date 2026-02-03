export enum AssetType {
  CRYPTO = 'CRYPTO',
  STOCK = 'STOCK',
  FOREX = 'FOREX',
  COMMODITY = 'COMMODITY'
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
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: AssetType;
}

export type FilterType = 'ALL' | AssetType;