import {
  FontItem,
  FontQueryOptions,
  FontQueryResult,
  IFontProvider,
} from "./types";

/**
 * Client-Side Font Provider.
 * Communicates with Opalite's /api/fonts endpoint.
 * Contains client-side in-memory and sessionStorage caching.
 */
export class ClientFontProvider implements IFontProvider {
  public readonly id = "google" as const;
  public readonly name = "Google Fonts";

  private clientCache = new Map<string, FontQueryResult>();

  /**
   * Fetches fonts via /api/fonts with client caching.
   */
  public async getFonts(options: FontQueryOptions = {}): Promise<FontQueryResult> {
    const params = new URLSearchParams();
    if (options.sort) params.set("sort", options.sort);
    if (options.category) params.set("category", options.category);
    if (options.search) params.set("search", options.search);
    if (options.limit) params.set("limit", String(options.limit));
    if (options.offset) params.set("offset", String(options.offset));

    const cacheKey = `fonts-${params.toString()}`;

    // 1. Check in-memory client cache
    if (this.clientCache.has(cacheKey)) {
      return { ...this.clientCache.get(cacheKey)!, cached: true };
    }

    // 2. Check browser sessionStorage if available
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        const stored = sessionStorage.getItem(`opalite_${cacheKey}`);
        if (stored) {
          const parsed: FontQueryResult = JSON.parse(stored);
          this.clientCache.set(cacheKey, parsed);
          return { ...parsed, cached: true };
        }
      } catch {
        // sessionStorage read error ignored
      }
    }

    try {
      const baseUrl =
        typeof window !== "undefined"
          ? ""
          : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const res = await fetch(`${baseUrl}/api/fonts?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data: FontQueryResult = await res.json();

      // Store in caches
      this.clientCache.set(cacheKey, data);
      if (typeof window !== "undefined" && window.sessionStorage) {
        try {
          sessionStorage.setItem(`opalite_${cacheKey}`, JSON.stringify(data));
        } catch {
          // sessionStorage quota exceeded or disabled
        }
      }

      return data;
    } catch (err: any) {
      console.warn("[ClientFontProvider] Error fetching fonts:", err);
      return {
        fonts: [],
        total: 0,
        hasMore: false,
        provider: this.id,
        error: err.message || "Failed to load fonts",
        isFallback: true,
      };
    }
  }

  /**
   * Retrieves a single font family by name.
   */
  public async getFont(family: string): Promise<FontItem | null> {
    const result = await this.getFonts({ search: family, limit: 1 });
    return result.fonts[0] || null;
  }
}

/**
 * Dynamically loads a Google Font into the document head for live preview.
 * Ensures the application interface font (Satoshi) remains untouched.
 */
const loadedFontStyles = new Set<string>();

export function loadGoogleFontPreview(family: string, variants: string[] = ["400", "700"]): void {
  if (typeof document === "undefined" || !family) return;

  const normalized = family.trim();
  if (normalized.toLowerCase() === "satoshi" || normalized.toLowerCase() === "system-ui") return;

  const fontKey = `${normalized}:${(variants || []).join(",")}`;
  if (loadedFontStyles.has(fontKey)) return;

  try {
    const formattedFamily = normalized.replace(/\s+/g, "+");

    // Normalize weights: "regular" -> "400", "italic" -> "400", extract digits
    const rawWeights = (variants && variants.length > 0 ? variants : ["400", "700"])
      .map((v) => {
        if (v === "regular" || v === "italic") return "400";
        const digits = v.replace(/\D/g, "");
        return digits || "400";
      })
      .filter((w) => /^[1-9]00$/.test(w));

    const uniqueWeights = Array.from(new Set(rawWeights)).sort((a, b) => Number(a) - Number(b));
    const weightParam = uniqueWeights.length > 0 ? `:wght@${uniqueWeights.join(";")}` : "";

    const linkId = `google-font-${normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const targetHref = `https://fonts.googleapis.com/css2?family=${formattedFamily}${weightParam}&display=swap`;

    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = targetHref;
      document.head.appendChild(link);
    } else if (link.href !== targetHref) {
      link.href = targetHref;
    }

    loadedFontStyles.add(fontKey);
  } catch (err) {
    console.warn("[loadGoogleFontPreview] Could not load font preview:", err);
  }
}

/**
 * Injects a direct @font-face rule if a static font file URL (e.g. from Google API .files) is provided.
 */
export function injectFontFaceFromFile(family: string, fileUrl: string, weight = "400", style = "normal"): void {
  if (typeof document === "undefined" || !family || !fileUrl) return;

  const styleId = `font-face-${family.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${weight}`;
  if (document.getElementById(styleId)) return;

  try {
    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.textContent = `
      @font-face {
        font-family: '${family}';
        font-weight: ${weight};
        font-style: ${style};
        font-display: swap;
        src: url('${fileUrl}') format('${fileUrl.endsWith(".woff2") ? "woff2" : fileUrl.endsWith(".woff") ? "woff" : "truetype"}');
      }
    `;
    document.head.appendChild(styleEl);
  } catch (err) {
    console.warn("[injectFontFaceFromFile] Error injecting font-face:", err);
  }
}

// Default singleton client provider instance
export const fontService = new ClientFontProvider();
