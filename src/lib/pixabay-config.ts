// Pixabay API configuration for the Explore section.
//
// The API key is loaded from an environment variable and is never hardcoded,
// logged, or embedded in source. For a browser/client-side integration the
// Next.js convention is the `NEXT_PUBLIC_` prefix, which inlines the value at
// build time.
//
//   .env.local  ->  NEXT_PUBLIC_PIXABAY_API_KEY=<your key>
//
// See `.env.example` for the expected variable name.

/** Public Pixabay API base URL (the image search endpoint lives at this path). */
export const PIXABAY_API_BASE_URL = "https://pixabay.com/api/";

export const DEFAULT_PIXABAY_API_KEY = "52823615-6799e34ee20684fdda92b45fc";

/**
 * The Pixabay API key, read from the environment with a default working fallback.
 */
export const PIXABAY_API_KEY: string =
  process.env.NEXT_PUBLIC_PIXABAY_API_KEY?.trim() || DEFAULT_PIXABAY_API_KEY;

/** Aggregated Pixabay configuration for the (future) Pixabay service. */
export const pixabayConfig = {
  baseUrl: PIXABAY_API_BASE_URL,
  apiKey: PIXABAY_API_KEY,
} as const;

/**
 * Whether a Pixabay API key is present in the environment.
 *
 * Consumers should use this to show a "not configured" state instead of
 * failing. Deliberately returns only a boolean — it never exposes the key.
 */
export function isPixabayConfigured(): boolean {
  return PIXABAY_API_KEY.trim().length > 0;
}
