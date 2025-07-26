interface EmptyStateProps {
  onRetry: () => void;
}

export const EmptyState = ({ onRetry }: EmptyStateProps) => (
  <div className="text-center py-8">
    <p className="text-gray-600">No tokens found in your wallet</p>
    <p className="text-sm text-gray-500 mt-1">Make sure you&apos;re connected to Base mainnet</p>
    <button 
      onClick={onRetry}
      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
    >
      Refresh
    </button>
  </div>
); 