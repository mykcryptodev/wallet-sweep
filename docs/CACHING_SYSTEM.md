# Token Balance Caching System

This document explains the caching system implemented for token balances in the Wallet Sweep application.

## Overview

The caching system improves performance and reduces API calls to Thirdweb by caching token balance data for 5 minutes. The cache is automatically invalidated after successful token sales to ensure data consistency.

## Architecture

### Cache Layer
- **Redis**: Used as the primary cache store
- **TTL**: 5 minutes for token balance data
- **Key Format**: `tokens:{walletAddress}` (lowercase)

### Cache Functions

#### `getOrSetCache<T>(key, fetcher, options)`
- Fetches data from cache if available
- Falls back to the provided fetcher function if cache miss
- Automatically stores fresh data in cache
- Supports custom TTL and namespaces

#### `invalidateCache(key, namespace?)`
- Removes a specific cache entry
- Returns boolean indicating success

#### `invalidateByPattern(pattern, namespace?)`
- Removes all cache entries matching a pattern
- Useful for bulk cache invalidation

### API Integration

#### `/api/tokens/[address]`
- Wraps token fetching logic with `getOrSetCache`
- 5-minute TTL for balance data
- Handles cache misses gracefully

#### `/api/cache`
- POST: Invalidate cache entries
- GET: Check cache status for a wallet

## Hook Integration

### `useTokenBalances`
- Integrates with `useCache` hook
- Provides `invalidateCacheAndRefetch()` function
- Shows loading state during cache invalidation

### `useBatchSelling`
- Automatically invalidates cache after successful sells
- Ensures fresh data is fetched after transactions
- Handles cache invalidation errors gracefully

## Cache Invalidation Strategy

### Automatic Invalidation
1. **After Successful Sells**: Cache is invalidated immediately after batch transaction success
2. **Manual Refresh**: Users can manually invalidate cache using `invalidateCacheAndRefetch()`

### Cache Keys
- `tokens:{walletAddress}` - Token balance data for a specific wallet
- Pattern: `tokens:*` - All token cache entries

## Error Handling

- **Redis Failures**: Falls back to direct API calls
- **Cache Invalidation Errors**: Logged but don't break the application
- **Network Issues**: Graceful degradation to fresh data fetching

## Performance Benefits

1. **Reduced API Calls**: Cached data served for 5 minutes
2. **Faster Response Times**: Cache hits return data instantly
3. **Reduced Rate Limiting**: Fewer calls to Thirdweb API
4. **Better UX**: Consistent loading states and error handling

## Configuration

### Environment Variables
- `REDIS_URL`: Redis connection string
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`: Thirdweb client ID

### Cache Settings
- **Default TTL**: 300 seconds (5 minutes)
- **Max Keys**: Unlimited (managed by Redis)
- **Namespace**: Optional for key organization

## Monitoring

### Cache Status Endpoint
```
GET /api/cache?wallet={address}
```

Returns:
```json
{
  "wallet": "0x...",
  "cacheKey": "tokens:0x...",
  "exists": true,
  "ttl": 240,
  "ttlReadable": "4m 0s"
}
```

### Logging
- Cache hits/misses are logged
- Invalidation operations are logged
- Errors are logged with context

## Best Practices

1. **Always invalidate after writes**: Ensure cache consistency
2. **Handle cache failures gracefully**: Don't break the app if Redis is down
3. **Use appropriate TTL**: Balance freshness with performance
4. **Monitor cache hit rates**: Optimize TTL based on usage patterns
5. **Log cache operations**: Helps with debugging and optimization

## Future Enhancements

1. **Cache warming**: Pre-populate cache for active wallets
2. **Smart TTL**: Dynamic TTL based on token volatility
3. **Cache analytics**: Track hit rates and performance metrics
4. **Multi-level caching**: Browser cache + Redis cache
5. **Cache compression**: Reduce memory usage for large datasets 