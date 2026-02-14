import { IUser } from '@/interfaces/user';
import { toast } from 'react-toastify';
import { useCallback } from 'react';
import {
  fetchUsersAction,
  createUserAction,
  toggleUserStatusAction
} from '@/actions/userActions';

export const useUsersHandlers = (currentUser: any, selectedClient: any) => {
  const fetchUsers = useCallback(async (setUsers: (users: IUser[]) => void, setIsLoading: (loading: boolean) => void) => {
    setIsLoading(true);
    try {
      console.log('Calling server action fetchUsersAction');
      const result = await fetchUsersAction(selectedClient?._id?.toString());

      console.log('Server action result:', result);

      if (result.success && result.data) {
        console.log('Setting users from server action');
        // Deduplicate users by id to prevent React key warnings
        const uniqueUsers = Array.isArray(result.data)
          ? result.data.filter((user, index, arr) => arr.findIndex(u => u._id === user._id) === index)
          : [];
        setUsers(uniqueUsers);
      } else if (result.message) {
        toast.info(result.message);
        setUsers([]);
      } else {
        console.log('Server action error:', result.error);
        toast.error(result.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  }, [selectedClient]);

  const handleCreateUser = useCallback(async (formData: any, onSuccess?: () => void) => {
    try {
      console.log('Calling server action createUserAction');
      const result = await createUserAction({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        isActive: true,
      }, selectedClient?._id?.toString());

      if (result.success) {
        toast.success(result.message || 'User created successfully');
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  }, [selectedClient]);

  const handleResetPassword = useCallback(async (selectedUser: IUser | null, resetPassword: string, onSuccess?: () => void) => {
    if (!selectedUser || !resetPassword) return;

    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id || selectedUser._id,
          newPassword: resetPassword,
          adminId: currentUser?.id || currentUser?._id
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Password reset successfully');
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    }
  }, [currentUser]);

  const handleToggleUserStatus = useCallback(async (user: IUser, onSuccess?: () => void) => {
    try {
      console.log('Calling server action toggleUserStatusAction');
      const result = await toggleUserStatusAction(user._id || user.id || '');

      if (result.success) {
        toast.success(result.message || `User ${user.isActive ? 'blocked' : 'unblocked'} successfully`);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    }
  }, []);

  return {
    fetchUsers,
    handleCreateUser,
    handleResetPassword,
    handleToggleUserStatus,
  };
};
