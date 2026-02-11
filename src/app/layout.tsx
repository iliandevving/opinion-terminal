import { Provider } from "@/components/ui/provider";
import { QueryProvider } from "@/providers/QueryProvider";
import type { Metadata, Viewport } from "next";
import { HydrationErrorHandler } from "@/components/common/HydrationErrorHandler";
import { Manrope, Space_Mono } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
  weight: ["400", "700"],
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://opinion.so"),
  title: "Opinion Terminal - Professional Prediction Markets Trading",
  description: "Opinion Terminal is the first professional interface for trading Opinion Prediction Markets like a professional trader",
  keywords: [
    "prediction markets",
    "opinion",
    "trading terminal",
    "opinion terminal",
    "crypto trading",
    "professional trading",
    "market analysis",
  ],
  authors: [{ name: "Opinion Terminal" }],
  robots: "index, follow",
  openGraph: {
    title: "Opinion Terminal",
    description: "Opinion Terminal is the first professional interface for trading Opinion Prediction Markets like a professional trader",
    images: [
      {
        url: "/meta/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Opinion Terminal - Professional Prediction Markets Trading",
      },
    ],
    type: "website",
    siteName: "Opinion Terminal",
  },
  twitter: {
    card: "summary_large_image",
    title: "Opinion Terminal",
    description: "Opinion Terminal is the first professional interface for trading Opinion Prediction Markets like a professional trader",
    images: ["/meta/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${spaceMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          /* Font di default - Space Mono Regular (Opinion Terminal style) */
          body {
            font-family: var(--font-space-mono), 'Space Mono', monospace;
            font-weight: 400;
          }

          /* Space Mono weights */
          .font-regular {
            font-family: var(--font-space-mono), 'Space Mono', monospace !important;
            font-weight: 400 !important;
          }

          .font-bold {
            font-family: var(--font-space-mono), 'Space Mono', monospace !important;
            font-weight: 700 !important;
          }

          /* Manrope per titoli/headings se necessario */
          .font-manrope {
            font-family: var(--font-manrope), 'Manrope', system-ui, sans-serif !important;
          }

          /* Blog content styles */
          .blog-content p strong {
            font-weight: 700 !important;
            color: white !important;
            font-size: 1.125rem !important;
          }

          .blog-content p strong em,
          .blog-content p em strong {
            font-style: normal !important;
            font-weight: 700 !important;
            color: #EE6332 !important;
            font-size: 1.125rem !important;
          }

          .blog-content p em {
            font-style: normal !important;
            color: #EE6332 !important;
          }

          /* Remove extra spacing in timeline lists */
          [data-scope="timeline"] p {
            margin: 0 !important;
            padding: 0 !important;
          }
        `}</style>
      </head>
      <body className={spaceMono.className} suppressHydrationWarning>
        <HydrationErrorHandler />
        <QueryProvider>
          <Provider>
            {children}
          </Provider>
        </QueryProvider>
      </body>
    </html>
  );
}
