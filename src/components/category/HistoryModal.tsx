'use client';
import React from 'react';
import Modal from '@/components/modal';
import { CategoryWithBatteryData, BatteryData } from '@/interfaces/category';

interface HistoryModalProps {
  isOpen: boolean;
  isLoadingHistory: boolean;
  historyData: CategoryWithBatteryData[];
  selectedHistoryEntry: CategoryWithBatteryData | null;
  onClose: () => void;
  onSelectEntry: (entry: CategoryWithBatteryData) => void;
  onBackToList: () => void;
  onRevertHistory: (entry: CategoryWithBatteryData) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  isLoadingHistory,
  historyData,
  selectedHistoryEntry,
  onClose,
  onSelectEntry,
  onBackToList,
  onRevertHistory,
}) => {
  return (
    <Modal
      size='large'
      isOpen={isOpen}
      onClose={onClose}
      title='Category History'
    >
      <div className='max-h-[80vh] overflow-y-auto'>
        {isLoadingHistory ? (
          <div className='flex items-center justify-center py-8'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500'></div>
          </div>
        ) : historyData.length === 0 ? (
          <div className='py-8 text-center text-gray-500'>
            No history available
          </div>
        ) : (
          <div className='space-y-4'>
            {!selectedHistoryEntry ? (
              // History List View
              <div className='grid gap-4'>
                {historyData.map((entry, index) => (
                  <div
                    key={index}
                    className='rounded-lg border p-4 hover:bg-gray-50'
                  >
                    <div className='flex items-center justify-between'>
                      <div
                        className='flex-1 cursor-pointer'
                        onClick={() => onSelectEntry(entry)}
                      >
                        <h3 className='font-medium'>{entry.brandName}</h3>
                        <p className='text-sm text-gray-500'>
                          {entry.series.length} series items
                        </p>
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-right'>
                          <p className='text-sm text-gray-600'>
                            {new Date(
                              entry.historyDate ?? ''
                            ).toLocaleDateString()}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {new Date(
                              entry.historyDate ?? ''
                            ).toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            onRevertHistory(entry);
                          }}
                          className='rounded-md bg-orange-100 px-3 py-1 text-sm text-orange-700 transition-colors hover:bg-orange-200'
                        >
                          Revert
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Historical Data Detail View
              <HistoryDetailView
                selectedHistoryEntry={selectedHistoryEntry}
                onBackToList={onBackToList}
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

// History Detail View Component
interface HistoryDetailViewProps {
  selectedHistoryEntry: CategoryWithBatteryData;
  onBackToList: () => void;
}

const HistoryDetailView: React.FC<HistoryDetailViewProps> = ({
  selectedHistoryEntry,
  onBackToList,
}) => {
  return (
    <div>
      <button
        onClick={onBackToList}
        className='mb-4 flex items-center gap-1 text-blue-600 hover:text-blue-800'
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
            d='M15 19l-7-7 7-7'
          />
        </svg>
        Back to History List
      </button>

      <div className='mb-4 border-l-4 border-yellow-400 bg-yellow-50 p-4'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <svg
              className='h-5 w-5 text-yellow-400'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <p className='text-sm text-yellow-700'>
              This is a historical view from{' '}
              {new Date(
                selectedHistoryEntry.historyDate ?? ''
              ).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Render the same battery list view but with historical data */}
      <div className='grid grid-cols-1 gap-3 sm:gap-4'>
        {selectedHistoryEntry.series.map((item: BatteryData, index: number) => (
          <div key={index} className='rounded-lg bg-white p-3 shadow sm:p-4'>
            <div className='grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7'>
              <div>
                <span className='text-sm text-gray-500'>Name</span>
                <p className='break-words font-medium text-gray-900'>
                  {item.name}
                </p>
              </div>
              <div>
                <span className='text-sm text-gray-500'>Plate</span>
                <p className='font-medium text-gray-900'>{item.plate}</p>
              </div>
              <div>
                <span className='text-sm text-gray-500'>AH</span>
                <p className='font-medium text-gray-900'>{item.ah}</p>
              </div>
              <div>
                <span className='text-sm text-gray-500'>Retail Price</span>
                <p className='font-medium text-gray-900'>
                  Rs {item.retailPrice || 'N/A'}
                </p>
              </div>
              <div>
                <span className='text-sm text-gray-500'>
                  Sales Tax (
                  {item.salesTax ?? selectedHistoryEntry.salesTax ?? 18}
                  %)
                </span>
                <p className='font-medium text-gray-900'>
                  Rs{' '}
                  {item.retailPrice
                    ? Math.round(
                        (item.retailPrice *
                          (item.salesTax ??
                            selectedHistoryEntry.salesTax ??
                            18)) /
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryModal;
