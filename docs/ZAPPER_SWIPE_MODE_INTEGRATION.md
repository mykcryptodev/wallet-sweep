# Zapper XYZ Integration for Swipe Mode

This document describes the integration of Zapper XYZ API to provide comprehensive token market data and price charts in the swipe mode feature.

## Overview

The swipe mode now displays enriched token data powered by Zapper XYZ, helping users make informed decisions about whether to keep or sell their tokens. Each token card shows:

- **Price Charts**: Visual representation of token price history
- **Market Data**: Market cap, 24h volume, and holder count
- **Price Changes**: 24-hour price change percentage
- **Token Metrics**: Additional insights from Zapper's comprehensive data

## Implementation Details

### 1. API Route (`/api/token-market-data`)

Created a new API endpoint that fetches token market data from Zapper:

```typescript
// src/app/api/token-market-data/route.ts
export async function GET(request: NextRequest) {
  // Fetches token data including:
  // - Current price
  // - Price change (24h)
  // - Market cap
  // - Trading volume
  // - Price history
  // - Token holders
}
```

### 2. Custom Hook (`useTokenMarketData`)

A React hook that manages the fetching and caching of token market data:

```typescript
// src/app/hooks/useTokenMarketData.ts
export function useTokenMarketData(tokenAddress: string | null) {
  // Returns: { data, loading, error }
}
```

### 3. Price Chart Component

A lightweight SVG-based chart component that visualizes token price history:

```typescript
// src/app/components/PriceChart.tsx
export function PriceChart({ 
  data, 
  height = 120, 
  showGrid = true 
}: PriceChartProps)
```

Features:
- Responsive SVG rendering
- Green/red color coding for positive/negative trends
- Gradient fill for visual appeal
- Grid lines for better readability

### 4. Enhanced Token Card

The swipe mode token cards now display:

#### Header Section
- Token icon with backdrop blur effect
- Price chart overlay in the background
- Token symbol and name

#### Price Information
- Current price (up to 6 decimal places)
- 24-hour price change with color coding
- Portfolio balance and USD value

#### Market Data Section
- Market capitalization (formatted with K/M/B suffixes)
- 24-hour trading volume
- Number of token holders

## Visual Design

The updated token cards feature:
- **Gradient Background**: Blue to purple gradient with price chart overlay
- **Glassmorphism**: Semi-transparent elements with backdrop blur
- **Color Coding**: Green for positive changes, red for negative
- **Data Hierarchy**: Most important information (price, value) prominently displayed

## Data Flow

1. User enters swipe mode
2. For each token card rendered:
   - `useTokenMarketData` hook is called with token address
   - Hook fetches data from `/api/token-market-data`
   - API route queries Zapper XYZ GraphQL endpoint
   - Data is returned and displayed on the card
3. Price chart renders historical data
4. Market metrics update in real-time

## Benefits for Users

1. **Informed Decisions**: See price trends before deciding to keep or sell
2. **Market Context**: Understand token performance with market cap and volume
3. **Visual Insights**: Quick price trend recognition through charts
4. **Comprehensive Data**: All relevant token information in one view

## Configuration

Ensure the following environment variable is set:
```
ZAPPER_API_KEY=your_zapper_api_key_here
```

## Future Enhancements

1. **Extended History**: Show different timeframes (1D, 1W, 1M)
2. **Technical Indicators**: Add moving averages or RSI
3. **Social Metrics**: Include social sentiment data
4. **Price Alerts**: Notify users of significant price movements
5. **Comparison Mode**: Compare multiple tokens side by side

## Error Handling

The integration includes graceful fallbacks:
- If Zapper API fails, basic token data is still displayed
- Mock price history is generated for demonstration
- Loading states indicate when data is being fetched
- Error states are handled without breaking the UI

## Performance Considerations

- Data is fetched on-demand per token
- API responses are cached to reduce redundant calls
- Lightweight chart component with no external dependencies
- Optimized for mobile performance

## Related Documentation

- [Swipe Mode Feature](./SWIPE_MODE_FEATURE.md)
- [Zapper XYZ Integration](./ZAPPER_XYZ_INTEGRATION.md)
- [Token Balance Fetching](./TOKEN_BALANCE_FETCHING.md)