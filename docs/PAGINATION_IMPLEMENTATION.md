# Pagination Implementation for Token Loading

## Overview

This document describes the implementation of pagination and infinite scrolling for the token loading feature in the wallet-sweep application. The implementation removes the 50-token limit and provides a seamless user experience for loading all available tokens.

## Key Features

### 1. API Enhancements

#### New Query Parameters
- `page`: Page number for paginated requests (default: 0)
- `limit`: Number of tokens per page (default: 50)
- `fetchAll`: Boolean flag to fetch all tokens recursively (default: false)

#### New Response Fields
- `hasMore`: Boolean indicating if more tokens are available
- `nextPage`: Next page number for pagination

#### Recursive Token Fetching
The API now includes a `fetchAllTokens` function that:
- Fetches tokens page by page until no more tokens are available
- Processes each page of tokens with image validation
- Combines all tokens into a single response
- Maintains the same token processing logic (filtering, sorting, etc.)

### 2. Frontend Enhancements

#### Hook Updates (`useTokenBalances`)
- Added `loadingMore` state for pagination loading
- Added `hasMore` and `nextPage` state management
- Implemented `loadMore` function for fetching additional pages
- Enhanced `fetchTokenBalances` to support both initial load and pagination

#### Component Updates (`TokenList`)
- Added intersection observer for automatic infinite scrolling
- Added manual "Load More" button as fallback
- Implemented proper loading states for pagination
- Maintained existing functionality while adding pagination

## Implementation Details

### API Route Changes

```typescript
// New query parameter handling
const page = parseInt(searchParams.get('page') || '0');
const limit = parseInt(searchParams.get('limit') || '50');
const fetchAll = searchParams.get('fetchAll') === 'true';

// Recursive fetching function
async function fetchAllTokens(address: string, clientId: string): Promise<ProcessedToken[]>
```

### Hook State Management

```typescript
const [loadingMore, setLoadingMore] = useState(false);
const [hasMore, setHasMore] = useState(false);
const [nextPage, setNextPage] = useState<number | undefined>(undefined);
```

### Infinite Scrolling

The component uses an Intersection Observer to automatically trigger loading when the user scrolls near the bottom:

```typescript
const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
  const [entry] = entries;
  if (entry.isIntersecting && hasMore && !loadingMore) {
    loadMore();
  }
}, [hasMore, loadingMore, loadMore]);
```

## Usage Patterns

### Initial Load
- Fetches all tokens recursively on first load
- Provides complete token list immediately
- Maintains fast initial load experience

### Infinite Scrolling
- Automatically loads more tokens when user scrolls to bottom
- Shows loading indicator during pagination
- Provides manual "Load More" button as alternative

### Error Handling
- Maintains existing error handling patterns
- Provides retry functionality for failed requests
- Graceful degradation if pagination fails

## Benefits

1. **No Token Limit**: Users can now see all their tokens regardless of quantity
2. **Better Performance**: Initial load is still fast, additional tokens load on demand
3. **Seamless UX**: Infinite scrolling provides smooth user experience
4. **Fallback Options**: Manual "Load More" button available if automatic loading fails
5. **Backward Compatibility**: Existing functionality remains unchanged

## Configuration

The pagination can be configured by modifying:
- `limit` parameter in API calls (default: 50)
- Intersection Observer settings (rootMargin, threshold)
- Cache TTL for token data (currently 5 minutes)

## Future Enhancements

1. **Virtual Scrolling**: For wallets with thousands of tokens
2. **Search/Filter**: Add search functionality across all loaded tokens
3. **Batch Operations**: Optimize batch selling for large token lists
4. **Progressive Loading**: Load tokens by value (highest value first) 