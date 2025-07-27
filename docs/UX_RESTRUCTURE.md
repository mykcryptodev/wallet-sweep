# UX Restructure: Swipe as Main Interface

## Overview

The app has been restructured to make the swipe interface the primary user experience, with the list view as a secondary option.

## Changes Made

### 1. Main Page (`/`) - Swipe Interface
- **Before**: Simple landing page with connect button and token list
- **After**: Full swipe interface with card-based token management
- Features:
  - Interactive swipe gestures (left to sell, right to keep)
  - Dynamic backgrounds based on token images
  - Price charts overlay
  - Market data integration
  - Progress tracking
  - Batch selling functionality

### 2. List View Page (`/list`) - Traditional List Interface
- **Before**: Integrated into main page
- **After**: Dedicated page for traditional list-based token management
- Features:
  - Traditional list layout
  - Infinite scrolling
  - Batch selection
  - Destination token selection (USDC/ETH)
  - Detailed token information

### 3. Navigation
- **Hamburger menu**: Absolutely positioned in upper left corner for mobile optimization
- **Swipe View**: Card-based interface with swipe gestures
- **List View**: Traditional list interface with detailed token management
- **Visual indicators**: Current view is highlighted in the menu
- **Space efficient**: No header bar, maximum content area

## User Flow

### Primary Flow (Swipe)
1. User connects wallet on main page
2. Tokens are loaded and displayed as swipeable cards
3. User swipes left to select for selling, right to keep
4. Selected tokens can be sold in batch
5. Option to switch to list view for detailed management

### Secondary Flow (List)
1. User navigates to list view from main page
2. Traditional list interface with all tokens
3. Manual selection and batch operations
4. Option to return to swipe interface

## Benefits

### Swipe Interface Benefits
- **Mobile-first**: Optimized for touch interactions
- **Engaging**: Visual card-based interface with animations
- **Efficient**: Quick decision making with swipe gestures
- **Modern**: Dynamic backgrounds and visual feedback

### List Interface Benefits
- **Comprehensive**: Shows all tokens at once
- **Detailed**: More information per token
- **Precise**: Manual selection for specific tokens
- **Traditional**: Familiar interface for power users

## Technical Implementation

### File Structure
```
src/app/
├── page.tsx          # Main swipe interface
├── list/
│   └── page.tsx      # List view page
└── components/
    └── TokenList.tsx # Reusable list component
```

### Key Components
- `TokenCard`: Interactive swipeable card component
- `DynamicBackground`: Visual background based on token images
- `TokenList`: Traditional list component
- `HamburgerNav`: Navigation component for switching between views

## Future Enhancements

1. **Swipe Interface**:
   - Haptic feedback on mobile
   - Swipe animations and effects
   - Token categorization
   - Quick filters

2. **List Interface**:
   - Advanced filtering
   - Sorting options
   - Search functionality
   - Bulk operations

3. **Shared Features**:
   - Token market data
   - Price alerts
   - Portfolio analytics
   - Transaction history 