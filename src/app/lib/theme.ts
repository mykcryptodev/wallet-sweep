// Theme configuration - modify these values to change the app's appearance
export const theme = {
  // Background colors
  background: {
    primary: 'bg-gray-50 dark:bg-zinc-950',
    secondary: 'bg-white dark:bg-zinc-900',
  },
  
  // Text colors
  text: {
    primary: 'text-black dark:text-white',
    secondary: 'text-gray-600 dark:text-gray-300',
    tertiary: 'text-gray-500 dark:text-gray-400',
  },
  
  // Border colors
  border: {
    primary: 'border-gray-200 dark:border-gray-600',
    secondary: 'border-gray-300 dark:border-gray-500',
    selected: 'border-blue-300 dark:border-blue-600',
  },
  
  // Button colors
  button: {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200',
    disabled: 'bg-gray-300 cursor-not-allowed',
  },
  
  // Token card colors
  tokenCard: {
    selected: 'bg-blue-50 border-blue-300 dark:bg-blue-900 dark:border-blue-600',
    unselected: 'bg-gray-50 border-gray-200 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500',
  },
  
  // Dropdown colors
  dropdown: {
    background: 'bg-white dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-600',
    item: {
      selected: 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
      unselected: 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700',
    },
  },
  
  // Status colors
  status: {
    success: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900',
    error: 'text-red-600 dark:text-red-400',
  },
  
  // Interactive elements
  interactive: {
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    focus: 'focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
  },
} as const;

// Helper function to combine multiple theme classes
export const combineClasses = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

// Type for theme keys
export type ThemeKey = keyof typeof theme; 