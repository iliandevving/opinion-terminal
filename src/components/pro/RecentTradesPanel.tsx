"use client";

import { Box, Flex, Text, Skeleton } from "@chakra-ui/react";
import { usePriceHistory } from "@/hooks/opinion";
import { useMemo } from "react";

interface RecentTradesPanelProps {
  tokenId: string;
}

interface TradeEntry {
  time: number;
  price: number;
  side: "buy" | "sell";
}

export function RecentTradesPanel({ tokenId }: RecentTradesPanelProps) {
  const { data: priceHistory, isLoading, error } = usePriceHistory(tokenId, "1h");

  const recentTrades = useMemo(() => {
    if (!priceHistory?.candles || priceHistory.candles.length === 0) return [];

    const trades: TradeEntry[] = [];
    const candles = priceHistory.candles.slice(-15);

    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      const prevCandle = candles[i - 1];
      const side: "buy" | "sell" = prevCandle ? (candle.close >= prevCandle.close ? "buy" : "sell") : "buy";

      trades.push({
        time: candle.time * 1000,
        price: candle.close,
        side,
      });
    }

    return trades.reverse();
  }, [priceHistory]);

  if (isLoading) return <TradesSkeleton />;

  if (error || recentTrades.length === 0) {
    return (
      <Flex h="100%" align="center" justify="center">
        <Text color="gray.600" fontSize="xs">No recent activity</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" h="100%" bg="transparent">
      {/* Column headers */}
      <Flex px={3} py={1.5} borderBottom="1px solid" borderColor="rgba(255,255,255,0.04)">
        <Text flex={1} color="gray.500" fontSize="xs">Price</Text>
        <Text flex={1} color="gray.500" fontSize="xs" textAlign="right">Time</Text>
      </Flex>

      {/* Trades list */}
      <Box flex={1} minH={0} overflowY="auto" px={1}>
        {recentTrades.slice(0, 8).map((trade, i) => (
          <TradeRow key={`trade-${i}`} trade={trade} />
        ))}
      </Box>
    </Flex>
  );
}

function TradeRow({ trade }: { trade: TradeEntry }) {
  const isBuy = trade.side === "buy";

  return (
    <Flex
      py={1.5}
      px={2}
      _hover={{ bg: "rgba(255,255,255,0.02)" }}
      borderRadius="md"
      align="center"
    >
      <Text
        flex={1}
        color={isBuy ? "#22c55e" : "#ef4444"}
        fontSize="xs"
        fontWeight="500"
      >
        {(trade.price * 100).toFixed(1)}¢
      </Text>
      <Text
        flex={1}
        color="gray.500"
        fontSize="xs"
        textAlign="right"
        suppressHydrationWarning
      >
        {formatTime(trade.time)}
      </Text>
    </Flex>
  );
}

function TradesSkeleton() {
  return (
    <Box p={4}>
      <Skeleton height="16px" mb={3} />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} height="20px" mb={2} />
      ))}
    </Box>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHrs < 1) {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins}m ago`;
  }
  if (diffHrs < 24) {
    return `${diffHrs}h ago`;
  }
  return date.toLocaleDateString();
}
