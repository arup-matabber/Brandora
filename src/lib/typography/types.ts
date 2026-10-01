/**
 * Opalite Typography Architecture — Normalized Domain Types
 * Defines provider-agnostic interfaces for external font providers.
 */

export type FontProviderId = "google" | "custom" | "system";

export type FontSortOption = "popularity" | "trending" | "alpha" | "style" | "date";

export type FontCategory =
  | "serif"
  | "sans-serif"
  | "display"
  | "handwriting"
  | "monospace"
  | string;

export interface FontItem {
  id: string;
  family: string;
  category: FontCategory;
  variants: string[];
  subsets: string[];
  files: Record<string, string>;
  provider: FontProviderId;
  version?: string;
  lastModified?: string;
  menu?: string;
}

export interface FontQueryOptions {
  sort?: FontSortOption;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface FontQueryResult {
  fonts: FontItem[];
  total: number;
  hasMore: boolean;
  provider: FontProviderId;
  cached?: boolean;
  error?: string;
  isFallback?: boolean;
}

export interface IFontProvider {
  id: FontProviderId;
  name: string;
  getFonts(options?: FontQueryOptions): Promise<FontQueryResult>;
  getFont(family: string): Promise<FontItem | null>;
}
