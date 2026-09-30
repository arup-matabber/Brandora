/**
 * Safe client-side storage helper for Opalite.
 *
 * Guarantees:
 * 1. Safe during SSR/prerendering (returns fallback immediately when window is undefined).
 * 2. Protected JSON parsing (corrupted or malformed storage never crashes the app).
 * 3. Quota handling (catches QuotaExceededError smoothly).
 * 4. Isolated keys (a corrupted single key does not invalidate or reset other keys).
 */

export const safeStorage = {
  /**
   * Safely retrieve and parse a JSON value from localStorage.
   */
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn(`[SafeStorage] Failed to parse key "${key}", falling back to default:`, e);
      return fallback;
    }
  },

  /**
   * Safely retrieve raw string from localStorage without JSON parsing.
   */
  getRaw(key: string, fallback: string = ""): string {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ?? fallback;
    } catch {
      return fallback;
    }
  },

  /**
   * Safely serialize and save a value to localStorage.
   */
  set<T>(key: string, value: T): boolean {
    if (typeof window === "undefined") return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[SafeStorage] Failed to save key "${key}":`, e);
      return false;
    }
  },

  /**
   * Safely set raw string in localStorage without JSON stringification.
   */
  setRaw(key: string, value: string): boolean {
    if (typeof window === "undefined") return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Safely remove an item from localStorage.
   */
  remove(key: string): boolean {
    if (typeof window === "undefined") return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if localStorage is supported and accessible.
   */
  isAvailable(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const testKey = "__opalite_test__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },
};
