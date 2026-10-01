import {
  InspirationProvider,
  NormalizedInspirationItem,
  InspirationCategory,
  InspirationFilterOptions,
} from "./types";
import { PIXABAY_API_KEY, PIXABAY_API_BASE_URL, isPixabayConfigured } from "../pixabay-config";

interface PixabayHit {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayHit[];
}

const cache = new Map<string, NormalizedInspirationItem[]>();

function inferCategory(tags: string, requestedCategory?: string): InspirationCategory {
  if (requestedCategory && requestedCategory !== "All") {
    return requestedCategory as InspirationCategory;
  }
  const lower = tags.toLowerCase();
  if (lower.includes("architecture") || lower.includes("building") || lower.includes("interior")) return "Architecture";
  if (lower.includes("packaging") || lower.includes("bottle") || lower.includes("box")) return "Packaging";
  if (lower.includes("typography") || lower.includes("letter") || lower.includes("font") || lower.includes("poster")) return "Typography";
  if (lower.includes("art") || lower.includes("abstract") || lower.includes("painting")) return "Art Direction";
  if (lower.includes("brand") || lower.includes("logo") || lower.includes("identity")) return "Branding";
  if (lower.includes("book") || lower.includes("magazine") || lower.includes("paper")) return "Editorial";
  return "Photography";
}

function formatTitle(tags: string): string {
  const parts = tags.split(",").map((s) => s.trim());
  if (parts.length === 0 || !parts[0]) return "Creative Photography";
  // Capitalize first letter of each tag word
  return parts
    .slice(0, 2)
    .map((phrase) =>
      phrase
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    )
    .join(" · ");
}

export class PixabayInspirationProvider implements InspirationProvider {
  name = "Pixabay";

  async search(query: string, options?: InspirationFilterOptions): Promise<NormalizedInspirationItem[]> {
    if (!isPixabayConfigured()) {
      return [];
    }

    const rawCategory = options?.category && options.category !== "All" ? options.category : "";
    const searchTerm = (query.trim() || rawCategory || "aesthetic design architecture minimal").trim();
    const cacheKey = `pixabay-${searchTerm.toLowerCase()}-${options?.category ?? "all"}`;

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    try {
      const params = new URLSearchParams({
        key: PIXABAY_API_KEY,
        q: searchTerm,
        image_type: "photo",
        safesearch: "true",
        per_page: "40",
      });

      // Category match if applicable
      if (options?.category === "Architecture") {
        params.set("category", "buildings");
      }

      const res = await fetch(`${PIXABAY_API_BASE_URL}?${params.toString()}`);
      if (!res.ok) {
        console.warn(`[PixabayProvider] HTTP ${res.status}: failed to fetch`);
        return [];
      }

      const data: PixabayResponse = await res.json();
      if (!data.hits || !Array.isArray(data.hits)) {
        return [];
      }

      const items: NormalizedInspirationItem[] = data.hits.map((hit) => {
        const rawTags = hit.tags
          ? Array.from(new Set(hit.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)))
          : [];
        const aspect =
          hit.webformatWidth && hit.webformatHeight
            ? hit.webformatWidth / hit.webformatHeight
            : hit.imageWidth && hit.imageHeight
            ? hit.imageWidth / hit.imageHeight
            : 1.25;

        const directImageUrl = hit.previewURL
          ? hit.previewURL.replace(/_150\./, "_640.")
          : hit.webformatURL || hit.largeImageURL;

        return {
          id: `pixabay-${hit.id}`,
          provider: "pixabay",
          title: formatTitle(hit.tags),
          imageUrl: directImageUrl,
          sourceUrl: hit.pageURL,
          creator: hit.user || "Pixabay Creator",
          type: "reference",
          category: inferCategory(hit.tags, options?.category),
          tags: rawTags,
          aspectRatio: aspect,
          metadata: {
            mood: "Editorial visual",
            format: "Photography",
            sourceQuery: searchTerm,
          },
        };
      });

      cache.set(cacheKey, items);
      return items;
    } catch (err) {
      console.warn("[PixabayProvider] Error searching Pixabay:", err);
      return [];
    }
  }

  async getTrending(options?: InspirationFilterOptions): Promise<NormalizedInspirationItem[]> {
    return this.search("aesthetic minimal editorial architecture", options);
  }

  async getItem(id: string): Promise<NormalizedInspirationItem | null> {
    const rawId = id.replace(/^pixabay-/, "");
    if (!isPixabayConfigured() || !rawId) return null;

    try {
      const params = new URLSearchParams({
        key: PIXABAY_API_KEY,
        id: rawId,
      });
      const res = await fetch(`${PIXABAY_API_BASE_URL}?${params.toString()}`);
      if (!res.ok) return null;
      const data: PixabayResponse = await res.json();
      if (!data.hits || data.hits.length === 0) return null;

      const hit = data.hits[0];
      const aspect =
        hit.webformatWidth && hit.webformatHeight
          ? hit.webformatWidth / hit.webformatHeight
          : 1.25;

      const directImageUrl = hit.previewURL
        ? hit.previewURL.replace(/_150\./, "_1280.")
        : hit.largeImageURL || hit.webformatURL;

      return {
        id: `pixabay-${hit.id}`,
        provider: "pixabay",
        title: formatTitle(hit.tags),
        imageUrl: directImageUrl,
        sourceUrl: hit.pageURL,
        creator: hit.user || "Pixabay Creator",
        type: "reference",
        category: inferCategory(hit.tags),
        tags: hit.tags.split(",").map((t) => t.trim()),
        aspectRatio: aspect,
        metadata: {
          mood: "Editorial visual",
          format: "Photography",
        },
      };
    } catch {
      return null;
    }
  }

  getCategories(): InspirationCategory[] {
    return [
      "Branding",
      "Typography",
      "Packaging",
      "Editorial",
      "Photography",
      "Architecture",
      "Art Direction",
    ];
  }
}

export const pixabayInspirationProvider = new PixabayInspirationProvider();
