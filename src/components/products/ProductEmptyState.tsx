'use client';

import React from 'react';
import Button from '@/components/button';

interface ProductEmptyStateProps {
  onCreateProduct: () => void;
}

export default function ProductEmptyState({ onCreateProduct }: ProductEmptyStateProps) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="max-w-md mx-auto">
        {/* Gradient Background Circle */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f0f4f8] to-[#e1e7ed] rounded-full p-8"></div>
          <div className="relative bg-white rounded-full p-12 shadow-lg">
            <svg className="mx-auto h-20 w-20 text-[#193043]" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          No Products Yet
        </h3>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          Start building your product catalog by creating your first product. Add detailed information, pricing, and inventory to manage your business effectively.
        </p>

        {/* Call to Action Button */}
        <div className="flex justify-center">
          <Button
            text="Create Your First Product"
            onClick={onCreateProduct}
            variant="fill"
            className="bg-[#193043] hover:bg-[#2a4156] text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          />
        </div>

        {/* Additional Tips */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">💡 Pro Tips:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Organize products by categories for easy management</li>
            <li>• Set accurate pricing and cost information</li>
            <li>• Track inventory levels to avoid stockouts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
