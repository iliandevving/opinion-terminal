"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Text,
  Button,
  VStack,
  HStack,
  Input,
  Spinner,
  Link,
} from "@chakra-ui/react";
import {
  useAccount,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";

// BSC Chain ID
const BSC_CHAIN_ID = 56;

// USDT Contract on BSC
const BSC_USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955" as const;

// ERC20 ABI for transfer and balanceOf
const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

interface DepositWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  safeAddress: string;
  onBalanceChange?: () => void;
}

export function DepositWithdrawModal({
  isOpen,
  onClose,
  safeAddress,
  onBalanceChange,
}: DepositWithdrawModalProps) {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { address } = useAccount();

  // Get EOA USDT balance
  const { data: eoaBalance, refetch: refetchEoaBalance } = useBalance({
    address: address,
    token: BSC_USDT_ADDRESS,
    chainId: BSC_CHAIN_ID,
  });

  // Get Safe USDT balance
  const { data: safeBalanceRaw, refetch: refetchSafeBalance } = useReadContract({
    address: BSC_USDT_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: safeAddress ? [safeAddress as `0x${string}`] : undefined,
    chainId: BSC_CHAIN_ID,
    query: { enabled: !!safeAddress },
  });

  const safeBalance = safeBalanceRaw
    ? Number(formatUnits(safeBalanceRaw, 18))
    : 0;

  const eoaBalanceNum = eoaBalance
    ? Number(eoaBalance.value) / Math.pow(10, eoaBalance.decimals)
    : 0;

  // Write contract for deposit (transfer from EOA to Safe)
  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    reset,
  } = useWriteContract();

  // Wait for transaction
  const {
    isLoading: isTxLoading,
    isSuccess: isTxSuccess,
    isError: isTxError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    chainId: BSC_CHAIN_ID,
    confirmations: 1,
  });

  // Handle successful transaction
  useEffect(() => {
    if (isTxSuccess) {
      refetchEoaBalance();
      refetchSafeBalance();
      setAmount("");
      reset();
      setIsProcessing(false);
      onBalanceChange?.();
    }
  }, [isTxSuccess, refetchEoaBalance, refetchSafeBalance, reset, onBalanceChange]);

  // Handle failed transaction
  useEffect(() => {
    if (isTxError) {
      reset();
      setIsProcessing(false);
    }
  }, [isTxError, reset]);

  const handleDeposit = useCallback(() => {
    if (!address || !safeAddress || !amount) return;

    const amountNum = parseFloat(amount);
    if (amountNum <= 0 || amountNum > eoaBalanceNum) return;

    setIsProcessing(true);

    try {
      const amountWei = parseUnits(amount, 18);

      writeContract({
        address: BSC_USDT_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [safeAddress as `0x${string}`, amountWei],
        chainId: BSC_CHAIN_ID,
      });
    } catch (error) {
      console.error("Deposit error:", error);
      setIsProcessing(false);
    }
  }, [address, safeAddress, amount, eoaBalanceNum, writeContract]);

  const amountNum = parseFloat(amount) || 0;
  const isValidDeposit = amountNum > 0 && amountNum <= eoaBalanceNum;
  const isValidWithdraw = amountNum > 0 && amountNum <= safeBalance;

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.700"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      <Box
        bg="gray.900"
        borderRadius="xl"
        border="1px solid"
        borderColor="gray.700"
        p={6}
        maxW="400px"
        w="90%"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <HStack justify="space-between" mb={4}>
          <Text color="white" fontSize="lg" fontWeight="bold">
            Manage USDT
          </Text>
          <Button size="sm" variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </HStack>

        {/* Tabs */}
        <HStack mb={4} gap={2}>
          <Button
            flex={1}
            size="sm"
            variant={activeTab === "deposit" ? "solid" : "outline"}
            colorScheme={activeTab === "deposit" ? "green" : "gray"}
            onClick={() => setActiveTab("deposit")}
          >
            Deposit
          </Button>
          <Button
            flex={1}
            size="sm"
            variant={activeTab === "withdraw" ? "solid" : "outline"}
            colorScheme={activeTab === "withdraw" ? "orange" : "gray"}
            onClick={() => setActiveTab("withdraw")}
          >
            Withdraw
          </Button>
        </HStack>

        {/* Balances */}
        <Box bg="gray.800" p={3} borderRadius="md" mb={4}>
          <HStack justify="space-between" mb={2}>
            <Text color="gray.400" fontSize="xs">Your Wallet (EOA)</Text>
            <Text color="white" fontSize="sm" fontFamily="mono">
              {eoaBalanceNum.toFixed(2)} USDT
            </Text>
          </HStack>
          <HStack justify="space-between">
            <Text color="gray.400" fontSize="xs">Opinion Safe</Text>
            <Text color="teal.300" fontSize="sm" fontFamily="mono" fontWeight="bold">
              {safeBalance.toFixed(2)} USDT
            </Text>
          </HStack>
        </Box>

        {activeTab === "deposit" ? (
          /* Deposit Tab */
          <VStack gap={4} alignItems="stretch">
            <Box>
              <HStack justify="space-between" mb={1}>
                <Text color="gray.400" fontSize="xs">Amount to Deposit</Text>
                <Text
                  color="teal.400"
                  fontSize="xs"
                  cursor="pointer"
                  onClick={() => setAmount(eoaBalanceNum.toFixed(2))}
                >
                  Max: {eoaBalanceNum.toFixed(2)}
                </Text>
              </HStack>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                bg="gray.800"
                border="1px solid"
                borderColor="gray.700"
                color="white"
                _focus={{ borderColor: "green.500" }}
                _placeholder={{ color: "gray.500" }}
              />
            </Box>

            <Text color="gray.500" fontSize="xs" textAlign="center">
              Transfer USDT from your wallet to your Opinion Safe for trading
            </Text>

            <Button
              colorScheme="green"
              size="lg"
              onClick={handleDeposit}
              disabled={!isValidDeposit || isProcessing}
              loading={isWritePending || isTxLoading}
            >
              {isWritePending
                ? "Confirm in Wallet..."
                : isTxLoading
                ? "Processing..."
                : `Deposit ${amountNum > 0 ? amountNum.toFixed(2) : ""} USDT`}
            </Button>

            {txHash && (
              <Link
                href={`https://bscscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                color="teal.400"
                fontSize="xs"
                textAlign="center"
              >
                View on BSCScan
              </Link>
            )}
          </VStack>
        ) : (
          /* Withdraw Tab */
          <VStack gap={4} alignItems="stretch">
            <Box>
              <HStack justify="space-between" mb={1}>
                <Text color="gray.400" fontSize="xs">Amount to Withdraw</Text>
                <Text
                  color="teal.400"
                  fontSize="xs"
                  cursor="pointer"
                  onClick={() => setAmount(safeBalance.toFixed(2))}
                >
                  Max: {safeBalance.toFixed(2)}
                </Text>
              </HStack>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                bg="gray.800"
                border="1px solid"
                borderColor="gray.700"
                color="white"
                _focus={{ borderColor: "orange.500" }}
                _placeholder={{ color: "gray.500" }}
              />
            </Box>

            <Box bg="orange.900" p={3} borderRadius="md" border="1px solid" borderColor="orange.700">
              <Text color="orange.200" fontSize="xs">
                <strong>Note:</strong> Withdrawing from your Safe requires signing a Safe transaction.
                For now, please use{" "}
                <Link
                  href="https://app.safe.global"
                  target="_blank"
                  color="orange.300"
                  textDecoration="underline"
                >
                  app.safe.global
                </Link>{" "}
                or{" "}
                <Link
                  href="https://app.opinion.trade"
                  target="_blank"
                  color="orange.300"
                  textDecoration="underline"
                >
                  app.opinion.trade
                </Link>{" "}
                to withdraw funds.
              </Text>
            </Box>

            <Link
              href={`https://app.safe.global/home?safe=bnb:${safeAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ width: '100%' }}
            >
              <Button colorScheme="orange" size="lg" w="100%">
                Open Safe App
              </Button>
            </Link>
          </VStack>
        )}

        {/* Safe Address */}
        <Box mt={4} pt={4} borderTop="1px solid" borderColor="gray.700">
          <Text color="gray.500" fontSize="xs" mb={1}>Your Opinion Safe Address:</Text>
          <Text color="gray.400" fontSize="xs" fontFamily="mono" wordBreak="break-all">
            {safeAddress}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
