import { Box, VStack, Text } from "@chakra-ui/react";
import { BarChart3 } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Home } from "lucide-react";

interface LoadingSpinnerProps {
  title?: string;
  subtitle?: string;
  endpoint?: string;
  retryCount?: number;
  maxRetries?: number;
}

export const LoadingSpinner = ({
  title = "Market Dashboard",
  subtitle = "Loading prediction markets data...",
  endpoint,
  retryCount = 0,
  maxRetries = 3,
}: LoadingSpinnerProps) => {
  const breadcrumbItems = [{ label: "Home", icon: Home }, { label: "Market" }];

  return (
    <Box p={8}>
      <VStack align="stretch" gap={8}>
        <Box>
          <Breadcrumb items={breadcrumbItems} />
          <Text as="h1" fontSize="28px" fontWeight="600" letterSpacing="-0.02em">
            {title}
          </Text>
          <Text color="fg.muted" fontSize="16px" mt={2}>
            {subtitle}
            {retryCount > 0 && (
              <Text as="span" color="yellow.500" ml={2}>
                (Retry attempt {retryCount}/{maxRetries})
              </Text>
            )}
          </Text>
        </Box>

        <Box
          bg="black"
          border="1px"
          borderColor="border.subtle"
          borderRadius="12px"
          p={12}
          textAlign="center"
        >
          <VStack gap={4}>
            <Box className="animate-spin">
              <BarChart3 color="colorPalette.500" size={48} />
            </Box>
            <Text color="fg.muted">Fetching ALL market data from API...</Text>
            {endpoint && (
              <Text fontSize="sm" color="fg.muted">
                Endpoint: {endpoint}
              </Text>
            )}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

