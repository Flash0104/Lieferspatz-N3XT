'use client';

import { validateAddress } from '@/lib/geocoding';
import { useState } from 'react';

interface CitySearchProps {
  onAddressSubmit: (address: {
    city: string;
    streetName: string;
    blockNumber: string;
    postalCode?: string;
  }) => void;
  isLoading?: boolean;
}

export default function CitySearch({ onAddressSubmit, isLoading }: CitySearchProps) {
  const [address, setAddress] = useState({
    city: '',
    streetName: '',
    blockNumber: '',
    postalCode: ''
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address.city || !address.streetName || !address.blockNumber) {
      setValidationError('Please fill in all required fields');
      return;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      // Validate address exists
      const isValid = await validateAddress({
        city: address.city,
        streetName: address.streetName,
        blockNumber: address.blockNumber,
        postalCode: address.postalCode || undefined
      });

      if (!isValid) {
        setValidationError('Address not found. Please check your input.');
        setIsValidating(false);
        return;
      }

      onAddressSubmit(address);
    } catch (error) {
      setValidationError('Error validating address. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleQuickAddress = () => {
    const quickAddress = {
      city: 'Duisburg',
      streetName: 'Sonnenwall',
      blockNumber: '56',
      postalCode: '47057'
    };
    setAddress(quickAddress);
    onAddressSubmit(quickAddress);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        🏠 Your Location
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              City *
            </label>
            <input
              type="text"
              value={address.city}
              onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., Duisburg"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Postal Code
            </label>
            <input
              type="text"
              value={address.postalCode}
              onChange={(e) => setAddress(prev => ({ ...prev, postalCode: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., 47057"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Street Name *
            </label>
            <input
              type="text"
              value={address.streetName}
              onChange={(e) => setAddress(prev => ({ ...prev, streetName: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., Sonnenwall"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              House Number *
            </label>
            <input
              type="text"
              value={address.blockNumber}
              onChange={(e) => setAddress(prev => ({ ...prev, blockNumber: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., 56"
              required
            />
          </div>
        </div>

        {validationError && (
          <div className="text-red-400 text-sm mt-2">
            {validationError}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isValidating || isLoading}
            className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isValidating ? 'Validating...' : isLoading ? 'Finding Restaurants...' : 'Find Restaurants Near Me'}
          </button>
          
          <button
            type="button"
            onClick={handleQuickAddress}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 disabled:opacity-50 transition-colors"
            title="Use sample address"
          >
            Quick Fill
          </button>
        </div>
      </form>
      
      <div className="mt-4 text-xs text-gray-400">
        * Required fields. We use this to calculate distances to nearby restaurants.
      </div>
    </div>
  );
} 