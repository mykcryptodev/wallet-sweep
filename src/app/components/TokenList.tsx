"use client";

import { useActiveAccount } from "thirdweb/react";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { useBatchSelling } from "../hooks/useBatchSelling";
import { TokenDisplay } from "./TokenDisplay";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { ErrorDisplay } from "./ui/ErrorDisplay";
import { EmptyState } from "./ui/EmptyState";
import { useState, useEffect, useRef } from "react";
import { NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { theme } from "../lib/theme";

// USDC contract address on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export default function TokenList() {
  const account = useActiveAccount();
  const { 
    tokens, 
    loading, 
    error, 
    hasAttemptedFetch, 
    totalUsdValue, 
    retry,
    invalidateCacheAndRefetch 
  } = useTokenBalances(account?.address);
  const {
    selectedTokens,
    processing,
    receipt,
    destinationToken,
    setDestinationToken,
    executeBatchSell,
    handleTokenSelect,
    calculateTotalValue
  } = useBatchSelling(account, tokens);

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleTransactionSuccess = () => {
    // Use cache invalidation and refetch for better data consistency
    invalidateCacheAndRefetch();
  };

  const getDestinationTokenSymbol = () => {
    return destinationToken === USDC_ADDRESS ? "USDC" : "ETH";
  };

  const handleDestinationChange = (newDestination: string) => {
    setDestinationToken(newDestination);
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!account) {
    return (
      <div className="text-center py-8">
        <p className={theme.text.secondary}>
          Connect your wallet to see your tokens
        </p>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={retry} />;
  }

  return (
    <div>
      {/* Header with Destination Token Dropdown */}
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-semibold ${theme.text.primary}`}>
          Tokens
        </h2>
        <div className="flex items-center space-x-2">
          {totalUsdValue > 0 && (
            <p className={`text-sm ${theme.text.secondary}`}>
              Total: <span className="font-medium">${totalUsdValue.toFixed(2)}</span>
            </p>
          )}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center space-x-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${theme.button.secondary}`}
            >
              <span>Sell to {getDestinationTokenSymbol()}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown */}
            {showDropdown && (
              <div className={`absolute top-full right-0 mt-1 rounded-lg shadow-lg z-10 min-w-32 ${theme.dropdown.background} ${theme.dropdown.border}`} ref={dropdownRef}>
                <button
                  onClick={() => handleDestinationChange(USDC_ADDRESS)}
                  className={`w-full px-4 py-2 text-left transition-colors ${
                    destinationToken === USDC_ADDRESS 
                      ? theme.dropdown.item.selected
                      : theme.dropdown.item.unselected
                  }`}
                >
                  USDC
                </button>
                <button
                  onClick={() => handleDestinationChange("ETH")}
                  className={`w-full px-4 py-2 text-left transition-colors ${
                    destinationToken === "ETH" 
                      ? theme.dropdown.item.selected
                      : theme.dropdown.item.unselected
                  }`}
                >
                  ETH
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Token List */}
      <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
        {loading ? (
          <LoadingSpinner message="Loading tokens..." />
        ) : tokens.length === 0 && hasAttemptedFetch ? (
          <EmptyState onRetry={retry} />
        ) : (
          tokens
            .filter(token => token.symbol !== "ETH" && token.address !== NATIVE_TOKEN_ADDRESS)
            .map((token) => (
              <TokenDisplay
                key={token.address}
                token={token}
                isSelected={selectedTokens.has(token.address)}
                onSelect={() => handleTokenSelect(token.address)}
              />
            ))
        )}
      </div>

      {/* Success Message */}
      {receipt && (
        <div className={`text-sm text-center p-2 rounded-lg mb-3 ${theme.status.success}`}>
          Transaction confirmed! Hash: {receipt.receipts?.[0]?.transactionHash?.slice(0, 10)}...
        </div>
      )}

      {/* Sell Button */}
      <button
        onClick={() => executeBatchSell(handleTransactionSuccess)}
        disabled={selectedTokens.size === 0 || processing}
        className={`w-full py-4 rounded-2xl font-semibold transition-colors relative ${
          selectedTokens.size === 0 || processing
            ? theme.button.disabled
            : theme.button.primary
        }`}
      >
        {processing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            {receipt ? "Confirming transaction..." : "Preparing and executing batch..."}
          </div>
        ) : selectedTokens.size === 0 ? (
          "Select tokens to sell"
        ) : (
          `Sell ${selectedTokens.size} Token${selectedTokens.size > 1 ? 's' : ''} for $${calculateTotalValue().toFixed(2)}`
        )}
      </button>
    </div>
  );
} 