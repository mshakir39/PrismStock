import { connectToMongoDB } from '@/app/libs/connectToMongoDB';
import { IClient, CreateClientData, UpdateClientData } from '@/interfaces/client';
import { ObjectId } from 'mongodb';

export class ClientService {
  static async createClient(clientData: CreateClientData, createdBy: string): Promise<{ success: boolean; client?: IClient; error?: string }> {
    try {
      const db = await connectToMongoDB();
      if (!db) {
        return { success: false, error: 'Database connection failed' };
      }

      const clientsCollection = db.collection('clients');

      // Check if client email already exists
      const existingClient = await clientsCollection.findOne({ email: clientData.email });
      if (existingClient) {
        return { success: false, error: 'Client with this email already exists' };
      }

      const newClient: Omit<IClient, '_id'> = {
        ...clientData,
        status: clientData.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: new ObjectId(createdBy)
      };

      const result = await clientsCollection.insertOne(newClient);
      
      if (result.acknowledged) {
        const createdClient = await clientsCollection.findOne({ _id: result.insertedId });
        return { success: true, client: createdClient as IClient };
      }

      return { success: false, error: 'Failed to create client' };
    } catch (error) {
      console.error('Create client error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  static async getAllClients(): Promise<{ success: boolean; clients?: IClient[]; error?: string }> {
    try {
      const db = await connectToMongoDB();
      if (!db) {
        return { success: false, error: 'Database connection failed' };
      }

      const clientsCollection = db.collection('clients');
      const clients = await clientsCollection.find({}).sort({ createdAt: -1 }).toArray();

      return { success: true, clients: clients as IClient[] };
    } catch (error) {
      console.error('Get clients error:', error);
      return { success: false, error: 'Failed to fetch clients' };
    }
  }

  static async getClientById(clientId: string): Promise<{ success: boolean; client?: IClient; error?: string }> {
    try {
      const db = await connectToMongoDB();
      if (!db) {
        return { success: false, error: 'Database connection failed' };
      }

      const clientsCollection = db.collection('clients');
      const client = await clientsCollection.findOne({ _id: new ObjectId(clientId) });

      if (!client) {
        return { success: false, error: 'Client not found' };
      }

      return { success: true, client: client as IClient };
    } catch (error) {
      console.error('Get client error:', error);
      return { success: false, error: 'Failed to fetch client' };
    }
  }

  static async updateClient(clientId: string, updateData: UpdateClientData): Promise<{ success: boolean; client?: IClient; error?: string }> {
    try {
      const db = await connectToMongoDB();
      if (!db) {
        return { success: false, error: 'Database connection failed' };
      }

      const clientsCollection = db.collection('clients');
      
      const updateDoc = {
        ...updateData,
        updatedAt: new Date()
      };

      const result = await clientsCollection.updateOne(
        { _id: new ObjectId(clientId) },
        { $set: updateDoc }
      );

      if (result.matchedCount === 0) {
        return { success: false, error: 'Client not found' };
      }

      const updatedClient = await clientsCollection.findOne({ _id: new ObjectId(clientId) });
      return { success: true, client: updatedClient as IClient };
    } catch (error) {
      console.error('Update client error:', error);
      return { success: false, error: 'Failed to update client' };
    }
  }

  static async deleteClient(clientId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const db = await connectToMongoDB();
      if (!db) {
        return { success: false, error: 'Database connection failed' };
      }

      const clientsCollection = db.collection('clients');
      
      // First, delete all users associated with this client
      const usersCollection = db.collection('users');
      await usersCollection.deleteMany({ clientId });

      // Then delete the client
      const result = await clientsCollection.deleteOne({ _id: new ObjectId(clientId) });

      if (result.deletedCount === 0) {
        return { success: false, error: 'Client not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete client error:', error);
      return { success: false, error: 'Failed to delete client' };
    }
  }

  static async getClientUsers(clientId: string): Promise<{ success: boolean; users?: any[]; error?: string }> {
    try {
      const db = await connectToMongoDB();
      if (!db) {
        return { success: false, error: 'Database connection failed' };
      }

      const usersCollection = db.collection('users');
      const users = await usersCollection.find({ clientId }).sort({ createdAt: -1 }).toArray();

      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      return { success: true, users: usersWithoutPasswords };
    } catch (error) {
      console.error('Get client users error:', error);
      return { success: false, error: 'Failed to fetch client users' };
    }
  }
}
