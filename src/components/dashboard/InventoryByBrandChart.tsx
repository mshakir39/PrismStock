import React from 'react';
import { FaWarehouse } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface InventoryByBrandChartProps {
  data: Array<{
    brand: string;
    value: number;
    products: number;
  }>;
}

export const InventoryByBrandChart: React.FC<InventoryByBrandChartProps> = ({
  data,
}) => (
  <div className='rounded-xl border border-gray-200 bg-white p-6 shadow-sm'>
    <h3 className='mb-4 text-lg font-semibold text-gray-900'>
      Inventory Value by Brand
    </h3>
    {data.length > 0 ? (
      <ResponsiveContainer width='100%' height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='brand' />
          <YAxis />
          <Tooltip
            formatter={(value, name) => [
              name === 'Inventory Value'
                ? `Rs ${Number(value).toLocaleString()}`
                : value,
              name === 'Inventory Value' ? 'Inventory Value' : 'Product Count',
            ]}
          />
          <Legend />
          <Bar dataKey='value' fill='#0088FE' name='Inventory Value' />
          <Bar dataKey='products' fill='#00C49F' name='Product Count' />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div className='flex h-[300px] items-center justify-center text-gray-500'>
        <div className='text-center'>
          <FaWarehouse className='mx-auto mb-2 h-12 w-12 text-gray-300' />
          <p>No inventory data available</p>
        </div>
      </div>
    )}
  </div>
);
