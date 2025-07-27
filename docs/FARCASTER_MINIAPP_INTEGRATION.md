# Farcaster Mini App Integration

This document describes the integration of Wallet Sweep as a Farcaster mini app using the official @farcaster/miniapp-sdk.

## Overview

Wallet Sweep has been configured as a Farcaster mini app, allowing it to be embedded and launched from Farcaster clients. Users can discover the app through social feeds and add it to their Farcaster client for quick access. The integration now uses the official Farcaster Mini App SDK for enhanced functionality and native features.

## Implementation Details

### 1. Farcaster Mini App SDK Integration

The app now uses the official `@farcaster/miniapp-sdk` for native Farcaster functionality:

- **SDK Initialization**: The SDK is initialized in `FarcasterProvider.tsx` which wraps the entire app
- **Ready Signal**: The app calls `sdk.actions.ready()` on load to hide the splash screen
- **Haptic Feedback**: All haptic feedback now uses `sdk.actions.haptics('light')` instead of manual `navigator.vibrate()`
- **Context Provider**: A React context provides SDK functionality throughout the app

Key features provided by the SDK:
- Native haptic feedback with different intensity levels
- Authentication and user context
- Wallet interactions (Ethereum/Solana)
- Share functionality
- Events and notifications
- Back navigation handling

### 2. Mini App Embed Metatags

The app includes the required metatags in `src/app/layout.tsx`:

- `fc:miniapp` - Primary meta tag containing the mini app embed configuration
- `fc:frame` - Added for backward compatibility

The embed configuration includes:
- **version**: "1" (current mini app specification version)
- **imageUrl**: OpenGraph image with 3:2 aspect ratio
- **button**: Launch button with title "🧹 Sweep Wallet"
- **action**: Launch configuration with app name, URL, and splash screen settings

### 2. OpenGraph Image Generation

Dynamic OpenGraph images are generated via API routes:

- `/api/og` - Generates a 1200x800 (3:2 ratio) preview image
- `/api/splash-icon` - Generates a 200x200 splash screen icon

Both use Next.js's `ImageResponse` for edge-optimized image generation.

### 3. Manifest File

The manifest is located at `/.well-known/farcaster.json` and includes:

- **miniapp** metadata: name, icons, URLs, and configuration
- **accountAssociation**: Placeholder for domain verification (needs to be completed)

## Setup Instructions

### 1. Complete Account Association

To properly verify domain ownership, you need to generate a Farcaster signature:

1. Get your Farcaster account's custody address
2. Generate a signature for the payload: `{ "domain": "wallet-sweep.vercel.app" }`
3. Replace the placeholder values in `/public/.well-known/farcaster.json`:
   - `PLACEHOLDER_HEADER`
   - `PLACEHOLDER_PAYLOAD`
   - `PLACEHOLDER_SIGNATURE`

### 2. Update Domain References

If deploying to a different domain:

1. Update all instances of `wallet-sweep.vercel.app` in:
   - `src/app/layout.tsx`
   - `public/.well-known/farcaster.json`
   - `src/app/page.tsx` (appMetadata URL)

### 3. Implement Webhook Handler (Optional)

If you want to handle mini app events (add/remove, notifications), create an API route at `/api/webhook` to handle:

- `miniapp_added`
- `miniapp_removed`
- `notifications_enabled`
- `notifications_disabled`

### 4. Customize Branding

You can customize the mini app appearance by:

1. Modifying the OpenGraph image in `/api/og/route.tsx`
2. Updating the splash icon in `/api/splash-icon/route.tsx`
3. Changing colors and text in the embed configuration

### 5. Add Base App Metadata

Base App extends the Farcaster manifest with extra fields to improve discovery.
Add `screenshotUrls`, `primaryCategory`, `tags`, `heroImageUrl`, `tagline`,
`ogTitle`, `ogDescription`, and `ogImageUrl` to `/public/.well-known/farcaster.json`.
See [Base docs](https://docs.base.org/base-app/introduction/mini-apps) for details.


## Testing

To test your mini app integration:

1. Deploy your app to a public URL
2. Share the app URL in a Farcaster client
3. The mini app embed should appear with your configured image and button
4. Clicking the button should launch your app in the Farcaster client

## Resources

- [Farcaster Mini Apps Documentation](https://miniapps.farcaster.xyz/docs/specification)
- [Mini Apps SDK](https://github.com/farcasterxyz/miniapps)

## Next Steps

1. Generate proper account association signature
2. Test the mini app in a Farcaster client
3. Extend SDK functionality:
   - Implement user authentication with the SDK's auth features
   - Add native sharing capabilities using `sdk.actions.share()`
   - Implement wallet interactions for on-chain operations
   - Add push notifications support
   - Use SDK events for better app lifecycle management