import React from 'react';
import { format, isValid } from 'date-fns';

interface WarrantyDetailsProps {
  warranty: {
    productName: string;
    category?: any;
    breadcrumb?: any[];
    warrentyStartDate: string;
    warrentyDuration: number;
    warrentyCode: string;
    customerName: string;
    customerContactNumber: string;
    invoiceNumber: string;
    saleDate: string;
  };
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return isValid(date) ? format(date, 'dd MMM yyyy') : 'Invalid Date';
};

const WarrantyDetails: React.FC<WarrantyDetailsProps> = ({ warranty }) => {
  const startDate = new Date(warranty.warrentyStartDate);
  const endDate = isValid(startDate) ? new Date(startDate) : new Date();

  if (isValid(startDate)) {
    endDate.setMonth(endDate.getMonth() + warranty.warrentyDuration);
  }

  const isExpired = isValid(endDate) && endDate < new Date();
  const daysRemaining = isValid(endDate)
    ? Math.ceil(
        (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className='rounded-lg bg-white p-6 shadow-md'>
      <div className='mb-6'>
        <h2 className='mb-2 text-xl font-semibold'>Warranty Status</h2>
        <div
          className={`inline-block rounded-full px-4 py-2 ${
            isExpired
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {isExpired ? 'Expired' : `${daysRemaining} days remaining`}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        <div>
          <h3 className='mb-4 font-semibold'>Product Information</h3>
          <div className='space-y-2'>
            <p>
              <span className='text-gray-600'>Product:</span>{' '}
              {warranty.productName}
            </p>
            {warranty.category && (
              <p>
                <span className='text-gray-600'>Category:</span>{' '}
                {typeof warranty.category === 'object' && warranty.category.name 
                  ? warranty.category.name 
                  : warranty.category}
              </p>
            )}
            {warranty.breadcrumb && Array.isArray(warranty.breadcrumb) && warranty.breadcrumb.length > 0 && (
              <p>
                <span className='text-gray-600'>Category Path:</span>{' '}
                <span className='text-blue-600'>
                  {warranty.breadcrumb.map((crumb: any, index: number) => (
                    <span key={index}>
                      {crumb.name}
                      {index < warranty.breadcrumb.length - 1 && ' > '}
                    </span>
                  ))}
                </span>
              </p>
            )}
            <p>
              <span className='text-gray-600'>Warranty Code:</span>{' '}
              {warranty.warrentyCode}
            </p>
          </div>
        </div>

        <div>
          <h3 className='mb-4 font-semibold'>Warranty Period</h3>
          <div className='space-y-2'>
            <p>
              <span className='text-gray-600'>Start Date:</span>{' '}
              {formatDate(warranty.warrentyStartDate)}
            </p>
            <p>
              <span className='text-gray-600'>End Date:</span>{' '}
              {isValid(endDate)
                ? formatDate(endDate.toISOString())
                : 'Invalid Date'}
            </p>
            <p>
              <span className='text-gray-600'>Duration:</span>{' '}
              {warranty.warrentyDuration} months
            </p>
          </div>
        </div>

        <div>
          <h3 className='mb-4 font-semibold'>Customer Information</h3>
          <div className='space-y-2'>
            <p>
              <span className='text-gray-600'>Name:</span>{' '}
              {warranty.customerName}
            </p>
            <p>
              <span className='text-gray-600'>Contact:</span>{' '}
              {warranty.customerContactNumber}
            </p>
            <p>
              <span className='text-gray-600'>Invoice:</span>{' '}
              {warranty.invoiceNumber}
            </p>
            <p>
              <span className='text-gray-600'>Purchase Date:</span>{' '}
              {formatDate(warranty.saleDate)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarrantyDetails;
