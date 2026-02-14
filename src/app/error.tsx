'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <h2 className='mb-4 text-2xl font-bold text-gray-900'>
          Something went wrong!
        </h2>
        <p className='mb-6 text-gray-600'>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className='rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
        >
          Try again
        </button>
      </div>
    </div>
  );
}
