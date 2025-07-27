'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useConnect, useActiveWallet, useActiveWalletConnectionStatus } from 'thirdweb/react';
import { EIP1193 } from 'thirdweb/wallets';
import { base } from 'thirdweb/chains';
import { client } from '../client';

interface FarcasterContextType {
  triggerHaptic: () => void;
  context: any;
  isSDKLoaded: boolean;
  connectWallet: () => Promise<void>;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>();
  const { connect } = useConnect();

  const connectWallet = useCallback(async () => {
    connect(async () => {
      // create a wallet instance from the Farcaster provider
      const wallet = EIP1193.fromProvider({ provider: sdk.wallet.ethProvider });

      // trigger the connection
      await wallet.connect({ client, chain: base });

      // return the wallet to the app context
      return wallet;
    });
  }, [connect]);

  useEffect(() => {
    const load = async () => {
      setContext(await sdk.context);
      sdk.actions.ready({});
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
      if (sdk.wallet) {
        connectWallet();
      }
    }
  }, [isSDKLoaded, connectWallet]);

  const triggerHaptic = () => {
    // Use Farcaster SDK haptics with fallback to browser API
    try {
      // Use impact feedback for swipe actions
      sdk.haptics.impactOccurred('light')
        .catch(() => {
          // Fallback to browser vibration API if SDK haptics fail
          if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
            navigator.vibrate(50);
          }
        });
    } catch (error) {
      // Fallback to browser vibration API if SDK haptics are not available
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  };

  return (
    <FarcasterContext.Provider value={{ triggerHaptic, context, isSDKLoaded, connectWallet }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error('useFarcaster must be used within a FarcasterProvider');
  }
  return context;
}