import React, { ButtonHTMLAttributes, FunctionComponent } from 'react';
import { useFormStatus } from 'react-dom';

interface IButton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'fill' | 'outline';
  text: string;
  isPending?: boolean;
  icon?: React.ReactNode;
}

const Button: FunctionComponent<IButton> = ({
  variant,
  text,
  className = '',
  isPending,
  icon,
  ...rest
}) => {
  const { pending, data, action } = useFormStatus();

  const baseClasses =
    'flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 h-10';

  const variantClasses = {
    fill: 'bg-primaryMoreLight text-white hover:bg-primaryDark focus:ring-primaryMoreLight',
    outline:
      'border border-primaryMoreLight bg-white text-primaryMoreLight hover:bg-primaryMoreLight hover:text-white focus:ring-primaryMoreLight',
  };

  const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      type='button'
      disabled={pending || isPending}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
      {...rest}
    >
      {pending ||
        (isPending && (
          <svg
            className='-ml-1 mr-3 h-5 w-5 animate-spin text-white'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            ></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
        ))}
      {icon}
      <span className={` ${pending || isPending ? 'pl-2' : ''}`}>
        {pending || isPending ? ' Saving' : text}
      </span>
    </button>
  );
};

export default Button;
