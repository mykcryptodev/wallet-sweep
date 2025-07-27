import { useState, useEffect } from 'react';

export const useSystemTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if user prefers dark theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    setIsLoaded(true);

    // Listen for changes in theme preference
    const handleThemeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  return {
    isDarkMode,
    isLoaded,
    theme: isDarkMode ? 'dark' as const : 'light' as const
  };
}; 