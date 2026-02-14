import React, { InputHTMLAttributes } from 'react';

interface CustomCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  parentClass?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  label,
  parentClass,
  className = '',
  ...rest
}) => {
  return (
    <div className={`flex items-center ${parentClass}`}>
      <input
        type="checkbox"
        className={`h-4 w-4 focus:ring-[#193043] border-gray-300 rounded ${className}`}
        style={{
          accentColor: '#193043', // This ensures the checkbox uses the brand color when checked
        }}
        {...rest}
      />
      {label && (
        <label className="ml-2 block text-sm text-gray-900">
          {label}
        </label>
      )}
    </div>
  );
};

export default CustomCheckbox;
