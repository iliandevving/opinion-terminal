"use client";

import {
  Box,
  VStack,
  Text,
  HStack,
  Icon,
  Button,
} from "@chakra-ui/react";
import { Network, AlertCircle, Wallet } from "lucide-react";
import { useEnsureBNBChain } from "@/hooks/useEnsureBNBChain";
import { ConnectWalletButton } from "@/components/common/ConnectWalletButton";

interface ChainSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchComplete?: () => void;
}

export const ChainSwitchModal = ({
  isOpen,
  onClose,
  onSwitchComplete
}: ChainSwitchModalProps) => {
  const {
    isConnected,
    requiresConnection,
    requiresSwitch,
    currentChainName,
    isSwitching,
    switchToBNBChain,
  } = useEnsureBNBChain();

  if (!isOpen) return null;

  const handleSwitchChain = async () => {
    const result = await switchToBNBChain();
    if (result.success) {
      onSwitchComplete?.();
      onClose();
    }
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.9)"
      backdropFilter="blur(8px)"
      zIndex={9999}
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={4}
    >
      <Box
        bg="gray.900"
        border="2px solid"
        borderColor="orange.500/30"
        borderRadius="16px"
        p={8}
        maxW="500px"
        width="100%"
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5)"
      >
        <VStack gap={6} align="stretch">
          {/* Header */}
          <VStack gap={2}>
            <Box
              bg="orange.500/10"
              p={4}
              borderRadius="12px"
              border="1px solid"
              borderColor="orange.500/30"
            >
              <Icon color="orange.500" boxSize={8}>
                {requiresConnection ? <Wallet /> : <Network />}
              </Icon>
            </Box>
            <Text
              fontSize="24px"
              fontWeight="600"
              color="white"
              textAlign="center"
            >
              {requiresConnection ? "Connect Your Wallet" : "Switch to BNB Chain"}
            </Text>
            <Text
              fontSize="14px"
              color="gray.400"
              textAlign="center"
              fontWeight="400"
            >
              {requiresConnection
                ? "Please connect your wallet to continue with this transaction"
                : `You're currently on ${currentChainName || "an unsupported network"}. Please switch to BNB Chain to continue.`}
            </Text>
          </VStack>

          {/* Requirements */}
          <VStack gap={3} align="stretch">
            {/* Wallet Connection Status */}
            <Box
              bg={isConnected ? "teal.500/10" : "orange.500/10"}
              border="1px solid"
              borderColor={isConnected ? "teal.500/30" : "orange.500/30"}
              borderRadius="8px"
              p={4}
            >
              <HStack justify="space-between">
                <HStack gap={3}>
                  <Icon
                    color={isConnected ? "teal.500" : "orange.500"}
                    boxSize={5}
                  >
                    <Wallet />
                  </Icon>
                  <Text
                    fontSize="sm"
                    fontWeight="400"
                    color={isConnected ? "white" : "gray.400"}
                  >
                    Wallet Connection
                  </Text>
                </HStack>
                <Text
                  fontSize="xs"
                  color={isConnected ? "teal.400" : "orange.400"}
                  fontWeight="500"
                >
                  {isConnected ? "Connected" : "Not Connected"}
                </Text>
              </HStack>
            </Box>

            {/* Network Status */}
            {isConnected && (
              <Box
                bg={requiresSwitch ? "orange.500/10" : "teal.500/10"}
                border="1px solid"
                borderColor={requiresSwitch ? "orange.500/30" : "teal.500/30"}
                borderRadius="8px"
                p={4}
              >
                <HStack justify="space-between">
                  <HStack gap={3}>
                    <Icon
                      color={requiresSwitch ? "orange.500" : "teal.500"}
                      boxSize={5}
                    >
                      {requiresSwitch ? <AlertCircle /> : <Network />}
                    </Icon>
                    <VStack align="start" gap={0}>
                      <Text
                        fontSize="sm"
                        fontWeight="400"
                        color={requiresSwitch ? "gray.400" : "white"}
                      >
                        Network
                      </Text>
                      {currentChainName && (
                        <Text
                          fontSize="xs"
                          color="gray.500"
                          fontWeight="400"
                        >
                          Current: {currentChainName}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                  <Text
                    fontSize="xs"
                    color={requiresSwitch ? "orange.400" : "teal.400"}
                    fontWeight="500"
                  >
                    {requiresSwitch ? "Wrong Network" : "BNB Chain"}
                  </Text>
                </HStack>
              </Box>
            )}
          </VStack>

          {/* Information Box */}
          <Box
            bg="orange.500/10"
            border="1px solid"
            borderColor="orange.500/30"
            borderRadius="8px"
            p={4}
          >
            <Text fontSize="sm" color="blue.300" fontWeight="400">
              <strong>Why BNB Chain?</strong>
              <br />
              All on-chain transactions require BNB Chain for low fees and fast confirmations.
            </Text>
          </Box>

          {/* Action Buttons */}
          <VStack gap={3}>
            {requiresConnection && (
              <ConnectWalletButton size="lg" fullWidth />
            )}

            {isConnected && requiresSwitch && (
              <Button
                size="lg"
                width="100%"
                bg="orange.600"
                color="white"
                _hover={{ bg: "orange.700" }}
                borderRadius="full"
                fontWeight="600"
                onClick={handleSwitchChain}
                loading={isSwitching}
                loadingText="Switching..."
              >
                Switch to BNB Chain
              </Button>
            )}

            <Button
              size="lg"
              width="100%"
              variant="outline"
              borderColor="gray.700"
              color="gray.400"
              _hover={{ bg: "gray.800", borderColor: "gray.600" }}
              borderRadius="full"
              fontWeight="600"
              onClick={onClose}
            >
              Cancel
            </Button>
          </VStack>

          {/* Footer Info */}
          <Text
            fontSize="xs"
            color="gray.500"
            textAlign="center"
            fontWeight="400"
          >
            Your wallet will prompt you to approve the network switch. This is completely safe.
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};
