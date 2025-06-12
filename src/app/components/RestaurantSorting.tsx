'use client'

import { useState } from 'react'

interface SortingProps {
  currentSort: string
  currentOrder: string
  currentCityFilter: string
  userCity: string | null
  onSortChange: (sortBy: string, sortOrder: string, cityFilter: string) => void
}

export default function RestaurantSorting({ 
  currentSort, 
  currentOrder, 
  currentCityFilter, 
  userCity, 
  onSortChange 
}: SortingProps) {
  const [isOpen, setIsOpen] = useState(false)

  const sortOptions = [
    { value: 'admin', label: 'Admin Recommended', icon: '⭐' },
    { value: 'rating', label: 'Rating', icon: '📊' },
    { value: 'distance', label: 'Distance', icon: '📍' },
    { value: 'price', label: 'Price', icon: '💰' }
  ]

  const handleSortChange = (sortBy: string) => {
    let newOrder = 'desc'
    
    // Default sort orders for different criteria
    if (sortBy === 'price') {
      newOrder = 'asc' // Cheapest first
    } else if (sortBy === 'distance') {
      newOrder = 'asc' // Closest first
    } else if (sortBy === 'rating') {
      newOrder = 'desc' // Highest rating first
    } else if (sortBy === 'admin') {
      newOrder = 'asc' // Admin display order
    }
    
    onSortChange(sortBy, newOrder, currentCityFilter)
    setIsOpen(false)
  }

  const toggleOrder = () => {
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc'
    onSortChange(currentSort, newOrder, currentCityFilter)
  }

  const toggleCityFilter = () => {
    const newCityFilter = currentCityFilter === 'same' ? 'all' : 'same'
    onSortChange(currentSort, currentOrder, newCityFilter)
  }

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === currentSort)
    return option ? option.label : 'Sort'
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border">
      {/* Sort By Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full sm:w-48 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
        >
          <span className="flex items-center gap-2">
            <span>{sortOptions.find(opt => opt.value === currentSort)?.icon}</span>
            <span className="font-medium">{getCurrentSortLabel()}</span>
          </span>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                  currentSort === option.value ? 'bg-teal-50 text-teal-700' : ''
                }`}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
                {currentSort === option.value && (
                  <span className="ml-auto text-teal-600">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sort Order Toggle */}
      {currentSort !== 'admin' && (
        <button
          onClick={toggleOrder}
          className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
        >
          <span>{currentOrder === 'asc' ? '↑' : '↓'}</span>
          <span className="font-medium">
            {currentSort === 'price' 
              ? (currentOrder === 'asc' ? 'Cheapest First' : 'Most Expensive First')
              : currentSort === 'rating'
              ? (currentOrder === 'asc' ? 'Lowest Rating' : 'Highest Rating')
              : currentSort === 'distance'
              ? (currentOrder === 'asc' ? 'Closest First' : 'Farthest First')
              : (currentOrder === 'asc' ? 'A-Z' : 'Z-A')
            }
          </span>
        </button>
      )}

      {/* City Filter Toggle */}
      <button
        onClick={toggleCityFilter}
        className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
      >
        <span>{currentCityFilter === 'same' ? '🏠' : '🌍'}</span>
        <span className="font-medium">
          {currentCityFilter === 'same' 
            ? `${userCity || 'Your City'} Only` 
            : 'All Cities'
          }
        </span>
      </button>

      {/* Current Filters Display */}
      <div className="flex items-center gap-2 text-sm text-gray-600 ml-auto">
        <span>Showing:</span>
        <span className="font-medium text-teal-600">
          {currentCityFilter === 'same' ? `${userCity || 'Your City'}` : 'All Cities'}
        </span>
        <span>•</span>
        <span className="font-medium text-teal-600">
          {getCurrentSortLabel()}
          {currentSort !== 'admin' && (
            <span className="ml-1">
              ({currentOrder === 'asc' ? '↑' : '↓'})
            </span>
          )}
        </span>
      </div>
    </div>
  )
} 