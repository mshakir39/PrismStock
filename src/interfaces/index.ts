// Product Interface
export interface Product {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  category: any; // Full category object
  breadcrumb?: Array<{ id: string; name: string; slug: string }>; // Category breadcrumb path
  categoryInfo?: {
    parentCategory?: any; // Full parent category object
    subCategory?: any; // Full sub category object
    productCategories?: any[]; // Array of full category objects
  };
  price?: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  maxStock?: number;
  unit?: string;
  specifications?: Record<string, any>;
  isActive: boolean;
  clientId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// User Interfaces
export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  clientId?: string; // For multi-tenant support
  isSuperAdmin?: boolean; // For global super admin
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  profile?: {
    phone?: string;
    address?: string;
    avatar?: string;
  };
  permissions?: string[];
  [key: string]: any; // Allow additional properties from MongoDB
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  SALES = 'sales',
  VIEWER = 'viewer'
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<IUser, 'password'>;
  token?: string;
  error?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  clientId?: string; // For creating users under a client
  isSuperAdmin?: boolean; // For creating super admin users
  profile?: {
    phone?: string;
    address?: string;
  };
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
  profile?: {
    phone?: string;
    address?: string;
  };
}

// Client Interfaces
export interface IClient {
  _id: any; // ObjectId from MongoDB
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  createdBy: any; // ObjectId from MongoDB - Super Admin who created this client
}

export interface CreateClientData {
  name: string;
  email: string;
  phone: string;
  address: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

// Category and Battery Interfaces
export interface IBrand {
  id?: string;
  brandName: string;
  clientId?: string; // For multi-tenancy
}

export interface IBatterySeries {
  name: string;
  plate: string | number;
  ah: number;
  type?: string;
  retailPrice?: number;
  salesTax?: number;
  maxRetailPrice?: number;
  batteryType?: 'battery' | 'tonic'; // Track the battery type
}

export interface ICategory {
  id?: string;
  brandName: string;
  series: IBatterySeries[];
  salesTax: number;
  clientId?: string; // For multi-tenancy
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICategoryHistory extends ICategory {
  categoryId: string;
  historyDate: Date;
}

export interface CategoryWithBatteryData extends ICategory {
  id: string; // Make id required for the UI
  historyDate?: Date; // Optional for history entries
}

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HistoryEntry {
  _id?: string;
  categoryId?: string;
  brandName: string;
  series: IBatterySeries[];
  salesTax: number;
  historyDate: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Component Props Interfaces
export interface ClientContextType {
  selectedClient: IClient | null;
  setSelectedClient: (client: IClient | null) => void;
  clients: IClient[];
}

export interface AuthContextType {
  user: IUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CustomerData {
  customerName: string;
  phoneNumber: string;
  address: string;
  email?: string;
}

// Component Props
export interface CustomCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  parentClass?: string;
}

export interface CheckboxGroupProps {
  options: {
    id: string;
    value: string;
    label: string;
  }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  label?: string;
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  variant?: 'fill' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  children: React.ReactNode;
  parentClass?: string;
}

export interface DataGridColumn {
  headerName: string;
  field?: string;
  cellRenderer?: (params: any) => React.ReactElement;
  sortable?: boolean;
  filter?: boolean | string;
  resizable?: boolean;
  flex?: number;
  minWidth?: number;
  width?: number;
}

export interface DataGridActionMenu {
  actions: Array<{
    label: string;
    onClick: (data: any) => void;
    icon?: React.ReactElement;
    className?: string;
    disabled?: boolean;
  }>;
}

export interface DataGridEmptyState {
  icon: React.ReactElement;
  title: string;
  description: string;
  actionButton?: {
    text: string;
    onClick: () => void;
  };
  tips?: string[];
}

// Store Interfaces
export interface CategoryStore {
  categories: ICategory[];
  setCategories: (categories: ICategory[]) => void;
  fetchCategories: () => Promise<void>;
  addCategory: (category: ICategory) => void;
  updateCategory: (id: string, updates: Partial<ICategory>) => void;
  deleteCategory: (id: string) => void;
}

// Layout Props
export interface DashboardLayoutProps {
  initialStats: any;
}

export interface SalesLayoutProps {
  sales: any[];
  serverTimestamp?: number;
  dateRange?: DateRange;
}

export interface InvoiceLayoutProps {
  categories: ICategory[];
  invoices: any;
  products: any;
  customers: any;
  dateRange?: DateRange;
}

export interface CustomersLayoutProps {
  customers: any[];
  categories?: any[];
  serverTimestamp?: number;
  dateRange?: DateRange;
}

export interface ClientLayoutProps {
  clients: IClient[];
}

export interface CategoryLayoutProps {
  initialCategories: CategoryWithBatteryData[];
  initialBrands: IBrand[];
}

// Modal Props
export interface HistoryModalProps {
  isOpen: boolean;
  isLoadingHistory: boolean;
  historyData: CategoryWithBatteryData[];
  selectedHistoryEntry: CategoryWithBatteryData | null;
  onClose: () => void;
  onSelectHistoryEntry: (entry: CategoryWithBatteryData) => void;
  onBackToList: () => void;
}

export interface DeleteModalProps {
  isOpen: boolean;
  isLoading: boolean;
  deleteItem: {
    type: 'category' | 'battery';
    name: string;
    id: string;
  } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export interface DeleteCategoryModalProps {
  isOpen: boolean;
  isLoading: boolean;
  categoryToDelete: {
    brandName: string;
    series: IBatterySeries[];
  } | null;
  onClose: () => void;
  onConfirm: () => void;
}

// Table Props
export interface CategoryTableProps {
  categories: CategoryWithBatteryData[];
  isLoadingHistory: boolean;
  onViewCategory: (category: CategoryWithBatteryData) => void;
  onEditCategory: (category: CategoryWithBatteryData) => void;
  onDeleteCategory: (category: CategoryWithBatteryData) => void;
  onToggleStatus: (category: CategoryWithBatteryData) => void;
}

export interface BatteryListProps {
  detailData: CategoryWithBatteryData;
  searchQuery: string;
  editingBattery: string | null;
  onEditBattery: (batteryName: string) => void;
  onSaveBattery: (batteryName: string, updates: Partial<IBatterySeries>) => void;
  onCancelEdit: () => void;
  onDeleteBattery: (batteryName: string) => void;
}

export interface BatteryItemProps {
  item: IBatterySeries;
  detailData: CategoryWithBatteryData;
  editingBattery: string | null;
  onEditBattery: (batteryName: string) => void;
  onSaveBattery: (batteryName: string, updates: Partial<IBatterySeries>) => void;
  onCancelEdit: () => void;
  onDeleteBattery: (batteryName: string) => void;
}

// Error Boundary
export interface CategoryErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export interface CategoryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

export interface HistoryDetailViewProps {
  selectedHistoryEntry: CategoryWithBatteryData;
  onBackToList: () => void;
}

// Re-export client context for backward compatibility
export { useClientContext } from './clientContext';
