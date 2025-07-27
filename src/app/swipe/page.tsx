"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "../client";
import { base } from "thirdweb/chains";
import { theme } from "../lib/theme";
import { useSystemTheme } from "../hooks/useSystemTheme";
import { useActiveAccount } from "thirdweb/react";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { useBatchSelling } from "../hooks/useBatchSelling";
import { useState, useEffect, useRef } from "react";
import { NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorDisplay } from "../components/ui/ErrorDisplay";
import { EmptyState } from "../components/ui/EmptyState";
import TradeSummaryModal from "../components/TradeSummaryModal";
import { USDC } from "../constants";
import Link from "next/link";
import { toast } from "react-toastify";
import { Bridge } from "thirdweb";
import { useSendCalls } from "thirdweb/react";
import { prepareTransaction } from "thirdweb";

interface TokenCardProps {
  token: any;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isVisible: boolean;
}

function TokenCard({ token, onSwipeLeft, onSwipeRight, isVisible }: TokenCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartPos({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const offsetX = touch.clientX - startPos.x;
    const offsetY = touch.clientY - startPos.y;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 100;
    if (dragOffset.x > threshold) {
      onSwipeRight();
    } else if (dragOffset.x < -threshold) {
      onSwipeLeft();
    }
    
    setDragOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartPos({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const offsetX = e.clientX - startPos.x;
    const offsetY = e.clientY - startPos.y;
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 100;
    if (dragOffset.x > threshold) {
      onSwipeRight();
    } else if (dragOffset.x < -threshold) {
      onSwipeLeft();
    }
    
    setDragOffset({ x: 0, y: 0 });
  };

  const getRotation = () => {
    return (dragOffset.x / 10) * (dragOffset.x > 0 ? 1 : -1);
  };

  const getOpacity = () => {
    return 1 - Math.abs(dragOffset.x) / 300;
  };

  if (!isVisible) return null;

  return (
    <div
      ref={cardRef}
      className={`absolute inset-0 cursor-grab active:cursor-grabbing transition-all duration-200 ${
        isDragging ? 'z-50' : 'z-10'
      }`}
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${getRotation()}deg)`,
        opacity: getOpacity(),
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className={`h-full rounded-3xl shadow-2xl overflow-hidden ${theme.background.secondary} ${theme.text.primary}`}>
        {/* Token Image */}
        <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          {token.logo ? (
            <img 
              src={token.logo} 
              alt={token.symbol}
              className="w-20 h-20 rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {token.symbol?.charAt(0) || '?'}
            </div>
          )}
        </div>

        {/* Token Info */}
        <div className="p-6">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold mb-2">{token.symbol}</h2>
            <p className={`text-lg ${theme.text.secondary}`}>{token.name}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={theme.text.secondary}>Balance:</span>
              <span className="font-semibold">
                {parseFloat(token.balance).toLocaleString()} {token.symbol}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className={theme.text.secondary}>Value:</span>
              <span className="font-semibold">${token.value.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className={theme.text.secondary}>Price:</span>
              <span className="font-semibold">${token.price?.toFixed(6) || 'N/A'}</span>
            </div>
          </div>

          {/* Swipe Instructions */}
          <div className="mt-6 text-center">
            <div className="flex justify-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-white text-xs">✕</span>
                </div>
                <span className={theme.text.secondary}>Sell All</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className={theme.text.secondary}>Keep</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SwipePage() {
  const { theme: systemTheme } = useSystemTheme();
  const account = useActiveAccount();
  const { 
    tokens, 
    loading, 
    error, 
    hasAttemptedFetch, 
    retry,
    invalidateCacheAndRefetch 
  } = useTokenBalances(account?.address);
  
  const {
    selectedTokens,
    processing,
    destinationToken,
    setDestinationToken,
    executeBatchSell,
    handleTokenSelect,
    tradeSummary,
    showTradeModal,
    closeTradeModal
  } = useBatchSelling(account, tokens);

  // Get the sendCalls function at component level
  const { mutate: sendCalls } = useSendCalls();

  // Create a direct sell function for individual tokens
  const sellSingleToken = async (token: any) => {
    // Skip USDC tokens
    if (token.symbol === "USDC" || token.symbol === "USDbC") {
      toast.warning("Cannot sell USDC tokens");
      return;
    }
    
    // Skip tokens with zero value
    if (token.value === 0) {
      toast.warning(`${token.symbol} has no value to sell`);
      return;
    }
    
    try {
      // Set selling state
      setSellingToken(token.address);
      
      // Get sell quote using Bridge
      const preparedQuote = await Bridge.Sell.prepare({
        originChainId: base.id,
        originTokenAddress: token.address,
        destinationChainId: base.id,
        destinationTokenAddress: USDC, // Sell to USDC
        amount: BigInt(token.balance),
        sender: account?.address!,
        receiver: account?.address!,
        client,
      });
      
      // Execute the sell transaction
      const calls: { to: string; data: string; value: string }[] = [];
      for (const step of preparedQuote.steps) {
        for (const transaction of step.transactions) {
          calls.push({
            to: transaction.to,
            data: transaction.data,
            value: transaction.value ? transaction.value.toString() : "0"
          });
        }
      }
      
      // Send the transaction
      await new Promise((resolve, reject) => {
        sendCalls({
          calls: calls.map(call =>
            prepareTransaction({
              client,
              chain: base,
              to: call.to as `0x${string}`,
              data: call.data as `0x${string}`,
              value: BigInt(call.value || "0"),
            })
          ),
        }, {
          onSuccess: () => resolve(undefined),
          onError: (error) => reject(error)
        });
      });
      
      toast.success(`Successfully sold ${token.symbol} for $${token.value.toFixed(2)}`);
      
      // Refresh token list
      invalidateCacheAndRefetch();
      
    } catch (error) {
      console.error('❌ Error selling token:', error);
      toast.error(`Failed to sell ${token.symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSellingToken(null);
    }
  };

  // Individual token selling state
  const [sellingToken, setSellingToken] = useState<string | null>(null);

  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);

  // Filter out native tokens and USDC
  const swipeableTokens = tokens.filter(token => 
    token.symbol !== "ETH" && 
    token.address !== NATIVE_TOKEN_ADDRESS &&
    token.symbol !== "USDC" &&
    token.symbol !== "USDbC"
  );
  


  const handleSwipeLeft = async () => {
    if (currentTokenIndex >= swipeableTokens.length) return;
    
    const currentToken = swipeableTokens[currentTokenIndex];
    
    // Skip USDC tokens
    if (currentToken.symbol === "USDC" || currentToken.symbol === "USDbC") {
      setCurrentTokenIndex(prev => prev + 1);
      return;
    }
    
    // Sell the token immediately
    setSellingToken(currentToken.address);
    
    try {
      // Use the custom sell function
      await sellSingleToken(currentToken);
      
      // Move to next token
      setCurrentTokenIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error selling token:', error);
    } finally {
      setSellingToken(null);
    }
  };

  const handleSwipeRight = () => {
    if (currentTokenIndex >= swipeableTokens.length) return;
    setCurrentTokenIndex(prev => prev + 1);
  };

  // Remove the batch sell function since we're selling individually now

  const handleReset = () => {
    setCurrentTokenIndex(0);
  };

  if (!account) {
    return (
      <main className={`min-h-screen flex items-center justify-center p-4 ${theme.background.primary}`}>
        <div className={`w-full max-w-md rounded-3xl shadow-lg p-6 ${theme.background.secondary} ${theme.text.primary}`}>
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
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={`min-h-screen flex items-center justify-center p-4 ${theme.background.primary}`}>
        <div className={`w-full max-w-md rounded-3xl shadow-lg p-6 ${theme.background.secondary} ${theme.text.primary}`}>
          <ErrorDisplay error={error} onRetry={retry} />
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className={`min-h-screen flex items-center justify-center p-4 ${theme.background.primary}`}>
        <div className={`w-full max-w-md rounded-3xl shadow-lg p-6 ${theme.background.secondary} ${theme.text.primary}`}>
          <LoadingSpinner message="Loading your tokens..." />
        </div>
      </main>
    );
  }

  if (swipeableTokens.length === 0 && hasAttemptedFetch) {
    return (
      <main className={`min-h-screen flex items-center justify-center p-4 ${theme.background.primary}`}>
        <div className={`w-full max-w-md rounded-3xl shadow-lg p-6 ${theme.background.secondary} ${theme.text.primary}`}>
          <EmptyState onRetry={retry} />
        </div>
      </main>
    );
  }

  const currentToken = swipeableTokens[currentTokenIndex];
  const isFinished = currentTokenIndex >= swipeableTokens.length;

  return (
    <main className={`min-h-screen ${theme.background.primary}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex justify-between items-center">
          <Link 
            href="/"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${theme.button.secondary}`}
          >
            ← Back
          </Link>
          <h1 className="text-xl font-bold">Swipe to Manage Tokens</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Card Container */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="relative w-full max-w-sm h-96">
          {isFinished ? (
            <div className={`h-full rounded-3xl shadow-2xl ${theme.background.secondary} ${theme.text.primary} flex items-center justify-center p-6`}>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">All Done!</h2>
                <p className={`mb-6 ${theme.text.secondary}`}>
                  You've reviewed all your tokens.
                </p>
                <button
                  onClick={handleReset}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${theme.button.secondary}`}
                >
                  Start Over
                </button>
              </div>
            </div>
          ) : currentToken ? (
            <TokenCard
              token={currentToken}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              isVisible={true}
            />
          ) : null}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/10 to-transparent">
        <div className="max-w-sm mx-auto space-y-4">
          {/* Progress */}
          <div className="flex justify-between text-sm">
            <span className={theme.text.secondary}>
              {currentTokenIndex + 1} of {swipeableTokens.length}
            </span>
            <span className={theme.text.secondary}>
              Swipe left to sell, right to keep
            </span>
          </div>

          {/* Individual selling status */}
          {sellingToken && (
            <div className={`w-full py-4 rounded-2xl font-semibold transition-colors relative ${theme.button.disabled}`}>
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Selling token...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trade Summary Modal */}
      {tradeSummary && (
        <TradeSummaryModal
          isOpen={showTradeModal}
          onClose={closeTradeModal}
          successfulTokens={tradeSummary.successfulTokens}
          failedTokens={tradeSummary.failedTokens}
          transactionHash={tradeSummary.transactionHash}
          destinationToken={destinationToken}
        />
      )}
    </main>
  );
} 