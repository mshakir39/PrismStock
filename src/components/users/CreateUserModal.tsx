import React from 'react';
import Modal from '@/components/modal';
import CustomInput from '@/components/customInput';
import Button from '@/components/button';
import { UserRole } from '@/interfaces/user';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    profile: { phone: string; address: string; };
  };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  currentUser: any;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, formData, setFormData, onSubmit, currentUser }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Create New User"
    size="medium"
  >
    <form onSubmit={onSubmit} className="space-y-4">
      <CustomInput
        type="text"
        label="Name"
        value={formData.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <CustomInput
        type="email"
        label="Email"
        value={formData.email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <CustomInput
        type="password"
        label="Password"
        value={formData.password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
        required
      />
      <div>
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          value={formData.role}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, role: e.target.value as UserRole })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value={UserRole.VIEWER}>Viewer</option>
          <option value={UserRole.SALES}>Sales</option>
          <option value={UserRole.MANAGER}>Manager</option>
          <option value={UserRole.ADMIN}>Admin</option>
          {currentUser?.isSuperAdmin && (
            <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
          )}
        </select>
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          text="Cancel"
          onClick={onClose}
        />
        <Button
          type="submit"
          variant="fill"
          text="Create User"
        />
      </div>
    </form>
  </Modal>
);

export default CreateUserModal;
