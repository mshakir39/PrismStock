import React from 'react';
import DateRangePicker from '@/components/CustomDateRangePicker';

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeControlsProps {
  revenueDateRange: DateRange;
  topProductsDateRange: DateRange;
  salesTrendDateRange: DateRange;
  onRevenueDateChange: (range: DateRange) => void;
  onTopProductsDateChange: (range: DateRange) => void;
  onSalesTrendDateChange: (range: DateRange) => void;
}

export const DateRangeControls: React.FC<DateRangeControlsProps> = ({
  revenueDateRange,
  topProductsDateRange,
  salesTrendDateRange,
  onRevenueDateChange,
  onTopProductsDateChange,
  onSalesTrendDateChange,
}) => (
  <div className='mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
    <div className='flex items-center gap-4'>
      <h3 className='text-lg font-semibold text-gray-900'>
        Date Range Filters
      </h3>
    </div>
    <div className='flex flex-wrap items-center gap-6'>
      <div className='flex items-center gap-3'>
        <span className='text-sm font-medium text-gray-600'>
          Sales & Profit Period:
        </span>
        <DateRangePicker
          onDateChange={onRevenueDateChange}
          initialDateRange={revenueDateRange}
          className='scale-90'
        />
      </div>
      <div className='flex items-center gap-3'>
        <span className='text-sm font-medium text-gray-600'>Sales Trend:</span>
        <DateRangePicker
          onDateChange={onSalesTrendDateChange}
          initialDateRange={salesTrendDateRange}
          className='scale-90'
        />
      </div>
      <div className='flex items-center gap-3'>
        <span className='text-sm font-medium text-gray-600'>Top Products:</span>
        <DateRangePicker
          onDateChange={onTopProductsDateChange}
          initialDateRange={topProductsDateRange}
          className='scale-90'
        />
      </div>
    </div>
  </div>
);
