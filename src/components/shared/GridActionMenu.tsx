'use client';

import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactElement;
  onClick: (data: any) => void;
  className?: string;
  disabled?: boolean;
}

export interface GridActionMenuProps {
  actions: ActionMenuItem[];
  rowData: any;
  getDataId?: (data: any) => string;
}

const GridActionMenu: React.FC<GridActionMenuProps> = ({
  actions,
  rowData,
  getDataId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

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

  const handleAction = (action: ActionMenuItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);

    if (!action.disabled) {
      action.onClick(rowData);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-action-menu]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <>
      <div onClick={(e) => e.stopPropagation()}>
        <div className="w-6 h-6 flex items-center justify-center">
          <div
            ref={buttonRef}
            onClick={toggleMenu}
            className="p-1 hover:bg-gray-100 rounded-full cursor-pointer relative"
            style={{ userSelect: 'none' }}
            data-action-menu-trigger
          >
            {isOpen ? (
              <svg className="h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293 4.293a1 1 0 01-1.414 0l-4.293 4.293a1 1 0 00-1.414-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {isOpen && createPortal(
        <div
          className="fixed z-[9999] w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
          data-action-menu
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`
          }}
        >
          <div className="py-1">
            {actions.map((action, index) => (
              <div
                key={index}
                onClick={(e) => handleAction(action, e)}
                className={`flex items-center px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer ${
                  action.disabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${action.className || ''}`}
              >
                {action.icon && (
                  <span className="mr-3 h-4 w-4">{action.icon}</span>
                )}
                {action.label}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default GridActionMenu;
