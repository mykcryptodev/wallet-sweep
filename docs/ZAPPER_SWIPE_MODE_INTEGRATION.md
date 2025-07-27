# Zapper XYZ Integration for Swipe Mode

This document describes the integration of Zapper XYZ API to provide comprehensive token market data and price charts in the swipe mode feature.

## Overview

The swipe mode now displays enriched token data powered by Zapper XYZ, helping users make informed decisions about whether to keep or sell their tokens. Each token card shows:

- **Price Charts**: Visual representation of real token price history from Zapper's API
- **Market Data**: Real market cap, 24h volume, and holder count
- **Price Changes**: 24-hour price change percentage from live data
- **Token Metrics**: Additional insights from Zapper's comprehensive data

## Implementation Details

### 1. API Route (`/api/token-market-data`)

Created a new API endpoint that fetches token market data from Zapper using the `fungibleTokenV2` query:

```typescript
// src/app/api/token-market-data/route.ts
export async function GET(request: NextRequest) {
  // Fetches token data including:
  // - Current price (real-time)
  // - Price change (24h, 1h, 5m)
  // - Market cap (real)
  // - Trading volume (real)
  // - Price history (real historical data)
  // - Token holders
}
```

**Real Data Sources:**
- **Price History**: Uses Zapper's `priceTicks` with `DAY` timeframe
- **Market Data**: Real market cap, volume, and price changes
- **Token Info**: Name, symbol, decimals, and image URL

### 2. Custom Hook (`useTokenMarketData`)

A React hook that manages the fetching and caching of token market data:

```typescript
// src/app/hooks/useTokenMarketData.ts
export function useTokenMarketData(tokenAddress: string | null) {
  // Returns: { data, loading, error }
}
```

### 3. Price Chart Component

A lightweight SVG-based chart component that visualizes real token price history:

```typescript
// src/app/components/PriceChart.tsx
export function PriceChart({ 
  data, 
  height = 120, 
  showGrid = true 
}: PriceChartProps)
```

Features:
- **Real Data**: Displays actual historical price data from Zapper
- **Responsive SVG rendering**: Smooth, scalable charts
- **Green/red color coding**: For positive/negative trends
- **Gradient fill**: For visual appeal
- **Grid lines**: For better readability

### 4. Enhanced Token Card

The swipe mode token cards now display:

#### Header Section
- Token icon with backdrop blur effect
- **Real price chart overlay** in the background
- Token symbol and name

#### Price Information
- Current price (real-time from Zapper)
- **24-hour price change** with color coding (real data)
- Portfolio balance and USD value

#### Market Data Section
- **Market capitalization** (real data, formatted with K/M/B suffixes)
- **24-hour trading volume** (real data)
- Number of token holders

## Visual Design

The updated token cards feature:
- **Gradient Background**: Blue to purple gradient with real price chart overlay
- **Glassmorphism**: Semi-transparent elements with backdrop blur
- **Color Coding**: Green for positive changes, red for negative
- **Data Hierarchy**: Most important information (price, value) prominently displayed

## Data Flow

1. User enters swipe mode
2. For each token card rendered:
   - `useTokenMarketData` hook is called with token address
   - Hook fetches data from `/api/token-market-data`
   - API route queries Zapper XYZ `fungibleTokenV2` endpoint
   - **Real price history** and market data is returned
   - Data is displayed on the card with actual charts

## Benefits for Users

1. **Informed Decisions**: See real price trends before deciding to keep or sell
2. **Market Context**: Understand token performance with real market cap and volume
3. **Visual Insights**: Quick price trend recognition through real charts
4. **Comprehensive Data**: All relevant token information from live sources

## Configuration

Ensure the following environment variable is set:
```
ZAPPER_API_KEY=your_zapper_api_key_here
```

## API Details

### Zapper Query Used
```graphql
query TokenPriceData($address: Address!, $chainId: Int!, $currency: Currency!, $timeFrame: TimeFrame!) {
  fungibleTokenV2(address: $address, chainId: $chainId) {
    address
    symbol
    name
    decimals
    imageUrlV2
    priceData {
      marketCap
      price
      priceChange5m
      priceChange1h
      priceChange24h
      volume24h
      totalGasTokenLiquidity
      totalLiquidity
      priceTicks(currency: $currency, timeFrame: $timeFrame) {
        open
        median
        close
        timestamp
      }
    }
  }
}
```

### Real Data Points
- **Price History**: 293 data points per token (daily timeframe)
- **Market Data**: Live market cap, volume, and price changes
- **Token Metadata**: Real names, symbols, and images

## Future Enhancements

1. **Extended History**: Show different timeframes (1D, 1W, 1M)
2. **Technical Indicators**: Add moving averages or RSI
3. **Social Metrics**: Include social sentiment data
4. **Price Alerts**: Notify users of significant price movements
5. **Comparison Mode**: Compare multiple tokens side by side

## Error Handling

The integration includes graceful fallbacks:
- If Zapper API fails, basic token data is still displayed
- **Mock price history** is generated only as a last resort
- Loading states indicate when data is being fetched
- Error states are handled without breaking the UI

## Performance Considerations

- **Real-time Data**: Charts show actual market movements
- **Efficient Caching**: Redis-based caching for API responses with 10-minute TTL
- **Optimized Rendering**: SVG charts for smooth performance
- **Fallback Strategy**: Graceful degradation if API unavailable
- **Full-width Charts**: Charts now span the full width of the card container

## Caching Implementation

The market data API now includes intelligent caching:

### Cache Configuration
- **TTL**: 10 minutes for price data (frequent updates)
- **Cache Key**: `price:{tokenAddress}` format
- **Fallback**: Direct API call if cache fails

### Benefits
- **Faster Loading**: Subsequent requests served from cache
- **Reduced API Calls**: Minimizes Zapper API usage
- **Better UX**: Instant chart display for cached tokens
- **Cost Optimization**: Reduces API rate limit consumption

### Cache Strategy
```typescript
// Cache key generation
const cacheKey = cacheKeys.tokenPrice(tokenAddress);

// Cached data with 10-minute TTL
const cachedData = await getOrSetCache<TokenMarketData>(
  cacheKey,
  async () => { /* API call */ },
  { ttl: 600 } // 10 minutes
);
```

## Chart Improvements

### Full-width Display
- **Responsive Design**: Charts now span full card width
- **Better Visibility**: Increased chart width to 450px
- **Minimal Padding**: Reduced side padding for maximum chart area
- **Centered Layout**: Charts are properly centered in containers

### Visual Enhancements
- **Smooth Rendering**: SVG-based charts with optimized performance
- **Color Coding**: Green for positive trends, red for negative
- **Gradient Fill**: Visual appeal with area fills
- **Grid Lines**: Optional grid for better readability

## Troubleshooting

### Common Issues
1. **"No price data"**: Token might not be available on Base network
2. **"API errors"**: Check Zapper API key and rate limits
3. **"Empty charts"**: Token might not have sufficient trading history

### Debug Steps
1. Verify Zapper API key is valid
2. Check if token address exists on Base network
3. Test API endpoint directly with known tokens (e.g., WETH)
4. Review server logs for detailed error messages