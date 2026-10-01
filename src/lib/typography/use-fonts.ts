"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FontItem, FontQueryOptions, FontQueryResult } from "./types";
import { fontService } from "./font-service";

export interface UseFontsReturn {
  fonts: FontItem[];
  isLoading: boolean;
  error: string | null;
  isFallback: boolean;
  total: number;
  hasMore: boolean;
  options: FontQueryOptions;
  setOptions: (optionsOrUpdater: FontQueryOptions | ((prev: FontQueryOptions) => FontQueryOptions)) => void;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

/**
 * Hook for consuming fonts with loading, error, caching, and graceful fallback states.
 */
export function useFonts(initialOptions: FontQueryOptions = {}): UseFontsReturn {
  const [options, setOptionsState] = useState<FontQueryOptions>({
    sort: "popularity",
    limit: 50,
    offset: 0,
    ...initialOptions,
  });

  const [fonts, setFonts] = useState<FontItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const fetchIdRef = useRef(0);

  const fetchFonts = useCallback(async (opts: FontQueryOptions, append = false) => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const res: FontQueryResult = await fontService.getFonts(opts);

      // Avoid race conditions from rapid option changes
      if (currentFetchId !== fetchIdRef.current) return;

      setFonts((prev) => (append ? [...prev, ...res.fonts] : res.fonts));
      setTotal(res.total);
      setHasMore(res.hasMore);
      setIsFallback(Boolean(res.isFallback));
      if (res.error && res.fonts.length === 0) {
        setError(res.error);
      }
    } catch (err: any) {
      if (currentFetchId !== fetchIdRef.current) return;
      setError(err.message || "Failed to load fonts");
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchFonts(options);
  }, [fetchFonts, options]);

  const setOptions = useCallback(
    (optionsOrUpdater: FontQueryOptions | ((prev: FontQueryOptions) => FontQueryOptions)) => {
      setOptionsState((prev) => {
        const next = typeof optionsOrUpdater === "function" ? optionsOrUpdater(prev) : optionsOrUpdater;
        return { ...next, offset: 0 };
      });
    },
    []
  );

  const refetch = useCallback(async () => {
    await fetchFonts(options);
  }, [fetchFonts, options]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    const nextOffset = (options.offset || 0) + (options.limit || 50);
    const nextOptions = { ...options, offset: nextOffset };
    setOptionsState(nextOptions);
    await fetchFonts(nextOptions, true);
  }, [fetchFonts, hasMore, isLoading, options]);

  return {
    fonts,
    isLoading,
    error,
    isFallback,
    total,
    hasMore,
    options,
    setOptions,
    refetch,
    loadMore,
  };
}
