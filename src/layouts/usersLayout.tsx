'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClientContext } from '@/interfaces/clientContext';
import { IUser } from '@/interfaces/user';
import DataGrid, { DataGridActionMenu, DataGridEmptyState } from '@/components/shared/DataGrid';
import CreateUserModal from '@/components/users/CreateUserModal';
import ResetPasswordModal from '@/components/users/ResetPasswordModal';
import ToggleUserStatusModal from '@/components/users/ToggleUserStatusModal';
import { userColumns } from '@/components/dashboard/columns';
import { useUsersHandlers } from '@/handlers/usersHandlers';
import LoadingSpinner from '@/components/LoadingSpinner';
import { UserRole } from '@/interfaces/user';

interface UsersLayoutProps {
  initialUsers?: IUser[];
  serverTimestamp?: number;
}

const UsersLayout: React.FC<UsersLayoutProps> = ({
  initialUsers = [],
  serverTimestamp,
}) => {
  const { user: currentUser } = useAuth();
  const { selectedClient } = useClientContext();
  const [users, setUsers] = useState<IUser[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(initialUsers.length === 0);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<IUser | null>(null);
  const [selectedUserForStatusChange, setSelectedUserForStatusChange] = useState<IUser | null>(null);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.VIEWER,
    profile: {
      phone: '',
      address: ''
    }
  });

  const { fetchUsers: fetchUsersHandler, handleCreateUser: createHandler, handleResetPassword: resetHandler, handleToggleUserStatus: toggleHandler } = useUsersHandlers(currentUser, selectedClient);

  // DataGrid configuration
  const columns = userColumns;

  const actionMenu: DataGridActionMenu = {
    actions: [
      {
        label: 'Reset Password',
        onClick: (user: any) => {
          setSelectedUserForReset(user);
          setShowResetPasswordDialog(true);
        },
        icon: (
          <svg className="text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2-2m0 0a2 2 0 00-2 2m2-2v6m0 4h.01M12 2l3 3-3 3-3-3 3-3z"></path>
          </svg>
        ),
      },
      {
        label: 'Manage Status',
        onClick: (user: any) => {
          setSelectedUserForStatusChange(user);
          setShowStatusChangeDialog(true);
        },
        className: 'text-blue-600 hover:bg-blue-50',
        icon: (
          <svg className="text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        ),
      },
    ],
  };

  const emptyState: DataGridEmptyState = {
    icon: (
      <svg className="text-[#193043]" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: 'No Users Yet',
    description: 'Start managing your team by creating your first user account. Set up roles, permissions, and access levels for your organization.',
    actionButton: {
      text: 'Create Your First User',
      onClick: () => setShowCreateDialog(true),
    },
    tips: [
      '• Assign appropriate roles based on user responsibilities',
      '• Use strong passwords and enable password resets',
      '• Monitor user activity and account status',
    ],
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear all existing toasts first
    // toast.dismiss(); // Will be handled in the modal

    // Form validation
    if (!formData.name.trim()) {
      // toast.error('Name is required'); // Will be handled in the modal
      return;
    }

    if (!formData.email.trim()) {
      // toast.error('Email is required'); // Will be handled in the modal
      return;
    }

    if (!formData.password.trim()) {
      // toast.error('Password is required'); // Will be handled in the modal
      return;
    }

    if (formData.password.length < 6) {
      // toast.error('Password must be at least 6 characters'); // Will be handled in the modal
      return;
    }

    await createHandler(formData, () => {
      setShowCreateDialog(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: UserRole.VIEWER,
        profile: {
          phone: '',
          address: ''
        }
      });
      fetchUsersHandler(setUsers, setIsLoading);
    });
  };

  const handleResetPassword = async () => {
    await resetHandler(selectedUserForReset, resetPassword, () => {
      setShowResetPasswordDialog(false);
      setSelectedUserForReset(null);
      setResetPassword('');
    });
  };

  const handleToggleUserStatus = async (user: IUser) => {
    await toggleHandler(user, () => {
      fetchUsersHandler(setUsers, setIsLoading);
    });
  };

  // Fetch users on component mount and when selectedClient or currentUser changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'super_admin') {
        // Super admin: only fetch if a client is selected
        if (selectedClient) {
          fetchUsersHandler(setUsers, setIsLoading);
        } else {
          // No client selected, clear users and show empty state
          setUsers([]);
          setIsLoading(false);
        }
      } else {
        // Regular user: always fetch (uses their assigned client)
        fetchUsersHandler(setUsers, setIsLoading);
      }
    }
  }, [selectedClient, currentUser, fetchUsersHandler]);

  // Update users when initialUsers prop changes (server-side data)
  useEffect(() => {
    if (initialUsers.length > 0 && users.length === 0) {
      setUsers(initialUsers);
      setIsLoading(false);
    }
  }, [initialUsers, users.length]);

  const getPageTitle = () => {
    if (currentUser?.role === 'super_admin') {
      if (selectedClient) {
        return `Users - ${selectedClient.name}`;
      } else {
        return 'Select a Client';
      }
    } else {
      return 'Users';
    }
  };

  const canManageUsers = currentUser ? Boolean(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (currentUser.role !== 'super_admin' || selectedClient !== null) : false;

  return (
    <div className="p-6">
      {isLoading && (
        <div className='flex min-h-screen flex-col items-center justify-center space-y-4'>
          <LoadingSpinner size='lg' />
          <div className='text-center'>
            <h2 className='text-lg font-medium text-gray-900'>
              Loading Users...
            </h2>
            <p className='mt-1 text-sm text-gray-500'>
              Please wait while we fetch your user information
            </p>
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          <DataGrid
            data={users}
            columns={columns}
            actionMenu={actionMenu}
            emptyState={emptyState}
            title={getPageTitle()}
            loading={isLoading || (currentUser?.role === 'super_admin' && !selectedClient)}
            onCreateClick={() => setShowCreateDialog(true)}
            showCreateButton={canManageUsers}
            createButtonText="Create New User"
          />

          <CreateUserModal
            isOpen={showCreateDialog}
            onClose={() => setShowCreateDialog(false)}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreateUser}
            currentUser={currentUser}
          />

          <ResetPasswordModal
            isOpen={showResetPasswordDialog}
            selectedUser={selectedUserForReset}
            onClose={() => {
              setShowResetPasswordDialog(false);
              setSelectedUserForReset(null);
            }}
            resetPassword={resetPassword}
            setResetPassword={setResetPassword}
            onReset={handleResetPassword}
          />

          <ToggleUserStatusModal
            isOpen={showStatusChangeDialog}
            selectedUser={selectedUserForStatusChange}
            onClose={() => {
              setShowStatusChangeDialog(false);
              setSelectedUserForStatusChange(null);
            }}
            onToggle={handleToggleUserStatus}
          />
        </>
      )}
    </div>
  );
};

export default UsersLayout;
