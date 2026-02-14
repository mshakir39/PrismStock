'use client';
import React from 'react';
import { FaTrash } from 'react-icons/fa6';
import { BatteryData, CategoryWithBatteryData } from '@/interfaces/category';

interface BatteryListProps {
  detailData: CategoryWithBatteryData;
  searchQuery: string;
  editingBattery: string | null;
  editingPrice: { [key: string]: number };
  globalSalesTax: string;
  isEditingGlobalSalesTax: boolean;
  isLoading: boolean;
  onSearchChange: (query: string) => void;
  onPriceChange: (batteryName: string, value: string) => void;
  onSavePrice: (batteryName: string) => void;
  setEditingBattery: (batteryName: string | null) => void;
  setEditingPrice: (prices: { [key: string]: number }) => void;
  setIsEditingGlobalSalesTax: (editing: boolean) => void;
  setGlobalSalesTax: (tax: string) => void;
  onSaveGlobalSalesTax: () => void;
  onDeleteBattery: (batteryName: string) => void;
}

const BatteryList: React.FC<BatteryListProps> = ({
  detailData,
  searchQuery,
  editingBattery,
  editingPrice,
  globalSalesTax,
  isEditingGlobalSalesTax,
  isLoading,
  onSearchChange,
  onPriceChange,
  onSavePrice,
  setEditingBattery,
  setEditingPrice,
  setIsEditingGlobalSalesTax,
  setGlobalSalesTax,
  onSaveGlobalSalesTax,
  onDeleteBattery,
}) => {
  const filteredSeries = React.useMemo(() => {
    if (!detailData || !detailData.series) return [];

    if (!searchQuery.trim()) return detailData.series;

    const query = searchQuery.toLowerCase().trim();
    return detailData.series.filter(
      (item: BatteryData) =>
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.plate && item.plate.toString().toLowerCase().includes(query)) ||
        (item.ah && item.ah.toString().includes(query)) ||
        (item.type && item.type.toLowerCase().includes(query))
    );
  }, [detailData, searchQuery]);

  return (
    <div className='max-h-[80vh] overflow-y-auto'>
      {/* Header Controls - Responsive Layout */}
      <div className='mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        {/* Search Input - Full width on mobile, half on desktop */}
        <div className='w-full sm:w-1/2 lg:w-3/5'>
          <label className='mb-1 block text-sm font-medium text-gray-700'>
            Search batteries
          </label>
          <input
            type='text'
            className='w-full rounded border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
            placeholder='Search by name, plate, AH or type...'
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Sales Tax Control - Full width on mobile, smaller on desktop */}
        <div className='w-full sm:w-1/3 lg:w-1/4'>
          <div className='mb-1 flex items-center justify-between'>
            <label className='text-sm text-gray-500'>Sales Tax %</label>
            {!isEditingGlobalSalesTax ? (
              <button
                onClick={() => setIsEditingGlobalSalesTax(true)}
                className='touch-manipulation rounded px-2 py-1 text-sm text-blue-500 hover:bg-blue-50 hover:text-blue-700'
              >
                Edit
              </button>
            ) : (
              <div className='flex gap-1 sm:gap-2'>
                <button
                  onClick={onSaveGlobalSalesTax}
                  className='touch-manipulation rounded px-2 py-1 text-sm text-green-500 hover:bg-green-50 hover:text-green-700'
                  disabled={isLoading}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingGlobalSalesTax(false);
                    setGlobalSalesTax('18'); // Reset to default
                  }}
                  className='touch-manipulation rounded px-2 py-1 text-sm text-red-500 hover:bg-red-50 hover:text-red-700'
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          {isEditingGlobalSalesTax ? (
            <input
              type='text'
              value={globalSalesTax}
              onChange={(e) => {
                const { value } = e.target;
                if (/^-?\d*$/.test(value)) {
                  setGlobalSalesTax(value);
                }
              }}
              className='w-full rounded border bg-white p-2 text-sm focus:border-blue-500 focus:outline-none'
              placeholder='Enter sales tax percentage'
            />
          ) : (
            <div className='w-full rounded border bg-gray-100 p-2 text-sm font-medium'>
              {globalSalesTax}%
            </div>
          )}
        </div>
      </div>

      {/* Battery List */}
      <div className='flex flex-col gap-3 sm:gap-4'>
        <div className='grid grid-cols-1 gap-3 sm:gap-4'>
          {filteredSeries.length > 0 ? (
            filteredSeries.map((item: BatteryData, index: number) => (
              <BatteryItem
                key={index}
                item={item}
                detailData={detailData}
                editingBattery={editingBattery}
                editingPrice={editingPrice}
                isLoading={isLoading}
                onPriceChange={onPriceChange}
                onSavePrice={onSavePrice}
                setEditingBattery={setEditingBattery}
                setEditingPrice={setEditingPrice}
                onDeleteBattery={onDeleteBattery}
              />
            ))
          ) : (
            <div className='rounded-lg bg-gray-50 py-8 text-center'>
              <div className='mx-auto max-w-md px-4'>
                <div className='mb-3 text-gray-400'>
                  <svg
                    className='mx-auto h-12 w-12'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
                  </svg>
                </div>
                <h3 className='mb-1 text-lg font-medium text-gray-900'>
                  No batteries found
                </h3>
                <p className='text-sm text-gray-500'>
                  No batteries match your search criteria. Try adjusting your
                  search terms.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Battery Item Component
interface BatteryItemProps {
  item: BatteryData;
  detailData: CategoryWithBatteryData;
  editingBattery: string | null;
  editingPrice: { [key: string]: number };
  isLoading: boolean;
  onPriceChange: (batteryName: string, value: string) => void;
  onSavePrice: (batteryName: string) => void;
  setEditingBattery: (batteryName: string | null) => void;
  setEditingPrice: (prices: { [key: string]: number }) => void;
  onDeleteBattery: (batteryName: string) => void;
}

const BatteryItem: React.FC<BatteryItemProps> = ({
  item,
  detailData,
  editingBattery,
  editingPrice,
  isLoading,
  onPriceChange,
  onSavePrice,
  setEditingBattery,
  setEditingPrice,
  onDeleteBattery,
}) => {
  return (
    <div className='rounded-lg bg-white p-3 shadow transition-shadow hover:shadow-md sm:p-4'>
      {/* Mobile Card Layout */}
      <div className='block sm:hidden'>
        {/* Header Row */}
        <div className='mb-3 flex items-start justify-between'>
          <div className='flex-1'>
            <h3 className='font-semibold text-gray-900'>{item.name}</h3>
            <div className='mt-1 flex flex-wrap gap-2 text-sm text-gray-600'>
              <span>Plate: {item.plate}</span>
              <span>•</span>
              <span>AH: {item.ah}</span>
              {item.type && (
                <>
                  <span>•</span>
                  <span>Type: {item.type}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => onDeleteBattery(item.name)}
            className='ml-2 touch-manipulation rounded-full p-2 text-red-600 transition-colors hover:bg-red-50'
            disabled={isLoading}
            title='Delete battery'
          >
            <FaTrash className='h-4 w-4' />
          </button>
        </div>

        {/* Price Section */}
        <div className='space-y-3'>
          {/* Retail Price */}
          <div className='rounded-lg bg-gray-50 p-3'>
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-700'>
                Retail Price
              </span>
              {editingBattery !== item.name ? (
                <button
                  onClick={() => {
                    setEditingBattery(item.name);
                    const currentPrice = item.retailPrice || 0;
                    setEditingPrice({
                      ...editingPrice,
                      [item.name]: currentPrice,
                    });
                  }}
                  className='touch-manipulation rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-600 hover:bg-blue-200'
                >
                  Edit
                </button>
              ) : (
                <div className='flex gap-2'>
                  <button
                    onClick={() => onSavePrice(item.name)}
                    className='touch-manipulation rounded-full bg-green-100 px-3 py-1 text-sm text-green-600 hover:bg-green-200'
                    disabled={isLoading}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingBattery(null);
                      setEditingPrice({});
                    }}
                    className='touch-manipulation rounded-full bg-red-100 px-3 py-1 text-sm text-red-600 hover:bg-red-200'
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {editingBattery === item.name ? (
              <input
                type='number'
                value={editingPrice[item.name] ?? item.retailPrice ?? ''}
                onChange={(e) => onPriceChange(item.name, e.target.value)}
                className='w-full rounded border p-2 text-base focus:border-blue-500 focus:outline-none'
                placeholder='Enter price'
              />
            ) : (
              <p className='text-lg font-semibold text-gray-900'>
                Rs {item.retailPrice || 'N/A'}
              </p>
            )}
          </div>

          {/* Tax and Max Price Row */}
          <div className='grid grid-cols-2 gap-3'>
            <div className='rounded-lg bg-gray-50 p-3'>
              <span className='text-xs text-gray-500'>
                Sales Tax ({item.salesTax ?? detailData?.salesTax ?? 18}%)
              </span>
              <p className='font-medium text-gray-900'>
                Rs{' '}
                {item.retailPrice
                  ? Math.round(
                      (item.retailPrice *
                        (item.salesTax ?? detailData?.salesTax ?? 18)) /
                        100
                    )
                  : 'N/A'}
              </p>
            </div>
            <div className='rounded-lg bg-gray-50 p-3'>
              <span className='text-xs text-gray-500'>Max Retail Price</span>
              <p className='font-medium text-gray-900'>
                Rs {item.maxRetailPrice || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Grid Layout */}
      <div className='hidden sm:block'>
        <div className='grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8'>
          <div>
            <span className='text-sm text-gray-500'>Name</span>
            <p className='break-words font-medium text-gray-900'>{item.name}</p>
          </div>
          <div>
            <span className='text-sm text-gray-500'>Plate</span>
            <p className='font-medium text-gray-900'>{item.plate}</p>
          </div>
          <div>
            <span className='text-sm text-gray-500'>AH</span>
            <p className='font-medium text-gray-900'>{item.ah}</p>
          </div>
          <div className='col-span-2 md:col-span-1 lg:col-span-1'>
            <div className='mb-1 flex items-center justify-between'>
              <span className='text-sm text-gray-500'>Retail Price</span>
              {editingBattery !== item.name ? (
                <button
                  onClick={() => {
                    setEditingBattery(item.name);
                    const currentPrice = item.retailPrice || 0;
                    setEditingPrice({
                      ...editingPrice,
                      [item.name]: currentPrice,
                    });
                  }}
                  className='touch-manipulation rounded px-2 py-1 text-sm text-blue-500 hover:bg-blue-50 hover:text-blue-700'
                >
                  Edit
                </button>
              ) : (
                <div className='flex gap-1'>
                  <button
                    onClick={() => onSavePrice(item.name)}
                    className='touch-manipulation rounded px-2 py-1 text-xs text-green-500 hover:bg-green-50 hover:text-green-700'
                    disabled={isLoading}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingBattery(null);
                      setEditingPrice({});
                    }}
                    className='touch-manipulation rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-700'
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {editingBattery === item.name ? (
              <input
                type='number'
                value={editingPrice[item.name] ?? item.retailPrice ?? ''}
                onChange={(e) => onPriceChange(item.name, e.target.value)}
                className='w-full rounded border p-1 text-sm focus:border-blue-500 focus:outline-none'
                placeholder='Enter price'
              />
            ) : (
              <p className='font-medium text-gray-900'>
                Rs {item.retailPrice || 'N/A'}
              </p>
            )}
          </div>
          <div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-500'>
                Sales Tax ({item.salesTax ?? detailData?.salesTax ?? 18}%)
              </span>
            </div>
            <p className='font-medium text-gray-900'>
              Rs{' '}
              {item.retailPrice
                ? Math.round(
                    (item.retailPrice *
                      (item.salesTax ?? detailData?.salesTax ?? 18)) /
                      100
                  )
                : 'N/A'}
            </p>
          </div>
          <div>
            <span className='text-sm text-gray-500'>Max Retail Price</span>
            <p className='font-medium text-gray-900'>
              Rs {item.maxRetailPrice || 'N/A'}
            </p>
          </div>
          {item.type && (
            <div>
              <span className='text-sm text-gray-500'>Type</span>
              <p className='font-medium text-gray-900'>{item.type}</p>
            </div>
          )}
          {/* Delete Button - Desktop */}
          <div className='flex items-end justify-end'>
            <button
              onClick={() => onDeleteBattery(item.name)}
              className='rounded-full p-2 text-red-600 transition-colors hover:bg-red-50'
              disabled={isLoading}
              title='Delete battery'
            >
              <FaTrash className='h-4 w-4' />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatteryList;
