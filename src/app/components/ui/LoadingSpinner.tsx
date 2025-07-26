interface LoadingSpinnerProps {
  message: string;
}

export const LoadingSpinner = ({ message }: LoadingSpinnerProps) => (
  <div className="text-center py-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
    <p className="text-gray-600 mt-2">{message}</p>
  </div>
); 