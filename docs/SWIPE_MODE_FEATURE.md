# Swipe Mode Feature

The Swipe Mode feature provides an intuitive, Tinder-like interface for managing tokens in your wallet. Users can quickly swipe through their tokens to decide which ones to keep or sell.

## Features

### Core Functionality
- **Swipe Left**: Sell the token immediately
- **Swipe Right**: Keep the token
- **Touch & Mouse Support**: Works on both mobile and desktop
- **Visual Feedback**: Cards rotate and fade based on swipe direction
- **Progress Tracking**: Shows current position in the token list

### Pagination Support
- **Automatic Loading**: Fetches next page when approaching the end of current tokens
- **Seamless Experience**: New tokens load in the background without interrupting the swipe flow
- **Loading Indicators**: Shows when more tokens are being fetched
- **Progress Display**: Indicates when more tokens are available

### Token Filtering
- **Excludes Native ETH**: ETH tokens are filtered out from the swipe interface
- **Excludes USDC**: USDC tokens are protected from accidental selling
- **Value Threshold**: Only shows tokens with meaningful USD value

## User Interface

### Card Design
- **Token Image**: Displays token logo or fallback symbol
- **Token Information**: Shows symbol, name, balance, value, and price
- **Swipe Instructions**: Clear visual indicators for swipe actions
- **Gradient Background**: Attractive visual design

### Progress Display
- **Current Position**: Shows "X of Y" tokens reviewed
- **Loading Status**: Indicates when more tokens are being fetched
- **Selling Status**: Shows when a token is being sold

### Visual Feedback
- **Swipe Animation**: Cards move and rotate based on drag distance
- **Opacity Changes**: Cards fade as they're swiped
- **Threshold Detection**: Requires minimum swipe distance to trigger action

## Technical Implementation

### State Management
```typescript
const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
const [sellingToken, setSellingToken] = useState<string | null>(null);
```

### Pagination Logic
```typescript
useEffect(() => {
  // If we're within 3 tokens of the end and there are more tokens to load
  if (hasMore && !loadingMore && currentTokenIndex >= swipeableTokens.length - 3) {
    console.log('Loading more tokens...');
    loadMore();
  }
}, [currentTokenIndex, swipeableTokens.length, hasMore, loadingMore, loadMore]);
```

### Swipe Detection
- **Touch Events**: `onTouchStart`, `onTouchMove`, `onTouchEnd`
- **Mouse Events**: `onMouseDown`, `onMouseMove`, `onMouseUp`
- **Threshold**: 100px minimum swipe distance
- **Direction**: Left for sell, right for keep

### Token Selling
- **Bridge Integration**: Uses thirdweb Bridge for token swaps
- **USDC Destination**: All tokens are sold for USDC
- **Error Handling**: Comprehensive error handling with user feedback
- **Cache Invalidation**: Refreshes token list after successful sales

## API Integration

### Token Fetching
- **Pagination Support**: Fetches tokens in pages of 50 by default
- **Automatic Loading**: Triggers when user approaches end of current list
- **Caching**: Uses Redis cache for performance
- **Fallback**: Falls back to thirdweb API if Zapper fails

### Response Format
```typescript
interface TokenApiResponse {
  success: boolean;
  address: string;
  chainId: number;
  tokens: ProcessedToken[];
  totalUsdValue: number;
  timestamp: string;
  hasMore: boolean;
  nextPage?: number;
  error?: string;
}
```

## User Experience

### Mobile Experience
- **Touch Gestures**: Natural swipe gestures on mobile devices
- **Responsive Design**: Optimized for mobile screens
- **Visual Feedback**: Clear animations and transitions

### Desktop Experience
- **Mouse Support**: Full mouse drag support
- **Keyboard Shortcuts**: Can be extended for keyboard navigation
- **Large Screens**: Optimized for desktop displays

### Error Handling
- **Network Errors**: Graceful handling of API failures
- **Transaction Errors**: Clear error messages for failed sales
- **Loading States**: Visual feedback during operations

## Performance Considerations

### Pagination Strategy
- **Proactive Loading**: Loads next page before user reaches the end
- **Efficient Caching**: Uses Redis cache to avoid redundant API calls
- **Debounced Requests**: Prevents rapid successive API calls

### Memory Management
- **Token Filtering**: Only loads tokens that meet criteria
- **Efficient Rendering**: Only renders visible token cards
- **State Cleanup**: Proper cleanup of event listeners

## Future Enhancements

### Potential Improvements
1. **Batch Operations**: Allow selecting multiple tokens for batch selling
2. **Custom Thresholds**: Let users set minimum value thresholds
3. **Token Categories**: Group tokens by type or value
4. **Analytics**: Track user behavior and preferences
5. **Keyboard Navigation**: Add keyboard shortcuts for power users

### Advanced Features
- **Undo Functionality**: Allow users to undo recent actions
- **Favorites**: Let users mark tokens as favorites
- **Custom Lists**: Create custom token lists
- **Export Data**: Export token decisions and analytics

## Troubleshooting

### Common Issues
1. **Tokens Not Loading**: Check network connection and API status
2. **Swipe Not Working**: Ensure touch/mouse events are properly bound
3. **Sales Failing**: Verify wallet connection and gas fees
4. **Pagination Issues**: Check API response format and pagination logic

### Debug Information
- **Console Logs**: Detailed logging for debugging
- **Network Tab**: Monitor API requests and responses
- **State Inspection**: Check React DevTools for state issues

## Integration Points

### Dependencies
- **thirdweb**: Wallet connection and transaction execution
- **React**: UI framework and state management
- **Redis**: Caching for performance
- **Zapper API**: Token data fetching
- **Bridge API**: Token swapping functionality

### Configuration
- **Environment Variables**: API keys and endpoints
- **Theme System**: Consistent visual design
- **Error Boundaries**: Graceful error handling
- **Loading States**: User feedback during operations 