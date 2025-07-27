import { theme } from "../../lib/theme";

interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

export const ErrorDisplay = ({ error, onRetry }: ErrorDisplayProps) => (
  <div className="text-center py-8">
    <div className={`mb-4 ${theme.status.error}`}>
      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <p className="font-medium">Error loading tokens</p>
      <p className={`text-sm mt-1 ${theme.text.tertiary}`}>{error}</p>
    </div>
    <button 
      onClick={onRetry}
      className={`px-4 py-2 rounded-lg transition-colors ${theme.button.primary}`}
    >
      Try Again
    </button>
  </div>
); 