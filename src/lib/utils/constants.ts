export const PAGINATION_OPTIONS = [10, 25, 50] as const;

export const SORT_COLUMNS = {
  TITLE: "title",
  VOLUME: "volume",
  LIQUIDITY: "liquidity",
  VOLUME_24H: "volume24h",
} as const;

export const BREADCRUMB_ITEMS = {
  HOME: { label: "Home" },
  MARKET: { label: "Market" },
} as const;
