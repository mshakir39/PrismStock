import { Metadata } from 'next';
import CustomersLayout from '@/layouts/customersLayout';
import { getCustomers } from '@/actions/customerActions';
import { getCategories } from '@/actions/categoryActions';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic'; // React 19: Better for real-time data
export const revalidate = 0; // React 19: No caching for latest customer data

export const metadata: Metadata = {
  title: 'Customers | Prism Stock',
  description: 'Manage your customers and their information',
};

// React 19: Enhanced server component with better error handling
async function getCustomersData() {
  try {
    const result = await getCustomers();

    if (!result.success || !Array.isArray(result.data)) {
      console.error('Invalid customers data format or fetch failed');
      return [];
    }

    return result.data;
  } catch (error) {
    console.error('Error loading customers:', error);
    return [];
  }
}

async function getCategoriesData() {
  try {
    const result = await getCategories();

    if (!result.success || !Array.isArray(result.data)) {
      console.error('Invalid categories data format or fetch failed');
      return [];
    }

    return result.data;
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

export default async function CustomersPage() {
  const [customers, categories] = await Promise.all([
    getCustomersData(),
    getCategoriesData(),
  ]);

  return (
    <ErrorBoundary
      title="Customer Data Error"
      message="An unexpected error occurred while loading customer information."
    >
      <CustomersLayout
        customers={customers}
        categories={categories}
        // React 19: Pass server-side timestamp for cache invalidation
        serverTimestamp={Date.now()}
      />
    </ErrorBoundary>
  );
}
