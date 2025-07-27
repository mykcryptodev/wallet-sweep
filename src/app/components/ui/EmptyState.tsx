import { theme } from "../../lib/theme";

interface EmptyStateProps {
  onRetry: () => void;
}

export const EmptyState = ({ onRetry }: EmptyStateProps) => (
  <div className="text-center py-8">
    <p className={theme.text.secondary}>
      No tokens found in your wallet
    </p>
    <p className={`text-sm mt-1 ${theme.text.tertiary}`}>
      Make sure you&apos;re connected to Base mainnet
    </p>
    <button 
      onClick={onRetry}
      className={`mt-2 px-4 py-2 rounded-lg transition-colors text-sm ${theme.button.primary}`}
    >
      Refresh
    </button>
  </div>
); 