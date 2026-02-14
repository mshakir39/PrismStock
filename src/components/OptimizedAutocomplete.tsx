'use client';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

interface AutocompleteOption {
  id: string | number;
  label: string;
  value: any;
  [key: string]: any;
}

interface OptimizedAutocompleteProps {
  options: AutocompleteOption[];
  value?: AutocompleteOption | null;
  onSelect: (option: AutocompleteOption) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxHeight?: number;
}

const OptimizedAutocomplete: React.FC<OptimizedAutocompleteProps> = ({
  options,
  value,
  onSelect,
  placeholder = 'Select option...',
  className = '',
  disabled = false,
  required = false,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found',
  maxHeight = 200,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isKeyboardNavigation = useRef(false);

  const filteredOptions = useMemo(() => {
    if (!searchValue.trim()) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [options, searchValue]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filteredOptions]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setIsOpen(true);
  }, []);

  const handleOptionSelect = useCallback((option: AutocompleteOption) => {
    onSelect(option);
    setSearchValue('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  }, [onSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    isKeyboardNavigation.current = true;

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, filteredOptions, highlightedIndex, handleOptionSelect]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (
      highlightedIndex >= 0 &&
      dropdownRef.current &&
      isKeyboardNavigation.current
    ) {
      const highlightedElement =
        dropdownRef.current.children[highlightedIndex] as HTMLElement;

      highlightedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  return (
    <div className={`relative ${className}`} style={{ zIndex: 9999 }}>
      <div className='relative'>
        <input
          ref={inputRef}
          type='text'
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={searchPlaceholder}
          disabled={disabled}
          required={required}
          className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#193043] focus:outline-none focus:ring-1 focus:ring-[#193043] disabled:cursor-not-allowed disabled:bg-gray-100'
        />

      {value && !searchValue && (
        <span className='pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-900'>
          {value.label}
        </span>
      )}

        <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
          </svg>
        </div>
      </div>

  {isOpen && (
  <>
    <div
      ref={dropdownRef}
      className="absolute left-0 right-0 mt-1 overflow-auto rounded-md border border-gray-200 bg-white shadow-xl z-[50]"
      style={{ maxHeight }}
    >
      {filteredOptions.length > 0 ? (
        filteredOptions.map((option, index) => (
          <div
            key={option.id}
            className={`cursor-pointer px-3 py-2 text-sm ${
              index === highlightedIndex
                ? 'bg-gray-100'
                : 'hover:bg-gray-50'
            }`}
            onMouseMove={() => {
              isKeyboardNavigation.current = false;
              setHighlightedIndex(index);
            }}
            onClick={() => handleOptionSelect(option)}
          >
            {option.label}
          </div>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-gray-500">
          {emptyMessage}
        </div>
      )}
    </div>

    {/* Spacer to prevent overlap */}
    {/* <div style={{ height: maxHeight + 0}} /> */}
  </>
)}

    </div>
  );
};

export default OptimizedAutocomplete;
