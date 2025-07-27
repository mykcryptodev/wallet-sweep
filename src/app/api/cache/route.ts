import { NextRequest, NextResponse } from 'next/server';
import { invalidateCache, invalidateByPattern, clearNamespace, cacheKeys } from '@/app/lib/cache';

// POST endpoint to invalidate cache
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, key, pattern, namespace, walletAddress } = body;

    switch (action) {
      case 'invalidate':
        // Invalidate a specific cache key
        if (!key) {
          return NextResponse.json(
            { error: 'Key is required for invalidate action' },
            { status: 400 }
          );
        }
        const success = await invalidateCache(key, namespace);
        return NextResponse.json({
          success,
          message: success ? `Cache key ${key} invalidated` : 'Failed to invalidate cache key',
        });

      case 'invalidatePattern':
        // Invalidate cache keys matching a pattern
        if (!pattern) {
          return NextResponse.json(
            { error: 'Pattern is required for invalidatePattern action' },
            { status: 400 }
          );
        }
        const deletedCount = await invalidateByPattern(pattern, namespace);
        return NextResponse.json({
          success: deletedCount > 0,
          deletedCount,
          message: `Invalidated ${deletedCount} cache entries matching pattern ${pattern}`,
        });

      case 'invalidateWallet':
        // Invalidate cache for a specific wallet address (all pages)
        if (!walletAddress) {
          return NextResponse.json(
            { error: 'Wallet address is required for invalidateWallet action' },
            { status: 400 }
          );
        }
        // Invalidate all cache entries for this wallet (all pages)
        const walletPattern = `tokens:${walletAddress.toLowerCase()}:*`;
        const walletDeletedCount = await invalidateByPattern(walletPattern);
        return NextResponse.json({
          success: walletDeletedCount > 0,
          deletedCount: walletDeletedCount,
          message: walletDeletedCount > 0
            ? `Cache for wallet ${walletAddress} invalidated (${walletDeletedCount} entries)` 
            : 'No cache entries found for wallet',
        });

      case 'clearNamespace':
        // Clear all cache entries in a namespace
        if (!namespace) {
          return NextResponse.json(
            { error: 'Namespace is required for clearNamespace action' },
            { status: 400 }
          );
        }
        const clearedCount = await clearNamespace(namespace);
        return NextResponse.json({
          success: clearedCount > 0,
          clearedCount,
          message: `Cleared ${clearedCount} cache entries in namespace ${namespace}`,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: invalidate, invalidatePattern, invalidateWallet, clearNamespace' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cache API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check cache status (optional)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const walletAddress = searchParams.get('wallet');

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address is required' },
      { status: 400 }
    );
  }

  try {
    const { cacheExists, getCacheTTL } = await import('@/app/lib/cache');
    
    // Check for any cached entries for this wallet
    const walletPattern = `tokens:${walletAddress.toLowerCase()}:*`;
    const { invalidateByPattern } = await import('@/app/lib/cache');
    
    // For now, just check if any cache exists for this wallet
    // In a real implementation, you might want to scan and show all cached pages
    const key = cacheKeys.tokens(walletAddress, { page: 0, limit: 50, fetchAll: false });
    
    const exists = await cacheExists(key);
    const ttl = exists ? await getCacheTTL(key) : null;

    return NextResponse.json({
      wallet: walletAddress,
      cacheKey: key,
      exists,
      ttl,
      ttlReadable: ttl && ttl > 0 ? `${Math.floor(ttl / 60)}m ${ttl % 60}s` : null,
      note: 'Cache now includes page-specific keys. Multiple pages may be cached.',
    });
  } catch (error) {
    console.error('Cache status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check cache status' },
      { status: 500 }
    );
  }
}