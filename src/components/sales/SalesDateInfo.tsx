import React from 'react';

interface DateRange {
  start: Date;
  end: Date;
}

interface SalesDateInfoProps {
  dateRange: DateRange;
  filteredCount: number;
  totalCount: number;
}

const SalesDateInfo: React.FC<SalesDateInfoProps> = ({
  dateRange,
  filteredCount,
  totalCount,
}) => {
  return (
    <div className='mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <svg
            className='h-5 w-5 text-blue-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <span className='text-sm font-medium text-blue-800'>
            Showing sales from{' '}
            {dateRange.start.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}{' '}
            to{' '}
            {dateRange.end.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        </div>
        <span className='text-sm text-blue-600'>
          {filteredCount} of {totalCount} total sales
        </span>
      </div>
    </div>
  );
};

export default SalesDateInfo;
