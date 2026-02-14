'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { IClient } from '@/interfaces/client';
import Button from '@/components/button';
import Input from '@/components/customInput';
import Modal from '@/components/modal';
import { toast } from 'react-toastify';
import DataGrid, { DataGridColumn, DataGridActionMenu, DataGridEmptyState } from '@/components/shared/DataGrid';

interface ClientLayoutProps {
  clients: IClient[];
}

function ClientLayout({ clients: initialClients }: ClientLayoutProps) {
  const { user: currentUser } = useAuth();
  const [clients, setClients] = useState<IClient[]>(initialClients);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active' as 'active' | 'inactive' | 'suspended'
  });

  // DataGrid configuration
  const columns: DataGridColumn[] = [
    {
      headerName: 'Client Name',
      field: 'name',
      cellRenderer: (params: any) => (
        <div className="font-medium text-gray-900">{params.value || ''}</div>
      ),
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 150,
    },
    {
      headerName: 'Email',
      field: 'email',
      cellRenderer: (params: any) => (
        <div className="text-gray-500">{params.value || ''}</div>
      ),
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 180,
    },
    {
      headerName: 'Phone',
      field: 'phone',
      cellRenderer: (params: any) => (
        <div className="text-gray-500">{params.value || ''}</div>
      ),
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 120,
    },
    {
      headerName: 'Status',
      field: 'status',
      cellRenderer: (params: any) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(params.value)}`}>
          {params.value || 'active'}
        </span>
      ),
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 100,
    },
    {
      headerName: 'Created At',
      field: 'createdAt',
      cellRenderer: (params: any) => (
        <div className="text-gray-500">
          {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
        </div>
      ),
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 120,
    },
  ];

  const actionMenu: DataGridActionMenu = {
    actions: [
      {
        label: 'Edit',
        onClick: (client: any) => handleEdit(client),
        icon: (
          <svg className="text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.829-2.828z" />
          </svg>
        ),
      },
      {
        label: 'Delete',
        onClick: (client: any) => handleDelete(client),
        className: 'text-red-600 hover:bg-red-50',
        icon: (
          <svg className="text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ),
      },
    ],
  };

  const emptyState: DataGridEmptyState = {
    icon: (
      <svg className="text-[#193043]" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: 'No Clients Yet',
    description: 'Start managing your clients by creating your first client organization. Add their contact information and track their accounts.',
    actionButton: {
      text: 'Create Your First Client',
      onClick: () => setShowCreateDialog(true),
    },
    tips: [
      '• Organize clients by their business type',
      '• Maintain accurate contact information',
      '• Track client status for better management',
    ],
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setClients(data.clients || []);
      } else {
        toast.error(data.error || 'Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Client created successfully');
        setShowCreateDialog(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          status: 'active'
        });
        fetchClients(); // Refresh clients list
      } else {
        toast.error(data.error || 'Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    }
  };

  const handleDelete = async (client: IClient) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const response = await fetch('/api/clients', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: (client as any).id || client._id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Client deleted successfully');
        fetchClients(); // Refresh clients list
      } else {
        toast.error(result.error || 'Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

  const handleEdit = (client: IClient) => {
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      status: client.status || 'active'
    });
    setShowCreateDialog(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-0 py-6 md:p-6">
      <DataGrid
        data={clients}
        columns={columns}
        actionMenu={actionMenu}
        emptyState={emptyState}
        title="Client Management"
        onCreateClick={() => setShowCreateDialog(true)}
        showCreateButton={currentUser?.isSuperAdmin}
        createButtonText="Create New Client"
      />

      {/* Create Client Modal */}
      {showCreateDialog && (
        <Modal
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          title="Create New Client"
        >
          <form onSubmit={handleCreateClient}>
            <div className="mt-4 flex w-full flex-col gap-4">
              <Input
                type="text"
                label="Client Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                type="email"
                label="Email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                type="tel"
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Input
                type="text"
                label="Address"
                name="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
              <div className="flex gap-4">
                <Button
                  className="w-full"
                  variant="fill"
                  text="Create Client"
                  type="submit"
                />
                <Button
                  className="w-full"
                  variant="outline"
                  text="Cancel"
                  onClick={() => setShowCreateDialog(false)}
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default ClientLayout;
