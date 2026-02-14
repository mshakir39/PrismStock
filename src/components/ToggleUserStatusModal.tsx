import React from 'react';
import Modal from '@/components/modal';
import Button from '@/components/button';
import { IUser } from '@/interfaces/user';

interface ToggleUserStatusModalProps {
  isOpen: boolean;
  selectedUser: IUser | null;
  onClose: () => void;
  onToggle: (user: IUser) => void;
}

const ToggleUserStatusModal: React.FC<ToggleUserStatusModalProps> = ({ isOpen, selectedUser, onClose, onToggle }) => (
  isOpen && selectedUser ? (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedUser.isActive ? "Block User" : "Unblock User"}
      size="small"
    >
      <div className="space-y-4">
        <div className="text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            selectedUser.isActive ? 'bg-red-100' : 'bg-green-100'
          }`}>
            {selectedUser.isActive ? (
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            {selectedUser.isActive ? "Block User Account" : "Unblock User Account"}
          </h3>
          <p className="text-sm text-gray-500">
            {selectedUser.isActive
              ? "Are you sure you want to block this user? They will not be able to log into the system."
              : "Are you sure you want to unblock this user? They will regain access to the system."
            }
          </p>
        </div>

        <div className={`rounded-lg border p-4 ${
          selectedUser.isActive 
            ? 'border-red-200 bg-red-50' 
            : 'border-green-200 bg-green-50'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className={`h-5 w-5 ${
                  selectedUser.isActive ? 'text-red-400' : 'text-green-400'
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className={`text-sm font-medium ${
                selectedUser.isActive ? 'text-red-800' : 'text-green-800'
              }`}>
                {selectedUser.isActive ? "User to Block" : "User to Unblock"}
              </h4>
              <div className={`mt-2 text-sm ${
                selectedUser.isActive ? 'text-red-700' : 'text-green-700'
              }`}>
                <p>
                  <strong>Name:</strong> {selectedUser.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedUser.email}
                </p>
                <p>
                  <strong>Role:</strong> {selectedUser.role?.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            className="h-12 w-full text-base font-medium focus:outline-none focus:ring-0"
            variant="fill"
            text={selectedUser.isActive ? "Block User Account" : "Unblock User Account"}
            onClick={() => onToggle(selectedUser)}
            style={selectedUser.isActive ? { 
              backgroundColor: '#dc2626', 
              borderColor: '#dc2626' 
            } : {
              backgroundColor: '#16a34a',
              borderColor: '#16a34a'
            }}
          />
          <Button
            className="h-12 w-full text-base focus:outline-none focus:ring-0"
            variant="outline"
            text="Cancel"
            type="button"
            onClick={onClose}
          />
        </div>
      </div>
    </Modal>
  ) : null
);

export default ToggleUserStatusModal;
