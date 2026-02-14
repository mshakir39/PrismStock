import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Warranty Check | Prism Stock',
  description: 'Check warranty status for your products',
};

export default function WarrantyCheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
