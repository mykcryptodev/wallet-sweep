import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FarcasterProvider } from './providers/FarcasterProvider';

const inter = Inter({ subsets: ["latin"] });

// Farcaster Mini App Embed configuration
const miniAppEmbed = {
  version: "1",
  imageUrl: "https://wallet-sweep.vercel.app/api/og",
  button: {
    title: "🧹 Sweep Wallet",
    action: {
      type: "launch_frame",
      name: "Wallet Sweep",
      url: "https://wallet-sweep.vercel.app",
      splashImageUrl: "https://wallet-sweep.vercel.app/api/splash-icon",
      splashBackgroundColor: "#1a1a1a"
    }
  }
};

export const metadata: Metadata = {
  title: "Wallet Sweep - Batch Sell Tokens",
  description: "Easily batch sell multiple tokens from your wallet in one transaction. Connect your wallet and sweep unwanted tokens.",
  openGraph: {
    title: "Wallet Sweep - Batch Sell Tokens",
    description: "Easily batch sell multiple tokens from your wallet in one transaction",
    images: [
      {
        url: "https://wallet-sweep.vercel.app/api/og",
        width: 1200,
        height: 800,
        alt: "Wallet Sweep - Batch Sell Tokens",
      },
    ],
  },
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
    "fc:frame": JSON.stringify(miniAppEmbed), // For backward compatibility
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThirdwebProvider>
          <FarcasterProvider>
            {children}
          </FarcasterProvider>
        </ThirdwebProvider>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  );
}
