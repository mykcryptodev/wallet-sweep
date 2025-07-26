import { NextRequest, NextResponse } from 'next/server';
import { getAddress } from 'thirdweb/utils';
import { getOrSetCache, cacheKeys, invalidateCache } from '@/app/lib/cache';

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

    // Generate cache key for this wallet
    const cacheKey = cacheKeys.tokens(address);
    
    // Use cache with a TTL of 5 minutes (300 seconds)
    const response = await getOrSetCache(
      cacheKey,
      async () => {
        const processedTokens: ProcessedToken[] = [];

        // Fetch both ETH balance and ERC20 tokens in parallel
        const [ethResponse, tokensResponse] = await Promise.all([
          // Fetch ETH balance
          fetch(`${THIRDWEB_API_URL}/v1/wallets/${address}/balance?chainId=${BASE_CHAIN_ID}`, {
            method: 'GET',
            headers: {
              'x-client-id': clientId,
              'Content-Type': 'application/json',
            },
          }),
          // Fetch ERC20 tokens
          fetch(`${THIRDWEB_API_URL}/v1/wallets/${address}/tokens?chainId=${BASE_CHAIN_ID}&limit=50`, {
            method: 'GET',
            headers: {
              'x-client-id': clientId,
              'Content-Type': 'application/json',
            },
          })
        ]);

        // Process ETH balance
        if (ethResponse.ok) {
          try {
            const ethData = await ethResponse.json();
            const ethBalance = parseFloat(ethData.result?.displayValue || '0');
            
            if (ethBalance > 0.0001) {
              // Get ETH price (you could also fetch this from a price API)
              const ethPriceUsd = 3000; // Mock price - in production, fetch from CoinGecko/CoinMarketCap
              
              processedTokens.push({
                address: "ETH",
                symbol: "ETH", 
                name: "Ethereum",
                balance: ethData.result?.value || "0",
                decimals: 18,
                logo: "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png",
                value: ethBalance * ethPriceUsd,
                chainId: BASE_CHAIN_ID,
                priceUsd: ethPriceUsd,
                balanceFormatted: ethBalance
              });
            }
          } catch (ethError) {
            console.error('Error processing ETH balance:', ethError);
          }
        }

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
        if (!ethResponse.ok && !tokensResponse.ok) {
          const ethError = await ethResponse.text();
          const tokensError = await tokensResponse.text();
          console.error('Both API calls failed:', { ethError, tokensError });
          
          if (ethResponse.status === 401 || tokensResponse.status === 401) {
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
      { ttl: 300 } // Cache for 5 minutes
    );

    return NextResponse.json(response);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 