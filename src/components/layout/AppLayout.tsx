"use client";

import { Box, HStack, ScrollArea } from "@chakra-ui/react";
import { useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MobileSideMenu } from "@/components/layout/MobileSideMenu";
import { useSidebar } from "@/contexts/SidebarContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isCollapsed, setIsCollapsed, sidebarWidth } = useSidebar();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  const handleMobileMenuOpen = useCallback(() => {
    setIsMobileMenuOpen(true);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <Box
      h="100vh"
      overflow="hidden"
      position="relative"
      bg="black"
    >
      {/* Animated background gradient */}
      <Box
        className="hero-gradient-bg"
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        pointerEvents="none"
        zIndex={0}
        aria-hidden="true"
      />

      {/* Skip to main content link for accessibility */}
      <Box
        as="a"
        href="#main-content"
        position="absolute"
        left="-9999px"
        top="auto"
        width="1px"
        height="1px"
        overflow="hidden"
        zIndex={9999}
        _focus={{
          position: "fixed",
          top: 4,
          left: 4,
          width: "auto",
          height: "auto",
          overflow: "visible",
          bg: "orange.500",
          color: "white",
          px: 4,
          py: 2,
          borderRadius: "md",
          fontWeight: "600",
          fontSize: "sm",
        }}
      >
        Skip to main content
      </Box>

      {/* Mobile Header */}
      <MobileHeader onMenuOpen={handleMobileMenuOpen} />

      {/* Mobile Side Menu */}
      <MobileSideMenu
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
      />

      <HStack gap={0} h="full">
        {/* Desktop Sidebar */}
        <Box
          as="aside"
          position="fixed"
          left={0}
          top={0}
          h="100vh"
          zIndex={1000}
          w={`${sidebarWidth}px`}
          transition="width 0.3s ease"
          display={{ base: "none", lg: "block" }}
          aria-label="Main navigation"
        >
          <Sidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
        </Box>

        {/* Main content */}
        <ScrollArea.Root
          flex={1}
          ml={{ base: 0, lg: `${sidebarWidth}px` }}
          pt={{ base: "80px", lg: 0 }}
          pb={{ base: "72px", lg: 0 }}
          h="100vh"
          transition="margin-left 0.3s ease"
        >
          <ScrollArea.Viewport>
            <ScrollArea.Content
              as="main"
              id="main-content"
              role="main"
              px={{ base: 3, lg: 4 }}
              tabIndex={-1}
            >
              {children}
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            css={{
              '@media (max-width: 1023px)': {
                marginTop: '90px',
                marginBottom: '80px'
              }
            }}
          >
            <ScrollArea.Thumb />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </HStack>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </Box>
  );
};
