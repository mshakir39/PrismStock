import React from 'react';

interface InvoiceTableProps<T> {
  data: T[];
  columns: {
    label: string;
    renderCell: (item: T, index: number) => React.ReactNode;
  }[];
  footerData: any;
}

const InvoiceTable: React.FC<InvoiceTableProps<any>> = ({
  data,
  columns,
  footerData,
}) => {
  // Add space to Amount in footerData
  const modifiedFooterData = {
    ...footerData,
    Amount: footerData['Amount']
      ? footerData['Amount'].replace('Rs', 'Rs\u00A0')
      : footerData['Amount'],
  };

  return (
    <div className='w-full'>
      {/* Mobile View - Card Layout */}
      <div className='block lg:hidden'>
        {data?.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className='mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm'
          >
            <div className='space-y-3'>
              <div className='flex items-center justify-between border-b pb-2'>
                <span className='font-bold text-gray-800'>
                  Item #{rowIndex + 1}
                </span>
                <span className='font-bold text-gray-800'>
                  Rs {row.totalPrice}
                </span>
              </div>
              <div className='text-sm text-gray-700'>
                <div className='font-medium'>
                  {columns[1].renderCell(row, rowIndex)}
                </div>
                <div className='text-gray-600'>Qty: {row.quantity}</div>
                <div className='text-gray-600'>
                  Price: Rs {row.productPrice}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View - Table Layout */}
      <div className='hidden overflow-x-auto lg:block'>
        <table className='w-full border-collapse'>
          <thead>
            <tr className='bg-[#021B3B] text-white'>
              {columns?.map((column, index) => (
                <th
                  key={index}
                  className='p-3 text-left text-sm font-bold md:p-4 md:text-base lg:text-lg'
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className='border-b border-gray-100 hover:bg-gray-50'
              >
                {columns?.map((column, index) => (
                  <td
                    key={index}
                    className='p-3 text-left text-sm text-gray-700 md:p-4 md:text-base'
                  >
                    {column.renderCell(row, rowIndex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className='bg-gray-100 font-bold'>
              {columns?.map((column, index) => (
                <td
                  key={index}
                  className='border-t-2 border-gray-300 p-3 text-left text-sm font-bold md:p-4 md:text-base lg:text-lg'
                >
                  {modifiedFooterData[column.label]}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;
