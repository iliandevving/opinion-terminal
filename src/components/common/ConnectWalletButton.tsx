"use client";

import { Button, HStack, Text, Icon, Box } from "@chakra-ui/react";
import { Wallet, LogOut } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState, useEffect, useRef } from "react";
import { useWeb3Auth } from "@/contexts/Web3AuthContext";
import { MobileWalletSelector } from "./MobileWalletSelector";
import {
  isMobileDevice,
  getPreferredMobileWallet,
  openWalletDeepLink,
  savePreferredMobileWallet,
} from "@/lib/walletDeepLinks";

// Type per estendere Window con wallet provider
interface WalletProvider {
  request: (args: { method: string }) => Promise<unknown>;
}

interface WindowWithProviders {
  ethereum?: WalletProvider;
  phantom?: { ethereum?: WalletProvider };
  trustWallet?: WalletProvider;
  coinbaseWalletExtension?: WalletProvider;
  brave?: { ethereum?: WalletProvider };
  bitkeep?: { ethereum?: WalletProvider };
  okexchain?: WalletProvider;
  ftmwallet?: WalletProvider;
}

interface ConnectWalletButtonProps {
  variant?: "solid" | "outline" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  fullWidth?: boolean;
  iconOnly?: boolean;
  hideIcon?: boolean;
}

export const ConnectWalletButton = ({
  variant = "solid",
  size = "md",
  fullWidth = false,
  iconOnly = false,
  hideIcon = false,
}: ConnectWalletButtonProps) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { error: authError } = useWeb3Auth();
  const [mounted, setMounted] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showMobileWalletSelector, setShowMobileWalletSelector] = useState(false);
  const [pendingWcUri, setPendingWcUri] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionInProgress = useRef(false); // Prevent multiple simultaneous connection attempts

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);

    // Cleanup timeout on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Handle connection errors from wagmi (these happen asynchronously)
  useEffect(() => {
    if (connectError) {
      console.error("❌ Connection error from wagmi hook:", connectError);

      // Ignore "Provider not found" errors if we're already connected
      // This happens when wagmi tries to verify the provider after initial connection
      if ((connectError.message?.includes("Provider not found") ||
           connectError.message?.includes("provider not found")) &&
          isConnected) {
        console.log("⚠️ Ignoring 'Provider not found' error since wallet is already connected");
        return;
      }

      // If we get "Connector already connected" error, force a disconnect and allow retry
      if (connectError.message?.includes("Connector already connected") ||
          connectError.message?.includes("already connected")) {
        console.log("⚠️ Detected 'already connected' error from wagmi, forcing disconnect...");
        disconnect();
        setIsReconnecting(false);
      }
    }
  }, [connectError, disconnect, isConnected]);

  // Log authentication errors
  useEffect(() => {
    if (authError) {
      console.error("❌ Authentication error:", authError);
    }
  }, [authError]);

  // Log connector changes
  useEffect(() => {
    if (mounted) {
      console.log("🔧 Connectors available:", connectors.length);
      console.log("📋 Connectors list:", connectors.map(c => ({ id: c.id, name: c.name, type: c.type })));
    }
  }, [mounted, connectors]);

  // Handler per quando l'utente seleziona un wallet mobile
  const handleMobileWalletSelect = (walletId: string) => {
    console.log(`📱 Utente ha selezionato wallet mobile: ${walletId}`);
    console.log(`📋 Pending WC URI disponibile:`, pendingWcUri ? 'SI' : 'NO');

    if (pendingWcUri) {
      console.log(`🔗 WC URI completo:`, pendingWcUri);
    }

    // Salva la preferenza per future connessioni
    savePreferredMobileWallet(walletId);

    // Se abbiamo un WC URI in pending, apri il deep link
    if (pendingWcUri) {
      console.log(`🚀 Chiamando openWalletDeepLink per ${walletId}...`);
      const success = openWalletDeepLink(walletId, pendingWcUri);
      console.log(`✅ openWalletDeepLink returned:`, success);
      // Pulisci il pending URI
      setPendingWcUri(null);
    } else {
      console.error('❌ Nessun WC URI disponibile per aprire il deep link!');
    }
  };

  // Show loading state during SSR and initial mount
  if (!mounted) {
    return (
      <Button
        size={size}
        variant={variant}
        bg="teal.700"
        color="white"
        borderRadius="full"
        width={fullWidth ? "100%" : "auto"}
        fontWeight="600"
        disabled
      >
        <HStack gap={2}>
          <Icon>
            <Wallet size={18} />
          </Icon>
          <Text>Connect Wallet</Text>
        </HStack>
      </Button>
    );
  }

  // Truncate address: 0x1234...5678
  const truncatedAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const handleConnect = async (connectorToUse?: typeof connectors[0]) => {
    console.log("🔌 Connect button clicked");
    console.log("📋 Available connectors:", connectors.map(c => ({ id: c.id, name: c.name, type: c.type })));
    console.log("🔍 Current connection state - isConnected:", isConnected, "| address:", address, "| isReconnecting:", isReconnecting);

    // Prevent multiple simultaneous connection attempts (using both state and ref for reliability)
    if (isReconnecting || isPending || connectionInProgress.current) {
      console.log("⚠️ Connection already in progress, ignoring click");
      return;
    }

    connectionInProgress.current = true;

    try {
      if (connectors.length === 0) {
        console.error("❌ No connectors available!");
        alert("No wallet connectors found. Please install a Web3 wallet like MetaMask or Rabby.");
        return;
      }

    // IMPORTANTE: Rileva subito se siamo su mobile
    const isOnMobile = isMobileDevice();
    console.log(`📱 Device detection: ${isOnMobile ? 'Mobile' : 'Desktop'}`);

    // Detect wallet provider ONLY on desktop (mobile wallets don't inject providers into browser)
    let walletProvider: WalletProvider | null = null;
    if (!isOnMobile) {
      const windowWithProviders = window as unknown as WindowWithProviders;
      const providers = [
        windowWithProviders.ethereum,
        windowWithProviders.phantom?.ethereum,
        windowWithProviders.trustWallet,
        windowWithProviders.coinbaseWalletExtension,
        windowWithProviders.brave?.ethereum,
        windowWithProviders.bitkeep?.ethereum,
        windowWithProviders.okexchain,
        windowWithProviders.ftmwallet,
      ].filter((p): p is WalletProvider => p !== undefined);

      walletProvider = providers[0] || null;

      if (!walletProvider) {
        console.error("❌ No Web3 wallet detected on desktop");
        alert("No Web3 wallet found! Please install MetaMask, Rabby, Trust Wallet, Phantom, Fantom, or another Web3 wallet extension.");
        return;
      }
      console.log("✅ Wallet provider detected on desktop");
    }

    // Choose connector: use specified one, or auto-detect based on device
    let connector = connectorToUse;

    if (!connector) {
      if (isOnMobile) {
        // Mobile: always use WalletConnect
        connector = connectors.find(c => c.id === 'walletConnect' || c.type === 'walletConnect');
        console.log("📱 Mobile device detected, using WalletConnect");
      } else {
        // Desktop: use injected if available
        connector = connectors.find(c => c.id === 'injected' || c.type === 'injected');
        console.log("🖥️ Desktop with injected wallet detected, using injected connector");
      }

      // Fallback to first connector if specific one not found
      if (!connector) {
        connector = connectors[0];
        console.log("⚠️ Specific connector not found, falling back to first available");
      }
    }

    console.log("✅ Using connector:", connector.name, "| ID:", connector.id, "| Type:", connector.type);

    // MOBILE DEEP LINKING: Se siamo su mobile con WalletConnect, gestiamo deep linking
    if (isOnMobile && connector.type === 'walletConnect') {
      console.log("🔗 Mobile WalletConnect detected - gestione deep linking");
      setIsReconnecting(true);

      try {
        // Ottieni il provider PRIMA di chiamare connect
        const wcProvider = await connector.getProvider?.();

        if (!wcProvider) {
          console.error("❌ WalletConnect provider not available");
          alert("WalletConnect not available. Please try again.");
          setIsReconnecting(false);
          return;
        }

        console.log("✅ WalletConnect provider ottenuto");

        // Controlla se l'utente ha già una preferenza di wallet salvata
        const preferredWallet = getPreferredMobileWallet();

        // Setup event listener per catturare l'URI quando viene generato
        let uriCaptured = false;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleDisplayUri = (uri: string) => {
          console.log(`🎯 handleDisplayUri chiamato!`);
          console.log(`📊 uriCaptured prima:`, uriCaptured);

          if (uriCaptured) {
            console.log('⚠️ URI già catturato, skip duplicato');
            return; // Evita duplicati
          }
          uriCaptured = true;
          console.log(`📊 uriCaptured dopo:`, uriCaptured);

          console.log("🔗 WalletConnect URI catturato (primi 50 char):", uri.substring(0, 50) + "...");
          console.log("📏 URI lunghezza totale:", uri.length);

          if (preferredWallet) {
            console.log(`💾 Aprendo wallet preferito: ${preferredWallet.name} (${preferredWallet.id})`);
            const success = openWalletDeepLink(preferredWallet.id, uri);
            console.log(`✅ openWalletDeepLink per wallet preferito returned:`, success);
          } else {
            console.log("📱 Nessun wallet preferito trovato, mostrando selector...");
            console.log(`🔗 Salvando URI in pendingWcUri...`);
            setPendingWcUri(uri);
            console.log(`📱 Aprendo MobileWalletSelector...`);
            setShowMobileWalletSelector(true);
          }
        };

        // Ascolta l'evento display_uri
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (wcProvider as any).on?.('display_uri', handleDisplayUri);

        // Ora inizia la connessione - questo triggererà l'evento display_uri
        console.log("🚀 Iniziando connessione WalletConnect...");
        await connect({ connector });

        console.log("✅ Connection initiated!");
      } catch (error) {
        console.error("❌ Connection failed:", error);
        if (error instanceof Error && !error.message.includes("User rejected")) {
          alert(`Connection error: ${error.message}`);
        }
      } finally {
        setIsReconnecting(false);
      }
      return;
    }

    // If wagmi thinks we're still connected, force disconnect first
    if (isConnected) {
      console.log("⚠️ Wagmi reports already connected, forcing full disconnect cycle...");
      setIsReconnecting(true);

      try {
        // Disconnect first
        disconnect();

        // Wait for disconnect to fully propagate
        await new Promise(resolve => {
          reconnectTimeoutRef.current = setTimeout(resolve, 800);
        });

        console.log("🔄 Disconnect complete, attempting fresh connection...");

        // Now try to connect
        await connect({ connector });
        console.log("✅ Connection successful after disconnect!");
      } catch (error) {
        console.error("❌ Connection failed:", error);
        if (error instanceof Error && !error.message.includes("User rejected")) {
          alert(`Connection error: ${error.message}`);
        }
      } finally {
        setIsReconnecting(false);
      }
      return;
    }

    // Double-check that we have a valid connector with a provider (desktop only)
    if (!isOnMobile && connector.type === 'injected' && !walletProvider) {
      console.error("❌ Attempting to connect with injected wallet but no provider found");
      alert("No Web3 wallet detected. Please install a wallet extension like MetaMask, Rabby, or Trust Wallet.");
      setIsReconnecting(false);
      return;
    }

    // Normal connection flow (when not already connected)
    setIsReconnecting(true);
    try {
      // For injected wallets, try to trigger unlock first
      // Skip this for WalletConnect as it handles its own flow
      if (connector.type === 'injected' && walletProvider) {
        try {
          console.log("🔓 Requesting wallet accounts to trigger unlock if needed...");
          await walletProvider.request({ method: 'eth_requestAccounts' });
          console.log("✅ Wallet unlocked/accounts retrieved");
        } catch (unlockError) {
          // Se l'utente rifiuta l'unlock, non proseguiamo
          if (unlockError instanceof Error &&
              (unlockError.message.includes("User rejected") ||
               unlockError.message.includes("User denied"))) {
            console.log("ℹ️ User rejected wallet unlock request");
            setIsReconnecting(false);
            return;
          }
          // Altri errori non bloccano, proviamo comunque con wagmi
          console.warn("⚠️ Unlock request warning (continuing):", unlockError);
        }
      }

      // Ora procedi con la connessione wagmi normale
      await connect({ connector });
      console.log("✅ Connection successful!");
    } catch (error) {
      console.error("❌ Connection failed:", error);

      if (error instanceof Error) {
        // Handle "Connector already connected" error
        if (error.message.includes("Connector already connected") || error.message.includes("already connected")) {
          console.log("⚠️ Connector already connected error, forcing full disconnect and retry...");
          try {
            // Force disconnect
            disconnect();
            // Wait longer for disconnect to complete
            await new Promise(resolve => {
              reconnectTimeoutRef.current = setTimeout(resolve, 800);
            });
            // Try connecting again
            console.log("🔄 Retrying connection...");

            // Ri-trigghera unlock prima del retry (only for injected wallets)
            if (connector.type === 'injected' && walletProvider) {
              try {
                await walletProvider.request({ method: 'eth_requestAccounts' });
              } catch (unlockError) {
                console.warn("⚠️ Unlock retry warning:", unlockError);
              }
            }

            await connect({ connector });
            console.log("✅ Connection successful on retry!");
          } catch (retryError) {
            console.error("❌ Retry connection failed:", retryError);
            if (retryError instanceof Error && !retryError.message.includes("User rejected")) {
              alert(`Connection error: ${retryError.message}`);
            }
          }
        } else if (error.message.includes("Provider not found") || error.message.includes("provider not found")) {
          console.error("❌ No wallet provider found");
          alert("No Web3 wallet detected. Please install a wallet extension like MetaMask, Rabby, or Trust Wallet, then refresh the page.");
        } else if (error.message.includes("User rejected") || error.message.includes("User denied")) {
          console.log("ℹ️ User rejected the connection request");
        } else {
          console.error("❌ Unexpected connection error:", error.message);
          alert(`Connection error: ${error.message}\n\nPlease make sure you have a Web3 wallet installed.`);
        }
      } else {
        // Handle non-Error objects
        console.error("❌ Non-Error object thrown during connection:", error);
        alert("An unexpected error occurred while connecting. Please try again.");
      }
    } finally {
      setIsReconnecting(false);
      connectionInProgress.current = false;
    }
    } finally {
      // Outer finally to ensure connectionInProgress is always reset
      connectionInProgress.current = false;
    }
  };

  if (isConnected && address) {
    return (
      <Box
        bg="teal.500/10"
        border="1px solid"
        borderColor="teal.500/30"
        px={iconOnly ? 2 : 3}
        py={2}
        borderRadius="full"
        cursor="pointer"
        onClick={() => {
          console.log("🔌 Disconnect clicked");
          setIsReconnecting(false); // Reset reconnecting state
          disconnect();
        }}
        transition="all 0.2s"
        _hover={{
          bg: "teal.500/20",
          borderColor: "teal.500/50",
        }}
        width={fullWidth ? "100%" : "auto"}
      >
        <HStack gap={iconOnly ? 0 : 2} justify={fullWidth ? "center" : "flex-start"}>
          {!iconOnly && (
            <>
              <Text
                fontSize="sm"
                fontFamily="mono"
                color="teal.300"
                fontWeight="500"
              >
                {truncatedAddress}
              </Text>
              <Icon color="teal.400" opacity={0.6}>
                <LogOut size={14} />
              </Icon>
            </>
          )}
        </HStack>
      </Box>
    );
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        bg="teal.700"
        color="white"
        _hover={{ bg: "teal.800" }}
        _active={{ bg: "teal.900" }}
        onClick={() => handleConnect()}
        loading={isPending || isReconnecting}
        loadingText={isReconnecting ? "Reconnecting..." : "Connecting..."}
        borderRadius="full"
        width={fullWidth ? "100%" : "auto"}
        fontWeight="600"
        px={iconOnly ? 2 : undefined}
      >
        {iconOnly ? (
          <Icon boxSize={5}>
            <Wallet size={18} />
          </Icon>
        ) : hideIcon ? (
          <Text flexShrink={0}>Connect Wallet</Text>
        ) : (
          <>
            <Icon boxSize={5} mr={2} flexShrink={0}>
              <Wallet size={18} />
            </Icon>
            <Text flexShrink={0}>Connect Wallet</Text>
          </>
        )}
      </Button>

      {/* Mobile Wallet Selector Modal */}
      <MobileWalletSelector
        isOpen={showMobileWalletSelector}
        onClose={() => setShowMobileWalletSelector(false)}
        onSelectWallet={handleMobileWalletSelect}
      />
    </>
  );
};
