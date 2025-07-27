
![tw-banner](https://github.com/thirdweb-example/next-starter/assets/57885104/20c8ce3b-4e55-4f10-ae03-2fe4743a5ee8)

# Wallet Sweep - Farcaster Mini App

A Farcaster mini app that allows users to easily batch sell multiple tokens from their wallet in one transaction. Built with Next.js, Thirdweb, and Base chain.

## Features

- 🧹 **Batch Token Selling**: Select multiple tokens and sell them all in one transaction
- 🚀 **Farcaster Mini App**: Fully integrated as a Farcaster mini app with embeds and manifest
- ⚡ **Optimized Performance**: Includes caching, pagination, and parallel quote fetching
- 🎨 **Beautiful UI**: Clean interface with loading states, error handling, and toast notifications
- 🔄 **Real-time Updates**: Automatic balance refresh after successful transactions
- 📊 **Zapper XYZ Integration**: Uses Zapper XYZ for comprehensive token balance data

## Farcaster Mini App Integration

This app is fully configured as a Farcaster mini app with:

- **Mini App Embeds**: OpenGraph metadata for sharing in Farcaster feeds
- **Dynamic Images**: Auto-generated OG images and splash icons
- **Manifest File**: Located at `/.well-known/farcaster.json`
- **Webhook Support**: Ready to handle mini app events

See [docs/FARCASTER_MINIAPP_INTEGRATION.md](docs/FARCASTER_MINIAPP_INTEGRATION.md) for setup details.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Thirdweb client ID (get one at [portal.thirdweb.com](https://portal.thirdweb.com/))
- A Zapper XYZ API key (get one at [zapper.xyz](https://zapper.xyz/))

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/wallet-sweep.git
cd wallet-sweep
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your credentials:
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` (required for wallet connection)
- `ZAPPER_API_KEY` (required for token balance fetching)
- Redis credentials (optional, for caching)
- 1inch API key (optional, for quote fetching)

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Deployment

Deploy to Vercel or any platform that supports Next.js:

```bash
npm run build
npm start
```

Remember to:
1. Set your environment variables in the deployment platform
2. Update all domain references if not using `wallet-sweep.vercel.app`
3. Complete the Farcaster account association in the manifest

## Technical Documentation

- [Farcaster Mini App Integration](docs/FARCASTER_MINIAPP_INTEGRATION.md)
- [Zapper XYZ Integration](docs/ZAPPER_XYZ_INTEGRATION.md)
- [Caching System](docs/CACHING_SYSTEM.md)
- [Token Image Cache](docs/TOKEN_IMAGE_CACHE.md)
- [Pagination Implementation](docs/PAGINATION_IMPLEMENTATION.md)
- [Trade Summary Modal](docs/TRADE_SUMMARY_MODAL.md)

## Architecture

The app uses:
- **Next.js 14** with App Router
- **Thirdweb SDK** for Web3 functionality
- **Zapper XYZ** for comprehensive token balance data
- **Base Chain** for transactions
- **Redis** for caching (optional)
- **1inch API** for token quotes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details
