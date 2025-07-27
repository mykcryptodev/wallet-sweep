import { NextRequest, NextResponse } from 'next/server';
import { getOrSetCache, cacheKeys } from '@/app/lib/cache';

const ZAPPER_API_URL = 'https://public.zapper.xyz/graphql';

interface TokenMarketData {
  tokenAddress: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  totalLiquidity: number;
  priceHistory: Array<{
    timestamp: number;
    price: number;
  }>;
  supply: {
    total: string;
    circulating: string;
  };
  holders: number;
}

// Fetch token market data from Zapper
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tokenAddress = searchParams.get('tokenAddress');

    if (!tokenAddress) {
      return NextResponse.json(
        { success: false, error: 'Token address is required' },
        { status: 400 }
      );
    }

    const zapperApiKey = process.env.ZAPPER_API_KEY;
    if (!zapperApiKey) {
      console.error('Missing ZAPPER_API_KEY environment variable');
      return NextResponse.json(
        { success: false, error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Use caching with 10 minute TTL for market data (price data changes frequently)
    const cacheKey = cacheKeys.tokenPrice(tokenAddress);
    const cachedData = await getOrSetCache<TokenMarketData>(
      cacheKey,
      async () => {
        console.log(`Fetching fresh market data for ${tokenAddress}`);
        
        // Query for token price data with historical price ticks
        const query = `
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
        `;

        const variables = {
          address: tokenAddress,
          chainId: 8453, // Base mainnet
          currency: "USD",
          timeFrame: "DAY"
        };

        const response = await fetch(ZAPPER_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-zapper-api-key': zapperApiKey,
          },
          body: JSON.stringify({
            query,
            variables
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Zapper API call failed:', { errorText, status: response.status });
          
          // Return basic data structure on error
          return {
            tokenAddress,
            price: 0,
            priceChange24h: 0,
            marketCap: 0,
            volume24h: 0,
            totalLiquidity: 0,
            priceHistory: generateMockPriceHistory(0),
            supply: {
              total: '0',
              circulating: '0'
            },
            holders: 0
          };
        }

        const data = await response.json();
        
        if (data.errors) {
          console.error('GraphQL errors:', data.errors);
        }

        // Extract token data from the response
        const tokenData = data.data?.fungibleTokenV2;
        let tokenPrice = 0;
        let priceChange24h = 0;
        let marketCap = 0;
        let volume24h = 0;
        let totalLiquidity = 0;
        let priceHistory: Array<{ timestamp: number; price: number }> = [];
        
        if (tokenData?.priceData) {
          const priceData = tokenData.priceData;
          tokenPrice = priceData.price || 0;
          priceChange24h = priceData.priceChange24h || 0;
          marketCap = priceData.marketCap || 0;
          volume24h = priceData.volume24h || 0;
          totalLiquidity = priceData.totalLiquidity || 0;
          
          // Convert price ticks to our format
          if (priceData.priceTicks && priceData.priceTicks.length > 0) {
            priceHistory = priceData.priceTicks.map((tick: any) => ({
              timestamp: tick.timestamp,
              price: tick.close || tick.median || tick.open
            }));
          }
        }

        // Generate market data with real data if available
        const marketData: TokenMarketData = {
          tokenAddress,
          price: tokenPrice,
          priceChange24h: priceChange24h,
          marketCap: marketCap,
          volume24h: volume24h,
          totalLiquidity: totalLiquidity,
          priceHistory: priceHistory.length > 0 ? priceHistory : generateMockPriceHistory(tokenPrice),
          supply: {
            total: '1000000000',
            circulating: '500000000'
          },
          holders: Math.floor(Math.random() * 10000) + 100 // Still mock for now
        };

        console.log(`Successfully fetched market data for ${tokenAddress}`);
        return marketData;
      },
      { ttl: 600 } // 10 minute cache TTL
    );

    return NextResponse.json({
      success: true,
      data: cachedData
    });

  } catch (error) {
    console.error('Error fetching token market data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch token market data' },
      { status: 500 }
    );
  }
}

// Generate unique price history based on token price
function generateMockPriceHistory(tokenPrice: number = 1): Array<{ timestamp: number; price: number }> {
  const history = [];
  const now = Date.now();
  const basePrice = tokenPrice || Math.random() * 10;
  
  // Generate 7 days of hourly data
  for (let i = 168; i >= 0; i -= 4) { // Every 4 hours for smoother chart
    const timestamp = now - (i * 60 * 60 * 1000);
    const variance = (Math.random() - 0.5) * 0.2; // ±10% variance
    const price = basePrice * (1 + variance);
    history.push({ timestamp, price });
  }
  
  return history;
}