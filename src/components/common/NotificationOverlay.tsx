'use client';

import { Box, Flex, Text, Icon } from '@chakra-ui/react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotification, NotificationType } from '@/contexts/NotificationContext';
import { keyframes } from '@emotion/react';

// Animation keyframes
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px) translateX(-50%);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(-50%);
  }
`;

const slideOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0) translateX(-50%);
  }
  to {
    opacity: 0;
    transform: translateY(-20px) translateX(-50%);
  }
`;

const getNotificationStyles = (type: NotificationType) => {
  switch (type) {
    case 'error':
      return {
        bg: 'linear-gradient(135deg, rgba(211, 74, 92, 0.95) 0%, rgba(180, 50, 70, 0.95) 100%)',
        borderColor: 'red.400',
        icon: AlertCircle,
        iconColor: 'white',
      };
    case 'success':
      return {
        bg: 'linear-gradient(135deg, rgba(57, 190, 137, 0.95) 0%, rgba(45, 160, 115, 0.95) 100%)',
        borderColor: 'green.400',
        icon: CheckCircle,
        iconColor: 'white',
      };
    case 'warning':
      return {
        bg: 'linear-gradient(135deg, rgba(236, 178, 46, 0.95) 0%, rgba(200, 150, 30, 0.95) 100%)',
        borderColor: 'yellow.400',
        icon: AlertTriangle,
        iconColor: 'gray.800',
      };
    case 'info':
      return {
        bg: 'linear-gradient(135deg, rgba(79, 179, 191, 0.95) 0%, rgba(60, 150, 160, 0.95) 100%)',
        borderColor: 'teal.400',
        icon: Info,
        iconColor: 'white',
      };
  }
};

export function NotificationOverlay() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Box
      position="fixed"
      top="20px"
      left="50%"
      transform="translateX(-50%)"
      zIndex={9999}
      display="flex"
      flexDirection="column"
      gap={2}
      maxW="90vw"
      w="400px"
      pointerEvents="none"
    >
      {notifications.map((notification, index) => {
        const styles = getNotificationStyles(notification.type);
        const IconComponent = styles.icon;

        return (
          <Box
            key={notification.id}
            position="relative"
            left="50%"
            bg={styles.bg}
            border="1px solid"
            borderColor={styles.borderColor}
            borderRadius="12px"
            boxShadow="0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)"
            px={4}
            py={3}
            pointerEvents="auto"
            animation={`${slideIn} 0.3s ease-out forwards`}
            style={{
              animationDelay: `${index * 0.05}s`,
            }}
            backdropFilter="blur(10px)"
          >
            <Flex align="center" gap={3}>
              <Icon color={styles.iconColor} flexShrink={0}>
                <IconComponent size={20} />
              </Icon>

              <Text
                flex={1}
                color={notification.type === 'warning' ? 'gray.800' : 'white'}
                fontSize="14px"
                fontWeight="500"
                lineHeight="1.4"
              >
                {notification.message}
              </Text>

              <Box
                as="button"
                onClick={() => removeNotification(notification.id)}
                p={1}
                borderRadius="full"
                cursor="pointer"
                opacity={0.7}
                transition="all 0.2s"
                _hover={{ opacity: 1, bg: 'whiteAlpha.200' }}
                flexShrink={0}
              >
                <Icon color={notification.type === 'warning' ? 'gray.800' : 'white'}>
                  <X size={16} />
                </Icon>
              </Box>
            </Flex>
          </Box>
        );
      })}
    </Box>
  );
}
