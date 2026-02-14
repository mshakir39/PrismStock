import LoadingSpinner from '@/components/LoadingSpinner';

// Loading component for landing page
export default function Loading() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center space-y-4 bg-gradient-to-br from-blue-50 to-indigo-100'>
      <LoadingSpinner size='lg' />
      <div className='text-center'>
        <h2 className='text-lg font-medium text-gray-900'>
          Loading Prism Stock...
        </h2>
        <p className='mt-1 text-sm text-gray-500'>
          Preparing premium battery solutions for you
        </p>
      </div>
    </div>
  );
}
