'use client';
// import { SessionProvider } from 'next-auth/react';

import React from 'react';

const SessionWrapper = ({ children }: { children: React.ReactNode }) => {
  // return <SessionProvider>{children}</SessionProvider>;
  return <>{children}</>; // Return children directly since we're not using NextAuth
};

export default SessionWrapper;
