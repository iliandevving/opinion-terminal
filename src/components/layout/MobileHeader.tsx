"use client";

import { Box, Flex, HStack, Text, Icon } from "@chakra-ui/react";
import { Menu } from "lucide-react";

interface MobileHeaderProps {
  onMenuOpen: () => void;
}

export const MobileHeader = ({ onMenuOpen }: MobileHeaderProps) => {
  return (
    <Box
      as="header"
      role="banner"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1100}
      bg="rgba(0, 0, 0, 0.95)"
      backdropFilter="blur(12px)"
      borderBottom="1px solid"
      borderColor="rgba(255,255,255,0.08)"
      display={{ base: "block", lg: "none" }}
      px={4}
      py={3}
      paddingTop="calc(env(safe-area-inset-top) + 12px)"
    >
      <Flex justify="space-between" align="center">
        {/* Logo + Title */}
        <HStack gap={2}>
          <Box
            w="28px"
            h="28px"
            borderRadius="full"
            bg="transparent"
            border="2px solid"
            borderColor="#EE6332"
            display="flex"
            alignItems="center"
            justifyContent="center"
            aria-hidden="true"
          >
            <Box w="8px" h="8px" borderRadius="full" bg="#EE6332" />
          </Box>
          <Text
            color="white"
            fontSize="md"
            fontWeight="600"
            fontFamily="var(--font-manrope), 'Manrope', sans-serif"
          >
            Opinion Terminal
          </Text>
        </HStack>

        {/* Right side - Menu */}
        <HStack gap={3}>
          {/* Beta badge */}
          <Box
            bg="rgba(238, 99, 50, 0.15)"
            border="1px solid"
            borderColor="rgba(238, 99, 50, 0.3)"
            color="orange.400"
            px={2}
            py={0.5}
            borderRadius="full"
            fontSize="10px"
            fontWeight="bold"
            letterSpacing="0.5px"
            aria-label="Beta version"
          >
            BETA
          </Box>

          {/* Menu button */}
          <Box
            as="button"
            aria-label="Open navigation menu"
            aria-expanded="false"
            aria-controls="mobile-side-menu"
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
            onClick={onMenuOpen}
          >
            <Icon color="gray.300" boxSize={5} aria-hidden="true">
              <Menu />
            </Icon>
          </Box>
        </HStack>
      </Flex>
    </Box>
  );
};
