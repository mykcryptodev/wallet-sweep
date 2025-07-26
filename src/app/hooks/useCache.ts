import { useState, useCallback } from 'react';

interface CacheInvalidationResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const useCache = () => {
  const [invalidating, setInvalidating] = useState(false);

  const invalidateWalletCache = useCallback(async (walletAddress: string): Promise<CacheInvalidationResult> => {
    setInvalidating(true);
    
    try {
      const response = await fetch('/api/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'invalidateWallet',
          walletAddress,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to invalidate cache');
      }

      return {
        success: data.success,
        message: data.message,
      };
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to invalidate cache',
      };
    } finally {
      setInvalidating(false);
    }
  }, []);

  const checkCacheStatus = useCallback(async (walletAddress: string) => {
    try {
      const response = await fetch(`/api/cache?wallet=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to check cache status');
      }

      return await response.json();
    } catch (error) {
      console.error('Cache status check error:', error);
      return null;
    }
  }, []);

  const invalidatePattern = useCallback(async (pattern: string): Promise<CacheInvalidationResult> => {
    setInvalidating(true);
    
    try {
      const response = await fetch('/api/cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'invalidatePattern',
          pattern,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to invalidate cache pattern');
      }

      return {
        success: data.success,
        message: data.message,
      };
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to invalidate cache pattern',
      };
    } finally {
      setInvalidating(false);
    }
  }, []);

  return {
    invalidateWalletCache,
    checkCacheStatus,
    invalidatePattern,
    invalidating,
  };
};