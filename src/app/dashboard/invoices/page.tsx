import InvoiceLayout from '@/layouts/invoicesLayout';
import { getCategories } from '@/getData/getCategories';
import { getInvoices } from '@/actions/invoiceActions';
import { fetchProductsAction } from '@/actions/productActions';
import InvoiceErrorBoundary from '@/components/invoices/InvoiceErrorBoundary';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoices | Prism Stock',
  description: 'Manage your invoices and billing records',
};

export const dynamic = 'force-dynamic'; // React 19: Better for real-time invoice data
export const revalidate = 0; // React 19: No caching for latest invoice information

// React 19: Enhanced server component with better error handling
async function getInvoicesData() {
  try {
    // Get clientId from cookies for multi-tenancy
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const selectedClientCookie = cookieStore.get('selectedClient')?.value;
    
    const invoicesResult = await getInvoices(selectedClientCookie);

    if (!invoicesResult.success) {
      console.error('Failed to fetch invoices:', invoicesResult.error);
      return null;
    }

    return invoicesResult.data;
  } catch (error) {
    console.error('Error loading invoices data:', error);
    return null;
  }
}

async function getCategoriesData() {
  try {
    const categoriesResult = await getCategories();
    return Array.isArray(categoriesResult) ? categoriesResult : [];
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
}

async function getProductsData() {
  try {
    const productsResult = await fetchProductsAction();
    console.log('Products API result:', productsResult);
    const productsData =
      productsResult.success && Array.isArray(productsResult.data)
        ? productsResult.data
        : [];
    console.log('Processed products data:', productsData);
    return productsData;
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

export default async function Invoices() {
  // React 19: Parallel data fetching for better performance
  const [invoices, categories, products] = await Promise.all([
    getInvoicesData(),
    getCategoriesData(),
    getProductsData(),
  ]);

  return (
    <InvoiceErrorBoundary>
      <InvoiceLayout
        categories={categories}
        invoices={invoices}
        products={products}
      />
    </InvoiceErrorBoundary>
  );
}
