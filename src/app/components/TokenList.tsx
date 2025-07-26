"use client";

import { useState, useEffect, useCallback } from "react";
import { useActiveAccount, TransactionButton } from "thirdweb/react";
import { defineChain, getContract, NATIVE_TOKEN_ADDRESS, prepareTransaction, sendBatchTransaction } from "thirdweb";
import { client } from "../client";
import { Bridge } from "thirdweb";
import { approve } from "thirdweb/extensions/erc20";
import { TokenProvider, TokenIcon, TokenSymbol } from "thirdweb/react";

// Define Base mainnet chain
const baseMainnet = defineChain(8453);

// USDC contract address on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

interface ProcessedToken {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  logo: string;
  value: number;
  chainId: number;
  priceUsd: number;
  balanceFormatted: number;
}

interface ApiResponse {
  success: boolean;
  address: string;
  chainId: number;
  tokens: ProcessedToken[];
  totalUsdValue: number;
  timestamp: string;
  error?: string;
}

// Component to render token with hybrid logo approach
function TokenDisplay({ 
  token, 
  isSelected, 
  onSelect 
}: { 
  token: ProcessedToken; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  const [logoFailed, setLogoFailed] = useState(false);

  // Custom icon resolver function
  const customIconResolver = async (): Promise<string> => {
    // Hardcode ETH icon first
    if (token.address === "ETH" || token.symbol === "ETH") {
      return "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png";
    }

    // Then try our server-provided logo (already validated with TrustWallet)
    if (token.logo && token.logo.trim() !== "") {
      return token.logo;
    }

    // Try known token icons for popular tokens
    const knownIcons: { [key: string]: string } = {
      'WETH': 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png',
      'USDC': 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
      'USDbC': 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
      'DAI': 'https://assets.coingecko.com/coins/images/9956/thumb/4943.png',
      'USDT': 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png',
      'AERO': 'https://assets.coingecko.com/coins/images/31745/thumb/token.png',
    };

    if (knownIcons[token.symbol]) {
      return knownIcons[token.symbol];
    }

    // Generate a generic avatar with token symbol
    const firstLetter = token.symbol.charAt(0).toUpperCase();
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const colorIndex = token.symbol.charCodeAt(0) % colors.length;
    const color = colors[colorIndex];
    
    // Create SVG as data URL
    const svg = `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="${color}"/>
      <text x="16" y="21" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${firstLetter}</text>
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  // Use TokenProvider for ETH (now handled in customIconResolver) or when image fails
  const shouldUseTokenProvider = token.address === "ETH" || logoFailed;
  const tokenAddress = token.address === "ETH" ? NATIVE_TOKEN_ADDRESS : token.address;

  if (shouldUseTokenProvider) {
    return (
      <TokenProvider address={tokenAddress} chain={baseMainnet} client={client}>
        <div
          className={`flex items-center p-3 rounded-xl border-2 transition-colors cursor-pointer ${
            isSelected
              ? "bg-blue-50 border-blue-300"
              : "bg-gray-50 border-gray-200 hover:border-gray-300"
          }`}
          onClick={onSelect}
        >
          {/* Checkbox */}
          <div className="flex-shrink-0 mr-3">
            <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
              isSelected 
                ? "border-blue-500 bg-blue-500" 
                : "border-gray-400"
            }`}>
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>

          {/* Token Info with TokenProvider components */}
          <div className="flex-grow flex items-center">
            <div className="w-8 h-8 mr-3">
              <TokenIcon 
                className="w-8 h-8 rounded-full" 
                iconResolver={customIconResolver}
              />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <span className="font-medium text-black">
                  <TokenSymbol />
                </span>
                <span className="font-medium text-black">
                  ${token.value > 0 ? token.value.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {token.balanceFormatted.toFixed(6)} <TokenSymbol />
              </div>
            </div>
          </div>
        </div>
      </TokenProvider>
    );
  }

  // Use our API-provided logo first
  return (
    <div
      className={`flex items-center p-3 rounded-xl border-2 transition-colors cursor-pointer ${
        isSelected
          ? "bg-blue-50 border-blue-300"
          : "bg-gray-50 border-gray-200 hover:border-gray-300"
      }`}
      onClick={onSelect}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0 mr-3">
        <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
          isSelected 
            ? "border-blue-500 bg-blue-500" 
            : "border-gray-400"
        }`}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>

      {/* Token Info with our API data */}
      <div className="flex-grow flex items-center">
        <img 
          src={token.logo} 
          alt={token.symbol}
          className="w-8 h-8 rounded-full mr-3"
          onError={() => setLogoFailed(true)}
        />
        <div className="flex-grow">
          <div className="flex justify-between items-center">
            <span className="font-medium text-black">{token.symbol}</span>
            <span className="font-medium text-black">
              ${token.value > 0 ? token.value.toFixed(2) : '0.00'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {token.balanceFormatted.toFixed(6)} {token.symbol}
          </div>
        </div>
      </div>
    </div>
  );
}

interface Call {
  to: string;
  data: string;
  value?: string;
}

export default function TokenList() {
  const account = useActiveAccount();
  const [tokens, setTokens] = useState<ProcessedToken[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [totalUsdValue, setTotalUsdValue] = useState(0);
  const [batchCalls, setBatchCalls] = useState<Call[]>([]);
  const [tokensToSell, setTokensToSell] = useState<ProcessedToken[]>([]);
  
  // Convert Bridge.Sell calls to encoded transaction format
  const encodeBatchCalls = (calls: Call[]) => {
    return calls.map(call => ({
      to: call.to,
      data: call.data,
      value: call.value || "0"
    }));
  };

  // Handle batch transaction execution manually
  const handleBatchTransaction = async () => {
    if (!account || batchCalls.length === 0) return;

    setExecuting(true);

    try {
      const encodedCalls = encodeBatchCalls(batchCalls);
      console.log("Executing batch with calls:", encodedCalls);

      const preparedTransactions = encodedCalls.map(call =>
        prepareTransaction({
          client,
          chain: baseMainnet,
          to: call.to as `0x${string}`,
          data: call.data as `0x${string}`,
          value: BigInt(call.value),
        })
      );

      const result = await sendBatchTransaction({
        account,
        transactions: preparedTransactions,
      });

      console.log("Batch transaction sent:", result);
      alert(`Successfully sold ${tokensToSell.length} tokens to USDC! 🎉`);

      // Reset state
      setSelectedTokens(new Set());
      setBatchCalls([]);
      setTokensToSell([]);

      // Refresh balances
      setHasAttemptedFetch(false);
      fetchTokenBalances();

    } catch (error) {
      console.error("Batch transaction failed:", error);
      alert(`Error executing batch transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExecuting(false);
    }
  };

  const fetchTokenBalances = useCallback(async () => {
    if (!account?.address || loading) return;
    
    console.log('Fetching tokens for:', account.address);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tokens/${account.address}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tokens');
      }

      const data: ApiResponse = await response.json();
      console.log('API Response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      }

      setTokens(data.tokens || []);
      setTotalUsdValue(data.totalUsdValue || 0);
      setHasAttemptedFetch(true);
      
    } catch (error) {
      console.error("Error fetching token balances:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch token balances');
      setHasAttemptedFetch(true);
    } finally {
      setLoading(false);
    }
  }, [account?.address, loading]);

  useEffect(() => {
    if (account?.address && !hasAttemptedFetch) {
      fetchTokenBalances();
    } else if (!account?.address) {
      setTokens([]);
      setSelectedTokens(new Set());
      setError(null);
      setHasAttemptedFetch(false);
      setTotalUsdValue(0);
    }
  }, [account?.address, fetchTokenBalances, hasAttemptedFetch]);

  const handleTokenSelect = (tokenAddress: string) => {
    const newSelected = new Set(selectedTokens);
    if (newSelected.has(tokenAddress)) {
      newSelected.delete(tokenAddress);
    } else {
      newSelected.add(tokenAddress);
    }
    setSelectedTokens(newSelected);
  };

  const calculateTotalValue = () => {
    return tokens
      .filter(token => selectedTokens.has(token.address))
      .reduce((sum, token) => sum + token.value, 0);
  };

  const getSellQuote = async (fromToken: ProcessedToken, toToken: string = USDC_ADDRESS) => {
    try {
      const originTokenAddress = fromToken.address === "ETH" ? NATIVE_TOKEN_ADDRESS : fromToken.address;
      
      // Use Bridge.Sell.prepare to prepare the sell transaction
      const preparedQuote = await Bridge.Sell.prepare({
        originChainId: baseMainnet.id,
        originTokenAddress,
        destinationChainId: baseMainnet.id, // Same chain for Base -> Base
        destinationTokenAddress: toToken,
        amount: BigInt(fromToken.balance), // Use the wei amount from our API
        sender: account?.address!,
        receiver: account?.address!, // Same wallet receives USDC
        client,
      });
      
      return preparedQuote;
    } catch (error) {
      console.error("Error getting sell quote:", error);
      return null;
    }
  };

  const prepareBatchSell = async () => {
    if (!account) return;
    
    setPreparing(true);
    const selectedTokensList = tokens.filter(token => selectedTokens.has(token.address));
    const tokensToSellList = selectedTokensList.filter(token => 
      token.symbol !== "USDC" && token.symbol !== "USDbC"
    );

    if (tokensToSellList.length === 0) {
      alert("No tokens to sell - all selected tokens are already USDC!");
      setPreparing(false);
      return;
    }

    try {
      console.log(`Preparing to sell ${tokensToSellList.length} tokens in a single batch transaction...`);
      
      // Step 1: Get all quotes first
      const quotesWithTokens = [];
      for (const token of tokensToSellList) {
        console.log(`Getting quote for ${token.symbol}...`);
        const quote = await getSellQuote(token);
        
        if (!quote) {
          throw new Error(`Failed to get sell quote for ${token.symbol}`);
        }
        
        quotesWithTokens.push({ token, quote });
      }

      // Step 2: Convert Bridge transactions to Calls[] format
      const calls: Call[] = [];

      for (const { token, quote } of quotesWithTokens) {
        console.log(`Processing ${token.symbol} sell quote with ${quote.steps.length} steps`);
        
        // Extract all transactions from all steps in the prepared quote
        for (const step of quote.steps) {
          for (const transaction of step.transactions) {
            // Convert to Call format for TransactionButton
            const call: Call = {
              to: transaction.to,
              data: transaction.data,
              value: transaction.value ? transaction.value.toString() : "0"
            };

            calls.push(call);
            console.log(`Added ${transaction.action} call for ${token.symbol}`);
          }
        }
      }

      console.log(`Prepared ${calls.length} total calls (approvals + swaps) for batching`);

      // Store the prepared calls and tokens info for TransactionButton
      setBatchCalls(calls);
      setTokensToSell(tokensToSellList);
      
    } catch (error) {
      console.error("Error preparing batch sell:", error);
      alert(`Error preparing batch sell: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPreparing(false);
    }
  };

  const handleRetry = () => {
    setHasAttemptedFetch(false);
    setError(null);
    fetchTokenBalances();
  };

  if (!account) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Connect your wallet to see your tokens</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="font-medium">Error loading tokens</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
        <button 
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
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
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading tokens...</p>
          </div>
        ) : tokens.length === 0 && hasAttemptedFetch ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No tokens found in your wallet</p>
            <p className="text-sm text-gray-500 mt-1">Make sure you're connected to Base mainnet</p>
            <button 
              onClick={handleRetry}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Refresh
            </button>
          </div>
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
        // Step 1: Prepare batch button
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
        // Step 2: Execute all calls in a single multicall transaction
        <div className="space-y-3">
          <div className="text-sm text-gray-600 text-center">
            Ready to sell {tokensToSell.length} tokens in 1 batch transaction ({batchCalls.length} calls)
          </div>
          
          <button
            onClick={handleBatchTransaction}
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
                Executing batch...
              </div>
            ) : (
              `Execute Batch Sell (${batchCalls.length} calls in 1 transaction)`
            )}
          </button>
          
          <button
            onClick={() => {
              setBatchCalls([]);
              setTokensToSell([]);
            }}
            className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel and prepare again
          </button>
        </div>
      )}
    </div>
  );
} 