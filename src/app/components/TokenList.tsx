"use client";

import { useActiveAccount } from "thirdweb/react";
import { useTokenBalances } from "../hooks/useTokenBalances";
import { useBatchSelling } from "../hooks/useBatchSelling";
import { TokenDisplay } from "./TokenDisplay";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { ErrorDisplay } from "./ui/ErrorDisplay";
import { EmptyState } from "./ui/EmptyState";

export default function TokenList() {
  const account = useActiveAccount();
  const { tokens, loading, error, hasAttemptedFetch, totalUsdValue, retry, refetch } = useTokenBalances(account?.address);
  const {
    selectedTokens,
    preparing,
    executing,
    batchCalls,
    tokensToSell,
    receipt,
    prepareBatchSell,
    executeBatchTransaction,
    handleTokenSelect,
    calculateTotalValue,
    resetBatch
  } = useBatchSelling(account, tokens);

  const handleTransactionSuccess = () => {
    refetch();
  };

  if (!account) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Connect your wallet to see your tokens</p>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={retry} />;
  }

  return (
    <div>
      {/* Tokens Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-black">Tokens</h2>
        {totalUsdValue > 0 && (
          <p className="text-sm text-gray-600">
            Total: <span className="font-medium">${totalUsdValue.toFixed(2)}</span>
          </p>
        )}
      </div>
      
      {/* Token List */}
      <div className="space-y-3 mb-6 max-h-80 overflow-y-auto">
        {loading ? (
          <LoadingSpinner message="Loading tokens..." />
        ) : tokens.length === 0 && hasAttemptedFetch ? (
          <EmptyState onRetry={retry} />
        ) : (
          tokens.map((token) => (
            <TokenDisplay
              key={token.address}
              token={token}
              isSelected={selectedTokens.has(token.address)}
              onSelect={() => handleTokenSelect(token.address)}
            />
          ))
        )}
      </div>

      {/* Sell Buttons */}
      {batchCalls.length === 0 ? (
        <button
          onClick={prepareBatchSell}
          disabled={selectedTokens.size === 0 || preparing}
          className={`w-full py-4 rounded-2xl font-semibold text-white transition-colors relative ${
            selectedTokens.size === 0 || preparing
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {preparing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Preparing batch...
            </div>
          ) : selectedTokens.size === 0 ? (
            "Select tokens to sell"
          ) : (
            `Prepare Sell ${selectedTokens.size} Token${selectedTokens.size > 1 ? 's' : ''} for $${calculateTotalValue().toFixed(2)}`
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 text-center">
            Ready to sell {tokensToSell.length} tokens in 1 batch transaction ({batchCalls.length} calls)
          </div>
          
          {receipt && (
            <div className="text-sm text-green-600 text-center bg-green-50 p-2 rounded-lg">
              Transaction confirmed! Hash: {receipt.receipts?.[0]?.transactionHash?.slice(0, 10)}...
            </div>
          )}
          
          <button
            onClick={() => executeBatchTransaction(handleTransactionSuccess)}
            disabled={executing}
            className={`w-full py-4 rounded-2xl font-semibold text-white transition-colors ${
              executing
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {executing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {receipt ? "Confirming transaction..." : "Executing batch..."}
              </div>
            ) : (
              `Execute Batch Sell (${batchCalls.length} calls in 1 transaction)`
            )}
          </button>
          
          <button
            onClick={resetBatch}
            className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel and prepare again
          </button>
        </div>
      )}
    </div>
  );
} 