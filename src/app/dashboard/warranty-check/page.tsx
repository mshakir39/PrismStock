'use client';
import React, { useState, useOptimistic, useActionState } from 'react';
import Input from '@/components/customInput';
import Button from '@/components/button';
import { searchWarranty } from '@/actions/warrantyActions';
import WarrantyDetails from '@/components/warranty/WarrantyDetails';
import WarrantyErrorBoundary from '@/components/warranty/WarrantyErrorBoundary';
import { toast } from 'react-toastify';
import { FaSearch, FaShieldAlt, FaInfoCircle, FaHistory } from 'react-icons/fa';

export default function WarrantyCheckPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [warrantyData, setWarrantyData] = useState<any>(null);

  // React 19: Search history state
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // React 19: useActionState for form handling
  const [searchState, searchAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const warrantyCode = formData.get('warrantyCode') as string;
      const trimmedSearchTerm = warrantyCode?.trim();

      if (!trimmedSearchTerm) {
        toast.error('Please enter a warranty code');
        return { error: 'Please enter a warranty code' };
      }

      try {
        const result = await searchWarranty(trimmedSearchTerm);

        if (result.success) {
          setWarrantyData(result.data);
          // Update search history
          setSearchHistory((prev) => {
            const newHistory = [trimmedSearchTerm, ...prev.filter(item => item !== trimmedSearchTerm)];
            return newHistory.slice(0, 10); // Keep last 10 searches
          });
          return { success: true, data: result.data };
        } else {
          toast.error(result.error || 'No warranty found');
          setWarrantyData(null);
          return { error: result.error || 'No warranty found' };
        }
      } catch (error) {
        console.error('Error searching warranty:', error);
        toast.error('Error searching warranty');
        return { error: 'Error searching warranty' };
      }
    },
    null
  );

  // React 19: Handle quick search from history
  const handleQuickSearch = (code: string) => {
    setSearchTerm(code);
    // Direct search call for quick search from history
    searchWarranty(code)
      .then((result) => {
        if (result.success) {
          setWarrantyData(result.data);
          setSearchHistory((prev) => {
            const newHistory = [code, ...prev.filter(item => item !== code)];
            return newHistory.slice(0, 10);
          });
        } else {
          toast.error(result.error || 'No warranty found');
          setWarrantyData(null);
        }
      })
      .catch((error) => {
        console.error('Error searching warranty:', error);
        toast.error('Error searching warranty');
      });
  };

  // React 19: Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    toast.success('Search history cleared');
  };

  return (
    // React 19: Error boundary for better error handling
    <WarrantyErrorBoundary>
      <div className='min-h-screen bg-gray-50'>
        <div className='container mx-auto px-4 py-8'>
          <div className='max-w-4xl mx-auto'>
            {/* Header Section */}
            <div className='mb-8 text-center'>
              <div className='mb-4 flex items-center justify-center'>
                <FaShieldAlt className='mr-3 text-4xl text-primary' />
                <h1 className='text-3xl font-bold text-gray-900'>Battery Warranty Check</h1>
              </div>
              <p className='text-gray-600 text-lg'>
                Enter your warranty code to check the status of your battery warranty
              </p>
            </div>

            {/* Search Section */}
            <div className='mb-8 rounded-lg bg-white p-8 shadow-sm border border-gray-200'>
              {/* React 19: Modern form with useActionState */}
              <form action={searchAction}>
                <div className='space-y-6'>
                  <div className='flex flex-col md:flex-row gap-4'>
                    <div className='flex-1'>
                      <Input
                        type='text'
                        placeholder='Enter warranty code(s) - supports multiple codes separated by comma or space'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        parentClass='w-full'
                        label='Warranty Code'
                        name='warrantyCode'
                        className='h-12 text-base border-gray-300 focus:border-primary focus:ring-primary'
                      />
                    </div>
                    <Button
                      type='submit'
                      disabled={isPending}
                      variant='fill'
                      className='min-w-[140px]'
                      text={isPending ? 'Searching...' : 'Search'}
                    />
                  </div>
                </div>
              </form>

              {/* React 19: Search History */}
              {searchHistory.length > 0 && (
                <div className='mt-6 border-t border-gray-200 pt-6'>
                  <div className='mb-3 flex items-center justify-between'>
                    <div className='flex items-center text-sm text-gray-600 font-medium'>
                      <FaHistory className='mr-2 text-primary' />
                      Recent Searches
                    </div>
                    <Button
                      onClick={clearSearchHistory}
                      variant='outline'
                      text='Clear All'
                    />
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {searchHistory.map((code: string, index: number) => (
                      <Button
                        key={`search-${index}-${code}`}
                        onClick={() => handleQuickSearch(code)}
                        variant='outline'
                        text={code}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Information Section (shown when no search result) */}
            {!warrantyData && !isPending && (
              <div className='rounded-lg border border-custom/20 bg-custom/5 p-8'>
                <div className='mb-6 flex items-start'>
                  <FaInfoCircle className='mr-3 mt-1 text-xl text-custom' />
                  <div>
                    <h2 className='text-xl font-semibold text-custom mb-2'>
                      How to Find Your Warranty Code
                    </h2>
                    <p className='text-gray-700 mb-4'>
                      Your warranty code can be found:
                    </p>
                  </div>
                </div>
                <div className='ml-8'>
                  <ul className='list-inside list-disc space-y-2 text-gray-700 mb-6'>
                    <li>On your battery purchase invoice</li>
                    <li>On the warranty card provided with your battery</li>
                    <li>In the warranty section of your sales receipt</li>
                  </ul>
                  <div className='bg-white rounded-lg p-4 border border-gray-200'>
                    <div className='text-sm text-gray-600 space-y-2'>
                      <p>
                        <strong className='text-custom'>Multiple Codes:</strong> You can enter multiple
                        warranty codes separated by comma or space
                      </p>
                      <p>
                        <strong className='text-custom'>Examples:</strong> "ABC123, DEF456" or
                        "ABC123 DEF456" or "1646603376 1291636542"
                      </p>
                      <p className='text-custom'><strong>Format:</strong> The warranty code format looks like: XXX-XXXXXXX</p>
                      <p className='mt-3 p-3 bg-custom/10 rounded text-custom font-medium'>
                        If you cannot find your warranty code, please contact our support team.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warranty Details */}
            {warrantyData && <WarrantyDetails warranty={warrantyData} />}
          </div>
        </div>
      </div>
    </WarrantyErrorBoundary>
  );
}
