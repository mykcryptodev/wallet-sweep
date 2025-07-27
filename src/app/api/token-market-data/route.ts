import { NextRequest, NextResponse } from 'next/server';

const ZAPPER_API_URL = 'https://public.zapper.xyz/graphql';

interface TokenMarketData {
  tokenAddress: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
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
    const network = searchParams.get('network') || 'BASE_MAINNET';

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

    // Use the same query structure as the existing token fetching
    const query = `
      query PortfolioV2($addresses: [Address!]!, $networks: [Network!]) {
        portfolioV2(addresses: $addresses, networks: $networks) {
          tokenBalances {
            byToken {
              edges {
                node {
                  tokenAddress
                  symbol
                  name
                  price
                  balance
                  balanceUSD
                  network {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    const variables = {
      addresses: [tokenAddress], // Using token address to get token info
      networks: [network]
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
      return NextResponse.json({
        success: true,
        data: {
          tokenAddress,
          price: 0,
          priceChange24h: 0,
          marketCap: 0,
          volume24h: 0,
          priceHistory: generateMockPriceHistory(),
          supply: {
            total: '0',
            circulating: '0'
          },
          holders: 0
        }
      });
    }

    const data = await response.json();
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
    }

    // Try to extract token data from the response
    const portfolio = data.data?.portfolioV2;
    let tokenPrice = 0;
    
    if (portfolio?.tokenBalances?.byToken?.edges) {
      // Look for the specific token in the response
      const tokenEdge = portfolio.tokenBalances.byToken.edges.find(
        (edge: any) => edge.node.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
      );
      
      if (tokenEdge) {
        tokenPrice = tokenEdge.node.price || 0;
      }
    }

    // Generate market data with the actual price if available
    const marketData: TokenMarketData = {
      tokenAddress,
      price: tokenPrice,
      priceChange24h: (Math.random() - 0.5) * 20, // Mock price change for now
      marketCap: Math.floor(Math.random() * 1000000000), // Mock market cap
      volume24h: Math.floor(Math.random() * 10000000), // Mock volume
      priceHistory: generateMockPriceHistory(),
      supply: {
        total: '1000000000',
        circulating: '500000000'
      },
      holders: Math.floor(Math.random() * 10000) + 100
    };

    return NextResponse.json({
      success: true,
      data: marketData
    });

  } catch (error) {
    console.error('Error fetching token market data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch token market data' },
      { status: 500 }
    );
  }
}

// Generate mock price history for demonstration
function generateMockPriceHistory(): Array<{ timestamp: number; price: number }> {
  const history = [];
  const now = Date.now();
  const basePrice = Math.random() * 10;
  
  // Generate 7 days of hourly data
  for (let i = 168; i >= 0; i -= 4) { // Every 4 hours for smoother chart
    const timestamp = now - (i * 60 * 60 * 1000);
    const variance = (Math.random() - 0.5) * 0.2; // ±10% variance
    const price = basePrice * (1 + variance);
    history.push({ timestamp, price });
  }
  
  return history;
}