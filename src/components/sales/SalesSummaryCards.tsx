import React from 'react';

interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  avgSaleValue: number;
  uniqueCustomers: number;
}

interface SalesSummaryCardsProps {
  salesSummary: SalesSummary;
}

const SalesSummaryCards: React.FC<SalesSummaryCardsProps> = ({
  salesSummary,
}) => {
  const cards = [
    {
      title: 'Total Sales',
      value: salesSummary.totalSales.toString(),
      icon: (
        <svg
          className='h-6 w-6 text-blue-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
          />
        </svg>
      ),
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Revenue',
      value: `Rs ${salesSummary.totalRevenue.toLocaleString()}`,
      icon: (
        <svg
          className='h-6 w-6 text-green-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
          />
        </svg>
      ),
      bgColor: 'bg-green-100',
    },
    {
      title: 'Avg Sale Value',
      value: `Rs ${Math.round(salesSummary.avgSaleValue).toLocaleString()}`,
      icon: (
        <svg
          className='h-6 w-6 text-[#193043]'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
          />
        </svg>
      ),
      bgColor: 'bg-[#193043] bg-opacity-10',
    },
    {
      title: 'Unique Customers',
      value: salesSummary.uniqueCustomers.toString(),
      icon: (
        <svg
          className='h-6 w-6 text-orange-600'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
          />
        </svg>
      ),
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {cards.map((card, index) => (
        <div
          key={index}
          className='rounded-lg border border-gray-200 bg-white p-4'
        >
          <div className='flex items-center'>
            <div className={`p-2 ${card.bgColor} rounded-lg`}>{card.icon}</div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>{card.title}</p>
              <p className='text-2xl font-bold text-gray-900'>{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SalesSummaryCards;
