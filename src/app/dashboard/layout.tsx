'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ROUTES } from '@/constants/routes';

// Base path for the dashboard
const DASHBOARD_PREFIX = '/dashboard';

// Dynamically import components to avoid SSR issues with browser-only features
// (e.g., LocalStorage, window objects, or heavy UI libraries)
const Sidebar = dynamic(() => import('@/components/sidebar'), {
  ssr: false,
  loading: () => null, // Prevents layout shift while loading
});

const AuthStatus = dynamic(() => import('@/components/AuthStatus'), {
  ssr: false,
  loading: () => null,
});

const ToastContainer = dynamic(
  () => import('react-toastify').then((m) => m.ToastContainer),
  { ssr: false } // Toastify relies on window/document
);

const DebugInfo = dynamic(() => import('@/components/DebugInfo'), {
  ssr: false,
  loading: () => null,
});

const ClientSelector = dynamic(() => import('@/components/ClientSelector'), {
  ssr: false,
  loading: () => null,
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isDashboardUnlocked, setIsDashboardUnlocked] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pathname = usePathname();
  const router = useRouter();
  // Remove the /dashboard prefix for the active link check
  const cleanPathname = pathname?.startsWith(DASHBOARD_PREFIX)
    ? pathname.slice(DASHBOARD_PREFIX.length) || '/'
    : pathname;
  const normalizedPathname = (cleanPathname || '').toLowerCase();

  // Explicitly list pages where the sidebar/main layout should NOT appear
  const excludedPaths = [ROUTES.SIGNIN.slice(1)]; // Remove leading slash for comparison
  const isExcludedPage = excludedPaths.includes(normalizedPathname);

  // Handler for updates coming from the AuthStatus component
  const handleAuthStatusChange = ({
    isSignedIn: signedIn,
    userId: newUserId,
  }: { isSignedIn: boolean; userId?: string }) => {
    // Only update state if values have changed to prevent unnecessary re-renders
    if (isSignedIn !== signedIn) {
      setIsSignedIn(signedIn);
      setIsDashboardUnlocked(signedIn); // For backward compatibility
    }
    if (userId !== newUserId) {
      setUserId(newUserId);
    }

    // Simple redirect logic: if not signed in, redirect to signin
    if (!signedIn && !pathname?.includes('signin')) {
      router.push('/signin');
    }
  };

  // 1. Render simple layout for Login/Password pages
  if (isExcludedPage) {
    return (
      <div className='min-h-screen w-full'>
        <ToastContainer />
        {children}
      </div>
    );
  }

 // Check if we should show the sidebar
  const shouldShowSidebar = isSignedIn; // Show sidebar for authenticated users

  // Prevent hydration mismatch by waiting for client mount
  if (!mounted) {
    return (
      <div className='min-h-screen w-full'>
        <ToastContainer />
        {children}
      </div>
    );
  }

  return (
    <div className='min-h-screen w-full'>
      {/* AuthStatus checks the session/cookies and updates parent state */}
      <AuthStatus onStatusChange={handleAuthStatusChange} />

      {shouldShowSidebar ? (
        <>
          {/* Layout: Sidebar + Main Content */}
          <div className='flex min-h-screen w-full'>
            <Sidebar
              key={`sidebar-${isSignedIn}-${isDashboardUnlocked}-${userId || 'no-user'}`}
              onCollapseChange={(collapsed: boolean) =>
                setIsSidebarCollapsed(collapsed)
              }
              basePath=""
            />
            <main
              className={`flex-1 overflow-x-hidden p-4 transition-all duration-300 ${
                isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
              }`}
            >
              <ToastContainer />
              {children}
            </main>
          </div>

          {/* Fixed Client Selector - Bottom Right */}
          {isSignedIn && (
            <div className="fixed bottom-4 right-4 z-50">
              <ClientSelector />
            </div>
          )}
        </>
      ) : (
        // Layout: Full width (e.g., if not unlocked or not signed in yet)
        <div className='min-h-screen w-full'>
          <ToastContainer />
          {children}
        </div>
      )}
    </div>
  );
}
