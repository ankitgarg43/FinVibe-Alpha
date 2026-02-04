export enum AssetType {
  CRYPTO = 'CRYPTO',
  STOCK = 'STOCK',
  FOREX = 'FOREX',
  COMMODITY = 'COMMODITY',
  MORTGAGE = 'MORTGAGE'
}

export interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface AssetData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change24h: number; // Percentage
  type: AssetType;
  vibe: string;
  lastUpdated: string;
  sparkline: number[]; 
  ohlcData: OHLCData[]; // New field for Advanced charts
  isTrending?: boolean;
  rates?: { name: string; value: number }[];
  secondaryPrice?: number;
  secondaryCurrency?: string;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: AssetType;
}

export type FilterType = 'ALL' | AssetType;

export type ViewMode = 'SIMPLE' | 'ADVANCED';

export type BackgroundType = 'VOID' | 'OCEAN' | 'CLOUDS' | 'AURORA' | 'PARTICLES';

export type AlertSettings = {
  [key in AssetType]: number; 
};