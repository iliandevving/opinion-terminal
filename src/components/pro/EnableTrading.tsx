"use client";

import { useState, useEffect, useCallback } from "react";
import { Box, Text, Button, VStack, HStack, Spinner, Input, Link } from "@chakra-ui/react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, maxUint256, isAddress, encodeFunctionData } from "viem";

// BSC Chain ID
const BSC_CHAIN_ID = 56;

// Opinion contract addresses on BSC (from API /openapi/quoteToken)
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955" as const;
const BSC_CTF_EXCHANGE_ADDRESS = "0x5f45344126d6488025b0b84a3a8189f2487a7246" as const;
const BSC_CONDITIONAL_TOKENS_ADDRESS = "0xAD1a38cEc043e70E83a3eC30443dB285ED10D774" as const;

// Gnosis Safe v1.3.0 addresses on BSC
const SAFE_PROXY_FACTORY_ADDRESS = "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2" as const;
const SAFE_SINGLETON_ADDRESS = "0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552" as const;
const SAFE_FALLBACK_HANDLER = "0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4" as const;

// Minimum allowance threshold (1 billion USDT)
const MIN_ALLOWANCE = parseUnits("1000000000", 18);

// LocalStorage key for Opinion wallet
const OPINION_WALLET_KEY = "opinion_wallet";

// Get stored Opinion wallet for a given EOA
function getStoredOpinionWallet(eoa: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(`${OPINION_WALLET_KEY}_${eoa.toLowerCase()}`);
    return stored || null;
  } catch {
    return null;
  }
}

// Store Opinion wallet for a given EOA
function storeOpinionWallet(eoa: string, wallet: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${OPINION_WALLET_KEY}_${eoa.toLowerCase()}`, wallet.toLowerCase());
  } catch {
    // Ignore storage errors
  }
}

// Clear stored Opinion wallet
function clearStoredOpinionWallet(eoa: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${OPINION_WALLET_KEY}_${eoa.toLowerCase()}`);
  } catch {
    // Ignore storage errors
  }
}

// ABI for ERC20 approve/allowance
const ERC20_ABI = [
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

// ABI for ERC1155 setApprovalForAll/isApprovedForAll
const ERC1155_ABI = [
  {
    name: "isApprovedForAll",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "setApprovalForAll",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
] as const;

// ABI for Gnosis Safe Proxy Factory
const SAFE_PROXY_FACTORY_ABI = [
  {
    name: "createProxyWithNonce",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_singleton", type: "address" },
      { name: "initializer", type: "bytes" },
      { name: "saltNonce", type: "uint256" },
    ],
    outputs: [{ name: "proxy", type: "address" }],
  },
] as const;

// ABI for Safe setup (used to encode initializer)
const SAFE_SETUP_ABI = [
  {
    name: "setup",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_owners", type: "address[]" },
      { name: "_threshold", type: "uint256" },
      { name: "to", type: "address" },
      { name: "data", type: "bytes" },
      { name: "fallbackHandler", type: "address" },
      { name: "paymentToken", type: "address" },
      { name: "payment", type: "uint256" },
      { name: "paymentReceiver", type: "address" },
    ],
    outputs: [],
  },
] as const;

interface EnableTradingProps {
  onTradingEnabled?: (enabled: boolean) => void;
  onProxyWalletChange?: (proxyWallet: string | null) => void;
  compact?: boolean; // For header display
}

type ApprovalStep = "usdt_exchange" | "usdt_ct" | "ct_exchange" | "create_safe";

export function EnableTrading({ onTradingEnabled, onProxyWalletChange, compact = false }: EnableTradingProps) {
  const { address, isConnected, chain } = useAccount();
  const [currentStep, setCurrentStep] = useState<ApprovalStep | null>(null);
  const [opinionWallet, setOpinionWallet] = useState<string>("");
  const [walletInput, setWalletInput] = useState<string>("");
  const [showWalletSetup, setShowWalletSetup] = useState(false);
  const [showFullSetup, setShowFullSetup] = useState(false); // For compact mode expansion
  const [walletError, setWalletError] = useState<string | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [isCreatingSafe, setIsCreatingSafe] = useState(false);
  const [safeCreationTxHash, setSafeCreationTxHash] = useState<`0x${string}` | null>(null);
  const [noWalletDetected, setNoWalletDetected] = useState(false);

  // Auto-detect Opinion wallet by querying Gnosis Safe API
  // This finds all Safes owned by the connected wallet on BSC
  const autoDetectOpinionWallet = useCallback(async () => {
    if (!address) return;

    setIsAutoDetecting(true);
    setWalletError(null);
    setNoWalletDetected(false);

    try {
      const response = await fetch(`/api/opinion/wallet?address=${address}`);
      const data = await response.json();

      if (data.success && data.opinionWallet) {
        // Found the Opinion wallet!
        storeOpinionWallet(address, data.opinionWallet);
        setOpinionWallet(data.opinionWallet.toLowerCase());
        setShowWalletSetup(false);
        setNoWalletDetected(false);
        console.log("Auto-detected Opinion wallet:", data.opinionWallet, data.message);
      } else {
        // No wallet found - show create option directly
        setNoWalletDetected(true);
        console.log("No wallet detected, showing create option");
      }
    } catch (error) {
      console.error("Failed to auto-detect wallet:", error);
      // On error, also show create option
      setNoWalletDetected(true);
    } finally {
      setIsAutoDetecting(false);
    }
  }, [address]);

  // Load stored Opinion wallet on mount, or auto-detect if none stored
  useEffect(() => {
    if (!address) return;

    const storedWallet = getStoredOpinionWallet(address);
    if (storedWallet && isAddress(storedWallet)) {
      setOpinionWallet(storedWallet);
    } else {
      // Auto-detect using Gnosis Safe API (no API key needed!)
      autoDetectOpinionWallet();
    }
  }, [address, autoDetectOpinionWallet]);

  // Notify parent when Opinion wallet changes
  useEffect(() => {
    if (onProxyWalletChange) {
      onProxyWalletChange(opinionWallet || null);
    }
  }, [opinionWallet, onProxyWalletChange]);

  // Handle Opinion wallet input
  const handleSetOpinionWallet = useCallback(() => {
    setWalletError(null);
    const trimmed = walletInput.trim();

    if (!trimmed) {
      setWalletError("Please enter your Opinion wallet address");
      return;
    }

    if (!isAddress(trimmed)) {
      setWalletError("Invalid wallet address format");
      return;
    }

    if (address) {
      storeOpinionWallet(address, trimmed);
      setOpinionWallet(trimmed.toLowerCase());
      setShowWalletSetup(false);
      setWalletInput("");
    }
  }, [address, walletInput]);

  // Handle Opinion wallet clear
  const handleClearOpinionWallet = useCallback(() => {
    if (address) {
      clearStoredOpinionWallet(address);
      setOpinionWallet("");
    }
  }, [address]);

  // Check USDT allowance for CTF Exchange
  const { data: usdtExchangeAllowance, refetch: refetchUsdtExchange } = useReadContract({
    address: BSC_USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, BSC_CTF_EXCHANGE_ADDRESS] : undefined,
    chainId: BSC_CHAIN_ID,
    query: { enabled: !!address },
  });

  // Check USDT allowance for Conditional Tokens (for split/merge)
  const { data: usdtCtAllowance, refetch: refetchUsdtCt } = useReadContract({
    address: BSC_USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, BSC_CONDITIONAL_TOKENS_ADDRESS] : undefined,
    chainId: BSC_CHAIN_ID,
    query: { enabled: !!address },
  });

  // Check CT approval for Exchange
  const { data: ctExchangeApproval, refetch: refetchCtExchange } = useReadContract({
    address: BSC_CONDITIONAL_TOKENS_ADDRESS,
    abi: ERC1155_ABI,
    functionName: "isApprovedForAll",
    args: address ? [address, BSC_CTF_EXCHANGE_ADDRESS] : undefined,
    chainId: BSC_CHAIN_ID,
    query: { enabled: !!address },
  });

  // Write contract for approvals
  const { writeContract, data: txHash, isPending: isWritePending, reset } = useWriteContract();

  // Write contract for Safe creation
  const {
    writeContract: writeCreateSafe,
    data: safeTxHash,
    isPending: isSafeWritePending,
    reset: resetSafe
  } = useWriteContract();

  // Wait for approval tx
  const { isLoading: isTxLoading, isSuccess: isTxSuccess, isError: isTxError } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: BSC_CHAIN_ID,
    confirmations: 1,
  });

  // Wait for Safe creation tx
  const {
    isLoading: isSafeTxLoading,
    isSuccess: isSafeTxSuccess,
    isError: isSafeTxError,
    data: safeReceipt
  } = useWaitForTransactionReceipt({
    hash: safeTxHash,
    chainId: BSC_CHAIN_ID,
    confirmations: 1,
  });

  // Approval status
  const isUsdtExchangeApproved = usdtExchangeAllowance !== undefined && usdtExchangeAllowance >= MIN_ALLOWANCE;
  const isUsdtCtApproved = usdtCtAllowance !== undefined && usdtCtAllowance >= MIN_ALLOWANCE;
  const isCtExchangeApproved = ctExchangeApproval === true;

  const allApproved = isUsdtExchangeApproved && isUsdtCtApproved && isCtExchangeApproved;

  // Refetch after successful tx
  useEffect(() => {
    if (isTxSuccess) {
      refetchUsdtExchange();
      refetchUsdtCt();
      refetchCtExchange();
      reset();
      setCurrentStep(null);
    }
  }, [isTxSuccess, refetchUsdtExchange, refetchUsdtCt, refetchCtExchange, reset]);

  // Reset on error
  useEffect(() => {
    if (isTxError) {
      reset();
      setCurrentStep(null);
    }
  }, [isTxError, reset]);

  // Handle Safe creation success - extract Safe address from logs
  useEffect(() => {
    if (isSafeTxSuccess && safeReceipt && address) {
      // The ProxyCreation event has the Safe address as first topic
      // Event: ProxyCreation(address proxy, address singleton)
      const proxyCreationLog = safeReceipt.logs.find(
        (log) => log.address.toLowerCase() === SAFE_PROXY_FACTORY_ADDRESS.toLowerCase()
      );

      if (proxyCreationLog && proxyCreationLog.topics[1]) {
        // The proxy address is in the first indexed parameter (topics[1])
        // It's padded to 32 bytes, so we extract the address
        const safeAddress = `0x${proxyCreationLog.topics[1].slice(-40)}` as `0x${string}`;
        console.log("Safe created at:", safeAddress);

        // Store and set the wallet - this will trigger parent notification via useEffect
        storeOpinionWallet(address, safeAddress);
        setOpinionWallet(safeAddress.toLowerCase());
        setNoWalletDetected(false);
        setIsCreatingSafe(false);
        setSafeCreationTxHash(safeTxHash || null);
        resetSafe();
        setCurrentStep(null);
      }
    }
  }, [isSafeTxSuccess, safeReceipt, address, safeTxHash, resetSafe]);

  // Reset Safe creation on error
  useEffect(() => {
    if (isSafeTxError) {
      setIsCreatingSafe(false);
      resetSafe();
      setCurrentStep(null);
      setWalletError("Failed to create Safe wallet. Please try again.");
    }
  }, [isSafeTxError, resetSafe]);

  // Notify parent of approval state changes
  useEffect(() => {
    if (onTradingEnabled) {
      onTradingEnabled(allApproved);
    }
  }, [allApproved, onTradingEnabled]);

  // Approval handlers
  const handleApproveUsdtExchange = () => {
    setCurrentStep("usdt_exchange");
    writeContract({
      address: BSC_USDT_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [BSC_CTF_EXCHANGE_ADDRESS, maxUint256],
      chainId: BSC_CHAIN_ID,
    });
  };

  const handleApproveUsdtCt = () => {
    setCurrentStep("usdt_ct");
    writeContract({
      address: BSC_USDT_ADDRESS,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [BSC_CONDITIONAL_TOKENS_ADDRESS, maxUint256],
      chainId: BSC_CHAIN_ID,
    });
  };

  const handleApproveCtExchange = () => {
    setCurrentStep("ct_exchange");
    writeContract({
      address: BSC_CONDITIONAL_TOKENS_ADDRESS,
      abi: ERC1155_ABI,
      functionName: "setApprovalForAll",
      args: [BSC_CTF_EXCHANGE_ADDRESS, true],
      chainId: BSC_CHAIN_ID,
    });
  };

  // Create Safe wallet handler
  const handleCreateSafe = useCallback(() => {
    if (!address) return;

    setIsCreatingSafe(true);
    setWalletError(null);
    setCurrentStep("create_safe");

    // Encode the Safe setup call
    // setup(owners[], threshold, to, data, fallbackHandler, paymentToken, payment, paymentReceiver)
    const setupData = encodeFunctionData({
      abi: SAFE_SETUP_ABI,
      functionName: "setup",
      args: [
        [address], // owners - just the user
        BigInt(1), // threshold - 1 of 1
        "0x0000000000000000000000000000000000000000" as `0x${string}`, // to - no delegate call
        "0x" as `0x${string}`, // data - no data
        SAFE_FALLBACK_HANDLER, // fallbackHandler
        "0x0000000000000000000000000000000000000000" as `0x${string}`, // paymentToken - no payment
        BigInt(0), // payment - 0
        "0x0000000000000000000000000000000000000000" as `0x${string}`, // paymentReceiver - no receiver
      ],
    });

    // Use current timestamp as nonce for uniqueness
    const saltNonce = BigInt(Date.now());

    writeCreateSafe({
      address: SAFE_PROXY_FACTORY_ADDRESS,
      abi: SAFE_PROXY_FACTORY_ABI,
      functionName: "createProxyWithNonce",
      args: [SAFE_SINGLETON_ADDRESS, setupData, saltNonce],
      chainId: BSC_CHAIN_ID,
    });
  }, [address, writeCreateSafe]);

  if (!isConnected) {
    return null;
  }

  // Wrong network warning
  if (chain?.id !== BSC_CHAIN_ID) {
    if (compact) {
      return (
        <Text color="#ea3943" fontSize="xs" px={2}>
          Wrong Network
        </Text>
      );
    }
    return (
      <Box bg="red.900" p={4} borderRadius="lg" border="1px solid" borderColor="red.700" mb={4}>
        <Text color="red.200" fontSize="sm" fontWeight="bold">
          Wrong Network
        </Text>
        <Text color="gray.300" fontSize="xs">
          Please switch to BNB Smart Chain (BSC) to trade on Opinion.
        </Text>
      </Box>
    );
  }

  // Check if Opinion wallet is set
  const hasOpinionWallet = opinionWallet && isAddress(opinionWallet);

  // Compact mode for header
  if (compact) {
    const approvalCount = [isUsdtExchangeApproved, isUsdtCtApproved, isCtExchangeApproved].filter(Boolean).length;

    // All set - show green badge
    if (allApproved && hasOpinionWallet) {
      return (
        <HStack
          bg="rgba(22, 199, 132, 0.15)"
          px={2}
          py={1}
          borderRadius="md"
          cursor="pointer"
          onClick={() => setShowFullSetup(!showFullSetup)}
          _hover={{ bg: "rgba(22, 199, 132, 0.25)" }}
        >
          <Box w={2} h={2} borderRadius="full" bg="#16c784" />
          <Text color="#16c784" fontSize="xs" fontWeight="bold">
            Trading Ready
          </Text>
        </HStack>
      );
    }

    // Not ready - show setup needed (in compact mode, trigger Safe creation)
    if (!hasOpinionWallet) {
      if (isSafeWritePending || isSafeTxLoading) {
        return (
          <HStack bg="rgba(246, 190, 0, 0.15)" px={2} py={1} borderRadius="md">
            <Spinner size="xs" color="#f6be00" />
            <Text color="#f6be00" fontSize="xs" fontWeight="bold">
              Creating...
            </Text>
          </HStack>
        );
      }
      return (
        <HStack
          bg="rgba(246, 190, 0, 0.15)"
          px={2}
          py={1}
          borderRadius="md"
          cursor="pointer"
          onClick={handleCreateSafe}
          _hover={{ bg: "rgba(246, 190, 0, 0.25)" }}
        >
          <Box w={2} h={2} borderRadius="full" bg="#f6be00" />
          <Text color="#f6be00" fontSize="xs" fontWeight="bold">
            Create Wallet
          </Text>
        </HStack>
      );
    }

    // Has wallet but needs approvals
    return (
      <HStack
        bg="rgba(246, 190, 0, 0.15)"
        px={2}
        py={1}
        borderRadius="md"
        cursor="pointer"
        _hover={{ bg: "rgba(246, 190, 0, 0.25)" }}
      >
        <Box w={2} h={2} borderRadius="full" bg="#f6be00" />
        <Text color="#f6be00" fontSize="xs" fontWeight="bold">
          {approvalCount}/3 Approved
        </Text>
      </HStack>
    );
  }

  // All approved - show minimal success state
  if (allApproved && hasOpinionWallet) {
    return (
      <Box bg="rgba(22, 199, 132, 0.1)" p={3} borderRadius="md" border="1px solid" borderColor="rgba(22, 199, 132, 0.3)">
        <HStack justify="space-between">
          <VStack alignItems="start" gap={0}>
            <HStack gap={1}>
              <Box w={2} h={2} borderRadius="full" bg="#16c784" />
              <Text color="#16c784" fontSize="xs" fontWeight="bold">Trading Ready</Text>
            </HStack>
            <Text color="#848e9c" fontSize="xs">
              Wallet: {opinionWallet.slice(0, 6)}...{opinionWallet.slice(-4)}
            </Text>
          </VStack>
          <Button size="xs" variant="ghost" color="#848e9c" onClick={() => setShowWalletSetup(true)}>
            Edit
          </Button>
        </HStack>
        {showWalletSetup && (
          <Box mt={3} pt={3} borderTop="1px solid" borderColor="#1e2329">
            <Text color="#848e9c" fontSize="xs" mb={2}>Enter Opinion wallet:</Text>
            <HStack>
              <Input
                size="sm"
                placeholder="0x..."
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                fontFamily="mono"
                fontSize="xs"
                bg="#1e2329"
                border="none"
                color="white"
              />
              <Button size="sm" bg="#16c784" color="white" _hover={{ opacity: 0.9 }} onClick={handleSetOpinionWallet}>
                Save
              </Button>
            </HStack>
            {walletError && (
              <Text color="#ea3943" fontSize="xs" mt={1}>{walletError}</Text>
            )}
            <Button size="xs" variant="ghost" color="#848e9c" mt={2} onClick={() => setShowWalletSetup(false)}>
              Cancel
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  const isProcessing = isWritePending || isTxLoading;
  const isSafeProcessing = isSafeWritePending || isSafeTxLoading;

  return (
    <Box bg="#1e2329" p={3} borderRadius="md">
      <Text color="#f6be00" fontSize="xs" fontWeight="bold" mb={3}>
        Enable Trading
      </Text>

      {/* Opinion Wallet Setup */}
      {!hasOpinionWallet ? (
        <Box mb={3}>
          {isAutoDetecting ? (
            <HStack justify="center" py={3}>
              <Spinner size="sm" color="#16c784" />
              <Text color="#16c784" fontSize="xs">Detecting wallet...</Text>
            </HStack>
          ) : isSafeProcessing ? (
            <VStack gap={2} py={3}>
              <Spinner size="sm" color="#f6be00" />
              <Text color="#f6be00" fontSize="xs" textAlign="center">
                {isSafeWritePending ? "Confirm in wallet..." : "Creating Safe wallet..."}
              </Text>
              <Text color="#848e9c" fontSize="xs" textAlign="center">
                This deploys a smart contract wallet on BSC
              </Text>
            </VStack>
          ) : noWalletDetected ? (
            // No wallet found - show create option prominently
            <VStack gap={2} alignItems="stretch">
              <Text color="#848e9c" fontSize="xs" textAlign="center" mb={1}>
                No trading wallet found
              </Text>
              <Button
                size="sm"
                bg="#f6be00"
                color="black"
                _hover={{ opacity: 0.9 }}
                onClick={handleCreateSafe}
                disabled={isSafeProcessing}
              >
                Create Trading Wallet
              </Button>
              <Text color="#848e9c" fontSize="xs" textAlign="center">
                One-click setup • Gnosis Safe on BSC
              </Text>
              <Box pt={2} borderTop="1px solid" borderColor="#363c47" mt={1}>
                <Text color="#848e9c" fontSize="xs" mb={1}>Have an existing wallet?</Text>
                <HStack>
                  <Input
                    size="sm"
                    placeholder="0x..."
                    value={walletInput}
                    onChange={(e) => setWalletInput(e.target.value)}
                    fontFamily="mono"
                    fontSize="xs"
                    bg="#0f1216"
                    border="none"
                    color="white"
                    _placeholder={{ color: "#848e9c" }}
                  />
                  <Button size="sm" bg="#363c47" color="white" _hover={{ bg: "#4a5568" }} onClick={handleSetOpinionWallet}>
                    Save
                  </Button>
                </HStack>
              </Box>
              {walletError && <Text color="#ea3943" fontSize="xs">{walletError}</Text>}
            </VStack>
          ) : (
            // Initial state before detection
            <VStack gap={2} alignItems="stretch">
              <Button
                size="sm"
                bg="#16c784"
                color="white"
                _hover={{ opacity: 0.9 }}
                onClick={autoDetectOpinionWallet}
                loading={isAutoDetecting}
              >
                Detect My Wallet
              </Button>
              {walletError && <Text color="#ea3943" fontSize="xs">{walletError}</Text>}
            </VStack>
          )}
        </Box>
      ) : (
        <Box bg="#0f1216" p={2} borderRadius="md" mb={3}>
          <HStack justify="space-between">
            <HStack>
              <Box w={2} h={2} borderRadius="full" bg="#16c784" />
              <Text color="#b7bdc6" fontSize="xs">
                {opinionWallet.slice(0, 8)}...{opinionWallet.slice(-4)}
              </Text>
            </HStack>
            <Button size="xs" variant="ghost" color="#848e9c" onClick={() => setShowWalletSetup(true)}>
              Edit
            </Button>
          </HStack>
          {showWalletSetup && (
            <VStack gap={2} alignItems="stretch" mt={2} pt={2} borderTop="1px solid" borderColor="#363c47">
              <HStack>
                <Input
                  size="sm"
                  placeholder="0x..."
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  fontFamily="mono"
                  fontSize="xs"
                  bg="#1e2329"
                  border="none"
                  color="white"
                />
                <Button size="sm" bg="#16c784" color="white" _hover={{ opacity: 0.9 }} onClick={handleSetOpinionWallet}>
                  Save
                </Button>
              </HStack>
              {walletError && <Text color="#ea3943" fontSize="xs">{walletError}</Text>}
              <HStack>
                <Button size="xs" variant="ghost" color="#ea3943" onClick={handleClearOpinionWallet}>Remove</Button>
                <Button size="xs" variant="ghost" color="#848e9c" onClick={() => setShowWalletSetup(false)}>Cancel</Button>
              </HStack>
            </VStack>
          )}
        </Box>
      )}

      {hasOpinionWallet && (
        <Text color="#848e9c" fontSize="xs" mb={2}>Approve contracts:</Text>
      )}

      <VStack gap={2} alignItems="stretch">
        {/* USDT → Exchange */}
        <HStack justify="space-between" py={1}>
          <Text color="white" fontSize="xs">USDT for Orders</Text>
          {isUsdtExchangeApproved ? (
            <Box w={2} h={2} borderRadius="full" bg="#16c784" />
          ) : (
            <Button
              size="xs"
              bg="#f6be00"
              color="black"
              _hover={{ opacity: 0.9 }}
              onClick={handleApproveUsdtExchange}
              loading={isProcessing && currentStep === "usdt_exchange"}
              disabled={isProcessing || !hasOpinionWallet}
            >
              Approve
            </Button>
          )}
        </HStack>

        {/* USDT → CT */}
        <HStack justify="space-between" py={1}>
          <Text color="white" fontSize="xs">USDT for Minting</Text>
          {isUsdtCtApproved ? (
            <Box w={2} h={2} borderRadius="full" bg="#16c784" />
          ) : (
            <Button
              size="xs"
              bg="#f6be00"
              color="black"
              _hover={{ opacity: 0.9 }}
              onClick={handleApproveUsdtCt}
              loading={isProcessing && currentStep === "usdt_ct"}
              disabled={isProcessing || !hasOpinionWallet}
            >
              Approve
            </Button>
          )}
        </HStack>

        {/* CT → Exchange */}
        <HStack justify="space-between" py={1}>
          <Text color="white" fontSize="xs">Outcome Tokens</Text>
          {isCtExchangeApproved ? (
            <Box w={2} h={2} borderRadius="full" bg="#16c784" />
          ) : (
            <Button
              size="xs"
              bg="#f6be00"
              color="black"
              _hover={{ opacity: 0.9 }}
              onClick={handleApproveCtExchange}
              loading={isProcessing && currentStep === "ct_exchange"}
              disabled={isProcessing || !hasOpinionWallet}
            >
              Approve
            </Button>
          )}
        </HStack>
      </VStack>

      {isProcessing && (
        <HStack justify="center" mt={2}>
          <Spinner size="xs" color="#f6be00" />
          <Text color="#f6be00" fontSize="xs">
            {isWritePending ? "Confirm in wallet..." : "Confirming..."}
          </Text>
        </HStack>
      )}

      {txHash && (
        <Box mt={2} textAlign="center">
          <Link href={`https://bscscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" color="#16c784" fontSize="xs">
            View on BSCScan
          </Link>
        </Box>
      )}
    </Box>
  );
}

// Export contract addresses
export const OPINION_CONTRACTS = {
  USDT: BSC_USDT_ADDRESS,
  CTF_EXCHANGE: BSC_CTF_EXCHANGE_ADDRESS,
  CONDITIONAL_TOKENS: BSC_CONDITIONAL_TOKENS_ADDRESS,
  CHAIN_ID: BSC_CHAIN_ID,
};
