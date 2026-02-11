/**
 * Opinion Terminal Hooks
 *
 * React Query hooks for Opinion Terminal - Read Only
 * All data fetched directly from Opinion OpenAPI
 */

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  getOrderbook,
  getPriceHistory,
  getLatestPrice,
  getMarkets,
  getMarketDetails,
  getMarketsLight,
} from "@/lib/opinion/api";
import type { OpinionMarket } from "@/lib/opinion/types";

// ==================== Market Data Hooks ====================

/**
 * Fetch ALL markets for search (cached, light version without token enrichment)
 * Loads all pages and caches for 10 minutes
 * Note: Opinion API returns max 20 items per page regardless of limit requested
 */
export function useAllMarketsForSearch() {
  return useQuery({
    queryKey: ["opinion", "allMarketsSearch"],
    queryFn: async () => {
      const allMarkets: OpinionMarket[] = [];
      let page = 1;
      const seenIds = new Set<number>();
      const maxPages = 50; // Safety limit (50 pages * 20 = 1000 markets max)

      while (page <= maxPages) {
        const response = await getMarketsLight(page, 50, "activated");
        if (!response.success || !response.data?.list) break;

        const { list, total } = response.data;
        if (list.length === 0) break;

        const newMarkets = list.filter(m => !seenIds.has(m.marketId));
        newMarkets.forEach(m => seenIds.add(m.marketId));

        if (newMarkets.length === 0) break;
        allMarkets.push(...newMarkets);

        // Stop if we've loaded all markets
        if (allMarkets.length >= total) break;
        page++;
      }

      console.log(`[useAllMarketsForSearch] Cached ${allMarkets.length} markets`);
      return allMarkets;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Fetch Opinion markets with pagination
 */
export function useOpinionMarkets(page = 1, limit = 20, status = "activated") {
  return useQuery({
    queryKey: ["opinion", "markets", page, limit, status],
    queryFn: async () => {
      const response = await getMarkets(page, limit, status);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch markets");
      }
      return response.data;
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch Opinion markets with infinite scroll
 */
export function useInfiniteOpinionMarkets(limit = 20, status = "activated") {
  return useInfiniteQuery({
    queryKey: ["opinion", "markets", "infinite", limit, status],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getMarkets(pageParam, limit, status);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch markets");
      }
      return {
        ...response.data,
        page: pageParam,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / limit);
      if (lastPage.page < totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 0, // Always consider stale for navigation
    refetchOnMount: "always",
  });
}

/**
 * Search for a market in a list of markets
 * This handles both top-level markets and childMarkets of categorical markets
 */
function findMarketInList(
  markets: OpinionMarket[],
  marketId: number
): OpinionMarket | null {
  for (const market of markets) {
    // Check if it's the market we're looking for (binary market)
    if (market.marketId === marketId) {
      return market;
    }
    // Check childMarkets for categorical markets
    if (market.childMarkets) {
      const childMarket = market.childMarkets.find(
        (child) => child.marketId === marketId
      );
      if (childMarket) {
        return childMarket;
      }
    }
  }
  return null;
}

/**
 * Fetch single market details (includes both yesTokenId and noTokenId)
 * Always fetches fresh data - no cache
 */
export function useMarketDetails(marketId: number | null) {
  return useQuery({
    queryKey: ["opinion", "marketDetails", marketId],
    queryFn: async () => {
      if (!marketId) return null;

      console.log(`[useMarketDetails] Fetching market ${marketId}`);

      // Try direct API first
      const directResponse = await getMarketDetails(marketId);
      if (directResponse.success && directResponse.data) {
        console.log(`[useMarketDetails] Found market ${marketId} via direct API`);
        return directResponse.data;
      }

      // If direct API fails, search in markets list (for childMarkets)
      console.log(`[useMarketDetails] Direct API failed, searching markets list`);
      const pagesToFetch = 5;
      const limit = 50;

      for (let page = 1; page <= pagesToFetch; page++) {
        const response = await getMarkets(page, limit, "activated");
        if (response.success && response.data?.list) {
          const found = findMarketInList(response.data.list, marketId);
          if (found) {
            console.log(`[useMarketDetails] Found market ${marketId} on page ${page}`);
            return found;
          }
          if (response.data.list.length < limit) {
            break;
          }
        }
      }

      throw new Error("Market not found");
    },
    enabled: !!marketId,
    staleTime: 0, // Always fetch fresh
    gcTime: 1000 * 60, // Keep in cache for 1 minute for back navigation
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

/**
 * Check if a token ID is valid (not empty, no underscore, long enough)
 */
function isValidTokenId(tokenId: string | null): boolean {
  return !!(tokenId && tokenId !== "" && !tokenId.includes("_") && tokenId.length >= 50);
}

/**
 * Fetch real-time orderbook
 */
export function useOrderbook(tokenId: string | null) {
  const validToken = isValidTokenId(tokenId);

  return useQuery({
    queryKey: ["opinion", "orderbook", tokenId],
    queryFn: async () => {
      if (!tokenId || !validToken) return null;
      const response = await getOrderbook(tokenId);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch orderbook");
      }
      return response.data;
    },
    enabled: validToken,
    refetchInterval: 3000, // Poll every 3 seconds
    staleTime: 1000,
  });
}

/**
 * Fetch OHLCV price history for charts
 */
export function usePriceHistory(
  tokenId: string | null,
  interval = "1h",
  startAt?: number,
  endAt?: number
) {
  return useQuery({
    queryKey: ["opinion", "priceHistory", tokenId, interval, startAt, endAt],
    queryFn: async () => {
      if (!tokenId) return null;
      const response = await getPriceHistory(tokenId, interval, startAt, endAt);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch price history");
      }
      return response.data;
    },
    enabled: !!tokenId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Fetch current price
 */
export function useLatestPrice(tokenId: string | null) {
  return useQuery({
    queryKey: ["opinion", "price", tokenId],
    queryFn: async () => {
      if (!tokenId) return null;
      const response = await getLatestPrice(tokenId);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch price");
      }
      return response.data;
    },
    enabled: !!tokenId,
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 2000,
  });
}
