"use client";

import { useState, useEffect } from 'react';
import { useCache } from '../hooks/useCache';

interface CacheStatusProps {
  walletAddress?: string;
}

interface CacheStatusData {
  wallet: string;
  cacheKey: string;
  exists: boolean;
  ttl: number | null;
  ttlReadable: string | null;
}

export function CacheStatus({ walletAddress }: CacheStatusProps) {
  const [status, setStatus] = useState<CacheStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { invalidateWalletCache, invalidating } = useCache();

  const checkCacheStatus = async () => {
    if (!walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/cache?wallet=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to check cache status');
      }
      
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error checking cache status:', error);
      setError(error instanceof Error ? error.message : 'Failed to check cache status');
    } finally {
      setLoading(false);
    }
  };

  const handleInvalidateCache = async () => {
    if (!walletAddress) return;
    
    try {
      const result = await invalidateWalletCache(walletAddress);
      if (result.success) {
        // Refresh status after invalidation
        await checkCacheStatus();
      } else {
        setError(result.error || 'Failed to invalidate cache');
      }
    } catch (error) {
      console.error('Error invalidating cache:', error);
      setError('Failed to invalidate cache');
    }
  };

  useEffect(() => {
    if (walletAddress) {
      checkCacheStatus();
    }
  }, [walletAddress]);

  if (!walletAddress) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Cache Status:</span>
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          ) : status ? (
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${status.exists ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {status.exists ? 'Cached' : 'Not cached'}
                {status.ttlReadable && status.exists && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({status.ttlReadable})
                  </span>
                )}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Unknown</span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={checkCacheStatus}
            disabled={loading}
            className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            onClick={handleInvalidateCache}
            disabled={invalidating || !status?.exists}
            className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors disabled:opacity-50"
          >
            {invalidating ? 'Invalidating...' : 'Clear Cache'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
} 