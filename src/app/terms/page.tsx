"use client";

import { Box, Flex, Text, VStack, HStack } from "@chakra-ui/react";
import Link from "next/link";

export default function TermsPage() {
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
            Terms of Service
          </Text>

          <Text color="gray.400" fontSize="sm">
            Last updated: January 2025
          </Text>

          <VStack align="stretch" gap={4}>
            <Text as="h2" color="white" fontSize="lg" fontWeight="600">
              1. Acceptance of Terms
            </Text>
            <Text color="gray.300" fontSize="sm" lineHeight="1.7">
              By accessing and using Opinion Terminal, you accept and agree to be bound by the terms and conditions of this agreement. If you do not agree to these terms, you should not use this service.
            </Text>

            <Text as="h2" color="white" fontSize="lg" fontWeight="600">
              2. Description of Service
            </Text>
            <Text color="gray.300" fontSize="sm" lineHeight="1.7">
              Opinion Terminal is a read-only interface for viewing prediction market data from Opinion Trade. We do not execute trades, hold funds, or provide financial advice. All trading activities are conducted directly on the Opinion Trade platform.
            </Text>

            <Text as="h2" color="white" fontSize="lg" fontWeight="600">
              3. No Financial Advice
            </Text>
            <Text color="gray.300" fontSize="sm" lineHeight="1.7">
              The information provided on Opinion Terminal is for informational purposes only and should not be considered as financial, investment, or trading advice. You should consult with a qualified financial advisor before making any investment decisions.
            </Text>

            <Text as="h2" color="white" fontSize="lg" fontWeight="600">
              4. Risk Disclosure
            </Text>
            <Text color="gray.300" fontSize="sm" lineHeight="1.7">
              Prediction markets involve significant risk. You may lose some or all of your investment. Past performance is not indicative of future results. Only invest what you can afford to lose.
            </Text>

            <Text as="h2" color="white" fontSize="lg" fontWeight="600">
              5. Limitation of Liability
            </Text>
            <Text color="gray.300" fontSize="sm" lineHeight="1.7">
              Opinion Terminal and its operators shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages resulting from your use of the service or any data displayed therein.
            </Text>

            <Text as="h2" color="white" fontSize="lg" fontWeight="600">
              6. Changes to Terms
            </Text>
            <Text color="gray.300" fontSize="sm" lineHeight="1.7">
              We reserve the right to modify these terms at any time. Continued use of the service after any such changes constitutes your acceptance of the new terms.
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
