# Pagination Cache Fix

## Problem

When fetching the next page of tokens, users were getting the same tokens from the previous page instead of new tokens. This was happening because all pages were sharing the same cache key.

## Root Cause

### 1. **Same Cache Key for All Pages**
- **Before**: `tokens:${walletAddress}` (same key for all pages)
- **Problem**: Page 0 and Page 1 were using the same cache entry
- **Result**: Always getting cached data from the first page

### 2. **Cache Key Structure**
```typescript
// OLD - All pages shared the same cache
const cacheKey = cacheKeys.tokens(address);

// NEW - Each page has its own cache
const cacheKey = cacheKeys.tokens(address, { page, limit, fetchAll });
```

## Solution

### 1. **Updated Cache Key Function**
```typescript
// Before
tokens: (walletAddress: string) => `tokens:${walletAddress.toLowerCase()}`

// After  
tokens: (walletAddress: string, params?: Record<string, any>) => {
  const paramStr = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
  return `tokens:${walletAddress.toLowerCase()}:${paramStr}`;
}
```

### 2. **Page-Specific Cache Keys**
Now each page gets its own cache key:
- **Page 0**: `tokens:0x123...:{"fetchAll":false,"limit":50,"page":0}`
- **Page 1**: `tokens:0x123...:{"fetchAll":false,"limit":50,"page":1}`
- **Page 2**: `tokens:0x123...:{"fetchAll":false,"limit":50,"page":2}`

### 3. **Updated Cache Invalidation**
When invalidating wallet cache, we now clear all pages:
```typescript
// Invalidate all cache entries for this wallet (all pages)
const walletPattern = `tokens:${walletAddress.toLowerCase()}:*`;
const walletDeletedCount = await invalidateByPattern(walletPattern);
```

## Implementation Details

### API Route Changes
```typescript
// Use caching with page-specific keys
const cacheKey = cacheKeys.tokens(address, { page, limit, fetchAll });
const cachedData = await getOrSetCache<TokenApiResponse>(
  cacheKey,
  async () => {
    // Fetch specific page data
  },
  { ttl: 300 }
);
```

### Cache Key Examples
```typescript
// Page 0, limit 50
tokens:0x123...:{"fetchAll":false,"limit":50,"page":0}

// Page 1, limit 50  
tokens:0x123...:{"fetchAll":false,"limit":50,"page":1}

// All tokens (fetchAll=true)
tokens:0x123...:{"fetchAll":true,"limit":50,"page":0}
```

## Benefits

1. **Correct Pagination**: Each page gets its own cached data
2. **No Duplicate Tokens**: Different pages show different tokens
3. **Proper Cache Invalidation**: Clearing wallet cache removes all pages
4. **Performance**: Still benefits from caching, but per-page
5. **Scalability**: Can handle wallets with many tokens across multiple pages

## Testing

### Before Fix
- Load page 0: Shows tokens 1-50
- Load page 1: Shows tokens 1-50 (same as page 0)
- Load page 2: Shows tokens 1-50 (same as page 0)

### After Fix
- Load page 0: Shows tokens 1-50
- Load page 1: Shows tokens 51-100
- Load page 2: Shows tokens 101-150

## Cache Management

### Invalidation Strategy
When a user performs an action that should invalidate cache:
1. **Pattern-based invalidation**: `tokens:${walletAddress}:*`
2. **Removes all pages**: Ensures fresh data across all pages
3. **Automatic on transactions**: Cache cleared after successful sells

### Cache Status
The cache status endpoint now shows:
```json
{
  "wallet": "0x123...",
  "cacheKey": "tokens:0x123...:{\"page\":0,\"limit\":50,\"fetchAll\":false}",
  "exists": true,
  "ttl": 240,
  "note": "Cache now includes page-specific keys. Multiple pages may be cached."
}
```

## Future Considerations

1. **Cache Warming**: Pre-load next page when user approaches end
2. **Selective Invalidation**: Invalidate only specific pages when needed
3. **Cache Analytics**: Track which pages are accessed most frequently
4. **Memory Optimization**: Implement cache size limits for large wallets 