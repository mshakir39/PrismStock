import { DataGridColumn } from '@/components/shared/DataGrid';

export const userColumns: DataGridColumn[] = [
  {
    headerName: 'Name',
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
    headerName: 'Role',
    field: 'role',
    cellRenderer: (params: any) => {
      const roleColors: { [key: string]: string } = {
        'super_admin': 'bg-red-100 text-red-800',
        'admin': 'bg-purple-100 text-purple-800',
        'manager': 'bg-blue-100 text-blue-800',
        'sales': 'bg-green-100 text-green-800',
        'viewer': 'bg-gray-100 text-gray-800',
      };
      return (
        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${roleColors[params.value] || 'bg-gray-100 text-gray-800'}`}>
          {params.value?.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Viewer'}
        </span>
      );
    },
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  },
  {
    headerName: 'Status',
    field: 'isActive',
    cellRenderer: (params: any) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${
        params.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {params.value ? 'Active' : 'Inactive'}
      </span>
    ),
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  },
  {
    headerName: 'Last Login',
    field: 'lastLogin',
    cellRenderer: (params: any) => (
      <div className="text-gray-500">
        {params.value ? new Date(params.value).toLocaleDateString() : 'Never'}
      </div>
    ),
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 120,
  },
];

export const productColumns: DataGridColumn[] = [
  {
    headerName: 'Name',
    field: 'name',
    cellRenderer: (params: any) => (
      <div className="font-medium text-gray-900">{params.value}</div>
    ),
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 150,
  },
  {
    headerName: 'Price',
    field: 'price',
    cellRenderer: (params: any) => (
      <div className="text-gray-500">
        {params.value ? `$${params.value}` : '-'}
      </div>
    ),
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  },
  {
    headerName: 'Stock',
    field: 'stock',
    cellRenderer: (params: any) => (
      <div className="text-gray-500">{params.value || 0}</div>
    ),
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 80,
  },
  {
    headerName: 'Status',
    field: 'isActive',
    cellRenderer: (params: any) => (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        params.value
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {params.value ? 'Active' : 'Inactive'}
      </span>
    ),
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  },
];

export const getCategoryColumns = (getParentCategoryName: (parentId: string) => string): DataGridColumn[] => [
  {
    headerName: 'Name',
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
    headerName: 'Description',
    field: 'description',
    cellRenderer: (params: any) => (
      <div className="text-gray-500 text-sm">{params.value || '-'}</div>
    ),
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 200,
  },
  {
    headerName: 'Parent Category',
    field: 'parentCategory',
    cellRenderer: (params: any) => (
      <div className="text-gray-500 text-sm">
        {params.value ? getParentCategoryName(params.value) : '-'}
      </div>
    ),
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 150,
  },
  {
    headerName: 'Level',
    field: 'level',
    cellRenderer: (params: any) => (
      <div className="text-gray-500 text-sm">
        {params.value !== undefined ? `Level ${params.value}` : '-'}
      </div>
    ),
    sortable: true,
    filter: true,
    resizable: true,
    flex: 0.5,
    minWidth: 80,
  },
  {
    headerName: 'Status',
    field: 'isActive',
    cellRenderer: (params: any) => (
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${
        params.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {params.value ? 'Active' : 'Inactive'}
      </span>
    ),
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
  },
];
