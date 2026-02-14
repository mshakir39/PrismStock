'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Product } from '@/interfaces';

interface BreadcrumbItem {
  id: string;
  name: string;
  slug: string;
}

interface SelectedProduct {
  id: string;
  name: string;
  category: any;
  breadcrumb: BreadcrumbItem[];
}

interface SearchableProductDropdownProps {
  products: Product[];
  value?: SelectedProduct | null;
  onChange: (product: SelectedProduct | null) => void;
  placeholder?: string;
}

export default function SearchableProductDropdown({
  products,
  value,
  onChange,
  placeholder = "Type to search products..."
}: SearchableProductDropdownProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 40, left: 0, width: 0 });

  // Flatten products with breadcrumb info for search
  const flattenedProducts = useMemo(() => {
    return products.map(product => {
      // Use existing breadcrumb if available, otherwise generate from category
      let breadcrumb: BreadcrumbItem[] = [];
      let breadcrumbString = '';
      
      if (product.category?.breadcrumb && Array.isArray(product.category.breadcrumb)) {
        // Use existing breadcrumb from product category data
        breadcrumb = product.category.breadcrumb;
        breadcrumbString = breadcrumb.map(item => item.name).join(' > ');
      } else if (product.breadcrumb && Array.isArray(product.breadcrumb)) {
        // Use existing breadcrumb from product data (fallback)
        breadcrumb = product.breadcrumb;
        breadcrumbString = breadcrumb.map(item => item.name).join(' > ');
      } else if (product.category) {
        // Generate breadcrumb from category object
        breadcrumb = [{
          id: product.category.id || product.category._id || '',
          name: product.category.brandName || product.category.name || 'Unknown Category',
          slug: (product.category.brandName || product.category.name || 'unknown').toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        }];
        breadcrumbString = breadcrumb[0].name;
      }
      
      return {
        id: product.id || product._id || '',
        name: product.name,
        category: product.category,
        breadcrumb,
        breadcrumbString,
        description: product.description || '',
        price: product.price || 0
      };
    });
  }, [products]);

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return flattenedProducts.slice(0, 10); // Show first 10 when no search
    }

    const term = searchTerm.toLowerCase();
    return flattenedProducts.filter(product => 
      product.name.toLowerCase().includes(term) || 
      product.breadcrumbString.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term)
    ).slice(0, 20); // Limit results
  }, [searchTerm, flattenedProducts]);

  // Scroll highlighted item into view
  const scrollIntoView = (index: number) => {
    if (!dropdownRef.current) return;
    
    const dropdown = dropdownRef.current;
    const items = dropdown.querySelectorAll('[data-dropdown-item]');
    const highlightedItem = items[index] as HTMLElement;
    
    if (highlightedItem) {
      highlightedItem.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  };

  // Handle product selection
  const handleProductSelect = (product: typeof flattenedProducts[0]) => {
    const selectedProduct: SelectedProduct = {
      id: product.id,
      name: product.name,
      category: product.category,
      breadcrumb: product.breadcrumb
    };

    onChange(selectedProduct);
    setSearchTerm(product.name);
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      updateDropdownPosition();
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev < filteredProducts.length - 1 ? prev + 1 : 0;
          setTimeout(() => scrollIntoView(newIndex), 0);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : filteredProducts.length - 1;
          setTimeout(() => scrollIntoView(newIndex), 0);
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredProducts[highlightedIndex]) {
          handleProductSelect(filteredProducts[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Update dropdown position
  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY+4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
    updateDropdownPosition();
  };

  // Handle input blur (delayed to allow click on results)
  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Clear selection and input
  const handleClear = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    onChange(null);
    setSearchTerm('');
    
    // Keep dropdown open and focus input
    setTimeout(() => {
      inputRef.current?.focus();
      setIsOpen(true);
      updateDropdownPosition();
    }, 0);
  };

  // Reset highlighted index when search term changes or filtered products change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm, filteredProducts]);

  // Update position on scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      updateDropdownPosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  // Update position on window resize
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      updateDropdownPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Update input when value changes from parent
  useEffect(() => {
    if (value) {
      setSearchTerm(value.name);
    } else {
      setSearchTerm('');
    }
  }, [value]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full px-4 py-2 pr-20 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#193043] focus:border-[#193043] outline-none transition-colors bg-white text-gray-900 placeholder-gray-500"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
        />
        
        {/* FIXED: Show clear button only when there's text in the input */}
        {searchTerm && (
          <button
            type="button"
            onMouseDown={(e) => {
              // Prevent input blur before click is processed
              e.preventDefault();
            }}
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="absolute z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <div
                key={product.id}
                data-dropdown-item
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                  highlightedIndex === index 
                    ? 'bg-primaryMoreLight text-white' 
                    : 'hover:bg-gray-50 text-gray-900'
                }`}
                onClick={() => handleProductSelect(product)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className={`font-medium ${highlightedIndex === index ? 'text-white' : 'text-gray-900'}`}>
                      {product.name}
                    </div>
                    {product.breadcrumbString && (
                      <div className={`text-sm mt-1 ${highlightedIndex === index ? 'text-gray-100' : 'text-gray-500'}`}>
                        {product.breadcrumbString}
                      </div>
                    )}
                    {product.description && (
                      <div className={`text-xs mt-1 ${highlightedIndex === index ? 'text-gray-200' : 'text-gray-400'}`}>
                        {product.description.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                  {product.price > 0 && (
                    <div className={`text-sm font-medium ml-3 ${highlightedIndex === index ? 'text-white' : 'text-gray-900'}`}>
                      ${product.price.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              {searchTerm ? 'No products found' : 'No products available'}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}