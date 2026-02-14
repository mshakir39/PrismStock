'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ROUTES } from '@/constants/routes';

const Sidebar = dynamic(() => import('@/components/sidebar'), {
  ssr: false,
  loading: () => null,
});

const ToastContainer = dynamic(
  () => import('react-toastify').then((m) => m.ToastContainer),
  { ssr: false }
);

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDashboardUnlocked, setIsDashboardUnlocked] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if dashboard is unlocked via password
  useEffect(() => {
    if (!isMounted) return;

    const checkDashboardUnlock = () => {
      const unlockedCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('dashboard-unlocked='));

      const hasCookie = !!unlockedCookie;
      const cookieValue = hasCookie ? unlockedCookie.split('=')[1] : null;

      console.log('Dashboard unlock check:', {
        cookie: document.cookie,
        hasCookie,
        cookieValue,
      });

      setIsDashboardUnlocked(hasCookie && cookieValue === 'true');
    };

    checkDashboardUnlock();
    const interval = setInterval(checkDashboardUnlock, 500);
    return () => clearInterval(interval);
  }, [isMounted]);

  // Memoize the callback to prevent unnecessary re-renders
  const handleCollapseChange = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  }, []);

  // Show sidebar if dashboard is unlocked OR if we're on /dashboard (for testing)
  const currentPath =
    typeof window !== 'undefined' ? window.location.pathname : '';
  const isSignInPage = currentPath === ROUTES.SIGNIN;
  const isDashboardPasswordPage = currentPath === ROUTES.DASHBOARD_PASSWORD;
  const isAppPage = currentPath === ROUTES.DASHBOARD;

  // If it's the sign-in page or dashboard-password page, render without sidebar layout
  if (isSignInPage || isDashboardPasswordPage) {
    return (
      <>
        <ToastContainer />
        {children}
      </>
    );
  }

  // Show sidebar if dashboard is unlocked
  const shouldShowSidebar = isDashboardUnlocked && !isDashboardPasswordPage;

  console.log('LayoutWrapper render:', {
    isDashboardUnlocked,
    shouldShowSidebar,
    currentPath,
    isMounted,
    isAppPage,
    isDashboardPasswordPage,
  });

  // If it's the dashboard password page, render without sidebar and status indicators
  if (isDashboardPasswordPage) {
    return (
      <>
        <ToastContainer />
        {children}
      </>
    );
  }

  if (!shouldShowSidebar) {
    return (
      <>
        <ToastContainer />
        {children}
      </>
    );
  }

  return (
    <div className='flex min-h-screen w-full'>
      <Sidebar onCollapseChange={handleCollapseChange} />
      <main
        className={`flex-1 overflow-x-hidden p-4 transition-all duration-300 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* User Status Indicator - More Visible */}
        <div className='fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg border-2 border-blue-700 bg-blue-600 px-4 py-2 text-white shadow-lg'>
          <div
            className={`h-3 w-3 rounded-full ${isDashboardUnlocked ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}
          ></div>
          <span className='text-sm font-bold'>
            {isDashboardUnlocked ? '✓ LOGGED IN' : '✗ NOT LOGGED IN'}
          </span>
        </div>

        {/* Debug Info */}
        <div className='fixed bottom-4 right-4 z-50 rounded-lg bg-black px-3 py-2 text-xs text-white shadow-lg'>
          Debug: {isDashboardUnlocked ? 'UNLOCKED' : 'LOCKED'} | Path:{' '}
          {currentPath}
        </div>

        <ToastContainer />
        {children}
      </main>
    </div>
  );
};

export default LayoutWrapper;
