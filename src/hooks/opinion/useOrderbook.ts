/**
 * useOrderbook - Hook for fetching real-time orderbook data
 */

import { useQuery } from "@tanstack/react-query";
import { getOrderbook } from "@/lib/opinion/api";
import type { Orderbook } from "@/lib/opinion/types";

export function useOrderbook(tokenId: string | null) {
  return useQuery({
    queryKey: ["opinion", "orderbook", tokenId],
    queryFn: async () => {
      if (!tokenId) return null;
      const response = await getOrderbook(tokenId);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch orderbook");
      }
      return response.data;
    },
    enabled: !!tokenId,
    refetchInterval: 3000, // Poll every 3 seconds for real-time updates
    staleTime: 1000,
  });
}
