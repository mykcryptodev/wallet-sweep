# Rate Limiting Fixes

## Overview

This document outlines the fixes implemented to prevent 429 (Too Many Requests) errors when calling the Thirdweb API. The original implementation was making excessive API calls that triggered rate limiting.

## Issues Identified

### 1. **Excessive Image Validation**
- **Problem**: The `getTokenIcon` function was making HTTP HEAD requests to validate every image URL
- **Impact**: For wallets with many tokens, this could result in 50+ additional HTTP requests per API call
- **Fix**: Removed image validation and simplified icon logic

### 2. **Recursive Fetching Without Delays**
- **Problem**: `fetchAllTokens` function was making rapid successive API calls without delays
- **Impact**: Could trigger rate limiting when fetching multiple pages
- **Fix**: Added 100ms delays between API calls

### 3. **Initial Load Fetching All Tokens**
- **Problem**: Initial load was using `fetchAll: 'true'` which recursively fetched all tokens
- **Impact**: Single request could trigger multiple API calls to Thirdweb
- **Fix**: Always use pagination (`fetchAll: 'false'`) to load tokens incrementally

### 4. **No Debouncing**
- **Problem**: Rapid successive calls from user interactions could trigger rate limiting
- **Impact**: Multiple quick requests could overwhelm the API
- **Fix**: Added 200ms debounce delay to prevent rapid successive calls

## Implemented Fixes

### 1. **Simplified Token Icon Logic**

**Before:**
```typescript
const getTokenIcon = async (token: any, tokenAddress: string, symbol: string): Promise<string> => {
  if (token.logo) {
    const isValid = await isImageUrlValid(token.logo); // HTTP HEAD request
    if (isValid) {
      return token.logo;
    }
  }
  // ... more validation calls
};
```

**After:**
```typescript
const getTokenIcon = (token: any, tokenAddress: string, symbol: string): string => {
  if (token.logo && token.logo.startsWith('http')) {
    return token.logo; // No validation, just return if it looks like a URL
  }
  // ... simplified logic without HTTP requests
};
```

### 2. **Added Rate Limiting Delays**

```typescript
// Add a small delay between API calls to avoid rate limiting
if (hasMore) {
  await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
}
```

### 3. **Always Use Pagination**

**Before:**
```typescript
if (append) {
  params.append('fetchAll', 'false');
} else {
  params.append('fetchAll', 'true'); // Recursive fetching on initial load
}
```

**After:**
```typescript
// Always use pagination to avoid rate limiting - don't fetch all at once
params.append('fetchAll', 'false');
```

### 4. **Added Debouncing**

```typescript
// Debounce API calls to prevent rate limiting
return new Promise<void>((resolve, reject) => {
  debounceRef.current = setTimeout(async () => {
    // API call logic
  }, 200); // 200ms debounce delay
});
```

### 5. **Better Error Handling**

```typescript
if (response.status === 429) {
  throw new Error('Rate limit exceeded. Please try again later.');
}
```

## Performance Improvements

### API Call Reduction
- **Before**: 1 initial call + N image validation calls + recursive fetching
- **After**: 1 call per page with no additional validation calls

### Example for 100 tokens:
- **Before**: 1 + 100 + 2 = ~103 API calls
- **After**: 2 API calls (2 pages of 50 tokens each)

## Monitoring

### Rate Limit Detection
The API now properly detects and handles 429 errors:
```typescript
if (response.status === 429) {
  throw new Error('Rate limit exceeded. Please try again later.');
}
```

### Logging
All API calls are logged for monitoring:
```typescript
console.log('Fetching tokens for:', accountAddress, 'page:', page, 'append:', append);
```

## Best Practices

1. **Use Pagination**: Always load tokens in pages rather than all at once
2. **Debounce User Actions**: Prevent rapid successive calls from user interactions
3. **Cache Aggressively**: Use the existing 5-minute cache to reduce API calls
4. **Handle Rate Limits**: Provide clear error messages when rate limits are hit
5. **Monitor Usage**: Log API calls to track usage patterns

## Configuration

### Debounce Delay
- **Current**: 200ms
- **Adjustable**: Can be modified based on API rate limits

### API Call Delay
- **Current**: 100ms between pages
- **Adjustable**: Can be increased if rate limiting persists

### Cache TTL
- **Current**: 5 minutes
- **Benefit**: Reduces API calls for frequently accessed wallets

## Future Considerations

1. **Adaptive Delays**: Implement dynamic delays based on rate limit headers
2. **Retry Logic**: Add exponential backoff for rate limit errors
3. **Usage Monitoring**: Track API call patterns to optimize further
4. **Preloading**: Consider preloading next page when user approaches end of list 