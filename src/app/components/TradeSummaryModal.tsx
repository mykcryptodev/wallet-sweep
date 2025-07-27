"use client";

import { useEffect, useState } from "react";
import { theme } from "../lib/theme";
import { ProcessedToken } from "../types/token";

interface TradeSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  successfulTokens: ProcessedToken[];
  failedTokens: ProcessedToken[];
  transactionHash?: string;
  destinationToken: string;
}

export default function TradeSummaryModal({
  isOpen,
  onClose,
  successfulTokens,
  failedTokens,
  transactionHash,
  destinationToken
}: TradeSummaryModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const getDestinationTokenSymbol = () => {
    return destinationToken === "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" ? "USDC" : "ETH";
  };

  const totalValue = successfulTokens.reduce((sum, token) => sum + token.value, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-md mx-4 mb-4 rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        } ${theme.background.secondary} ${theme.text.primary}`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 rounded-full bg-gray-400"></div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Trade Successful!</h2>
            <p className={`text-sm ${theme.text.secondary}`}>
              Successfully sold {successfulTokens.length} token{successfulTokens.length !== 1 ? 's' : ''} for {getDestinationTokenSymbol()}
            </p>
          </div>

          {/* Summary Stats */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Value</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">${totalValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Destination</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{getDestinationTokenSymbol()}</span>
            </div>
          </div>

          {/* Successful Tokens */}
          {successfulTokens.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 text-green-700 dark:text-green-400">Successfully Sold</h3>
              <div className="space-y-2">
                {successfulTokens.map((token) => (
                  <div key={token.address} className="flex justify-between items-center p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{token.symbol}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">${token.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed Tokens */}
          {failedTokens.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 text-orange-700 dark:text-orange-400">Failed to Quote</h3>
              <div className="space-y-2">
                {failedTokens.map((token) => (
                  <div key={token.address} className="flex justify-between items-center p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{token.symbol}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">${token.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction Link */}
          {transactionHash && (
            <div className="mb-6">
              <a
                href={`https://basescan.org/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full py-3 px-4 rounded-xl text-center font-medium transition-colors ${theme.button.secondary}`}
              >
                View Transaction
              </a>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-medium transition-colors ${theme.button.primary}`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
} 