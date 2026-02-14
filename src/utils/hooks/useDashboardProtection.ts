'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export const useDashboardProtection = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [previousPath, setPreviousPath] = useState<string>('');
  const router = useRouter();
  const pathname = usePathname();

  // Check if dashboard is unlocked
  const checkDashboardAccess = () => {
    const isUnlocked = sessionStorage.getItem('dashboardUnlocked') === 'true';
    const unlockTime = sessionStorage.getItem('dashboardUnlockTime');

    if (isUnlocked && unlockTime) {
      const unlockTimestamp = parseInt(unlockTime);
      const currentTime = Date.now();
      const sessionTimeout = 30 * 60 * 1000; // 30 minutes
      const warningTimeout = 25 * 60 * 1000; // 25 minutes (5 min warning)

      // Check if session has expired
      if (currentTime - unlockTimestamp > sessionTimeout) {
        // Session expired, lock dashboard
        sessionStorage.removeItem('dashboardUnlocked');
        sessionStorage.removeItem('dashboardUnlockTime');
        setIsLocked(true);
        return false;
      }

      // Show warning if session is about to expire
      if (currentTime - unlockTimestamp > warningTimeout) {
        // You can add a toast notification here if needed
        console.log('Dashboard session will expire soon');
      }

      setIsLocked(false);
      return true;
    }

    setIsLocked(true);
    return false;
  };

  // Lock dashboard
  const lockDashboard = useCallback(() => {
    sessionStorage.removeItem('dashboardUnlocked');
    sessionStorage.removeItem('dashboardUnlockTime');
    setIsLocked(true);
    // Show password modal if we're currently on dashboard route
    if (pathname === '/') {
      setShowPasswordModal(true);
    }
  }, [pathname]);

  // Unlock dashboard
  const unlockDashboard = () => {
    setIsLocked(false);
    setShowPasswordModal(false);
  };

  // Handle successful password entry
  const handlePasswordSuccess = () => {
    unlockDashboard();
  };

  // Handle route changes and modal visibility
  useEffect(() => {
    // Check if we're navigating away from dashboard
    if (previousPath === '/' && pathname !== '/') {
      // We just left the dashboard, ALWAYS lock it regardless of current state
      lockDashboard();
    }

    if (pathname === '/') {
      // We're on dashboard route - ALWAYS require password
      const hasAccess = checkDashboardAccess();
      if (!hasAccess) {
        // No access, show password modal
        setShowPasswordModal(true);
      } else {
        // Has access, hide password modal
        setShowPasswordModal(false);
      }
    } else {
      // We're not on dashboard route
      setShowPasswordModal(false);
    }

    // Update previous path
    setPreviousPath(pathname);
  }, [pathname, previousPath, lockDashboard]);

  return {
    isLocked,
    showPasswordModal,
    setShowPasswordModal,
    unlockDashboard,
    lockDashboard,
    handlePasswordSuccess,
    checkDashboardAccess,
  };
};
