'use client';

import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

// React 19: Enhanced Error Boundary for Customers with better error reporting
interface CustomersErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface CustomersErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

class CustomersErrorBoundary extends React.Component<
  CustomersErrorBoundaryProps,
  CustomersErrorBoundaryState
> {
  constructor(props: CustomersErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): CustomersErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // React 19: Enhanced error logging for customers data
    console.error(
      'Customers Error Boundary caught an error:',
      error,
      errorInfo
    );

    this.setState({
      error,
      errorInfo,
    });

    // You could also send error to reporting service here
    // reportError(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent =
        this.props.fallback || DefaultCustomersErrorFallback;
      return (
        <FallbackComponent error={this.state.error} reset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}

// React 19: Default error fallback with customers-specific UX
function DefaultCustomersErrorFallback({
  error,
  reset,
}: {
  error?: Error;
  reset: () => void;
}) {
  return (
    <div className='flex min-h-screen items-center justify-center px-4'>
      <div className='text-center'>
        <FaExclamationTriangle className='mx-auto h-12 w-12 text-red-500' />
        <h1 className='mt-4 text-2xl font-bold text-gray-900'>
          Customers Data Error
        </h1>
        <p className='mt-2 text-gray-600'>
          {error?.message ||
            'An unexpected error occurred while loading customers data.'}
        </p>
        <div className='mt-6 flex justify-center space-x-4'>
          <button
            onClick={reset}
            className='rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className='rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
          >
            Reload page
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && error && (
          <details className='mt-6 text-left'>
            <summary className='cursor-pointer text-sm text-gray-500'>
              Error details
            </summary>
            <pre className='mt-2 overflow-auto rounded bg-gray-100 p-4 text-xs text-red-600'>
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default CustomersErrorBoundary;
