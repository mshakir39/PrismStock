'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface Category {
  id: string;
  _id?: string;
  name: string;
  parentCategory?: string;
  children?: Category[];
}

interface BreadcrumbItem {
  id: string;
  name: string;
  slug: string;
}

interface SelectedCategory {
  id: string;
  name: string;
  breadcrumb: BreadcrumbItem[];
}

interface SearchableCategoryDropdownProps {
  categories: Category[];
  value?: SelectedCategory | null;
  onChange: (category: SelectedCategory | null) => void;
  placeholder?: string;
}

export default function SearchableCategoryDropdown({
  categories,
  value,
  onChange,
  placeholder = "Type to search categories..."
}: SearchableCategoryDropdownProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Build category tree from flat list
  const categoryTree = useMemo(() => {
    const categoryMap = new Map<string, Category & { children: Category[] }>();
    const rootCategories: (Category & { children: Category[] })[] = [];

    // First pass: create map of all categories with empty children arrays
    categories.forEach(cat => {
      const id = cat.id || cat._id || '';
      categoryMap.set(id, { ...cat, children: [] });
    });

    // Second pass: build hierarchy
    categories.forEach(cat => {
      const id = cat.id || cat._id || '';
      const category = categoryMap.get(id);
      
      if (category && category.parentCategory) {
        const parent = categoryMap.get(category.parentCategory);
        if (parent) {
          parent.children.push(category);
        }
      } else if (category) {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }, [categories]);

  // Flatten categories for search with full paths
  const flattenedCategories = useMemo(() => {
    const flatten = (cats: Category[], path: Category[] = []): Array<{
      id: string;
      name: string;
      path: Category[];
      pathString: string;
    }> => {
      const result: Array<{
        id: string;
        name: string;
        path: Category[];
        pathString: string;
      }> = [];

      cats.forEach(cat => {
        const currentPath = [...path, cat];
        const pathString = currentPath.map(c => c.name).join(' > ');
        
        result.push({
          id: cat.id || cat._id || '',
          name: cat.name,
          path: currentPath,
          pathString
        });

        if (cat.children && cat.children.length > 0) {
          result.push(...flatten(cat.children, currentPath));
        }
      });

      return result;
    };

    return flatten(categoryTree);
  }, [categoryTree]);

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return flattenedCategories.slice(0, 10); // Show first 10 when no search
    }

    const term = searchTerm.toLowerCase();
    return flattenedCategories.filter(cat => 
      cat.name.toLowerCase().includes(term) || 
      cat.pathString.toLowerCase().includes(term)
    ).slice(0, 20); // Limit results
  }, [searchTerm, flattenedCategories]);

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Handle category selection
  const handleCategorySelect = (category: typeof flattenedCategories[0]) => {
    const breadcrumb: BreadcrumbItem[] = category.path.map(cat => ({
      id: cat.id || cat._id || '',
      name: cat.name,
      slug: generateSlug(cat.name)
    }));

    const selectedCategory: SelectedCategory = {
      id: category.id,
      name: category.name,
      breadcrumb
    };

    onChange(selectedCategory);
    setSearchTerm(category.name);
    setIsOpen(false);
  };

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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev < filteredCategories.length - 1 ? prev + 1 : 0;
          setTimeout(() => scrollIntoView(newIndex), 0);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : filteredCategories.length - 1;
          setTimeout(() => scrollIntoView(newIndex), 0);
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredCategories[highlightedIndex]) {
          handleCategorySelect(filteredCategories[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true);
  };

  // Handle input blur (delayed to allow click on results)
  const handleInputBlur = () => {
    setTimeout(() => setIsOpen(false), 200);
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
      const input = document.querySelector('input[placeholder*="search categories"]') as HTMLInputElement;
      if (input) {
        input.focus();
        setIsOpen(true);
      }
    }, 0);
  };

  // Reset highlighted index when search term changes or filtered categories change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm, filteredCategories]);

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
          type="text"
          className="w-full px-4 py-2 pr-20 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#193043] focus:border-[#193043] outline-none transition-colors bg-white text-gray-900 placeholder-gray-500"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
        />
        
        {/* Show clear button only when there's text in the input */}
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

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category, index) => (
              <div
                key={category.id}
                data-dropdown-item
                className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                  highlightedIndex === index 
                    ? 'bg-primaryMoreLight text-white' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleCategorySelect(category)}
              >
                <div className={`font-medium ${highlightedIndex === index ? 'text-white' : 'text-gray-900'}`}>
                  {category.name}
                </div>
                <div className={`text-sm mt-1 ${highlightedIndex === index ? 'text-gray-100' : 'text-gray-500'}`}>
                  {category.pathString}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              {searchTerm ? 'No categories found' : 'No categories available'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
