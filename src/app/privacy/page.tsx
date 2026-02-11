"use client";

import { Box, Flex, Text, VStack, HStack } from "@chakra-ui/react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <Box minH="100vh" bg="#000" display="flex" flexDirection="column">
      {/* Header */}
      <Flex
        as="header"
        h="56px"
        px={{ base: 3, md: 5 }}
        align="center"
        justify="space-between"
        borderBottom="1px solid"
        borderColor="rgba(255,255,255,0.06)"
        flexShrink={0}
        bg="#000"
      >
        <Link href="/" aria-label="Go to homepage">
          <HStack gap={2} cursor="pointer" _hover={{ opacity: 0.8 }} transition="opacity 0.15s">
            <Flex
              w="24px"
              h="24px"
              borderRadius="full"
              border="2px solid"
              borderColor="#EE6332"
              align="center"
              justify="center"
              aria-hidden="true"
            >
              <Box w="10px" h="10px" borderRadius="full" bg="#EE6332" />
            </Flex>
            <Text
              color="white"
              fontSize="md"
              fontWeight="600"
              fontFamily="var(--font-manrope), 'Manrope', sans-serif"
            >
              OPINION TERMINAL
            </Text>
          </HStack>
        </Link>
      </Flex>

      {/* Content */}
      <Box flex={1} px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }} maxW="800px" mx="auto" w="100%">
        <VStack align="stretch" gap={6}>
          <Text as="h1" color="white" fontSize={{ base: "2xl", md: "3xl" }} fontWeight="700">
            Privacy Policy
          </Text>

          <Text color="gray.400" fontSize="sm">
            Last updated: January 2025
          </Text>

          <VStack align="stretch" gap={4}>
            <Text as="h2" color="white" fontSize="lg" fontWeight="600">
              1. Information We Collect
            </Text>
            <Text color="gray.300" fontSize="sm" lineHeight="1.7">
              Opinion Terminal is a read-only interface that does not require user registration or login. We do not collect personal information such as names, email addresses, or payment information. We may collect anonymous usage data to improve the service.
            </Text>

            <Text as="h2" color="white" fontSize="lg" fontWeight="600">
              2. Cookies and Local Storage
            </Text>
            <Text color="gray.300" fontSize="sm" lineHeight="1.7">
              We may use cookies and local storage to remember your preferences and improve your experience. You can disable cookies in your browser settings, but some features may not work properly.
            </Text>

            <Text as="h2" color="white" fontSize="lg" fontWeight="600">
              3. Third-Party Services
            </Text>
            <Text color="gray.300" fontSize="sm" lineHeight="1.7">
              We display data from Opinion Trade and may use third-party analytics services. These services may collect anonymous usage data according to their own privacy policies.
            </Text>

            <Text as="h2" color="white" fontSize="lg" fontWeight="600">
              4. Data Security
            </Text>
            <Text color="gray.300" fontSize="sm" lineHeight="1.7">
              We implement reasonable security measures to protect any data we collect. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </Text>

            <Text as="h2" color="white" fontSize="lg" fontWeight="600">
              5. Wallet Connections
            </Text>
            <Text color="gray.300" fontSize="sm" lineHeight="1.7">
              When wallet functionality is enabled, we will only request the minimum permissions necessary to display your positions and balances. We will never request permission to transfer funds or sign transactions without your explicit consent.
            </Text>

            <Text as="h2" color="white" fontSize="lg" fontWeight="600">
              6. Changes to This Policy
            </Text>
            <Text color="gray.300" fontSize="sm" lineHeight="1.7">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated revision date.
            </Text>

            <Text as="h2" color="white" fontSize="lg" fontWeight="600">
              7. Contact Us
            </Text>
            <Text color="gray.300" fontSize="sm" lineHeight="1.7">
              If you have any questions about this privacy policy, please contact us through our social media channels.
            </Text>
          </VStack>

          <Box pt={6}>
            <Link href="/">
              <Text color="#EE6332" fontSize="sm" cursor="pointer" _hover={{ textDecoration: "underline" }}>
                ← Back to Markets
              </Text>
            </Link>
          </Box>
        </VStack>
      </Box>

      {/* Footer */}
      <Flex
        as="footer"
        role="contentinfo"
        h="36px"
        px={{ base: 3, md: 6 }}
        align="center"
        justify="space-between"
        borderTop="1px solid"
        borderColor="rgba(255,255,255,0.06)"
        flexShrink={0}
        bg="#000"
      >
        <HStack gap={{ base: 2, md: 4 }}>
          <HStack gap={1.5} aria-label="Status: Live">
            <Box w="6px" h="6px" borderRadius="full" bg="#22c55e" aria-hidden="true" />
            <Text color="gray.500" fontSize="xs">Live</Text>
          </HStack>
          <Text color="gray.600" fontSize="xs">v0.1.0</Text>
        </HStack>
        <HStack as="nav" aria-label="Footer links" gap={{ base: 3, md: 6 }}>
          <Text color="gray.500" fontSize="xs" cursor="not-allowed" opacity={0.5} title="Coming Soon">Docs</Text>
          <Link href="/terms">
            <Text color="gray.500" fontSize="xs" cursor="pointer" _hover={{ color: "gray.300" }}>Terms</Text>
          </Link>
          <Link href="/privacy">
            <Text color="gray.500" fontSize="xs" cursor="pointer" _hover={{ color: "gray.300" }} display={{ base: "none", sm: "block" }}>Privacy Policy</Text>
          </Link>
        </HStack>
      </Flex>
    </Box>
  );
}
