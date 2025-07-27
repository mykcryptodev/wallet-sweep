import { NextRequest, NextResponse } from 'next/server';
import { getFromCache, setCache } from '@/app/lib/cache';
import { TOKEN_IMAGE_CACHE_PREFIX, COINGECKO_UNKNOWN_IMG, TOKEN_IMAGE_OVERRIDES } from '@/app/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chainName = searchParams.get('chain');
    const tokenAddress = searchParams.get('address');

    if (!chainName || !tokenAddress) {
      return NextResponse.json({ error: 'Missing chain or address parameter' }, { status: 400 });
    }

    const normalizedAddress = tokenAddress.toLowerCase();

    // Check for override first
    if (TOKEN_IMAGE_OVERRIDES.has(normalizedAddress)) {
      return NextResponse.json({ image: TOKEN_IMAGE_OVERRIDES.get(normalizedAddress) });
    }

    // Create a cache key from chain and address
    const cacheKey = `${TOKEN_IMAGE_CACHE_PREFIX}${chainName}:${normalizedAddress}`;
    
    // Check if we have cached data in Redis (no expiration for token images)
    const cachedData = await getFromCache<{ image: string }>(cacheKey);
    if (cachedData) {
      console.log('Using cached token image');
      return NextResponse.json(cachedData);
    }

    // Try to get image from CoinGecko
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/${chainName}/contract/${tokenAddress}`);
    
    if (!res.ok) {
      // Cache the unknown image result (no expiration)
      const data = { image: COINGECKO_UNKNOWN_IMG };
      await setCache(cacheKey, data, { ttl: 0 }); // ttl: 0 means no expiration
      return NextResponse.json(data);
    }

    const json = await res.json();
    const data = { image: json.image?.large ?? COINGECKO_UNKNOWN_IMG };

    // Cache the successful result in Redis (no expiration)
    await setCache(cacheKey, data, { ttl: 0 }); // ttl: 0 means no expiration

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching token image:', error);
    return NextResponse.json({ image: COINGECKO_UNKNOWN_IMG });
  }
} 