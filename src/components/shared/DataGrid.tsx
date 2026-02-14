'use client';

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AgGridReact, AgGridProvider } from 'ag-grid-react';
import { AllCommunityModule } from 'ag-grid-community';
import Button from '@/components/button';
import { gradients, theme } from '@/styles/theme';
import SearchableCategoryDropdown from '@/components/products/SearchableCategoryDropdown';

// AG Grid modules
const modules = [AllCommunityModule];

export interface DataGridColumn {
  headerName: string;
  field?: string;
  cellRenderer?: (params: any) => React.ReactElement;
  sortable?: boolean;
  filter?: boolean | string;
  resizable?: boolean;
  flex?: number;
  minWidth?: number;
  width?: number;
}

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactElement;
  onClick: (data: any) => void;
  className?: string;
  disabled?: boolean;
}

export interface DataGridActionMenu {
  actions: ActionMenuItem[];
  getDataId?: (data: any) => string;
}

export interface DataGridEmptyState {
  icon: React.ReactElement;
  title: string;
  description: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
  tips?: string[];
}

export interface DataGridProps {
  data: any[];
  columns: DataGridColumn[];
  actionMenu?: DataGridActionMenu;
  emptyState: DataGridEmptyState;
  title: string;
  loading?: boolean;
  onCreateClick?: () => void;
  showCreateButton?: boolean;
  createButtonText?: string;
  className?: string;
  // Categories filter props - updated for new structure
  categories?: any[];
  selectedCategory?: {
    id: string;
    name: string;
    breadcrumb: Array<{ id: string; name: string; slug: string }>;
  } | null;
  onCategoryChange?: (category: { id: string; name: string; breadcrumb: Array<{ id: string; name: string; slug: string }> } | null) => void;
  showCategoryFilter?: boolean;
}

const DataGrid: React.FC<DataGridProps> = ({
  data,
  columns,
  actionMenu,
  emptyState,
  title,
  loading = false,
  onCreateClick,
  showCreateButton = true,
  createButtonText = "Create New",
  className = "",
  categories,
  selectedCategory,
  onCategoryChange,
  showCategoryFilter = false,
}) => {
  const SimpleActionMenu: React.FC<{ rowData: any }> = ({ rowData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const toggleMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY,
          left: rect.right + window.scrollX - (rect.width / 2) - 150
        });
      }
      setIsOpen(!isOpen);
    };

    return (
      <>
        <button
          ref={buttonRef}
          onClick={toggleMenu}
          className="p-2 rounded hover:bg-gray-100 transition-colors duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6v.01M12 9v.01M12 15v.01" />
          </svg>
        </button>

        {isOpen && createPortal(
          <div
            className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-[60] min-w-[150px]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              boxShadow: theme.shadows.lg,
              border: `1px solid ${theme.colors.gray200}`
            }}
          >
            {actionMenu?.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick(rowData);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left transition-colors duration-150 ${
                  action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                } ${action.className || ''}`}
                disabled={action.disabled}
              >
                <div className="flex items-center space-x-2">
                  {action.icon}
                  <span>{action.label}</span>
                </div>
              </button>
            ))}
          </div>,
          document.body
        )}
      </>
    );
  };

  const gridColumns = [...columns];

  // Add actions column if actionMenu is provided
  if (actionMenu) {
    gridColumns.push({
      cellRenderer: (params: any) => <SimpleActionMenu rowData={params.data} />,
      headerName: 'Actions',
      sortable: false,
      filter: false,
      resizable: true,
      flex: 1,
      minWidth: 100,
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AgGridProvider modules={modules}>
      <div className={`p-6 ${className}`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
          <div className={`flex items-center gap-4 ${data.length === 0 ? 'hidden' : ''}`}>
            {/* Categories Filter */}
            {showCategoryFilter && categories && onCategoryChange && data.length > 0 && (
              <div className="min-w-[300px]">
                <SearchableCategoryDropdown
                  categories={categories}
                  value={selectedCategory}
                  onChange={onCategoryChange}
                  placeholder="Search categories..."
                />
              </div>
            )}
            {showCreateButton && onCreateClick && (
              <Button
                variant="fill"
                text={createButtonText}
                onClick={onCreateClick}
              />
            )}
          </div>
        </div>

        {data.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="max-w-md mx-auto">
              {/* Gradient Background Circle */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f0f4f8] to-[#e1e7ed] rounded-full p-8"></div>
                <div className="relative bg-white rounded-full p-12 shadow-lg">
                  {emptyState.icon}
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {selectedCategory ? `No products in "${selectedCategory.name}"` : emptyState.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-8 leading-relaxed">
                {selectedCategory 
                  ? `There are no products in the ${selectedCategory.name} category. Try selecting a different category or create a new product in this category.`
                  : emptyState.description
                }
              </p>

              {/* Call to Action Button */}
              {emptyState.actionButton && !selectedCategory && (
                <div className="flex justify-center">
                  <Button
                    text={emptyState.actionButton.text}
                    onClick={emptyState.actionButton.onClick}
                    variant="fill"
                    className="bg-[#193043] hover:bg-[#2a4156] text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  />
                </div>
              )}

              {/* Clear Filter Button when category is selected */}
              {selectedCategory && onCategoryChange && (
                <div className="flex justify-center">
                  <Button
                    text="Clear Category Filter"
                    onClick={() => onCategoryChange(null)}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2"
                  />
                </div>
              )}

              {/* Additional Tips */}
              {emptyState.tips && emptyState.tips.length > 0 && !selectedCategory && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">💡 Pro Tips:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {emptyState.tips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {title} ({data.length})
              </h2>
            </div>

            <div className="ag-theme-alpine h-full">
              <AgGridReact
                rowData={data}
                columnDefs={gridColumns}
                defaultColDef={{
                  flex: 1,
                  minWidth: 100,
                  resizable: true,
                }}
                pagination={true}
                paginationPageSize={20}
                paginationPageSizeSelector={[20, 50, 100]}
                domLayout="autoHeight"
                animateRows={true}
                rowSelection={{
                  mode: 'singleRow',
                  checkboxes: false,
                  enableClickSelection: true,
                }}
                suppressCellFocus={true}
              />
            </div>
          </div>
        )}
      </div>
    </AgGridProvider>
  );
};

export default DataGrid;
