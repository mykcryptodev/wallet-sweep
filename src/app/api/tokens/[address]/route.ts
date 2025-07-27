import { NextRequest, NextResponse } from 'next/server';
import { getOrSetCache, cacheKeys } from '@/app/lib/cache';

const ZAPPER_API_URL = 'https://public.zapper.xyz/graphql';
const THIRDWEB_API_URL = 'https://api.thirdweb.com';
const BASE_CHAIN_ID = 8453; // Base mainnet

interface ZapperToken {
  symbol: string;
  tokenAddress: string;
  balance: string;
  balanceRaw: string;
  balanceUSD: number;
  price: number;
  imgUrlV2: string;
  name: string;
  network: {
    name: string;
  };
}

interface ProcessedToken {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  logo: string;
  value: number;
  chainId: number;
  priceUsd: number;
  balanceFormatted: number;
}

interface TokenApiResponse {
  success: boolean;
  address: string;
  chainId: number;
  tokens: ProcessedToken[];
  totalUsdValue: number;
  timestamp: string;
  hasMore: boolean;
  nextPage?: number;
  error?: string;
}

// Simplified token icon logic
const getTokenIcon = (token: any, tokenAddress?: string, symbol?: string): string => {
  // Use Zapper's image URL if available
  if (token.imgUrlV2 && token.imgUrlV2.startsWith('http')) {
    return token.imgUrlV2;
  }
  
  // Try known token icons for popular tokens
  const knownIcons: { [key: string]: string } = {
    'WETH': 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png',
    'USDC': 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
    'USDbC': 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
    'DAI': 'https://assets.coingecko.com/coins/images/9956/thumb/4943.png',
    'USDT': 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png',
    'AERO': 'https://assets.coingecko.com/coins/images/31745/thumb/token.png',
  };
  
  if (knownIcons[token.symbol || symbol]) {
    return knownIcons[token.symbol || symbol];
  }
  
  // Return empty string if no valid URL found - client will use TokenProvider
  return '';
};

// Function to fetch tokens from Zapper XYZ
async function fetchTokensFromZapper(address: string, first: number = 50, minBalanceUSD: number = 0.01, offset: number = 0): Promise<ProcessedToken[]> {
  const query = `
    query PortfolioV2($addresses: [Address!]!, $networks: [Network!]) {
      portfolioV2(addresses: $addresses, networks: $networks) {
        tokenBalances {
          byToken {
            edges {
              node {
                balance
                balanceRaw
                balanceUSD
                symbol
                name
                tokenAddress
                price
                imgUrlV2
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
    addresses: [address],
    networks: ['BASE_MAINNET']
  };

  const response = await fetch(ZAPPER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-zapper-api-key': process.env.ZAPPER_API_KEY!,
    },
    body: JSON.stringify({
      query,
      variables
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Zapper API call failed:', { errorText, status: response.status });
    
    if (response.status === 401) {
      throw new Error('Authentication failed. Please check your Zapper API key.');
    }
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    throw new Error('Failed to fetch wallet data from Zapper API');
  }

  const data = await response.json();
  
  if (data.errors) {
    console.error('GraphQL errors:', data.errors);
    throw new Error('GraphQL query failed');
  }

  const portfolio = data.data?.portfolioV2;
  if (!portfolio) {
    throw new Error('No portfolio data returned from Zapper');
  }

  const tokenBalances = portfolio.tokenBalances;
  if (!tokenBalances?.byToken?.edges) {
    return [];
  }

  // Process tokens
  const processedTokens = tokenBalances.byToken.edges
    .map((edge: any) => {
      const token: ZapperToken = edge.node;
      
      // Convert balance to formatted number (assuming 18 decimals for most tokens)
      const balanceFormatted = parseFloat(token.balance) || parseFloat(token.balanceRaw) / Math.pow(10, 18);
      const priceUsd = token.price || 0;
      
      // Only include tokens with meaningful balance
      if (balanceFormatted > 0.0001 && token.balanceUSD >= minBalanceUSD) {
        const logo = getTokenIcon(token);
        
        return {
          address: token.tokenAddress,
          symbol: token.symbol || 'UNKNOWN',
          name: token.name || 'Unknown Token',
          balance: token.balanceRaw || token.balance,
          decimals: 18, // Most tokens use 18 decimals
          logo,
          value: token.balanceUSD,
          chainId: BASE_CHAIN_ID,
          priceUsd: priceUsd,
          balanceFormatted: balanceFormatted
        };
      }
      return null;
    })
    .filter(Boolean);

  return processedTokens;
}

// Fallback function to fetch tokens from thirdweb
async function fetchTokensFromThirdweb(address: string, limit: number = 50, page: number = 0): Promise<ProcessedToken[]> {
  const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
  if (!clientId) {
    throw new Error('Thirdweb client ID not configured');
  }

  const url = `${THIRDWEB_API_URL}/v1/wallets/${address}/tokens?chainId=${BASE_CHAIN_ID}&limit=${limit}&page=${page}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-client-id': clientId,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Thirdweb API call failed:', { errorText, status: response.status });
    throw new Error('Failed to fetch wallet data from Thirdweb API');
  }

  const data = await response.json();
  
  if (!data.result?.tokens) {
    return [];
  }

  // Process tokens
  const processedTokens = data.result.tokens
    .map((token: any) => {
      const balanceFormatted = parseFloat(token.balance) / Math.pow(10, token.decimals || 18);
      const priceUsd = token.price_data?.price_usd || 0;
      
      // Only include tokens with meaningful balance
      if (balanceFormatted > 0.0001) {
        const logo = getTokenIcon(token, token.token_address, token.symbol || 'UNKNOWN');
        
        return {
          address: token.token_address,
          symbol: token.symbol || 'UNKNOWN',
          name: token.name || 'Unknown Token',
          balance: token.balance,
          decimals: token.decimals || 18,
          logo,
          value: balanceFormatted * priceUsd,
          chainId: BASE_CHAIN_ID,
          priceUsd: priceUsd,
          balanceFormatted: balanceFormatted
        };
      }
      return null;
    })
    .filter(Boolean);

  return processedTokens;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '50');
    const minBalanceUSD = parseInt(searchParams.get('minBalanceUSD') || '0.01');
    
    // Validate wallet address format (basic check)
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const zapperApiKey = process.env.ZAPPER_API_KEY;
    if (!zapperApiKey) {
      console.error('Missing ZAPPER_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Use caching with 5 minute TTL for token balances
    const cacheKey = cacheKeys.tokens(address, { page, limit, minBalanceUSD });
    const cachedData = await getOrSetCache<TokenApiResponse>(
      cacheKey,
      async () => {
        console.log(`Fetching fresh token data for ${address}, page: ${page}`);
        
        let processedTokens: ProcessedToken[] = [];
        
        try {
          // Try Zapper first
          console.log('Attempting to fetch from Zapper API...');
          // For Zapper, we fetch all tokens and then paginate on our side
          const allTokens = await fetchTokensFromZapper(address, 1000, minBalanceUSD);
          
          // Apply pagination manually since Zapper doesn't support it natively
          const startIndex = page * limit;
          const endIndex = startIndex + limit;
          processedTokens = allTokens.slice(startIndex, endIndex);
          
          console.log(`Successfully fetched ${processedTokens.length} tokens from Zapper (page ${page})`);
        } catch (zapperError) {
          console.error('Zapper API failed, falling back to thirdweb:', zapperError);
          
          try {
            // Fallback to thirdweb
            console.log('Attempting to fetch from thirdweb API...');
            processedTokens = await fetchTokensFromThirdweb(address, limit, page);
            console.log(`Successfully fetched ${processedTokens.length} tokens from thirdweb (page ${page})`);
          } catch (thirdwebError) {
            console.error('Both APIs failed:', thirdwebError);
            throw new Error('Failed to fetch token data from both Zapper and thirdweb APIs');
          }
        }

        // Sort tokens by USD value (highest first)
        processedTokens.sort((a, b) => (b?.value || 0) - (a?.value || 0));

        console.log(`Successfully processed ${processedTokens.length} tokens for ${address}`);

        // Determine if there are more tokens
        // For Zapper, we need to check if we got a full page
        const hasMore = processedTokens.length === limit;

        return {
          success: true,
          address,
          chainId: BASE_CHAIN_ID,
          tokens: processedTokens,
          totalUsdValue: processedTokens.reduce((sum, token) => sum + token.value, 0),
          timestamp: new Date().toISOString(),
          hasMore,
          nextPage: hasMore ? page + 1 : undefined,
        };
      },
      { ttl: 300 } // 5 minute cache TTL
    );

    return NextResponse.json(cachedData);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 