import { useState, useEffect } from 'react';

interface TokenMarketData {
  tokenAddress: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  totalLiquidity: number;
  priceHistory: Array<{
    timestamp: number;
    price: number;
  }>;
  supply: {
    total: string;
    circulating: string;
  };
  holders: number;
}

export function useTokenMarketData(tokenAddress: string | null) {
  const [data, setData] = useState<TokenMarketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) {
      setData(null);
      return;
    }

    const fetchMarketData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/token-market-data?tokenAddress=${tokenAddress}&network=BASE_MAINNET`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to fetch market data');
        }
      } catch (err) {
        console.error('Error fetching token market data:', err);
        setError('Failed to fetch market data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [tokenAddress]);

  return { data, loading, error };
}