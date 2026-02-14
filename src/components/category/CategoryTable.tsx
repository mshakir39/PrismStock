'use client';
import React from 'react';
import Table from '@/components/table';
import { FaEye, FaTrash } from 'react-icons/fa6';
import { ColumnDef } from '@tanstack/react-table';
import { CategoryWithBatteryData } from '@/interfaces/category';

interface CategoryTableProps {
  categories: CategoryWithBatteryData[];
  isLoadingHistory: boolean;
  onViewCategory: (category: CategoryWithBatteryData) => void;
  onViewHistory: (categoryId: string) => void;
  onDeleteCategory: (category: CategoryWithBatteryData) => void;
}

const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  isLoadingHistory,
  onViewCategory,
  onViewHistory,
  onDeleteCategory,
}) => {
  const columns = React.useMemo<ColumnDef<CategoryWithBatteryData>[]>(
    () => [
      {
        accessorKey: 'brandName',
        header: 'BrandName',
      },
      {
        accessorKey: 'series',
        header: 'Series',
        cell: ({ row }) => {
          const series = row.original.series;
          if (series.length === 0) return 'No series';

          // Sort series alphabetically by name before displaying
          const sortedSeries = [...series].sort((a, b) =>
            a.name.localeCompare(b.name)
          );

          // Show first 3 series, then indicate how many more
          const displaySeries = sortedSeries.slice(0, 3).map((s) => s.name);
          const remainingCount = sortedSeries.length - 3;

          return (
            <div className='space-y-1'>
              <div className='text-sm'>
                {displaySeries.join(', ')}
                {remainingCount > 0 && (
                  <span className='ml-1 text-gray-500'>
                    +{remainingCount} more
                  </span>
                )}
              </div>
              <div className='text-xs text-gray-400'>
                {series.length} total series
              </div>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <FaEye
              className='cursor-pointer text-blue-600 transition-colors hover:text-blue-800'
              title='View'
              onClick={(e) => {
                e.stopPropagation();
                onViewCategory(row.original);
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory(row.original.id!);
              }}
              className='flex items-center gap-1 px-2 py-1 text-sm text-blue-600 transition-colors hover:text-blue-800'
              disabled={isLoadingHistory}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-4 w-4'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              History
            </button>
            <FaTrash
              className='cursor-pointer text-red-600 transition-colors hover:text-red-800'
              title='Delete Category'
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCategory(row.original);
              }}
            />
          </div>
        ),
      },
    ],
    [isLoadingHistory, onViewHistory, onViewCategory, onDeleteCategory]
  );

  return (
    <Table<CategoryWithBatteryData>
      data={categories}
      columns={columns}
      enableSearch={true}
      searchPlaceholder='Search categories...'
      enablePagination={true}
      pageSize={10}
      showButton={false}
    />
  );
};

export default CategoryTable;
