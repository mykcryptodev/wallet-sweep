"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "./client";
import { defineChain } from "thirdweb/chains";
import TokenList from "./components/TokenList";

// Define Base mainnet chain
const baseMainnet = defineChain(8453);

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6">
        {/* Connect Button */}
        <div className="mb-6">
          <ConnectButton
            client={client}
            chain={baseMainnet}
            appMetadata={{
              name: "Wallet Sweep",
              url: "https://wallet-sweep.vercel.app",
            }}
            connectButton={{
              label: "Connect Wallet",
              style: {
                width: "100%",
                borderRadius: "12px",
                padding: "12px 16px",
                border: "2px solid #000",
                backgroundColor: "white",
                color: "black",
                fontWeight: "500",
              }
            }}
            connectModal={{
              size: "compact",
            }}
          />
        </div>

        {/* Token List Component */}
        <TokenList />
      </div>
    </main>
  );
}
