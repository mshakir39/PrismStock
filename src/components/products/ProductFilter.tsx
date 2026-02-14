'use client';

import React from 'react';

interface ProductFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: any[];
  showCategoryDropdown: boolean;
  setShowCategoryDropdown: (show: boolean) => void;
}

export default function ProductFilter({
  selectedCategory,
  onCategoryChange,
  categories,
  showCategoryDropdown,
  setShowCategoryDropdown
}: ProductFilterProps) {
  
  const buildCategoryHierarchy = (categories: any[]): any[] => {
    const parentCategories = categories.filter(cat => !cat.parentCategory);
    
    return parentCategories.map(parent => {
      const children = categories.filter(cat => cat.parentCategory === (parent._id || parent.id));
      return {
        ...parent,
        children: children.map(child => ({
          ...child,
          displayName: `${parent.name} > ${child.name}` 
        }))
      };
    });
  };

  const getHierarchicalCategories = () => {
    const hierarchy = buildCategoryHierarchy(categories);
    const flatList: any[] = [];
    
    hierarchy.forEach(parent => {
      flatList.push({
        ...parent,
        displayName: parent.name,
        value: parent._id || parent.id,
        isParent: true
      });
      
      if (parent.children.length > 0) {
        parent.children.forEach((child: any) => {
          flatList.push({
            ...child,
            displayName: `  └─ ${child.name}`,
            value: child._id || child.id,
            isParent: false
          });
        });
      }
    });
    
    return flatList;
  };

  return (
    <div className="mb-6 relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Filter by Category
      </label>
      <div className="relative" data-category-dropdown>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowCategoryDropdown(!showCategoryDropdown);
          }}
          className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className="block truncate">
            {selectedCategory === 'all'
              ? 'All Categories'
              : getHierarchicalCategories().find(cat => cat.value === selectedCategory)?.name || 'All Categories'}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </span>
        </button>

        {showCategoryDropdown && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCategoryChange('all');
                setShowCategoryDropdown(false);
              }}
              className="text-gray-900 block px-3 py-2 text-sm hover:bg-gray-100 w-full text-left"
            >
              All Categories
            </button>
            {getHierarchicalCategories().map((category) => (
              <button
                key={category.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryChange(category.value);
                  setShowCategoryDropdown(false);
                }}
                className={`text-gray-900 block px-3 py-2 text-sm hover:bg-gray-100 w-full text-left ${
                  category.isParent ? 'font-semibold' : 'pl-6'
                }`}
              >
                {category.displayName}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
