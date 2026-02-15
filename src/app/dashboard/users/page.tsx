import UsersLayout from '@/layouts/usersLayout';
import { getUsers } from '@/actions/userActions';
import ErrorBoundary from '@/components/ErrorBoundary';

// React 19: Enhanced server component with better error handling
async function getUsersData() {
  try {
    const result = await getUsers();

    if (!result.success || !Array.isArray(result.data)) {
      console.error('Invalid users data format or fetch failed');
      return [];
    }

    return result.data;
  } catch (error) {
    console.error('Error loading users:', error);
    return [];
  }
}

export default async function UsersPage() {
  const users = await getUsersData();

  return (
    <ErrorBoundary
      title="User Data Error"
      message="An unexpected error occurred while loading user information."
    >
      <UsersLayout initialUsers={users} />
    </ErrorBoundary>
  );
}
