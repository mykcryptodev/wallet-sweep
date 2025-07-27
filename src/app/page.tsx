"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "./client";
import { base } from "thirdweb/chains";
import TokenList from "./components/TokenList";
import { theme } from "./lib/theme";
import { useSystemTheme } from "./hooks/useSystemTheme";

export default function Home() {
  const { theme: systemTheme } = useSystemTheme();

  return (
    <main className={`min-h-screen flex items-center justify-center p-4 ${theme.background.primary}`}>
      <div className={`w-full max-w-md rounded-3xl shadow-lg p-6 ${theme.background.secondary} ${theme.text.primary}`}>
        {/* Connect Button */}
        <div className="mb-6">
          <ConnectButton
            client={client}
            chain={base}
            theme={systemTheme}
            appMetadata={{
              name: "Wallet Sweep",
              url: "https://wallet-sweep.vercel.app",
            }}
            connectButton={{
              label: "Connect Wallet",
              style: {
                width: "100%",
              },
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
