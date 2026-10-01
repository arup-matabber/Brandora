import {
  FontItem,
  FontQueryOptions,
  FontQueryResult,
  IFontProvider,
} from "./types";
import {
  normalizeGoogleFont,
  normalizeMetadataFont,
  RawGoogleWebfont,
  RawGoogleMetadataFont,
} from "./normalizer";
import { FALLBACK_GOOGLE_FONTS } from "./fallbacks";

interface CacheEntry {
  timestamp: number;
  fonts: FontItem[];
}

/**
 * Server-side Google Fonts Provider.
 * Communicates with:
 * 1. Official Google Fonts Developer API v1 (when GOOGLE_FONTS_API_KEY is configured).
 * 2. Official Google Fonts Live Directory API (public metadata catalog containing all 1,940+ Google Fonts).
 * 3. Curated local fallbacks for offline resilience.
 *
 * Normalizes all items into Opalite's FontItem model and caches catalogue in-memory.
 */
export class GoogleFontsProvider implements IFontProvider {
  public readonly id = "google" as const;
  public readonly name = "Google Fonts";

  private apiKey: string;
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTtlMs: number;

  constructor(apiKey?: string, cacheTtlMs = 1000 * 60 * 60 /* 1 hour */) {
    this.apiKey = apiKey || process.env.GOOGLE_FONTS_API_KEY || "";
    this.cacheTtlMs = cacheTtlMs;
  }

  /**
   * Fetches Google Fonts from the official API or returns cached/fallback data.
   */
  public async getFonts(options: FontQueryOptions = {}): Promise<FontQueryResult> {
    const sort = options.sort || "popularity";
    const categoryFilter = options.category?.toLowerCase();
    const searchQuery = options.search?.toLowerCase().trim();
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    // Check in-memory cache for this sort order
    const cacheKey = `catalogue-${sort}`;
    let allFonts: FontItem[] | null = null;
    const cachedEntry = this.cache.get(cacheKey);

    if (cachedEntry && Date.now() - cachedEntry.timestamp < this.cacheTtlMs) {
      allFonts = cachedEntry.fonts;
    }

    let isFallback = false;
    let errorMsg: string | undefined;

    if (!allFonts) {
      // 1. Try official Google Fonts Webfonts Developer API v1 if API key exists
      if (this.apiKey) {
        try {
          const endpoint = `https://www.googleapis.com/webfonts/v1/webfonts?key=${encodeURIComponent(
            this.apiKey
          )}&sort=${encodeURIComponent(sort)}`;

          const res = await fetch(endpoint, {
            next: { revalidate: 86400 },
          });

          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.items)) {
              allFonts = data.items.map((item: RawGoogleWebfont) => normalizeGoogleFont(item));
            }
          } else {
            const errBody = await res.text().catch(() => "");
            console.warn(
              `[GoogleFontsProvider] Developer API returned ${res.status}: ${errBody.slice(0, 100)}. Falling back to public directory API.`
            );
          }
        } catch (err: any) {
          console.warn("[GoogleFontsProvider] Developer API fetch error:", err.message);
        }
      }

      // 2. If no API key or Developer API failed, query the official Google Fonts live metadata directory
      if (!allFonts) {
        try {
          const res = await fetch("https://fonts.google.com/metadata/fonts", {
            headers: {
              Accept: "application/json, text/plain, */*",
              "User-Agent": "Opalite-Brand-Studio/1.0",
            },
            next: { revalidate: 86400 },
          });

          if (res.ok) {
            const text = await res.text();
            // Google prefixes the response with )]}' for JSON injection protection
            const cleanText = text.replace(/^\)\]\}'\n?/, "").trim();
            const parsed = JSON.parse(cleanText);

            if (parsed && Array.isArray(parsed.familyMetadataList)) {
              let list: RawGoogleMetadataFont[] = parsed.familyMetadataList;

              // Apply catalog sorting
              if (sort === "popularity") {
                list = [...list].sort((a, b) => (a.popularity ?? 9999) - (b.popularity ?? 9999));
              } else if (sort === "trending") {
                list = [...list].sort((a, b) => (a.trending ?? 9999) - (b.trending ?? 9999));
              } else if (sort === "date") {
                list = [...list].sort((a, b) => (b.dateAdded || "").localeCompare(a.dateAdded || ""));
              } else if (sort === "alpha") {
                list = [...list].sort((a, b) => a.family.localeCompare(b.family));
              } else if (sort === "style") {
                list = [...list].sort(
                  (a, b) => Object.keys(b.fonts || {}).length - Object.keys(a.fonts || {}).length
                );
              }

              allFonts = list.map((item) => normalizeMetadataFont(item));
            }
          }
        } catch (dirErr: any) {
          console.warn("[GoogleFontsProvider] Public directory fetch error:", dirErr.message);
        }
      }

      // 3. Fallback to curated local fonts if both network requests failed
      if (!allFonts || allFonts.length === 0) {
        isFallback = true;
        errorMsg = "Live Google Fonts API unavailable. Serving curated font fallbacks.";
        allFonts = FALLBACK_GOOGLE_FONTS;
      }

      // Store in memory cache
      if (allFonts) {
        this.cache.set(cacheKey, {
          timestamp: Date.now(),
          fonts: allFonts,
        });
      }
    }

    const safeFonts: FontItem[] = allFonts || FALLBACK_GOOGLE_FONTS;

    // Apply filtering (search and category)
    let filtered: FontItem[] = safeFonts;

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((f) => f.category === categoryFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (f) =>
          f.family.toLowerCase().includes(searchQuery) ||
          f.category.toLowerCase().includes(searchQuery)
      );
    }

    // Client-requested sorts on filtered result
    if (sort === "style") {
      filtered = [...filtered].sort((a, b) => b.variants.length - a.variants.length);
    } else if (sort === "alpha") {
      filtered = [...filtered].sort((a, b) => a.family.localeCompare(b.family));
    }

    const total = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      fonts: paginated,
      total,
      hasMore,
      provider: this.id,
      cached: Boolean(cachedEntry),
      isFallback,
      error: errorMsg,
    };
  }

  /**
   * Retrieves a single font family by name.
   */
  public async getFont(family: string): Promise<FontItem | null> {
    const result = await this.getFonts({ search: family, limit: 10 });
    const match = result.fonts.find(
      (f) => f.family.toLowerCase() === family.toLowerCase()
    );
    return match || null;
  }
}
