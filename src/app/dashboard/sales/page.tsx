import { getSales } from '@/actions/salesActions';
import SalesLayout from '@/layouts/salesLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic'; // React 19: Better for real-time data
export const revalidate = 0; // React 19: No caching for latest sales data

export const metadata: Metadata = {
  title: 'Sales | Prism Stock',
  description: 'Manage your sales and track revenue',
};

// React 19: Enhanced server component with better error handling
async function getSalesData() {
  try {
    // Get clientId from cookies for multi-tenancy
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const selectedClientCookie = cookieStore.get('selectedClient')?.value;
    
    const salesResult = await getSales(selectedClientCookie);

    if (!salesResult.success) {
      console.error('Failed to fetch sales:', salesResult.error);
      return [];
    }

    return salesResult.data || [];
  } catch (error) {
    console.error('Error loading sales data:', error);
    return [];
  }
}

export default async function SalesPage() {
  const sales = await getSalesData();

  return (
    <ErrorBoundary
      title="Sales Data Error"
      message="An unexpected error occurred while loading sales information."
    >
      <SalesLayout
        sales={sales as any[]}
        // React 19: Pass server-side timestamp for cache invalidation
        serverTimestamp={Date.now()}
      />
    </ErrorBoundary>
  );
}
