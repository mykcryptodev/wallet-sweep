"use client";

import { useState } from "react";
import { NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { base } from "thirdweb/chains";
import { client } from "../client";
import { TokenProvider, TokenIcon, TokenSymbol } from "thirdweb/react";
import { ProcessedToken } from "../types/token";
import { theme } from "../lib/theme";

interface TokenDisplayProps {
  token: ProcessedToken;
  isSelected: boolean;
  onSelect: () => void;
}

export const TokenDisplay = ({ token, isSelected, onSelect }: TokenDisplayProps) => {
  const [logoFailed, setLogoFailed] = useState(false);

  const customIconResolver = async (): Promise<string> => {
    if (token.address === "ETH" || token.symbol === "ETH") {
      return "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png";
    }

    if (token.logo && token.logo.trim() !== "") {
      return token.logo;
    }

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

    const firstLetter = token.symbol.charAt(0).toUpperCase();
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const colorIndex = token.symbol.charCodeAt(0) % colors.length;
    const color = colors[colorIndex];
    
    const svg = `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="${color}"/>
      <text x="16" y="21" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${firstLetter}</text>
    </svg>`;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const shouldUseTokenProvider = token.address === "ETH" || logoFailed;
  const tokenAddress = token.address === "ETH" ? NATIVE_TOKEN_ADDRESS : token.address;

  if (shouldUseTokenProvider) {
    return (
      <TokenProvider address={tokenAddress} chain={base} client={client}>
        <div
          className={`flex items-center p-3 rounded-xl border-2 transition-colors cursor-pointer ${
            isSelected
              ? theme.tokenCard.selected
              : theme.tokenCard.unselected
          }`}
          onClick={onSelect}
        >
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

          <div className="flex-grow flex items-center">
            <div className="w-8 h-8 mr-3">
              <TokenIcon 
                className="w-8 h-8 rounded-full" 
                iconResolver={customIconResolver}
              />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <span className={`font-medium ${theme.text.primary}`}>
                  <TokenSymbol />
                </span>
                <span className={`font-medium ${theme.text.primary}`}>
                  ${token.value > 0 ? token.value.toFixed(2) : '0.00'}
                </span>
              </div>
              <div className={`text-sm ${theme.text.secondary}`}>
                {token.balanceFormatted.toFixed(6)} <TokenSymbol />
              </div>
            </div>
          </div>
        </div>
      </TokenProvider>
    );
  }

  return (
    <div
      className={`flex items-center p-3 rounded-xl border-2 transition-colors cursor-pointer ${
        isSelected
          ? theme.tokenCard.selected
          : theme.tokenCard.unselected
      }`}
      onClick={onSelect}
    >
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

      <div className="flex-grow flex items-center">
        <img 
          src={token.logo} 
          alt={token.symbol}
          className="w-8 h-8 rounded-full mr-3"
          onError={() => setLogoFailed(true)}
        />
        <div className="flex-grow">
          <div className="flex justify-between items-center">
            <span className={`font-medium ${theme.text.primary}`}>{token.symbol}</span>
            <span className={`font-medium ${theme.text.primary}`}>
              ${token.value > 0 ? token.value.toFixed(2) : '0.00'}
            </span>
          </div>
          <div className={`text-sm ${theme.text.secondary}`}>
            {token.balanceFormatted.toFixed(6)} {token.symbol}
          </div>
        </div>
      </div>
    </div>
  );
}; 