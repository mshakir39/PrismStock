'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { IClient } from '@/interfaces/client';

interface ClientContextType {
  selectedClient: IClient | null;
  setSelectedClient: (client: IClient | null) => void;
  clients: IClient[];
  setClients: (clients: IClient[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  refreshTrigger: number;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);
  const [clients, setClients] = useState<IClient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch selected client from cookies on mount
  useEffect(() => {
    const fetchSelectedClient = async () => {
      try {
        const response = await fetch('/api/client-cookie', {
          method: 'GET',
          credentials: 'include',
        });
        const data = await response.json();
        if (data.success && data.client) {
          setSelectedClient(data.client);
        }
      } catch (error) {
        console.error('Error fetching selected client:', error);
      }
    };

    fetchSelectedClient();
  }, []);

  // Trigger refresh when selectedClient changes
  useEffect(() => {
    if (selectedClient) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, [selectedClient]);

  const value: ClientContextType = {
    selectedClient,
    setSelectedClient,
    clients,
    setClients,
    isLoading,
    setIsLoading,
    refreshTrigger,
  };

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>;
}

export function useClientContext() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClientContext must be used within a ClientProvider');
  }
  return context;
}
