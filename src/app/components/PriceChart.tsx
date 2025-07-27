"use client";

import React from 'react';
import { theme } from '../lib/theme';
import { useSystemTheme } from '../hooks/useSystemTheme';

interface PriceData {
  timestamp: number;
  price: number;
}

interface PriceChartProps {
  data: PriceData[];
  height?: number;
  showGrid?: boolean;
}

export function PriceChart({ data, height = 120, showGrid = true }: PriceChartProps) {
  const { theme: systemTheme } = useSystemTheme();
  const isDarkMode = systemTheme === 'dark';

  if (!data || data.length === 0) {
    return (
      <div 
        style={{ height }}
        className={`flex items-center justify-center ${theme.text.secondary} text-sm`}
      >
        No price data available
      </div>
    );
  }

  // Calculate chart dimensions and data bounds
  const width = 450; // Increased width for full container coverage
  const padding = { top: 15, right: 5, bottom: 25, left: 5 }; // Minimal side padding
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find min and max values
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Calculate scaling functions
  const xScale = (index: number) => (index / (data.length - 1)) * chartWidth + padding.left;
  const yScale = (price: number) => chartHeight - ((price - minPrice) / priceRange) * chartHeight + padding.top;

  // Create SVG path
  const pathData = data
    .map((point, index) => {
      const x = xScale(index);
      const y = yScale(point.price);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Calculate area path for gradient
  const areaPath = `${pathData} L ${xScale(data.length - 1)} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  // Determine if price is up or down
  const isPositive = data.length > 1 && data[data.length - 1].price >= data[0].price;
  
  // Theme-aware colors
  const strokeColor = isPositive 
    ? (isDarkMode ? '#10b981' : '#00ff88') // Neon green for light mode
    : (isDarkMode ? '#ef4444' : '#ff0066'); // Neon red for light mode
  const gradientColor = isPositive 
    ? (isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 255, 136, 0.2)')
    : (isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 0, 102, 0.2)');

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg width={width} height={height} className="overflow-visible" style={{ maxWidth: '100%' }}>
        {/* Grid lines */}
        {showGrid && (
          <g>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padding.top + chartHeight * ratio;
              return (
                <line
                  key={ratio}
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeDasharray="2,2"
                />
              );
            })}
          </g>
        )}

        {/* Gradient */}
        <defs>
          <linearGradient id={`gradient-${isPositive ? 'positive' : 'negative'}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#gradient-${isPositive ? 'positive' : 'negative'})`}
        />

        {/* Price line */}
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))"
        />

        {/* Data points */}
        {data.length <= 20 && data.map((point, index) => (
          <circle
            key={index}
            cx={xScale(index)}
            cy={yScale(point.price)}
            r={2}
            fill={strokeColor}
          />
        ))}
      </svg>
    </div>
  );
}