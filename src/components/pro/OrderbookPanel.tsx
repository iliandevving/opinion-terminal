"use client";

import { Box, Flex, Text, Skeleton, VStack } from "@chakra-ui/react";
import { useOrderbook } from "@/hooks/opinion";

interface OrderbookPanelProps {
  tokenId: string;
  onPriceClick?: (price: number) => void;
}

export function OrderbookPanel({ tokenId, onPriceClick }: OrderbookPanelProps) {
  const isInvalidToken = !tokenId || tokenId === "" || tokenId.includes("_") || tokenId.length < 50;
  const { data: orderbook, isLoading, error } = useOrderbook(isInvalidToken ? null : tokenId);

  if (isInvalidToken) {
    return (
      <Flex h="100%" align="center" justify="center" p={4} direction="column" gap={2}>
        <Text color="orange.400" fontSize="sm">⚠️</Text>
        <Text color="gray.500" fontSize="xs">Invalid token</Text>
      </Flex>
    );
  }

  if (isLoading) return <OrderbookSkeleton />;
  if (error || !orderbook) {
    return (
      <Flex h="100%" align="center" justify="center" p={4}>
        <Text color="gray.600" fontSize="xs">Unable to load</Text>
      </Flex>
    );
  }

  const maxAmount = Math.max(...orderbook.asks.map((a) => a.amount), ...orderbook.bids.map((b) => b.amount), 1);

  return (
    <Box h="100%" display="flex" flexDirection="column">
      {/* Columns */}
      <Flex px={3} py={1.5} borderBottom="1px solid" borderColor="rgba(255,255,255,0.04)">
        <Text w="33%" color="gray.500" fontSize="xs">Price</Text>
        <Text w="33%" color="gray.500" fontSize="xs" textAlign="right">Size</Text>
        <Text w="34%" color="gray.500" fontSize="xs" textAlign="right">Total</Text>
      </Flex>

      {/* Content */}
      <Box flex={1} minH={0} overflowY="auto" px={1}>
        {/* Asks (reversed - lowest at bottom) */}
        <Box py={1}>
          {orderbook.asks.slice(0, 5).reverse().map((ask, i) => (
            <OrderRow key={`ask-${i}`} price={ask.price} amount={ask.amount} maxAmount={maxAmount} side="ask" onClick={() => onPriceClick?.(ask.price)} />
          ))}
        </Box>

        {/* Spread */}
        <Flex
          justify="center"
          align="center"
          py={3}
          my={1}
          borderTop="1px solid"
          borderBottom="1px solid"
          borderColor="rgba(255,255,255,0.06)"
          flexDirection="column"
          gap={0.5}
        >
          <Text color="white" fontSize="xl" fontWeight="600">
            {(orderbook.best_ask * 100).toFixed(1)}¢
          </Text>
          <Text color="gray.500" fontSize="xs">
            Spread {(orderbook.spread * 100).toFixed(2)}¢
          </Text>
        </Flex>

        {/* Bids */}
        <Box py={1}>
          {orderbook.bids.slice(0, 5).map((bid, i) => (
            <OrderRow key={`bid-${i}`} price={bid.price} amount={bid.amount} maxAmount={maxAmount} side="bid" onClick={() => onPriceClick?.(bid.price)} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function OrderRow({ price, amount, maxAmount, side, onClick }: {
  price: number; amount: number; maxAmount: number; side: "bid" | "ask"; onClick?: () => void;
}) {
  const depthPercent = Math.min((amount / maxAmount) * 100, 100);
  const isBid = side === "bid";
  const total = price * amount;

  return (
    <Flex
      position="relative"
      py={1.5}
      px={2}
      cursor="pointer"
      _hover={{ bg: "rgba(255,255,255,0.02)" }}
      onClick={onClick}
      borderRadius="md"
      overflow="hidden"
      align="center"
    >
      <Box
        position="absolute"
        top={0}
        bottom={0}
        right={0}
        width={`${depthPercent}%`}
        bg={isBid ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"}
      />
      <Text w="33%" color={isBid ? "#22c55e" : "#ef4444"} fontSize="xs" fontWeight="500" zIndex={1}>
        {(price * 100).toFixed(1)}¢
      </Text>
      <Text w="33%" color="gray.400" fontSize="xs" textAlign="right" zIndex={1}>
        {formatAmount(amount)}
      </Text>
      <Text w="34%" color="gray.500" fontSize="xs" textAlign="right" zIndex={1}>
        {formatAmount(total)}
      </Text>
    </Flex>
  );
}

function OrderbookSkeleton() {
  return (
    <VStack h="100%" p={4} gap={2} align="stretch">
      <Skeleton height="20px" borderRadius="lg" />
      <Skeleton height="20px" borderRadius="lg" />
      {[...Array(4)].map((_, i) => <Skeleton key={i} height="28px" borderRadius="lg" />)}
      <Skeleton height="60px" borderRadius="xl" />
      {[...Array(4)].map((_, i) => <Skeleton key={`b-${i}`} height="28px" borderRadius="lg" />)}
    </VStack>
  );
}

function formatAmount(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toFixed(0);
}
