import LoadingSpinner from '@/components/LoadingSpinner';

// Loading component for dashboard pages
export default function DashboardLoading() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center space-y-4'>
      <LoadingSpinner size='lg' />
      <div className='text-center'>
        <h2 className='text-lg font-medium text-gray-900'>
          Loading Dashboard...
        </h2>
        <p className='mt-1 text-sm text-gray-500'>
          Please wait while we fetch your dashboard data
        </p>
      </div>
    </div>
  );
}
