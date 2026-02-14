import React from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { MdTrendingUp } from 'react-icons/md';

interface DateRange {
  start: Date;
  end: Date;
}

interface TopSellingProductsProps {
  products: Array<{
    brandName: string;
    series: string;
    soldCount: number;
    inStock: number;
  }>;
  dateRange: DateRange;
}

export const TopSellingProducts: React.FC<TopSellingProductsProps> = ({
  products,
  dateRange,
}) => {
  const formatDateRange = (range: DateRange) => {
    const start = range.start.toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
    });
    const end = range.end.toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
    });
    const diffTime = Math.abs(range.end.getTime() - range.start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays}d (${start} - ${end})`;
  };

  return (
    <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='flex items-center text-lg font-semibold text-gray-900'>
          <MdTrendingUp className='mr-2 text-green-500' />
          Top Selling Products
        </h3>
      </div>
      <div className='mb-3'>
        <p className='text-sm text-gray-500'>
          Showing sales data for {formatDateRange(dateRange)}
        </p>
      </div>
      {products.length > 0 ? (
        <div className='space-y-3'>
          {products.map((product, index) => (
            <div
              key={`${product.brandName}-${product.series}-${index}`}
              className='flex items-center justify-between rounded-lg bg-gray-50 p-3'
            >
              <div className='flex items-center space-x-3'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100'>
                  <span className='text-sm font-medium text-blue-600'>
                    #{index + 1}
                  </span>
                </div>
                <div>
                  <p className='font-medium text-gray-900'>
                    {product.brandName || 'No Brand'} {product.series}
                  </p>
                  <p className='text-sm text-gray-500'>
                    {product.inStock} in stock
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <p className='font-medium text-green-600'>
                  {product.soldCount} sold
                </p>
                <p className='text-sm text-gray-500'>
                  {product.inStock > 0 ? 'Available' : 'Out of stock'}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='py-8 text-center text-gray-500'>
          <FaShoppingCart className='mx-auto mb-2 h-12 w-12 text-gray-300' />
          <p>No sales data available for selected date range</p>
          <p className='mt-1 text-sm'>Try selecting a different time period</p>
        </div>
      )}
    </div>
  );
};
