'use client';
import React from 'react';
import Modal from '@/components/modal';
import Button from '@/components/button';
import { FaTrash } from 'react-icons/fa6';
import { CategoryWithBatteryData } from '@/interfaces/category';

interface DeleteModalProps {
  isOpen: boolean;
  isLoading: boolean;
  deleteItem: {
    batteryName: string;
    brandName: string;
  } | null;
  detailData: CategoryWithBatteryData | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  isLoading,
  deleteItem,
  detailData,
  onClose,
  onConfirm,
}) => {
  if (!deleteItem || !detailData) return null;

  const itemToDelete = detailData.series.find(
    (item) => item.name === deleteItem.batteryName
  );
  const isTonic =
    itemToDelete?.batteryType === 'tonic' ||
    deleteItem.batteryName?.toLowerCase().includes('tonic');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isTonic ? 'Delete Battery Tonic' : 'Delete Battery'}
      size='small'
      preventBackdropClose={false}
    >
      <div className='space-y-4'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <FaTrash className='h-8 w-8 text-red-600' />
          </div>
          <h3 className='mb-2 text-lg font-medium text-gray-900'>
            {isTonic
              ? 'Delete Battery Tonic (Distilled Water)'
              : 'Delete Battery Item'}
          </h3>
          <p className='text-sm text-gray-500'>
            {isTonic
              ? 'Are you sure you want to delete this battery tonic (distilled water)? This action cannot be undone.'
              : 'Are you sure you want to delete this battery? This action cannot be undone.'}
          </p>
        </div>

        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <svg
                className='h-5 w-5 text-red-400'
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
              <h4 className='text-sm font-medium text-red-800'>
                {isTonic ? 'Battery Tonic to Delete' : 'Battery to Delete'}
              </h4>
              <div className='mt-2 text-sm text-red-700'>
                <p>
                  <strong>Brand:</strong> {deleteItem.brandName}
                </p>
                <p>
                  <strong>{isTonic ? 'Product:' : 'Battery:'}</strong>{' '}
                  {deleteItem.batteryName}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='flex flex-col gap-3 pt-4'>
          <Button
            className='h-12 w-full text-base font-medium focus:outline-none focus:ring-0'
            variant='fill'
            text={isTonic ? 'Delete Battery Tonic' : 'Delete Battery'}
            onClick={onConfirm}
            isPending={isLoading}
            disabled={isLoading}
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
          />
          <Button
            className='h-12 w-full text-base focus:outline-none focus:ring-0'
            variant='outline'
            text='Cancel'
            type='button'
            onClick={onClose}
          />
        </div>
      </div>
    </Modal>
  );
};

interface DeleteCategoryModalProps {
  isOpen: boolean;
  isLoading: boolean;
  categoryToDelete: {
    id: string;
    brandName: string;
    seriesCount: number;
  } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
  isOpen,
  isLoading,
  categoryToDelete,
  onClose,
  onConfirm,
}) => {
  if (!categoryToDelete) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Delete Category'
      size='small'
    >
      <div className='space-y-4'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <FaTrash className='h-8 w-8 text-red-600' />
          </div>
          <h3 className='mb-2 text-lg font-medium text-gray-900'>
            Delete Entire Category
          </h3>
          <p className='text-sm text-gray-500'>
            Are you sure you want to delete the entire{' '}
            <strong>{categoryToDelete.brandName}</strong> category? This will
            permanently remove {categoryToDelete.seriesCount} series item
            {categoryToDelete.seriesCount !== 1 ? 's' : ''} and cannot be
            undone.
          </p>
        </div>

        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <svg
                className='h-5 w-5 text-red-400'
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
              <h4 className='text-sm font-medium text-red-800'>
                Warning: Permanent Action
              </h4>
              <div className='mt-2 text-sm text-red-700'>
                <p>
                  <strong>Category:</strong> {categoryToDelete.brandName}
                </p>
                <p>
                  <strong>Total Series:</strong> {categoryToDelete.seriesCount}
                </p>
                <p className='mt-2 text-xs'>
                  This will delete all battery series associated with this
                  brand.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='flex flex-col gap-3 pt-4'>
          <Button
            className='h-12 w-full text-base font-medium focus:outline-none focus:ring-0'
            variant='fill'
            text={`Delete ${categoryToDelete.brandName} Category`}
            onClick={onConfirm}
            isPending={isLoading}
            disabled={isLoading}
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
          />
          <Button
            className='h-12 w-full text-base focus:outline-none focus:ring-0'
            variant='outline'
            text='Cancel'
            type='button'
            onClick={onClose}
            disabled={isLoading}
          />
        </div>
      </div>
    </Modal>
  );
};

export default DeleteModal;
