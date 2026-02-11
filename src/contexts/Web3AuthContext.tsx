"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useAccount, useSignMessage, useDisconnect } from "wagmi";
import { saveToken, removeToken, getToken } from "@/lib/utils/tokenStorage";
import { API_CONFIG } from "@/lib/api/config";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

// Backend API base URL - uses the same config as the rest of the app
const API_BASE_URL = API_CONFIG.BASE_URL;

interface User {
  address: string;
  balance: number;
  hasAccess: boolean;
}

interface Web3AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
}

const Web3AuthContext = createContext<Web3AuthContextValue | undefined>(
  undefined
);

export function Web3AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const queryClient = useQueryClient();

  // Default values (no token balance check needed for Opinion Terminal)
  const balance = 0;
  const hasSufficientBalance = true;
  const balanceLoading = false;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const loginInProgress = useRef(false); // Prevent concurrent login attempts
  const tierUpgradeDetected = useRef(false); // Track if we need to re-auth for tier upgrade

  // Check if user is authenticated (has valid token)
  const isAuthenticated = Boolean(user && getToken());

  /**
   * Login flow:
   * 1. Get message to sign from backend
   * 2. Sign message with wallet
   * 3. Send signature to backend for verification
   * 4. Backend verifies signature + checks balance
   * 5. Backend returns JWT token
   * 6. Save token and set user
   */
  const login = useCallback(async () => {
    if (!address || !isConnected) {
      setError("Wallet not connected");
      return;
    }

    // No minimum balance required - FREE tier (0 tokens) has access to 1 opportunity
    // Backend tier system handles access control based on balance

    // Prevent multiple simultaneous login attempts using ref (more reliable than state)
    if (loginInProgress.current || isLoading) {
      console.log("⚠️ Login already in progress, skipping");
      return;
    }

    loginInProgress.current = true;
    setIsLoading(true);
    setError(null);
    setLoginAttempted(true);

    try {
      // Step 1: Get message to sign from backend
      const messageResponse = await fetch(
        `${API_BASE_URL}${API_CONFIG.ENDPOINTS.AUTH_BSC_MESSAGE}?wallet_address=${address}`
      );

      if (!messageResponse.ok) {
        throw new Error("Failed to get message from backend");
      }

      const { message, timestamp } = await messageResponse.json();

      // Step 2: Sign message with wallet
      const signature = await signMessageAsync({ message });

      // Step 3: Verify signature and balance with backend
      console.log("📤 Sending verification request:", { address, message, signature, timestamp });

      const verifyResponse = await fetch(`${API_BASE_URL}${API_CONFIG.ENDPOINTS.AUTH_BSC_VERIFY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: address,
          message,
          signature,
          timestamp,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json().catch(() => ({}));
        console.error("❌ Backend verification failed:", {
          status: verifyResponse.status,
          statusText: verifyResponse.statusText,
          errorData,
        });
        throw new Error(errorData.error || errorData.detail || "Authentication failed");
      }

      const responseData = await verifyResponse.json();
      const { access_token, wallet_address, token_balance } = responseData;

      // Step 4: Save token and set user
      saveToken(access_token);
      setUser({
        address: wallet_address,
        balance: token_balance,
        hasAccess: true, // User has access if they passed backend validation
      });

      // Step 5: Invalidate all cached queries to refetch with new token
      apiClient.clearCache(); // Clear ApiClient cache
      queryClient.invalidateQueries(); // Clear React Query cache

      console.log("✅ Web3 authentication successful");
    } catch (err) {
      // Check if error is due to backend being unavailable
      const isBackendUnavailable = err instanceof Error &&
        (err.message === "Failed to fetch" ||
         err.message.includes("Failed to get message from backend"));

      if (isBackendUnavailable) {
        console.warn("⚠️ Backend unavailable for authentication - this is normal if backend is not running");
        // Don't set error state for backend unavailability
        setError(null);
      } else {
        console.error("❌ Web3 authentication error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
      }

      removeToken();
      setUser(null);
    } finally {
      loginInProgress.current = false;
      tierUpgradeDetected.current = false;
      setIsLoading(false);
    }
  }, [address, isConnected, hasSufficientBalance, signMessageAsync]);

  /**
   * Logout: clear token and user state
   */
  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    setError(null);
    setLoginAttempted(false);

    // Clear all caches on logout
    apiClient.clearCache();
    queryClient.invalidateQueries();

    console.log("✅ Logged out");
  }, [queryClient]);

  /**
   * Auto-logout when wallet disconnects or address changes
   * Only logout if there's an authenticated user to avoid clearing state unnecessarily
   */
  useEffect(() => {
    if (!isConnected && user) {
      console.log("🔌 Wallet disconnected, logging out...");
      logout();
    }
  }, [isConnected, user, logout]);

  /**
   * Reset login attempt flag when address changes OR when wallet reconnects
   */
  useEffect(() => {
    if (isConnected && address) {
      console.log("🔄 Wallet connected/changed, resetting login attempt flag");
      setLoginAttempted(false);
    }
  }, [address, isConnected]);

  /**
   * Auto-logout when balance drops below minimum
   * DISABLED: This was causing issues with reconnection
   * The balance check will happen during login instead
   */
  // useEffect(() => {
  //   if (user && !balanceLoading && !hasSufficientBalance) {
  //     console.warn("⚠️ Balance dropped below minimum, logging out");
  //     logout();
  //   }
  // }, [user, balanceLoading, hasSufficientBalance, logout]);

  /**
   * Restore session on mount if token exists
   * Validates that the connected wallet matches the one in the JWT
   */
  useEffect(() => {
    const token = getToken();
    if (token && address && hasSufficientBalance) {
      try {
        // Decode JWT to get the wallet address (JWT is base64 encoded)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const tokenWallet = payload.wallet_address || payload.sub;

        // Only restore session if connected wallet matches JWT wallet
        if (tokenWallet && tokenWallet.toLowerCase() === address.toLowerCase()) {
          setUser({
            address,
            balance,
            hasAccess: hasSufficientBalance,
          });
        } else {
          console.log("⚠️ Connected wallet doesn't match JWT wallet, clearing token");
          removeToken();
          setUser(null);
        }
      } catch (e) {
        console.error("Failed to decode JWT:", e);
        // If we can't decode, still restore for backward compatibility
        setUser({
          address,
          balance,
          hasAccess: hasSufficientBalance,
        });
      }
    }
  }, [address, balance, hasSufficientBalance]);

  /**
   * Detect tier upgrade and set flag for manual re-authentication
   * We don't auto-trigger login to avoid wallet popup spam
   */
  useEffect(() => {
    if (!user || !isConnected || balanceLoading || isLoading) return;

    const storedBalance = user.balance;
    const currentBalance = balance;

    // Check if balance changed enough to potentially upgrade tier
    // FREE (0-1999) -> BASIC (2000-9999) -> PREMIUM (10000+)
    const getTier = (bal: number) => {
      if (bal >= 10000) return 'PREMIUM';
      if (bal >= 2000) return 'BASIC';
      return 'FREE';
    };

    const storedTier = getTier(storedBalance);
    const currentTier = getTier(currentBalance);

    if (currentTier !== storedTier && currentBalance > storedBalance) {
      console.log(`🔄 Tier upgrade detected: ${storedTier} → ${currentTier}. Token balance: ${storedBalance} → ${currentBalance}`);
      tierUpgradeDetected.current = true;
      // Don't auto-trigger login to avoid wallet spam
      // User can manually refresh or we'll update on next page load

      // Clear the old token so next API call will use updated balance
      // The auto-login will trigger naturally when token is missing
      removeToken();
      setUser(prevUser => prevUser ? { ...prevUser, balance: currentBalance } : null);
    }
  }, [user, balance, isConnected, balanceLoading, isLoading]);

  /**
   * Auto-login when wallet is connected and has sufficient balance
   * but no valid token exists
   *
   * Required for features like Arbitrage that need backend authentication
   */
  useEffect(() => {
    const token = getToken();
    const shouldAutoLogin =
      isConnected &&
      address &&
      !token &&
      !isLoading &&
      !balanceLoading &&
      !user &&
      !loginAttempted &&
      !loginInProgress.current; // Extra safety check

    if (shouldAutoLogin) {
      // Add a small delay to prevent race conditions during wallet connection
      const timeoutId = setTimeout(() => {
        // Double-check conditions after delay
        if (!loginInProgress.current && !getToken()) {
          console.log("🔐 Auto-login triggered: wallet connected, requesting signature for backend authentication");
          login();
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, address, isLoading, balanceLoading, user, loginAttempted, login]);

  const value: Web3AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
  };

  return (
    <Web3AuthContext.Provider value={value}>
      {children}
    </Web3AuthContext.Provider>
  );
}

/**
 * Hook to use Web3 authentication context
 */
export function useWeb3Auth() {
  const context = useContext(Web3AuthContext);
  if (context === undefined) {
    throw new Error("useWeb3Auth must be used within Web3AuthProvider");
  }
  return context;
}
