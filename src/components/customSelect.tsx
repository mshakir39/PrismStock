import React, { SelectHTMLAttributes } from 'react';

interface CustomSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  parentClass?: string;
  options?: Array<{ value: string; label: string; }>;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  parentClass,
  options = [],
  className = '',
  ...rest
}) => {
  return (
    <div className={`w-full ${parentClass}`}>
      {label && (
        <label className='mb-1 block text-sm font-medium text-gray-700'>
          {label}
        </label>
      )}
      <select
        className={`w-full rounded-md border border-gray-200 px-3 py-2 shadow-sm focus:border-[#193043] focus:outline-none focus:ring-1 focus:ring-[#193043] sm:text-sm ${className}`}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CustomSelect;
