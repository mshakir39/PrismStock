import React from 'react';
import Modal from './modal';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  details?: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = 'Error',
  message,
  details,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size='medium'>
      <div className='p-6'>
        <div className='mb-6 flex items-center gap-3'>
          <FaExclamationTriangle className='text-3xl text-red-500' />
          <h2 className='text-xl font-bold text-gray-800'>{title}</h2>
        </div>

        <div className='space-y-4'>
          <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
            <p className='font-medium text-red-700'>{message}</p>
            {details && (
              <details className='mt-3'>
                <summary className='cursor-pointer text-sm font-medium text-red-600'>
                  Show technical details
                </summary>
                <pre className='mt-2 overflow-auto rounded bg-red-100 p-2 text-xs text-red-600'>
                  {details}
                </pre>
              </details>
            )}
          </div>

          <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
            <h3 className='mb-2 font-semibold text-blue-800'>
              Troubleshooting Tips:
            </h3>
            <ul className='list-inside list-disc space-y-1 text-sm text-blue-700'>
              <li>Check if your printer is connected and turned on</li>
              <li>Verify the printer drivers are installed correctly</li>
              <li>Make sure the printer is not showing any error lights</li>
              <li>Try selecting a different printer in the print dialog</li>
            </ul>
          </div>
        </div>

        <div className='mt-8 flex justify-end'>
          <button
            onClick={onClose}
            className='rounded-lg bg-gray-600 px-6 py-2 text-white transition-colors hover:bg-gray-700'
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ErrorModal;
