"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex, Text, HStack } from "@chakra-ui/react";
import { createChart, ColorType, IChartApi, ISeriesApi, LineData, Time } from "lightweight-charts";
import { usePriceHistory, useLatestPrice } from "@/hooks/opinion";
import type { Candle } from "@/lib/opinion/types";

interface CandlestickChartProps {
  tokenId: string;
  marketTitle?: string;
}

const INTERVALS = [
  { label: "1m", value: "1m" },
  { label: "1H", value: "1h" },
  { label: "1D", value: "1d" },
  { label: "1W", value: "1w" },
];

export function CandlestickChart({ tokenId, marketTitle }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [interval, setInterval] = useState("1h");

  const { data: priceHistory, isLoading, error } = usePriceHistory(tokenId, interval);
  const { data: latestPrice } = useLatestPrice(tokenId);

  const candles = priceHistory?.candles || [];
  const currentPrice = latestPrice?.price ?? candles[candles.length - 1]?.close ?? 0;
  const firstPrice = candles[0]?.open ?? currentPrice;
  const priceChange = currentPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 300;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#6b7280",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      width,
      height,
      crosshair: {
        mode: 1,
        vertLine: {
          color: "rgba(238, 99, 50, 0.5)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#EE6332",
        },
        horzLine: {
          color: "rgba(238, 99, 50, 0.5)",
          width: 1,
          style: 2,
          labelBackgroundColor: "#EE6332",
        },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.04)",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.04)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
    });

    // Use Area chart for smoother visualization since we only have price data
    const areaSeries = chart.addAreaSeries({
      lineColor: "#EE6332",
      topColor: "rgba(238, 99, 50, 0.4)",
      bottomColor: "rgba(238, 99, 50, 0.0)",
      lineWidth: 2,
      priceFormat: {
        type: "price",
        precision: 3,
        minMove: 0.001,
      },
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!chartRef.current || !container) return;
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          chartRef.current.applyOptions({ width, height });
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // Update chart data
  useEffect(() => {
    if (!seriesRef.current) return;

    if (!candles || candles.length === 0) {
      seriesRef.current.setData([]);
      return;
    }

    const chartData: LineData<Time>[] = candles.map((candle: Candle) => ({
      time: candle.time as Time,
      value: candle.close,
    }));

    seriesRef.current.setData(chartData);
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [candles]);

  return (
    <Box h="100%" display="flex" flexDirection="column" position="relative">
      {/* Header with price info */}
      <Flex
        justify="space-between"
        align="center"
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor="rgba(255,255,255,0.06)"
      >
        <HStack gap={4}>
          {/* Current Price */}
          <HStack gap={2} align="baseline">
            <Text color="white" fontSize="xl" fontWeight="600">
              {(currentPrice * 100).toFixed(1)}¢
            </Text>
            <Text
              color={isPositive ? "#22c55e" : "#ef4444"}
              fontSize="sm"
              fontWeight="500"
            >
              {isPositive ? "▲" : "▼"} {Math.abs(priceChangePercent).toFixed(1)}%
            </Text>
          </HStack>

          {/* 24h Change */}
          <Text color="gray.500" fontSize="xs" display={{ base: "none", md: "block" }}>
            24h: <Text as="span" color={isPositive ? "#22c55e" : "#ef4444"}>
              {isPositive ? "+" : ""}{(priceChange * 100).toFixed(2)}¢
            </Text>
          </Text>
        </HStack>

        {/* Interval Selector */}
        <HStack gap={1}>
          {INTERVALS.map((int) => (
            <Flex
              key={int.value}
              px={3}
              py={1.5}
              borderRadius="md"
              cursor="pointer"
              bg={interval === int.value ? "rgba(255,255,255,0.1)" : "transparent"}
              onClick={() => setInterval(int.value)}
              _hover={{ bg: "rgba(255,255,255,0.05)" }}
              transition="all 0.1s"
            >
              <Text
                fontSize="xs"
                color={interval === int.value ? "white" : "gray.500"}
                fontWeight="500"
              >
                {int.label}
              </Text>
            </Flex>
          ))}
        </HStack>
      </Flex>

      {/* Chart Area */}
      <Box flex={1} position="relative">
        {isLoading && (
          <Flex
            position="absolute"
            inset={0}
            align="center"
            justify="center"
            bg="rgba(0,0,0,0.6)"
            zIndex={10}
          >
            <Text color="gray.400" fontSize="sm">Loading...</Text>
          </Flex>
        )}

        {error && (
          <Flex
            position="absolute"
            inset={0}
            align="center"
            justify="center"
            bg="rgba(0,0,0,0.6)"
            zIndex={10}
          >
            <Text color="gray.500" fontSize="sm">Failed to load data</Text>
          </Flex>
        )}

        {!isLoading && !error && candles.length === 0 && (
          <Flex
            position="absolute"
            inset={0}
            align="center"
            justify="center"
            zIndex={5}
            flexDirection="column"
            gap={2}
          >
            <Text color="gray.500" fontSize="sm">No price history</Text>
            <Text color="gray.600" fontSize="xs">New market</Text>
          </Flex>
        )}

        <Box ref={chartContainerRef} w="100%" h="100%" minH="250px" />
      </Box>
    </Box>
  );
}
