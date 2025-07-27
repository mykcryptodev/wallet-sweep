"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { theme } from "../lib/theme";
import { ConnectButton } from "thirdweb/react";
import { client } from "../client";
import { base } from "thirdweb/chains";
import { useSystemTheme } from "../hooks/useSystemTheme";

interface HamburgerNavProps {
  className?: string;
}

export default function HamburgerNav({ className = "" }: HamburgerNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { theme: systemTheme } = useSystemTheme();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isSwipeView = pathname === "/";
  const isListView = pathname === "/list";

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className={`p-3 rounded-xl transition-colors ${theme.button.secondary} hover:bg-opacity-80 shadow-lg backdrop-blur-sm ${className}`}
        aria-label="Toggle navigation menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span 
            className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
              isOpen ? 'rotate-45 translate-y-1' : ''
            }`}
          />
          <span 
            className={`block w-5 h-0.5 bg-current transition-all duration-300 mt-1 ${
              isOpen ? 'opacity-0' : ''
            }`}
          />
          <span 
            className={`block w-5 h-0.5 bg-current transition-all duration-300 mt-1 ${
              isOpen ? '-rotate-45 -translate-y-1' : ''
            }`}
          />
        </div>
      </button>

      {/* Sidebar */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={closeMenu}
          />
          
          {/* Sidebar */}
          <div className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50 ${theme.background.secondary} ${theme.text.primary} shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex flex-col h-full">
              {/* Header with Connect Button */}
              <div className="p-6 border-b border-gray-700/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Wallet Sweep</h2>
                  <button
                    onClick={closeMenu}
                    className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                
                {/* Connect Button */}
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

              {/* Navigation Links */}
              <div className="flex-1 p-4">
                <div className="space-y-2">
                  {/* Swipe View Option */}
                  <Link
                    href="/"
                    onClick={closeMenu}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isSwipeView 
                        ? 'bg-blue-500 text-white' 
                        : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="text-lg mr-3">🎯</span>
                    <div className="flex-1">
                      <div className="font-medium">Swipe View</div>
                      <div className="text-sm opacity-70">Swipe through tokens</div>
                    </div>
                    {isSwipeView && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </Link>

                  {/* List View Option */}
                  <Link
                    href="/list"
                    onClick={closeMenu}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isListView 
                        ? 'bg-blue-500 text-white' 
                        : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <span className="text-lg mr-3">📋</span>
                    <div className="flex-1">
                      <div className="font-medium">List View</div>
                      <div className="text-sm opacity-70">Browse all tokens</div>
                    </div>
                    {isListView && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </Link>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-700/30">
                <div className="text-center text-sm opacity-70">
                  <p>Wallet Sweep</p>
                  <p className="text-xs mt-1">Swipe to manage your tokens</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
} 