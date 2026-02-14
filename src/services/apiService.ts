// API Service Layer - Standardized data fetching across the application

export class ApiResponse<T = any> {
  success: boolean = false;
  data?: T;
  error?: string;
  message?: string;

  constructor(success: boolean = false, data?: T, error?: string, message?: string) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.message = message;
  }
}

export class ApiService {
  private static baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://prismstock.com/api' 
    : '/api';

  private static getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  private static async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to parse response'
      };
    }
  }

  // GET requests
  static async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store'
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // POST requests
  static async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // PUT requests
  static async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // PATCH requests
  static async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // DELETE requests
  static async delete<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Specialized methods for common operations
  static async create<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.post<T>(endpoint, data);
  }

  static async update<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.patch<T>(endpoint, data);
  }

  static async remove<T = any>(endpoint: string, id?: string): Promise<ApiResponse<T>> {
    const finalEndpoint = id ? `${endpoint}?id=${id}` : endpoint;
    return this.delete<T>(finalEndpoint);
  }
}

// Specific API endpoints
export const ApiEndpoints = {
  // Categories
  CATEGORIES: '/categories',
  
  // Products
  PRODUCTS: '/products',
  
  // Clients
  CLIENTS: '/clients',
  
  // Users
  USERS: '/users',
  USER_RESET_PASSWORD: '/users/reset-password',
  USER_TOGGLE_STATUS: '/users/toggle-status',
  
  // Invoices
  INVOICES: '/invoice',
  
  // Sales
  SALES: '/sales',
  
  // Warranty
  WARRANTY: '/warranty',
  
  // Price List
  PRICE_LIST: '/priceList',
} as const;
