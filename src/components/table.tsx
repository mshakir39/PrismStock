import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, SortingState } from '@tanstack/react-table';
import { ChevronDownIcon } from 'lucide-react';
import SearchField from './SearchField';
import Button from './button';

interface TableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  enableSearch?: boolean;
  enablePagination?: boolean;
  searchPlaceholder?: string;
  searchParentClassName?: string;
  tableParentClassName?: string;
  buttonOnClick?: () => void;
  buttonTitle?: string;
  showButton?: boolean;
  secondaryButtonOnClick?: () => void;
  secondaryButtonTitle?: string;
  showSecondaryButton?: boolean;
  stockCost?: number;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  extraGlobalSearchText?: (row: TData) => string;
  customGlobalFilter?: (
    row: any,
    searchText: string,
    filterValue: string
  ) => boolean;
  enableRowVirtualization?: boolean;
  tableBodyHeight?: number;
  minVisibleRows?: number;
}

export function Table<TData>({
  data,
  columns,
  enableSearch = true,
  enablePagination = false,
  searchPlaceholder = 'Search...',
  searchParentClassName,
  tableParentClassName,
  buttonOnClick,
  buttonTitle = 'Create',
  showButton = true,
  secondaryButtonOnClick,
  secondaryButtonTitle = 'Secondary',
  showSecondaryButton = false,
  stockCost,
  pageSize: initialPageSize = 10,
  onRowClick,
  emptyMessage = 'No data found',
  extraGlobalSearchText,
  customGlobalFilter,
  enableRowVirtualization = false,
  tableBodyHeight = 600,
  minVisibleRows = 10,
}: TableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const augmentedColumns = React.useMemo<ColumnDef<TData>[]>(() => {
    if (!extraGlobalSearchText) return columns;
    return [
      ...columns,
      {
        id: '__global_search',
        accessorFn: (row: any) => extraGlobalSearchText?.(row) ?? '',
        header: '',
        cell: () => null,
      } as unknown as ColumnDef<TData>,
    ];
  }, [columns, extraGlobalSearchText]);

  const table = useReactTable({
    data,
    columns: augmentedColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      try {
        let searchText = '';

        // Only try to get __global_search if extraGlobalSearchText was provided
        if (extraGlobalSearchText) {
          try {
            const hidden = row.getValue('__global_search');
            if (hidden != null) {
              searchText = String(hidden).toLowerCase();
            }
          } catch {
            // Column doesn't exist, fall through to fallback
          }
        }

        // If we didn't get text from __global_search, build from visible cells
        if (!searchText) {
          searchText = row
            .getAllCells()
            .filter((c: any) => c.column.id !== '__global_search') // Skip the hidden column
            .map((c: any) => {
              const value = c.getValue?.();
              // Skip null, undefined, objects, and arrays
              if (value == null || typeof value === 'object') return '';
              return String(value);
            })
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        }

        const query = String(filterValue ?? '').toLowerCase();

        if (customGlobalFilter) {
          try {
            return customGlobalFilter(row, searchText, query);
          } catch {
            // fallback to default behavior
          }
        }

        return searchText.includes(query);
      } catch (error) {
        console.error('Search filter error:', error);
        return true; // Show the row if there's an error
      }
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
      columnVisibility: { __global_search: false } as any,
    },
  });

  const filteredRows = table.getFilteredRowModel().rows;
  const sortedRows = table.getSortedRowModel().rows;
  const totalPages = Math.ceil(sortedRows.length / pageSize);
  const paginatedRows = React.useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return sortedRows.slice(start, end);
  }, [sortedRows, currentPage, pageSize]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  React.useEffect(() => {
    setCurrentPage(0);
  }, [globalFilter]);

  React.useEffect(() => {
    setCurrentPage(0);
  }, [sorting]);

  const renderRows = enablePagination ? paginatedRows : sortedRows;

  const scrollParentRef = React.useRef<HTMLDivElement | null>(null);
  const tbodyRef = React.useRef<HTMLTableSectionElement | null>(null);
  const [containerHeight, setContainerHeight] = React.useState<
    number | undefined
  >(undefined);
  const rowVirtualizer = useVirtualizer({
    count: enableRowVirtualization ? renderRows.length : 0,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 56,
    overscan: 6,
    measureElement:
      typeof window !== 'undefined'
        ? (el: Element) => (el as HTMLElement).getBoundingClientRect().height
        : undefined,
  });

  const virtualItemsLen = enableRowVirtualization
    ? rowVirtualizer.getVirtualItems().length
    : 0;

  React.useEffect(() => {
    if (!enableRowVirtualization) return;
    let target = minVisibleRows * 56;
    try {
      const rows = tbodyRef.current?.querySelectorAll<HTMLTableRowElement>(
        'tr:not([aria-hidden])'
      );
      if (rows && rows.length > 0) {
        let total = 0;
        rows.forEach((r) => {
          total += r.getBoundingClientRect().height;
        });
        const avg = total / rows.length;
        if (!Number.isNaN(avg) && avg > 0) {
          target = avg * minVisibleRows;
        }
      }
    } catch {}
    target = Math.max(tableBodyHeight, Math.ceil(target));
    setContainerHeight(target);
  }, [
    enableRowVirtualization,
    minVisibleRows,
    tableBodyHeight,
    sorting,
    globalFilter,
    pageSize,
    currentPage,
    virtualItemsLen,
  ]);

  // Calculate dynamic container style
  const containerStyle = React.useMemo(() => {
    if (!enableRowVirtualization) return undefined;

    // If we have fewer rows than minVisibleRows, don't apply min-height
    if (renderRows.length <= minVisibleRows) {
      return {
        overflowY: 'auto' as const,
      };
    }

    return {
      maxHeight: containerHeight ?? tableBodyHeight,
      minHeight: containerHeight ?? minVisibleRows * 56,
      overflowY: 'auto' as const,
    };
  }, [
    enableRowVirtualization,
    renderRows.length,
    minVisibleRows,
    containerHeight,
    tableBodyHeight,
  ]);

  return (
    <div className={`flex w-full flex-col ${tableParentClassName}`}>
      {/* Header with Search and Button */}
      {(enableSearch || showButton || stockCost !== undefined) && (
        <div className='mt-6 flex items-center justify-between gap-4'>
          {enableSearch && (
            <div className={`w-80 ${searchParentClassName}`}>
              <SearchField
                value={globalFilter}
                onChange={setGlobalFilter}
                placeholder={searchPlaceholder}
              />
            </div>
          )}
          <div className='flex items-center gap-4'>
            {stockCost !== undefined && stockCost > 0 && (
              <span className='whitespace-nowrap font-bold'>
                Total Stock Cost: {Math.round(stockCost).toLocaleString()}
              </span>
            )}
            {showSecondaryButton && secondaryButtonOnClick && (
              <Button
                variant='outline'
                text={secondaryButtonTitle}
                onClick={secondaryButtonOnClick}
                style={{ borderColor: '#dc2626', color: '#dc2626' }}
                className='hover:bg-red-50'
              />
            )}
            {showButton && buttonOnClick && (
              <Button
                variant='fill'
                text={buttonTitle}
                onClick={buttonOnClick}
              />
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className='mt-6 rounded-lg border border-gray-200'>
        <div
          className='overflow-x-auto'
          ref={enableRowVirtualization ? scrollParentRef : undefined}
          style={containerStyle}
        >
          <table className='w-full table-fixed'>
            {(() => {
              const headerCount =
                table.getHeaderGroups()[0]?.headers.length || columns.length;
              const cols = Array.from({ length: headerCount });
              const pct = `${(100 / headerCount).toFixed(4)}%`;
              return (
                <colgroup>
                  {cols.map((_, i) => (
                    <col key={i} style={{ width: pct }} />
                  ))}
                </colgroup>
              );
            })()}
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className='border-b border-gray-200 bg-gray-50'
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className='overflow-hidden text-ellipsis whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-gray-700'
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center gap-1'
                              : '',
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <ChevronDownIcon
                              className={`h-4 w-4 transition-transform ${
                                header.column.getIsSorted() === 'asc'
                                  ? 'rotate-180 text-blue-600'
                                  : header.column.getIsSorted() === 'desc'
                                    ? 'text-blue-600'
                                    : 'text-gray-400'
                              }`}
                            />
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody ref={tbodyRef}>
              {enableRowVirtualization && rowVirtualizer
                ? (() => {
                    const virtualItems = rowVirtualizer.getVirtualItems();
                    const totalSize = rowVirtualizer.getTotalSize();
                    const top = virtualItems[0]?.start ?? 0;
                    const bottom =
                      totalSize -
                      (virtualItems[virtualItems.length - 1]?.end ?? 0);
                    return (
                      <>
                        {top > 0 && (
                          <tr aria-hidden>
                            <td
                              colSpan={columns.length}
                              style={{ height: top }}
                            />
                          </tr>
                        )}
                        {virtualItems.map((vi) => {
                          const row = renderRows[vi.index];
                          if (!row) return null;
                          return (
                            <tr
                              key={row.id}
                              onClick={() => onRowClick?.(row.original)}
                              className={`border-b border-gray-200 transition-colors ${
                                vi.index % 2 === 0
                                  ? 'bg-white'
                                  : 'bg-gray-50/50'
                              } ${
                                onRowClick
                                  ? 'cursor-pointer hover:bg-blue-50'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <td
                                  key={cell.id}
                                  className='whitespace-normal break-words px-4 py-3 text-sm text-gray-900'
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                        {bottom > 0 && (
                          <tr aria-hidden>
                            <td
                              colSpan={columns.length}
                              style={{ height: bottom }}
                            />
                          </tr>
                        )}
                      </>
                    );
                  })()
                : renderRows.map((row, i) => (
                    <tr
                      key={row.id}
                      onClick={() => onRowClick?.(row.original)}
                      className={`border-b border-gray-200 transition-colors ${
                        i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      } ${
                        onRowClick
                          ? 'cursor-pointer hover:bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className='whitespace-normal break-words px-4 py-3 text-sm text-gray-900'
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {enablePagination && totalPages > 1 && (
        <div className='mt-4 flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
              className='rounded border border-gray-200 px-2 py-1 text-sm'
            >
              {[5, 10, 20, 30, 50].map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
            <span className='text-sm text-gray-600'>entries</span>
          </div>

          <div className='flex items-center gap-2'>
            <button
              className='rounded border border-gray-200 px-3 py-1 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50'
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
            >
              Previous
            </button>
            <div className='flex items-center gap-1'>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i;
                } else if (currentPage < 3) {
                  pageNumber = i;
                } else if (currentPage > totalPages - 4) {
                  pageNumber = totalPages - 5 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`min-w-[32px] rounded px-2 py-1 text-sm ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pageNumber + 1}
                  </button>
                );
              })}
            </div>
            <button
              className='rounded border border-gray-200 px-3 py-1 text-sm transition-colors hover:bg-gray-50 disabled:opacity-50'
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </button>
          </div>

          <div className='text-sm text-gray-600'>
            Showing {currentPage * pageSize + 1} to{' '}
            {Math.min((currentPage + 1) * pageSize, sortedRows.length)} of{' '}
            {sortedRows.length} entries
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
