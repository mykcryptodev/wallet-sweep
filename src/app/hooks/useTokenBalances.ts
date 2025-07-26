import { useState, useEffect, useCallback } from "react";
import { ProcessedToken, ApiResponse } from "../types/token";

export const useTokenBalances = (accountAddress: string | undefined) => {
  const [tokens, setTokens] = useState<ProcessedToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [totalUsdValue, setTotalUsdValue] = useState(0);

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
      setError(error instanceof Error ? error.message : 'Failed to fetch token balances');
      setHasAttemptedFetch(true);
    } finally {
      setLoading(false);
    }
  }, [accountAddress, loading]);

  const retry = useCallback(() => {
    setHasAttemptedFetch(false);
    setError(null);
    fetchTokenBalances();
  }, [fetchTokenBalances]);

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
    loading,
    error,
    hasAttemptedFetch,
    totalUsdValue,
    retry,
    refetch: fetchTokenBalances
  };
}; 