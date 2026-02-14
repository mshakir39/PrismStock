import React from 'react';
import { FaShoppingCart } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, Legend } from 'recharts';

interface DateRange {
  start: Date;
  end: Date;
}

interface SalesTrendChartProps {
  data: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  dateRange: DateRange;
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  data,
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
        <h3 className='text-lg font-semibold text-gray-900'>Sales Trend</h3>
        <div className='text-sm text-gray-500'>
          {formatDateRange(dateRange)}
        </div>
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width='100%' height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='date' />
            <YAxis yAxisId='left' />
            <YAxis yAxisId='right' orientation='right' />
            <Tooltip
              formatter={(value, name) => [
                name === 'revenue'
                  ? `Rs ${Number(value).toLocaleString()}`
                  : value,
                name === 'revenue' ? 'Revenue' : 'Sales Count',
              ]}
            />
            <Legend />
            <Bar
              yAxisId='left'
              dataKey='sales'
              fill='#8884d8'
              name='Sales Count'
            />
            <Line
              yAxisId='right'
              type='monotone'
              dataKey='revenue'
              stroke='#82ca9d'
              strokeWidth={2}
              name='Revenue'
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className='flex h-[300px] items-center justify-center text-gray-500'>
          <div className='text-center'>
            <FaShoppingCart className='mx-auto mb-2 h-12 w-12 text-gray-300' />
            <p>No sales data available for selected period</p>
            <p className='mt-1 text-sm'>Try selecting a different date range</p>
          </div>
        </div>
      )}
    </div>
  );
};
