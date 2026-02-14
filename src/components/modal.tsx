import React, { FunctionComponent, ReactNode } from 'react';
import { Dialog } from '@headlessui/react';

interface ModalProps {
  isOpen: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  children: ReactNode;
  title?: ReactNode;
  dialogPanelClass?: string;
  parentClass?: string;
  preventBackdropClose?: boolean;
  size?: 'large' | 'medium' | 'small';
}

const sizeClasses = {
  small: 'max-w-sm sm:max-w-md',
  medium: 'max-w-2xl sm:max-w-3xl',
  large: 'max-w-6xl sm:max-w-7xl',
};

const Modal: FunctionComponent<ModalProps> = ({
  isOpen,
  onOpen,
  onClose,
  children,
  title = 'Modal Title' as ReactNode,
  dialogPanelClass,
  parentClass,
  preventBackdropClose = false,
  size = 'medium',
}) => {

  
  const handleClose = () => {
    if (onClose && !preventBackdropClose) {
      onClose();
    }
  };

  // Force close function that bypasses preventBackdropClose
  const handleForceClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const defaultPanelClass = `transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all ${sizeClasses[size]}`;

  return (
    <Dialog
      open={isOpen}
      onClose={preventBackdropClose ? () => {} : onClose || (() => {})}
      className='relative z-50'
    >
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div className='fixed inset-0 bg-black/30' aria-hidden='true' />

      {/* Full-screen container to center panel */}
      <div className='fixed inset-0 overflow-y-auto'>
        {/* Container that centers the panel and handles responsive sizing */}
        <div className='flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8'>
          {/* The actual dialog panel with responsive sizing */}
          <Dialog.Panel
            className={`${defaultPanelClass} ${dialogPanelClass || ''} max-h-[90vh] w-full overflow-y-auto`}
          >
            {/* Always include DialogTitle for accessibility */}
            <Dialog.Title className='sr-only'>{title || 'Modal'}</Dialog.Title>
            {title && (
              <div className='sticky top-0 z-10 border-b border-gray-200 bg-gray-50 bg-opacity-95 px-4 py-3 backdrop-blur-sm sm:px-6 sm:py-4'>
                <h3 className='text-base font-medium leading-5 text-gray-900 sm:text-lg sm:leading-6'>
                  {title}
                </h3>
              </div>
            )}
            <div className={`${parentClass || 'p-4 sm:p-6'}`}>{children}</div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default Modal;
