/**
 * Opinion Terminal API Client
 *
 * Direct communication with Opinion OpenAPI - No external dependencies
 * Docs: https://docs.opinion.trade/developer-guide/opinion-open-api
 */

import type {
  Orderbook,
  PriceHistory,
  Position,
  Trade,
  ApiResponse,
  OpinionMarket,
} from "./types";

// Opinion API Configuration
// Use proxy route for client-side requests to avoid CORS issues
const OPINION_API_BASE_URL = typeof window !== "undefined"
  ? "/api/opinion"  // Client-side: use Next.js proxy
  : "https://openapi.opinion.trade/openapi";  // Server-side: direct call
const OPINION_API_KEY = process.env.NEXT_PUBLIC_OPINION_API_KEY || "";

// ==================== Market Data API ====================

/**
 * Fetch from Opinion API directly
 */
async function fetchOpinionApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${OPINION_API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Accept": "application/json",
    ...(OPINION_API_KEY ? { "apikey": OPINION_API_KEY } : {}),
    ...options.headers,
  };

  try {
    console.log(`[fetchOpinionApi] Fetching: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.log(`[fetchOpinionApi] Non-JSON response: ${text}`);
      return {
        success: false,
        data: null as unknown as T,
        error: text || "Non-JSON response from API",
      };
    }

    const data = await response.json();
    console.log(`[fetchOpinionApi] Response for ${endpoint}:`, { ok: response.ok, errno: data.errno, hasResult: !!data.result, data });

    // Opinion API returns errno/errmsg for errors
    // errno can be undefined for successful responses, so check explicitly
    if ((data.errno !== undefined && data.errno !== 0) || !response.ok) {
      console.log(`[fetchOpinionApi] Error detected: errno=${data.errno}, ok=${response.ok}`);
      return {
        success: false,
        data: null as unknown as T,
        error: data.errmsg || data.message || "Request failed",
      };
    }

    // Opinion API returns data in "result" field
    return {
      success: true,
      data: data.result || data,
    };
  } catch (error) {
    console.error(`[fetchOpinionApi] Exception:`, error);
    return {
      success: false,
      data: null as unknown as T,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Fetch market details and fill missing token IDs
 * The /market list API doesn't return token IDs, so we need to fetch details for each market
 * This includes both binary markets AND childMarkets of categorical markets
 */
async function enrichMarketsWithTokenIds(markets: OpinionMarket[]): Promise<OpinionMarket[]> {
  // Collect ALL market IDs that need token enrichment:
  // 1. Binary markets (marketType 0) without tokens
  // 2. ChildMarkets of categorical markets without tokens
  const marketsToEnrich: { marketId: number; isChild: boolean; parentId?: number }[] = [];

  for (const market of markets) {
    // Binary markets
    if (market.marketType === 0 && (!market.yesTokenId || !market.noTokenId)) {
      marketsToEnrich.push({ marketId: market.marketId, isChild: false });
    }
    // Categorical markets - check their children
    if (market.marketType === 1 && market.childMarkets) {
      for (const child of market.childMarkets) {
        if (!child.yesTokenId || !child.noTokenId) {
          marketsToEnrich.push({ marketId: child.marketId, isChild: true, parentId: market.marketId });
        }
      }
    }
  }

  console.log(`[getMarkets] Markets total: ${markets.length}, needing token enrichment: ${marketsToEnrich.length}`);

  if (marketsToEnrich.length === 0) {
    return markets;
  }

  console.log(`[getMarkets] Fetching details for ${marketsToEnrich.length} markets (binary + categorical children)`);

  // Fetch details in parallel (batch of 10 at a time to avoid rate limiting)
  const batchSize = 10;
  const enrichedMap = new Map<number, OpinionMarket>();

  for (let i = 0; i < marketsToEnrich.length; i += batchSize) {
    const batch = marketsToEnrich.slice(i, i + batchSize);
    const detailPromises = batch.map(m =>
      fetchOpinionApi<OpinionMarket>(`/market/${m.marketId}`)
    );

    const results = await Promise.all(detailPromises);

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const marketInfo = batch[j];

      if (result.success && result.data) {
        enrichedMap.set(marketInfo.marketId, {
          ...result.data,
          yesTokenId: result.data.yesTokenId,
          noTokenId: result.data.noTokenId,
        });
      }
    }

    // Log progress every 50 markets
    if ((i + batchSize) % 50 === 0 || i + batchSize >= marketsToEnrich.length) {
      console.log(`[getMarkets] Enriched ${Math.min(i + batchSize, marketsToEnrich.length)}/${marketsToEnrich.length} markets`);
    }
  }

  console.log(`[getMarkets] Enrichment complete. Got token IDs for ${enrichedMap.size} markets`);

  // Merge enriched data back into markets list
  return markets.map(market => {
    // Handle binary markets
    if (market.marketType === 0) {
      const enriched = enrichedMap.get(market.marketId);
      if (enriched) {
        return { ...market, yesTokenId: enriched.yesTokenId, noTokenId: enriched.noTokenId };
      }
    }
    // Handle categorical markets - enrich their children with parent reference
    if (market.marketType === 1 && market.childMarkets) {
      const enrichedChildren = market.childMarkets.map(child => {
        const enriched = enrichedMap.get(child.marketId);
        const baseChild = {
          ...child,
          parentMarketId: market.marketId,
          // Inherit parent's image if child doesn't have one
          thumbnailUrl: child.thumbnailUrl || market.thumbnailUrl,
          coverUrl: child.coverUrl || market.coverUrl,
          image: child.image || market.image,
          icon: child.icon || market.icon,
        };
        if (enriched) {
          return { ...baseChild, yesTokenId: enriched.yesTokenId, noTokenId: enriched.noTokenId };
        }
        return baseChild;
      });
      return { ...market, childMarkets: enrichedChildren };
    }
    return market;
  });
}

/**
 * Search markets by keyword (fetches all markets and filters client-side)
 * Opinion API doesn't support server-side search, so we load all and filter
 */
export async function searchMarkets(
  keyword: string
): Promise<ApiResponse<{ list: OpinionMarket[]; total: number }>> {
  const allMarkets: OpinionMarket[] = [];
  const limit = 50;
  let page = 1;
  const seenIds = new Set<number>();

  // Fetch all markets
  while (page <= 30) { // Max 1500 markets
    const response = await fetchOpinionApi<{ list: OpinionMarket[]; total: number }>(
      `/market?status=activated&marketType=2&sortby=5&chainid=56&page=${page}&limit=${limit}`
    );

    if (!response.success || !response.data?.list) break;

    const { list } = response.data;
    if (list.length === 0) break;

    // Filter duplicates
    const newMarkets = list.filter(m => !seenIds.has(m.marketId));
    newMarkets.forEach(m => seenIds.add(m.marketId));

    if (newMarkets.length === 0) break;

    allMarkets.push(...newMarkets);

    if (list.length < limit) break;
    page++;
  }

  // Filter by keyword (case-insensitive)
  const lowerKeyword = keyword.toLowerCase();
  const filtered = allMarkets.filter(m =>
    m.marketTitle.toLowerCase().includes(lowerKeyword)
  );

  return {
    success: true,
    data: {
      list: filtered.slice(0, 50), // Return max 50 results
      total: filtered.length,
    },
  };
}

/**
 * Get list of Opinion markets WITHOUT token enrichment (fast, for search)
 * Use this for search dropdowns where you only need titles and IDs
 */
export async function getMarketsLight(
  page = 1,
  limit = 50,
  status = "activated"
): Promise<ApiResponse<{ list: OpinionMarket[]; total: number }>> {
  const response = await fetchOpinionApi<{ list: OpinionMarket[]; total: number }>(
    `/market?status=${status}&marketType=2&sortby=5&chainid=56&page=${page}&limit=${limit}`
  );

  if (!response.success) {
    return {
      success: false,
      data: { list: [], total: 0 },
      error: response.error,
    };
  }

  return {
    success: true,
    data: {
      list: response.data?.list || [],
      total: response.data?.total || 0,
    },
  };
}

/**
 * Get list of Opinion markets (fetches all pages from Opinion API)
 * Uses the optimized endpoint with marketType=2 for all activated markets
 * sorted by volume on BSC chain (chainid=56)
 */
export async function getMarkets(
  page = 1,
  limit = 20,
  status = "activated"
): Promise<ApiResponse<{ list: OpinionMarket[]; total: number }>> {
  // Use the optimized endpoint: marketType=2 returns both binary and categorical
  // sortby=5 sorts by volume, chainid=56 is BSC
  const response = await fetchOpinionApi<{ list: OpinionMarket[]; total: number }>(
    `/market?status=${status}&marketType=2&sortby=5&chainid=56&page=${page}&limit=${limit}`
  );

  if (!response.success) {
    return {
      success: false,
      data: { list: [], total: 0 },
      error: response.error,
    };
  }

  const markets = response.data?.list || [];
  const total = response.data?.total || 0;

  // Enrich markets with missing token IDs
  const enrichedList = await enrichMarketsWithTokenIds(markets);

  return {
    success: true,
    data: {
      list: enrichedList,
      total,
    },
  };
}

/**
 * Get market details by ID (includes both yesTokenId and noTokenId)
 * Uses /topic endpoint as that's what Opinion API expects for single market lookup
 */
export async function getMarketDetails(marketId: number): Promise<ApiResponse<OpinionMarket>> {
  console.log(`[getMarketDetails] Fetching market ${marketId}`);
  const result = await fetchOpinionApi<OpinionMarket>(`/market/${marketId}`);
  console.log(`[getMarketDetails] Result for ${marketId}:`, result);
  return result;
}

// Raw API response types (what Opinion API actually returns)
interface RawOrderbookLevel {
  price: string;
  size: string;
}

interface RawOrderbookResponse {
  market: string;
  tokenId: string;
  timestamp: number;
  bids: RawOrderbookLevel[];
  asks: RawOrderbookLevel[];
}

/**
 * Get real-time orderbook for a token
 * Opinion API: GET /openapi/token/orderbook?token_id=xxx
 * Transforms raw API response to normalized Orderbook format
 */
export async function getOrderbook(tokenId: string): Promise<ApiResponse<Orderbook>> {
  const response = await fetchOpinionApi<RawOrderbookResponse>(`/token/orderbook?token_id=${encodeURIComponent(tokenId)}`);

  if (!response.success || !response.data) {
    return {
      success: false,
      data: null as unknown as Orderbook,
      error: response.error || "Failed to fetch orderbook",
    };
  }

  const raw = response.data;

  // Transform and sort bids (highest price first) and asks (lowest price first)
  const bids = (raw.bids || [])
    .map(b => ({ price: parseFloat(b.price), amount: parseFloat(b.size) }))
    .filter(b => !isNaN(b.price) && !isNaN(b.amount))
    .sort((a, b) => b.price - a.price);

  const asks = (raw.asks || [])
    .map(a => ({ price: parseFloat(a.price), amount: parseFloat(a.size) }))
    .filter(a => !isNaN(a.price) && !isNaN(a.amount))
    .sort((a, b) => a.price - b.price);

  const best_bid = bids.length > 0 ? bids[0].price : 0;
  const best_ask = asks.length > 0 ? asks[0].price : 1;
  const spread = best_ask - best_bid;
  const spread_percent = best_bid > 0 ? (spread / best_bid) * 100 : 0;

  return {
    success: true,
    data: {
      token_id: tokenId,
      bids,
      asks,
      best_bid,
      best_ask,
      spread,
      spread_percent,
      last_updated: new Date().toISOString(),
    },
  };
}

// Raw price history response
interface RawPricePoint {
  t: number;  // timestamp
  p: string;  // price
}

interface RawPriceHistoryResponse {
  history: RawPricePoint[];
}

/**
 * Get price history for charts
 * Opinion API: GET /openapi/token/price-history?token_id=xxx&interval=1h
 * Intervals: 1m, 1h, 1d, 1w, max
 * Transforms to OHLCV candle format (approximated from price-only data)
 */
export async function getPriceHistory(
  tokenId: string,
  interval = "1h",
  startAt?: number,
  endAt?: number
): Promise<ApiResponse<PriceHistory>> {
  let url = `/token/price-history?token_id=${encodeURIComponent(tokenId)}&interval=${interval}`;
  if (startAt) url += `&start_at=${startAt}`;
  if (endAt) url += `&end_at=${endAt}`;

  const response = await fetchOpinionApi<RawPriceHistoryResponse>(url);

  if (!response.success || !response.data) {
    return {
      success: false,
      data: null as unknown as PriceHistory,
      error: response.error || "Failed to fetch price history",
    };
  }

  const raw = response.data;
  const history = raw.history || [];

  // Transform to candle format - since we only have closing prices,
  // we'll approximate OHLC with the same price and zero volume
  const candles = history
    .map((point, index) => {
      const price = parseFloat(point.p);
      const prevPrice = index > 0 ? parseFloat(history[index - 1].p) : price;

      return {
        time: point.t,
        open: prevPrice,
        high: Math.max(price, prevPrice),
        low: Math.min(price, prevPrice),
        close: price,
        volume: 0,
      };
    })
    .filter(c => !isNaN(c.close))
    .sort((a, b) => a.time - b.time); // Ensure chronological order

  return {
    success: true,
    data: {
      token_id: tokenId,
      interval,
      candles,
    },
  };
}

/**
 * Get current price for a token
 * Opinion API: GET /openapi/token/latest-price?token_id=xxx
 */
export async function getLatestPrice(
  tokenId: string
): Promise<ApiResponse<{ token_id: string; price: number }>> {
  return fetchOpinionApi<{ token_id: string; price: number }>(`/token/latest-price?token_id=${encodeURIComponent(tokenId)}`);
}

// ==================== Public Trade Data ====================

/**
 * Get recent trades for a market (public data)
 * Opinion API: GET /openapi/trade/user/{walletAddress}
 */
export async function getRecentTrades(
  marketId: number,
  page = 1,
  limit = 20
): Promise<ApiResponse<{ trades: Trade[]; total: number }>> {
  // For public trades, we use market endpoint
  const response = await fetchOpinionApi<{ list: Trade[]; total: number }>(
    `/trade/market/${marketId}?page=${page}&limit=${limit}`
  );

  if (!response.success) {
    return { success: false, data: { trades: [], total: 0 }, error: response.error };
  }

  return {
    success: true,
    data: {
      trades: response.data?.list || [],
      total: response.data?.total || 0
    }
  };
}
