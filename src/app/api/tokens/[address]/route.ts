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
}

// Helper function to check if an image URL is valid
async function isImageUrlValid(url: string): Promise<boolean> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const contentType = response.headers.get('content-type');
    return response.ok && (contentType?.startsWith('image/') ?? false);
  } catch (error) {
    return false;
  }
}

// Better token icon fallback logic with validation
const getTokenIcon = async (token: any, tokenAddress: string, symbol: string): Promise<string> => {
  // First try the logo from the API response
  if (token.logo) {
    const isValid = await isImageUrlValid(token.logo);
    if (isValid) {
      return token.logo;
    }
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
  
  // Try trustwallet assets with proper checksummed address (with validation)
  try {
    const checksummedAddress = getAddress(tokenAddress);
    const trustwalletUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/${checksummedAddress}/logo.png`;
    
    // Validate the TrustWallet URL before returning it
    const isValid = await isImageUrlValid(trustwalletUrl);
    if (isValid) {
      return trustwalletUrl;
    }
  } catch (error) {
    console.error('Error with TrustWallet URL for', tokenAddress, error);
  }
  
  // Return empty string if no valid URL found - client will use TokenProvider
  return '';
};

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    
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
    const cacheKey = cacheKeys.tokens(address);
    const cachedData = await getOrSetCache<TokenApiResponse>(
      cacheKey,
      async () => {
        console.log(`Fetching fresh token data for ${address}`);
        
        const processedTokens: ProcessedToken[] = [];

        // Fetch only ERC20 tokens (exclude ETH)
        const tokensResponse = await fetch(`${THIRDWEB_API_URL}/v1/wallets/${address}/tokens?chainId=${BASE_CHAIN_ID}&limit=50`, {
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
            
            if (tokensData.result?.tokens) {
              // Process tokens in batches to avoid overwhelming the server with image validation requests
              const tokenPromises = tokensData.result.tokens.map(async (token: any) => {
                const balanceFormatted = parseFloat(token.balance) / Math.pow(10, token.decimals || 18);
                const priceUsd = token.price_data?.price_usd || 0;
                
                // Only include tokens with meaningful balance
                if (balanceFormatted > 0.0001) {
                  const logo = await getTokenIcon(token, token.token_address, token.symbol || 'UNKNOWN');
                  
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
              });
              
              // Wait for all token processing to complete
              const results = await Promise.all(tokenPromises);
              
              // Filter out null results and add to processedTokens
              results.forEach(result => {
                if (result) {
                  processedTokens.push(result);
                }
              });
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
          
          throw new Error('Failed to fetch wallet data from Thirdweb API');
        }

        // Sort tokens by USD value (highest first)
        processedTokens.sort((a, b) => b.value - a.value);

        console.log(`Successfully processed ${processedTokens.length} tokens for ${address}`);

        return {
          success: true,
          address,
          chainId: BASE_CHAIN_ID,
          tokens: processedTokens,
          totalUsdValue: processedTokens.reduce((sum, token) => sum + token.value, 0),
          timestamp: new Date().toISOString(),
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