'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { IoCalendarOutline } from 'react-icons/io5';
import { IoIosArrowUp, IoIosArrowDown } from 'react-icons/io';
import { RiFilter2Fill } from 'react-icons/ri';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';

interface DateRange {
  start: Date;
  end: Date;
}

interface PresetRange {
  label: string;
  value: string;
  getRange: () => [Date, Date];
}

interface DateRangePickerProps {
  onDateChange: (range: DateRange) => void;
  initialDateRange?: DateRange;
  className?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  onDateChange,
  initialDateRange,
  className = '',
}) => {
  // CRITICAL: Prevent any automatic parent notifications
  const hasInitialized = useRef(false);
  const parentNotificationAllowed = useRef(false);

  // Create stable initial range
  const getInitialRange = (): [Date, Date] => {
    if (initialDateRange) {
      return [new Date(initialDateRange.start), new Date(initialDateRange.end)];
    }
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return [start, end];
  };

  // Component state - NEVER triggers parent on init
  const [showDropdown, setShowDropdown] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [selectedRange, setSelectedRange] = useState<string>('');
  const [currentRange, setCurrentRange] =
    useState<[Date, Date]>(getInitialRange());

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const flatpickrRef = useRef<any>(null);

  // STABLE preset ranges
  const presetRanges: PresetRange[] = [
    {
      label: 'TODAY',
      value: 'today',
      getRange: () => {
        const now = new Date();
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0
        );
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59
        );
        return [start, end];
      },
    },
    {
      label: 'YESTERDAY',
      value: 'yesterday',
      getRange: () => {
        const now = new Date();
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1,
          0,
          0,
          0
        );
        const end = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 1,
          23,
          59,
          59
        );
        return [start, end];
      },
    },
    {
      label: 'LAST 7 DAYS',
      value: 'last7',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return [start, end];
      },
    },
    {
      label: 'LAST 30 DAYS',
      value: 'last30',
      getRange: () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return [start, end];
      },
    },
    {
      label: 'CURRENT MONTH',
      value: 'currentMonth',
      getRange: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        const end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        return [start, end];
      },
    },
  ];

  // STABLE formatters
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const displayValue = `${formatDate(currentRange[0])} - ${formatDate(currentRange[1])}`;

  // ONE-TIME initialization effect - NEVER notifies parent automatically
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // DO NOT notify parent on mount - let the dashboard handle initial load
      // onDateChange({
      //   start: currentRange[0],
      //   end: currentRange[1],
      // });
    }
  }, []); // EMPTY dependency array - runs once

  // Handle custom date selection from Flatpickr
  const handleCustomDateChange = useCallback(
    (selectedDates: Date[]) => {
      if (selectedDates.length === 2) {
        const [start, end] = selectedDates;
        // Ensure proper time settings
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        setCurrentRange([start, end]);
        setSelectedRange(''); // Clear preset selection

        // Notify parent immediately
        onDateChange({
          start,
          end,
        });
      }
    },
    [onDateChange]
  );

  // Handle preset selection
  const handlePresetSelect = (range: PresetRange) => {
    const [start, end] = range.getRange();
    setSelectedRange(range.label);
    setCurrentRange([start, end]);

    // Update Flatpickr to reflect the new dates
    if (flatpickrRef.current?.flatpickr) {
      flatpickrRef.current.flatpickr.setDate([start, end], true);
    }

    // Notify parent immediately
    onDateChange({
      start,
      end,
    });

    // Close dropdown
    setTimeout(() => setShowDropdown(false), 100);
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // UI handlers
  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const toggleInput = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInput((prev) => !prev);
  }, []);

  // Flatpickr options - stable configuration
  const flatpickrOptions = {
    mode: 'range' as const,
    dateFormat: 'd.m.Y',
    defaultDate: currentRange,
    onChange: handleCustomDateChange,
    minDate: '2000-01-01',
    maxDate: new Date(),
    static: true,
  };

  return (
    <div className={`relative w-fit ${className}`} ref={containerRef}>
      <div
        className='inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#e5e7eb] bg-white px-4 py-2 transition-colors hover:bg-gray-50'
        onClick={toggleDropdown}
      >
        <IoCalendarOutline className='h-5 w-5 text-gray-500' />
        <span className='text-sm text-gray-600'>{displayValue}</span>
      </div>

      {showDropdown && (
        <div className='absolute top-full z-[100] mt-2 w-64 overflow-visible rounded-lg border border-gray-200 bg-white shadow-lg'>
          <div className='p-4'>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='font-medium text-gray-700'>
                Filter by date range
              </h3>
              <button
                onClick={toggleInput}
                className='rounded-full bg-blue-500 p-1 transition-colors hover:bg-blue-600'
                type='button'
              >
                {showInput ? (
                  <IoIosArrowUp className='h-4 w-4 text-white' />
                ) : (
                  <IoIosArrowDown className='h-4 w-4 text-white' />
                )}
              </button>
            </div>

            {/* Custom Date Input */}
            {showInput && (
              <div className='relative mb-4'>
                <Flatpickr
                  ref={flatpickrRef}
                  options={flatpickrOptions}
                  value={currentRange}
                  className='block w-full rounded-lg bg-gray-50 py-2 pl-3 pr-10 text-sm text-gray-600 transition-colors focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500'
                />
                <IoCalendarOutline className='pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
              </div>
            )}

            {/* Preset Ranges */}
            <div className='space-y-1'>
              {presetRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handlePresetSelect(range)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-blue-50 ${
                    selectedRange === range.label
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700'
                  }`}
                  type='button'
                >
                  <RiFilter2Fill
                    className={`h-4 w-4 flex-shrink-0 ${
                      selectedRange === range.label
                        ? 'text-blue-500'
                        : 'text-gray-400'
                    }`}
                  />
                  <span className='text-sm font-medium'>{range.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
