import { Metadata } from 'next';
import CustomersLayout from '@/layouts/customersLayout';
import { getCustomers } from '@/getData/getCustomers';
import { getCategories } from '@/getData/getCategories';
import CustomersErrorBoundary from '@/components/customers/CustomersErrorBoundary';

export const dynamic = 'force-dynamic'; // React 19: Better for real-time data
export const revalidate = 0; // React 19: No caching for latest customer data

export const metadata: Metadata = {
  title: 'Customers | Prism Stock',
  description: 'Manage your customers and their information',
};

// React 19: Enhanced server component with better error handling
async function getCustomersData() {
  try {
    const customers = await getCustomers();

    if (!Array.isArray(customers)) {
      console.error('Invalid customers data format');
      return [];
    }

    return customers;
  } catch (error) {
    console.error('Error loading customers:', error);
    return [];
  }
}

async function getCategoriesData() {
  try {
    const categories = await getCategories();

    if (!Array.isArray(categories)) {
      console.error('Invalid categories data format');
      return [];
    }

    return categories;
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
    <CustomersErrorBoundary>
      <CustomersLayout
        customers={customers}
        categories={categories}
        // React 19: Pass server-side timestamp for cache invalidation
        serverTimestamp={Date.now()}
      />
    </CustomersErrorBoundary>
  );
}
