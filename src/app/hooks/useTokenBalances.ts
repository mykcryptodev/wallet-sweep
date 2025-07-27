import { useState, useEffect, useCallback } from "react";
import { ProcessedToken, ApiResponse } from "../types/token";
import { useCache } from "./useCache";
import { toast } from "react-toastify";

export const useTokenBalances = (accountAddress: string | undefined) => {
  const [tokens, setTokens] = useState<ProcessedToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [totalUsdValue, setTotalUsdValue] = useState(0);
  
  // Cache utilities
  const { invalidateWalletCache, invalidating } = useCache();

  const fetchTokenBalances = useCallback(async () => {
    if (!accountAddress || loading) return;
    
    console.log('Fetching tokens for:', accountAddress);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tokens/${accountAddress}`);
      
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch token balances';
      setError(errorMessage);
      setHasAttemptedFetch(true);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [accountAddress, loading]);

  const retry = useCallback(() => {
    setHasAttemptedFetch(false);
    setError(null);
    fetchTokenBalances();
  }, [fetchTokenBalances]);

  // Function to invalidate cache and refetch tokens
  const invalidateCacheAndRefetch = useCallback(async () => {
    if (!accountAddress) return;
    
    try {
      console.log('Invalidating cache for wallet:', accountAddress);
      const result = await invalidateWalletCache(accountAddress);
      
      if (result.success) {
        console.log('Cache invalidated successfully, refetching tokens');
        await fetchTokenBalances();
      } else {
        console.error('Failed to invalidate cache:', result.error);
      }
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }, [accountAddress, invalidateWalletCache, fetchTokenBalances]);

  useEffect(() => {
    if (accountAddress && !hasAttemptedFetch) {
      fetchTokenBalances();
    } else if (!accountAddress) {
      setTokens([]);
      setError(null);
      setHasAttemptedFetch(false);
      setTotalUsdValue(0);
    }
  }, [accountAddress, fetchTokenBalances, hasAttemptedFetch]);

  return {
    tokens,
    loading: loading || invalidating,
    error,
    hasAttemptedFetch,
    totalUsdValue,
    retry,
    refetch: fetchTokenBalances,
    invalidateCacheAndRefetch,
  };
}; 