"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "./client";
import { base } from "thirdweb/chains";
import { theme } from "./lib/theme";
import { useSystemTheme } from "./hooks/useSystemTheme";
import { useActiveAccount } from "thirdweb/react";
import { useTokenBalances } from "./hooks/useTokenBalances";
import { useBatchSelling } from "./hooks/useBatchSelling";
import { useState, useEffect, useRef } from "react";
import { NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { ErrorDisplay } from "./components/ui/ErrorDisplay";
import { EmptyState } from "./components/ui/EmptyState";
import TradeSummaryModal from "./components/TradeSummaryModal";
import { USDC } from "./constants";
import Link from "next/link";
import { toast } from "react-toastify";
import { useTokenMarketData } from "./hooks/useTokenMarketData";
import { PriceChart } from "./components/PriceChart";
import { toTokens } from "thirdweb";
import HamburgerNav from "./components/HamburgerNav";
import { useFarcaster } from "./providers/FarcasterProvider";

// Dynamic Background Component
function DynamicBackground({ token }: { token: any }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { theme: systemTheme } = useSystemTheme();
  const isDarkMode = systemTheme === 'dark';

  if (!token.logo || imageError) {
    return (
      <div className={`absolute inset-0 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-blue-900 to-purple-900' 
          : 'bg-gradient-to-br from-blue-500 to-purple-600'
      }`} />
    );
  }

  return (
    <>
      {/* Blurred background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${token.logo})`,
          filter: isDarkMode ? 'blur(20px) brightness(0.3)' : 'blur(20px) brightness(0.7)',
          transform: 'scale(1.2)',
        }}
      />
      
      {/* Overlay for better contrast */}
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/40' : 'bg-white/30'}`} />
      
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-black/20 via-transparent to-black/30' 
          : 'bg-gradient-to-br from-white/20 via-transparent to-white/30'
      }`} />
    </>
  );
}

interface TokenCardProps {
  token: any;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isVisible: boolean;
  isSelected: boolean;
}

function TokenCard({ token, onSwipeLeft, onSwipeRight, isVisible, isSelected }: TokenCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startTime, setStartTime] = useState(0);
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFadingIn, setIsFadingIn] = useState(true); // New state for fade-in animation
  const cardRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTouchTimeRef = useRef(0);
  
  // Fetch market data from Zapper
  const { data: marketData, loading: marketLoading } = useTokenMarketData(token.address);

  // Use Farcaster SDK haptic feedback
  const { triggerHaptic } = useFarcaster();

  // Calculate velocity
  const calculateVelocity = (currentPos: { x: number, y: number }, currentTime: number) => {
    const timeDiff = currentTime - startTime;
    if (timeDiff > 0) {
      return {
        x: (currentPos.x - startPos.x) / timeDiff,
        y: (currentPos.y - startPos.y) / timeDiff
      };
    }
    return { x: 0, y: 0 };
  };

  // Animate card back to center or off screen
  const animateCard = (targetX: number, targetY: number, duration: number = 300) => {
    setIsAnimating(true);
    const startX = dragOffset.x;
    const startY = dragOffset.y;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const newX = startX + (targetX - startX) * easeOut;
      const newY = startY + (targetY - startY) * easeOut;
      
      setDragOffset({ x: newX, y: newY });
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setDragOffset({ x: 0, y: 0 });
        setIsDragging(false);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    const currentTime = performance.now();
    
    setStartPos({ x: touch.clientX, y: touch.clientY });
    setStartTime(currentTime);
    lastTouchTimeRef.current = currentTime;
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isAnimating) return;
    e.preventDefault(); // Prevent scrolling
    
    const touch = e.touches[0];
    const currentTime = performance.now();
    const offsetX = touch.clientX - startPos.x;
    const offsetY = touch.clientY - startPos.y;
    
    // Only track horizontal movement, ignore vertical movement
    setDragOffset({ x: offsetX, y: 0 });
    
    // Calculate velocity only for horizontal movement
    const newVelocity = calculateVelocity({ x: touch.clientX, y: startPos.y }, currentTime);
    setVelocity({ x: newVelocity.x, y: 0 });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || isAnimating) return;
    e.preventDefault();
    
    const currentTime = performance.now();
    const finalVelocity = calculateVelocity(dragOffset, currentTime);
    
    // Dynamic threshold based on screen width and velocity
    const screenWidth = window.innerWidth;
    const baseThreshold = screenWidth * 0.25; // 25% of screen width
    const velocityThreshold = Math.abs(finalVelocity.x) * 0.5; // Velocity bonus
    const threshold = Math.max(baseThreshold - velocityThreshold, screenWidth * 0.15); // Min 15%
    
    // Determine swipe direction and trigger action
    if (dragOffset.x > threshold || finalVelocity.x > 0.8) {
      triggerHaptic();
      onSwipeRight();
      animateCard(screenWidth * 1.5, 0, 200);
    } else if (dragOffset.x < -threshold || finalVelocity.x < -0.8) {
      triggerHaptic();
      onSwipeLeft();
      animateCard(-screenWidth * 1.5, 0, 200);
    } else {
      // Snap back to center
      animateCard(0, 0, 300);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const currentTime = performance.now();
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartTime(currentTime);
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isAnimating) return;
    
    const currentTime = performance.now();
    const offsetX = e.clientX - startPos.x;
    const offsetY = e.clientY - startPos.y;
    
    // Only track horizontal movement, ignore vertical movement
    setDragOffset({ x: offsetX, y: 0 });
    
    // Calculate velocity only for horizontal movement
    const newVelocity = calculateVelocity({ x: e.clientX, y: startPos.y }, currentTime);
    setVelocity({ x: newVelocity.x, y: 0 });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || isAnimating) return;
    
    const currentTime = performance.now();
    const finalVelocity = calculateVelocity(dragOffset, currentTime);
    
    // Dynamic threshold for mouse
    const screenWidth = window.innerWidth;
    const baseThreshold = screenWidth * 0.2; // 20% of screen width for mouse
    const velocityThreshold = Math.abs(finalVelocity.x) * 0.3;
    const threshold = Math.max(baseThreshold - velocityThreshold, screenWidth * 0.1);
    
    if (dragOffset.x > threshold || finalVelocity.x > 0.5) {
      onSwipeRight();
      animateCard(screenWidth * 1.5, 0, 200);
    } else if (dragOffset.x < -threshold || finalVelocity.x < -0.5) {
      onSwipeLeft();
      animateCard(-screenWidth * 1.5, 0, 200);
    } else {
      animateCard(0, 0, 300);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging && !isAnimating) {
      animateCard(0, 0, 300);
    }
  };

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Reset state when component mounts (for new cards)
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setIsAnimating(false);
    setVelocity({ x: 0, y: 0 });
    setIsFadingIn(true); // Start fade-in animation
  }, [token.address]); // Reset when token changes

  const getRotation = () => {
    const rotation = (dragOffset.x / 20) * (dragOffset.x > 0 ? 1 : -1);
    return Math.max(-15, Math.min(15, rotation)); // Clamp rotation
  };

  const getOpacity = () => {
    const opacity = 1 - Math.abs(dragOffset.x) / (window.innerWidth * 0.8);
    return Math.max(0.3, Math.min(1, opacity)); // Clamp opacity
  };

  const getScale = () => {
    const scale = 1 - Math.abs(dragOffset.x) / (window.innerWidth * 2);
    return Math.max(0.8, Math.min(1, scale)); // Clamp scale
  };

  // Get swipe direction for visual feedback
  const getSwipeDirection = () => {
    if (Math.abs(dragOffset.x) < 50) return null;
    return dragOffset.x > 0 ? 'right' : 'left';
  };

  // Get visual feedback opacity
  const getFeedbackOpacity = () => {
    const opacity = Math.abs(dragOffset.x) / (window.innerWidth * 0.4);
    return Math.min(0.8, opacity);
  };

  // Get fade-in opacity for smooth card appearance
  const getFadeInOpacity = () => {
    if (!isFadingIn) return 1;
    // Start with higher opacity for more visible animation
    return 0.4; // Start at 40% opacity for smoother fade-in
  };

  // Get scale for fade-in animation
  const getFadeInScale = () => {
    if (!isFadingIn) return 1;
    // Start small and scale up to full size
    return 0.75; // Start at 75% scale for smoother scale-up
  };

  // Animate fade-in with easing
  useEffect(() => {
    if (isFadingIn) {
      const fadeInAnimation = () => {
        setIsFadingIn(false);
      };
      
      // Start the fade-in animation immediately for seamless transition
      const timer = setTimeout(fadeInAnimation, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isFadingIn]);

  // Format number with abbreviations
  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num === 0) return '0';
    if (num < 1000) return num.toFixed(decimals);
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    return (num / 1000000000).toFixed(1) + 'B';
  };

  // Format market cap
  const formatMarketCap = (marketCap: number): string => {
    if (marketCap === 0) return 'N/A';
    return '$' + formatNumber(marketCap, 0);
  };

  // Format token balance with proper decimals and abbreviations
  const formatTokenBalance = (balanceWei: string, decimals: number = 18): string => {
    try {
      // Convert wei to tokens using thirdweb
      const balanceInTokens = toTokens(BigInt(balanceWei), decimals);
      
      // Format the number with abbreviations
      const num = parseFloat(balanceInTokens);
      if (num === 0) return '0';
      if (num < 0.0001) return '< 0.0001';
      if (num < 1) return num.toFixed(4);
      if (num < 1000) return num.toFixed(2);
      if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
      if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
      return (num / 1000000000).toFixed(1) + 'B';
    } catch (error) {
      return '0';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={cardRef}
      className={`w-full h-full cursor-grab active:cursor-grabbing select-none touch-none ${
        isDragging ? 'z-50' : 'z-10'
      }`}
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${getRotation()}deg) scale(${getScale() * getFadeInScale()})`,
        opacity: getOpacity() * getFadeInOpacity(),
        transition: isAnimating ? 'none' : 'transform 0.1s ease-out, opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), scale 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`h-full rounded-3xl shadow-2xl overflow-hidden ${theme.background.secondary} ${theme.text.primary} flex flex-col relative`}>
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
              <span className="text-sm font-bold">×</span>
            </div>
          </div>
        )}

        {/* Swipe Feedback Overlays */}
        {getSwipeDirection() && (
          <>
            {/* Keep overlay (right swipe) */}
            {getSwipeDirection() === 'right' && (
              <div 
                className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                style={{ opacity: getFeedbackOpacity() }}
              >
                <div className="bg-green-500/20 backdrop-blur-sm rounded-3xl border-4 border-green-500/50 w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-2">👍</div>
                    <div className="text-2xl font-bold text-green-500">KEEP</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Sell overlay (left swipe) */}
            {getSwipeDirection() === 'left' && (
              <div 
                className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
                style={{ opacity: getFeedbackOpacity() }}
              >
                <div className="bg-red-500/20 backdrop-blur-sm rounded-3xl border-4 border-red-500/50 w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-2">👎</div>
                    <div className="text-2xl font-bold text-red-500">SELL</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Token Header with Dynamic Background */}
        <div className="relative min-h-40 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {/* Dynamic background based on token image */}
          <DynamicBackground token={token} />
          
          {/* Price chart overlay */}
          {marketData && marketData.priceHistory.length > 0 && (
            <div className="absolute inset-0 opacity-20 flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center">
                <PriceChart 
                  data={marketData.priceHistory} 
                  height={150}
                  showGrid={false}
                />
              </div>
            </div>
          )}
          
          {/* Token icon and basic info */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            {token.logo ? (
              <img 
                src={token.logo} 
                alt={token.symbol}
                className="w-12 h-12 rounded-full mb-2 bg-white/10 backdrop-blur-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold mb-2">
                {token.symbol?.charAt(0) || '?'}
              </div>
            )}
            <h2 className="text-lg font-bold text-white">{token.symbol}</h2>
            <p className="text-xs text-white/80">{token.name}</p>
          </div>
        </div>

        {/* Token Details */}
        <div className="p-3 flex-1 flex flex-col justify-between gap-3">
          {/* Value */}
          <div className="text-center mb-3">
            <div className="text-xl font-bold">
              ${token.value.toFixed(2)}
            </div>
          </div>

          {/* Portfolio Info */}
          <div className="flex-shrink-0">
            <div className="flex justify-between text-xs">
              <span className={theme.text.secondary}>Balance:</span>
              <span className="font-semibold">
                {formatTokenBalance(token.balance, token.decimals || 18)} {token.symbol}
              </span>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className={theme.text.secondary}>Price:</span>
              <div className="text-right">
                <div className="font-semibold text-base">${token.priceUsd?.toFixed(6) || 'N/A'}</div>
                <div className={`text-xs font-medium ${
                  marketData
                    ? marketData.priceChange24h >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                    : 'text-white/60'
                }`}>
                  {marketData
                    ? `${marketData.priceChange24h >= 0 ? '+' : ''}${marketData.priceChange24h.toFixed(2)}%`
                    : '0.00%'}
                </div>
              </div>
            </div>
          </div>

          {/* Market Data (if available) */}
          <div className="flex-shrink-0">
            <div className="flex justify-between text-xs">
              <span className={theme.text.secondary}>Market Cap:</span>
              <span>{marketData?.marketCap ? formatMarketCap(marketData.marketCap) : '--'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className={theme.text.secondary}>24h Volume:</span>
              <span>{marketData?.volume24h ? `$${formatNumber(marketData.volume24h)}` : '--'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className={theme.text.secondary}>Holders:</span>
              <span>{marketData?.holders ? formatNumber(marketData.holders, 0) : '--'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 mt-3">
            <div className="flex space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic();
                  // For button clicks, start from center and animate smoothly
                  const screenWidth = window.innerWidth;
                  // Start with a small offset to make it feel more natural
                  setDragOffset({ x: -20, y: 0 });
                  // Then animate off screen to the left
                  setTimeout(() => {
                    animateCard(-screenWidth * 1.5, 0, 300);
                    // Call the action after animation starts
                    setTimeout(() => {
                      onSwipeLeft();
                    }, 150);
                  }, 50);
                }}
                className="flex-1 py-2 px-3 rounded-xl font-semibold transition-colors bg-red-500 hover:bg-red-600 text-white text-sm"
              >
                {isSelected ? 'Selected' : 'Sell'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic();
                  // For button clicks, start from center and animate smoothly
                  const screenWidth = window.innerWidth;
                  // Start with a small offset to make it feel more natural
                  setDragOffset({ x: 20, y: 0 });
                  // Then animate off screen to the right
                  setTimeout(() => {
                    animateCard(screenWidth * 1.5, 0, 300);
                    // Call the action after animation starts
                    setTimeout(() => {
                      onSwipeRight();
                    }, 150);
                  }, 50);
                }}
                className="flex-1 py-2 px-3 rounded-xl font-semibold transition-colors bg-green-500 hover:bg-green-600 text-white text-sm"
              >
                Keep
              </button>
            </div>
            
            {/* Swipe Direction Hints */}
            <div className="flex justify-between items-center mt-2 text-xs opacity-60">
              <div className="flex items-center">
                <span className="mr-1">👎</span>
                <span>Swipe left to sell</span>
              </div>
              <div className="flex items-center">
                <span>Swipe right to keep</span>
                <span className="ml-1">👍</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { theme: systemTheme } = useSystemTheme();
  const account = useActiveAccount();
  const { 
    tokens, 
    loading, 
    error, 
    hasAttemptedFetch, 
    retry,
    invalidateCacheAndRefetch,
    hasMore,
    loadMore,
    loadingMore
  } = useTokenBalances(account?.address);
  
  const {
    selectedTokens,
    processing,
    destinationToken,
    setDestinationToken,
    executeBatchSell,
    handleTokenSelect,
    tradeSummary,
    showTradeModal,
    closeTradeModal
  } = useBatchSelling(account, tokens);

  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);

  // Filter out native tokens and USDC
  const swipeableTokens = tokens.filter(token => 
    token.symbol !== "ETH" && 
    token.address !== NATIVE_TOKEN_ADDRESS &&
    token.symbol !== "USDC" &&
    token.symbol !== "USDbC"
  );

  // Check if we need to load more tokens
  useEffect(() => {
    // If we're within 3 tokens of the end and there are more tokens to load
    if (hasMore && !loadingMore && currentTokenIndex >= swipeableTokens.length - 3) {
      console.log('Loading more tokens...');
      loadMore();
    }
  }, [currentTokenIndex, swipeableTokens.length, hasMore, loadingMore, loadMore]);

  const handleSwipeLeft = () => {
    if (currentTokenIndex >= swipeableTokens.length) return;
    
    const currentToken = swipeableTokens[currentTokenIndex];
    
    // Skip USDC tokens
    if (currentToken.symbol === "USDC" || currentToken.symbol === "USDbC") {
      setCurrentTokenIndex(prev => prev + 1);
      return;
    }
    
    // Add token to batch for selling
    handleTokenSelect(currentToken.address);
    
    // Move to next token
    setCurrentTokenIndex(prev => prev + 1);
  };

  const handleSwipeRight = () => {
    if (currentTokenIndex >= swipeableTokens.length) return;
    setCurrentTokenIndex(prev => prev + 1);
  };

  const handleBatchSell = async () => {
    if (selectedTokens.size === 0) {
      toast.warning("No tokens selected for selling");
      return;
    }

    try {
      await executeBatchSell(() => {
        // Refresh token list after successful sell
        invalidateCacheAndRefetch();
      });
    } catch (error) {
      console.error('Error executing batch sell:', error);
    }
  };

  const handleReset = () => {
    setCurrentTokenIndex(0);
  };

  if (!account) {
    return (
      <main className={`min-h-screen flex items-center justify-center p-4 ${theme.background.primary}`}>
        <div className={`w-full max-w-md rounded-3xl shadow-lg p-6 ${theme.background.secondary} ${theme.text.primary}`}>
          <div className="mb-6">
            <ConnectButton
              client={client}
              chain={base}
              theme={systemTheme}
              appMetadata={{
                name: "Wallet Sweep",
                url: "https://wallet-sweep.vercel.app",
              }}
              connectButton={{
                label: "Connect Wallet",
                style: {
                  width: "100%",
                },
              }}
              connectModal={{
                size: "compact",
              }}
            />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={`min-h-screen flex items-center justify-center p-4 ${theme.background.primary}`}>
        <div className={`w-full max-w-md rounded-3xl shadow-lg p-6 ${theme.background.secondary} ${theme.text.primary}`}>
          <ErrorDisplay error={error} onRetry={retry} />
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className={`min-h-screen flex items-center justify-center p-4 ${theme.background.primary}`}>
        <div className={`w-full max-w-md rounded-3xl shadow-lg p-6 ${theme.background.secondary} ${theme.text.primary}`}>
          <LoadingSpinner message="Loading your tokens..." />
        </div>
      </main>
    );
  }

  if (swipeableTokens.length === 0 && hasAttemptedFetch) {
    return (
      <main className={`min-h-screen flex items-center justify-center p-4 ${theme.background.primary}`}>
        <div className={`w-full max-w-md rounded-3xl shadow-lg p-6 ${theme.background.secondary} ${theme.text.primary}`}>
          <EmptyState onRetry={retry} />
        </div>
      </main>
    );
  }

  const currentToken = swipeableTokens[currentTokenIndex];
  const isFinished = currentTokenIndex >= swipeableTokens.length;
  const isCurrentTokenSelected = currentToken ? selectedTokens.has(currentToken.address) : false;

  return (
    <main className={`min-h-screen ${theme.background.primary}`}>
      {/* Hamburger Navigation - Absolutely positioned */}
      <div className="absolute top-4 left-4 z-50">
        <HamburgerNav />
      </div>

      {/* Card Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md h-auto flex items-center justify-center">
          {isFinished ? (
            <div className={`min-h-[500px] rounded-3xl shadow-2xl ${theme.background.secondary} ${theme.text.primary} flex items-center justify-center p-6`}>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">All Done!</h2>
                <p className={`mb-6 ${theme.text.secondary}`}>
                  You&apos;ve reviewed all your tokens.
                </p>
                <button
                  onClick={handleReset}
                  className={`px-6 py-3 rounded-xl font-medium transition-colors ${theme.button.secondary}`}
                >
                  Start Over
                </button>
              </div>
            </div>
          ) : currentToken ? (
            <TokenCard
              key={currentToken.address + currentTokenIndex} // Force fresh state for each card
              token={currentToken}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              isVisible={true}
              isSelected={isCurrentTokenSelected}
            />
          ) : null}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/10 to-transparent">
        <div className="max-w-md mx-auto">
          {/* Progress */}
          <div className="flex justify-between text-sm mb-4">
            <span className={theme.text.secondary}>
              {currentTokenIndex + 1} of {swipeableTokens.length}
              {hasMore && (
                <span className="ml-1 text-xs opacity-75">+ more loading...</span>
              )}
            </span>
            <span className={theme.text.secondary}>
              Swipe left to select, right to keep
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mb-4">
            {/* Go Back Button */}
            {currentTokenIndex > 0 && (
              <button
                onClick={() => setCurrentTokenIndex(prev => prev - 1)}
                disabled={processing}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                  processing 
                    ? theme.button.disabled 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                ← Go Back
              </button>
            )}

            {/* Sell Button */}
            {selectedTokens.size > 0 && (
              <button
                onClick={handleBatchSell}
                disabled={processing}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                  processing 
                    ? theme.button.disabled 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {processing ? 'Selling...' : `Sell ${selectedTokens.size} Token${selectedTokens.size !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>

          {/* Selected tokens count */}
          {selectedTokens.size > 0 && (
            <div className={`text-center py-2 rounded-lg ${theme.background.secondary} ${theme.text.secondary}`}>
              {selectedTokens.size} token{selectedTokens.size !== 1 ? 's' : ''} selected for selling
            </div>
          )}

          {/* Loading more indicator */}
          {loadingMore && (
            <div className={`w-full py-3 rounded-2xl font-medium transition-colors relative ${theme.button.disabled}`}>
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading more tokens...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trade Summary Modal */}
      {tradeSummary && (
        <TradeSummaryModal
          isOpen={showTradeModal}
          onClose={closeTradeModal}
          successfulTokens={tradeSummary.successfulTokens}
          failedTokens={tradeSummary.failedTokens}
          transactionHash={tradeSummary.transactionHash}
          destinationToken={destinationToken}
        />
      )}
    </main>
  );
}