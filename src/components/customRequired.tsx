import React from 'react';

function CustomRequired({ children, isRequired = true, value }: any) {
  const inputClass = isRequired ? 'required' : '';

  return (
    <div className={inputClass}>
      <input type='hidden' value={value} required={isRequired} />

      {React.cloneElement(children, { required: isRequired })}
    </div>
  );
}

export default CustomRequired;
