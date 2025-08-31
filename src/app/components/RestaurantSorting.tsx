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
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 rounded-lg shadow-sm border" style={{
      backgroundColor: 'var(--card, #1e293b)',
      borderColor: 'rgba(148, 163, 184, 0.2)',
      color: 'var(--foreground, #f1f5f9)'
    }}>
      {/* Sort By Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full sm:w-48 px-4 py-2 border rounded-lg transition"
          style={{
            backgroundColor: 'var(--background, #0f172a)',
            borderColor: 'rgba(148, 163, 184, 0.3)',
            color: 'var(--foreground, #f1f5f9)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--background, #0f172a)'}
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
          <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-10" style={{
            backgroundColor: 'var(--card, #1e293b)',
            borderColor: 'rgba(148, 163, 184, 0.3)'
          }}>
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className="w-full px-4 py-2 text-left flex items-center gap-2 transition"
                style={{
                  color: currentSort === option.value ? 'var(--primary, #14b8a6)' : 'var(--foreground, #f1f5f9)',
                  backgroundColor: currentSort === option.value ? 'rgba(20, 184, 166, 0.1)' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (currentSort !== option.value) {
                    e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentSort !== option.value) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
                {currentSort === option.value && (
                  <span className="ml-auto" style={{ color: 'var(--primary, #14b8a6)' }}>✓</span>
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
          className="flex items-center gap-2 px-4 py-2 border rounded-lg transition"
          style={{
            backgroundColor: 'var(--background, #0f172a)',
            borderColor: 'rgba(148, 163, 184, 0.3)',
            color: 'var(--foreground, #f1f5f9)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--background, #0f172a)'}
        >
          <span>{currentOrder === 'asc' ? '↑' : '↓'}</span>
          <span className="font-medium">
            {currentSort === 'price' 
              ? (currentOrder === 'asc' ? 'Cheapest First' : 'Most Expensive First')
              : currentSort === 'rating'
              ? (currentOrder === 'asc' ? 'Lowest Rating' : 'Highest Rating')
              : currentSort === 'distance'
              ? (currentOrder === 'asc' ? 'Farthest First' : 'Closest First')
              : (currentOrder === 'asc' ? 'A-Z' : 'Z-A')
            }
          </span>
        </button>
      )}

      {/* City Filter Toggle */}
      <button
        onClick={toggleCityFilter}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg transition"
        style={{
          backgroundColor: 'var(--background, #0f172a)',
          borderColor: 'rgba(148, 163, 184, 0.3)',
          color: 'var(--foreground, #f1f5f9)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--background, #0f172a)'}
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
      <div className="flex items-center gap-2 text-sm ml-auto" style={{ color: 'rgba(241, 245, 249, 0.7)' }}>
        <span>Showing:</span>
        <span className="font-medium" style={{ color: 'var(--primary, #14b8a6)' }}>
          {currentCityFilter === 'same' ? `${userCity || 'Your City'}` : 'All Cities'}
        </span>
        <span>•</span>
        <span className="font-medium" style={{ color: 'var(--primary, #14b8a6)' }}>
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