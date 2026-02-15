'use server';
import { executeOperation } from '@/app/libs/executeOperation';

interface ClientData {
  name: string;
  email: string;
  phone: string;
  address: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export async function createClient(data: ClientData) {
  try {
    const result = await executeOperation('clients', 'insertOne', {
      ...data,
      status: data.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateClient(id: string, data: Partial<ClientData>) {
  try {
    const result = await executeOperation('clients', 'updateOne', {
      id,
      ...data,
      updatedAt: new Date(),
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteClient(id: string) {
  try {
    const result = await executeOperation('clients', 'delete', {
      id,
    });
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getClients() {
  try {
    const clients = await executeOperation('clients', 'findAll');

    let processedClients = clients;
    // Sort clients by name or created date if needed
    if (Array.isArray(processedClients)) {
      processedClients.sort((a: any, b: any) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      });
      // Serialize ObjectId to string
      processedClients = processedClients.map(client => ({
        ...client,
        _id: client._id?.toString(),
        createdBy: client.createdBy?.toString(),
      }));
    }

    return { success: true, data: processedClients };
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return { success: false, error: error.message };
  }
}
