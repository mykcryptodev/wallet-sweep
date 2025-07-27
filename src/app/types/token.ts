export interface ProcessedToken {
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

export interface ApiResponse {
  success: boolean;
  address: string;
  chainId: number;
  tokens: ProcessedToken[];
  totalUsdValue: number;
  timestamp: string;
  hasMore: boolean;
  nextPage?: number;
  error?: string;
}

export interface Call {
  to: string;
  data: string;
  value?: string;
} 