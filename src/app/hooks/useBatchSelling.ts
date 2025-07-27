import { useState } from "react";
import { NATIVE_TOKEN_ADDRESS, prepareTransaction } from "thirdweb";
import { useSendCalls, useWaitForCallsReceipt } from "thirdweb/react";
import { client } from "../client";
import { Bridge } from "thirdweb";
import { base } from "thirdweb/chains";
import { ProcessedToken, Call } from "../types/token";
import { useCache } from "./useCache";
import { toast } from "react-toastify";

// USDC contract address on Base
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export const useBatchSelling = (account: any, tokens: ProcessedToken[]) => {
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [destinationToken, setDestinationToken] = useState<string>(USDC_ADDRESS);
  
  // Cache utilities
  const { invalidateWalletCache } = useCache();

  // Use thirdweb's useSendCalls hook for EIP-5792 batch transactions
  const { mutate: sendCalls, isPending: executing, data: sendCallsData } = useSendCalls();
  
  // Wait for the calls receipt to get transaction status
  const { data: receipt, isLoading: isConfirming } = useWaitForCallsReceipt(sendCallsData);

  const getSellQuote = async (fromToken: ProcessedToken, toToken: string = destinationToken) => {
    try {
      const originTokenAddress = fromToken.address;
      const destinationTokenAddress = toToken === "ETH" ? NATIVE_TOKEN_ADDRESS : toToken;
      
      const preparedQuote = await Bridge.Sell.prepare({
        originChainId: base.id,
        originTokenAddress,
        destinationChainId: base.id,
        destinationTokenAddress,
        amount: BigInt(fromToken.balance),
        sender: account?.address!,
        receiver: account?.address!,
        client,
      });
      
      return preparedQuote;
    } catch (error) {
      console.error("Error getting sell quote:", error);
      return null;
    }
  };

  const executeBatchSell = async (onSuccess: () => void) => {
    if (!account) return;
    
    setProcessing(true);
    const selectedTokensList = tokens.filter(token => selectedTokens.has(token.address));
    const tokensToSell = selectedTokensList.filter(token => 
      token.symbol !== "USDC" && token.symbol !== "USDbC"
    );

    if (tokensToSell.length === 0) {
      toast.warning("No tokens to sell - all selected tokens are already USDC!");
      setProcessing(false);
      return;
    }

    try {
      console.log(`Preparing to sell ${tokensToSell.length} tokens in a single batch transaction...`);
      
      const quotesWithTokens = [];
      for (const token of tokensToSell) {
        console.log(`Getting quote for ${token.symbol}...`);
        const quote = await getSellQuote(token);
        
        if (!quote) {
          throw new Error(`Failed to get sell quote for ${token.symbol}`);
        }
        
        quotesWithTokens.push({ token, quote });
      }

      const calls: Call[] = [];

      for (const { token, quote } of quotesWithTokens) {
        console.log(`Processing ${token.symbol} sell quote with ${quote.steps.length} steps`);
        
        for (const step of quote.steps) {
          for (const transaction of step.transactions) {
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

      // Prepare the calls for useSendCalls
      const preparedCalls = calls.map(call =>
        prepareTransaction({
          client,
          chain: base,
          to: call.to as `0x${string}`,
          data: call.data as `0x${string}`,
          value: BigInt(call.value || "0"),
        })
      );

      console.log("Executing batch with calls using useSendCalls:", preparedCalls);

      // Use the useSendCalls hook to execute all calls in a single transaction
      sendCalls({
        calls: preparedCalls,
      }, {
        onSuccess: async (data) => {
          console.log("Batch transaction sent successfully:", data);
          toast.success(`Successfully initiated batch sell for ${tokensToSell.length} tokens! 🎉`);
          
          // Invalidate cache after successful sell
          try {
            console.log('Invalidating cache after successful sell for wallet:', account.address);
            const result = await invalidateWalletCache(account.address);
            if (result.success) {
              console.log('Cache invalidated successfully after sell');
            } else {
              console.error('Failed to invalidate cache after sell:', result.error);
            }
          } catch (error) {
            console.error('Error invalidating cache after sell:', error);
          }
          
          // Reset state
          setSelectedTokens(new Set());
          
          onSuccess();
        },
        onError: (error) => {
          console.error("Batch transaction failed:", error);
          toast.error(`Error executing batch transaction: ${error.message}`);
        }
      });

    } catch (error) {
      console.error("Error preparing batch transaction:", error);
      toast.error(`Error preparing batch transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

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

  return {
    selectedTokens,
    processing: processing || executing || isConfirming,
    receipt,
    destinationToken,
    setDestinationToken,
    executeBatchSell,
    handleTokenSelect,
    calculateTotalValue
  };
}; 