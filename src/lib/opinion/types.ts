/**
 * Opinion PRO Trading Types
 */

// Orderbook types
export interface OrderbookLevel {
  price: number;
  amount: number;
}

export interface Orderbook {
  token_id: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  best_bid: number;
  best_ask: number;
  spread: number;
  spread_percent: number;
  last_updated: string;
}

// OHLCV Candlestick types
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceHistory {
  token_id: string;
  interval: string;
  candles: Candle[];
}

// Order types
export type OrderSide = "buy" | "sell";
export type OrderType = "limit" | "market";
export type OrderStatus = "pending" | "open" | "partial" | "filled" | "cancelled" | "expired";

export interface PlaceOrderRequest {
  market_id: number;
  token_id: string;
  side: OrderSide;
  price: number;
  amount: number;
  order_type?: OrderType;
}

export interface Order {
  order_id: string;
  market_id: string;
  token_id: string;
  side: OrderSide;
  price: number;
  amount: number;
  filled_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
}

// Position types (Opinion API format)
export interface Position {
  marketId: number;
  marketTitle: string;
  marketStatus: number;
  marketStatusEnum: string;
  marketCutoffAt: number;
  rootMarketId: number;
  rootMarketTitle: string;
  outcome: string;
  outcomeSide: number;
  outcomeSideEnum: string;
  sharesOwned: string;
  sharesFrozen: string;
  unrealizedPnl: string;
  unrealizedPnlPercent: string;
  dailyPnlChange: string;
  dailyPnlChangePercent: string;
  conditionId: string;
  tokenId?: string;
  currentValueInQuoteToken?: string;
  avgEntryPrice?: string;
  claimStatus?: number;
  claimStatusEnum?: string;
  quoteToken?: string;
}

// Trade types
export interface Trade {
  trade_id: string;
  order_id: string;
  market_id: string;
  token_id: string;
  side: OrderSide;
  price: number;
  amount: number;
  fee: number;
  timestamp: string;
  tx_hash: string;
}

// Balance types
export interface Balance {
  available: number;
  frozen: number;
  total: number;
  quote_token: string;
}

// Market types
export interface OpinionMarket {
  marketId: number;
  marketTitle: string;
  marketType: number; // 0=Binary, 1=Categorical
  status: string | number;  // Can be number (2) or string ("activated")
  statusEnum?: string;      // "Activated", "Resolved", etc.
  chainId: number;
  yesTokenId?: string;
  noTokenId?: string;
  conditionId?: string;     // CTF condition ID - can be used to derive token IDs
  questionId?: string;      // Market question ID
  yesLabel?: string;  // Custom label for YES outcome (e.g., "UP", "BTC")
  noLabel?: string;   // Custom label for NO outcome (e.g., "DOWN", "ETH")
  volume?: number;
  volume24h?: number;
  volume7d?: number;
  cutoffAt?: number;
  resolvedAt?: number;
  createdAt?: number;
  rules?: string;
  quoteToken?: string;
  // Market image URL from Opinion API
  thumbnailUrl?: string;
  coverUrl?: string;
  image?: string;
  icon?: string;
  // For categorical markets - contains the child outcome markets
  childMarkets?: OpinionMarket[];
  // Parent reference for child markets
  parentMarketId?: number;
}

// Fee types
export interface FeeRates {
  maker_fee: number;
  taker_fee: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// EIP-712 Order types for signing
export interface EIP712OrderData {
  salt: string;
  maker: string;
  signer: string;
  taker: string;
  tokenId: string;
  makerAmount: string;
  takerAmount: string;
  expiration: string;
  nonce: string;
  feeRateBps: string;
  side: number;
  signatureType: number;
}

export interface EIP712TypedData {
  types: {
    EIP712Domain: { name: string; type: string }[];
    Order: { name: string; type: string }[];
  };
  primaryType: string;
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  message: EIP712OrderData;
}

export interface PrepareOrderResponse {
  success: boolean;
  typed_data: EIP712TypedData;
  order_data: EIP712OrderData;
  market_id: number;
  exchange_address: string;
  currency_address: string;
  price: string;
  order_type: number;
}

export interface SubmitSignedOrderRequest {
  order_data: EIP712OrderData;
  signature: string;
  market_id: number;
  currency_address: string;
  price: string;
  order_type: number;
}
