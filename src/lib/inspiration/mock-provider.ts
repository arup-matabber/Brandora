import {
  InspirationProvider,
  NormalizedInspirationItem,
  InspirationCategory,
  InspirationFilterOptions,
} from "./types";

export const SUGGESTED_TOPICS: InspirationCategory[] = [
  "Branding",
  "Typography",
  "Packaging",
  "Editorial",
  "Photography",
  "Architecture",
  "Web Design",
  "Posters",
  "Art Direction",
  "Color",
  "Logos",
];

export const MOCK_INSPIRATION_ITEMS: NormalizedInspirationItem[] = [
  // ── BRANDING & IDENTITY ──────────────────────────────────────────────────
  {
    id: "insp-quiet-identity",
    provider: "opalite_curated",
    title: "Quiet forms for a considered identity",
    imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=85",
    sourceUrl: "https://studio-norr.design",
    creator: "Studio Norr",
    type: "reference",
    category: "Branding",
    tags: ["identity", "wordmark", "restraint", "luxury", "minimal"],
    aspectRatio: 1.25,
    metadata: {
      mood: "Quiet luxury",
      format: "Brand identity",
    },
  },
  {
    id: "insp-architectural-monogram",
    provider: "opalite_curated",
    title: "Monogram & stationery system in blind deboss",
    imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1000&q=85",
    sourceUrl: "https://atelier-k.studio",
    creator: "Atelier K",
    type: "reference",
    category: "Branding",
    tags: ["monogram", "stationery", "tactile", "emboss", "paper"],
    aspectRatio: 0.8,
    metadata: {
      mood: "Craft",
      format: "Stationery",
    },
  },
  {
    id: "insp-kinetic-identity",
    provider: "opalite_curated",
    title: "Dynamic visual identity for contemporary art center",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=85",
    sourceUrl: "https://form-office.eu",
    creator: "Form Office",
    type: "reference",
    category: "Branding",
    tags: ["identity", "abstract", "contemporary", "gallery", "culture"],
    aspectRatio: 1.0,
    metadata: {
      mood: "Contemporary",
      format: "Brand identity",
    },
  },
  {
    id: "insp-hospitality-grid",
    provider: "opalite_curated",
    title: "Modular identity system for modern boutique hotel",
    imageUrl: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1000&q=85",
    sourceUrl: "https://morrowstudio.com",
    creator: "Morrow Studio",
    type: "reference",
    category: "Branding",
    tags: ["hospitality", "grid", "minimal", "interior", "editorial"],
    aspectRatio: 1.33,
    metadata: {
      mood: "Warm minimalism",
      format: "Brand identity",
    },
  },

  // ── PACKAGING ────────────────────────────────────────────────────────────
  {
    id: "insp-tactile-packaging",
    provider: "opalite_curated",
    title: "Tactile cosmetic vessels in sand-cast glass",
    imageUrl: "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=1000&q=85",
    sourceUrl: "https://oliveworkshop.com",
    creator: "Olive Workshop",
    type: "reference",
    category: "Packaging",
    tags: ["packaging", "glass", "sustainable", "beauty", "tactile"],
    aspectRatio: 0.85,
    metadata: {
      mood: "Craft",
      format: "Packaging",
    },
  },
  {
    id: "insp-unbleached-cartons",
    provider: "opalite_curated",
    title: "Unbleached kraft structural cartons with foil accent",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=85",
    sourceUrl: "https://eastline-pack.com",
    creator: "Eastline Pack",
    type: "reference",
    category: "Packaging",
    tags: ["packaging", "kraft", "foil", "minimal", "unhurried"],
    aspectRatio: 1.15,
    metadata: {
      mood: "Quiet luxury",
      format: "Packaging",
    },
  },

  // ── EDITORIAL & PRINT ────────────────────────────────────────────────────
  {
    id: "insp-editorial-type-journal",
    provider: "opalite_curated",
    title: "Small-batch architectural journal with wide margins",
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1000&q=85",
    sourceUrl: "https://aurelia-press.com",
    creator: "Aurelia Press",
    type: "reference",
    category: "Editorial",
    tags: ["editorial", "serif", "print", "monograph", "book"],
    aspectRatio: 0.75,
    metadata: {
      mood: "Bold editorial",
      format: "Editorial",
    },
  },
  {
    id: "insp-monograph-layout",
    provider: "opalite_curated",
    title: "Typographic stillness and asymmetrical page rhythm",
    imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1000&q=85",
    sourceUrl: "https://atelier-monday.com",
    creator: "Atelier Monday",
    type: "reference",
    category: "Editorial",
    tags: ["editorial", "print", "layout", "grid", "swiss"],
    aspectRatio: 1.3,
    metadata: {
      mood: "Quiet luxury",
      format: "Editorial",
    },
  },

  // ── ARCHITECTURE & INTERIORS ─────────────────────────────────────────────
  {
    id: "insp-retail-pavilion",
    provider: "opalite_curated",
    title: "Monolithic travertine surfaces for flagship space",
    imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=85",
    sourceUrl: "https://formandfield.com",
    creator: "Form & Field",
    type: "reference",
    category: "Architecture",
    tags: ["architecture", "interior", "retail", "travertine", "minimal"],
    aspectRatio: 1.2,
    metadata: {
      mood: "Contemporary",
      format: "Interiors",
    },
  },
  {
    id: "insp-shadow-materiality",
    provider: "opalite_curated",
    title: "Natural light study and raw lime wash texture",
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=85",
    sourceUrl: "https://studio-kanso.design",
    creator: "Studio Kanso",
    type: "reference",
    category: "Architecture",
    tags: ["light", "shadow", "texture", "materiality", "stone"],
    aspectRatio: 0.8,
    metadata: {
      mood: "Warm minimalism",
      format: "Photography",
    },
  },

  // ── POSTERS & ART DIRECTION ──────────────────────────────────────────────
  {
    id: "insp-exhibition-poster",
    provider: "opalite_curated",
    title: "Typographic exhibition poster with stark tension",
    imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=85",
    sourceUrl: "https://museum-graphic.ch",
    creator: "Swiss Typographics",
    type: "reference",
    category: "Posters",
    tags: ["poster", "swiss", "typography", "high-contrast", "art"],
    aspectRatio: 0.7,
    metadata: {
      mood: "Bold editorial",
      format: "Posters",
    },
  },
  {
    id: "insp-chromatic-study",
    provider: "opalite_curated",
    title: "Color rhythm and chromatic layering for festival",
    imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1000&q=85",
    sourceUrl: "https://goodpeople.agency",
    creator: "Good People Agency",
    type: "reference",
    category: "Art Direction",
    tags: ["color", "gradient", "festival", "contemporary", "vibrant"],
    aspectRatio: 1.1,
    metadata: {
      mood: "Contemporary",
      format: "Art Direction",
    },
  },

  // ── WEB & DIGITAL ────────────────────────────────────────────────────────
  {
    id: "insp-editorial-web",
    provider: "opalite_curated",
    title: "A digital ritual with generous breathing room",
    imageUrl: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=1000&q=85",
    sourceUrl: "https://objectsoffice.com",
    creator: "Objects Office",
    type: "reference",
    category: "Web Design",
    tags: ["web", "digital", "interface", "whitespace", "typography"],
    aspectRatio: 1.4,
    metadata: {
      mood: "Warm minimalism",
      format: "Digital",
    },
  },

  // ── TYPOGRAPHY SPECIMENS ─────────────────────────────────────────────────
  {
    id: "insp-font-playfair",
    provider: "opalite_curated",
    title: "Playfair Display",
    imageUrl: "",
    creator: "Claus Eggers Sørensen",
    type: "font",
    category: "Typography",
    tags: ["serif", "editorial", "high-contrast", "luxury", "headline"],
    metadata: {
      fontName: "Playfair Display",
      fontFamily: "'Playfair Display', serif",
      previewText: "Sphinx of black quartz, judge my vow.",
      categoryType: "serif",
    },
  },
  {
    id: "insp-font-satoshi",
    provider: "opalite_curated",
    title: "Satoshi",
    imageUrl: "",
    creator: "Fontshare / Indian Type Foundry",
    type: "font",
    category: "Typography",
    tags: ["sans", "grotesque", "geometric", "modern", "ui"],
    metadata: {
      fontName: "Satoshi",
      fontFamily: "Satoshi, system-ui, sans-serif",
      previewText: "Restrained materiality meets modern utility.",
      categoryType: "sans",
    },
  },
  {
    id: "insp-font-libre-baskerville",
    provider: "opalite_curated",
    title: "Libre Baskerville",
    imageUrl: "",
    creator: "Impallari Type",
    type: "font",
    category: "Typography",
    tags: ["serif", "classic", "reading", "editorial", "timeless"],
    metadata: {
      fontName: "Libre Baskerville",
      fontFamily: "'Libre Baskerville', serif",
      previewText: "Clarity of purpose and quiet elegance.",
      categoryType: "serif",
    },
  },
  {
    id: "insp-font-space-grotesk",
    provider: "opalite_curated",
    title: "Space Grotesk",
    imageUrl: "",
    creator: "Florian Karsten",
    type: "font",
    category: "Typography",
    tags: ["sans", "monospace-feel", "contemporary", "tech", "editorial"],
    metadata: {
      fontName: "Space Grotesk",
      fontFamily: "'Space Grotesk', sans-serif",
      previewText: "Architectural discipline and crisp detail.",
      categoryType: "mono",
    },
  },
  {
    id: "insp-font-dm-serif",
    provider: "opalite_curated",
    title: "DM Serif Display",
    imageUrl: "",
    creator: "Colophon Foundry",
    type: "font",
    category: "Typography",
    tags: ["serif", "display", "poster", "monumental", "editorial"],
    metadata: {
      fontName: "DM Serif Display",
      fontFamily: "'DM Serif Display', serif",
      previewText: "Understated sensory experiences.",
      categoryType: "display",
    },
  },

  // ── COLOR PALETTES & SWATCHES ────────────────────────────────────────────
  {
    id: "insp-palette-warm-editorial",
    provider: "opalite_curated",
    title: "Warm Editorial & Terracotta",
    imageUrl: "",
    creator: "Studio Opalite",
    type: "palette",
    category: "Color",
    tags: ["warm", "editorial", "terracotta", "sand", "cream", "palette"],
    metadata: {
      paletteName: "Warm Editorial",
      colors: [
        { hex: "#231F20", label: "Ink Black" },
        { hex: "#B5451B", label: "Terracotta" },
        { hex: "#E8973A", label: "Ochre" },
        { hex: "#EAE6DF", label: "Sand Paper" },
        { hex: "#FAFAF7", label: "Alabaster" },
      ],
    },
  },
  {
    id: "insp-palette-minimal-monochrome",
    provider: "opalite_curated",
    title: "Minimal Monochrome & Charcoal",
    imageUrl: "",
    creator: "Studio Opalite",
    type: "palette",
    category: "Color",
    tags: ["monochrome", "charcoal", "minimal", "quiet luxury", "palette"],
    metadata: {
      paletteName: "Minimal Monochrome",
      colors: [
        { hex: "#191918", label: "Primary Ink" },
        { hex: "#4A4A45", label: "Charcoal" },
        { hex: "#9E9E98", label: "Ash" },
        { hex: "#EBEBE7", label: "Divider" },
        { hex: "#FBFBFA", label: "Clean Canvas" },
      ],
    },
  },
  {
    id: "insp-palette-nordic-sage",
    provider: "opalite_curated",
    title: "Nordic Pine & Sage",
    imageUrl: "",
    creator: "Studio Opalite",
    type: "palette",
    category: "Color",
    tags: ["nature", "sage", "pine", "mineral", "eucalyptus", "palette"],
    metadata: {
      paletteName: "Nordic Pine & Sage",
      colors: [
        { hex: "#1C2826", label: "Deep Pine" },
        { hex: "#4C8B5D", label: "Herb Sage" },
        { hex: "#8DAA9D", label: "Eucalyptus" },
        { hex: "#D8E2DC", label: "Morning Mist" },
        { hex: "#F9F9F8", label: "Warm White" },
      ],
    },
  },
  {
    id: "insp-palette-deep-cobalt",
    provider: "opalite_curated",
    title: "Midnight & Deep Cobalt",
    imageUrl: "",
    creator: "Studio Opalite",
    type: "palette",
    category: "Color",
    tags: ["cobalt", "blue", "midnight", "modern", "sharp", "palette"],
    metadata: {
      paletteName: "Deep Cobalt",
      colors: [
        { hex: "#0F172A", label: "Midnight" },
        { hex: "#2563EB", label: "Cobalt" },
        { hex: "#60A5FA", label: "Sky Azure" },
        { hex: "#E2E8F0", label: "Ice Sheet" },
        { hex: "#FFFFFF", label: "Pure White" },
      ],
    },
  },

  // ── INDIVIDUAL COLOR SWATCHES ────────────────────────────────────────────
  {
    id: "insp-color-obsidian",
    provider: "opalite_curated",
    title: "Obsidian Ink",
    imageUrl: "",
    creator: "Studio Opalite",
    type: "color",
    category: "Color",
    tags: ["color", "black", "ink", "neutral", "swatch"],
    metadata: {
      hex: "#191918",
      colorName: "Obsidian Ink",
    },
  },
  {
    id: "insp-color-terracotta",
    provider: "opalite_curated",
    title: "Sienna Terracotta",
    imageUrl: "",
    creator: "Studio Opalite",
    type: "color",
    category: "Color",
    tags: ["color", "terracotta", "warm", "earth", "swatch"],
    metadata: {
      hex: "#B5451B",
      colorName: "Sienna Terracotta",
    },
  },
  {
    id: "insp-color-eucalyptus",
    provider: "opalite_curated",
    title: "Alpine Sage",
    imageUrl: "",
    creator: "Studio Opalite",
    type: "color",
    category: "Color",
    tags: ["color", "green", "sage", "mineral", "swatch"],
    metadata: {
      hex: "#4C8B5D",
      colorName: "Alpine Sage",
    },
  },
  {
    id: "insp-color-cobalt",
    provider: "opalite_curated",
    title: "Architectural Cobalt",
    imageUrl: "",
    creator: "Studio Opalite",
    type: "color",
    category: "Color",
    tags: ["color", "blue", "cobalt", "bold", "swatch"],
    metadata: {
      hex: "#2563EB",
      colorName: "Architectural Cobalt",
    },
  },
  {
    id: "insp-color-sand",
    provider: "opalite_curated",
    title: "Desert Limestone",
    imageUrl: "",
    creator: "Studio Opalite",
    type: "color",
    category: "Color",
    tags: ["color", "sand", "warm", "neutral", "swatch"],
    metadata: {
      hex: "#E8E5DF",
      colorName: "Desert Limestone",
    },
  },
];

export class MockInspirationProvider implements InspirationProvider {
  name = "opalite_curated";

  async search(
    query: string,
    options?: InspirationFilterOptions
  ): Promise<NormalizedInspirationItem[]> {
    const q = query.trim().toLowerCase();
    return MOCK_INSPIRATION_ITEMS.filter((item) => {
      // Type match
      if (options?.type && item.type !== options.type) {
        return false;
      }
      // Category match
      if (options?.category && options.category !== "All" && item.category !== options.category) {
        return false;
      }
      // Query match across title, creator, tags, category
      if (q) {
        const hay = [
          item.title,
          item.creator ?? "",
          item.category,
          ...item.tags,
          item.metadata?.fontName ?? "",
          item.metadata?.colorName ?? "",
          item.metadata?.paletteName ?? "",
          item.metadata?.mood ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  async getTrending(
    options?: InspirationFilterOptions
  ): Promise<NormalizedInspirationItem[]> {
    return this.search("", options);
  }

  async getItem(id: string): Promise<NormalizedInspirationItem | null> {
    const found = MOCK_INSPIRATION_ITEMS.find((i) => i.id === id);
    return found || null;
  }

  getCategories(): InspirationCategory[] {
    return SUGGESTED_TOPICS;
  }
}

export const defaultInspirationProvider = new MockInspirationProvider();
