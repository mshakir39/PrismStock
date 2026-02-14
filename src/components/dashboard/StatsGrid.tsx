import React from 'react';
import { FaWarehouse, FaUsers } from 'react-icons/fa';
import { MdTrendingUp, MdAccountBalanceWallet } from 'react-icons/md';
import { StatsCard } from './StatsCard';

interface DateRange {
  start: Date;
  end: Date;
}

interface StatsGridProps {
  stats: {
    totalProducts: number;
    totalInventoryValue: number;
    totalRevenue: number;
    totalSales: number;
    totalProfit?: number;
    totalPending: number;
    totalCustomers: number;
  };
  revenueDateRange: DateRange;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  revenueDateRange,
}) => {
  const formatDateRange = (range: DateRange) => {
    const start = range.start.toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
    });
    const end = range.end.toLocaleDateString('en-PK', {
      month: 'short',
      day: 'numeric',
    });
    const diffTime = Math.abs(range.end.getTime() - range.start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `${diffDays}d (${start} - ${end})`;
  };

  const profitMargin =
    stats.totalRevenue > 0
      ? ((stats.totalProfit ?? 0) / stats.totalRevenue) * 100
      : 0;

  return (
    <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5'>
      <StatsCard
        title='Inventory Value'
        value={`Rs ${stats.totalInventoryValue.toLocaleString('en-PK')}`}
        subtitle={`${stats.totalProducts} products`}
        icon={<FaWarehouse className='h-6 w-6' />}
        iconBgColor='bg-blue-100'
        iconColor='text-blue-600'
      />

      <StatsCard
        title='Sales'
        value={`Rs ${stats.totalRevenue.toLocaleString('en-PK')}`}
        subtitle={`${stats.totalSales} sales • ${formatDateRange(revenueDateRange)}`}
        icon={<MdTrendingUp className='h-6 w-6' />}
        iconBgColor='bg-green-100'
        iconColor='text-green-600'
      />

      <StatsCard
        title='Profit'
        value={`Rs ${(stats.totalProfit ?? 0).toLocaleString('en-PK')}`}
        subtitle='Gross profit for selected period'
        extraInfo={`Profit Margin: ${profitMargin.toFixed(1)}%`}
        icon={<MdAccountBalanceWallet className='h-6 w-6' />}
        iconBgColor='bg-yellow-100'
        iconColor='text-yellow-600'
        valueColor='text-yellow-700'
      />

      <StatsCard
        title='Pending Payments'
        value={`Rs ${stats.totalPending.toLocaleString('en-PK')}`}
        subtitle='Outstanding amount'
        icon={<MdAccountBalanceWallet className='h-6 w-6' />}
        iconBgColor={stats.totalPending > 0 ? 'bg-orange-100' : 'bg-gray-100'}
        iconColor={stats.totalPending > 0 ? 'text-orange-600' : 'text-gray-600'}
        valueColor={
          stats.totalPending > 0 ? 'text-orange-600' : 'text-gray-900'
        }
      />

      <StatsCard
        title='Total Customers'
        value={stats.totalCustomers.toString()}
        subtitle='Active customers'
        icon={<FaUsers className='h-6 w-6' />}
        iconBgColor='bg-[#193043] bg-opacity-10'
        iconColor='text-[#193043]'
      />
    </div>
  );
};
