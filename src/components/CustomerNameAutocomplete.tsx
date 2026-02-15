'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getInvoices } from '@/actions/invoiceActions';

interface CustomerInfo {
  name: string;
  address?: string;
  contactNumber?: string;
}

interface CustomerNameAutocompleteProps {
  value: string;
  onChange: (e: {
    target: { name: string; value: string; customerInfo?: CustomerInfo };
  }) => void;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  minLength?: number;
  maxLength?: number;
}

const CustomerNameAutocomplete: React.FC<CustomerNameAutocompleteProps> = ({
  value,
  onChange,
  name,
  label,
  placeholder,
  required = false,
  readOnly = false,
  minLength,
  maxLength,
}) => {
  const [suggestions, setSuggestions] = useState<CustomerInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allCustomerInfo, setAllCustomerInfo] = useState<CustomerInfo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch all customer information from invoice data
  useEffect(() => {
    const fetchCustomerInfo = async () => {
      try {
        setIsLoading(true);
        const result = await getInvoices();
        const invoices = result.success ? result.data : [];

        // Ensure invoices is an array
        if (Array.isArray(invoices)) {
          // Create a map to store unique customers by mobile number
          const customerMap = new Map<string, CustomerInfo>();

          invoices.forEach((invoice: any) => {
            const customerName = invoice.customerName;
            const contactNumber = invoice.customerContactNumber;

            if (
              customerName &&
              customerName.trim() !== '' &&
              customerName !== '-'
            ) {
              // Use mobile number as unique identifier, fallback to name if no mobile
              const uniqueKey =
                contactNumber && contactNumber.trim() !== ''
                  ? contactNumber
                  : customerName;

              // Use the most recent invoice data for each customer
              if (
                !customerMap.has(uniqueKey) ||
                new Date(invoice.createdDate) >
                  new Date(customerMap.get(uniqueKey)?.name || '')
              ) {
                customerMap.set(uniqueKey, {
                  name: customerName,
                  address: invoice.customerAddress || '',
                  contactNumber: contactNumber || '',
                });
              }
            }
          });

          // Convert map to array and sort by name
          const customerInfoArray = Array.from(customerMap.values()).sort(
            (a, b) => a.name.localeCompare(b.name)
          );

          setAllCustomerInfo(customerInfoArray);
        } else {
          setAllCustomerInfo([]);
        }
      } catch (error) {
        setAllCustomerInfo([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerInfo();
  }, []);

  // Memoize filtered suggestions to prevent unnecessary re-renders
  const filteredSuggestions = useMemo(() => {
    if (value && value.length >= 2 && !readOnly) {
      return allCustomerInfo
        .filter((customer) =>
          customer.name.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 10); // Limit to 10 suggestions
    }
    return [];
  }, [value, allCustomerInfo, readOnly]);

  // Update suggestions when filtered suggestions change
  useEffect(() => {
    setSuggestions(filteredSuggestions);
    setShowSuggestions(filteredSuggestions.length > 0);
  }, [filteredSuggestions]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e);
    },
    [onChange]
  );

  // Handle suggestion selection
  const handleSuggestionClick = useCallback(
    (customer: CustomerInfo) => {
      onChange({
        target: {
          name,
          value: customer.name,
          customerInfo: customer,
        },
      });
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [onChange, name]
  );

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (value && value.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [value, suggestions.length]);

  // Handle input blur
  const handleInputBlur = useCallback((e: React.FocusEvent) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 150);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions) return;

      const currentIndex = suggestions.findIndex((s) => s.name === value);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex =
            currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
          onChange({
            target: {
              name,
              value: suggestions[nextIndex].name,
              customerInfo: suggestions[nextIndex],
            },
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex =
            currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
          onChange({
            target: {
              name,
              value: suggestions[prevIndex].name,
              customerInfo: suggestions[prevIndex],
            },
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (suggestions.length > 0) {
            setShowSuggestions(false);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    },
    [showSuggestions, suggestions, value, onChange, name]
  );

  return (
    <div className='relative'>
      <label className='mb-1 block text-sm font-medium text-gray-700'>
        {label}
        {required && <span className='ml-1 text-red-500'>*</span>}
      </label>

      <div className='relative'>
        <input
          ref={inputRef}
          type='text'
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          minLength={minLength}
          maxLength={maxLength}
          className={`w-full rounded-md border border-gray-200 px-3 py-2 shadow-sm focus:border-[#193043] focus:outline-none focus:ring-1 focus:ring-[#193043] ${
            readOnly ? 'cursor-not-allowed bg-gray-100' : 'bg-white'
          }`}
        />

        {isLoading && (
          <div className='absolute right-3 top-1/2 -translate-y-1/2 transform'>
            <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-blue-500'></div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className='absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg'
        >
          {suggestions.map((customer, index) => (
            <div
              key={index}
              className='cursor-pointer border-b border-gray-100 px-3 py-3 last:border-b-0 hover:bg-blue-50'
              onClick={() => handleSuggestionClick(customer)}
            >
              <div className='text-sm font-medium text-gray-900'>
                {customer.name}
              </div>
              {customer.address && (
                <div className='mt-1 flex items-center gap-1 text-xs text-gray-600'>
                  <svg
                    className='h-3 w-3 text-gray-500'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
                      clipRule='evenodd'
                    />
                  </svg>
                  {customer.address}
                </div>
              )}
              {customer.contactNumber && (
                <div className='flex items-center gap-1 text-xs text-gray-600'>
                  <svg
                    className='h-3 w-3 text-gray-500'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path d='M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z' />
                  </svg>
                  {customer.contactNumber}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerNameAutocomplete;
