import React, { useCallback, useMemo } from 'react';
import { FaPlus } from 'react-icons/fa6';

import CheckboxGroup from '@/components/checkboxGroup';
import Input from '@/components/customInput';

const options = [
  { id: 'Cash', value: 'Cash', label: 'Cash' },
  { id: 'Card', value: 'Card', label: 'Card' },
  { id: 'Old Battery', value: 'Old Battery', label: 'Old Battery' },
  { id: 'Easy Paisa', value: 'Easy Paisa', label: 'Easy Paisa' },
  { id: 'Jazz Cash', value: 'Jazz Cash', label: 'Jazz Cash' },
  { id: 'Bank', value: 'Bank', label: 'Bank' },
  { id: 'Cheque', value: 'Cheque', label: 'Cheque' },
  { id: 'Pay Later', value: 'Pay Later', label: 'Pay Later' },
  { id: 'Other', value: 'Other', label: 'Other' },
];

interface PaymentSectionProps {
  invoiceData: any;
  onChange: (e: any) => void;
  setInvoiceData: (data: any) => void;
  accordionData: any;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  invoiceData,
  onChange,
  setInvoiceData,
  accordionData,
}) => {
  // Calculate total amount from all products
  const totalAmount = useMemo(() => {
    // For payment-only scenarios, use the remaining amount from invoice data
    if (
      invoiceData?.isPaymentOnly &&
      invoiceData?.remainingAmount !== undefined
    ) {
      return invoiceData.remainingAmount;
    }

    return Object.values(accordionData).reduce((total: number, row: any) => {
      const price = parseFloat(String(row.productPrice)) || 0;
      const quantity = parseInt(String(row.quantity)) || 0;
      return total + price * quantity;
    }, 0);
  }, [accordionData, invoiceData?.isPaymentOnly, invoiceData?.remainingAmount]);

  const handleCheckboxChange = useCallback(
    (values: string[]) => {
      // FIXED: More robust state update with validation
      setInvoiceData((prev: any) => {
        const newState = {
          ...prev,
          paymentMethod: values,
        };
        return newState;
      });
    },
    [setInvoiceData]
  );

  const handleAddTotalAmount = useCallback(() => {
    setInvoiceData((prev: any) => ({
      ...prev,
      receivedAmount: totalAmount.toString(),
    }));
  }, [setInvoiceData, totalAmount]);

  // FIXED: Ensure paymentMethod is always an array
  const currentPaymentMethods = Array.isArray(invoiceData?.paymentMethod)
    ? invoiceData.paymentMethod
    : [];

  return (
    <>
      <div className='flex flex-col gap-2'>
        <span className='text-sm font-medium text-gray-700'>
          Payment Method: <span className='text-red-500'>*</span>
        </span>
        <div className='rounded-md bg-gray-50 p-4'>
          <CheckboxGroup
            options={options}
            onChange={handleCheckboxChange}
            checkedValues={currentPaymentMethods}
          />
        </div>
      </div>

      <div className='flex w-full'>
        {currentPaymentMethods.includes('Old Battery') && (
          <div className='flex w-full gap-2'>
            <div className='mt-1 w-full'>
              <Input
                type='text'
                label='Battery Count and Weight'
                name='batteriesCountAndWeight'
                value={invoiceData?.batteriesCountAndWeight || ''}
                maxLength={50}
                onChange={onChange}
                placeholder='e.g., 21kg, 2 batteries'
              />
            </div>
            <div className='mt-1 w-full'>
              <Input
                type='number'
                label='Batteries Total Rate'
                name='batteriesRate'
                value={invoiceData?.batteriesRate || ''}
                min={0}
                step='0.01'
                onChange={onChange}
              />
            </div>
          </div>
        )}
      </div>

      <div className='mt-1'>
        <div className='mb-2 flex items-center gap-4'>
          <span className='text-sm font-medium text-gray-600'>
            Total Amount: Rs {totalAmount.toFixed(2)}
          </span>
          <button
            type='button'
            onClick={handleAddTotalAmount}
            className='flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-[#193043] text-white transition-colors duration-200 hover:bg-[#1e3a5f]'
            title='Add total amount to received amount'
          >
            <FaPlus className='text-xs' />
          </button>
        </div>

        {currentPaymentMethods.includes('Pay Later') && (
          <div className='mb-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3'>
            <p className='text-sm text-yellow-800'>
              💡 <strong>Pay Later:</strong> Customer can pay any amount now and
              the remaining balance can be paid later using the &quot;Add
              Payment&quot; button.
            </p>
          </div>
        )}

        <Input
          type='number'
          label='Amount Received'
          name='receivedAmount'
          value={invoiceData?.receivedAmount || ''}
          min={0}
          max={totalAmount}
          step='0.01'
          onChange={onChange}
          placeholder={`Max: Rs ${totalAmount.toFixed(2)}`}
        />
      </div>
    </>
  );
};

export default PaymentSection;
