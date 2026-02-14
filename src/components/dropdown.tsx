import { FunctionComponent, ReactNode, useEffect, useState, useRef } from 'react';

export interface DropdownOption {
  label: string;
  value: any;
  icon?: ReactNode;
}

interface DropdownProps {
  className?: string;
  placeholder?: string;
  options: DropdownOption[];
  onSelect: (option: DropdownOption) => void;
  name?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  value?: DropdownOption | null;
}

const MAX_HEIGHT = 225;

const DropdownComponent: FunctionComponent<DropdownProps> = ({
  options,
  onSelect,
  placeholder = 'Options',
  name,
  className,
  defaultValue,
  disabled = false,
  required = false,
  value,
}) => {
  const [selectedOption, setSelectedOption] = useState<DropdownOption | null>(
    value ?? null
  );
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelectOption = (event: any, option: DropdownOption) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect(option);
    setSelectedOption(option);
    setInputValue(option.label);
    setIsOpen(false);
    setSearchValue('');
  };

  useEffect(() => {
    if (defaultValue) {
      const option = options.find(
        (opt) => opt.value === defaultValue || opt.label === defaultValue
      );
      if (option) {
        setSelectedOption(option);
        setInputValue(option.label);
      } else {
        setSelectedOption(null);
        setInputValue(defaultValue);
      }
    } else {
      setSelectedOption(null);
      setInputValue('');
    }
  }, [defaultValue, options]);

  useEffect(() => {
    if (value) {
      const option = options.find(
        (opt) => opt.value === value.value || opt.label === value.label
      );
      if (option) {
        setSelectedOption(option);
        setInputValue(option.label);
      }
    } else {
      setSelectedOption(null);
      setInputValue('');
    }
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative overflow-visible" ref={dropdownRef}>
      {/* Trigger */}
      <div
        className={`
          ${disabled && 'pointer-events-none cursor-no-drop text-gray-400'}
          inline-flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium
          ${selectedOption ? 'text-black' : 'text-gray-400'}
          hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
        `}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {selectedOption?.label ?? placeholder}
      </div>

      <input
        type="text"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        name={name}
        value={inputValue}
        required={required}
        readOnly
      />

      {isOpen && (
        <>
          {/* Dropdown */}
          <div
            className="absolute left-0 z-50 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black/5"
            style={{ maxHeight: MAX_HEIGHT }}
          >
            <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
              <input
                type="text"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="max-h-[180px] overflow-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={index}
                    name={name}
                    className="flex w-full items-center px-3 py-2 text-sm text-gray-900 hover:bg-gray-100"
                    onClick={(event) => handleSelectOption(event, option)}
                  >
                    {option.icon && <span className="mr-2">{option.icon}</span>}
                    {option.label}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No options found
                </div>
              )}
            </div>
          </div>

          {/* Spacer to prevent overlap */}
          <div style={{ height: MAX_HEIGHT + 8 }} />
        </>
      )}
    </div>
  );
};

export default DropdownComponent;
