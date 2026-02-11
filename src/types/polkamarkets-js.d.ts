declare module 'polkamarkets-js' {
  export interface ApplicationConfig {
    web3Provider: unknown;
    web3EventsProvider?: unknown;
  }

  export interface PredictionMarketContract {
    getMarkets(): Promise<Record<string, unknown>>;
    getMarketData(params: { marketId: string }): Promise<unknown>;
    buy(params: unknown): Promise<void>;
    sell(params: unknown): Promise<void>;
    calcBuyAmount(params: unknown): Promise<string>;
    calcSellAmount(params: unknown): Promise<string>;
    claimWinnings(params: unknown): Promise<void>;
    claimVoidedOutcomeShares(params: unknown): Promise<void>;
    getPortfolio(params: { user: string }): Promise<unknown>;
  }

  export interface ERC20Contract {
    isApproved(params: { address: string; amount: string; spenderAddress: string }): Promise<boolean>;
    approve(params: { address: string; amount: string }): Promise<void>;
  }

  export class Application {
    constructor(config: ApplicationConfig);
    login(): Promise<void>;
    getAddress(): Promise<string>;
    getPredictionMarketV3PlusContract(params: {
      contractAddress: string;
      querierContractAddress: string;
    }): PredictionMarketContract;
    getERC20Contract(params: { contractAddress: string }): ERC20Contract;
  }

  export default Application;
}
