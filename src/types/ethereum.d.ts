/**
 * Ethereum Window Type Declarations
 */

interface WatchAssetParams {
  type: string;
  options: {
    address: string;
    symbol: string;
    decimals: number;
    image?: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EthereumRequestParams = unknown[] | WatchAssetParams | Record<string, unknown> | any;

interface EthereumProvider {
  request: (args: {
    method: string;
    params?: EthereumRequestParams;
  }) => Promise<unknown>;
  on?: (eventName: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (
    eventName: string,
    handler: (...args: unknown[]) => void
  ) => void;
  isMetaMask?: boolean;
  chainId?: string;
}

interface Window {
  ethereum?: EthereumProvider;
}
