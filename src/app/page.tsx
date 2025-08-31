'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import RestaurantSorting from './components/RestaurantSorting';

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
  distance?: number;
  distanceText?: string;
  distanceLoading?: boolean;
  averagePrice?: number;
  displayOrder?: number;
  latitude?: number;
  longitude?: number;
}

interface RestaurantResponse {
  restaurants: Restaurant[];
  userCity: string | null;
  filters: {
    sortBy: string;
    sortOrder: string;
    cityFilter: string;
  };
}

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [currentSort, setCurrentSort] = useState('admin');
  const [currentOrder, setCurrentOrder] = useState('asc');
  const [currentCityFilter, setCityFilter] = useState('same');

  useEffect(() => {
    // Load restaurants on component mount with default sorting
    loadRestaurants('admin', 'asc', 'same');
  }, []);

  const loadRestaurants = async (sortBy = 'admin', sortOrder = 'asc', cityFilter = 'same') => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        cityFilter
      });
      
      // Load restaurants with new sorting system
      const response = await fetch(`/api/restaurants?${params}`);
      if (response.ok) {
        const data: RestaurantResponse = await response.json();
        setRestaurants(data.restaurants);
        setUserCity(data.userCity);
        setCurrentSort(data.filters.sortBy);
        setCurrentOrder(data.filters.sortOrder);
        setCityFilter(data.filters.cityFilter);
        
        // If sorting by distance, load distance calculations
        if (sortBy === 'distance') {
          loadDistances(data.restaurants);
        }
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDistances = async (restaurantList: Restaurant[]) => {
    try {
      // Multi-layer approach to get user location for distance calculation
      let apiUrl = '/api/restaurants-with-distance';
      let locationFound = false;
      
      // Layer 1: Try to get from session user object (frontend)
      if (session?.user && session.user.location && session.user.postalCode) {
        const params = new URLSearchParams({
          userLocation: session.user.location,
          userPostalCode: session.user.postalCode
        });
        apiUrl = `/api/restaurants-with-distance?${params.toString()}`;
        console.log('✅ Using session location:', session.user.location, session.user.postalCode);
        locationFound = true;
      }
      
      // Layer 2: Try to fetch user data from API (fallback)
      if (!locationFound && session?.user) {
        try {
          const userResponse = await fetch('/api/user/balance');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            const user = userData?.user;
            
            if (user && user.location && user.postalCode) {
              const params = new URLSearchParams({
                userLocation: user.location,
                userPostalCode: user.postalCode
              });
              apiUrl = `/api/restaurants-with-distance?${params.toString()}`;
              console.log('✅ Using API user location:', user.location, user.postalCode);
              locationFound = true;
            }
          }
        } catch (error) {
          console.log('API user location fetch failed:', error);
        }
      }
      
      // Layer 3: Intelligent fallback (handled by API)
      if (!locationFound) {
        console.log('🔄 Using intelligent fallback for distance calculation');
      }
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const distanceData = await response.json();
        
        // Merge distance data with current restaurants
        const updatedRestaurants = restaurantList.map(restaurant => {
          const distanceInfo = distanceData.find((d: any) => d.id === restaurant.id);
          return {
            ...restaurant,
            distance: distanceInfo?.distance,
            distanceText: distanceInfo?.distanceText
          };
        });
        
        // Sort by distance if that's the current sort
        if (currentSort === 'distance') {
          updatedRestaurants.sort((a, b) => {
            const aDistance = a.distance || 999;
            const bDistance = b.distance || 999;
            // Standard sorting: asc = smaller first, desc = larger first  
            return currentOrder === 'asc' ? aDistance - bDistance : bDistance - aDistance;
          });
        }
        
        setRestaurants(updatedRestaurants);
      }
    } catch (error) {
      console.error('Error loading distances:', error);
    }
  };

  const handleSortChange = (sortBy: string, sortOrder: string, cityFilter: string) => {
    loadRestaurants(sortBy, sortOrder, cityFilter);
  };

  const handleRestaurantClick = (restaurantId: number) => {
    router.push(`/restaurant/${restaurantId}`);
  };

  const handleViewMenuClick = (e: React.MouseEvent, restaurantId: number) => {
    e.stopPropagation(); // Prevent card click when clicking button
    router.push(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="container mx-auto px-4 pt-28 pb-8">
              <div className="text-center mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold mb-3" style={{ color: 'var(--foreground, #f1f5f9)' }}>
            Welcome to <span style={{ color: 'var(--accent, #f97316)' }}>Lieferspatz</span>
          </h1>
          <p className="text-lg mb-6" style={{ color: 'var(--foreground, #f1f5f9)', opacity: 0.8 }}>
            Discover amazing restaurants and get your favorite food delivered
          </p>
          

        </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="rounded-lg p-6 text-center border" style={{
          backgroundColor: 'var(--card, #1e293b)',
          borderColor: 'rgba(148, 163, 184, 0.2)',
          color: 'var(--foreground, #f1f5f9)'
        }}>
          <div className="text-3xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
          <p style={{ opacity: 0.8 }}>Get your food delivered in under 30 minutes</p>
        </div>
        <div className="rounded-lg p-6 text-center border" style={{
          backgroundColor: 'var(--card, #1e293b)',
          borderColor: 'rgba(148, 163, 184, 0.2)',
          color: 'var(--foreground, #f1f5f9)'
        }}>
          <div className="text-3xl mb-4">📍</div>
          <h3 className="text-xl font-semibold mb-2">Distance-Based Search</h3>
          <p style={{ opacity: 0.8 }}>Find restaurants sorted by proximity to you</p>
        </div>
        <div className="rounded-lg p-6 text-center border" style={{
          backgroundColor: 'var(--card, #1e293b)',
          borderColor: 'rgba(148, 163, 184, 0.2)',
          color: 'var(--foreground, #f1f5f9)'
        }}>
          <div className="text-3xl mb-4">⭐</div>
          <h3 className="text-xl font-semibold mb-2">Quality Food</h3>
          <p style={{ opacity: 0.8 }}>Only the best restaurants in your area</p>
        </div>
      </div>

      {/* Restaurants Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: 'var(--foreground, #f1f5f9)' }}>
          Restaurants Near You
        </h2>
        <p className="text-center mb-8" style={{ color: 'var(--foreground, #f1f5f9)', opacity: 0.8 }}>
          {currentCityFilter === 'same' && userCity 
            ? `Showing restaurants in ${userCity}` 
            : 'Showing restaurants from all cities'
          }
          {currentSort === 'admin' && ' - Admin recommended order'}
          {currentSort === 'rating' && ' - Sorted by rating'}
          {currentSort === 'distance' && ' - Sorted by distance'}
          {currentSort === 'price' && ' - Sorted by price'}
        </p>

        {/* Sorting Controls */}
        <RestaurantSorting
          currentSort={currentSort}
          currentOrder={currentOrder}
          currentCityFilter={currentCityFilter}
          userCity={userCity}
          onSortChange={handleSortChange}
        />

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--accent, #f97316)' }}></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <div 
                key={restaurant.id} 
                onClick={() => handleRestaurantClick(restaurant.id)}
                className="rounded-lg overflow-hidden shadow-lg border transition-all duration-300 cursor-pointer hover:transform hover:scale-105 restaurant-card"
                style={{
                  backgroundColor: 'var(--card, #1e293b)',
                  borderColor: 'rgba(148, 163, 184, 0.2)'
                }}
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
                  {restaurant.distanceLoading ? (
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-slate-600 mr-1"></div>
                        Loading...
                      </span>
                    </div>
                  ) : restaurant.distanceText && (
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{
                        backgroundColor: 'var(--accent, #f97316)',
                        color: 'var(--foreground, #f1f5f9)'
                      }}>
                        📍 {restaurant.distanceText}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground, #f1f5f9)' }}>{restaurant.name}</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--foreground, #f1f5f9)', opacity: 0.8 }}>{restaurant.description || 'Delicious food awaits you!'}</p>
          
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-yellow-400">⭐</span>
                      <span className="ml-1" style={{ color: 'var(--foreground, #f1f5f9)' }}>{restaurant.rating.toFixed(1)}</span>
                    </div>
                    <div className="text-sm" style={{ color: 'var(--foreground, #f1f5f9)', opacity: 0.8 }}>
                      {restaurant.city}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm mb-4" style={{ color: 'var(--foreground, #f1f5f9)', opacity: 0.7 }}>
                    <span>🕐 {restaurant.averagePrepTime} min</span>
                    <div className="flex items-center gap-2">
                      {currentSort === 'price' && restaurant.averagePrice && (
                        <span>💰 €{restaurant.averagePrice.toFixed(2)} avg</span>
                      )}
                      {restaurant.distanceLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b mr-1" style={{ borderColor: 'var(--foreground, #f1f5f9)' }}></div>
                          <span>Calculating...</span>
                        </div>
                      ) : restaurant.distance && (
                        <span>📍 {restaurant.distance.toFixed(1)} km</span>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => handleViewMenuClick(e, restaurant.id)}
                    className="w-full font-semibold py-2 px-4 rounded-lg transition duration-300"
                    style={{
                      backgroundColor: 'var(--accent, #f97316)',
                      color: 'var(--foreground, #f1f5f9)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
                    onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                  >
                    View Menu
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && restaurants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: 'var(--foreground, #f1f5f9)', opacity: 0.8 }}>No restaurants found in your area.</p>
          </div>
        )}
      </div>
    </div>
  );
}
