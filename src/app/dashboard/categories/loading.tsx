import LoadingSpinner from '@/components/LoadingSpinner';

// React 19: Enhanced loading component for categories with better UX
export default function Loading() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center space-y-4'>
      <LoadingSpinner size='lg' />
      <div className='text-center'>
        <h2 className='text-lg font-medium text-gray-900'>
          Loading Categories...
        </h2>
        <p className='mt-1 text-sm text-gray-500'>
          Please wait while we fetch your category information
        </p>
      </div>
    </div>
  );
}
