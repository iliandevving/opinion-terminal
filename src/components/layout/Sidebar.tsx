"use client";

import { Box, HStack, VStack, Text, Icon, Image, Button, Link } from "@chakra-ui/react";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { SidebarProps } from "@/types/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import { Tooltip } from "@/components/ui/tooltip";
import { ConnectWalletButton } from "@/components/common/ConnectWalletButton";
import { useRef } from "react";

export const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const { mainItems, bottomItems, setActive } = useNavigation();
  const connectButtonRef = useRef<HTMLDivElement>(null);

  // If collapsed, show only the toggle button
  if (isCollapsed) {
    return (
      <Box
        position="fixed"
        left={0}
        top="50%"
        transform="translateY(-50%)"
        zIndex={1001}
      >
        <Button
          onClick={onToggle}
          size="sm"
          bg="gray.900"
          color="white"
          borderRadius="0 8px 8px 0"
          px={2}
          py={6}
          _hover={{ bg: "orange.600" }}
        >
          <Icon boxSize={5}>
            <ChevronRight />
          </Icon>
        </Button>
      </Box>
    );
  }

  return (
    <Box
      className="sidebar"
      w="260px"
      bg="gray.950/30"
      m={5}
      p={6}
      borderRadius="20px"
      transition="all 0.3s ease"
      position="relative"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      h="calc(100vh - 40px)"
      suppressHydrationWarning
      _before={{
        content: '""',
        position: "absolute",
        inset: 0,
        borderRadius: "20px",
        padding: "1px",
        background: "linear-gradient(90deg, rgba(255, 255, 255, 0.024) 0%, rgba(255, 255, 255, 0.08) 100%)",
        backgroundAttachment: "fixed",
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        pointerEvents: "none",
      }}
    >
      {/* Toggle Button - Top Right */}
      <Box position="absolute" top={3} right={3} zIndex={10}>
        <Button
          onClick={onToggle}
          size="xs"
          variant="ghost"
          color="gray.500"
          _hover={{ color: "white", bg: "whiteAlpha.100" }}
          p={1}
          minW="auto"
          h="auto"
        >
          <Icon boxSize={4}>
            <ChevronLeft />
          </Icon>
        </Button>
      </Box>

      {/* Logo Section */}
      <Box mb={8} textAlign="center" display="flex" justifyContent="center">
        <Box
          cursor="pointer"
          onClick={() => setActive("terminal")}
          transition="opacity 0.2s"
          _hover={{ opacity: 0.8 }}
          w="80%"
        >
          <Image
            src="/icons/brand/opinion_logo.svg"
            alt="Opinion Terminal"
            width="100%"
            height="auto"
            objectFit="contain"
          />
        </Box>
      </Box>

      {/* Main Navigation */}
      <VStack align="center" gap={1} flex={1} minH={0} overflow="auto" w="full">
        {mainItems.map((item) => {
          const navigationItem = (
            <Box
              key={item.id}
              px={3}
              py={2}
              borderRadius="8px"
              bg={item.active ? "orange.500/15" : "transparent"}
              cursor={item.comingSoon ? "default" : "pointer"}
              _hover={
                item.comingSoon ? { bg: "gray.900/50" } : { bg: "orange.500/10" }
              }
              transition="all 0.2s"
              onClick={() => {
                if (!item.comingSoon) {
                  setActive(item.id);
                }
              }}
              filter={item.comingSoon ? "blur(3px)" : "none"}
              overflow="visible"
              w="full"
            >
              <HStack justify="space-between" w="full" overflow="visible">
                <HStack>
                  <Icon color={item.active ? "colorPalette.500" : "fg.muted"} boxSize={4}>
                    <item.icon />
                  </Icon>
                  <Text
                    fontSize="sm"
                    color={item.active ? "fg" : "fg.muted"}
                    ml={2}
                    fontWeight="600"
                  >
                    {item.label}
                  </Text>
                </HStack>
              </HStack>
            </Box>
          );

          return item.comingSoon ? (
            <Tooltip
              key={item.id}
              content="Coming Soon"
              positioning={{ placement: "top" }}
            >
              {navigationItem}
            </Tooltip>
          ) : (
            navigationItem
          );
        })}
      </VStack>

      {/* Bottom Items (Token, etc) */}
      <VStack align="center" gap={1} mb={3} w="full">
        {bottomItems.map((item) => {
          const navigationItem = (
            <Box
              key={item.id}
              px={3}
              py={2}
              borderRadius="8px"
              bg={item.active ? "orange.500/15" : "transparent"}
              cursor="pointer"
              onClick={() => setActive(item.id)}
              _hover={{ bg: item.active ? "orange.500/15" : "orange.500/10" }}
              transition="all 0.2s"
              w="full"
            >
              <HStack justify="flex-start">
                <Icon color={item.active ? "colorPalette.500" : "fg.muted"} boxSize={4}>
                  <item.icon />
                </Icon>
                <Text
                  fontSize="sm"
                  color={item.active ? "fg" : "fg.muted"}
                  ml={2}
                  fontWeight="600"
                >
                  {item.label}
                </Text>
              </HStack>
            </Box>
          );

          return item.comingSoon ? (
            <Tooltip
              key={item.id}
              content="Coming Soon"
              positioning={{ placement: "top" }}
            >
              {navigationItem}
            </Tooltip>
          ) : (
            navigationItem
          );
        })}

      </VStack>

      {/* Divider Line */}
      <Box
        h="2px"
        bg="gray.900"
        my={4}
      />

      {/* Connect Wallet Button */}
      <Box mb={2} mt={4} px={1} ref={connectButtonRef}>
        <ConnectWalletButton size="sm" variant="solid" fullWidth />
      </Box>


      {/* Social Links - Icons Only */}
      <HStack justify="center" gap={2} mb={4}>
              <Box
                as="a"
                // @ts-expect-error - Chakra Box as="a" typing issue
                href="https://x.com/opinion"
                target="_blank"
                rel="noopener noreferrer"
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="32px"
                h="32px"
                color="fg.muted"
                _hover={{ bg: "orange.500/20", color: "orange.500" }}
                borderRadius="6px"
                cursor="pointer"
                transition="all 0.2s"
                fontSize="16px"
              >
                <svg
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Box>

              <Box
                as="a"
                // @ts-expect-error - Chakra Box as="a" typing issue
                href="https://discord.gg/opinion"
                target="_blank"
                rel="noopener noreferrer"
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="32px"
                h="32px"
                color="fg.muted"
                _hover={{ bg: "orange.500/20", color: "orange.500" }}
                borderRadius="6px"
                cursor="pointer"
                transition="all 0.2s"
                fontSize="16px"
              >
                <svg
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </Box>

              <Box
                as="a"
                // @ts-expect-error - Chakra Box as="a" typing issue
                href="https://t.me/opinion"
                target="_blank"
                rel="noopener noreferrer"
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="32px"
                h="32px"
                color="fg.muted"
                _hover={{ bg: "orange.500/20", color: "orange.500" }}
                borderRadius="6px"
                cursor="pointer"
                transition="all 0.2s"
                fontSize="16px"
              >
                <svg
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </Box>
      </HStack>

      {/* Footer Copyright */}
      <Box mt={4} textAlign="center">
        <Text fontSize="xs" color="gray.800" fontWeight="400">
          © 2025 Opinion Terminal
        </Text>
      </Box>
    </Box>
  );
};
