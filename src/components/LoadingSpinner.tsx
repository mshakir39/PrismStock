import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  showText = false,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-[#2d4a6c] ${sizeClasses[size]}`}
        role='status'
        aria-label='Loading'
      ></div>
      {showText === true && (
        <span className="mt-2 text-sm text-gray-600">Loading...</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
