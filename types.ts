export enum ItemCategory {
  SONORISATION = 'Sonorisation',
  QURAN_BOOK = 'Quran Book',
  OTHER = 'Other'
}

export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  subsection: string; // e.g., 'Microphones', 'Cables', 'Mushaf'
  quantity: number;
  location: string;
  description: string;
  minStockLevel: number;
  lastUpdated: string;
}

export interface OutputRecord {
  id: string;
  itemId: string;
  itemName: string;
  category: ItemCategory;
  subsection: string; // Added to track subsection history
  quantity: number;
  destination: string;
  date: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export type ViewState = 'dashboard' | 'sonorisation' | 'quran' | 'outputs' | 'ai-chat';
