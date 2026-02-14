import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  extraInfo?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  valueColor?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  extraInfo,
  icon,
  iconBgColor,
  iconColor,
  valueColor = 'text-gray-900',
}) => (
  <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md'>
    <div className='flex items-center justify-between'>
      <div>
        <p className='text-sm font-medium text-gray-600'>{title}</p>
        <h3 className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</h3>
        {subtitle && <p className='mt-1 text-sm text-gray-500'>{subtitle}</p>}
        {extraInfo && (
          <p className='mt-1 text-xs text-yellow-600'>{extraInfo}</p>
        )}
      </div>
      <div className={`rounded-lg p-3 ${iconBgColor}`}>
        <div className={iconColor}>{icon}</div>
      </div>
    </div>
  </div>
);
