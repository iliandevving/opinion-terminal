import { useAccount, useSwitchChain } from 'wagmi';
import { useCallback, useMemo } from 'react';

// BNB Chain IDs
const BNB_MAINNET_ID = 56;
const BNB_TESTNET_ID = 97;

/**
 * Hook to ensure wallet is connected to BNB Chain before on-chain transactions
 * Automatically triggers wallet provider's network switch prompt if needed
 */
export function useEnsureBNBChain() {
  const { address, isConnected, chain } = useAccount();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  /**
   * Check if wallet is connected to BNB Chain (mainnet or testnet)
   * Use useMemo to ensure it updates reactively when chain changes
   */
  const isOnBNBChain = useMemo(() => {
    if (!isConnected || !chain) return false;
    return chain.id === BNB_MAINNET_ID || chain.id === BNB_TESTNET_ID;
  }, [isConnected, chain]);

  const checkIsOnBNBChain = useCallback(() => {
    if (!isConnected || !chain) return false;
    return chain.id === BNB_MAINNET_ID || chain.id === BNB_TESTNET_ID;
  }, [isConnected, chain]);

  /**
   * Ensure user is on BNB Chain before executing a transaction
   * Triggers wallet provider's native network switch UI (MetaMask, etc.)
   *
   * @returns Promise<boolean> - true if on correct chain, false if cancelled/failed
   * @throws Error if wallet not connected or switch fails
   */
  const ensureBNBChain = useCallback(async (): Promise<boolean> => {
    // Check if wallet is connected
    if (!isConnected || !address) {
      throw new Error('Please connect your wallet first');
    }

    // Check if already on BNB Chain
    if (checkIsOnBNBChain()) {
      return true;
    }

    // Attempt to switch chain - this triggers wallet provider's UI
    try {
      console.log(`⚠️ Wrong network detected (${chain?.name}). Requesting switch to BNB Chain...`);

      await switchChainAsync({ chainId: BNB_MAINNET_ID });

      console.log('✅ Successfully switched to BNB Chain');
      return true;
    } catch (error: unknown) {
      console.error('❌ Failed to switch chain:', error);

      // User rejected the request
      const err = error as { code?: number; message?: string };
      if (err.code === 4001 || err.message?.includes('User rejected')) {
        console.log('User cancelled network switch');
        return false;
      }

      // Chain not added to wallet - this shouldn't happen with BNB Chain
      if (err.code === 4902 || err.message?.includes('Unrecognized chain')) {
        throw new Error('BNB Chain not found in your wallet. Please add it manually.');
      }

      // Other errors
      throw new Error(err.message || 'Failed to switch to BNB Chain');
    }
  }, [isConnected, address, chain, checkIsOnBNBChain, switchChainAsync]);

  /**
   * Alternative method for UI components that need result object
   */
  const switchToBNBChain = useCallback(async () => {
    try {
      const success = await ensureBNBChain();
      return { success };
    } catch {
      return { success: false };
    }
  }, [ensureBNBChain]);

  // Derived state for UI components
  const requiresConnection = !isConnected;
  const requiresSwitch = isConnected && !isOnBNBChain;

  return {
    ensureBNBChain,
    switchToBNBChain,
    isOnBNBChain,
    currentChainId: chain?.id,
    currentChainName: chain?.name,
    isConnected,
    isSwitching,
    requiresConnection,
    requiresSwitch,
  };
}
