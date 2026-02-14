import React, { useState } from 'react';
import Modal from './modal';
import { BsPrinter } from 'react-icons/bs';

interface PrinterInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const PrinterInstructionsModal: React.FC<PrinterInstructionsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Thermal Printer Instructions'
      size='medium'
    >
      <div className='p-6'>
        <div className='mb-6 flex items-center gap-3'>
          <BsPrinter className='text-3xl text-blue-600' />
          <h2 className='text-xl font-bold text-gray-800'>
            Print to Thermal Printer
          </h2>
        </div>

        <div className='space-y-4'>
          <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
            <h3 className='mb-3 font-semibold text-blue-800'>
              Before Printing:
            </h3>
            <ol className='list-inside list-decimal space-y-2 text-blue-700'>
              <li>
                Make sure your Bixolon thermal printer is connected and turned
                on
              </li>
              <li>Ensure the printer has paper loaded</li>
              <li>Check that the printer is not showing any error lights</li>
            </ol>
          </div>

          <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
            <h3 className='mb-3 font-semibold text-green-800'>
              In the Print Dialog:
            </h3>
            <ol className='list-inside list-decimal space-y-2 text-green-700'>
              <li>
                Select your <strong>Bixolon thermal printer</strong> from the
                printer list
              </li>
              <li>
                Set paper size to <strong>80mm</strong> or{' '}
                <strong>Thermal Receipt</strong>
              </li>
              <li>
                Make sure margins are set to <strong>0</strong> or{' '}
                <strong>Minimum</strong>
              </li>
              <li>
                Click <strong>Print</strong> to start printing
              </li>
            </ol>
          </div>

          <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
            <h3 className='mb-3 font-semibold text-yellow-800'>
              Troubleshooting:
            </h3>
            <ul className='list-inside list-disc space-y-1 text-yellow-700'>
              <li>
                If printer doesn&apos;t appear, check USB connection and drivers
              </li>
              <li>If print is too wide, select 80mm paper size</li>
              <li>If nothing prints, check printer status and paper</li>
            </ul>
          </div>
        </div>

        <div className='mt-8 flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50'
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if (isPrinting) return;
              setIsPrinting(true);
              try {
                await onConfirm();
                onClose();
              } catch (error) {
              } finally {
                setIsPrinting(false);
              }
            }}
            disabled={isPrinting}
            className='flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <BsPrinter className='text-lg' />
            {isPrinting ? 'Printing...' : 'Start Printing'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PrinterInstructionsModal;
