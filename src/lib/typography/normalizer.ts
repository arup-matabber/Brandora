import { FontItem, FontCategory } from "./types";

/**
 * Raw item schema returned by the official Google Fonts Webfonts v1 API.
 */
export interface RawGoogleWebfont {
  family: string;
  variants?: string[];
  subsets?: string[];
  version?: string;
  lastModified?: string;
  files?: Record<string, string>;
  category?: string;
  kind?: string;
  menu?: string;
}

/**
 * Raw item schema returned by Google Fonts official live metadata catalogue.
 */
export interface RawGoogleMetadataFont {
  family: string;
  category?: string;
  size?: number;
  subsets?: string[];
  fonts?: Record<string, any>;
  axes?: Array<{ tag: string; min: number; max: number; defaultValue: number }>;
  designers?: string[];
  lastModified?: string;
  dateAdded?: string;
  popularity?: number;
  trending?: number;
  defaultSort?: number;
}

/**
 * Normalizes a URL to HTTPS if it starts with HTTP.
 */
function toHttps(url: string | undefined): string {
  if (!url) return "";
  return url.replace(/^http:\/\//i, "https://");
}

/**
 * Creates a URL-safe, unique slug from a font family name.
 */
export function slugifyFamily(family: string): string {
  return family
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalizes a raw Google Fonts Webfont API item into Opalite's internal FontItem model.
 * Guarantees variants, subsets, and files are structured consistently.
 */
export function normalizeGoogleFont(raw: RawGoogleWebfont): FontItem {
  const family = (raw.family || "Unknown Font").trim();
  const id = slugifyFamily(family) || `font-${Math.random().toString(36).slice(2, 8)}`;

  // Normalize files mapping to HTTPS
  const files: Record<string, string> = {};
  if (raw.files && typeof raw.files === "object") {
    for (const [variant, url] of Object.entries(raw.files)) {
      if (typeof url === "string") {
        files[variant] = toHttps(url);
      }
    }
  }

  // Preserve variants array or default to regular
  const variants = Array.isArray(raw.variants) && raw.variants.length > 0
    ? [...raw.variants]
    : ["regular"];

  // Preserve subsets
  const subsets = Array.isArray(raw.subsets) ? [...raw.subsets] : ["latin"];

  // Normalize category
  const category: FontCategory = raw.category?.toLowerCase() || "sans-serif";

  return {
    id,
    family,
    category,
    variants,
    subsets,
    files,
    provider: "google",
    version: raw.version,
    lastModified: raw.lastModified,
    menu: raw.menu ? toHttps(raw.menu) : undefined,
  };
}

/**
 * Normalizes an item from Google Fonts live metadata directory.
 */
export function normalizeMetadataFont(raw: RawGoogleMetadataFont): FontItem {
  const family = (raw.family || "Unknown Font").trim();
  const id = slugifyFamily(family) || `font-${Math.random().toString(36).slice(2, 8)}`;

  // Normalize category
  let category: FontCategory = "sans-serif";
  const rawCat = (raw.category || "").toLowerCase().replace(/[\s_-]+/g, "");
  if (rawCat.includes("serif") && !rawCat.includes("sans")) category = "serif";
  else if (rawCat.includes("mono")) category = "monospace";
  else if (rawCat.includes("display")) category = "display";
  else if (rawCat.includes("handwriting") || rawCat.includes("script")) category = "handwriting";
  else category = "sans-serif";

  // Normalize variants from raw.fonts keys
  const variantKeys = raw.fonts ? Object.keys(raw.fonts) : [];
  let variants: string[] = [];
  if (variantKeys.length > 0) {
    variants = variantKeys.map((k) => {
      if (k === "400") return "regular";
      if (k === "400i") return "italic";
      if (k.endsWith("i")) return `${k.slice(0, -1)}italic`;
      return k;
    });
  } else {
    variants = ["regular"];
  }

  // Preserve subsets
  const subsets = Array.isArray(raw.subsets)
    ? raw.subsets.filter((s) => s !== "menu")
    : ["latin"];

  return {
    id,
    family,
    category,
    variants,
    subsets: subsets.length > 0 ? subsets : ["latin"],
    files: {},
    provider: "google",
    version: raw.dateAdded,
    lastModified: raw.lastModified,
  };
}
