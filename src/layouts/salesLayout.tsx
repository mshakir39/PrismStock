'use client';
import React, { useState, useMemo, useCallback, useOptimistic, useActionState } from 'react';
import SalesDataGrid from '@/components/sales/SalesDataGrid';
import ProductsDetailModal from '@/components/sales/ProductDetailModal';
import { toast } from 'react-toastify';

interface DateRange {
  start: Date;
  end: Date;
}

interface SalesLayoutProps {
  sales: any[];
  // React 19: Add server timestamp for cache invalidation
  serverTimestamp?: number;
}

const SalesLayout: React.FC<SalesLayoutProps> = ({
  sales,
  serverTimestamp,
}) => {
  // Modal state for products
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedSaleProducts, setSelectedSaleProducts] = useState<any[]>([]);
  const [selectedSaleInfo, setSelectedSaleInfo] = useState<any>(null);

  // Filter states
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');

  // Initialize with last 30 days as default
  const getDefaultDateRange = useCallback((): DateRange => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, []);

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  // React 19: Optimistic updates for sales operations
  const [optimisticSales, addOptimisticSale] = useOptimistic(
    sales,
    (state, newSale: any) => {
      if (newSale.action === 'delete') {
        return state.filter((sale) => sale.id !== newSale.id);
      }
      return [newSale, ...state];
    }
  );

  // React 19: useActionState for filter operations
  const [filterState, filterAction, isFilterPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const customer = formData.get('customer') as string;
      const startDate = formData.get('startDate') as string;
      const endDate = formData.get('endDate') as string;

      try {
        // Simulate API call for filtering
        await new Promise((resolve) => setTimeout(resolve, 100));

        return {
          customer: customer || '',
          dateRange: {
            start: startDate
              ? new Date(startDate)
              : getDefaultDateRange().start,
            end: endDate ? new Date(endDate) : getDefaultDateRange().end,
          },
        };
      } catch (error) {
        toast.error('Failed to apply filters');
        return prevState;
      }
    },
    { customer: '', dateRange: getDefaultDateRange() }
  );

  // React 19: Sync with filter state when it changes
  React.useEffect(() => {
    if (filterState.customer !== selectedCustomer) {
      setSelectedCustomer(filterState.customer);
    }
    if (filterState.dateRange) {
      setDateRange(filterState.dateRange);
    }
  }, [filterState, selectedCustomer]);

  // Get unique customers for dropdown - React 19: Enhanced with memoization
  const customerOptions = useMemo(() => {
    const uniqueCustomers = Array.from(
      new Set(
        optimisticSales // Use optimistic sales instead of original sales
          .map((sale) => sale.customerName)
          .filter(Boolean)
          .filter((name) => name.trim() !== '')
      )
    ).sort();

    return [
      { label: 'All Customers', value: '' },
      ...uniqueCustomers.map((customer) => ({
        label: customer,
        value: customer,
      })),
    ];
  }, [optimisticSales]); // Dependency on optimistic sales

  // Filter sales based on selected date range and customer - React 19: Use optimistic data
  const filteredSales = useMemo(() => {
    if (!optimisticSales || optimisticSales.length === 0) return [];

    return optimisticSales.filter((sale) => {
      // Date filter
      const saleDate = new Date(sale.date);
      const dateMatch =
        saleDate >= dateRange.start && saleDate <= dateRange.end;

      // Customer filter
      const customerMatch =
        !selectedCustomer || sale.customerName === selectedCustomer;

      return dateMatch && customerMatch;
    });
  }, [optimisticSales, dateRange, selectedCustomer]);

  // Calculate summary statistics
  const salesSummary = useMemo(() => {
    const totalSales = filteredSales.length;
    const totalRevenue = filteredSales.reduce(
      (sum, sale) => sum + (sale.totalAmount || 0),
      0
    );
    const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Get unique customers from filtered results - Fixed this line
    const uniqueCustomers = Array.from(
      new Set(filteredSales.map((sale) => sale.customerName).filter(Boolean))
    ).length;

    return {
      totalSales,
      totalRevenue,
      avgSaleValue,
      uniqueCustomers,
    };
  }, [filteredSales]);

  // Handle date range change
  const handleDateChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  // Handle customer selection
  const handleCustomerSelect = useCallback(
    (option: { label: string; value: string }) => {
      setSelectedCustomer(option.value);
    },
    []
  );

  // Handle viewing products - React 19: Enhanced with error boundary
  const handleViewProducts = useCallback((sale: any) => {
    try {
      setSelectedSaleProducts(sale.products || []);
      setSelectedSaleInfo(sale);
      setIsProductModalOpen(true);
    } catch (error) {
      toast.error('Failed to load sale details');
      console.error('Error viewing products:', error);
    }
  }, []);

  // React 19: Optimistic delete function
  const handleDeleteSale = useCallback(
    async (saleId: string) => {
      if (!confirm('Are you sure you want to delete this sale?')) return;

      try {
        // Add optimistic update
        addOptimisticSale({ id: saleId, action: 'delete' });

        const response = await fetch('/api/sales', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: saleId }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete sale');
        }

        toast.success('Sale deleted successfully');
      } catch (error) {
        toast.error('Failed to delete sale');
        // Refresh data to revert optimistic update
        window.location.reload();
      }
    },
    [addOptimisticSale]
  );

  // Handle closing products modal
  const handleCloseProductsModal = useCallback(() => {
    setIsProductModalOpen(false);
    setSelectedSaleProducts([]);
    setSelectedSaleInfo(null);
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSelectedCustomer('');
    setDateRange(getDefaultDateRange());
  }, [getDefaultDateRange]);

  return (
    <div className='p-0 py-6 md:p-6'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Sales</h1>
      </div>

      {/* Sales Data Grid */}
      <SalesDataGrid
        filteredSales={filteredSales}
        onViewProducts={handleViewProducts}
      />

      {/* Products Detail Modal */}
      <ProductsDetailModal
        isOpen={isProductModalOpen}
        onClose={handleCloseProductsModal}
        selectedSaleInfo={selectedSaleInfo}
        selectedSaleProducts={selectedSaleProducts}
      />
    </div>
  );
};

export default SalesLayout;
