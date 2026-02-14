import React, { TextareaHTMLAttributes } from 'react';

interface CustomTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  parentClass?: string;
}

const CustomTextarea: React.FC<CustomTextareaProps> = ({
  label,
  parentClass,
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
      <textarea
        className={`w-full rounded-md border border-gray-200 px-3 py-2 shadow-sm focus:border-[#193043] focus:outline-none focus:ring-1 focus:ring-[#193043] sm:text-sm resize-none ${className}`}
        {...rest}
      />
    </div>
  );
};

export default CustomTextarea;
