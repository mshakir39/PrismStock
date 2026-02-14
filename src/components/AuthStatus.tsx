'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthStatusProps {
  onStatusChange?: (status: {
    isSignedIn: boolean;
    userId?: string;
  }) => void;
  children?: React.ReactNode;
}

export default function AuthStatus({
  onStatusChange,
  children,
}: AuthStatusProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { isAuthenticated, isLoading, user } = useAuth();

  // Memoize the status change handler to prevent unnecessary re-renders
  const handleStatusChange = useCallback((signedIn: boolean) => {
    if (!onStatusChange) return;

    onStatusChange({
      isSignedIn: signedIn,
      userId: isAuthenticated ? (user as any)?._id : undefined
    });
  }, [onStatusChange, isAuthenticated, user]);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Notify parent component about auth status changes
  useEffect(() => {
    if (!isMounted || !onStatusChange || isLoading) return;

    handleStatusChange(isAuthenticated);
  }, [isMounted, onStatusChange, isAuthenticated, isLoading, handleStatusChange]);

  // Render children without any status UI
  return <>{children}</>;
}
