import React from 'react';

interface CheckboxGroupProps {
  options: {
    id: string;
    value: string;
    label: string;
  }[];
  onChange: (values: string[]) => void;
  checkedValues?: string[];
}

// Alternative implementation using different event approach
const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  onChange,
  checkedValues = [],
}) => {
  const handleItemClick = (value: string) => {
    const safeCheckedValues = Array.isArray(checkedValues) ? checkedValues : [];
    const isCurrentlyChecked = safeCheckedValues.includes(value);

    const newValues = isCurrentlyChecked
      ? safeCheckedValues.filter((v) => v !== value)
      : [...safeCheckedValues, value];
    onChange(newValues);
  };

  const safeCheckedValues = Array.isArray(checkedValues) ? checkedValues : [];

  return (
    <div className='flex flex-row flex-wrap gap-x-4 gap-y-2'>
      {options.map((option) => {
        const isChecked = safeCheckedValues.includes(option.value);

        return (
          <div
            key={option.id}
            className='relative flex cursor-pointer items-center rounded border border-transparent px-2 py-2 hover:border-gray-200 hover:bg-gray-50'
            onClick={() => handleItemClick(option.value)}
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
            }}
          >
            {/* Visual checkbox - not a real input */}
            <div
              className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 transition-colors ${
                isChecked
                  ? 'border-[#193043] bg-[#193043] text-white'
                  : 'border-gray-300 bg-white hover:border-[#193043]'
              }`}
            >
              {isChecked && (
                <svg
                  className='h-3 w-3'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
              )}
            </div>
            <span className='ml-3 cursor-pointer text-sm font-medium text-gray-700'>
              {option.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default CheckboxGroup;
