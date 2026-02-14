'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem('cookie-consent');
    if (!hasConsented) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowConsent(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowConsent(false);
  };

  if (!showConsent) {
    return null;
  }

  return (
    <div className='fixed bottom-0 left-0 right-0 z-50 bg-gray-900 p-4 text-white shadow-lg'>
      <div className='mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row'>
        <div className='flex-1'>
          <p className='text-sm'>
            <span className='font-semibold'>Cookie Notice:</span> We use Google
            Maps for location services, which may use cookies. By continuing to
            use our site, you agree to our use of cookies for essential
            functionality.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={declineCookies}
            className='rounded bg-gray-700 px-4 py-2 text-sm transition-colors hover:bg-gray-600'
          >
            Decline
          </button>
          <button
            onClick={acceptCookies}
            className='rounded bg-blue-600 px-4 py-2 text-sm transition-colors hover:bg-blue-700'
          >
            Accept
          </button>
          <button
            onClick={() => setShowConsent(false)}
            className='rounded p-2 transition-colors hover:bg-gray-700'
            aria-label='Close cookie consent'
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
