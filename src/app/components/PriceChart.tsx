"use client";

import React from 'react';
import { theme } from '../lib/theme';

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
  const width = 350; // Increased width for better visibility
  const padding = { top: 15, right: 15, bottom: 25, left: 15 };
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
  const strokeColor = isPositive ? '#10b981' : '#ef4444'; // green or red
  const gradientColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
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
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
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