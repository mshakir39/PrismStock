import { getClients } from '@/actions/clientActions';
import ClientLayout from '@/layouts/clientLayout';
import { IClient } from '@/interfaces/client';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Clients | Prism Stock',
  description: 'Manage your clients and their organizations',
};

async function getClientsData() {
  try {
    const clientsResult = await getClients();
    if (!clientsResult.success) {
      console.error('Failed to fetch clients:', clientsResult.error);
      return [];
    }
    // Ensure we're returning an array
    return Array.isArray(clientsResult.data) ? clientsResult.data : [];
  } catch (error) {
    console.error('Error loading clients data:', error);
    return [];
  }
}

export default async function ClientsPage() {
  const clients = await getClientsData();

  return <ClientLayout clients={clients as IClient[]} />;
}
