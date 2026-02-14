'use client';

// import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/hooks/useAuth';
import { ClientProvider } from '@/interfaces/clientContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // return <SessionProvider>{children}</SessionProvider>;
  return (
    <AuthProvider>
      <ClientProvider>
        {children}
      </ClientProvider>
    </AuthProvider>
  ); // Return children with AuthProvider since we're not using NextAuth
}
