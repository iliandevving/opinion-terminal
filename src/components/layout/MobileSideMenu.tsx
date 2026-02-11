"use client";

import { Box, Flex, VStack, HStack, Text, Icon } from "@chakra-ui/react";
import { X } from "lucide-react";
import { useNavigation } from "@/hooks/useNavigation";
import { ConnectWalletButton } from "@/components/common/ConnectWalletButton";
import { useEffect, useRef } from "react";

interface MobileSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSideMenu = ({ isOpen, onClose }: MobileSideMenuProps) => {
  const { mainItems, bottomItems, setActive } = useNavigation();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (isOpen) {
      // Focus the close button when menu opens
      setTimeout(() => closeButtonRef.current?.focus(), 100);

      // Handle escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
        // Focus trap
        if (e.key === "Tab" && menuRef.current) {
          const focusableElements = menuRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, onClose]);

  const handleItemClick = (itemId: string, comingSoon?: boolean) => {
    if (!comingSoon) {
      setActive(itemId);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        inset={0}
        bg="blackAlpha.800"
        backdropFilter="blur(4px)"
        zIndex={1200}
        opacity={isOpen ? 1 : 0}
        pointerEvents={isOpen ? "auto" : "none"}
        transition="opacity 0.3s ease"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Side Menu */}
      <Box
        ref={menuRef}
        id="mobile-side-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        position="fixed"
        top={0}
        right={0}
        bottom={0}
        w="280px"
        maxW="85vw"
        bg="rgba(10, 10, 10, 0.98)"
        backdropFilter="blur(20px)"
        zIndex={1300}
        transform={isOpen ? "translateX(0)" : "translateX(100%)"}
        transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        borderLeft="1px solid"
        borderColor="rgba(255,255,255,0.08)"
        display="flex"
        flexDirection="column"
        paddingTop="calc(env(safe-area-inset-top) + 16px)"
        paddingBottom="calc(env(safe-area-inset-bottom) + 16px)"
        tabIndex={-1}
      >
        {/* Header */}
        <Flex justify="space-between" align="center" px={5} pb={4} borderBottom="1px solid" borderColor="rgba(255,255,255,0.08)">
          <HStack gap={2}>
            <Box
              w="28px"
              h="28px"
              borderRadius="full"
              border="2px solid"
              borderColor="#EE6332"
              display="flex"
              alignItems="center"
              justifyContent="center"
              aria-hidden="true"
            >
              <Box w="8px" h="8px" borderRadius="full" bg="#EE6332" />
            </Box>
            <Text color="white" fontSize="sm" fontWeight="bold">Menu</Text>
          </HStack>

          <Box
            as="button"
            ref={closeButtonRef}
            aria-label="Close navigation menu"
            p={2}
            borderRadius="lg"
            bg="rgba(255,255,255,0.05)"
            _hover={{ bg: "rgba(255,255,255,0.1)" }}
            _active={{ bg: "rgba(255,255,255,0.15)" }}
            _focusVisible={{
              outline: "2px solid",
              outlineColor: "orange.500",
              outlineOffset: "2px"
            }}
            onClick={onClose}
          >
            <Icon color="gray.300" boxSize={5} aria-hidden="true">
              <X />
            </Icon>
          </Box>
        </Flex>

        {/* Navigation Items */}
        <VStack as="nav" role="navigation" aria-label="Main menu" flex={1} align="stretch" gap={1} px={3} py={4} overflow="auto">
          {mainItems.map((item) => (
            <Flex
              key={item.id}
              as="button"
              role="menuitem"
              aria-label={item.comingSoon ? `${item.label} (Coming soon)` : item.label}
              aria-current={item.active ? "page" : undefined}
              aria-disabled={item.comingSoon}
              align="center"
              gap={3}
              px={4}
              py={3}
              borderRadius="xl"
              cursor={item.comingSoon ? "not-allowed" : "pointer"}
              bg={item.active ? "rgba(238, 99, 50, 0.15)" : "transparent"}
              opacity={item.comingSoon ? 0.5 : 1}
              _hover={item.comingSoon ? {} : { bg: item.active ? "rgba(238, 99, 50, 0.2)" : "rgba(255,255,255,0.05)" }}
              _active={item.comingSoon ? {} : { bg: "rgba(255,255,255,0.1)" }}
              _focusVisible={{
                outline: "2px solid",
                outlineColor: "orange.500",
                outlineOffset: "2px"
              }}
              transition="all 0.15s"
              onClick={() => handleItemClick(item.id, item.comingSoon)}
              position="relative"
              border="none"
              w="100%"
              textAlign="left"
            >
              <Icon
                color={item.active ? "orange.400" : "gray.400"}
                boxSize={5}
                aria-hidden="true"
              >
                <item.icon />
              </Icon>
              <Text
                color={item.active ? "white" : "gray.300"}
                fontSize="sm"
                fontWeight={item.active ? "semibold" : "medium"}
              >
                {item.label}
              </Text>
              {item.comingSoon && (
                <Box
                  ml="auto"
                  bg="rgba(255,255,255,0.1)"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  fontSize="9px"
                  color="gray.400"
                  fontWeight="bold"
                >
                  SOON
                </Box>
              )}
              {item.id === "competition" && !item.comingSoon && (
                <Box
                  ml="auto"
                  bg="teal.600"
                  px={2}
                  py={0.5}
                  borderRadius="full"
                  fontSize="9px"
                  color="white"
                  fontWeight="bold"
                >
                  HOT
                </Box>
              )}
            </Flex>
          ))}
        </VStack>

        {/* Bottom Section */}
        <VStack align="stretch" gap={3} px={4} pt={4} borderTop="1px solid" borderColor="rgba(255,255,255,0.08)">
          {/* Bottom Items */}
          {bottomItems.map((item) => (
            <Flex
              key={item.id}
              as="button"
              role="menuitem"
              aria-label={item.comingSoon ? `${item.label} (Coming soon)` : item.label}
              aria-disabled={item.comingSoon}
              align="center"
              gap={3}
              px={4}
              py={2.5}
              borderRadius="xl"
              cursor={item.comingSoon ? "not-allowed" : "pointer"}
              opacity={item.comingSoon ? 0.5 : 1}
              _hover={item.comingSoon ? {} : { bg: "rgba(255,255,255,0.05)" }}
              _focusVisible={{
                outline: "2px solid",
                outlineColor: "orange.500",
                outlineOffset: "2px"
              }}
              transition="all 0.15s"
              onClick={() => handleItemClick(item.id, item.comingSoon)}
              border="none"
              bg="transparent"
              w="100%"
              textAlign="left"
            >
              <Icon color="gray.400" boxSize={4} aria-hidden="true">
                <item.icon />
              </Icon>
              <Text color="gray.300" fontSize="sm">
                {item.label}
              </Text>
            </Flex>
          ))}

          {/* Connect Wallet */}
          <Box pt={2}>
            <ConnectWalletButton size="md" variant="solid" fullWidth />
          </Box>

          {/* Social Links */}
          <HStack justify="center" gap={4} py={3} role="list" aria-label="Social links">
            <Box
              as="a"
              href="https://x.com/opinion"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on X (Twitter)"
              p={2}
              borderRadius="lg"
              color="gray.400"
              _hover={{ color: "orange.400", bg: "rgba(238, 99, 50, 0.1)" }}
              _focusVisible={{
                outline: "2px solid",
                outlineColor: "orange.500",
                outlineOffset: "2px"
              }}
              transition="all 0.15s"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </Box>
            <Box
              as="a"
              href="https://discord.gg/opinion"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join our Discord server"
              p={2}
              borderRadius="lg"
              color="gray.400"
              _hover={{ color: "orange.400", bg: "rgba(238, 99, 50, 0.1)" }}
              _focusVisible={{
                outline: "2px solid",
                outlineColor: "orange.500",
                outlineOffset: "2px"
              }}
              transition="all 0.15s"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </Box>
            <Box
              as="a"
              href="https://t.me/opinion"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join our Telegram channel"
              p={2}
              borderRadius="lg"
              color="gray.400"
              _hover={{ color: "orange.400", bg: "rgba(238, 99, 50, 0.1)" }}
              _focusVisible={{
                outline: "2px solid",
                outlineColor: "orange.500",
                outlineOffset: "2px"
              }}
              transition="all 0.15s"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </Box>
          </HStack>

          <Text textAlign="center" fontSize="xs" color="gray.500">
            © 2025 Opinion Terminal
          </Text>
        </VStack>
      </Box>
    </>
  );
};
