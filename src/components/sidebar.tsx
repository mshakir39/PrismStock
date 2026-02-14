'use client';
import Link from 'next/link';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { FaFileInvoice, FaShieldAlt, FaBuilding, FaBox } from 'react-icons/fa';
import { FaUserFriends } from 'react-icons/fa';
import { TbCategoryPlus } from 'react-icons/tb';
import { IoMdSettings } from 'react-icons/io';
import { IoLogOut } from 'react-icons/io5';
import { RiMenuFoldLine, RiMenuUnfoldLine } from 'react-icons/ri';
import { MdDashboard } from 'react-icons/md';
import { HiX } from 'react-icons/hi';
import Modal from '@/components/modal';
import Button from '@/components/button';
import Input from '@/components/customInput';
import { POST } from '@/utils/api';
import { toast } from 'react-toastify';
import { getStoreDetail } from '@/getData/getStoreDetail';
import { signOut } from 'next-auth/react';
import Cookies from 'js-cookie';
import { useAuth } from '@/hooks/useAuth';

interface NavigationItem {
  href: string;
  label: string;
  icon: any;
  active: boolean;
  requiredPermissions?: string[];
}

interface SidebarProps {
  className?: string;
  onCollapseChange?: (collapsed: boolean) => void;
  basePath?: string;
}

const Sidebar = ({
  className,
  onCollapseChange,
  basePath = '',
}: SidebarProps) => {
  const path = usePathname();
  console.log('Current path:', path);
  console.log('Base path should be:', '/dashboard');
  // Remove the base path for active link highlighting
  const cleanPath =
    basePath && path?.startsWith(basePath) ? path.slice(basePath.length) : path;
  const router = useRouter();
  const { user } = useAuth();

  // Helper function to get initials
  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [storeData, setStoreData] = useState<any>();
  const [storeDetail, setStoreDetail] = useState<any>({ storeName: 'Prism Stock' });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle mobile menu toggling
  const handleMobileLinkClick = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Navigation state is now handled by Next.js Link components directly

  // React 19: Memoized navigation items for better performance
  const navigationItems = useMemo(
    () => {
      const items = [
        {
          href: ROUTES.DASHBOARD,
          label: 'Dashboard',
          icon: MdDashboard,
          active:
            cleanPath === '/' || cleanPath === '' || cleanPath === '/dashboard',
        },
        {
          href: ROUTES.CATEGORY,
          label: 'Categories',
          icon: TbCategoryPlus,
          active: cleanPath === '/categories' || cleanPath === '/categories/',
        },
        {
          href: ROUTES.PRODUCTS,
          label: 'Products',
          icon: FaBox,
          active: cleanPath === '/products' || cleanPath === '/products/',
        },
        // {
        //   href: ROUTES.BRANDS,
        //   label: 'Brands',
        //   icon: FaTags,
        //   active: cleanPath === '/brands' || cleanPath === '/brands/',
        // },
        // {
        //   href: ROUTES.STOCK,
        //   label: 'Stock',
        //   icon: FaCarBattery,
        //   active: cleanPath === '/stock' || cleanPath === '/stock/',
        // },
        {
          href: ROUTES.INVOICES,
          label: 'Invoices',
          icon: FaFileInvoice,
          active: cleanPath === '/invoices' || cleanPath === '/invoices/',
        },
        {
          href: ROUTES.SALES,
          label: 'Sales',
          icon: FaFileInvoice,
          active: cleanPath === '/sales' || cleanPath === '/sales/',
        },
        {
          href: ROUTES.CUSTOMERS,
          label: 'Customers',
          icon: FaUserFriends,
          active: cleanPath === '/customers' || cleanPath === '/customers/',
        },
        {
          href: ROUTES.CLIENTS,
          label: 'Clients',
          icon: FaBuilding,
          active: cleanPath === '/clients' || cleanPath === '/clients/',
          requiredPermissions: ['clients.read'], // Only show if user has clients.read permission
        },
        {
          href: ROUTES.USERS,
          label: 'Users',
          icon: FaUserFriends,
          active: cleanPath === '/users' || cleanPath === '/users/',
          requiredPermissions: ['users.read'], // Only show if user has users.read permission
        },
        {
          href: ROUTES.WARRANTY_CHECK,
          label: 'Warranty Check',
          icon: FaShieldAlt,
          active: cleanPath === '/warranty-check',
        },
      ];

      // Filter navigation items based on user permissions
      const filteredItems: NavigationItem[] = items.filter(item => {
        // If no required permissions, show the item
        if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
          return true;
        }
        
        // Check if user has all required permissions
        return item.requiredPermissions.every(permission => 
          user?.permissions?.includes(permission) || 
          user?.role === 'super_admin'
        );
      });

      return filteredItems;
    },
    [cleanPath, user]
  );

  // React 19: Memoized store initials for better performance
  const storeInitials = useMemo(() => {
    const getInitials = (name: string) => {
      if (!name) return '';
      return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase();
    };
    return getInitials(storeDetail?.storeName || '');
  }, [storeDetail?.storeName]);

  useEffect(() => {
    const fetchStoreDetail = async () => {
      try {
        const store = await getStoreDetail();
        if (store && Array.isArray(store) && store.length > 0) {
          setStoreDetail(store[0]);
        } else {
          setStoreDetail({ storeName: 'Prism Stock' }); // Fallback
        }
      } catch (error) {
        setStoreDetail({ storeName: 'Prism Stock' }); // Fallback
      }
    };

    fetchStoreDetail();
  }, []); // Empty dependency array - only run once on mount

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [path]);

  // React 19: Enhanced prefetching with better performance
  useEffect(() => {
    const routesToPrefetch = [
      '/',
      '/category',
      '/sales',
      '/stock',
      '/customers',
      '/brands',
      '/invoices',
      '/warranty-check',
    ];

    // React 19: More efficient prefetching with requestIdleCallback
    const prefetchAll = () => {
      routesToPrefetch.forEach((r) => {
        try {
          router.prefetch(r);
        } catch {}
      });
    };

    // React 19: Use requestIdleCallback for better performance
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetchAll, { timeout: 2000 });
    } else {
      setTimeout(prefetchAll, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation is now handled by Next.js Link components directly

  // Handle clicks outside sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const target = event.target as Node;

      if (isMobileMenuOpen && sidebar && !sidebar.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent body scroll when menu is open
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setIsLoading(true);
      let data = { ...storeDetail };
      data.storeName = storeData.storeName;
      const response: any = await POST('api/storeDetail', data);

      if (response?.message) {
        toast.success(response?.message);
        // Refresh store detail after successful update
        const updatedStore = await getStoreDetail();
        if (
          updatedStore &&
          Array.isArray(updatedStore) &&
          updatedStore.length > 0
        ) {
          setStoreDetail(updatedStore[0]);
        }
      }

      if (response?.error) {
        toast.error(response?.error);
      }

      setIsLoading(false);
      setIsModalOpen(false);
    } catch (error) {}
  };

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setStoreData((prevStore: any) => ({ ...prevStore, [name]: value }));
    },
    []
  );

  const sidebarContent = (
    <>
      {/* Mobile Header with Close Button */}
      <div className='flex items-center justify-between p-4 md:hidden'>
        <span className='text-lg font-semibold text-white'>
          {storeDetail?.storeName || 'Store'}
        </span>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className='rounded-full p-2 hover:bg-white hover:bg-opacity-20'
        >
          <HiX className='h-5 w-5 text-white' />
        </button>
      </div>

      <div className='flex h-full flex-col justify-between p-4'>
        {/* Header - Desktop Only */}
        <div className='flex flex-col'>
          <span
            className={`mb-6 hidden text-center font-semibold text-white transition-all duration-300 md:block
            ${isCollapsed ? 'text-base flex flex-col items-center' : 'text-xl flex items-center justify-center'}`}
          >
            {isCollapsed ? (
              <div className="flex flex-col items-center">
                <svg width="24" height="20" viewBox="0 0 80 70" className="mb-1 text-white" fill="currentColor">
                  <polygon points="5,60 30,10 55,60" fill="currentColor"/>
                  <polygon points="55,60 75,50 50,0 30,10" fill="currentColor" opacity="0.8"/>
                  <polygon points="5,60 55,60 75,50 25,50" fill="currentColor" opacity="0.6"/>
                </svg>
                <span className="text-xs">{storeInitials}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg width="20" height="16" viewBox="0 0 80 70" className="mr-2 text-white flex-shrink-0" fill="currentColor">
                  <polygon points="5,60 30,10 55,60" fill="currentColor"/>
                  <polygon points="55,60 75,50 50,0 30,10" fill="currentColor" opacity="0.8"/>
                  <polygon points="5,60 55,60 75,50 25,50" fill="currentColor" opacity="0.6"/>
                </svg>
                <span className="text-white font-semibold">{storeDetail?.storeName || 'Prism Stock'}</span>
              </div>
            )}
          </span>

          {/* User Info Section */}
          <div className={`mb-6 rounded-lg bg-white bg-opacity-10 p-3 ${
            isCollapsed ? 'text-center' : ''
          }`}>
            <div className={`flex items-center ${isCollapsed ? 'flex-col' : ''}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white bg-opacity-20 ${
                isCollapsed ? 'mb-2' : 'mr-3'
              }`}>
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className={`${isCollapsed ? 'hidden' : 'flex-1 min-w-0'}`}>
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-white text-opacity-75 truncate">
                  {user?.email || ''}
                </p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                  user?.role === 'super_admin' 
                    ? 'bg-red-100 text-red-800' 
                    : user?.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : user?.role === 'manager'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user?.role?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'User'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className='flex flex-1 flex-col space-y-2 overflow-y-auto'>
            {navigationItems.map((item: NavigationItem, index: number) => {
              const Icon = item.icon;
              return (
                <Link
                  key={`${item.href}-${index}`} // Unique key combining href and index
                  href={`${basePath}${item.href}`}
                  className={`sidebarItem flex touch-manipulation items-center rounded-lg p-3 transition-all duration-200 ${
                      item.active
                        ? 'active'
                        : ''
                    }`}
                >
                  <Icon
                    className='h-6 w-6 flex-shrink-0 transition-colors duration-200'
                  />
                  <span
                    className={`ml-3 font-medium transition-all duration-300 ${
                      isCollapsed ? 'hidden' : 'block'
                    } md:${isCollapsed ? 'hidden' : 'block'}`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className='mt-auto flex flex-col space-y-2'>
          {/* Settings Button */}
          <button
            onClick={() => {
              setIsModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className='sidebarItem flex touch-manipulation items-center rounded-lg p-3 text-white transition-all duration-200 hover:bg-white hover:bg-opacity-20 active:bg-white active:bg-opacity-30'
          >
            <IoMdSettings className='h-6 w-6 flex-shrink-0 text-white' />
            <span
              className={`ml-3 font-medium transition-all duration-300 ${
                isCollapsed ? 'hidden' : 'block'
              } md:${isCollapsed ? 'hidden' : 'block'}`}
            >
              Settings
            </span>
          </button>

          <button
            onClick={() => {
              // Immediately hide sidebar by clearing state
              Cookies.remove('userId');
              Cookies.remove('dashboard-unlocked');
              signOut({ callbackUrl: ROUTES.SIGNIN });
            }}
            className='sidebarItem flex touch-manipulation items-center rounded-lg p-3 text-white transition-all duration-200 hover:bg-white hover:bg-opacity-20 active:bg-white active:bg-opacity-30'
          >
            <IoLogOut className='h-6 w-6 flex-shrink-0 text-white' />
            <span
              className={`ml-3 font-medium transition-all duration-300 ${
                isCollapsed ? 'hidden' : 'block'
              } md:${isCollapsed ? 'hidden' : 'block'}`}
            >
              Logout
            </span>
          </button>
        </div>
      </div>
    </>
  );

  if (path === ROUTES.SIGNIN) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className='fixed left-4 top-4 z-50 rounded-lg bg-primary p-2 shadow-lg md:hidden hover:bg-primaryDark'
      >
        <RiMenuUnfoldLine className='h-6 w-6 text-white' />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className='fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden' />
      )}

      {/* Desktop Sidebar */}
      <div
        id='sidebar'
        className={`
          ${className}
          hidden h-svh shadow-lg
          transition-all duration-300 ease-in-out md:fixed md:left-0 md:top-0 md:z-30 md:flex md:flex-col
          ${isCollapsed ? 'w-20' : 'w-64'}
          scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
        `}
        style={{
          background: 'linear-gradient(to bottom, #193043, #1e3a5f, #234466)'
        }}
      >
        {/* Desktop Toggle Button */}
        <button
          onClick={() => {
            const newCollapsedState = !isCollapsed;
            setIsCollapsed(newCollapsedState);
            onCollapseChange?.(newCollapsedState);
          }}
          className='absolute -right-3 top-9 z-50 hidden rounded-full bg-white p-1.5 shadow-lg hover:bg-gray-100 md:block'
        >
          {isCollapsed ? (
            <RiMenuUnfoldLine className='h-4 w-4 text-primary' />
          ) : (
            <RiMenuFoldLine className='h-4 w-4 text-primary' />
          )}
        </button>

        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div
        id='sidebar'
        className={`
          fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] shadow-lg transition-transform duration-300 ease-in-out md:hidden
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          background: 'linear-gradient(to bottom, #193043, #1e3a5f, #234466)'
        }}
      >
        {sidebarContent}
      </div>

      {/* Settings Modal */}
      {isModalOpen && (
        <Modal
          parentClass='hidden'
          dialogPanelClass='!w-[95%] sm:!w-[90%] md:!w-[60%] lg:!w-[40%] max-w-md mx-auto'
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title='Store Detail'
        >
          <form onSubmit={handleSubmit}>
            <div className='mt-4 flex w-full flex-col gap-4'>
              <Input
                type='text'
                label='Store Name'
                name='storeName'
                onChange={handleChange}
                required
              />
              <Button
                className='w-full sm:w-fit'
                variant='fill'
                text='Save'
                type='submit'
                isPending={isLoading}
              />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default Sidebar;
