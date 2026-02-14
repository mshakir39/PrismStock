import React from 'react';

interface ErrorMessageProps {
  error: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error }) => (
  <div className='p-6'>
    <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
      Error: {error}
    </div>
  </div>
);
