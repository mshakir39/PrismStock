'use client';

import { useEffect } from 'react';

function upsertIcon(rel: string, href: string, type?: string) {
  let link = document.querySelector<HTMLLinkElement>(`link[rel='${rel}']`);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel as any;
    document.head.appendChild(link);
  }
  link.href = href;
  if (type) link.type = type;
}

export default function FaviconManager() {
  useEffect(() => {
    const lightHref = '/next.svg?v=3';
    const darkHref = '/next.svg?v=3'; // Use same icon for both light and dark modes

    const apply = (isDark: boolean) => {
      const href = isDark ? darkHref : lightHref;
      upsertIcon('icon', href, 'image/svg+xml');
      upsertIcon('shortcut icon', href, 'image/svg+xml');
      // Optional: apple icon uses same svg; modern Safari supports SVG favicons
      upsertIcon('apple-touch-icon', href);
    };

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    apply(mq.matches);

    const listener = (e: MediaQueryListEvent) => apply(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', listener);
    else (mq as any).addListener?.(listener);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', listener);
      else (mq as any).removeListener?.(listener);
    };
  }, []);

  return null;
}
