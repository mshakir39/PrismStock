// components/Table.tsx
import React from 'react';

interface TableProps<T> {
  data: T[];
  columns: {
    label: string;
    renderCell: (item: T, index: number) => React.ReactNode;
  }[];
  footerData: any;
}

const Table: React.FC<TableProps<any>> = ({ data, columns, footerData }) => {
  return (
    <table className='w-full border-collapse'>
      <thead>
        <tr className='bg-[#021B3B] text-white'>
          {columns?.map((column, index) => (
            <th key={index} className='p-4 text-lg font-bold'>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data?.map((row, rowIndex) => (
          <tr key={rowIndex} className='hover:bg-gray-100'>
            {columns?.map((column, index) => (
              <td key={index} className='border-b border-gray-200 p-4'>
                {column.renderCell(row, rowIndex)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className='bg-gray-100'>
          {columns?.map((column, index) => (
            <td key={index} className='p-4 text-lg font-bold'>
              {footerData[column.label]}
            </td>
          ))}
        </tr>
        {/* <tr className="bg-transparent text-white pt-12">
  
  {Array(columns?.length - 2).fill(null).map(() => (
    <td key={Math.random()} />
  ))}
  <td className="p-4 text-lg font-bold bg-[#021B3B]  ">Subtotal</td>
  <td className="p-4 text-lg font-bold bg-[#021B3B]">{footerData.totalPrice || 0}</td>
</tr> */}
      </tfoot>
    </table>
  );
};

export default Table;
