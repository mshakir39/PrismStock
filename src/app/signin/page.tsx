'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/button';

export default function Page() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use auth hook login method
      const result = await login(email, password);

      if (result.success) {
        // Redirect to dashboard on successful login
        router.push('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen items-center justify-center p-8 relative overflow-hidden' style={{ background: 'linear-gradient(to bottom, #193043, #1e3a5f, #234466)' }}>
      {/* Background Bubbles */}
      <div className='absolute top-10 left-10 h-16 w-16 rounded-full bg-[#1e3a5f] opacity-20'></div>
      <div className='absolute top-32 right-20 h-24 w-24 rounded-full bg-[#234466] opacity-15'></div>
      <div className='absolute bottom-20 left-32 h-20 w-20 rounded-full bg-[#193043] opacity-25'></div>
      <div className='absolute bottom-40 right-40 h-32 w-32 rounded-full bg-[#1e3a5f] opacity-10'></div>
      <div className='absolute top-1/2 left-20 h-12 w-12 rounded-full bg-[#234466] opacity-18'></div>
      <div className='absolute top-1/3 right-32 h-28 w-28 rounded-full bg-[#1e3a5f] opacity-12'></div>
      
      <div className='relative flex w-full max-w-7xl min-h-[700px] overflow-hidden rounded-3xl bg-white shadow-2xl'>
        {/* Left Section - Welcome with Background Shapes */}
        <div className='relative hidden w-1/2 flex-col items-center justify-center p-8 lg:flex' style={{ background: 'linear-gradient(to bottom, #193043, #1e3a5f, #234466)' }}>
          {/* Background Circular Shapes */}
          <div className='absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#1e3a5f] opacity-70'></div>
        
          <div className='absolute bottom-1/4 left-1/4 h-32 w-32 rounded-full bg-[#234466] opacity-70'></div>
          
          {/* Additional Bubbles in Welcome Section */}
          <div className='absolute top-20 left-20 h-8 w-8 rounded-full bg-[#193043] opacity-60'></div>
          <div className='absolute top-40 right-16 h-12 w-12 rounded-full bg-[#1e3a5f] opacity-50'></div>
          <div className='absolute bottom-32 left-32 h-6 w-6 rounded-full bg-[#234466] opacity-70'></div>
          <div className='absolute bottom-48 right-28 h-10 w-10 rounded-full bg-[#1e3a5f] opacity-40'></div>
          <div className='absolute top-1/3 left-16 h-16 w-16 rounded-full bg-[#193043] opacity-30'></div>
          <div className='absolute top-2/3 right-20 h-8 w-8 rounded-full bg-[#234466] opacity-50'></div>
          <div className='absolute center left-1/3 h-4 w-4 rounded-full bg-[#1e3a5f] opacity-60'></div>
          
          <div className='relative z-10 text-center text-white px-8 font-sans'>
            <h1 className='mb-4 text-6xl font-extrabold text-white tracking-wide'>WELCOME</h1>
            <h2 className='mb-8 text-3xl font-light text-white tracking-wide'>PRISM STOCK</h2>
            <p className='mx-auto max-w-md text-lg leading-relaxed'>
              Your comprehensive inventory management solution.
              Streamline your operations with advanced inventory tracking,
              real-time analytics, and powerful reporting tools for modern businesses.
            </p>
          </div>
        </div>

        {/* Right Section - Sign In Form */}
        <div className='flex w-full items-center justify-center p-8 lg:w-1/2'>
          <div className='w-full max-w-md'>
            <div className='text-center'>
              <h1 className='mb-2 text-3xl font-bold text-gray-900'>Sign in</h1>
              <p className='mb-8 text-gray-600'>
                Access your Prism Stock inventory platform
              </p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Email Field with Icon */}
              <div>
                <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                  User Name
                </label>
                <div className='relative mt-1'>
                  <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
                    {/* User Icon */}
                    <svg className='h-5 w-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'></path>
                    </svg>
                  </div>
                  <input
                    id='email'
                    name='email'
                    type='email'
                    autoComplete='email'
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm'
                    placeholder='Enter your user name'
                  />
                </div>
              </div>

              {/* Password Field with Icon */}
              <div>
                <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                  Password
                </label>
                <div className='relative mt-1'>
                  <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
                    {/* Lock Icon */}
                    <svg className='h-5 w-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'></path>
                    </svg>
                  </div>
                  <input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    autoComplete='current-password'
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='block w-full rounded-lg border border-gray-300 pl-10 pr-20 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm'
                    placeholder='Enter your password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 font-medium'
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <input
                    id='remember-me'
                    name='remember-me'
                    type='checkbox'
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                  />
                  <label htmlFor='remember-me' className='ml-2 block text-sm text-gray-700'>
                    Remember me
                  </label>
                </div>
                <div className='text-sm'>
                  <a href='#' className='font-medium text-slate-700 hover:text-slate-900'>
                    Forgot Password?
                  </a>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className='rounded-md bg-red-50 p-4'>
                  <div className='text-sm text-red-800'>{error}</div>
                </div>
              )}

              {/* Sign In Button */}
              <div>
                <Button
                  variant="fill"
                  text={isLoading ? 'Signing in...' : 'Sign in'}
                  isPending={isLoading}
                  type="submit"
                  className="w-full"
                />
              </div>
            </form>

            {/* <div className='mt-6 text-center text-sm text-gray-600'>
              Don't have an account?{' '}
              <a href='#' className='font-medium text-blue-600 hover:text-blue-500'>
                Sign Up
              </a>
            </div> */}

            {/* <div className='flex w-full justify-center py-4'>
              <GoogleSignIn />
            </div> */}

          </div>
        </div>
      </div>
    </div>
  );
}
