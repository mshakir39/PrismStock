import React, { useState } from 'react';
import { Table, Column, HeaderCell, Cell } from 'rsuite-table';
import { FaSearch } from 'react-icons/fa';
import Button from './button';

interface Props<T extends Record<string, unknown>> {
  columns: {
    header: string;
    dataKey: string;
    width?: number;
  }[];
  data: T[];
  searchParentClassName?: string;
  tableParentClassName?: string;
  buttonOnClick?: () => void;
  buttonTitle?: string;
  showButton?: boolean;
}

const RsuiteTable: React.FC<Props<any>> = ({
  columns,
  data,
  searchParentClassName,
  buttonOnClick,
  tableParentClassName,
  buttonTitle = 'Create',
  showButton = true,
}) => {
  const [search, setSearch] = useState<string>('');

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const filteredData = data.filter((item) => {
    return Object.values(item).some((value: any) => {
      return value.toString().includes(search);
    });
  });

  return (
    <div className={`flex w-full flex-col px-4 ${tableParentClassName}`}>
      <div className='mt-6 flex items-center justify-between'>
        <div className={`relative ${searchParentClassName}`}>
          <input
            className='h-10  w-full  rounded-xl p-4 outline-none'
            placeholder='Enter to Search'
            style={{
              boxShadow:
                'rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px',
            }}
            id='search'
            type='text'
            value={search}
            onChange={handleSearch}
          />
          <FaSearch className='absolute bottom-3 right-3 text-[#193043]' />
        </div>
        {showButton && (
          <Button
            className='my-2'
            variant='fill'
            text={buttonTitle}
            onClick={buttonOnClick}
          ></Button>
        )}
      </div>

      <br />
      {data && data.length > 0 ? (
        <Table height={400} autoHeight affixHeader data={filteredData}>
          {columns.map((column, index) => (
            <Column width={column.width} resizable sortable key={index}>
              <HeaderCell>{column.header}</HeaderCell>
              <Cell dataKey={column.dataKey} />
            </Column>
          ))}
        </Table>
      ) : (
        <div className='flex w-full justify-center'>No Data Found</div>
      )}
    </div>
  );
};

export default RsuiteTable;
