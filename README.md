
![tw-banner](https://github.com/thirdweb-example/next-starter/assets/57885104/20c8ce3b-4e55-4f10-ae03-2fe4743a5ee8)

# Wallet Sweep

A decentralized app that allows users to select tokens in their wallet and sell them to USDC on Base mainnet (chain ID 8453). Built with Next.js, Thirdweb v5, and Tailwind CSS.

## Features

- 🔗 **Wallet Connection**: Connect with MetaMask, WalletConnect, and other popular wallets
- 🏦 **Base Mainnet Support**: Specifically designed for Base (chain ID 8453)
- 💰 **Token Selection**: Select multiple tokens from your wallet with checkboxes
- 🔄 **Token Swapping**: Swap selected tokens to USDC using Thirdweb Pay
- 📱 **Mobile-First Design**: Beautiful and responsive UI matching the provided design
- ⚡ **Real-time Balance**: Automatically fetch and display your token balances

## Supported Tokens

- ETH (Native Ethereum)
- WETH (Wrapped Ether)
- USDbC (USD Base Coin)
- DAI (Dai Stablecoin)
- AERO (Aerodrome Finance)

## Prerequisites

1. **Thirdweb Client ID**: Get your client ID from [Thirdweb Portal](https://portal.thirdweb.com/)
2. **Base Mainnet RPC**: The app uses Base mainnet (chain ID 8453)
3. **Wallet with Base tokens**: Make sure you have tokens on Base mainnet

## Getting Started

### 1. Clone the repository

\`\`\`bash
git clone <your-repo-url>
cd wallet-sweep
\`\`\`

### 2. Install dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Set up environment variables

Create a \`.env.local\` file in the root directory:

\`\`\`env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
\`\`\`

Get your client ID from [Thirdweb Portal](https://portal.thirdweb.com/):
1. Go to https://portal.thirdweb.com/
2. Create a new project or select an existing one
3. Copy your Client ID from the project dashboard

### 4. Run the development server

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Connect Wallet**: Click the "Connect Wallet" button and connect your preferred wallet
2. **Switch to Base**: Make sure you're connected to Base mainnet (chain ID 8453)
3. **View Tokens**: Your available tokens will be displayed with their balances and USD values
4. **Select Tokens**: Click on the tokens you want to sell (checkboxes will be selected)
5. **Sell Tokens**: Click the blue "Sell X Tokens for $X" button to execute the swap

## Technical Details

### Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Web3 Integration**: Thirdweb v5 SDK
- **Chain**: Base mainnet (8453)
- **Target Token**: USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)

### Key Components

- \`page.tsx\`: Main app component with wallet connection
- \`components/TokenList.tsx\`: Token selection and selling interface
- \`client.ts\`: Thirdweb client configuration

### API Integration

The app uses Thirdweb's Pay API for token swapping:
- \`getBuyWithCryptoQuote\`: Gets swap quotes for token-to-USDC conversion
- \`approve\`: Approves ERC20 token spending
- \`sendTransaction\`: Executes blockchain transactions

## Deployment

### Deploy on Vercel

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your environment variables in the Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:

\`\`\`
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_production_client_id
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.

## Disclaimer

This is a demo application. Always verify transactions and amounts before confirming any swaps. Use at your own risk.
