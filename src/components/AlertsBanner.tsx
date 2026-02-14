import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface AlertsBannerProps {
  alerts: {
    lowStock: number;
    outOfStock: number;
    pendingPayments: number;
  };
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({ alerts }) => {
  const hasAlerts =
    alerts.lowStock > 0 || alerts.outOfStock > 0 || alerts.pendingPayments > 0;

  if (!hasAlerts) return null;

  return (
    <div className='mb-6 rounded-r-lg border-l-4 border-orange-400 bg-orange-50 p-4'>
      <div className='flex items-center'>
        <FaExclamationTriangle className='mr-3 text-orange-400' />
        <div>
          <h3 className='text-sm font-medium text-orange-800'>
            Attention Required
          </h3>
          <div className='mt-1 text-sm text-orange-700'>
            {alerts.lowStock > 0 && (
              <span className='mr-4'>
                • {alerts.lowStock} items low on stock
              </span>
            )}
            {alerts.outOfStock > 0 && (
              <span className='mr-4'>
                • {alerts.outOfStock} items out of stock
              </span>
            )}
            {alerts.pendingPayments > 0 && (
              <span>
                • Rs {alerts.pendingPayments.toLocaleString('en-PK')} pending
                payments
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
