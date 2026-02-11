"use client";

import { Box, HStack, VStack, Icon, Text } from "@chakra-ui/react";
import { useNavigation } from "@/hooks/useNavigation";

export const MobileBottomNav = () => {
  const { mainItems, setActive } = useNavigation();

  // Show navigation items
  const navItems = mainItems.slice(0, 5);

  return (
    <Box
      as="nav"
      role="navigation"
      aria-label="Main navigation"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={1100}
      bg="rgba(0, 0, 0, 0.95)"
      backdropFilter="blur(12px)"
      borderTop="1px solid"
      borderColor="rgba(255,255,255,0.08)"
      display={{ base: "block", lg: "none" }}
      px={2}
      py={2}
      paddingBottom="calc(env(safe-area-inset-bottom) + 8px)"
    >
      <HStack justify="space-evenly" align="center" w="100%">
        {navItems.map((item) => (
          <VStack
            key={item.id}
            as="button"
            aria-label={item.comingSoon ? `${item.label} (Coming soon)` : item.label}
            aria-current={item.active ? "page" : undefined}
            disabled={item.comingSoon}
            gap={0.5}
            cursor={item.comingSoon ? "not-allowed" : "pointer"}
            onClick={() => !item.comingSoon && setActive(item.id)}
            opacity={item.comingSoon ? 0.5 : 1}
            pointerEvents={item.comingSoon ? "none" : "auto"}
            transition="all 0.15s"
            _active={{
              transform: "scale(0.95)",
            }}
            _focusVisible={{
              outline: "2px solid",
              outlineColor: "orange.500",
              outlineOffset: "2px",
              borderRadius: "lg",
            }}
            w="18%"
            minW="56px"
            py={1.5}
            position="relative"
            bg="transparent"
            border="none"
          >
            <Box position="relative" h="24px" display="flex" alignItems="center" justifyContent="center">
              <Icon
                color={item.active ? "orange.400" : "gray.400"}
                boxSize={5}
                transition="color 0.15s"
                transform={item.active ? "scale(1.1)" : "scale(1)"}
                aria-hidden="true"
              >
                <item.icon />
              </Icon>
              {item.id === "competition" && (
                <Box
                  position="absolute"
                  top="-2px"
                  right="-6px"
                  bg="teal.600"
                  color="white"
                  px={1}
                  py={0.5}
                  borderRadius="3px"
                  fontSize="7px"
                  fontWeight="700"
                  letterSpacing="0.2px"
                  aria-label="Hot feature"
                >
                  HOT
                </Box>
              )}
            </Box>
            <Text
              fontSize="10px"
              fontWeight={item.active ? "600" : "500"}
              color={item.active ? "orange.400" : "gray.400"}
              textAlign="center"
              lineHeight="1.2"
              whiteSpace="nowrap"
            >
              {item.label}
            </Text>
          </VStack>
        ))}
      </HStack>
    </Box>
  );
};
