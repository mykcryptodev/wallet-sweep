# Zapper XYZ Integration

This document outlines the integration of Zapper XYZ API for fetching comprehensive token balance data in the wallet-sweep application.

## Overview

Zapper XYZ provides a powerful GraphQL API that offers comprehensive portfolio data across 50+ chains. This integration replaces the previous thirdweb token fetching mechanism with a more robust and feature-rich solution.

## Advantages of Zapper XYZ

- **Comprehensive Data**: Access to token balances, DeFi positions, and NFTs across multiple chains
- **Real-time Pricing**: Up-to-date token prices and USD values
- **Rich Metadata**: Token images, names, symbols, and network information
- **GraphQL API**: Flexible querying with precise data selection
- **High Performance**: Optimized for fast portfolio queries

## Implementation Details

### API Configuration

The integration uses the following configuration:

- **API Endpoint**: `https://public.zapper.xyz/graphql`
- **Authentication**: `x-zapper-api-key` header
- **Environment Variable**: `ZAPPER_API_KEY`

### API Route Changes

The main token fetching logic is located in `src/app/api/tokens/[address]/route.ts`:

```typescript
const ZAPPER_API_URL = 'https://public.zapper.xyz/graphql';

// GraphQL query for portfolio data
const query = `
  query PortfolioV2($addresses: [Address!]!, $networks: [Network!]) {
    portfolioV2(addresses: $addresses, networks: $networks) {
      tokenBalances {
        byToken {
          edges {
            node {
              balance
              balanceRaw
              balanceUSD
              symbol
              name
              tokenAddress
              price
              imgUrlV2
              network {
                name
              }
            }
          }
        }
      }
    }
  }
`;

// Authentication header
headers: {
  'Content-Type': 'application/json',
  'x-zapper-api-key': process.env.ZAPPER_API_KEY!,
}
```

### Environment Variables

Add the following to your `.env.local` file:

```bash
ZAPPER_API_KEY=your_zapper_api_key_here
```

### API Key Setup

1. Visit [Zapper API Dashboard](https://protocol.zapper.xyz/docs/api/)
2. Sign up for an account
3. Generate an API key
4. Add the key to your environment variables

### Query Parameters

The API accepts the following parameters:

- `addresses`: Array of wallet addresses to query
- `networks`: Array of network identifiers (e.g., `['BASE_MAINNET']`)
- `minBalanceUSD`: Minimum USD value filter (default: 0.01 USD = 1 cent)

### Response Format

Zapper returns comprehensive token data including:

- `balance`: Human-readable balance
- `balanceRaw`: Raw balance as string
- `balanceUSD`: USD value of the token
- `symbol`: Token symbol
- `name`: Token name
- `tokenAddress`: Contract address
- `price`: Current token price
- `imgUrlV2`: Token image URL
- `network`: Network information

## Migration from Thirdweb

### What Changed

1. **API Endpoint**: Switched from thirdweb REST API to Zapper GraphQL API
2. **Authentication**: Changed from `x-client-id` to `x-zapper-api-key`
3. **Query Structure**: Implemented GraphQL queries instead of REST endpoints
4. **Data Processing**: Updated to handle Zapper's response format
5. **Error Handling**: Enhanced error handling for GraphQL-specific errors

### What Stayed the Same

1. **Response Format**: Maintained the same `ProcessedToken` interface for frontend compatibility
2. **Caching**: Redis caching system remains unchanged
3. **Pagination**: Simplified pagination (Zapper handles this internally)
4. **Frontend Integration**: No changes required to React components

### Fallback Mechanism

The implementation includes a fallback to thirdweb API if Zapper fails:

```typescript
try {
  // Try Zapper first
  processedTokens = await fetchTokensFromZapper(address, limit, 0.01); // 1 cent minimum
} catch (zapperError) {
  // Fallback to thirdweb
  processedTokens = await fetchTokensFromThirdweb(address, limit);
}
```

## Error Handling

The integration handles various error scenarios:

- **401 Unauthorized**: Invalid API key
- **429 Rate Limited**: Rate limit exceeded
- **GraphQL Errors**: Query syntax or validation errors
- **Network Errors**: Connection issues
- **Data Processing Errors**: Invalid response format

## Performance Considerations

### Caching Strategy

- **TTL**: 5 minutes for token balance data
- **Cache Keys**: Include wallet address, page, limit, and minBalanceUSD
- **Invalidation**: Automatic cache invalidation on data updates

### Rate Limiting

- Zapper API has rate limits based on your plan
- Implemented exponential backoff for retries
- Fallback to thirdweb API if rate limited

### Data Processing

- Efficient token filtering by USD value
- Optimized balance formatting
- Minimal data transformation for frontend compatibility

## Troubleshooting

### Common Issues

1. **"Missing API key"**: Ensure `ZAPPER_API_KEY` is set in environment variables
2. **"Unauthorized"**: Verify API key is valid and has proper permissions
3. **"GraphQL Errors"**: Check query syntax and variable types
4. **"Network not supported"**: Ensure using correct network identifier (e.g., `BASE_MAINNET`)

### Debug Steps

1. Check environment variables are loaded correctly
2. Verify API key has sufficient credits/permissions
3. Test GraphQL query in Zapper's API sandbox
4. Check network connectivity and firewall settings
5. Review server logs for detailed error messages

## Future Enhancements

### Potential Improvements

1. **Multi-chain Support**: Extend to support multiple networks
2. **DeFi Integration**: Include DeFi protocol positions
3. **NFT Support**: Add NFT balance fetching
4. **Real-time Updates**: Implement WebSocket connections
5. **Advanced Filtering**: Add more sophisticated token filtering options

### API Features to Explore

- Historical portfolio data
- Transaction history
- Token price charts
- DeFi protocol analytics
- Cross-chain portfolio aggregation

## Resources

- [Zapper API Documentation](https://protocol.zapper.xyz/docs/api/)
- [GraphQL Schema Explorer](https://public.zapper.xyz/graphql)
- [API Dashboard](https://protocol.zapper.xyz/docs/api/)
- [Pricing Information](https://protocol.zapper.xyz/docs/api/)

## Credits

This integration leverages Zapper's comprehensive portfolio API to provide users with detailed token balance information across the Base network. The implementation maintains backward compatibility while offering enhanced data quality and performance. 