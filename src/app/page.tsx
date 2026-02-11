"use client";

import { Box, Flex, Text, HStack, VStack, Spinner } from "@chakra-ui/react";
import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useInfiniteOpinionMarkets, useOrderbook, useAllMarketsForSearch } from "@/hooks/opinion";
import { generateMarketSlug } from "@/lib/utils/slug";
import type { OpinionMarket } from "@/lib/opinion/types";

// Wrap component that uses useSearchParams
function HomePageContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  return <HomePageInner initialSearch={initialSearch} />;
}


// Categories for filtering
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "crypto", label: "Crypto", keywords: ["bitcoin", "btc", "eth", "ethereum", "crypto", "solana", "sol", "bnb", "token"] },
  { id: "business", label: "Business", keywords: ["stock", "company", "ipo", "earnings", "amazon", "google", "apple", "microsoft", "meta", "nvidia"] },
  { id: "politics", label: "Politics", keywords: ["election", "president", "congress", "senate", "vote", "trump", "biden", "republican", "democrat"] },
  { id: "sports", label: "Sports", keywords: ["nba", "nfl", "super bowl", "fifa", "world cup", "champion", "mlb", "nhl", "tennis", "ufc"] },
  { id: "tech", label: "Tech", keywords: ["spacex", "ai", "openai", "model", "launch", "tiktok"] },
  { id: "culture", label: "Culture", keywords: ["oscar", "grammy", "emmy", "movie", "film", "album", "artist"] },
];

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

// YES/NO pill buttons for market cards
function YesNoPill({ label, isYes }: { label: string; isYes: boolean }) {
  const color = isYes ? "#BAE123" : "#4788FF";
  return (
    <Box
      as="span"
      role="button"
      aria-label={`${label} option`}
      tabIndex={0}
      px={3}
      py={1}
      borderRadius="lg"
      bg="transparent"
      border="1px solid"
      borderColor={color}
      fontSize="xs"
      fontWeight="700"
      color={color}
      opacity={0.6}
      cursor="pointer"
      transition="all 0.15s"
      _hover={{
        opacity: 1,
        bg: color,
        color: "#000",
      }}
      _focusVisible={{
        outline: "2px solid",
        outlineColor: "orange.500",
        outlineOffset: "2px",
        opacity: 1,
      }}
    >
      {label}
    </Box>
  );
}

// Market outcome row with price
function OutcomeRow({ label, tokenId }: { label: string; tokenId?: string }) {
  const isValidToken = tokenId && tokenId.length > 50 && !tokenId.includes("_");
  const { data: orderbook, isLoading } = useOrderbook(isValidToken ? tokenId : null);
  const price = orderbook ? Math.round(orderbook.best_ask * 100) : null;

  return (
    <Flex
      align="center"
      justify="space-between"
      py={1.5}
      _hover={{ bg: "rgba(255,255,255,0.03)" }}
      borderRadius="md"
      px={1}
      mx={-1}
      gap={2}
    >
      <Text color="gray.400" fontSize="xs" flex={1} lineClamp={1}>
        {label}
      </Text>
      <HStack gap={2} flexShrink={0}>
        <Text color="gray.500" fontSize="xs" minW="30px" textAlign="right">
          {isLoading ? "..." : price !== null ? `${price}%` : "—"}
        </Text>
        <YesNoPill label="YES" isYes={true} />
        <YesNoPill label="NO" isYes={false} />
      </HStack>
    </Flex>
  );
}

// Market Card component
function MarketCard({ market }: { market: OpinionMarket }) {
  const isCategorical = market.marketType === 1 && market.childMarkets && market.childMarkets.length > 0;
  const icon = getCategoryIcon(market.marketTitle);
  const volume = market.volume24h ? (Number(market.volume24h) / 1000000).toFixed(2) : null;
  const marketImage = market.thumbnailUrl || market.coverUrl || market.image || market.icon;
  const slug = generateMarketSlug(market.marketTitle, market.marketId);

  const outcomes = useMemo(() => {
    if (isCategorical && market.childMarkets) {
      return market.childMarkets.map(child => ({
        label: child.marketTitle || child.yesLabel || "Option",
        tokenId: child.yesTokenId,
      }));
    }
    return [
      { label: market.yesLabel || "YES", tokenId: market.yesTokenId },
      { label: market.noLabel || "NO", tokenId: market.noTokenId },
    ];
  }, [market, isCategorical]);

  return (
    <Link href={`/market/${slug}`} style={{ textDecoration: "none" }} aria-label={`View market: ${market.marketTitle}`}>
      <Flex
        direction="column"
        bg="rgba(255,255,255,0.02)"
        border="1px solid"
        borderColor="rgba(255,255,255,0.08)"
        borderRadius="xl"
        p={4}
        cursor="pointer"
        _hover={{ borderColor: "#EE6332", bg: "rgba(255,255,255,0.03)" }}
        _focusVisible={{
          outline: "2px solid",
          outlineColor: "orange.500",
          outlineOffset: "2px"
        }}
        transition="all 0.2s"
        h="220px"
      >
      {/* Header - Fixed */}
      <Flex gap={3} mb={3} align="center" flexShrink={0}>
        <Flex
          w="44px"
          h="44px"
          borderRadius="xl"
          bg="#1a1a1a"
          align="center"
          justify="center"
          flexShrink={0}
          overflow="hidden"
        >
          {marketImage ? (
            <img
              src={marketImage}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Text fontSize="lg" aria-hidden="true">{icon}</Text>
          )}
        </Flex>
        <Text color="white" fontSize="sm" fontWeight="600" lineHeight="1.3" lineClamp={2}>
          {market.marketTitle}
        </Text>
      </Flex>

      {/* Outcomes - Scrollable vertically only */}
      <Box
        flex={1}
        overflowY="auto"
        overflowX="hidden"
        mb={2}
        pr={1}
      >
        <VStack align="stretch" gap={1} w="100%" overflow="hidden">
          {outcomes.map((o, i) => (
            <OutcomeRow
              key={i}
              label={o.label}
              tokenId={o.tokenId}
            />
          ))}
        </VStack>
      </Box>

      {/* Footer - Volume */}
      <Flex align="center" gap={2} pt={2} borderTop="1px solid" borderColor="rgba(255,255,255,0.06)" flexShrink={0} mt="auto">
        <svg width="20" height="20" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" fillRule="evenodd">
            <circle cx="16" cy="16" r="16" fill="#26A17B"/>
            <path fill="#FFF" d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"/>
          </g>
        </svg>
        <Text color="gray.400" fontSize="xs">
          Vol. {volume ? `${volume}M` : "—"} USDT
        </Text>
      </Flex>
      </Flex>
    </Link>
  );
}

// New Markets sidebar item
function NewMarketItem({ market }: { market: OpinionMarket }) {
  const icon = getCategoryIcon(market.marketTitle);
  const marketImage = market.thumbnailUrl || market.coverUrl || market.image || market.icon;
  const slug = generateMarketSlug(market.marketTitle, market.marketId);

  return (
    <Link href={`/market/${slug}`} style={{ textDecoration: "none" }}>
      <Flex
        align="center"
        gap={3}
        py={2}
        px={3}
        mx={-3}
        cursor="pointer"
        border="1px solid"
        borderColor="transparent"
        _hover={{ bg: "rgba(255,255,255,0.03)", borderColor: "#EE6332" }}
        borderRadius="xl"
        transition="all 0.2s"
      >
      {marketImage ? (
        <Box
          w="40px"
          h="40px"
          borderRadius="lg"
          overflow="hidden"
          flexShrink={0}
          bg="rgba(255,255,255,0.05)"
        >
          <img
            src={marketImage}
            alt={market.marketTitle}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      ) : (
        <Flex
          w="40px"
          h="40px"
          borderRadius="lg"
          bg="rgba(255,255,255,0.05)"
          align="center"
          justify="center"
          fontSize="lg"
          flexShrink={0}
        >
          {icon}
        </Flex>
      )}
      <Text color="gray.300" fontSize="sm" lineClamp={2} flex={1}>
        {market.marketTitle}
      </Text>
      </Flex>
    </Link>
  );
}

function HomePageInner({ initialSearch }: { initialSearch: string }) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Infinite scroll for grid display
  const {
    data: marketsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteOpinionMarkets(20, "activated");

  // All markets for search (cached)
  const { data: allMarketsForSearch, isLoading: isLoadingSearch } = useAllMarketsForSearch();

  // Flatten paginated markets into a single array
  const paginatedMarkets = useMemo(() => {
    if (!marketsData?.pages) return [];
    const allMarkets = marketsData.pages.flatMap(page => page.list);
    // Deduplicate by marketId
    const seen = new Set<number>();
    return allMarkets.filter(market => {
      if (seen.has(market.marketId)) return false;
      seen.add(market.marketId);
      return true;
    });
  }, [marketsData]);

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Determine if we're in search mode
  const isSearching = searchQuery.length >= 2;

  // Check if full search cache is ready
  const isSearchCacheReady = !isLoadingSearch && allMarketsForSearch && allMarketsForSearch.length > 0;

  // Filter markets - use full database when searching (with fallback to paginated), paginated when browsing
  const filteredMarkets = useMemo(() => {
    // When searching: use full cache if ready, otherwise use paginated as fallback
    const sourceMarkets = isSearching
      ? (isSearchCacheReady ? allMarketsForSearch : paginatedMarkets)
      : paginatedMarkets;
    let filtered = sourceMarkets;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => m.marketTitle.toLowerCase().includes(query));
    }

    if (selectedCategory !== "all") {
      const category = CATEGORIES.find(c => c.id === selectedCategory);
      if (category?.keywords) {
        filtered = filtered.filter(m =>
          category.keywords!.some(kw => m.marketTitle.toLowerCase().includes(kw))
        );
      }
    }

    return filtered;
  }, [paginatedMarkets, allMarketsForSearch, searchQuery, selectedCategory, isSearching, isSearchCacheReady]);

  // New markets (sorted by creation date)
  const newMarkets = useMemo(() => {
    return [...paginatedMarkets]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 10);
  }, [paginatedMarkets]);

  // Grid View (Market Discovery)
  return (
    <Box h="100vh" bg="#000" display="flex" flexDirection="column" overflow="hidden">
      {/* Header */}
      <Flex
        as="header"
        role="banner"
        h="56px"
        px={{ base: 3, md: 5 }}
        align="center"
        justify="space-between"
        borderBottom="1px solid"
        borderColor="rgba(255,255,255,0.06)"
        position="relative"
        zIndex={100}
        flexShrink={0}
        bg="#000"
      >
        {/* Left - Logo */}
        <HStack gap={2} aria-label="Opinion Terminal home">
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
            as="h1"
            color="white"
            fontSize="md"
            fontWeight="600"
            fontFamily="var(--font-manrope), 'Manrope', sans-serif"
          >
            OPINION TERMINAL
          </Text>
        </HStack>

        {/* Right - Connect Wallet */}
        <HStack gap={3}>
          {/* Connect Wallet - Desktop */}
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <Text color="gray.400" fontSize="sm" fontWeight="500">Connect Wallet</Text>
            </Flex>
            <Box
              position="absolute"
              top="-6px"
              right="-6px"
              bg="#EE6332"
              px={1.5}
              py={0.5}
              borderRadius="full"
            >
              <Text color="white" fontSize="8px" fontWeight="700">SOON</Text>
            </Box>
          </Box>
        </HStack>
      </Flex>

      {/* Search + Category Filters Bar */}
      <Flex
        as="nav"
        role="navigation"
        aria-label="Search and category filters"
        px={{ base: 3, md: 5 }}
        py={{ base: 2, md: 3 }}
        gap={3}
        borderBottom="1px solid"
        borderColor="rgba(255,255,255,0.06)"
        flexShrink={0}
        bg="#000"
        position="sticky"
        top={0}
        zIndex={99}
        align="center"
      >
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
          w={{ base: "120px", md: "200px" }}
          flexShrink={0}
          _focusWithin={{ borderColor: "orange.500" }}
          transition="border-color 0.15s"
        >
          <Text color="gray.500" fontSize="sm" aria-hidden="true">🔍</Text>
          <Box
            as="input"
            placeholder="Search"
            aria-label="Search markets"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            border="none"
            outline="none"
            bg="transparent"
            color="white"
            fontSize="sm"
            flex={1}
            _placeholder={{ color: "gray.500" }}
          />
        </Flex>

        {/* Category Filters (scrollable) */}
        <Flex
          flex={1}
          gap={2}
          overflowX="auto"
          css={{ "&::-webkit-scrollbar": { display: "none" } }}
        >
          {CATEGORIES.map(cat => (
            <Box
              key={cat.id}
              as="button"
              role="tab"
              aria-selected={selectedCategory === cat.id}
              aria-label={`Filter by ${cat.label}`}
              px={{ base: 3, md: 4 }}
              py={1.5}
              borderRadius="full"
              border="1px solid"
              borderColor={selectedCategory === cat.id ? "#EE6332" : "rgba(255,255,255,0.1)"}
              bg={selectedCategory === cat.id ? "rgba(238, 99, 50, 0.1)" : "transparent"}
              cursor="pointer"
              onClick={() => setSelectedCategory(cat.id)}
              _hover={{ borderColor: selectedCategory === cat.id ? "#EE6332" : "rgba(255,255,255,0.2)" }}
              _focusVisible={{
                outline: "2px solid",
                outlineColor: "orange.500",
                outlineOffset: "2px"
              }}
              transition="all 0.15s"
              flexShrink={0}
            >
              <Text
                color={selectedCategory === cat.id ? "#EE6332" : "gray.400"}
                fontSize={{ base: "xs", md: "sm" }}
                fontWeight="500"
              >
                {cat.label}
              </Text>
            </Box>
          ))}
        </Flex>

        {/* Volume Filter (Desktop only) */}
        <Flex
          align="center"
          gap={2}
          px={3}
          py={1.5}
          borderRadius="full"
          border="1px solid"
          borderColor="rgba(255,255,255,0.1)"
          cursor="pointer"
          _hover={{ borderColor: "rgba(255,255,255,0.2)" }}
          display={{ base: "none", md: "flex" }}
          flexShrink={0}
        >
          <Text color="gray.400" fontSize="sm">24H Volume</Text>
          <Text color="gray.500" fontSize="xs">↓</Text>
        </Flex>
      </Flex>

      {/* Main Content */}
      <Flex flex={1} overflow="hidden">
        {/* Markets Grid */}
        <Box
          flex={1}
          overflowY="auto"
          p={{ base: 3, md: 4 }}
          pr={{ base: 4, md: 4 }}
        >
          {/* Search results header */}
          {isSearching && (
            <Flex align="center" gap={2} mb={3}>
              <Text color="gray.400" fontSize="sm">
                {filteredMarkets.length} results for &quot;{searchQuery}&quot;
                {isLoadingSearch && !isSearchCacheReady && " (loading more...)"}
              </Text>
              {isLoadingSearch && <Spinner size="xs" color="#EE6332" />}
            </Flex>
          )}

          {isLoading && paginatedMarkets.length === 0 ? (
            <Flex h="200px" align="center" justify="center" role="status" aria-label="Loading markets">
              <Spinner color="#EE6332" />
            </Flex>
          ) : filteredMarkets.length === 0 ? (
            <Flex h="200px" align="center" justify="center" role="status">
              <Text color="gray.500">No markets found</Text>
            </Flex>
          ) : (
            <>
              <Box
                as="section"
                role="list"
                aria-label="Markets list"
                display="grid"
                gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
                gap={4}
              >
                {filteredMarkets.map(market => (
                  <Box key={market.marketId} role="listitem">
                    <MarketCard market={market} />
                  </Box>
                ))}
              </Box>

              {/* Load more trigger - only show when not searching */}
              {!isSearching && selectedCategory === "all" && (
                <Flex
                  ref={loadMoreRef}
                  h="80px"
                  align="center"
                  justify="center"
                  mt={4}
                >
                  {isFetchingNextPage ? (
                    <Spinner color="#EE6332" size="sm" />
                  ) : hasNextPage ? (
                    <Text color="gray.600" fontSize="sm">Scroll for more</Text>
                  ) : (
                    <Text color="gray.600" fontSize="sm">All markets loaded</Text>
                  )}
                </Flex>
              )}
            </>
          )}
        </Box>

        {/* Sidebar - New Markets */}
        <Box
          w="320px"
          borderLeft="1px solid"
          borderColor="rgba(255,255,255,0.06)"
          p={4}
          display={{ base: "none", xl: "block" }}
          overflowY="auto"
        >
          <HStack gap={2} mb={4}>
            <Text color="white" fontSize="md" fontWeight="600">New Markets</Text>
            <Text fontSize="md">✨</Text>
          </HStack>

          <VStack align="stretch" gap={1}>
            {newMarkets.map(market => (
              <NewMarketItem
                key={market.marketId}
                market={market}
              />
            ))}
          </VStack>
        </Box>
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

export default function HomePage() {
  return (
    <Suspense fallback={
      <Box h="100vh" bg="#000" display="flex" alignItems="center" justifyContent="center">
        <Spinner color="#EE6332" size="lg" />
      </Box>
    }>
      <HomePageContent />
    </Suspense>
  );
}
