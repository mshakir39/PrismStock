import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Providers from '@/components/Providers';
import CookieConsent from '@/components/CookieConsent';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';
import 'rsuite-table/dist/css/rsuite-table.css';
import './globals.css';
import '../styles/scrollbar.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'arial', 'sans-serif'],
  preload: true, // Change back to true for better UX
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Prism Stock - Multi-Tenant SaaS Inventory Management System',
  description:
    'Comprehensive multi-tenant SaaS inventory management system for businesses. Manage products, sales, customers, and warranties across multiple client organizations with advanced analytics and reporting.',
  keywords:
    'inventory management, SaaS, multi-tenant, product management, sales tracking, customer management, warranty management, analytics, reporting, business software',
  authors: [{ name: 'Prism Stock Team' }],
  creator: 'Prism Stock',
  publisher: 'Prism Stock',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://prismstock.com/',
  },
  openGraph: {
    title: 'Prism Stock - Multi-Tenant SaaS Inventory Management System',
    description:
      'Powerful inventory management SaaS platform with multi-tenant architecture. Streamline your business operations with advanced inventory tracking, sales analytics, and customer management.',
    url: 'https://prismstock.com/',
    siteName: 'Prism Stock',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://res.cloudinary.com/divdl3sad/image/upload/v1769437584/Gemini_Generated_Image_oz2asxoz2asxoz2a_hzeyaj.png',
        width: 1200,
        height: 630,
        alt: 'Prism Stock - Multi-Tenant SaaS Inventory Management System',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prism Stock - Multi-Tenant SaaS Inventory Management System',
    description:
      'Powerful inventory management SaaS platform with multi-tenant architecture. Streamline your business operations with advanced inventory tracking, sales analytics, and customer management.',
    images: [
      {
        url: 'https://res.cloudinary.com/divdl3sad/image/upload/v1769437584/Gemini_Generated_Image_oz2asxoz2asxoz2a_hzeyaj.png',
        width: 1200,
        height: 630,
        alt: 'Prism Stock - Multi-Tenant SaaS Inventory Management System',
      },
    ],
  },
  icons: {
    icon: {
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15"/></filter></defs><rect x="0" y="0" width="48" height="48" rx="12" fill="%23193043" filter="url(%23shadow)"/><polygon points="8,38 20,8 32,38" fill="white"/><polygon points="32,38 40,32 26,2 20,8" fill="white" opacity="0.8"/><polygon points="8,38 32,38 40,32 14,32" fill="white" opacity="0.6"/></svg>',
      type: 'image/svg+xml',
    },
    shortcut: {
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><filter id="betterShadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceGraphic" stdDeviation="4" floodOpacity="0.2"/><feMergeNode in="SourceGraphic" in2="BackgroundImageFix"/><feMergeNode in="SourceGraphic" in3="BackgroundImageFix"/></filter></defs><rect x="0" y="0" width="48" height="48" rx="12" fill="%23193043" filter="url(%23betterShadow)"/><polygon points="8,38 20,8 32,38" fill="white"/><polygon points="32,38 40,32 26,2 20,8" fill="white" opacity="0.8"/><polygon points="8,38 32,38 40,32 14,32" fill="white" opacity="0.6"/></svg>',
      type: 'image/svg+xml',
    },
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Prism Stock',
    description:
      'Authorized dealer of Osaka, AGS, Exide, Fujika, Phoenix & Daewoo batteries for cars, UPS systems, and solar applications. Expert battery installation services in Dera Ghazi Khan, Pakistan.',
    url: 'https://prismstock.com',
    telephone: '+92-334-9627745',
    email: 'owner@prismstock.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'General Bus Stand, near Badozai Market',
      addressLocality: 'Dera Ghazi Khan',
      addressRegion: 'Punjab',
      postalCode: '32200',
      addressCountry: 'PK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '30.0472',
      longitude: '70.6401',
    },
    openingHours: 'Mo-Th 09:00-20:00, Fr-Sa 09:00-21:00, Su 10:00-18:00',
    priceRange: '$$',
    image:
      'https://res.cloudinary.com/divdl3sad/image/upload/v1769437584/Gemini_Generated_Image_oz2asxoz2asxoz2a_hzeyaj.png',
    sameAs: ['https://prismstock.com'],
    offers: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'Car Batteries',
          description: 'Premium quality car batteries from top brands',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'UPS Batteries',
          description: 'Batteries for UPS systems for home and office',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Product',
          name: 'Solar Batteries',
          description: 'Batteries for solar power systems and applications',
        },
      },
    ],
  };

  return (
    <html lang='en-PK' suppressHydrationWarning>
      <head>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
