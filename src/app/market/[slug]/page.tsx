"use client";

import { Box, Flex, Text, HStack, Spinner, VStack } from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMarketDetails, useOrderbook } from "@/hooks/opinion";
import { OrderbookPanel } from "@/components/pro/OrderbookPanel";
import { RecentTradesPanel } from "@/components/pro/RecentTradesPanel";
import { parseMarketSlug } from "@/lib/utils/slug";

const CandlestickChart = dynamic(
  () => import("@/components/pro/CandlestickChart").then((mod) => mod.CandlestickChart),
  { ssr: false, loading: () => <Flex h="100%" align="center" justify="center"><Text color="gray.600">Loading...</Text></Flex> }
);

// Get category icon based on market title
function getCategoryIcon(title?: string): string {
  if (!title) return "📊";
  const lower = title.toLowerCase();
  if (lower.includes("bitcoin") || lower.includes("btc")) return "₿";
  if (lower.includes("eth")) return "Ξ";
  if (lower.includes("bnb")) return "🟡";
  if (lower.includes("sol")) return "◎";
  if (lower.includes("gold")) return "🥇";
  if (lower.includes("ecb") || lower.includes("rate")) return "🏦";
  if (lower.includes("oscar") || lower.includes("grammy")) return "🏆";
  if (lower.includes("nba") || lower.includes("nfl") || lower.includes("sport")) return "🏀";
  if (lower.includes("election") || lower.includes("president")) return "🏛️";
  if (lower.includes("spacex") || lower.includes("launch")) return "🚀";
  return "📊";
}

// Outcome Button for Terminal View
function OutcomeButton({ label, tokenId, isSelected, onClick, variant = "default", compact = false }: {
  label: string; tokenId: string; isSelected: boolean; onClick: () => void; variant?: "default" | "yes" | "no"; compact?: boolean;
}) {
  const isInvalidToken = !tokenId || tokenId === "" || tokenId.includes("_") || tokenId.length < 50;
  const { data: orderbook, isLoading } = useOrderbook(isInvalidToken ? null : tokenId);
  const price = ((orderbook?.best_ask ?? 0) * 100).toFixed(1);

  const colors = {
    yes: { bg: "rgba(34, 197, 94, 0.1)", border: "green.500", text: "green.400" },
    no: { bg: "rgba(239, 68, 68, 0.1)", border: "red.500", text: "red.400" },
    default: { bg: "rgba(238, 99, 50, 0.1)", border: "orange.500", text: "orange.400" },
  };
  const c = colors[variant];

  return (
    <Flex
      as="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={`${label} at ${isInvalidToken ? "unavailable" : `${price} cents`}`}
      flex={1}
      direction="column"
      align="center"
      justify="center"
      py={compact ? 2 : 2.5}
      bg={isSelected ? c.bg : "transparent"}
      borderRadius="xl"
      cursor="pointer"
      onClick={onClick}
      border="2px solid"
      borderColor={isSelected ? c.border : "rgba(255,255,255,0.08)"}
      _hover={{
        bg: c.bg,
        borderColor: isSelected ? c.border : "rgba(255,255,255,0.15)",
      }}
      _focusVisible={{
        outline: "2px solid",
        outlineColor: "orange.500",
        outlineOffset: "2px"
      }}
      transition="all 0.2s"
    >
      <Text color={isSelected ? c.text : "gray.500"} fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="wider">
        {label}
      </Text>
      <Text color={isInvalidToken ? "gray.600" : "white"} fontSize={compact ? "md" : "lg"} fontWeight="bold" mt={0.5} suppressHydrationWarning>
        {isInvalidToken ? "—" : isLoading ? "..." : `${price}¢`}
      </Text>
    </Flex>
  );
}

// Mobile Orderbook Component - Vertical stacked view with depth bars
function MobileOrderbookSummary({ tokenId }: { tokenId: string | null }) {
  const { data: orderbook } = useOrderbook(tokenId);

  if (!tokenId || !orderbook) return null;

  const topBids = orderbook.bids.slice(0, 5);
  const topAsks = orderbook.asks.slice(0, 5).reverse(); // Reverse so highest ask is at bottom

  // Calculate max amount for depth bar scaling
  const allAmounts = [...topBids, ...topAsks].map(o => o.amount);
  const maxAmount = Math.max(...allAmounts, 1);

  return (
    <Box>
      {/* Header with spread */}
      <Flex justify="space-between" align="center" mb={2} pt={1} borderTop="1px solid" borderColor="rgba(255,255,255,0.06)">
        <HStack gap={2} pt={2}>
          <Text color="gray.600" fontSize="9px">SPREAD</Text>
          <Text color="orange.400" fontSize="xs" fontWeight="600">
            {((orderbook.spread || 0) * 100).toFixed(1)}¢
          </Text>
        </HStack>
      </Flex>

      {/* Column Headers */}
      <Flex justify="space-between" mb={1} px={1}>
        <Text color="gray.600" fontSize="9px" fontWeight="600">PRICE</Text>
        <Text color="gray.600" fontSize="9px" fontWeight="600">SIZE</Text>
      </Flex>

      {/* Asks (sells) - top */}
      <VStack align="stretch" gap={0.5} mb={2}>
        {topAsks.length > 0 ? topAsks.map((ask, i) => (
          <Box key={`ask-${i}`} position="relative" h="22px">
            {/* Depth bar */}
            <Box
              position="absolute"
              right={0}
              top={0}
              bottom={0}
              w={`${(ask.amount / maxAmount) * 100}%`}
              bg="rgba(239, 68, 68, 0.15)"
              borderRadius="sm"
            />
            {/* Content */}
            <Flex justify="space-between" align="center" position="relative" h="100%" px={1}>
              <Text color="red.400" fontSize="xs" fontWeight="500">{(ask.price * 100).toFixed(1)}¢</Text>
              <Text color="gray.400" fontSize="xs">{ask.amount.toFixed(0)}</Text>
            </Flex>
          </Box>
        )) : (
          <Text color="gray.600" fontSize="xs" textAlign="center" py={2}>No asks</Text>
        )}
      </VStack>

      {/* Spread divider */}
      <Flex align="center" gap={2} py={1.5} mb={2}>
        <Box flex={1} h="1px" bg="rgba(255,255,255,0.1)" />
        <Text color="gray.500" fontSize="10px">
          {orderbook.best_ask ? `${(orderbook.best_ask * 100).toFixed(1)}¢` : "—"}
        </Text>
        <Box flex={1} h="1px" bg="rgba(255,255,255,0.1)" />
      </Flex>

      {/* Bids (buys) - bottom */}
      <VStack align="stretch" gap={0.5}>
        {topBids.length > 0 ? topBids.map((bid, i) => (
          <Box key={`bid-${i}`} position="relative" h="22px">
            {/* Depth bar */}
            <Box
              position="absolute"
              right={0}
              top={0}
              bottom={0}
              w={`${(bid.amount / maxAmount) * 100}%`}
              bg="rgba(34, 197, 94, 0.15)"
              borderRadius="sm"
            />
            {/* Content */}
            <Flex justify="space-between" align="center" position="relative" h="100%" px={1}>
              <Text color="green.400" fontSize="xs" fontWeight="500">{(bid.price * 100).toFixed(1)}¢</Text>
              <Text color="gray.400" fontSize="xs">{bid.amount.toFixed(0)}</Text>
            </Flex>
          </Box>
        )) : (
          <Text color="gray.600" fontSize="xs" textAlign="center" py={2}>No bids</Text>
        )}
      </VStack>
    </Box>
  );
}

export default function MarketPage() {
  const params = useParams();
  // Handle slug as string or string[] (Next.js dynamic routes)
  const rawSlug = params.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const marketId = slug ? parseMarketSlug(slug) : null;

  const [selectedOutcome, setSelectedOutcome] = useState<"yes" | "no">("yes");
  const [selectedSibling, setSelectedSibling] = useState<string | null>(null);
  const [siblingYesNo, setSiblingYesNo] = useState<"yes" | "no">("yes");
  const [showMobileOrderbook, setShowMobileOrderbook] = useState(false);

  const { data: market, isLoading, isFetched, error } = useMarketDetails(marketId);

  const isCategorical = market?.marketType === 1 && market?.childMarkets && market.childMarkets.length > 0;

  // Get siblings for categorical markets
  const siblings = useMemo(() => {
    if (!isCategorical || !market?.childMarkets) return [];
    return market.childMarkets.map(child => ({
      id: child.marketId.toString(),
      label: child.marketTitle || child.yesLabel || "Option",
      yesTokenId: child.yesTokenId || "",
      noTokenId: child.noTokenId || "",
    }));
  }, [market, isCategorical]);

  const activeSibling = useMemo(() => {
    if (!isCategorical || !siblings.length) return null;
    const siblingId = selectedSibling || siblings[0]?.id;
    return siblings.find(s => s.id === siblingId) || siblings[0];
  }, [isCategorical, siblings, selectedSibling]);

  // Get active token ID for chart/orderbook
  const activeTokenId = useMemo(() => {
    if (!market) return null;
    if (isCategorical && activeSibling) {
      return siblingYesNo === "yes" ? activeSibling.yesTokenId : activeSibling.noTokenId;
    }
    return selectedOutcome === "yes" ? market.yesTokenId : market.noTokenId;
  }, [market, selectedOutcome, isCategorical, activeSibling, siblingYesNo]);

  const activeLabel = useMemo(() => {
    if (!market) return "";
    if (isCategorical && activeSibling) {
      return `${activeSibling.label} ${siblingYesNo.toUpperCase()}`;
    }
    return selectedOutcome === "yes" ? (market.yesLabel || "YES") : (market.noLabel || "NO");
  }, [market, selectedOutcome, isCategorical, activeSibling, siblingYesNo]);


  // Show loading while slug is being parsed or data is being fetched
  if (!slug || isLoading || (marketId && !isFetched)) {
    return (
      <Box h="100vh" bg="#000" display="flex" alignItems="center" justifyContent="center" role="status" aria-label="Loading market data">
        <Spinner color="#EE6332" size="lg" />
      </Box>
    );
  }

  // Show error if marketId is invalid or market not found after fetch
  if (!marketId || error || !market) {
    return (
      <Box h="100vh" bg="#000" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={4} role="alert">
        <Text color="gray.400" fontSize="lg">Market not found</Text>
        <Link href="/">
          <Text color="#EE6332" fontSize="sm" cursor="pointer" _hover={{ textDecoration: "underline" }}>
            ← Back to Markets
          </Text>
        </Link>
      </Box>
    );
  }

  const marketImage = market.thumbnailUrl || market.coverUrl || market.image || market.icon;
  const volume = market.volume24h ? (Number(market.volume24h) / 1000000).toFixed(2) : null;

  return (
    <Box h="100vh" bg="#000" display="flex" flexDirection="column" overflow="hidden">
      {/* Header */}
      <Flex
        as="header"
        h="56px"
        px={{ base: 3, md: 5 }}
        align="center"
        justify="space-between"
        borderBottom="1px solid"
        borderColor="rgba(255,255,255,0.06)"
        flexShrink={0}
        bg="#000"
        position="relative"
      >
        {/* Left - Logo */}
        <Link href="/" aria-label="Go to homepage">
          <HStack gap={2} cursor="pointer" _hover={{ opacity: 0.8 }} transition="opacity 0.15s">
            <Flex
              w="24px"
              h="24px"
              borderRadius="full"
              border="2px solid"
              borderColor="#EE6332"
              align="center"
              justify="center"
              aria-hidden="true"
            >
              <Box w="10px" h="10px" borderRadius="full" bg="#EE6332" />
            </Flex>
            <Text
              color="white"
              fontSize={{ base: "sm", md: "md" }}
              fontWeight="600"
              fontFamily="var(--font-manrope), 'Manrope', sans-serif"
            >
              OPINION TERMINAL
            </Text>
          </HStack>
        </Link>

        {/* Right - Connect Wallet */}
        <HStack gap={3}>
          <Box position="relative" cursor="not-allowed" display={{ base: "none", md: "block" }}>
            <Flex
              align="center"
              gap={2}
              px={4}
              h="36px"
              bg="rgba(255,255,255,0.03)"
              border="1px solid"
              borderColor="rgba(255,255,255,0.08)"
              borderRadius="full"
              opacity={0.7}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" aria-hidden="true">
                <path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <Text color="gray.400" fontSize="sm" fontWeight="500">Connect Wallet</Text>
            </Flex>
            <Box position="absolute" top="-6px" right="-6px" bg="#EE6332" px={1.5} py={0.5} borderRadius="full">
              <Text color="white" fontSize="8px" fontWeight="700">SOON</Text>
            </Box>
          </Box>
        </HStack>
      </Flex>

      {/* Back Arrow + Search Bar */}
      <Flex
        px={{ base: 3, md: 4 }}
        pt={{ base: 3, md: 4 }}
        gap={3}
        align="center"
        flexShrink={0}
      >
        {/* Back Button */}
        <Link href="/" aria-label="Back to markets list">
          <Flex
            align="center"
            justify="center"
            w="40px"
            h="40px"
            cursor="pointer"
            borderRadius="full"
            bg="rgba(255,255,255,0.05)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            _hover={{ bg: "rgba(255,255,255,0.1)" }}
            _focusVisible={{
              outline: "2px solid",
              outlineColor: "orange.500",
              outlineOffset: "2px"
            }}
            transition="all 0.15s"
            flexShrink={0}
          >
            <Text color="white" fontSize="lg" aria-hidden="true">←</Text>
          </Flex>
        </Link>

        {/* Search Input */}
        <Flex
          align="center"
          gap={2}
          bg="rgba(255,255,255,0.03)"
          border="1px solid"
          borderColor="rgba(255,255,255,0.08)"
          borderRadius="full"
          px={3}
          h="36px"
          flex={1}
          maxW="600px"
          _focusWithin={{ borderColor: "orange.500" }}
          transition="border-color 0.15s"
        >
          <Text color="gray.500" fontSize="sm" aria-hidden="true">🔍</Text>
          <Box
            as="input"
            placeholder="Search Markets"
            aria-label="Search markets"
            border="none"
            outline="none"
            bg="transparent"
            color="white"
            fontSize="sm"
            flex={1}
            _placeholder={{ color: "gray.500" }}
          />
        </Flex>
      </Flex>

      {/* Main Content */}
      <Flex flex={1} direction={{ base: "column", lg: "row" }} gap={{ base: 3, md: 4 }} overflow="hidden" p={{ base: 3, md: 4 }} pt={{ base: 2, md: 3 }}>
        {/* Left Column: Title + Chart + Recent Trades */}
        <Flex flex={1} direction="column" gap={3} minW={0} overflow={{ base: "auto", lg: "hidden" }} pr={{ base: 1, lg: 0 }}>

          {/* Row 1: Title, Description, Link */}
          <Box
            bg="rgba(255,255,255,0.02)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            borderRadius="xl"
            p={{ base: 3, md: 4 }}
            flexShrink={0}
          >
            <Flex gap={{ base: 3, md: 4 }} align="start">
              {/* Market Image */}
              <Flex
                w={{ base: "48px", md: "64px" }}
                h={{ base: "48px", md: "64px" }}
                borderRadius="xl"
                bg="#1a1a1a"
                align="center"
                justify="center"
                flexShrink={0}
                overflow="hidden"
              >
                {marketImage ? (
                  <img src={marketImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Text fontSize={{ base: "xl", md: "2xl" }} aria-hidden="true">{getCategoryIcon(market.marketTitle)}</Text>
                )}
              </Flex>

              {/* Title + Info */}
              <Box flex={1} minW={0}>
                <Text as="h1" color="white" fontSize={{ base: "md", md: "lg" }} fontWeight="600" lineHeight="1.3" mb={2}>
                  {market.marketTitle}
                </Text>
                <HStack gap={{ base: 2, md: 4 }} flexWrap="wrap">
                  {/* Volume */}
                  <HStack gap={1.5}>
                    <svg width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <g fill="none" fillRule="evenodd">
                        <circle cx="16" cy="16" r="16" fill="#26A17B"/>
                        <path fill="#FFF" d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"/>
                      </g>
                    </svg>
                    <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }}>{volume || "—"}M USDT</Text>
                  </HStack>
                  {/* Closing Date */}
                  {market.cutoffAt && market.cutoffAt > 0 && (
                    <HStack gap={1.5} display={{ base: "none", sm: "flex" }}>
                      <Text color="gray.500" fontSize="sm">Closes:</Text>
                      <Text color="gray.300" fontSize="sm">
                        {new Date(market.cutoffAt * 1000).toLocaleDateString()}
                      </Text>
                    </HStack>
                  )}
                  {/* Link to Opinion */}
                  <Flex
                    as="a"
                    href={`https://app.opinion.trade/detail?topicId=${market.marketId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    align="center"
                    gap={1}
                    color="#EE6332"
                    fontSize={{ base: "xs", md: "sm" }}
                    _hover={{ textDecoration: "underline" }}
                    _focusVisible={{
                      outline: "2px solid",
                      outlineColor: "orange.500",
                      outlineOffset: "2px"
                    }}
                    aria-label="View this market on Opinion Trade (opens in new tab)"
                  >
                    <Text>View on Opinion</Text>
                    <Text aria-hidden="true">↗</Text>
                  </Flex>
                </HStack>
              </Box>
            </Flex>

            {/* Categorical Markets Selector */}
            {isCategorical && (
              <Flex
                mt={4}
                pt={4}
                borderTop="1px solid"
                borderColor="rgba(255,255,255,0.06)"
                gap={2}
                overflowX="auto"
                role="tablist"
                aria-label="Market options"
              >
                {siblings.map((s) => {
                  const isActive = selectedSibling === s.id || (!selectedSibling && siblings[0]?.id === s.id);
                  return (
                    <Box
                      key={s.id}
                      as="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`panel-${s.id}`}
                      px={3}
                      py={1.5}
                      borderRadius="full"
                      cursor="pointer"
                      bg={isActive ? "rgba(168, 85, 247, 0.15)" : "transparent"}
                      border="1px solid"
                      borderColor={isActive ? "purple.500" : "rgba(255,255,255,0.1)"}
                      onClick={() => setSelectedSibling(s.id)}
                      _hover={{ bg: isActive ? "rgba(168, 85, 247, 0.2)" : "rgba(255,255,255,0.05)" }}
                      _focusVisible={{
                        outline: "2px solid",
                        outlineColor: "orange.500",
                        outlineOffset: "2px"
                      }}
                      transition="all 0.15s"
                      flexShrink={0}
                    >
                      <Text color={isActive ? "white" : "gray.400"} fontSize="sm" fontWeight={isActive ? "600" : "400"}>
                        {s.label}
                      </Text>
                    </Box>
                  );
                })}
              </Flex>
            )}
          </Box>

          {/* Mobile: Outcomes Selector */}
          <Box
            display={{ base: "block", lg: "none" }}
            bg="rgba(255,255,255,0.02)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            borderRadius="xl"
            p={3}
            flexShrink={0}
          >
            <Text color="gray.500" fontSize="xs" fontWeight="600" mb={2}>SELECT OUTCOME</Text>
            <HStack gap={2} role="radiogroup" aria-label="Select outcome">
              {isCategorical && activeSibling ? (
                <>
                  <OutcomeButton
                    label="YES"
                    tokenId={activeSibling.yesTokenId}
                    isSelected={siblingYesNo === "yes"}
                    onClick={() => setSiblingYesNo("yes")}
                    variant="yes"
                    compact
                  />
                  <OutcomeButton
                    label="NO"
                    tokenId={activeSibling.noTokenId}
                    isSelected={siblingYesNo === "no"}
                    onClick={() => setSiblingYesNo("no")}
                    variant="no"
                    compact
                  />
                </>
              ) : (
                <>
                  <OutcomeButton
                    label={market.yesLabel || "YES"}
                    tokenId={market.yesTokenId || ""}
                    isSelected={selectedOutcome === "yes"}
                    onClick={() => setSelectedOutcome("yes")}
                    variant="yes"
                    compact
                  />
                  <OutcomeButton
                    label={market.noLabel || "NO"}
                    tokenId={market.noTokenId || ""}
                    isSelected={selectedOutcome === "no"}
                    onClick={() => setSelectedOutcome("no")}
                    variant="no"
                    compact
                  />
                </>
              )}
            </HStack>
          </Box>

          {/* Row 2: Chart */}
          <Box
            flex={{ base: "none", lg: 1 }}
            h={{ base: "250px", sm: "300px", lg: "auto" }}
            minH={{ lg: "300px" }}
            bg="rgba(255,255,255,0.02)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            borderRadius="xl"
            overflow="hidden"
          >
            {activeTokenId ? (
              <CandlestickChart tokenId={activeTokenId} marketTitle={activeLabel} />
            ) : (
              <Flex h="100%" align="center" justify="center">
                <Text color="gray.600" fontSize="sm">Select an outcome to view chart</Text>
              </Flex>
            )}
          </Box>

          {/* Mobile: Orderbook (collapsible card) */}
          <Box
            display={{ base: "block", lg: "none" }}
            bg="rgba(255,255,255,0.02)"
            border="1px solid"
            borderColor={showMobileOrderbook ? "orange.500" : "rgba(255,255,255,0.08)"}
            borderRadius="xl"
            overflow="hidden"
            transition="border-color 0.2s"
            flexShrink={0}
          >
            {/* Header/Toggle */}
            <Flex
              as="button"
              onClick={() => setShowMobileOrderbook(!showMobileOrderbook)}
              aria-expanded={showMobileOrderbook}
              aria-controls="mobile-orderbook"
              align="center"
              justify="space-between"
              w="100%"
              p={3}
              cursor="pointer"
              _active={{ bg: "rgba(255,255,255,0.03)" }}
            >
              <HStack gap={2}>
                <Box
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg={showMobileOrderbook ? "orange.400" : "gray.500"}
                  transition="background 0.2s"
                />
                <Text color={showMobileOrderbook ? "orange.400" : "white"} fontSize="sm" fontWeight="600" transition="color 0.2s">
                  Orderbook
                </Text>
              </HStack>
              <Text color="gray.400" fontSize="lg" transition="transform 0.2s" transform={showMobileOrderbook ? "rotate(180deg)" : "rotate(0)"}>
                ▾
              </Text>
            </Flex>

            {/* Content */}
            {showMobileOrderbook && (
              <Box id="mobile-orderbook" px={3} pb={3} pt={0}>
                <MobileOrderbookSummary tokenId={activeTokenId} />
              </Box>
            )}
          </Box>

          {/* Row 3: Recent Trades */}
          <Box
            h={{ base: "280px", md: "200px" }}
            bg="rgba(255,255,255,0.02)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            borderRadius="xl"
            overflow="hidden"
            flexShrink={0}
          >
            <Flex h="100%" direction="column">
              <Text as="h2" color="gray.500" fontSize="xs" fontWeight="600" p={3} pb={2}>RECENT TRADES</Text>
              <Box flex={1} overflow="hidden">
                {activeTokenId ? (
                  <RecentTradesPanel tokenId={activeTokenId} />
                ) : (
                  <Flex h="100%" align="center" justify="center">
                    <Text color="gray.700" fontSize="sm">—</Text>
                  </Flex>
                )}
              </Box>
            </Flex>
          </Box>
        </Flex>

        {/* Right Column: Outcomes + Orderbook (Desktop only) */}
        <Flex w="280px" direction="column" gap={4} flexShrink={0} display={{ base: "none", lg: "flex" }}>
          {/* Outcomes */}
          <Box
            bg="rgba(255,255,255,0.02)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            borderRadius="xl"
            p={3}
            flexShrink={0}
          >
            <Text as="h2" color="gray.500" fontSize="xs" fontWeight="600" mb={2}>SELECT OUTCOME</Text>
            <HStack gap={2} role="radiogroup" aria-label="Select outcome">
              {isCategorical && activeSibling ? (
                <>
                  <OutcomeButton
                    label="YES"
                    tokenId={activeSibling.yesTokenId}
                    isSelected={siblingYesNo === "yes"}
                    onClick={() => setSiblingYesNo("yes")}
                    variant="yes"
                  />
                  <OutcomeButton
                    label="NO"
                    tokenId={activeSibling.noTokenId}
                    isSelected={siblingYesNo === "no"}
                    onClick={() => setSiblingYesNo("no")}
                    variant="no"
                  />
                </>
              ) : (
                <>
                  <OutcomeButton
                    label={market.yesLabel || "YES"}
                    tokenId={market.yesTokenId || ""}
                    isSelected={selectedOutcome === "yes"}
                    onClick={() => setSelectedOutcome("yes")}
                    variant="yes"
                  />
                  <OutcomeButton
                    label={market.noLabel || "NO"}
                    tokenId={market.noTokenId || ""}
                    isSelected={selectedOutcome === "no"}
                    onClick={() => setSelectedOutcome("no")}
                    variant="no"
                  />
                </>
              )}
            </HStack>
          </Box>

          {/* Orderbook */}
          <Box
            flex={1}
            bg="rgba(255,255,255,0.02)"
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            borderRadius="xl"
            overflow="hidden"
          >
            <Flex h="100%" direction="column">
              <Text as="h2" color="gray.500" fontSize="xs" fontWeight="600" p={3} pb={2}>ORDERBOOK</Text>
              <Box flex={1} overflow="hidden">
                {activeTokenId ? (
                  <OrderbookPanel tokenId={activeTokenId} />
                ) : (
                  <Flex h="100%" align="center" justify="center">
                    <Text color="gray.700" fontSize="sm">—</Text>
                  </Flex>
                )}
              </Box>
            </Flex>
          </Box>
        </Flex>
      </Flex>

      {/* Footer */}
      <Flex
        as="footer"
        role="contentinfo"
        h="36px"
        px={{ base: 3, md: 6 }}
        align="center"
        justify="space-between"
        borderTop="1px solid"
        borderColor="rgba(255,255,255,0.06)"
        flexShrink={0}
        bg="#000"
      >
        <HStack gap={{ base: 2, md: 4 }}>
          <HStack gap={1.5} aria-label="Status: Live">
            <Box w="6px" h="6px" borderRadius="full" bg="#22c55e" aria-hidden="true" />
            <Text color="gray.500" fontSize="xs">Live</Text>
          </HStack>
          <Text color="gray.600" fontSize="xs">v0.1.0</Text>
        </HStack>
        <HStack as="nav" aria-label="Footer links" gap={{ base: 3, md: 6 }}>
          <Text color="gray.500" fontSize="xs" cursor="not-allowed" opacity={0.5} title="Coming Soon">Docs</Text>
          <Link href="/terms">
            <Text color="gray.500" fontSize="xs" cursor="pointer" _hover={{ color: "gray.300" }}>Terms</Text>
          </Link>
          <Link href="/privacy">
            <Text color="gray.500" fontSize="xs" cursor="pointer" _hover={{ color: "gray.300" }} display={{ base: "none", sm: "block" }}>Privacy Policy</Text>
          </Link>
        </HStack>
      </Flex>
    </Box>
  );
}
