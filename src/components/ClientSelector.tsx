'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useClientContext } from '@/interfaces/clientContext';
import { IClient } from '@/interfaces/client';
import { FaBuilding, FaChevronDown } from 'react-icons/fa';
import { gradients, theme } from '@/styles/theme';

export default function ClientSelector() {
  const { user } = useAuth();
  const { selectedClient, setSelectedClient, clients, setClients, isLoading, setIsLoading } = useClientContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Only show for super admin users
  if (user?.role !== 'super_admin') {
    return null;
  }

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true); // Set loading to true at start
      try {
        const response = await fetch('/api/clients', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        const data = await response.json();

        if (data.success) {
          setClients(data.clients || []);
          // Select first client immediately after loading
          if (data.clients && data.clients.length > 0) {
            const defaultClient = data.clients[0];
            setSelectedClient(defaultClient);
            // Save default client to cookie
            await saveClientToCookie(defaultClient);
            // Refresh the route to revalidate data with the new client
            router.refresh();
          }
        } else {
          console.error('Failed to fetch clients:', data.error);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'super_admin') {
      fetchClients();
    }
  }, [user?.role, setSelectedClient, setClients]);


  // Calculate dropdown position when opening
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 240; // Approximate height of dropdown
      const shouldOpenAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      
      setDropdownPosition(shouldOpenAbove ? 'top' : 'bottom');
    }
  }, [isDropdownOpen]);

  const saveClientToCookie = async (client: IClient) => {
    console.log('Saving client to cookie:', client._id);
    try {
      const response = await fetch('/api/client-cookie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ clientId: client._id?.toString() || null }),
      });
      console.log('Cookie save response status:', response.status);
      const result = await response.json();
      console.log('Cookie save response:', result);
    } catch (error) {
      console.error('Error saving client to cookies:', error);
    }
  };

  const handleClientSelect = async (client: IClient) => {
    setSelectedClient(client);
    setIsDropdownOpen(false);
    
    // Save selected client to cookies on server side
    await saveClientToCookie(client);
    
    // Refresh the current route to revalidate data
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-sm text-gray-500">
        Loading clients...
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsDropdownOpen(!isDropdownOpen);
        }}
        className="flex items-center space-x-2 px-4 py-3 rounded-lg hover:shadow-md transition-all duration-200 min-w-[280px] shadow-sm"
        style={{
          background: selectedClient ? gradients.primary : 'white',
          color: selectedClient ? 'white' : theme.colors.gray900,
          border: selectedClient ? 'none' : `1px solid ${theme.colors.gray200}`
        }}
      >
        <FaBuilding className={`h-4 w-4 ${selectedClient ? 'text-white' : 'text-[#193043]'}`} />
        <div className="flex-1 text-left">
          <div className={`text-sm font-medium ${selectedClient ? 'text-white' : 'text-gray-900'}`}>
            {selectedClient ? selectedClient.name : 'Select Client'}
          </div>
          {selectedClient && (
            <div className="text-xs text-white text-opacity-80 truncate">
              {selectedClient.email}
            </div>
          )}
        </div>
        <FaChevronDown className={`h-4 w-4 transition-transform duration-200 ${selectedClient ? 'text-white' : 'text-gray-400'} ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsDropdownOpen(false)}
          />

          {/* Dropdown */}
          <div 
            className={`absolute w-full bg-white border border-gray-200 rounded-lg shadow-lg z-[60] max-h-60 overflow-y-auto ${
              dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
            style={{ 
              position: 'absolute',
              boxShadow: theme.shadows.lg,
              border: `1px solid ${theme.colors.gray200}`
            }}
          >
            {/* Client List */}
            {clients.map((client: IClient, index: number) => (
              <button
                key={client._id?.toString()}
                onClick={() => handleClientSelect(client)}
                className={`w-full px-4 py-3 text-left transition-colors duration-150 group ${
                  selectedClient?._id?.toString() === client._id?.toString()
                    ? 'bg-[#193043] text-white hover:bg-[#1e3a5f]'
                    : 'text-gray-900 hover:bg-gray-50'
                } ${index === 0 ? 'first:rounded-t-lg' : ''} ${index === clients.length - 1 ? 'rounded-b-lg' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <FaBuilding className={`h-4 w-4 ${selectedClient?._id?.toString() === client._id?.toString() ? 'text-white' : 'text-[#193043]'} group-hover:text-[#1e3a5f]`} />
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${selectedClient?._id?.toString() === client._id?.toString() ? 'text-white' : 'text-gray-900'}`}>
                      {client.name}
                    </div>
                    <div className={`text-xs truncate ${
                      selectedClient?._id?.toString() === client._id?.toString()
                        ? 'text-white text-opacity-75'
                        : 'text-gray-500'
                    }`}>
                      {client.email}
                    </div>
                    <div className={`text-xs ${
                      selectedClient?._id?.toString() === client._id?.toString()
                        ? 'text-white text-opacity-75'
                        : 'text-gray-400'
                    }`}>
                      Status: <span className={`capitalize ${
                        client.status === 'active'
                          ? 'text-green-400'
                          : client.status === 'inactive'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {client.status}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
