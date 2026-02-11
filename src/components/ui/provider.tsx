"use client";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { ColorModeProvider } from "./color-mode";

const system = createSystem(defaultConfig, {
  globalCss: {
    body: {
      fontFamily: "var(--font-space-mono), 'Space Mono', ui-monospace, monospace",
    },
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: "var(--font-space-mono), 'Space Mono', ui-monospace, monospace" },
        body: { value: "var(--font-space-mono), 'Space Mono', ui-monospace, monospace" },
        mono: { value: "var(--font-space-mono), 'Space Mono', ui-monospace, monospace" },
      },
      fontWeights: {
        normal: { value: 400 },
        medium: { value: 500 },
        semibold: { value: 600 },
        bold: { value: 700 },
      },
      colors: {
        // Orange accent (Opinion.trade primary)
        orange: {
          50: { value: "#fff7ed" },
          100: { value: "#ffedd5" },
          200: { value: "#fed7aa" },
          300: { value: "#fdba74" },
          400: { value: "#fb923c" },
          500: { value: "#EE6332" },
          600: { value: "#ea580c" },
          700: { value: "#c2410c" },
          800: { value: "#9a3412" },
          900: { value: "#7c2d12" },
          950: { value: "#431407" }
        },
        // Gray scale
        gray: {
          50: { value: "#fafafa" },
          100: { value: "#f4f4f5" },
          200: { value: "#e4e4e7" },
          300: { value: "#d4d4d8" },
          400: { value: "#a1a1aa" },
          500: { value: "#71717a" },
          600: { value: "#52525b" },
          700: { value: "#3f3f46" },
          800: { value: "#27272a" },
          900: { value: "#18181b" },
          950: { value: "#09090b" }
        }
      }
    },
    semanticTokens: {
      fonts: {
        heading: { value: "{fonts.heading}" },
        body: { value: "{fonts.body}" },
      },
      colors: {
        // Semantic color mappings
        accent: { value: "{colors.orange.500}" },
        accentHover: { value: "{colors.orange.600}" },
        success: { value: "#22c55e" },
        error: { value: "#ef4444" },
        warning: { value: "#f59e0b" },
        // Opinion.trade panel colors
        panelBg: { value: "rgba(255, 255, 255, 0.015)" },
        panelBorder: { value: "rgba(255, 255, 255, 0.06)" },
        panelBorderHover: { value: "rgba(255, 255, 255, 0.1)" },
        subtleBg: { value: "rgba(255, 255, 255, 0.03)" },
        subtleBgHover: { value: "rgba(255, 255, 255, 0.06)" },
      }
    },
  }
});

export function Provider(props: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider>{props.children}</ColorModeProvider>
    </ChakraProvider>
  );
}
