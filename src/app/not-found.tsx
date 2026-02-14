import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <h2 className='mb-4 text-2xl font-bold text-gray-900'>
          Page Not Found
        </h2>
        <p className='mb-6 text-gray-600'>
          The page you are looking for does not exist.
        </p>
        <Link
          href='/'
          className='rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
