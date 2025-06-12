'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Header from '../components/Header';

interface Restaurant {
  id: number;
  name: string;
  city: string;
  streetName: string;
  blockNumber: string;
  postalCode: string;
  address: string;
  description: string;
  rating: number;
  isOpen: boolean;
  averagePrepTime: number;
  imageUrl: string;
  displayOrder?: number;
  latitude?: number;
  longitude?: number;
  relevanceScore: number;
  matchType: string;
  matchedItems: any[];
  averagePrice: number;
}

interface SearchResponse {
  restaurants: Restaurant[];
  query: string;
  totalResults: number;
  userCity: string | null;
  groups: {
    restaurants: number;
    cities: number;
    food: number;
    other: number;
  };
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query && query.length >= 2) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data: SearchResponse = await response.json();
        setSearchResults(data);
      } else {
        setError('Search failed. Please try again.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantClick = (restaurantId: number) => {
    router.push(`/restaurant/${restaurantId}`);
  };

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'restaurant': return '🏪';
      case 'city': return '🏙️';
      case 'menu': return '🍽️';
      default: return '📍';
    }
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'restaurant': return 'Restaurant Name';
      case 'city': return 'City';
      case 'menu': return 'Food Item';
      default: return 'Other';
    }
  };

  return (
    <>
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Search Results
          </h1>
          {query && (
            <p className="text-slate-300">
              Showing results for: <span className="text-orange-400 font-semibold">"{query}"</span>
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* No Query */}
        {!query && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">Start Your Search</h2>
            <p className="text-slate-300">
              Search for restaurants, cities, or food types like "burger", "pizza", "döner"
            </p>
          </div>
        )}

        {/* Search Results */}
        {searchResults && !loading && (
          <>
            {/* Results Summary */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 mb-6 border border-slate-700">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-white font-semibold">
                  {searchResults.totalResults} results found
                </span>
                {searchResults.userCity && (
                  <span className="text-slate-300">
                    Your city: <span className="text-teal-400">{searchResults.userCity}</span>
                  </span>
                )}
                <div className="flex gap-4 text-slate-400">
                  {searchResults.groups.restaurants > 0 && (
                    <span>🏪 {searchResults.groups.restaurants} restaurants</span>
                  )}
                  {searchResults.groups.cities > 0 && (
                    <span>🏙️ {searchResults.groups.cities} cities</span>
                  )}
                  {searchResults.groups.food > 0 && (
                    <span>🍽️ {searchResults.groups.food} food items</span>
                  )}
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {searchResults.restaurants.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.restaurants.map((restaurant) => (
                  <div 
                    key={restaurant.id} 
                    onClick={() => handleRestaurantClick(restaurant.id)}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg border border-slate-700 hover:border-orange-400 transition-all duration-300 cursor-pointer hover:transform hover:scale-105"
                  >
                    <div className="relative h-48">
                      <img
                        src={restaurant.imageUrl || '/images/default-restaurant.png'}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          restaurant.isOpen 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {restaurant.isOpen ? '● Open' : '● Closed'}
                        </span>
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {getMatchTypeIcon(restaurant.matchType)} {getMatchTypeLabel(restaurant.matchType)}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-bold text-white">{restaurant.name}</h3>
                        <div className="flex items-center">
                          <span className="text-yellow-400 text-sm">★</span>
                          <span className="text-white ml-1 text-sm">{restaurant.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <p className="text-slate-300 text-sm mb-2">
                        {restaurant.streetName} {restaurant.blockNumber}, {restaurant.city}
                      </p>

                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                        {restaurant.description}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">
                          ⏱️ {restaurant.averagePrepTime} min
                        </span>
                        <span className="text-slate-300">
                          💰 ~€{restaurant.averagePrice.toFixed(0)} avg
                        </span>
                      </div>

                      {/* Matched Items */}
                      {restaurant.matchedItems.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <p className="text-xs text-slate-400 mb-2">Matched items:</p>
                          <div className="flex flex-wrap gap-1">
                            {restaurant.matchedItems.slice(0, 3).map((item, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800"
                              >
                                {item.name}
                              </span>
                            ))}
                            {restaurant.matchedItems.length > 3 && (
                              <span className="text-xs text-slate-400">
                                +{restaurant.matchedItems.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-white mb-2">No Results Found</h2>
                <p className="text-slate-300 mb-4">
                  We couldn't find any restaurants matching "{query}"
                </p>
                <div className="text-slate-400 text-sm">
                  <p>Try searching for:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Restaurant names (e.g., "McDonald's", "Burger King")</li>
                    <li>• Cities (e.g., "Berlin", "Munich", "Hamburg")</li>
                    <li>• Food types (e.g., "pizza", "burger", "sushi", "döner")</li>
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

function SearchFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Suspense fallback={<SearchFallback />}>
        <SearchContent />
      </Suspense>
    </div>
  );
} 