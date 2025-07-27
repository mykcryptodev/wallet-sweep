# Swipe Mode Feature

## Overview

The Swipe Mode feature provides a Tinder-like interface for managing tokens in your wallet. Users can swipe through their tokens one by one, making quick decisions to either sell or keep each token.

## Features

### 🎯 Tinder-like Interface
- **Card-based Design**: Each token is displayed on a beautiful card with gradient background
- **Swipe Gestures**: 
  - Swipe left to mark token for sale
  - Swipe right to keep token in wallet
- **Touch & Mouse Support**: Works on both mobile and desktop devices
- **Visual Feedback**: Cards rotate and fade based on swipe direction

### 📊 Token Information Display
- **Token Logo**: Displays token logo or fallback to symbol initial
- **Token Details**: Shows symbol, name, balance, value, and price
- **Progress Tracking**: Shows current position and total tokens to review

### 🚀 Individual Token Selling
- **Instant Selling**: Tokens are sold immediately when swiped left
- **Smart Filtering**: Automatically excludes ETH, USDC, and USDbC from swipeable tokens
- **Real Transactions**: Uses Bridge API to execute actual token sales
- **Real-time Feedback**: Users see immediate confirmation of their actions

## User Flow

1. **Connect Wallet**: User connects their wallet on the main page
2. **Navigate to Swipe Mode**: Click the "🎯 Swipe Mode" button
3. **Review Tokens**: Swipe through each token one by one
4. **Make Decisions**: 
   - Swipe left (✕) to sell immediately
   - Swipe right (✓) to keep
5. **View Results**: Review transaction summary modal for each sale

## Technical Implementation

### Components

#### `TokenCard` Component
- Handles touch and mouse events for swipe gestures
- Manages drag state and visual feedback
- Implements smooth animations and transitions

#### `SwipePage` Component
- Main page component managing token state
- Integrates with existing hooks (`useTokenBalances`, `useBatchSelling`)
- Handles individual token selling on swipe left
- Manages navigation and user flow

### Key Features

#### Swipe Detection
```typescript
const threshold = 100;
if (dragOffset.x > threshold) {
  onSwipeRight(); // Keep token
} else if (dragOffset.x < -threshold) {
  onSwipeLeft(); // Sell token immediately via Bridge API
}
```

#### Visual Feedback
- **Rotation**: Cards rotate based on drag direction
- **Opacity**: Cards fade as they're dragged away
- **Smooth Transitions**: CSS transitions for fluid animations

#### State Management
- **Current Index**: Tracks which token is being displayed
- **Selling State**: Tracks currently selling token with loading indicator
- **Progress**: Shows completion status and swipe instructions

## Integration Points

### Existing Hooks
- `useTokenBalances`: Fetches and manages token data
- `useBatchSelling`: Handles the actual selling process
- `useCache`: Manages cache invalidation after sales

### UI Components
- `LoadingSpinner`: Shows loading states
- `ErrorDisplay`: Handles error states
- `EmptyState`: Shows when no tokens available
- `TradeSummaryModal`: Displays transaction results

## File Structure

```
src/app/swipe/
└── page.tsx          # Main swipe page component

src/app/page.tsx      # Updated with navigation link
```

## Usage

1. **Access**: Navigate to `/swipe` or click "🎯 Swipe Mode" on main page
2. **Connect**: Ensure wallet is connected
3. **Swipe**: Use touch or mouse to swipe through tokens
4. **Sell**: Swipe left to sell tokens immediately
5. **Review**: Check transaction summary for each sale

## Benefits

- **Intuitive Interface**: Familiar Tinder-like interaction pattern
- **Quick Decisions**: Streamlined token review process
- **Mobile Friendly**: Optimized for touch interactions
- **Instant Feedback**: Immediate selling provides real-time confirmation
- **Visual Appeal**: Beautiful card-based design with animations

## Future Enhancements

- **Swipe Animations**: Add more sophisticated swipe animations
- **Token Categories**: Group tokens by type or value
- **Swipe History**: Track previous swipe decisions
- **Custom Thresholds**: Allow users to adjust swipe sensitivity
- **Haptic Feedback**: Add vibration feedback on mobile devices 