"use client";

import { Box, VStack, HStack, Text, Button, Portal, Image, SimpleGrid } from "@chakra-ui/react";
import { X } from "lucide-react";
import { MOBILE_WALLETS, type WalletDeepLink } from "@/lib/walletDeepLinks";

interface MobileWalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (walletId: string) => void;
  wallets?: WalletDeepLink[];
}

export const MobileWalletSelector = ({
  isOpen,
  onClose,
  onSelectWallet,
  wallets = MOBILE_WALLETS.slice(0, 8), // Mostra i primi 8 wallet più popolari (inclusi Rabby e Phantom)
}: MobileWalletSelectorProps) => {
  if (!isOpen) return null;

  return (
    <Portal>
      {/* Background Overlay */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="black"
        opacity={0.9}
        backdropFilter="blur(20px)"
        zIndex={9999}
        onClick={onClose}
      />

      {/* Modal Container with Flexbox */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={10000}
        display="flex"
        alignItems="flex-start"
        justifyContent="center"
        pt={16}
        px={4}
        pb={4}
        overflowY="auto"
        pointerEvents="none"
      >
        {/* Modal */}
        <Box
          width="100%"
          maxW="420px"
          bg="gray.950/30"
          backdropFilter="blur(20px)"
          borderRadius="20px"
          border="none"
          boxShadow="0 8px 40px rgba(0, 0, 0, 0.8)"
          pointerEvents="auto"
          onClick={(e) => e.stopPropagation()}
          position="relative"
          _before={{
            content: '""',
            position: "absolute",
            inset: 0,
            borderRadius: "20px",
            padding: "1px",
            background: "linear-gradient(90deg, rgba(255, 255, 255, 0.024) 0%, rgba(255, 255, 255, 0.08) 100%)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            pointerEvents: "none",
          }}
        >
        {/* Header */}
        <Box
          p={4}
          borderBottomWidth="1px"
          borderColor="whiteAlpha.100"
          position="sticky"
          top={0}
          bg="transparent"
          zIndex={1}
        >
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="600">
              Choose Your Wallet
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              p={1}
              minW="auto"
            >
              <X size={20} />
            </Button>
          </HStack>
          <Text fontSize="sm" color="fg.muted" mt={1} fontWeight="400">
            Select the wallet app you have installed on your device
          </Text>
        </Box>

        {/* Wallet Grid */}
        <Box p={4}>
          <SimpleGrid columns={2} gap={3}>
            {wallets.map((wallet) => (
              <Button
                key={wallet.id}
                variant="outline"
                onClick={() => {
                  onSelectWallet(wallet.id);
                  onClose();
                }}
                h="auto"
                py={4}
                px={3}
                borderRadius="12px"
                borderColor="border.subtle"
                bg="bg.subtle"
                _hover={{
                  bg: "teal.500/20",
                  borderColor: "teal.500",
                }}
                _active={{
                  bg: "teal.500/30",
                  borderColor: "teal.400",
                }}
                display="flex"
                flexDirection="column"
                gap={2}
              >
                {wallet.logo && (
                  <Image
                    src={wallet.logo}
                    alt={wallet.name}
                    boxSize="40px"
                    objectFit="contain"
                  />
                )}
                <Text
                  fontSize="sm"
                  fontWeight="500"
                  textAlign="center"
                >
                  {wallet.name}
                </Text>
              </Button>
            ))}
          </SimpleGrid>
        </Box>

        {/* Footer Info */}
        <Box px={4} pb={6} pt={1}>
          <Text fontSize="xs" color="fg.muted" textAlign="center" fontWeight="400">
            Don&apos;t have a wallet?{" "}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--chakra-colors-teal-500)', textDecoration: 'underline' }}
            >
              Get MetaMask
            </a>
          </Text>
        </Box>
        </Box>
      </Box>
    </Portal>
  );
};
