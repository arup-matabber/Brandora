export type InspirationType = "reference" | "font" | "color" | "palette";

export type InspirationCategory =
  | "Branding"
  | "Typography"
  | "Packaging"
  | "Editorial"
  | "Photography"
  | "Architecture"
  | "Web Design"
  | "Posters"
  | "Art Direction"
  | "Color"
  | "Logos";

export interface NormalizedInspirationItem {
  id: string;
  provider: "opalite_curated" | "pinterest" | "cosmos" | "arena" | "unsplash" | "pixabay";
  title: string;
  imageUrl?: string;
  sourceUrl?: string;
  creator?: string;
  type: InspirationType;
  category: InspirationCategory;
  tags: string[];
  aspectRatio?: number; // e.g. 0.75 for 3:4, 1.33 for 4:3, 1 for 1:1
  metadata?: {
    // For typography
    fontName?: string;
    fontFamily?: string;
    previewText?: string;
    categoryType?: "serif" | "sans" | "display" | "mono";

    // For color
    hex?: string;
    colorName?: string;

    // For palette
    paletteName?: string;
    colors?: { hex: string; label: string }[];

    // Additional info
    sourceQuery?: string;
    mood?: string;
    format?: string;
  };
}

export interface InspirationFilterOptions {
  type?: InspirationType;
  category?: string;
  query?: string;
  mood?: string;
  tag?: string;
}

export interface InspirationProvider {
  name: string;
  search(query: string, options?: InspirationFilterOptions): Promise<NormalizedInspirationItem[]>;
  getTrending(options?: InspirationFilterOptions): Promise<NormalizedInspirationItem[]>;
  getItem(id: string): Promise<NormalizedInspirationItem | null>;
  getCategories(): InspirationCategory[];
}
