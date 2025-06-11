'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from './components/Header';

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
}

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load restaurants on component mount (default location)
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      
      // First load restaurants without distances to show them immediately
      const quickResponse = await fetch('/api/restaurants');
      if (quickResponse.ok) {
        const quickData = await quickResponse.json();
        const restaurantsWithLoading = quickData.map((restaurant: Restaurant) => ({
          ...restaurant,
          distanceLoading: true,
          distanceText: undefined
        }));
        setRestaurants(restaurantsWithLoading);
        setLoading(false);
      }

      // Then load with distances
      const response = await fetch('/api/restaurants-with-distance');
      if (response.ok) {
      const data = await response.json();
        const restaurantsWithDistance = data.map((restaurant: Restaurant) => ({
          ...restaurant,
          distanceLoading: false
        }));
        setRestaurants(restaurantsWithDistance || []);
      } else {
        // If distance API fails, just remove loading state
        setRestaurants(prev => prev.map(restaurant => ({
          ...restaurant,
          distanceLoading: false,
          distanceText: 'Distance unavailable'
        })));
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setRestaurants(prev => prev.map(restaurant => ({
        ...restaurant,
        distanceLoading: false,
        distanceText: 'Distance unavailable'
      })));
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantClick = (restaurantId: number) => {
    router.push(`/restaurant/${restaurantId}`);
  };

  const handleViewMenuClick = (e: React.MouseEvent, restaurantId: number) => {
    e.stopPropagation(); // Prevent card click when clicking button
    router.push(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome to <span className="text-orange-400">Lieferspatz</span>
            </h1>
          <p className="text-xl text-slate-300 mb-8">
            Discover amazing restaurants and get your favorite food delivered
          </p>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 text-center border border-slate-700">
            <div className="text-3xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-white mb-2">Fast Delivery</h3>
            <p className="text-slate-300">Get your food delivered in under 30 minutes</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 text-center border border-slate-700">
            <div className="text-3xl mb-4">📍</div>
            <h3 className="text-xl font-semibold text-white mb-2">Distance-Based Search</h3>
            <p className="text-slate-300">Find restaurants sorted by proximity to you</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 text-center border border-slate-700">
            <div className="text-3xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold text-white mb-2">Quality Food</h3>
            <p className="text-slate-300">Only the best restaurants in your area</p>
          </div>
        </div>

        {/* Restaurants Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Restaurants Near You
            </h2>
          <p className="text-slate-300 text-center mb-8">
            Sorted by distance - closest restaurants first
            </p>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
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
                    {restaurant.distanceLoading ? (
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-slate-600 mr-1"></div>
                          Loading...
                        </span>
                      </div>
                    ) : restaurant.distanceText && (
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          📍 {restaurant.distanceText}
                        </span>
            </div>
          )}
        </div>

                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-2">{restaurant.name}</h3>
                    <p className="text-slate-300 text-sm mb-4">{restaurant.description || 'Delicious food awaits you!'}</p>
            
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-white ml-1">{restaurant.rating.toFixed(1)}</span>
                      </div>
                      <div className="text-slate-300 text-sm">
                        {restaurant.city}
                </div>
              </div>
              
                    <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                      <span>🕐 {restaurant.averagePrepTime} min</span>
                      {restaurant.distanceLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-slate-400 mr-1"></div>
                          <span>Calculating...</span>
                </div>
                      ) : restaurant.distance && (
                        <span>📍 {restaurant.distance.toFixed(1)} km</span>
                      )}
              </div>
              
                    <button 
                      onClick={(e) => handleViewMenuClick(e, restaurant.id)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
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
              <p className="text-slate-300 text-lg">No restaurants found in your area.</p>
            </div>
          )}
        </div>
      </main>

        {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
            <p>&copy; 2024 Lieferspatz. All rights reserved.</p>
          </div>
        </footer>
    </div>
  );
}
