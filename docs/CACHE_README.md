# Upstash Redis Cache Implementation

This project now includes Upstash Redis for caching token data to improve performance and reduce API calls.

## Setup

1. **Create an Upstash Redis Database**
   - Sign up at [upstash.com](https://upstash.com)
   - Create a new Redis database
   - Copy your REST URL and token

2. **Configure Environment Variables**
   Add these to your `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here
   ```

## Cache Utilities

The cache implementation provides several utility functions in `src/app/lib/cache.ts`:

### Main Functions

- **`getOrSetCache<T>(key, fetcher, options)`** - Get from cache or fetch fresh data
- **`getFromCache<T>(key, namespace?)`** - Get data from cache only
- **`setCache<T>(key, data, options)`** - Set data in cache
- **`invalidateCache(key, namespace?)`** - Remove a single cache entry
- **`invalidateMultiple(keys, namespace?)`** - Remove multiple cache entries
- **`invalidateByPattern(pattern, namespace?)`** - Remove entries matching pattern
- **`clearNamespace(namespace)`** - Clear all entries in a namespace
- **`cacheExists(key, namespace?)`** - Check if cache key exists
- **`getCacheTTL(key, namespace?)`** - Get remaining TTL for a key

### Cache Key Helpers

Pre-configured cache keys for common use cases:

```typescript
cacheKeys.tokens(walletAddress) // For token balances
cacheKeys.tokenPrice(tokenAddress) // For token prices
cacheKeys.apiResponse(endpoint, params) // For generic API responses
```

## Usage Examples

### Basic Usage in API Routes

```typescript
import { getOrSetCache, cacheKeys } from '@/app/lib/cache';

// In your API route
const data = await getOrSetCache(
  cacheKeys.tokens(walletAddress),
  async () => {
    // Fetch fresh data
    const response = await fetch(...);
    return response.json();
  },
  { ttl: 300 } // Cache for 5 minutes
);
```

### Manual Cache Invalidation

```typescript
import { invalidateCache, cacheKeys } from '@/app/lib/cache';

// Invalidate specific wallet cache
await invalidateCache(cacheKeys.tokens(walletAddress));

// Invalidate by pattern
await invalidateByPattern('tokens:*'); // Clear all token caches
```

## Cache Management API

The application includes a cache management API at `/api/cache`:

### Check Cache Status
```bash
GET /api/cache?wallet=0x123...
```

Response:
```json
{
  "wallet": "0x123...",
  "cacheKey": "tokens:0x123...",
  "exists": true,
  "ttl": 180,
  "ttlReadable": "3m 0s"
}
```

### Invalidate Cache

```bash
POST /api/cache
Content-Type: application/json

{
  "action": "invalidateWallet",
  "walletAddress": "0x123..."
}
```

Available actions:
- `invalidate` - Remove specific cache key
- `invalidatePattern` - Remove keys matching pattern
- `invalidateWallet` - Remove wallet token cache
- `clearNamespace` - Clear entire namespace

### Examples

```javascript
// Invalidate specific wallet
fetch('/api/cache', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'invalidateWallet',
    walletAddress: '0x123...'
  })
});

// Clear all token caches
fetch('/api/cache', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'invalidatePattern',
    pattern: 'tokens:*'
  })
});
```

## Current Implementation

The token API (`/api/tokens/[address]`) now:
1. Checks cache first for token data
2. On cache miss, fetches from Thirdweb API
3. Stores result in cache with 5-minute TTL
4. Returns cached or fresh data

This reduces API calls and improves response times for frequently accessed wallets.

## Performance Benefits

- **Reduced API Calls**: Subsequent requests within 5 minutes use cached data
- **Faster Response Times**: Cache hits are near-instantaneous
- **Scalability**: Redis handles high concurrent request volumes
- **Cost Savings**: Fewer external API calls

## Monitoring

Cache operations are logged to console:
- Cache hits: `Cache hit for key: tokens:0x...`
- Cache misses: `Cache miss for key: tokens:0x...`
- Cache sets: `Cached data for key: tokens:0x... with TTL: 300s`
- Invalidations: `Invalidated cache for key: tokens:0x...`

## Error Handling

The cache system is designed to be fault-tolerant:
- If Redis is unavailable, the system falls back to fetching fresh data
- Cache errors are logged but don't break the application
- All cache operations have try-catch blocks

## Future Enhancements

Consider implementing:
- Cache warming for popular wallets
- Adjustable TTL based on wallet activity
- Cache statistics endpoint
- Background cache refresh
- Multi-level caching (memory + Redis)