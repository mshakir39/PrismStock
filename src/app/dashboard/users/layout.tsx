import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Users | Prism Stock',
  description: 'Manage users and their roles',
};

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
