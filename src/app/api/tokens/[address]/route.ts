import { NextRequest, NextResponse } from 'next/server';
import { getAddress } from 'thirdweb/utils';
import { getOrSetCache, cacheKeys } from '@/app/lib/cache';

const THIRDWEB_API_URL = 'https://api.thirdweb.com';
const BASE_CHAIN_ID = 8453; // Base mainnet

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
}

// Simplified token icon logic without excessive validation
const getTokenIcon = (token: any, tokenAddress: string, symbol: string): string => {
  // First try the logo from the API response
  if (token.logo && token.logo.startsWith('http')) {
    return token.logo;
  }
  
  // Try known token icons for popular tokens (these are reliable)
  const knownIcons: { [key: string]: string } = {
    'WETH': 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png',
    'USDC': 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
    'USDbC': 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
    'DAI': 'https://assets.coingecko.com/coins/images/9956/thumb/4943.png',
    'USDT': 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png',
    'AERO': 'https://assets.coingecko.com/coins/images/31745/thumb/token.png',
  };
  
  if (knownIcons[symbol]) {
    return knownIcons[symbol];
  }
  
  // Try trustwallet assets with proper checksummed address (without validation)
  try {
    const checksummedAddress = getAddress(tokenAddress);
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/${checksummedAddress}/logo.png`;
  } catch (error) {
    console.error('Error with TrustWallet URL for', tokenAddress, error);
  }
  
  // Return empty string if no valid URL found - client will use TokenProvider
  return '';
};

// Function to fetch all tokens recursively with rate limiting
async function fetchAllTokens(address: string, clientId: string): Promise<ProcessedToken[]> {
  const allTokens: ProcessedToken[] = [];
  let page = 0;
  const limit = 50;
  let hasMore = true;

  while (hasMore) {
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
      console.error('API call failed:', { errorText, status: response.status });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please check your client ID.');
      }
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw new Error('Failed to fetch wallet data from Thirdweb API');
    }

    const data = await response.json();
    
    if (data.result?.tokens && data.result.tokens.length > 0) {
      // Process tokens without image validation to reduce API calls
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
      
      // Add processed tokens to allTokens
      allTokens.push(...processedTokens);

      // Check if we have more pages
      hasMore = data.result.tokens.length === limit;
      page++;
      
      // Add a small delay between API calls to avoid rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      }
    } else {
      hasMore = false;
    }
  }

  return allTokens;
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
    const fetchAll = searchParams.get('fetchAll') === 'true';
    
    // Validate wallet address format (basic check)
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;
    if (!clientId) {
      console.error('Missing NEXT_PUBLIC_THIRDWEB_CLIENT_ID environment variable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Use caching with 5 minute TTL for token balances
    const cacheKey = cacheKeys.tokens(address, { page, limit, fetchAll });
    const cachedData = await getOrSetCache<TokenApiResponse>(
      cacheKey,
      async () => {
        console.log(`Fetching fresh token data for ${address}`);
        
        let processedTokens: ProcessedToken[] = [];

        let hasMore = false;
        let nextPageValue = undefined;
        
        if (fetchAll) {
          // Fetch all tokens recursively
          processedTokens = await fetchAllTokens(address, clientId);
        } else {
          // Fetch only the requested page
          const tokensResponse = await fetch(`${THIRDWEB_API_URL}/v1/wallets/${address}/tokens?chainId=${BASE_CHAIN_ID}&limit=${limit}&page=${page}`, {
            method: 'GET',
            headers: {
              'x-client-id': clientId,
              'Content-Type': 'application/json',
            },
          });

          // Process ERC20 tokens
          if (tokensResponse.ok) {
            try {
              const tokensData = await tokensResponse.json();
              
              // Get pagination info from the API response
              hasMore = tokensData.result?.pagination?.hasMore || false;
              nextPageValue = hasMore ? page + 1 : undefined;
              
              if (tokensData.result?.tokens) {
                // Process tokens without image validation to reduce API calls
                const processedTokensList = tokensData.result.tokens
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
                
                processedTokens = processedTokensList;
              }
            } catch (tokensError) {
              console.error('Error processing tokens:', tokensError);
            }
          }

          // Handle API errors
          if (!tokensResponse.ok) {
            const tokensError = await tokensResponse.text();
            console.error('API call failed:', { tokensError });
            
            if (tokensResponse.status === 401) {
              throw new Error('Authentication failed. Please check your client ID.');
            }
            
            if (tokensResponse.status === 429) {
              throw new Error('Rate limit exceeded. Please try again later.');
            }
            
            throw new Error('Failed to fetch wallet data from Thirdweb API');
          }
        }

        // Sort tokens by USD value (highest first)
        processedTokens.sort((a, b) => (b?.value || 0) - (a?.value || 0));

        console.log(`Successfully processed ${processedTokens.length} tokens for ${address}`);

        return {
          success: true,
          address,
          chainId: BASE_CHAIN_ID,
          tokens: processedTokens,
          totalUsdValue: processedTokens.reduce((sum, token) => sum + token.value, 0),
          timestamp: new Date().toISOString(),
          hasMore,
          nextPage: nextPageValue,
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