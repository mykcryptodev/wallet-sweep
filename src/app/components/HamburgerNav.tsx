"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { theme } from "../lib/theme";

interface HamburgerNavProps {
  className?: string;
}

export default function HamburgerNav({ className = "" }: HamburgerNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isSwipeView = pathname === "/";
  const isListView = pathname === "/list";

  return (
    <div className={`relative ${className}`}>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className={`p-3 rounded-xl transition-colors ${theme.button.secondary} hover:bg-opacity-80 shadow-lg backdrop-blur-sm`}
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

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={closeMenu}
          />
          
          {/* Menu */}
          <div className={`absolute top-full left-0 mt-2 rounded-xl shadow-2xl z-50 min-w-48 ${theme.dropdown.background} ${theme.dropdown.border} overflow-hidden`}>
            <div className="p-2">
              {/* Swipe View Option */}
              <Link
                href="/"
                onClick={closeMenu}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isSwipeView 
                    ? 'bg-blue-500 text-white' 
                    : theme.dropdown.item.unselected
                }`}
              >
                <span className="text-lg mr-3">🎯</span>
                <div className="flex-1">
                  <div className="font-medium">Swipe View</div>
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
                    : theme.dropdown.item.unselected
                }`}
              >
                <span className="text-lg mr-3">📋</span>
                <div className="flex-1">
                  <div className="font-medium">List View</div>
                </div>
                {isListView && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 