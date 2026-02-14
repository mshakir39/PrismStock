import React from 'react';
import Modal from '@/components/modal';
import CustomInput from '@/components/customInput';
import Button from '@/components/button';
import { IUser } from '@/interfaces/user';

interface ResetPasswordModalProps {
  isOpen: boolean;
  selectedUser: IUser | null;
  onClose: () => void;
  resetPassword: string;
  setResetPassword: (password: string) => void;
  onReset: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, selectedUser, onClose, resetPassword, setResetPassword, onReset }) => (
  isOpen && selectedUser ? (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Password"
    >
      <div className="mt-4">
        <div className="text-sm text-gray-600 mb-4">
          <p>Are you sure you want to reset the password for <strong>{selectedUser.name}</strong> ({selectedUser.email})?</p>
          <p className="mt-2 text-yellow-600">
            ⚠️ This will change the user's password immediately.
          </p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">New Password</label>
          <CustomInput
            type="password"
            label=""
            value={resetPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetPassword(e.target.value)}
            placeholder={`Enter ${selectedUser.name}&apos;s new password`}
            required
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            text="Cancel"
            onClick={onClose}
          />
          <Button
            variant="fill"
            text="Reset Password"
            onClick={onReset}
          />
        </div>
      </div>
    </Modal>
  ) : null
);

export default ResetPasswordModal;
