import { useState, useEffect, useCallback, useRef } from "react";
import { ProcessedToken, ApiResponse } from "../types/token";
import { useCache } from "./useCache";
import { toast } from "react-toastify";

export const useTokenBalances = (accountAddress: string | undefined) => {
  const [tokens, setTokens] = useState<ProcessedToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [totalUsdValue, setTotalUsdValue] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState<number | undefined>(undefined);
  
  // Cache utilities
  const { invalidateWalletCache, invalidating } = useCache();
  
  // Debounce ref to prevent rapid successive calls
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTokenBalances = useCallback(async (page = 0, append = false) => {
    if (!accountAddress || (loading && !append) || (loadingMore && append)) return;
    
    // Clear any existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce API calls to prevent rate limiting
    return new Promise<void>((resolve, reject) => {
      debounceRef.current = setTimeout(async () => {
        try {
          console.log('Fetching tokens for:', accountAddress, 'page:', page, 'append:', append);
          
          if (append) {
            setLoadingMore(true);
          } else {
            setLoading(true);
          }
          setError(null);

          const params = new URLSearchParams();
          if (page > 0) {
            params.append('page', page.toString());
          }
          // Add minimum balance threshold to filter out dust (1 cent minimum)
          params.append('minBalanceUSD', '0.01');

          const response = await fetch(`/api/tokens/${accountAddress}?${params.toString()}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch tokens');
          }

          const data: ApiResponse = await response.json();
          console.log('API Response:', data);
          
          if (!data.success) {
            throw new Error(data.error || 'API returned unsuccessful response');
          }

          if (append) {
            // Append new tokens to existing ones
            setTokens(prevTokens => [...prevTokens, ...(data.tokens || [])]);
          } else {
            // Replace tokens with new data
            setTokens(data.tokens || []);
          }
          
          setTotalUsdValue(data.totalUsdValue || 0);
          setHasMore(data.hasMore || false);
          setNextPage(data.nextPage);
          setHasAttemptedFetch(true);
          
          resolve();
        } catch (error) {
          console.error("Error fetching token balances:", error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch token balances';
          setError(errorMessage);
          setHasAttemptedFetch(true);
          toast.error(errorMessage);
          reject(error);
        } finally {
          if (append) {
            setLoadingMore(false);
          } else {
            setLoading(false);
          }
        }
      }, 200); // 200ms debounce delay
    });
  }, [accountAddress, loading, loadingMore]);

  const loadMore = useCallback(async () => {
    if (hasMore && nextPage !== undefined && !loadingMore) {
      await fetchTokenBalances(nextPage, true);
    }
  }, [hasMore, nextPage, loadingMore, fetchTokenBalances]);

  const retry = useCallback(() => {
    setHasAttemptedFetch(false);
    setError(null);
    setTokens([]);
    setHasMore(false);
    setNextPage(undefined);
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
        setTokens([]);
        setHasMore(false);
        setNextPage(undefined);
        await fetchTokenBalances();
      } else {
        console.error('Failed to invalidate cache:', result.error);
      }
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }, [accountAddress, invalidateWalletCache, fetchTokenBalances]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (accountAddress && !hasAttemptedFetch) {
      fetchTokenBalances();
    } else if (!accountAddress) {
      setTokens([]);
      setError(null);
      setHasAttemptedFetch(false);
      setTotalUsdValue(0);
      setHasMore(false);
      setNextPage(undefined);
    }
  }, [accountAddress, fetchTokenBalances, hasAttemptedFetch]);

  return {
    tokens,
    loading: loading || invalidating,
    loadingMore,
    error,
    hasAttemptedFetch,
    totalUsdValue,
    hasMore,
    loadMore,
    retry,
    refetch: fetchTokenBalances,
    invalidateCacheAndRefetch,
  };
}; 