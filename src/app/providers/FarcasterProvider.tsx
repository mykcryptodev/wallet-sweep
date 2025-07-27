'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface FarcasterContextType {
  isReady: boolean;
  triggerHaptic: () => void;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const readyCalledRef = useRef(false);

  useEffect(() => {
    // Only call ready() once
    if (!readyCalledRef.current) {
      readyCalledRef.current = true;
      
      // Initialize the SDK and signal that the app is ready
      sdk.actions.ready()
        .then(() => {
          setIsReady(true);
          console.log('Farcaster Mini App SDK initialized');
        })
        .catch((error) => {
          console.error('Failed to initialize Farcaster SDK:', error);
          setIsReady(true); // Set ready anyway to not block the app
        });
    }
  }, []);

  const triggerHaptic = () => {
    // Try different haptic methods based on SDK availability
    try {
      // Cast to any to check for method availability at runtime
      const sdkAny = sdk as any;
      
      // Try different possible API methods
      if (sdkAny.actions?.haptics && typeof sdkAny.actions.haptics === 'function') {
        sdkAny.actions.haptics();
      } else if (sdkAny.haptics && typeof sdkAny.haptics === 'function') {
        sdkAny.haptics();
      } else if (sdkAny.actions?.triggerHaptic && typeof sdkAny.actions.triggerHaptic === 'function') {
        sdkAny.actions.triggerHaptic();
      } else if (sdkAny.actions?.vibrate && typeof sdkAny.actions.vibrate === 'function') {
        sdkAny.actions.vibrate();
      } else {
        // Fallback to browser vibration API if SDK doesn't support haptics
        if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
          navigator.vibrate(50);
        }
        console.warn('Farcaster SDK haptic feedback not available, using fallback');
      }
    } catch (error) {
      console.error('Failed to trigger haptic feedback:', error);
      // Fallback to browser vibration API
      if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  };

  return (
    <FarcasterContext.Provider value={{ isReady, triggerHaptic }}>
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