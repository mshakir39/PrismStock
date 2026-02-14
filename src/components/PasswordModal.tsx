'use client';
import React, { useState } from 'react';
import Modal from './modal';
import Button from './button';
import Input from './customInput';
import { toast } from 'react-toastify';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

interface PasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dashboard password - you can change this to any password you want
  const DASHBOARD_PASSWORD = 'admin123';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      toast.error('Please enter the password');
      return;
    }

    setIsLoading(true);

    // Simulate a small delay for better UX
    setTimeout(() => {
      if (password === DASHBOARD_PASSWORD) {
        // Store authentication in sessionStorage
        sessionStorage.setItem('dashboardUnlocked', 'true');
        sessionStorage.setItem('dashboardUnlockTime', Date.now().toString());

        toast.success('Access granted!');
        setPassword('');
        onSuccess();
      } else {
        toast.error('Incorrect password. Please try again.');
        setPassword('');
      }
      setIsLoading(false);
    }, 500);
  };

  const handleClose = () => {
    setPassword('');
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title='Dashboard Access Required'
      size='small'
      preventBackdropClose={false}
    >
      <div className='space-y-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
            <FaLock className='h-8 w-8 text-red-600' />
          </div>
          <h3 className='mb-2 text-lg font-medium text-gray-900'>
            Dashboard is Password Protected
          </h3>
          <p className='text-sm text-gray-500'>
            Please enter the correct password to access the dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='relative'>
            <Input
              type={showPassword ? 'text' : 'password'}
              label='Password'
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              placeholder='Enter dashboard password'
              required
              autoFocus
            />
            <button
              type='button'
              className='absolute right-3 top-8 text-gray-400 hover:text-gray-600'
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <FaEyeSlash className='h-4 w-4' />
              ) : (
                <FaEye className='h-4 w-4' />
              )}
            </button>
          </div>

          <div className='flex flex-col gap-3 pt-4'>
            <Button
              type='submit'
              variant='fill'
              text='Unlock Dashboard'
              onClick={handleSubmit}
              isPending={isLoading}
              disabled={isLoading}
              className='h-12 w-full text-base font-medium'
            />
            <Button
              type='button'
              variant='outline'
              text='Cancel'
              onClick={handleClose}
              className='h-12 w-full text-base'
            />
          </div>
        </form>

        <div className='text-center'>
          <p className='text-xs text-gray-400'>
            Contact administrator for access credentials
          </p>
          <p className='mt-2 text-xs text-blue-500'>
            You can close this modal and navigate to other pages
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default PasswordModal;
